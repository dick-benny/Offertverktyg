const {PGlite}=await import(process.env.PGLITE_MODULE||'@electric-sql/pglite');
import fs from 'node:fs';import assert from 'node:assert/strict';
const db=new PGlite();
const id=n=>'00000000-0000-0000-0000-'+String(n).padStart(12,'0');
await db.exec(`create role anon;create role authenticated;create schema auth;create table auth.users(id uuid primary key,email text,raw_user_meta_data jsonb default '{}',raw_app_meta_data jsonb default '{}',deleted_at timestamptz,is_anonymous boolean default false,banned_until timestamptz,email_confirmed_at timestamptz,invited_at timestamptz,created_at timestamptz default now(),updated_at timestamptz,last_sign_in_at timestamptz);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema auth to authenticated;
create table cdp_manufacturers(id uuid primary key,name text,active boolean default true,details jsonb default '{}',archived_at timestamptz);
create table cdp_customers(id uuid primary key,name text,billing jsonb default '{}',archived_at timestamptz);
create table cdp_projects(id uuid primary key,name text,details jsonb default '{}',archived_at timestamptz);
create table cdp_articles(id uuid primary key,project_id uuid,name text,details jsonb default '{}',width_cm numeric,length_cm numeric,specification text,archived_at timestamptz);
create table cdp_bom_items(id uuid primary key,article_id uuid,name text,quantity numeric,unit text,notes text,sort_order int,archived_at timestamptz);
`);
for(const table of ['manufacturers','customers','projects','articles','bom_items'])await db.exec(`grant all on cdp_${table} to authenticated;alter table cdp_${table} enable row level security;create policy legacy on cdp_${table} for all to authenticated using(true) with check(true);`);
for(const n of ['006_user_admin_readonly.sql','007_user_initials.sql','008_user_admin_write.sql','009_user_roles.sql','010_external_roles.sql','011_user_entities_manufacturer_portal.sql'])await db.exec(fs.readFileSync(new URL('../supabase/'+n,import.meta.url),'utf8'));
for(let n=1;n<=2;n++)await db.query('insert into cdp_manufacturers(id,name,details) values($1,$2,$3)',[id(n),'Maker '+n,{id:'maker-'+n}]);
await db.query('insert into cdp_customers(id,name) values($1,$2)',[id(3),'Customer']);
await db.query('insert into cdp_projects(id,name,details) values($1,$2,$3)',[id(10),'Hotel',{products:[{id:'rug',name:'Rug',secret:'Do not expose'}],internalComment:'SECRET',targetMargin:45}]);
for(let n=1;n<=2;n++){
 await db.query('insert into cdp_articles(id,project_id,name,details,specification) values($1,$2,$3,$4,$5)',[id(20+n),id(10),'Size '+n,{manufacturerId:'maker-'+n,productId:'rug',quantity:n,pricePerSqm:99,targetPrice:88,internalComment:'SECRET',material:'Wool',cadLinks:[{name:'CAD',url:'https://example.test/a',secret:'SECRET'}]},'Technical specification']);
 await db.query('insert into cdp_bom_items(id,article_id,name,quantity,unit,notes,sort_order) values($1,$2,$3,1,$4,$5,0)',[id(30+n),id(20+n),'Wool '+n,'kg','Manufacturing instruction']);
}
async function account(n,role,entity){return db.query('insert into auth.users(id,email,raw_app_meta_data,raw_user_meta_data) values($1,$2,$3,$4)',[id(n),'test'+n+'@example.test',{projects_role:role,projects_managed:true,...(entity?{projects_entity_id:entity}:{})},{full_name:'User '+n,initials:'US'}]);}
await account(100,'admin');await account(101,'manufacturer',id(1));await account(102,'manufacturer',id(2));await account(103,'customer',id(3));
await assert.rejects(account(104,'manufacturer'));
await account(104,'manufacturer',id(1)); // Several accounts can belong to the same manufacturer.
const as=async n=>db.exec(`reset role;set role authenticated;select set_config('request.jwt.claim.sub','${id(n)}',false);`);
const portal=async()=> (await db.query('select cdp_manufacturer_articles() as result')).rows[0].result;
await as(101);let data=await portal();assert.equal(data.articles.length,1);assert.equal(data.articles[0].article,'Size 1');assert.equal(data.articles[0].bom.components[0].name,'Wool 1');assert.equal(data.articles[0].product,'Rug');assert.ok(!/SECRET|pricePerSqm|targetPrice|targetMargin/.test(JSON.stringify(data)));
for(const t of ['articles','projects','bom_items'])assert.equal((await db.query('select * from cdp_'+t)).rows.length,0);
await assert.rejects(db.query('select * from cdp_user_entities'),e=>e.code==='42501');
await assert.rejects(db.query("select cdp_save_user_profile_v2($1,'Hacked','HH','User 100','US','user','Administratör')",[id(100)]),e=>e.code==='42501');
await assert.rejects(db.query("select cdp_validate_user_entity('manufacturer',$1)",[id(1)]),e=>e.code==='42501');
await as(102);assert.equal((await portal()).articles[0].article,'Size 2');
await as(103);await assert.rejects(portal(),e=>e.code==='42501');
await as(100);assert.equal((await db.query('select cdp_admin_list_users_v3() as users')).rows[0].users.find(u=>u.user_id===id(101)).entity_id,id(1));
const save=async(entity,expected=id(1),role='manufacturer',oldRole='Tillverkare')=>db.query("select cdp_save_user_profile_v3($1,'User 101','US','User 101','US',$2,$3,$4,$5)",[id(101),role,oldRole,entity,expected]);
await assert.rejects(save(null),e=>e.code==='22023');await assert.rejects(save(id(3)),e=>e.code==='22023');await assert.rejects(save(id(2),id(2)),e=>e.code==='40001');await save(id(2));
await as(101);assert.equal((await portal()).articles[0].article,'Size 2');
await db.exec('reset role');await db.query("update cdp_articles set details=jsonb_set(details,'{manufacturerId}','\"maker-1\"') where id=$1",[id(22)]);await as(101);assert.equal((await portal()).articles.length,0);
await as(100);await save(id(3),id(2),'customer');await as(101);await assert.rejects(portal(),e=>e.code==='42501');
await as(100);await save(id(1),id(3),'manufacturer','Kund');await db.exec('reset role');await db.query('update cdp_manufacturers set active=false where id=$1',[id(1)]);await as(101);assert.equal((await portal()).manufacturer,null);
await db.exec('reset role');await db.query('update auth.users set banned_until=now()+interval \'1 day\' where id=$1',[id(102)]);await as(102);await assert.rejects(portal(),e=>e.code==='42501');
await db.exec('reset role');await db.query('insert into auth.users(id,raw_app_meta_data) values($1,$2)',[id(105),{projects_role:'manufacturer'}]);await as(105);assert.equal((await portal()).manufacturer,null);await as(100);await assert.rejects(db.query("select cdp_save_user_profile_v3($1,'User 100','US','User 100','US','manufacturer','Administratör',$2,null)",[id(100),id(2)]),e=>e.code==='22023');
await db.close();console.log('PASS migrations, atomic company links, creation trigger, stale links, external isolation, BOM allowlist, reassignment, inactive manufacturer, customer and banned-user denial');
