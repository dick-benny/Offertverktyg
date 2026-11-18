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
 await page.route('**/__test_rpc',async route=>{const {name,args}=route.request().postDataJSON();await route.fulfill({json:await db.rpc(name,args)});});
 await page.route('**/__test_auth',async route=>{const {action}=route.request().postDataJSON();if(action==='login')signedIn=true;if(action==='logout')signedIn=false;const user={id:'test-user',email:'qa@example.test'};await route.fulfill({json:action==='user'?{data:{user:signedIn?user:null}}:{data:{session:signedIn?{user}:null}}});});

 try{
 await page.goto((process.env.TEST_URL||'http://127.0.0.1:5188'));await page.locator('#login-form').waitFor({state:'visible'});assert.equal(await page.locator('.app-shell').isVisible(),false);await page.locator('#login-form [name="email"]').fill('qa@example.test');await page.locator('#login-form [name="password"]').fill('test-only');await page.locator('#login-form button').click();await page.waitForFunction(()=>window.CDPApp?.ready);console.log('PASS login gates cloud state and app scripts');






 const users=[{user_id:'test-user',name:'',email:'qa@example.test',initials:'QA',role:'Administratör',can_edit_initials:true}];
 await page.route('**/__test_rpc',async route=>{const {name,args}=route.request().postDataJSON();if(name==='cdp_admin_list_users_v2')return route.fulfill({json:{data:users}});if(name==='cdp_user_admin_enabled')return route.fulfill({json:{data:true}});if(name==='cdp_save_user_profile_v2'){const u=users.find(u=>u.user_id===args.target_user_id);u.name=args.new_name;u.initials=args.new_initials;u.role=args.new_role==='admin'?'Administratör':'Medarbetare';return route.fulfill({json:{data:{name:u.name,initials:u.initials,role:u.role}}});}return route.fallback();});
 await page.route('**/__test_function',async route=>{const v=route.request().postDataJSON();assert.equal(v.role,'user');assert.equal(v.password,'testing-password');users.push({user_id:'created',name:v.name,initials:v.initials,email:v.email,role:'Medarbetare',can_edit_initials:true});await route.fulfill({json:{data:{user_id:'created'}}});});
 await page.locator('#accountSettings summary').click();await page.locator('[data-user-admin]').click();const profile=page.locator('[data-user-profile]').first();await page.locator('select[form=user-profile-0]').selectOption('user');await page.locator('input[form=user-profile-0]').fill('QA Admin');await profile.locator('[name=initials]').fill('QAD');await profile.locator('button').click();await page.waitForFunction(()=>document.querySelector('[data-profile-status]').textContent==='Saved');assert.equal(users[0].name,'QA Admin');assert.equal(users[0].initials,'QAD');assert.equal(users[0].role,'Medarbetare');await page.locator('[data-add-internal-user]').click();const form=page.locator('#addInternalUserForm');await form.locator('[name=name]').fill('New User');assert.equal(await form.locator('[name=initials]').inputValue(),'NU');await form.locator('[name=email]').fill('new@example.test');await form.locator('[name=password]').fill('testing-password');await form.locator('button').click();await page.locator('[data-user-profile]').nth(1).waitFor();assert.equal(users.length,2);assert.equal(await page.locator('input[type=password]:visible').count(),0);assert.deepEqual(errors,[]);console.log('PASS editable name/initials, suggested initials, add User, directory refresh and cleared password form');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
