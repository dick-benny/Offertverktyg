const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict'),fs=require('fs');
const output=require('node:path').join(__dirname,'../test-results');fs.mkdirSync(output,{recursive:true});
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.BROWSER_CHANNEL?{channel:process.env.BROWSER_CHANNEL}:{})}),page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[],requests=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>requests.push(r.url()));page.on('dialog',d=>d.accept());
 const state=async()=>{await page.locator('#cloud-save').waitFor({state:'hidden'});return page.evaluate(()=>JSON.parse(JSON.stringify(window.CDPRemote.adapter.state)));};
 const fill=async(form,values)=>{await state();for(const [k,v]of Object.entries(values))await page.locator(`${form} [name="${k}"]`).fill(String(v));};
 const submit=async form=>{await page.locator(form+' button').filter({hasText:/^(Save manufacturer|Save lead|Save article|Save phase|Save BOM|Create RFQ specification|Save response|Save sample|Save \/ update PO reference)$/}).click();await page.waitForFunction(()=>!window.CDPRemote.adapter.busy||window.CDPRemote.adapter.failure);};
 const expand=async locator=>{if(await locator.getAttribute('aria-expanded')!=='true')await locator.click();};
 const tab=async key=>page.locator(`[data-project-tab="${key}"]`).first().click();

 const db=require('./fake-server.cjs')();let signedIn=false;
 await page.route('**/vendor/supabase.js*',route=>route.fulfill({contentType:'text/javascript',body:`window.supabase={createClient(){const request=(path,data)=>fetch(path,{method:'POST',body:JSON.stringify(data)}).then(r=>r.json());return {auth:{onAuthStateChange(){},getSession:()=>request('/__test_auth',{action:'session'}),getUser:()=>request('/__test_auth',{action:'user'}),signInWithPassword:()=>request('/__test_auth',{action:'login'}),signOut:()=>request('/__test_auth',{action:'logout'})},functions:{invoke:(name,{body})=>request('/__test_function',body)},rpc:(name,args)=>request('/__test_rpc',{name,args})};}};`}));
 await page.route('**/__test_rpc',async route=>{const {name,args}=route.request().postDataJSON();await route.fulfill({json:name==='cdp_session_role'?{data:'internal'}:await db.rpc(name,args)});});
 await page.route('**/__test_auth',async route=>{const {action}=route.request().postDataJSON();if(action==='login')signedIn=true;if(action==='logout')signedIn=false;const user={id:'test-user',email:'qa@example.test'};await route.fulfill({json:action==='user'?{data:{user:signedIn?user:null}}:{data:{session:signedIn?{user}:null}}});});

 try{
 await page.goto((process.env.TEST_URL||'http://127.0.0.1:5188'));await page.locator('#login-form').waitFor({state:'visible'});assert.equal(await page.locator('.app-shell').isVisible(),false);await page.locator('#login-form [name="email"]').fill('qa@example.test');await page.locator('#login-form [name="password"]').fill('test-only');await page.locator('#login-form button').click();await page.waitForFunction(()=>window.CDPApp?.ready);console.log('PASS login gates cloud state and app scripts');






 const ids=await page.evaluate(async()=>{const s=CDPRemote.adapter.state;s.manufacturers.push({id:'maker',name:'Maker One',active:true});s.customers.push({id:crypto.randomUUID(),name:'Customer One',billing:{},delivery:{},active:true});await CDPRemote.adapter.save();return {maker:s.manufacturers[0]._dbId,customer:s.customers[0].id};});
 const users=[{user_id:'maker-user',name:'Test Maker',email:'maker@example.test',initials:'TM',role:'Tillverkare',entity_id:ids.maker,account_status:'Active'},{user_id:'customer-user',name:'Test Customer',email:'customer@example.test',initials:'TC',role:'Kund',entity_id:ids.customer,account_status:'Active'}];let allowed=true;
 await page.route('**/__test_rpc',async route=>{const {name,args}=route.request().postDataJSON();if(name==='cdp_admin_list_users_v3')return route.fulfill({json:{data:users}});if(name==='cdp_company_users')return route.fulfill({json:{data:users.filter(u=>u.entity_id===args.company_id)}});if(name==='cdp_user_admin_enabled')return route.fulfill({json:{data:allowed}});if(name==='cdp_save_user_profile_v3'){const u=users.find(u=>u.user_id===args.target_user_id);Object.assign(u,{name:args.new_name,initials:args.new_initials,role:args.new_role==='customer'?'Kund':'Tillverkare',entity_id:args.new_entity_id});return route.fulfill({json:{data:u}});}return route.fallback();});
 await page.route('**/__test_function',async route=>{const v=route.request().postDataJSON();users.push({user_id:'new-'+users.length,name:v.name,email:v.email,initials:v.initials,role:v.role==='customer'?'Kund':'Tillverkare',entity_id:v.entity_id,account_status:'Active'});return route.fulfill({json:{data:{user_id:'new'}}});});
 await page.reload();await page.waitForFunction(()=>window.CDPApp?.ready);
 for(const role of ['manufacturer','customer']){
  if(role==='manufacturer'){await page.locator('[data-view=manufacturers]').click();await page.locator('[data-edit-manufacturer=maker]').click();}else{await page.locator('[data-view=customers]').click();await page.locator('[data-customer-edit="'+ids.customer+'"]').click();}
  const card=page.locator(role==='manufacturer'?'#manufacturerForm':'#customerRegisterForm');await card.locator('[name=name]').fill('Unsaved card draft');
  const section=page.locator('[data-company-users]');await section.locator('[data-company-user-edit]').waitFor();assert.equal(await section.locator('tbody tr').count(),1);
  await section.locator('[data-company-user-edit]').click();await page.locator('input[form=user-profile-0]').fill('Updated '+role);await page.locator('[data-user-profile] button').click();await section.getByText('Updated '+role,{exact:true}).waitFor();assert.equal(await card.locator('[name=name]').inputValue(),'Unsaved card draft');
  await section.locator('[data-company-user-add]').click();const f=page.locator('#addInternalUserForm');assert.equal(await f.locator('[name=role]').inputValue(),role);assert.equal(await f.locator('[name=entity_id]').inputValue(),ids[role==='manufacturer'?'maker':'customer']);await f.locator('[name=name]').fill('Added '+role);await f.locator('[name=email]').fill(role+'-new@example.test');await f.locator('[name=password]').fill('testing-password');await f.locator('button[type=submit]').click();await section.getByText('Added '+role,{exact:true}).waitFor();assert.equal(await section.locator('tbody tr').count(),2);assert.equal(await card.locator('[name=name]').inputValue(),'Unsaved card draft');
  await page.screenshot({path:output+'/company-users-'+role+'.png'});
  allowed=false;await section.locator('[data-company-users-refresh]').click();await page.waitForFunction(()=>!document.querySelector('[data-company-user-add]'));assert.equal(await section.locator('[data-company-user-edit]').count(),0);assert.equal(await section.locator('tbody tr').count(),2);allowed=true;
  await page.locator('#modal .modal-close').click();
 }
 assert.deepEqual(errors,[]);console.log('PASS both company cards: scoped list, Edit, Add with defaults, refreshed return, unsaved draft retention, readonly access');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
