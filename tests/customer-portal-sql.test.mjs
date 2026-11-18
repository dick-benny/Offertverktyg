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

await db.exec('alter table cdp_projects add column customer_id uuid references cdp_customers(id)');
const product={id:'rug',name:'Rug',material:'Wool',specification:'Customer specification',targetPrice:99,internalComment:'SECRET',bom:[{name:'Wool yarn',quantity:2,unit:'kg',notes:'Natural',cost:123}],cadLinks:[{name:'CAD',url:'https://example.test/cad',private:'SECRET'}]};
await db.query('update cdp_projects set customer_id=$2,details=$3 where id=$1',[id(10),id(3),{products:[product],internalComment:'SECRET'}]);
await db.query('insert into cdp_customers(id,name) values($1,$2)',[id(4),'Other Customer']);
await db.query('insert into cdp_projects(id,name,customer_id,details) values($1,$2,$3,$4)',[id(11),'Other Hotel',id(4),{products:[product]}]);
await account(100,'admin');await account(103,'customer',id(3));await account(104,'customer',id(4));await account(101,'manufacturer',id(1));
await db.exec(fs.readFileSync(new URL('../supabase/015_customer_portal_bom_approvals.sql',import.meta.url),'utf8'));
const as=async n=>db.exec(`reset role;set role authenticated;select set_config('request.jwt.claim.sub','${id(n)}',false);`);
const portal=async()=>(await db.query('select cdp_customer_portal() as result')).rows[0].result;
const approve=async(version,pid=id(10))=>(await db.query("select cdp_approve_customer_bom($1,'rug',$2) as result",[pid,version])).rows[0].result;
await as(103);let data=await portal();assert.equal(data.projects.length,1);assert.equal(data.projects[0].name,'Hotel');assert.equal(data.projects[0].products.length,1);assert.equal(data.projects[0].products[0].version,1);assert.equal(data.projects[0].products[0].bom.components[0].name,'Wool yarn');assert.ok(!/SECRET|targetPrice|cost|internalComment/.test(JSON.stringify(data)));
await assert.rejects(approve(1,id(11)),e=>e.code==='42501');await assert.rejects(db.query('select * from cdp_customer_bom_versions'),e=>e.code==='42501');await assert.rejects(db.query('select * from cdp_customer_bom_approvals'),e=>e.code==='42501');assert.equal((await db.query('select * from cdp_projects')).rows.length,0);
let approved=await approve(1);assert.equal(approved.name,'User 103');assert.deepEqual(await approve(1),approved);
await db.exec('reset role');let stored=(await db.query('select * from cdp_customer_bom_approvals')).rows;assert.equal(stored.length,1);assert.equal(stored[0].snapshot.material,'Wool');
async function updateProduct(p){await db.exec('reset role');await db.query("update cdp_projects set details=jsonb_set(details,'{products}',$2) where id=$1",[id(10),[p]]);await as(103);}
await updateProduct({...product,material:'Silk'});data=await portal();assert.equal(data.projects[0].products[0].version,2);assert.equal(data.projects[0].products[0].approval,null);assert.equal(data.projects[0].products[0].history.length,1);await assert.rejects(approve(1),e=>e.code==='40001');await approve(2);
await updateProduct({...product,material:'Silk',targetPrice:555});assert.equal((await portal()).projects[0].products[0].version,2);assert.ok((await portal()).projects[0].products[0].approval);
await updateProduct(product);assert.equal((await portal()).projects[0].products[0].version,3);assert.equal((await portal()).projects[0].products[0].approval,null);
await db.exec('reset role');await db.query("update cdp_projects set details=jsonb_set(details,'{customerPortalArchived}','true') where id=$1",[id(10)]);await as(103);assert.equal((await portal()).projects[0].archived,true);await assert.rejects(approve(3),e=>e.code==='22023');
await db.exec('reset role');await db.query("update cdp_projects set details=jsonb_set(details,'{customerPortalArchived}','false') where id=$1",[id(10)]);await as(103);await approve(3);
await as(104);assert.equal((await portal()).projects[0].name,'Other Hotel');await assert.rejects(approve(3),e=>e.code==='42501');
await as(101);await assert.rejects(portal(),e=>e.code==='42501');await assert.rejects(approve(3),e=>e.code==='42501');await assert.rejects(db.query('select cdp_internal_bom_approvals($1)',[id(10)]),e=>e.code==='42501');
await as(100);await assert.rejects(portal(),e=>e.code==='42501');let history=(await db.query('select cdp_internal_bom_approvals($1) as result',[id(10)])).rows[0].result;assert.equal(history[0].history.length,3);assert.equal(history[0].history.find(h=>h.version===1).snapshot.material,'Wool');assert.equal(history[0].history.find(h=>h.version===2).snapshot.material,'Silk');
await db.exec('reset role');await db.query("update cdp_projects set details=jsonb_set(details,'{products}','[]') where id=$1",[id(10)]);await as(103);assert.equal((await portal()).projects[0].products.length,0);await assert.rejects(approve(3),e=>e.code==='42501');await updateProduct(product);assert.equal((await portal()).projects[0].products[0].version,4);
await db.exec('reset role');await db.query('update cdp_projects set customer_id=$2 where id=$1',[id(10),id(4)]);await as(104);assert.equal((await portal()).projects.find(p=>p.id===id(10)).products[0].approval,null);await as(103);assert.equal((await portal()).projects.length,0);await assert.rejects(approve(4),e=>e.code==='42501');
await db.exec('reset role');await db.query('update cdp_projects set archived_at=now() where id=$1',[id(11)]);await as(104);assert.ok(!(await portal()).projects.some(p=>p.id===id(11)));
await db.exec('reset role');await db.query('delete from auth.users where id=$1',[id(103)]);assert.equal((await db.query('select * from cdp_customer_bom_approvals')).rows.length,3);assert.equal((await db.query('select * from cdp_customer_bom_approvals')).rows[0].approver_name,'User 103');
await db.close();console.log('PASS customer scoping, product deduplication, whitelist, immutable approvals, version changes/reverts, stale rejection, archive read-only, customer reassignment and history after account deletion');
