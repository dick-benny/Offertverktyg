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




 const pid=await page.evaluate(async()=>{const s=window.CDPRemote.adapter.state,S=window.CDPStructure,p=S.createProject(s,{name:'Product BOM'});for(const [id,w] of [['a',200],['b',300]])s.articles.push({id,projectId:p.id,name:w+'x400',nameMode:'dimensions',widthCm:w,lengthCm:400,location:'Suite',quantity:5,shape:'Rektangulär',bom:[]});S.products.sync(s);S.products.save(s,p,s.articles[0].productId,{name:'Aurora'});S.products.link(s,s.articles[1],s.articles[0].productId,true);await window.CDPRemote.adapter.save();return p.id;});
 await page.reload();await page.waitForFunction(()=>window.CDPApp?.ready);await page.locator('[data-view=projects]').click();await page.locator('[data-project-id="'+pid+'"]').first().click();await tab('articleList');await page.locator('#modal [data-v6-bom=a]').click();assert.equal(await page.locator('#v7Bom [name=productName]').inputValue(),'Aurora');for(const name of ['location','shape','widthCm','lengthCm','quantity'])assert.equal(await page.locator('#v7Bom > .form-grid [name="'+name+'"]').count(),0);
 await fill('#v7Bom',{productName:'Aurora updated',material:'Wool'});await page.locator('[data-v6-add-bom]').click();await page.locator('[data-bom-row] [name=name]').fill('Yarn');await page.locator('[data-bom-row] [name=quantity]').fill('2');await page.locator('#v7Bom button').filter({hasText:/^Save BOM$/}).click();await state();let s=await state();assert.ok(s.articles.every(a=>a.material==='Wool'&&a.bom[0].name==='Yarn'));assert.deepEqual(s.articles.map(a=>[a.name,a.widthCm,a.lengthCm,a.quantity,a.location]),[['200x400',200,400,5,'Suite'],['300x400',300,400,5,'Suite']]);assert.equal(s.projects[0].products[0].name,'Aurora updated');
 await page.locator('.bom-functions summary').click();await page.locator('[data-v7-function=add-label]').click();await fill('#v7CadLink',{newCadName:'Label',newCadUrl:'https://example.com/label'});await page.locator('#v7CadLink button[type=submit]').click();await state();assert.ok((await state()).articles.every(a=>a.labelLinks[0].name==='Label'));
 await page.screenshot({path:output+'/product-bom.png',fullPage:true});await page.reload();await page.waitForFunction(()=>window.CDPApp?.ready);await page.locator('[data-view=projects]').click();await page.locator('[data-project-id="'+pid+'"]').first().click();await tab('articleList');await page.locator('#modal [data-v6-bom=b]').click();assert.equal(await page.locator('#v7Bom [name=material]').inputValue(),'Wool');assert.equal(await page.locator('#v7Bom [name=productName]').inputValue(),'Aurora updated');assert.deepEqual(errors,[]);console.log('PASS product BOM fields, shared material/components/labels, product rename, article dimensions unchanged and reload through another article');
 }finally{await browser.close();}
})();
