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

await db.exec(`create table cdp_phases(id uuid primary key,project_id uuid,name text,sort_order int,details jsonb default '{}',archived_at timestamptz);create table cdp_phase_items(id uuid primary key,project_id uuid,phase_id uuid,article_id uuid,quantity numeric,archived_at timestamptz);`);
await db.query('update cdp_projects set details=$2 where id=$1',[id(10),{products:[product,{...product,id:'rug2',name:'Second rug'}],phaseMode:'multiple',requestedDeliveryWeek:'2027-W10'}]);
await db.query("update cdp_articles set details=jsonb_set(details,'{quantity}','3') where id=$1",[id(21)]);
await db.query('insert into cdp_articles(id,project_id,name,details) values($1,$2,$3,$4)',[id(23),id(10),'200x300',{productId:'rug2',manufacturerId:'maker-1',quantity:1}]);
await db.query('insert into cdp_phases(id,project_id,name,sort_order,details) values($1,$2,$3,1,$4)',[id(40),id(10),'Phase 1',{requestedDeliveryWeek:'2027-W10'}]);
await db.query('insert into cdp_phase_items(id,project_id,phase_id,article_id,quantity) values($1,$2,$3,$4,1)',[id(41),id(10),id(40),id(21)]);
await account(102,'manufacturer',id(2));
await db.exec(fs.readFileSync(new URL('../supabase/016_manufacturer_portal_responses.sql',import.meta.url),'utf8'));
const as=async n=>db.exec(`reset role;set role authenticated;select set_config('request.jwt.claim.sub','${id(n)}',false);`);
const get=async()=>(await db.query('select cdp_manufacturer_portal_v2() as result')).rows[0].result.projects[0];
const act=async(action,product='rug',price=null,version=null,revision=null)=>{const p=await get();return db.query('select cdp_save_manufacturer_response($1,$2,$3,$4,$5,$6)',[id(10),product,action,revision||p.revision,price,version]);};
await as(101);let p=await get();assert.equal(p.products.length,2);let v=p.products.find(v=>v.id==='rug');assert.equal(v.articles.length,1);assert.equal(v.articles[0].id,id(21));assert.equal(v.phases[0].articles[0].quantity,1);assert.equal(v.unassigned[0].quantity,2);assert.equal(v.target,null);assert.ok(!JSON.stringify(p).includes('SECRET'));await assert.rejects(act('confirm'),e=>e.code==='22023');
const oldRevision=p.revision;await act('price','rug',25);await assert.rejects(act('price','rug',26,null,oldRevision),e=>e.code==='40001');await act('bom','rug',null,v.version);await assert.rejects(act('confirm'),e=>e.code==='22023');await act('price','rug2',0);await act('bom','rug2',null,1);await act('confirm');assert.ok((await get()).confirmation);await act('confirm');
await db.exec('reset role');assert.equal((await db.query('select * from cdp_manufacturer_response_history where event=$1',['confirm'])).rows.length,1);assert.equal((await db.query('select details from cdp_articles where id=$1',[id(21)])).rows[0].details.pricePerSqm,99);
await db.query("update cdp_articles set details=jsonb_set(details,'{quantity}','4') where id=$1",[id(21)]);await db.query("update cdp_articles set details=jsonb_set(details,'{quantity}','3') where id=$1",[id(21)]);await as(101);assert.equal((await get()).confirmation,null);await act('confirm');
await db.exec('reset role');await db.query("update cdp_phases set details=jsonb_set(details,'{requestedDeliveryWeek}',to_jsonb('2027-W11'::text)) where id=$1",[id(40)]);await as(101);assert.equal((await get()).confirmation,null);assert.equal((await get()).products[0].phases[0].week,'2027-W11');
await as(100);await db.query('select cdp_set_manufacturer_target($1,$2,20,null)',[id(10),'rug']);await assert.rejects(db.query('select cdp_set_manufacturer_target($1,$2,22,null)',[id(10),'rug']),e=>e.code==='40001');await as(101);assert.equal((await get()).products.find(v=>v.id==='rug').target,20);await assert.rejects(db.query('select cdp_set_manufacturer_target($1,$2,22,20)',[id(10),'rug']),e=>e.code==='42501');
await db.exec('reset role');await db.query("update cdp_projects set details=jsonb_set(details,'{products,0,material}',$2) where id=$1",[id(10),'"Silk"']);await as(101);v=(await get()).products.find(v=>v.id==='rug');assert.equal(v.version,2);assert.equal(v.bom_approval,null);await assert.rejects(act('confirm'),e=>e.code==='22023');await assert.rejects(act('bom','rug',null,1),e=>e.code==='40001');await act('bom','rug',null,2);await act('confirm');
await db.exec('reset role');await db.query("update cdp_projects set details=jsonb_set(details,'{manufacturerPortalArchived}','true') where id=$1",[id(10)]);await as(101);assert.equal((await get()).archived,true);await assert.rejects(act('price','rug',33),e=>e.code==='22023');
await as(102);p=await get();assert.equal(p.products.length,1);assert.equal(p.products[0].price,null);assert.equal(p.products[0].articles[0].id,id(22));
await as(103);await assert.rejects(get(),e=>e.code==='42501');await assert.rejects(db.query('select cdp_internal_manufacturer_responses($1)',[id(10)]),e=>e.code==='42501');
await as(101);await assert.rejects(db.query('select * from cdp_manufacturer_offers'),e=>e.code==='42501');
await as(100);assert.equal((await db.query('select cdp_internal_manufacturer_responses($1) as data',[id(10)])).rows[0].data.length,2);
await db.close();console.log('PASS supplier isolation, phase quantities/remainders, shared targets, price and BOM completion, stale writes, immutable costing, confirmation invalidation on changes/reverts, archive and authorization');
