/* Local workflow domain. No network or database access. */
(() => {
  'use strict';
  const S = window.CDPStructure, clone = S.clone;
  const specificationKeys = ['shape','widthCm','lengthCm','manualArea','construction','material','quality','pileHeight','colours','finish','nof','specification','designReferences','cadUrl','cadName','cadLinks','labelLinks','bom'];
  const baseMigrate = S.migrate;
  function migrate(state) {
    const version = Number(state.schemaVersion || 0);
    baseMigrate(state);
    state.schemaVersion = Math.max(7, version);
    state.workspaceId ||= S.uid('workspace');
    state.articleTemplates ||= [];
    state.samples ||= [];
    for (const key of ['projects','articles','manufacturers','rfqs','articleTemplates','samples','leads','meetings']) {
      state[key].forEach(row => { row.workspaceId ||= state.workspaceId; row.recordId ||= row._dbId || S.uid('record'); });
    }
    state.articles.forEach(a => { a.designReferences ||= []; a.name ||= a.code || a.id; });
    state.rfqs.forEach(r => {
      r.decision ||= r.status === 'Avböjd' ? 'declined' : r.price != null ? 'accepted' : 'pending';
      r.history ||= [];
    });
    state.projects.forEach(p => { p.butlerOrders ||= []; });
    return state;
  }
  function articleName(state, projectId, value, id) {
    const name=String(value||'').trim();
    if(!name) throw Error('Ange artikelnamn.');
    if(state.articles.some(a=>a.projectId===projectId&&a.id!==id&&String(a.name||'').trim().toLocaleLowerCase('sv')===name.toLocaleLowerCase('sv'))) throw Error('Artikelnamnet används redan i projektet. Välj ett unikt namn.');
    return name;
  }
  function specification(article) {
    return Object.fromEntries(specificationKeys.filter(k => article[k] !== undefined).map(k => [k, clone(article[k])]));
  }
  function copyBom(source, target) {
    const empty = {shape:'Rektangulär',widthCm:0,lengthCm:0,manualArea:0,construction:'',material:'',quality:'',pileHeight:'',colours:'',finish:'',nof:'',specification:'',designReferences:[],cadUrl:'',cadName:'',labelLinks:[],bom:[]};
    Object.assign(target, empty, specification(source), {cadLinks:clone(Array.isArray(source.cadLinks)?source.cadLinks:(source.cadUrl?[{url:source.cadUrl,name:source.cadName||'Öppna CAD'}]:[]))}, {updatedAt:new Date().toISOString()});
    return target;
  }
  function saveTemplate(state, article, name) {
    if (!String(name||'').trim()) throw Error('Ange namn på artikeltemplate.');
    const t = {id:S.uid('template'),workspaceId:state.workspaceId,name:name.trim(),...specification(article),createdAt:new Date().toISOString()};
    state.articleTemplates.push(t);
    return t;
  }
  function createRfq(state, project, article, manufacturerId, sample = {}) {
    if (!state.manufacturers.some(m => m.id === manufacturerId && m.active !== false)) throw Error('Välj en aktiv tillverkare.');
    const r = {id:S.uid('RFQ'),workspaceId:state.workspaceId,projectId:project.id,articleId:article.id,manufacturerId,status:'Förfrågan',decision:'pending',createdAt:S.today(),history:[],
      requestSnapshot:{projectReference:project.id,article:{code:article.code,name:article.name,...specification(article)},phases:project.phases.flatMap(ph => ph.items.filter(i=>i.articleId===article.id).map(i=>({id:ph.id,name:ph.name,quantity:i.quantity,productionStart:ph.productionStart,deliveryDate:ph.deliveryDate}))),sample:clone(sample)}};
    r.currency='EUR';
    state.rfqs.push(r);
    if(sample.required) state.samples.push({id:S.uid('sample'),workspaceId:state.workspaceId,rfqId:r.id,projectId:project.id,articleId:article.id,manufacturerId,...clone(sample),status:'requested',history:[]});
    return r;
  }
  function recordAnswer(state, r, values) {
    if(!['pending','accepted','declined'].includes(values.decision))throw Error('Välj en giltig svarsstatus.');
    if(values.currency && values.currency!=='EUR')throw Error('Inköpspris ska anges i EUR.');
    const accepted = values.decision === 'accepted';
    if (accepted && (values.price === '' || !Number.isFinite(Number(values.price)) || Number(values.price)<0)) throw Error('Ange ett giltigt produktionspris.');
    if (accepted && (!Number.isFinite(Number(values.fxRate)) || Number(values.fxRate)<=0)) throw Error('Ange en positiv valutakurs.');
    for (const k of ['moq','leadTime']) if (!Number.isFinite(Number(values[k]||0)) || Number(values[k]||0)<0) throw Error('MOQ och lead time får inte vara negativa.');
    r.history.push(clone({decision:r.decision,price:r.price,priceUnit:r.priceUnit,currency:r.currency,fxRate:r.fxRate,moq:r.moq,leadTime:r.leadTime,status:r.status,comment:r.comment,receivedAt:r.receivedAt}));
    const allowed=['decision','priceUnit','status','validUntil','comment'];
    Object.assign(r,Object.fromEntries(allowed.filter(k=>values[k]!==undefined).map(k=>[k,values[k]])),{currency:'EUR',price:accepted?Number(values.price):null,fxRate:Number(values.fxRate)||1,moq:Number(values.moq)||0,leadTime:Number(values.leadTime)||0,receivedAt:S.today()});
    if(r.decision==='pending')r.status='Förfrågan';
    if(accepted&&!['Förhandlas','Godkänt'].includes(r.status))r.status='Förhandlas';
    if(r.decision==='declined')r.status='Avböjd';
    // Previously selected prices remain frozen; a later response requires an explicit new selection.
    r.revision=(r.revision||0)+1;
  }
  function selectResponse(state, r) {
    if(r.currency!=='EUR')throw Error('Registrera ett nytt pris i EUR innan svaret väljs.');
    if(r.decision!=='accepted' || r.price==null || r.status!=='Godkänt')throw Error('Endast accepterade svar med godkänt pris kan väljas.');
    if(r.validUntil && r.validUntil<S.today())throw Error('Priset har gått ut. Registrera en förnyad offert först.');
    const a=state.articles.find(a=>a.id===r.articleId),m=state.manufacturers.find(m=>m.id===r.manufacturerId);
    a.selectedRfqId=r.id;
    a.selectedPrice={...clone(r),manufacturer:m?.name||'',selectedAt:new Date().toISOString()};
    Object.assign(a,{pricePerSqm:r.price,priceUnit:r.priceUnit,currency:r.currency,status:r.status});
  }
  function sampleFor(state,r) { return state.samples.find(s=>s.rfqId===r.id); }
  function saveSample(state,r,values) {
    if(values.requestedDate&&values.estimatedDispatch&&values.estimatedDispatch<values.requestedDate)throw Error('Beräknad avsändning kan inte vara före begäran.');
    let sample=sampleFor(state,r);
    if(!sample){sample={id:S.uid('sample'),workspaceId:state.workspaceId,rfqId:r.id,projectId:r.projectId,articleId:r.articleId,manufacturerId:r.manufacturerId,history:[]};state.samples.push(sample);}
    sample.history.push({at:new Date().toISOString(),status:sample.status||'requested',tracking:sample.tracking||''});
    Object.assign(sample,values,{updatedAt:new Date().toISOString()});
    if(['shipped','received','approved','rejected'].includes(values.status))sample[values.status+'At'] ||= S.today();
    return sample;
  }
  // Scheduling is owned by Cappelen. Read the current phase assignments, while
  // keeping the original specification and quantity snapshot for traceability.
  function rfqPhases(state,r){
    const p=state.projects.find(p=>p.id===r.projectId);
    return (p?.phases||[]).flatMap(ph=>(ph.items||[]).filter(i=>i.articleId===r.articleId).map(i=>({id:ph.id,name:ph.name,quantity:i.quantity,productionStart:ph.productionStart||'',deliveryDate:ph.deliveryDate||''})));
  }
  const originalCreateProject=S.createProject,originalGo=S.go;
  Object.assign(S,{articleName,migrate,specification,copyBom,saveTemplate,createRfq,recordAnswer,selectResponse,sampleFor,saveSample,rfqPhases,
    createProject(state,values){const project=originalCreateProject(state,values);migrate(state);return project;},
    go(state,id){const project=originalGo(state,id);migrate(state);return project;}
  });
})();
