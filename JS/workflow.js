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
  function sampleAddress(state){
    const c=state.company||{};
    return [c.name,c.address,[c.zip,c.city].filter(Boolean).join(' '),c.country].filter(Boolean).join('\n');
  }
  function articleSample(state,article){
    // Old manufacturer samples remain in history. Only descriptive fields carry forward.
    const source=article.sample||(state.samples||[]).filter(s=>s.articleId===article.id).at(-1)||{};
    return {type:String(source.type||''),size:String(source.size||''),requestedDate:String(source.requestedDate||''),instructions:String(source.instructions||''),deliveryAddress:sampleAddress(state)};
  }
  function saveArticleSample(state,id,values){
    const a=state.articles.find(a=>a.id===id);if(!a)throw Error('Artikeln saknas.');
    const requestedDate=String(values.requestedDate||'');
    if(requestedDate&&(!/^\d{4}-\d{2}-\d{2}$/.test(requestedDate)||Number.isNaN(Date.parse(requestedDate))))throw Error('Ange ett giltigt datum.');
    a.sample={type:String(values.type||'').trim(),size:String(values.size||'').trim(),requestedDate,instructions:String(values.instructions||'').trim()};
    return a.sample;
  }
  function deleteProject(state,id){
    const p=state.projects.find(p=>p.id===id);if(!p)throw Error('Projektet saknas.');
    const articles=new Set(state.articles.filter(a=>a.projectId===id).map(a=>a.id));
    const rfqs=new Set(state.rfqs.filter(r=>r.projectId===id||articles.has(r.articleId)).map(r=>r.id));
    state.articles=state.articles.filter(a=>!articles.has(a.id));
    state.rfqs=state.rfqs.filter(r=>!rfqs.has(r.id));
    state.samples=(state.samples||[]).filter(s=>s.projectId!==id&&!articles.has(s.articleId)&&!rfqs.has(s.rfqId));
    state.quotations=state.quotations.filter(q=>q.projectId!==id);
    for(const l of [...state.leads,...(state.inquiries||[])])if(l.projectId===id){delete l.projectId;delete l.convertedAt;if(l.status==='Go'||l.status==='Konverterat')l.status='Aktivt';}
    state.projects=state.projects.filter(p=>p.id!==id);
    return p;
  }
  function deleteArticle(state,id){
    const a=state.articles.find(a=>a.id===id);if(!a)throw Error('Artikeln saknas.');
    const p=state.projects.find(p=>p.id===a.projectId);if(!p)throw Error('Projektet saknas.');
    const rfqs=state.rfqs.filter(r=>r.articleId===id),rfqIds=new Set(rfqs.map(r=>r.id));
    p.deletedArticles||=[];
    p.deletedArticles.push({deletedAt:new Date().toISOString(),article:clone(a),rfqs:clone(rfqs),samples:clone((state.samples||[]).filter(s=>s.articleId===id||rfqIds.has(s.rfqId)))});
    for(const ph of p.phases||[]){ph.items=ph.items.filter(i=>i.articleId!==id);if(ph._itemIds)delete ph._itemIds[id];}
    if(p.projectRfq){p.projectRfq.articleIds=p.projectRfq.articleIds.filter(x=>x!==id);p.projectRfq.sampleIds=p.projectRfq.sampleIds.filter(x=>x!==id);}
    state.articles=state.articles.filter(a=>a.id!==id);
    state.rfqs=state.rfqs.filter(r=>r.articleId!==id);
    state.samples=(state.samples||[]).filter(s=>s.articleId!==id&&!rfqIds.has(s.rfqId));
    window.CDPProjectRfq?.sync(state,p);
    return p;
  }
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
  Object.assign(S,{articleName,migrate,specification,copyBom,saveTemplate,createRfq,recordAnswer,selectResponse,sampleFor,saveSample,rfqPhases,sampleAddress,articleSample,saveArticleSample,deleteArticle,deleteProject,
    createProject(state,values){const project=originalCreateProject(state,values);migrate(state);return project;},
    go(state,id){const project=originalGo(state,id);migrate(state);return project;}
  });
})();
(() => {
 const S=window.CDPStructure,copy=S.clone;
 const roles=['Kund','Beställare','Arkitekt/inredare'];
 function save(state,id,v){
  const name=String(v.name||'').trim();if(!name||!v.roles?.length||v.roles.some(r=>!roles.includes(r)))throw Error('Ange företagsnamn och minst en roll.');
  const previous=(state.customers||[]).find(c=>c.id===id);if(id&&!previous)throw Error('Företaget saknas.');
  if((!previous||previous.name.trim().toLocaleLowerCase('sv')!==name.toLocaleLowerCase('sv'))&&(state.customers||[]).some(c=>c.id!==id&&c.name.trim().toLocaleLowerCase('sv')===name.toLocaleLowerCase('sv')))throw Error('Företagsnamnet finns redan i registret. Öppna befintligt företag.');
  const contacts=(v.contacts||[]).map(c=>({...c,id:c.id||crypto.randomUUID(),name:String(c.name||'').trim()}));if(contacts.some(c=>!c.name))throw Error('Ange namn på varje kontaktperson.');if(contacts.filter(c=>c.primary&&c.active!==false).length>1)throw Error('Välj högst en aktiv primär kontakt.');
  const c={...previous,id:previous?.id||crypto.randomUUID(),name,billing:{...(previous?.billing||{}),name,...v.billing},delivery:previous?.delivery||{},sameAsBilling:previous?.sameAsBilling??true,roles:[...new Set(v.roles)],contacts,orgNumber:v.orgNumber||'',invoiceEmail:v.invoiceEmail||'',invoiceRequirements:v.invoiceRequirements||'',paymentTerms:v.paymentTerms||'',web:v.web||'',owner:v.owner||'',notes:v.notes||'',active:v.active!==false};
  if(previous)Object.assign(previous,c);else(state.customers||=[]).push(c);return c;
 }
 function link(state,p,v){
  const links={};for(const role of ['customer','buyer','architect','endCustomer']){const id=v[role]||'',contactId=v[role+'Contact']||'';const c=state.customers.find(c=>c.id===id);if(id&&!c)throw Error('Företaget saknas.');const old=p.parties?.[role];if(c?.active===false&&old?.companyId!==id&&!(role==='customer'&&p._customerId===c._dbId))throw Error('Välj ett aktivt företag.');const contact=c?.contacts?.find(c=>c.id===contactId);if(contactId&&(!contact||contact.active===false&&old?.contactId!==contactId))throw Error('Välj en aktiv kontaktperson.');links[role]={companyId:id,contactId};}
  const c=state.customers.find(c=>c.id===links.customer.companyId);if(c){
   const changed=p._customerId!==(c._dbId||c.id);p._customerId=c._dbId||c.id;
   if(changed||v.refreshCustomer){const contact=c.contacts?.find(x=>x.id===links.customer.contactId);p.customer=c.name;p.country=c.billing?.country||'';p.customerData={...(p.customerData||{}),sameAsBilling:false,billing:{...copy(c.billing||{}),name:c.name,orgNumber:c.orgNumber||'',invoiceEmail:c.invoiceEmail||'',invoiceRequirements:c.invoiceRequirements||'',contact:contact?.name||'',email:contact?.email||c.invoiceEmail||''},delivery:copy(p.customerData?.delivery||{})};if(c.paymentTerms)p.calculation={...p.calculation,paymentTerms:c.paymentTerms};}
  }else if(p._customerId)throw Error('Välj en kund för fakturering.');
  if(c&&p.parties?.customer?.contactId!==links.customer.contactId){const contact=c.contacts?.find(x=>x.id===links.customer.contactId);p.customerData.billing={...p.customerData.billing,contact:contact?.name||'',email:contact?.email||c.invoiceEmail||''};}
  p.parties=links;p.customerProjectReference=String(v.customerProjectReference||'');
 }
 window.CDPCustomers={roles,save,link};
})();
(() => {
 const S=window.CDPStructure;
 S.setProductionPrice=function(state,id,v){
  const a=state.articles.find(a=>a.id===id),p=state.projects.find(p=>p.id===a?.projectId);if(!a||!p)throw Error('Artikeln saknas.');
  const price=Number(v.price),rate=p.currency==='EUR'?1:Number(v.fxRate);
  if(v.price===''||v.price==null||!Number.isFinite(price)||price<0)throw Error('Ange ett produktionspris i EUR/m² (0 är tillåtet).');
  if(!Number.isFinite(rate)||rate<=0)throw Error('Ange valutakurs från EUR till projektvalutan.');
  const manufacturer=state.manufacturers.find(m=>m.id===v.manufacturerId);if(v.manufacturerId&&!manufacturer)throw Error('Tillverkaren saknas.');
  a.productionPriceHistory||=[];a.productionPriceHistory.push({at:new Date().toISOString(),previous:S.clone(a.selectedPrice||{price:a.pricePerSqm,priceUnit:a.priceUnit,currency:a.currency,fxRate:a.fxRate,manufacturer:a.manufacturer}),price,currency:'EUR',priceUnit:'per m²',fxRate:rate,manufacturerId:manufacturer?.id||'',manufacturer:manufacturer?.name||'',comment:String(v.comment||'')});
  delete a.selectedPrice;delete a.selectedRfqId;delete a._selectionId;delete a.phasePrices;
  Object.assign(a,{pricePerSqm:price,priceUnit:'per m²',currency:'EUR',fxRate:rate,status:'Godkänt',manufacturer:manufacturer?.name||'',manualProductionPrice:{price,fxRate:rate,manufacturerId:manufacturer?.id||'',comment:String(v.comment||''),at:new Date().toISOString()}});
  return a;
 };
})();
