const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const ctx={window:{},crypto,console,Date,Promise,AbortSignal};vm.createContext(ctx);for(const n of ['structure','workflow','rfq-project','remote'])vm.runInContext(fs.readFileSync(__dirname+'/../JS/'+n+'.js','utf8'),ctx);
(async()=>{
 const S=ctx.window.CDPStructure,R=ctx.window.CDPRemote,db=require('./fake-server.cjs')(),adapter=R.createAdapter(db,db.db),s=adapter.state;
 const source=S.createProject(s,{name:'Source',phaseMode:'single'}),target=S.createProject(s,{name:'Target',phaseMode:'single'}),multi=S.createProject(s,{name:'Multi',phaseMode:'multiple'});
 const p=S.products.save(s,source,'',{name:'Rug',material:'Wool',bom:[{_dbId:'old',name:'Yarn',quantity:2,unit:'kg'}]});
 for(let i=1;i<=2;i++)s.articles.push({...S.products.spec(p),id:'a'+i,projectId:source.id,productId:p.id,name:'100x'+i*100,widthCm:100,lengthCm:i*100,quantity:i+1,location:'Room',targetPrice:80,selectedPrice:{price:40},pricePerSqm:40,_dbId:'old-article',sample:{size:'30'}});
 S.migrate(s);const before=JSON.stringify(source),beforeArticles=JSON.stringify(s.articles);const result=S.copyProjectArticles(s,target.id,source.id,['a1','a2']);
 assert.equal(result.length,2);assert.equal(target.products.length,1);assert.equal(result[0].productId,result[1].productId);assert.notEqual(result[0].productId,p.id);assert.equal(target.phases[0].items.length,2);assert.equal(result[0].pricePerSqm,0);assert.equal(result[0].targetPrice,80);assert.equal(result[0].selectedPrice,undefined);assert.equal(result[0].sample,undefined);assert.ok(!JSON.stringify(result).includes('_dbId'));assert.equal(JSON.stringify(source),before);assert.equal(JSON.stringify(s.articles.slice(0,2)),beforeArticles);
 result[0].bom[0].name='Changed';assert.equal(s.articles[0].bom[0].name,'Yarn');assert.equal(target.products[0].bom[0].name,'Yarn');
 const snapshot=JSON.stringify(s);assert.throws(()=>S.copyProjectArticles(s,target.id,source.id,['missing']));assert.equal(JSON.stringify(s),snapshot);assert.throws(()=>S.copyProjectArticles(s,target.id,target.id,['a1']));assert.throws(()=>S.copyProjectArticles(s,target.id,source.id,[]));
 S.copyProjectArticles(s,target.id,source.id,['a1']);assert.equal(target.products[1].name,'Rug (copy 2)');S.copyProjectArticles(s,multi.id,source.id,['a2']);assert.equal(multi.phases.length,0);
 for(const a of s.articles){delete a._dbId;delete a.selectedPrice;} assert.equal(await adapter.save(),true,String(adapter.failure));const loaded=R.createAdapter(db,db.db).state;assert.equal(loaded.articles.filter(a=>a.projectId===target.id).length,3);assert.equal(loaded.projects.find(p=>p.id===target.id).products.length,2);assert.equal(loaded.articles.find(a=>a.id===result[0].id).bom[0].name,'Changed');
 console.log('PASS independent copy, shared product grouping, selection, validation, name collisions, phases, clean histories and persistence');
})().catch(e=>{console.error(e);process.exitCode=1;});

