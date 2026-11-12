const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const ctx={window:{},crypto,console,Date,Promise,AbortSignal};vm.createContext(ctx);
for(const name of ['structure','workflow','remote'])vm.runInContext(fs.readFileSync(__dirname+'/../JS/'+name+'.js','utf8'),ctx);
const S=ctx.window.CDPStructure,R=ctx.window.CDPRemote;
(async()=>{
const db=require('./fake-server.cjs')(),adapter=R.createAdapter(db,db.db),s=adapter.state,p=S.createProject(s,{name:'Freight',phaseMode:'single'});
s.articles.push({id:'a',projectId:p.id,name:'Rug',shape:'Rektangulär',widthCm:100,lengthCm:100,quantity:1,pricePerSqm:1000,priceUnit:'per m²',currency:'EUR',bom:[]});p.calculation.targetMargin=50;
const c=p.phases[0].calculation;assert.equal(c.freightMarkupPercent,15);Object.assign(c,{freightPricing:'markup',freightCost:1000,dutyCost:50,importVatCost:200,otherImportCost:25,includeImportVatInCost:true});
let v=S.calculate(s,p);assert.equal(v.totalCost,2000);assert.equal(v.salesPrice,3150);assert.equal(v.phases[0].freightShown,1150);assert.equal(v.phases[0].items[0].salesTotal,2000);assert.equal(v.importVatCost,0);
c.deliveryTerm='DDP';v=S.calculate(s,p);assert.equal(v.totalCost,2275);assert.equal(v.salesPrice,3700);assert.equal(v.importVatCost,200);
c.includeImportVatInCost=false;assert.equal(S.calculate(s,p).importVatCost,0);c.deliveryTerm='DAP';c.freightMarkupPercent=0;assert.equal(S.calculate(s,p).salesPrice,3000);
c.freightMarkupPercent=-1;assert.throws(()=>S.snapshot(s,p));c.freightMarkupPercent=15;c.freightPresentation='Ingår i produktpris';v=S.calculate(s,p);assert.equal(v.salesPrice,3150);assert.equal(v.phases[0].freightShown,0);assert.equal(v.phases[0].items[0].salesTotal,3150);
const frozen=S.snapshot(s,p),before=JSON.stringify(frozen);c.freightMarkupPercent=20;assert.equal(S.calculate(s,p).salesPrice,3200);assert.equal(JSON.stringify(frozen),before);
await adapter.save();const re=R.createAdapter(db,db.db),rp=re.state.projects[0];assert.equal(rp.phases[0].calculation.freightMarkupPercent,20);assert.equal(rp.phases[0].calculation.freightPricing,'markup');assert.equal(S.calculate(re.state,rp).salesPrice,3200);
const legacy=S.clone(p);delete legacy.phases[0].calculation.freightPricing;assert.equal(S.calculate(s,legacy).salesPrice,4000);
p.phaseMode='multiple';c.freightCost=0.03;c.freightMarkupPercent=15;p.calculation.targetMargin=33;p.phases.push({...S.clone(p.phases[0]),id:'ph2'});v=S.calculate(s,p);assert.equal(Math.round(v.phases.reduce((n,ph)=>n+ph.items.reduce((z,a)=>z+a.salesTotal,0)+ph.freightShown,0)*100),Math.round(v.salesPrice*100));
console.log('PASS DAP excludes import costs, DDP VAT inclusion, 15%/zero/invalid markup, independent freight pricing, included/separate quotation freight, rounding, frozen snapshots and cloud reload');
})().catch(e=>{console.error(e);process.exitCode=1;});
