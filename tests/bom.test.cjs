const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict'),crypto=require('crypto');
const ctx={window:{},crypto,console};vm.createContext(ctx);
for(const f of ['structure','workflow'])vm.runInContext(fs.readFileSync(__dirname+'/../JS/'+f+'.js','utf8'),ctx);
const S=ctx.window.CDPStructure,s={projects:[{id:'p',phases:[]}],articles:[{id:'a',projectId:'p',name:'Lobby',manufacturerId:'legacy',manufacturer:'Old',bom:[{name:'Wool',quantity:2}]},{id:'b',projectId:'p',code:'P-A02',bom:[]}],manufacturers:[{id:'m1'},{id:'m2'}]};
S.migrate(s);const original=JSON.stringify(s);S.migrate(s);assert.equal(JSON.stringify(s),original);assert.equal(s.articles[1].name,'P-A02');assert.equal(s.articles[0].manufacturerId,'legacy');
assert.equal(S.articleName(s,'p',' Lobby ','a'),'Lobby');assert.throws(()=>S.articleName(s,'p',' lobby ','b'));assert.throws(()=>S.articleName(s,'p','   '));assert.equal(S.articleName(s,'other','Lobby'),'Lobby');
for(const a of s.articles)for(const m of s.manufacturers)S.createRfq(s,s.projects[0],a,m.id);
assert.equal(s.rfqs.length,4);for(const r of s.rfqs){assert.ok(!('manufacturerId' in r.requestSnapshot.article));assert.ok(!('manufacturer' in r.requestSnapshot.article));}
const frozen=JSON.stringify(s.rfqs[0].requestSnapshot);s.articles[0].name='Renamed';s.articles[0].bom[0].quantity=9;assert.equal(JSON.stringify(s.rfqs[0].requestSnapshot),frozen);
const r=s.rfqs[2];Object.assign(r,{decision:'accepted',status:'Godkänt',price:10,currency:'EUR',priceUnit:'per m²'});S.selectResponse(s,r);assert.ok(!('manufacturerId' in s.articles[1]));assert.equal(s.articles[1].selectedPrice.manufacturerId,'m1');
console.log('PASS legacy preservation, idempotence, unique article names, 2×2 RFQ mapping, frozen BOM and manufacturer-free article');
