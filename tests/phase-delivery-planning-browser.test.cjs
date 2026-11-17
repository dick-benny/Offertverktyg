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






 const pid=await page.evaluate(async()=>{const s=CDPRemote.adapter.state,S=CDPStructure;s.company.productionPlanning={productionWeeks:8,airWeeks:2,seaWeeks:6};const p=S.createProject(s,{name:'Phase planning',phaseMode:'multiple',requestedDeliveryWeek:'2027-W15'});p.phases=[{id:'one',name:'Phase 1',items:[],calculation:S.defaults()},{id:'two',name:'Phase 2',items:[],calculation:S.defaults()}];await CDPRemote.adapter.save();return p.id;});await page.reload();await page.waitForFunction(()=>window.CDPApp?.ready);assert.equal(await page.locator('img.brand-mark').evaluate(e=>e.complete&&e.naturalWidth>0),true);await page.locator('[data-view=projects]').click();await page.locator('[data-project-id="'+pid+'"]').first().click();await page.locator('[data-project-options]').click();const weeks=page.locator('[data-planning-week]');assert.equal(await weeks.count(),2);assert.equal(await weeks.nth(0).inputValue(),'2027-W15');await weeks.nth(1).fill('2027-W20');assert.equal(await page.locator('[data-start-air]').nth(0).innerText(),'2027-W05');assert.equal(await page.locator('[data-start-air]').nth(1).innerText(),'2027-W10');const boxes=await page.locator('.delivery-planning-row').first().locator('input,output').evaluateAll(els=>els.map(e=>({top:e.getBoundingClientRect().top,height:e.getBoundingClientRect().height})));assert.ok(boxes.every(b=>Math.abs(b.top-boxes[0].top)<2));assert.equal(await page.locator('[data-start-air]').first().evaluate(e=>getComputedStyle(e).justifyContent),'center');await page.locator('#projectOptionsForm button').click();await state();await page.reload();await page.waitForFunction(()=>window.CDPApp?.ready);const p=(await state()).projects.find(p=>p.id===pid);assert.equal(p.phases[0].requestedDeliveryWeek,'2027-W15');assert.equal(p.phases[1].requestedDeliveryWeek,'2027-W20');assert.deepEqual(errors,[]);console.log('PASS sidebar icon, independent phase weeks, live calculations, aligned values and reload');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
