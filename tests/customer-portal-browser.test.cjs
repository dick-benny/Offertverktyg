const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict'),fs=require('fs');
const output=require('node:path').join(__dirname,'../test-results');fs.mkdirSync(output,{recursive:true});
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.BROWSER_CHANNEL?{channel:process.env.BROWSER_CHANNEL}:{})}),page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[],requests=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>requests.push(r.url()));let acceptApproval=false;page.on('dialog',d=>acceptApproval?d.accept():d.dismiss());
 const state=async()=>{await page.locator('#cloud-save').waitFor({state:'hidden'});return page.evaluate(()=>JSON.parse(JSON.stringify(window.CDPRemote.adapter.state)));};
 const fill=async(form,values)=>{await state();for(const [k,v]of Object.entries(values))await page.locator(`${form} [name="${k}"]`).fill(String(v));};
 const submit=async form=>{await page.locator(form+' button').filter({hasText:/^(Save manufacturer|Save lead|Save article|Save phase|Save BOM|Create RFQ specification|Save response|Save sample|Save \/ update PO reference)$/}).click();await page.waitForFunction(()=>!window.CDPRemote.adapter.busy||window.CDPRemote.adapter.failure);};
 const expand=async locator=>{if(await locator.getAttribute('aria-expanded')!=='true')await locator.click();};
 const tab=async key=>page.locator(`[data-project-tab="${key}"]`).first().click();

 const db=require('./fake-server.cjs')();let signedIn=false;
 await page.route('**/vendor/supabase.js*',route=>route.fulfill({contentType:'text/javascript',body:`window.supabase={createClient(){const request=(path,data)=>fetch(path,{method:'POST',body:JSON.stringify(data)}).then(r=>r.json());return {auth:{onAuthStateChange(){},getSession:()=>request('/__test_auth',{action:'session'}),getUser:()=>request('/__test_auth',{action:'user'}),signInWithPassword:()=>request('/__test_auth',{action:'login'}),signOut:()=>request('/__test_auth',{action:'logout'})},rpc:(name,args)=>request('/__test_rpc',{name,args})};}};`}));
 await page.route('**/__test_rpc',async route=>{const {name,args}=route.request().postDataJSON();await route.fulfill({json:await db.rpc(name,args)});});
 await page.route('**/__test_auth',async route=>{const {action}=route.request().postDataJSON();if(action==='login')signedIn=true;if(action==='logout')signedIn=false;const user={id:'test-user',email:'qa@example.test'};await route.fulfill({json:action==='user'?{data:{user:signedIn?user:null}}:{data:{session:signedIn?{user}:null}}});});

 const product={id:'rug',name:'Wool rug',version:1,bom:{material:'Wool',components:[{name:'Yarn',quantity:2,unit:'kg',notes:'Natural'}],links:[]},approval:null,history:[]};
 const portalData={name:'Anna Customer',customer:'Customer Hotel AB',projects:[{id:'p1',name:'Current Hotel',archived:false,products:[product]},{id:'p2',name:'Archived Hotel',archived:true,products:[{...product,id:'old-rug'}]}]};let approvals=0;
 await page.route('**/__test_rpc',async route=>{const {name,args}=route.request().postDataJSON();if(name==='cdp_session_role')return route.fulfill({json:{data:'customer'}});if(name==='cdp_customer_portal')return route.fulfill({json:{data:portalData}});if(name==='cdp_approve_customer_bom'){if(args.expected_version!==product.version)return route.fulfill({json:{error:{code:'40001',message:'BOM changed'}}});approvals++;product.approval={name:'Anna Customer',at:'2026-11-18T10:00:00Z'};product.history.push({...product.approval,version:product.version});return route.fulfill({json:{data:product.approval}});}return route.fallback();});
 try{
 await page.goto((process.env.TEST_URL||'http://127.0.0.1:5188'));await page.locator('#login-form').waitFor({state:'visible'});assert.equal(await page.locator('.app-shell').isVisible(),false);await page.locator('#login-form [name="email"]').fill('qa@example.test');await page.locator('#login-form [name="password"]').fill('test-only');await page.locator('#login-form button').click();await page.locator('#external-portal').waitFor({state:'visible'});console.log('PASS login gates cloud state and app scripts');






 await page.getByRole('heading',{name:'Welcome, Anna',exact:true}).waitFor();assert.equal(await page.locator('.portal-brand img').getAttribute('src'),'maestro.svg');assert.equal(await page.locator('[data-customer-project]').count(),1);
 await page.locator('[data-customer-project="p1"] > summary').click();assert.equal(await page.locator('[data-customer-approve]').isDisabled(),true);await page.locator('[data-customer-bom]').click();await page.getByText('Yarn',{exact:true}).waitFor();assert.equal(await page.locator('.customer-bom-dialog input[readonly]').count(),9);assert.equal(await page.locator('.customer-bom-dialog [aria-label="Product name"]').inputValue(),'Wool rug');await page.screenshot({path:output+'/customer-bom-modal.png'});await page.keyboard.press('Escape');assert.equal(await page.locator('.customer-bom-dialog').count(),0);assert.equal(await page.locator('[data-customer-bom]').evaluate(e=>e===document.activeElement),true);assert.equal(await page.locator('[data-customer-approve]').isEnabled(),true);await page.locator('[data-customer-approve]').click();assert.equal(approvals,0);acceptApproval=true;await page.locator('[data-customer-approve]').click();await page.getByRole('button',{name:'Approved',exact:true}).waitFor();assert.equal(approvals,1);
 await page.screenshot({path:output+'/customer-portal-approved.png'});
 product.version=2;product.approval=null;await page.locator('[data-customer-refresh]').click();await page.locator('[data-customer-bom]').waitFor();await page.locator('[data-customer-bom]').click();await page.getByRole('heading',{name:'BOM – Wool rug'}).waitFor();await page.locator('.customer-bom-dialog .modal-footer button').click();product.version=3;
 await page.locator('[data-customer-approve]').click();await page.getByText('The BOM has changed. Open and review the latest version before approving.',{exact:true}).waitFor();assert.equal(await page.locator('[data-customer-approve]').isDisabled(),true);assert.equal(approvals,1);
 await page.locator('[data-customer-filter=archived]').click();assert.equal(await page.locator('[data-customer-project]').count(),1);await page.locator('[data-customer-project="p2"] > summary').click();await page.locator('[data-customer-bom]').click();await page.getByText('Yarn',{exact:true}).waitFor();assert.equal(await page.locator('[data-customer-approve]').isDisabled(),true);
 assert.equal(requests.some(url=>/\/JS\/(app|remote|data)\.js/.test(url)),false);
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:output+'/customer-bom-modal-mobile.png'});await page.locator('.customer-bom-dialog .modal-close').click();
 await page.locator('#external-portal [data-logout]').click();await page.locator('#login-form').waitFor({state:'visible'});assert.deepEqual(errors,[]);console.log('PASS customer welcome/logo, filters, expand, BOM, review, cancelled/confirmed approval, stale version recovery, archived read-only, isolated scripts and logout');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
