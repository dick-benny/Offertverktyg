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
 await page.route('**/__test_rpc',async route=>{const {name,args}=route.request().postDataJSON();await route.fulfill({json:name==='cdp_session_role'?{data:'internal'}:await db.rpc(name,args)});});
 await page.route('**/__test_auth',async route=>{const {action}=route.request().postDataJSON();if(action==='login')signedIn=true;if(action==='logout')signedIn=false;const user={id:'test-user',email:'qa@example.test'};await route.fulfill({json:action==='user'?{data:{user:signedIn?user:null}}:{data:{session:signedIn?{user}:null}}});});

 try{
 await page.goto((process.env.TEST_URL||'http://127.0.0.1:5188'));await page.locator('#login-form').waitFor({state:'visible'});assert.equal(await page.locator('.app-shell').isVisible(),false);await page.locator('#login-form [name="email"]').fill('qa@example.test');await page.locator('#login-form [name="password"]').fill('test-only');await page.locator('#login-form button').click();await page.waitForFunction(()=>window.CDPApp?.ready);console.log('PASS login gates cloud state and app scripts');





 const id=await page.evaluate(async()=>{const s=CDPRemote.adapter.state,S=CDPStructure,p=S.createProject(s,{name:'Customer approval test',projectType:'simple',phaseMode:'single'});await CDPRemote.adapter.save();return p.id;});
 await page.route('**/__test_rpc',async route=>{const {name}=route.request().postDataJSON();if(name==='cdp_internal_bom_approvals')return route.fulfill({json:{data:[{id:'rug',name:'Wool rug',version:2,approval:null,history:[{version:1,name:'Anna Customer',at:'2026-11-18T10:00:00Z',snapshot:{name:'Wool rug',material:'Wool',components:[],links:[]}}]}]}});return route.fallback();});
 await page.reload();await page.waitForFunction(()=>window.CDPApp?.ready);await page.locator('[data-view=projects]').click();await page.locator('[data-project-id="'+id+'"]').first().click();await page.locator('.customer-approvals > summary').click();await page.getByText('Awaiting approval',{exact:true}).waitFor();await page.locator('.customer-approvals td details summary').click();await page.locator('[data-approval-snapshot]').click();await page.getByRole('heading',{name:'Approved BOM · v1'}).waitFor();await page.locator('#modal .modal-close').click();
 await page.locator('[data-project-options]').click();await page.locator('[name=customerPortalArchived]').check();await page.locator('#projectOptionsForm button').click();await page.getByRole('heading',{name:'Simple · One phase · Archived in customer portal'}).waitFor();let s=await state();assert.equal(s.projects.find(p=>p.id===id).customerPortalArchived,true);
 await page.reload();await page.waitForFunction(()=>window.CDPApp?.ready);s=await state();assert.equal(s.projects.find(p=>p.id===id).customerPortalArchived,true);await page.locator('[data-view=projects]').click();await page.locator('[data-project-id="'+id+'"]').first().click();await page.locator('[data-project-options]').click();await page.locator('[name=customerPortalArchived]').uncheck();await page.locator('#projectOptionsForm button').click();await page.getByRole('heading',{name:'Simple · One phase',exact:true}).waitFor();s=await state();assert.equal(s.projects.find(p=>p.id===id).customerPortalArchived,false);assert.deepEqual(errors,[]);console.log('PASS Projects approval history/snapshot, portal archiving, reload persistence and restore');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
