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

 try{
 await page.goto((process.env.TEST_URL||'http://127.0.0.1:5188'));await page.locator('#login-form').waitFor({state:'visible'});assert.equal(await page.locator('.app-shell').isVisible(),false);await page.locator('#login-form [name="email"]').fill('qa@example.test');await page.locator('#login-form [name="password"]').fill('test-only');await page.locator('#login-form button').click();await page.waitForFunction(()=>window.CDPApp?.ready);console.log('PASS login gates cloud state and app scripts');




 const pid=await page.evaluate(async()=>{const s=window.CDPRemote.adapter.state,S=window.CDPStructure,p=S.createProject(s,{name:'Freight costing',projectType:'simple',phaseMode:'single'});p.calculation.targetMargin=50;s.articles.push({id:'a',projectId:p.id,name:'Rug',quantity:1,shape:'Rektangulär',widthCm:100,lengthCm:100,bom:[]});S.setProductionPrice(s,'a',{price:1000});await window.CDPRemote.adapter.save();return p.id;});
 await page.reload();await page.waitForFunction(()=>window.CDPApp?.ready);await page.locator('[data-view=projects]').click();await page.locator('[data-project-id="'+pid+'"]').first().click();await tab('calculation');
 const input=n=>page.locator('#v6Calculation [name="'+n+'"]'),save=async()=>{await page.locator('#v6Calculation button').filter({hasText:/^Save costing$/}).click();await state();};
 assert.equal(await input('importVatCost').isVisible(),false);assert.equal(await input('includeImportVatInCost').isVisible(),false);assert.equal(await input('freightMarkupPercent').inputValue(),'15');assert.equal(await input('customerFreight').count(),0);
 await input('freightCost').fill('1000');assert.match(await page.locator('[data-customer-freight]').innerText(),/1[,.\s]?150/);await save();let p=(await state()).projects[0];assert.equal(p.phases[0].calculation.customerFreight,1150);assert.equal(await page.evaluate(()=>window.CDPStructure.calculate(window.CDPRemote.adapter.state,window.CDPRemote.adapter.state.projects[0]).salesPrice),3150);
 await page.screenshot({path:output+'/costing-dap.png',fullPage:true});await input('deliveryTerm').selectOption('DDP');assert.equal(await input('importVatCost').isVisible(),true);await input('importVatCost').fill('200');await input('includeImportVatInCost').check();await save();assert.equal(await page.evaluate(()=>window.CDPStructure.calculate(window.CDPRemote.adapter.state,window.CDPRemote.adapter.state.projects[0]).salesPrice),3550);
 await input('deliveryTerm').selectOption('DAP');assert.equal(await input('importVatCost').isVisible(),false);await save();assert.equal((await state()).projects[0].phases[0].calculation.importVatCost,200);await input('deliveryTerm').selectOption('DDP');assert.equal(await input('importVatCost').inputValue(),'200');await input('deliveryTerm').selectOption('DAP');await input('freightMarkupPercent').fill('0');await save();assert.equal((await state()).projects[0].phases[0].calculation.customerFreight,1000);
 await page.reload();await page.waitForFunction(()=>window.CDPApp?.ready);await page.locator('[data-view=projects]').click();await page.locator('[data-project-id="'+pid+'"]').first().click();await tab('calculation');assert.equal(await input('freightMarkupPercent').inputValue(),'0');assert.equal(await input('importVatCost').isVisible(),false);await input('freightMarkupPercent').fill('15');await page.locator('[data-v6-quote]').click();await state();const quote=(await state()).quotations[0];assert.equal(quote.amount,3150);assert.equal(quote.phaseSnapshots[0].freightShown,1150);
 await tab('calculation');await input('freightMarkupPercent').fill('20');await save();assert.equal((await state()).quotations[0].amount,3150);await input('deliveryTerm').selectOption('DDP');await page.setViewportSize({width:390,height:844});assert.equal(await input('importVatCost').isVisible(),true);await page.screenshot({path:output+'/costing-ddp-mobile.png',fullPage:true});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));assert.deepEqual(errors,[]);
 console.log('PASS DAP/DDP field visibility, VAT retention/exclusion, live freight markup, zero markup, save/reload, quote totals/snapshots and mobile');
 }catch(e){console.error(e);console.error((await page.locator('body').innerText()).slice(-4000));await page.screenshot({path:output+'/costing-failure.png'});process.exitCode=1;}finally{await browser.close();}
})();
