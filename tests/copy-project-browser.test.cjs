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





 const ids=await page.evaluate(async()=>{const s=CDPRemote.adapter.state,S=CDPStructure,source=S.createProject(s,{name:'Copy source'}),target=S.createProject(s,{name:'Copy target',projectType:'simple',phaseMode:'single'}),p=S.products.save(s,source,'',{name:'Wool rug',bom:[{name:'Wool',quantity:1,unit:'kg'}]});for(let i=1;i<3;i++)s.articles.push({...S.products.spec(p),id:'copy'+i,projectId:source.id,productId:p.id,name:'100x'+i*100,widthCm:100,lengthCm:i*100,quantity:2});await CDPRemote.adapter.save();return {source:source.id,target:target.id};});
 await page.reload();await page.waitForFunction(()=>window.CDPApp?.ready);await page.locator('[data-view=projects]').click();await page.locator('[data-project-id="'+ids.target+'"]').first().click();await tab('articleList');
 const dropdown=page.locator('[data-copy-project]');assert.equal(await dropdown.locator('option[value="'+ids.target+'"]').count(),0);
 await dropdown.selectOption(ids.source);await page.locator('#copyProjectArticlesForm [name=article]').last().uncheck();await page.locator('#copyProjectArticlesForm button').click();await state();assert.equal(await page.locator('[data-project-article-list]').getAttribute('data-project-article-list'),ids.target);assert.equal(await page.locator('[data-project-article-rows] tr').count(),1);let s=await state();assert.equal(s.articles.filter(a=>a.projectId===ids.target).length,1);assert.equal(s.articles.filter(a=>a.projectId===ids.source).length,2);
 await page.reload();await page.waitForFunction(()=>window.CDPApp?.ready);s=await state();assert.equal(s.articles.filter(a=>a.projectId===ids.target).length,1);assert.deepEqual(errors,[]);console.log('PASS project dropdown, selected copy, return to target Articles and reload');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
