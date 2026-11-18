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
 const users=[{user_id:'external',name:'Test Maker',email:'maker@example.test',initials:'TM',role:'Tillverkare',entity_id:null,can_edit_initials:true}];let created;
 await page.route('**/__test_rpc',async route=>{const {name,args}=route.request().postDataJSON();if(name==='cdp_admin_list_users_v3')return route.fulfill({json:{data:users}});if(name==='cdp_user_admin_enabled')return route.fulfill({json:{data:true}});if(name==='cdp_save_user_profile_v3'){assert.equal(args.expected_entity_id,users[0].entity_id);Object.assign(users[0],{name:args.new_name,initials:args.new_initials,role:args.new_role==='customer'?'Kund':'Tillverkare',entity_id:args.new_entity_id});return route.fulfill({json:{data:users[0]}});}return route.fallback();});
 await page.route('**/__test_function',async route=>{created=route.request().postDataJSON();return route.fulfill({json:{data:{user_id:'new'}}});});
 await page.locator('#accountSettings summary').click();await page.locator('[data-user-admin]').click();
 const entity=page.locator('select[name=entity_id][form=user-profile-0]');await entity.selectOption(ids.maker);await page.locator('[data-user-profile] button').click();await page.waitForFunction(()=>document.querySelector('[data-profile-status]').textContent==='Saved');assert.equal(users[0].entity_id,ids.maker);
 await page.locator('select[name=role][form=user-profile-0]').selectOption('customer');assert.equal(await entity.inputValue(),'');await entity.selectOption(ids.customer);await page.locator('[data-user-profile] button').click();await page.waitForFunction(()=>document.querySelector('[data-profile-status]').textContent==='Saved');assert.equal(users[0].entity_id,ids.customer);
 await page.screenshot({path:output+'/user-company-links.png'});
 await page.locator('[data-add-internal-user]').click();const form=page.locator('#addInternalUserForm');await form.locator('[name=name]').fill('New Maker');await form.locator('[name=email]').fill('new@example.test');await form.locator('[name=password]').fill('testing-password');await form.locator('[name=role]').selectOption('manufacturer');assert.equal(await form.locator('[name=entity_id]').getAttribute('required'),'');await form.locator('[name=entity_id]').selectOption(ids.maker);await form.locator('button').click();await page.locator('[data-user-profile]').waitFor();assert.equal(created.role,'manufacturer');assert.equal(created.entity_id,ids.maker);assert.equal(created.initials,'NM');assert.deepEqual(errors,[]);console.log('PASS company dropdowns, atomic profile payload, role switch, and new manufacturer account company link');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
