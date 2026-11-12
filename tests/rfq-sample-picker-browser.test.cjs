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





 const pid=await page.evaluate(async()=>{const s=window.CDPRemote.adapter.state,p=window.CDPStructure.createProject(s,{name:'Multiple samples'});p.qualitySamples=[];for(const id of ['a','b'])s.articles.push({id,projectId:p.id,name:'Rug '+id,quantity:2,bom:[]});s.manufacturers.push({id:'maker',name:'Maker',active:true});await window.CDPRemote.adapter.save();return p.id;});
 await page.reload();await page.waitForFunction(()=>window.CDPApp?.ready);await page.locator('[data-view=projects]').click();await page.locator('[data-project-id="'+pid+'"]').first().click();await tab('articleList');
 for(const [i,article,size] of [[0,'a','20 x 20 cm'],[1,'a','30 x 30 cm'],[2,'b','40 x 40 cm']]){await page.locator(i===1?'[data-quality-add-related]':'[data-quality-new]').first().click();await page.locator('#qualitySampleForm [name=productId]').selectOption('product-'+article);await fill('#qualitySampleForm',{size,instructions:'Sample '+i});await page.locator('#qualitySampleForm button').click();await state();assert.equal(await page.locator('[data-project-article-rows] [data-quality-edit]').count(),i+1);}
 const samples=(await state()).projects[0].qualitySamples;assert.deepEqual(samples.map(s=>s.articleIds),[['a'],['a'],['b']]);assert.equal(new Set(samples.map(s=>s.id)).size,3);
 await page.locator('[data-quality-edit="'+samples[0].id+'"]').click();await fill('#qualitySampleForm',{instructions:'Changed first only'});await page.locator('#qualitySampleForm button').click();await state();assert.equal((await state()).projects[0].qualitySamples[1].instructions,'Sample 1');
 await tab('rfqPreliminary');await page.locator('[data-v6-rfq-new]').click();assert.deepEqual(await page.locator('#projectRfqConfig th').allTextContents(),['Article','Target EUR/m²']);assert.equal(await page.locator('[data-rfq-new-sample]').count(),0);assert.equal(await page.locator('#projectRfqConfig [name=sample]').count(),3);assert.equal(await page.locator('#projectRfqConfig [name=sample]:checked').count(),0);
 await page.locator('#projectRfqConfig [name=article][value=a]').check();await page.locator('#projectRfqConfig [name=manufacturer]').check();for(const sample of samples.slice(1))await page.locator('#projectRfqConfig [name=sample][value="'+sample.id+'"]').check();await page.locator('#projectRfqConfig > button').click();await state();let g=(await state()).projects[0].projectRfq;assert.deepEqual(g.sampleIds,samples.slice(1).map(s=>s.id));assert.equal(g.lines.filter(l=>l.sample).length,2);
 await page.locator('[data-project-rfq-send]').click();await state();await page.locator('#modal [data-supplier-preview]').first().click();await page.locator('#supplierPreviewSelect').selectOption('maker');await page.locator('[data-supplier-toggle]').click();assert.ok((await page.locator('.project-rfq-lines').innerText()).includes('Sample – Rug b'));
 await page.reload();await page.waitForFunction(()=>window.CDPApp?.ready);g=(await state()).projects[0].projectRfq;assert.deepEqual(g.sampleIds,samples.slice(1).map(s=>s.id));assert.equal(g.lines.filter(l=>l.sample).length,2);assert.deepEqual(errors,[]);console.log('PASS multiple distinct project samples, shared article links, independent editing, RFQ list-only selection, subset publication and persistence');
 }catch(e){console.error(e);console.error((await page.locator('body').innerText()).slice(-3000));process.exitCode=1;}finally{await browser.close();}
})();
