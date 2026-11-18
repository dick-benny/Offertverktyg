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

 let portalRole='manufacturer',portalArticles=[{id:'one',project_id:'hotel',project:'Hotel',product:'Wool rug',article:'100x200',quantity:2,bom:{material:'Wool',components:[{name:'Wool yarn',quantity:3,unit:'kg',notes:'Natural'}],links:[]}}];await page.route('**/__test_rpc',async route=>{const {name}=route.request().postDataJSON();if(name==='cdp_manufacturer_articles')return route.fulfill({json:{data:{manufacturer:'Maker One',articles:portalArticles}}});if(name==='cdp_session_role')return route.fulfill({json:{data:portalRole}});return route.fallback();});
 try{
 await page.goto((process.env.TEST_URL||'http://127.0.0.1:5188'));await page.locator('#login-form').waitFor({state:'visible'});assert.equal(await page.locator('.app-shell').isVisible(),false);await page.locator('#login-form [name="email"]').fill('qa@example.test');await page.locator('#login-form [name="password"]').fill('test-only');await page.locator('#login-form button').click();await page.locator('#external-portal').waitFor({state:'visible'});console.log('PASS login gates cloud state and app scripts');





assert.equal(await page.locator('[data-portal-title]').innerText(),'Manufacturer portal');assert.equal(await page.locator('.app-shell').isVisible(),false);assert.equal(requests.some(url=>/\/JS\/(app|remote|data)\.js/.test(url)),false);await page.locator('[data-portal-bom]').click();await page.getByText('Wool yarn',{exact:true}).waitFor();await page.screenshot({path:output+'/manufacturer-portal.png'});portalArticles=[];await page.locator('[data-portal-refresh]').click();await page.getByText('No articles are assigned to your manufacturer yet.').waitFor();assert.equal(await page.locator('[data-portal-bom-panel]').isVisible(),false);portalRole='customer';await page.reload();await page.locator('#external-portal').waitFor({state:'visible'});assert.equal(await page.locator('[data-portal-title]').innerText(),'Customer portal');await page.locator('#external-portal [data-logout]').click();await page.locator('#login-form').waitFor({state:'visible'});assert.deepEqual(errors,[]);console.log('PASS Manufacturer/Customer landing pages, no internal data scripts, and logout');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
