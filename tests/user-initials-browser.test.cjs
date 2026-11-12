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
 await page.route('**/vendor/supabase.js*',route=>route.fulfill({contentType:'text/javascript',body:`window.supabase={createClient(){const request=(path,data)=>fetch(path,{method:'POST',body:JSON.stringify(data)}).then(r=>r.json());return {auth:{onAuthStateChange(){},getSession:()=>request('/__test_auth',{action:'session'}),getUser:()=>request('/__test_auth',{action:'user'}),signInWithPassword:()=>request('/__test_auth',{action:'login'}),signOut:()=>request('/__test_auth',{action:'logout'})},rpc:(name,args)=>request('/__test_rpc',{name,args})};}};`}));
 await page.route('**/__test_rpc',async route=>{const {name,args}=route.request().postDataJSON();await route.fulfill({json:await db.rpc(name,args)});});
 await page.route('**/__test_auth',async route=>{const {action}=route.request().postDataJSON();if(action==='login')signedIn=true;if(action==='logout')signedIn=false;const user={id:'test-user',email:'qa@example.test'};await route.fulfill({json:action==='user'?{data:{user:signedIn?user:null}}:{data:{session:signedIn?{user}:null}}});});


 const users=[{user_id:'test-user',name:'Dick Eriksson',email:'qa@example.test',initials:'DE',role:'Administratör',account_status:'Aktiv',can_edit_initials:true},{user_id:'second',name:'Anna Svensson',email:'anna@example.test',initials:'AS',role:'Administratör',account_status:'Aktiv',can_edit_initials:true},{user_id:'third',name:'Bo Lund',email:'bo@example.test',initials:'BL',role:'Medarbetare',account_status:'Aktiv',can_edit_initials:true},{user_id:'fourth',name:'Åsa Öberg',email:'asa@example.test',initials:'ÅÖ',role:'Administratör',account_status:'Inbjuden',can_edit_initials:true}];
 let saveMode='ok',readOnly=false;const writes=[];
 await page.route('**/__test_rpc',async route=>{const {name,args}=route.request().postDataJSON();let result;
 if(name==='cdp_list_user_initials')result={data:users.slice(0,1).map(u=>({id:u.user_id,email:u.email,name:u.name,initials:u.initials}))};
 else if(name==='cdp_admin_list_users_v2')result={data:users.map(u=>({...u,can_edit_initials:!readOnly}))};
 else if(name==='cdp_save_user_initials'){writes.push(args);const user=users.find(u=>u.user_id===args.target_user_id);if(saveMode==='denied')result={error:{code:'42501',message:'Denied'}};else if(saveMode==='conflict'||user.initials!==args.expected_initials)result={error:{code:'40001',message:'Changed elsewhere'}};else if(saveMode==='network')result={error:{message:'Network failed'}};else{user.initials=args.new_initials;result={data:user.initials};}}
 else return route.fallback();await route.fulfill({json:result});});
 try{
 await page.goto((process.env.TEST_URL||'http://127.0.0.1:5188'));await page.locator('#login-form').waitFor({state:'visible'});assert.equal(await page.locator('.app-shell').isVisible(),false);await page.locator('#login-form [name="email"]').fill('qa@example.test');await page.locator('#login-form [name="password"]').fill('test-only');await page.locator('#login-form button').click();await page.waitForFunction(()=>window.CDPApp?.ready);console.log('PASS login gates cloud state and app scripts');




 assert.equal(await page.locator('#profileAvatar').innerText(),'DE');
 await page.evaluate(async()=>{const s=window.CDPRemote.adapter.state;window.CDPStructure.createProject(s,{name:'Owned by email',owner:'qa@example.test'});window.CDPStructure.createProject(s,{name:'Legacy owner',owner:'DE'});await window.CDPRemote.adapter.save();});
 await page.reload();await page.waitForFunction(()=>window.CDPApp?.ready);await page.locator('[data-view=projects]').click();assert.deepEqual(await page.locator('.owner-dot').allTextContents(),['DE','DE']);
 const open=async()=>{await page.locator('#accountSettings summary').click();await page.locator('[data-user-admin]').click();await page.locator('.user-admin-table').waitFor();};await open();assert.equal(await page.locator('[data-user-initials-form]').count(),4);
 const own=page.locator('[data-user-initials-form="test-user"]');await own.locator('input').fill(' dex ');await own.locator('button').click();await own.locator('[data-initials-status]').filter({hasText:'Saved'}).waitFor();assert.equal(await own.locator('input').inputValue(),'DEX');assert.equal(await page.locator('#profileAvatar').innerText(),'DEX');assert.deepEqual(await page.locator('.owner-dot').allTextContents(),['DEX','DEX']);assert.equal(writes[0].expected_initials,'DE');
 const other=page.locator('[data-user-initials-form="second"]');await other.locator('input').fill('A B');await other.locator('button').click();await other.locator('[data-initials-status]').filter({hasText:'letters or digits'}).waitFor();assert.equal(writes.length,1);
 for(const mode of ['network','denied','conflict']){saveMode=mode;await other.locator('input').fill('AN');await other.locator('button').click();await page.waitForFunction(()=>!document.querySelector('[data-user-initials-form="second"] button').disabled);assert.notEqual(await other.locator('[data-initials-status]').innerText(),'Saved');assert.equal(users[1].initials,'AS');assert.equal(await other.locator('input').inputValue(),'AN');}
 saveMode='ok';await other.locator('button').click();await other.locator('[data-initials-status]').filter({hasText:'Saved'}).waitFor();assert.equal(users[1].initials,'AN');await page.screenshot({path:output+'/user-initials.png',fullPage:true});
 await page.locator('[data-user-admin-search]').fill('dex');assert.equal(await page.locator('[data-user-search]:visible').count(),1);await page.locator('#modal .modal-close').click();await page.locator('[data-v6-new-project]').click();await page.locator('#v6NewProject').waitFor();assert.equal(await page.locator('#v6NewProject [name=owner] option').count(),4);assert.equal(await page.locator('#v6NewProject [name=value],#v6NewProject [name=probability]').count(),0);await page.screenshot({path:output+'/new-project-all-users.png',fullPage:true});assert.ok((await page.locator('#v6NewProject [name=owner] option').allTextContents()).includes('AN · Anna Svensson'));assert.ok((await page.locator('#v6NewProject [name=owner] option').evaluateAll(options=>options.map(o=>o.value))).includes('anna@example.test'));
 await page.reload();await page.waitForFunction(()=>window.CDPApp?.ready);assert.equal(await page.locator('#profileAvatar').innerText(),'DEX');await open();assert.equal(await own.locator('input').inputValue(),'DEX');assert.equal(await other.locator('input').inputValue(),'AN');
 await page.setViewportSize({width:390,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await page.screenshot({path:output+'/user-initials-mobile.png',fullPage:true});
 readOnly=true;await page.locator('[data-user-admin-refresh]').click();await page.locator('[data-user-initials-form] input:disabled').first().waitFor();assert.equal(await page.locator('[data-user-initials-form] input:disabled').count(),4);assert.deepEqual(errors,[]);console.log('PASS four editable users, own avatar, email/legacy owner display, stable owner identifiers, validation, denied/conflict/network errors, retry, search, reload and mobile');
 }catch(e){console.error(e);console.error((await page.locator('body').innerText()).slice(-3500));process.exitCode=1;}finally{await browser.close();}
})();
