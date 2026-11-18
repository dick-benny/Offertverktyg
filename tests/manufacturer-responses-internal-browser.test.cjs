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





 const ids=await page.evaluate(async()=>{const s=CDPRemote.adapter.state,S=CDPStructure,p=S.createProject(s,{name:'Supplier test',projectType:'simple',phaseMode:'single',currency:'EUR'}),v=S.products.save(s,p,'',{name:'Wool rug'});s.manufacturers.push({id:'maker',name:'Maker One',active:true});s.articles.push({...S.products.spec(v),id:'assigned',projectId:p.id,productId:v.id,name:'100x200',widthCm:100,lengthCm:200,quantity:2,rfqManufacturerIds:['maker'],manufacturerId:'maker',manufacturer:'Maker One',currency:'EUR',pricePerSqm:99});await CDPRemote.adapter.save();return {p:p.id,pdb:p._dbId,product:v.id,manufacturer:s.manufacturers[0]._dbId,article:s.articles[0]._dbId};});
 const response=[{manufacturer_id:ids.manufacturer,manufacturer:'Maker One',project:{id:ids.pdb,revision:'rev1',confirmation:null,products:[{id:ids.product,name:'Wool rug',version:1,target:null,price:25,bom_approval:{name:'Maker'},articles:[{id:ids.article}]}]}}];
 await page.route('**/__test_rpc',async route=>{const {name,args}=route.request().postDataJSON();if(name==='cdp_internal_manufacturer_responses')return route.fulfill({json:{data:response}});if(name==='cdp_set_manufacturer_target'){assert.equal(args.new_target,20);response[0].project.products[0].target=20;response[0].project.revision='rev2';return route.fulfill({json:{data:true}});}return route.fallback();});
 await page.reload();await page.waitForFunction(()=>window.CDPApp?.ready);await page.locator('[data-view=projects]').click();await page.locator('[data-project-id="'+ids.p+'"]').first().click();await page.getByText('Manufacturer responses',{exact:true}).click();await page.locator('[data-offer-target] input').fill('20');await page.locator('[data-offer-target] button').click();await page.waitForFunction(()=>document.querySelector('[data-offer-target] input')?.value==='20');let stateBefore=await state();assert.equal(stateBefore.articles[0].pricePerSqm,99);
 await page.locator('[data-use-offer]').click();await page.locator('#useManufacturerOffer button').click();await page.waitForFunction(()=>!document.querySelector('#useManufacturerOffer'));let s=await state();assert.equal(s.articles[0].pricePerSqm,25);assert.equal(s.articles[0].manualProductionPrice.manufacturerId,'maker');
 await page.locator('[data-project-options]').click();await page.locator('[name=manufacturerPortalArchived]').check();await page.locator('#projectOptionsForm button').click();await page.waitForFunction(()=>!document.querySelector('#projectOptionsForm'));s=await state();assert.equal(s.projects[0].manufacturerPortalArchived,true);assert.deepEqual(errors,[]);console.log('PASS internal product target, explicit offered-price adoption without automatic costing changes, and independent manufacturer archive');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
