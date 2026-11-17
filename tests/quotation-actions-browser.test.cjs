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






 const ids=await page.evaluate(async()=>{const s=CDPRemote.adapter.state,S=CDPStructure,p=S.createProject(s,{name:'Action test',phaseMode:'single'});p.phase='Förhandling';s.articles.push({id:'a',projectId:p.id,name:'Rug',widthCm:100,lengthCm:100,quantity:1,pricePerSqm:50,priceUnit:'per m²',currency:'EUR',status:'Godkänt'});S.migrate(s);const q={...S.snapshot(s,p),id:'quote-test',version:1};s.quotations.push(q);await CDPRemote.adapter.save();return {p:p.id,q:q.id};});await page.reload();await page.waitForFunction(()=>window.CDPApp?.ready);await page.locator('[data-view=projects]').click();assert.equal(await page.locator('#projectKanban').getByText('Negotiations',{exact:true}).count(),0);await page.locator('[data-project-id="'+ids.p+'"]').first().click();assert.equal(await page.locator('[data-project-tab=delivery]').count(),0);await tab('quotes');await page.locator('[data-quote-id="'+ids.q+'"]:visible').first().click();assert.equal(await page.locator('[data-mark-sent]:visible').count(),0);const before=JSON.stringify(await state()),messages=[];page.on('dialog',d=>messages.push(d.message()));await page.locator('[data-order-confirmation-info]').click();await page.locator('[data-invoice-fortnox-info]').click();assert.ok(messages[0].startsWith('Mail'));assert.ok(messages[1].startsWith('Invoice Bridge'));assert.equal(JSON.stringify(await state()),before);assert.deepEqual(errors,[]);console.log('PASS hidden navigation, retained negotiation project, placeholder messages and unchanged quotation status');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
