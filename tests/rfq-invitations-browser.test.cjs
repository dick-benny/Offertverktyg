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
 await page.route('**/__test_auth',async route=>{const {action}=route.request().postDataJSON();if(action==='login')signedIn=true;if(action==='logout')signedIn=false;const user={id:'test-user',email:'qa@example.test',user_metadata:{full_name:'QA Person'}};await route.fulfill({json:action==='user'?{data:{user:signedIn?user:null}}:{data:{session:signedIn?{user}:null}}});});

 try{
 await page.goto((process.env.TEST_URL||'http://127.0.0.1:5188'));await page.locator('#login-form').waitFor({state:'visible'});assert.equal(await page.locator('.app-shell').isVisible(),false);await page.locator('#login-form [name="email"]').fill('qa@example.test');await page.locator('#login-form [name="password"]').fill('test-only');await page.locator('#login-form button').click();await page.waitForFunction(()=>window.CDPApp?.ready);console.log('PASS login gates cloud state and app scripts');





 const id=await page.evaluate(async()=>{const s=CDPRemote.adapter.state,S=CDPStructure,p=S.createProject(s,{name:'Manufacturer test',projectType:'simple',phaseMode:'single'}),product=S.products.save(s,p,'',{name:'Rug'});s.manufacturers.push({id:'maker-test',name:'Test manufacturer',active:true},{id:'maker-two',name:'Second manufacturer',active:true});s.articles.push({...S.products.spec(product),id:'article-test',projectId:p.id,productId:product.id,name:'100x200',widthCm:100,lengthCm:200,quantity:2,pricePerSqm:12,currency:'EUR'});await CDPRemote.adapter.save();return p.id;});
 const open=async()=>{await page.locator('[data-view=projects]').click();await page.locator('[data-project-id="'+id+'"]').first().click();await tab('articleList');};
 await page.reload();await page.waitForFunction(()=>window.CDPApp?.ready);await open();
 await page.locator('[data-project-article-rows] [data-article-inline=manufacturer]').selectOption('maker-test');await page.waitForFunction(()=>document.querySelector('[data-project-article-rows] [data-article-inline=manufacturer]').dataset.saved==='maker-test');
 await page.reload();await page.waitForFunction(()=>window.CDPApp?.ready);await open();assert.equal(await page.locator('[data-project-article-rows] [data-article-inline=manufacturer]').inputValue(),'maker-test');let s=await state();assert.equal(s.articles.find(a=>a.id==='article-test').pricePerSqm,12);
 assert.match(await page.locator('#view-dashboard h1').textContent(),/QA Person/);
 assert.equal(await page.locator('.profile-card [data-logout]').count(),0);
 await page.locator('[data-project-article-rows] [data-article-rfq]').click();
 await page.locator('#articleRfqInvitations [value="maker-test"]').check();await page.locator('#articleRfqInvitations [value="maker-two"]').check();await page.locator('#articleRfqInvitations button').click();await page.waitForFunction(()=>!document.querySelector('#articleRfqInvitations'));
 s=await state();assert.deepEqual(s.articles[0].rfqManufacturerIds,['maker-test','maker-two']);assert.equal(s.articles[0].manufacturerId,'maker-test');
 await page.reload();await page.waitForFunction(()=>window.CDPApp?.ready);await open();
 assert.equal(await page.locator('[data-project-article-rows] [data-article-rfq]').textContent(),'Select (2)');
 await page.locator('[data-project-article-rows] [data-article-inline=manufacturer]').selectOption('maker-two');await page.waitForFunction(()=>document.querySelector('[data-project-article-rows] [data-article-inline=manufacturer]').dataset.saved==='maker-two');s=await state();assert.deepEqual(s.articles[0].rfqManufacturerIds,['maker-test','maker-two']);
 await page.screenshot({path:output+'/rfq-invitations.png',fullPage:true});
 await page.locator('[data-project-won]').click();await page.locator('#projectWonForm button').click();await page.waitForFunction(()=>!document.querySelector('#projectWonForm'));s=await state();assert.equal(s.projects[0].businessStatus,'Vunnet');assert.equal(s.projects[0].acceptedAt,undefined);assert.deepEqual(errors,[]);console.log('PASS saved name, sidebar logout removed, multiple persisted invitations independent of selected manufacturer, and Won action');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
