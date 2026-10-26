/* Project RFQs. The supplier preview is an internal Projects tool, not an auth boundary. */
(() => {
  'use strict';
  const S=window.CDPStructure,copy=S.clone,now=()=>new Date().toISOString();
  const unique=a=>[...new Set(a)];
  const key=(articleId,phaseId)=>JSON.stringify([articleId,phaseId||'']);
  function content(state,p,ids,sampleIds){
    const lines=[];
    for(const id of ids){
      const a=state.articles.find(a=>a.id===id&&a.projectId===p.id);if(!a)continue;
      const spec={shape:'',widthCm:0,lengthCm:0,manualArea:0,specification:'',designReferences:[],id:a.id,code:a.code||'',name:a.name,...S.specification(a)};
      // Storage identities and ordering are not supplier specification changes.
      spec.bom=(a.bom||[]).map(b=>({name:b.name||'',quantity:Number(b.quantity)||0,unit:b.unit||'st',notes:b.notes||''}));
      const phases=(p.phases||[]).flatMap(ph=>(ph.items||[]).filter(i=>i.articleId===id).map(i=>({phaseId:ph.id,phase:ph.name,quantity:Number(i.quantity),productionStart:ph.productionStart||'',deliveryDate:ph.deliveryDate||''})));
      for(const ph of phases.length?phases:[{phaseId:'',phase:'Ej tilldelad fas',quantity:Number(a.quantity)||1,productionStart:'',deliveryDate:''}])lines.push({key:key(id,ph.phaseId),articleId:id,article:copy(spec),...ph,sample:false,area:S.area(a)});
      if(sampleIds.includes(id))lines.push({key:'sample:'+id,articleId:id,article:copy(spec),phaseId:'',phase:'',quantity:1,productionStart:'',deliveryDate:'ASAP',sample:true,area:0});
    }
    return lines;
  }
  function validateConfig(state,p,ids,mids,samples){
    if(!ids.length||!mids.length)throw Error('Välj minst en artikel och en tillverkare.');
    if(ids.some(id=>!state.articles.some(a=>a.id===id&&a.projectId===p.id)))throw Error('Artikeln tillhör inte projektet.');
    if(mids.some(id=>!state.manufacturers.some(m=>m.id===id&&m.active!==false)))throw Error('Välj aktiva tillverkare.');
    if(samples.some(id=>!ids.includes(id)))throw Error('Sample måste höra till en vald artikel.');
  }
  function recipient(g,mid){const r=g.recipients.find(r=>r.manufacturerId===mid);if(!r)throw Error('Tillverkaren är inte vald för denna RFQ.');return r;}
  function configure(state,p,ids,mids,samples=[]){
    ids=unique(ids);mids=unique(mids);samples=unique(samples);validateConfig(state,p,ids,mids,samples);
    if(!p.projectRfq){
      const id=S.uid('RFQ');
      p.projectRfq={id,number:'RFQ-'+new Date().getFullYear()+'-'+id.slice(4).toUpperCase(),createdAt:now(),revision:1,articleIds:ids,sampleIds:samples,lines:content(state,p,ids,samples),recipients:[],history:[]};
    }
    const g=p.projectRfq;
    g.articleIds=ids;g.sampleIds=samples;
    // Recipients cannot be removed implicitly; withdrawal is a separate action.
    mids.forEach(mid=>{if(!g.recipients.some(r=>r.manufacturerId===mid))g.recipients.push({manufacturerId:mid,answers:{},history:[],completedAt:null,publishedRevision:0,withdrawn:false});});
    sync(state,p);return g;
  }
  function sync(state,p){
    const g=p.projectRfq;if(!g)return;
    const lines=content(state,p,g.articleIds,g.sampleIds);
    const canonical=x=>JSON.stringify(x,(_k,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.keys(v).sort().map(k=>[k,v[k]])):v);
    if(canonical(lines)===canonical(g.lines))return;
    g.history.push({revision:g.revision,at:now(),lines:copy(g.lines)});g.revision++;g.lines=lines;
    for(const r of g.recipients){
      if(r.completedAt){r.history.push({at:now(),type:'request-changed',completedAt:r.completedAt,revision:r.completedRevision,answers:copy(r.answers)});r.completedAt=null;}
      if(r.publishedRevision)r.needsConfirmation=true;
    }
  }
  function status(g,r){
    const lines=g.lines.filter(l=>!l.sample);let offered=0,declined=0,total=0;
    for(const l of lines){const a=r.answers[l.key];if(a?.decision==='accepted'&&Number.isFinite(a.price)&&a.price>0){offered++;total+=l.area*l.quantity*a.price;}else if(a?.decision==='declined')declined++;}
    const complete=Boolean(r.completedAt&&r.completedRevision===g.revision&&!r.withdrawn);
    return {offered,declined,count:lines.length,pending:lines.length-offered-declined,total:Math.round((total+Number.EPSILON)*100)/100,complete,full:offered===lines.length&&lines.length>0,label:r.withdrawn?'Återkallad':!r.publishedRevision?'Ej skickad':r.needsConfirmation?'Ändrad – behöver bekräftas':complete?(offered===lines.length?'Completed · Fullständig offert':'Completed · Delvis offererad'):offered+declined?'Påbörjad':'Inväntar svar'};
  }
  function validateLines(g){
    if(!g.lines.some(l=>!l.sample))throw Error('RFQ saknar artiklar.');
    if(g.lines.some(l=>!l.sample&&(!Number.isFinite(l.area)||l.area<=0||!Number.isSafeInteger(l.quantity)||l.quantity<1||!l.phaseId||!l.deliveryDate||!l.productionStart||l.productionStart>l.deliveryDate)))throw Error('Cappelen behöver kontrollera BOM-mått, fas, antal, produktionsstart och leveransdatum.');
  }
  function publish(state,p,mid){
    sync(state,p);const g=p.projectRfq,r=recipient(g,mid);validateLines(g);
    if(!state.manufacturers.some(m=>m.id===mid&&m.active!==false))throw Error('Tillverkaren är inaktiv.');
    if(r.publishedRevision===g.revision&&!r.withdrawn)return;
    r.sentAt=now();r.publishedRevision=g.revision;r.withdrawn=false;r.history.push({type:'published',revision:g.revision,at:r.sentAt});
  }
  function editable(g,r){if(!r.publishedRevision||r.withdrawn)throw Error('RFQ är inte tillgänglig.');if(r.completedAt)throw Error('Svaret är inlämnat. Cappelen måste öppna det för revidering.');}
  function saveAnswer(state,p,mid,lineKey,values){
    sync(state,p);const g=p.projectRfq,r=recipient(g,mid);editable(g,r);
    if(values.revision!==g.revision)throw Error('RFQ har ändrats. Öppna den aktuella versionen innan du svarar.');
    const l=g.lines.find(l=>l.key===lineKey&&!l.sample);if(!l)throw Error('Artikelraden saknas.');
    if(!['pending','accepted','declined'].includes(values.decision))throw Error('Välj svarsstatus.');
    const price=values.decision==='accepted'?Number(values.price):null;
    if(values.decision==='accepted'&&(values.price===''||values.price==null||!Number.isFinite(price)||price<=0))throw Error('Ange ett pris större än 0 EUR/m².');
    if(r.answers[lineKey])r.history.push({at:now(),type:'answer',key:lineKey,answer:copy(r.answers[lineKey])});
    r.answers[lineKey]={decision:values.decision,price,currency:'EUR',comment:String(values.comment||'').slice(0,4000),updatedAt:now()};
  }
  function complete(state,p,mid,revision){
    sync(state,p);const g=p.projectRfq,r=recipient(g,mid);editable(g,r);
    if(revision!==g.revision)throw Error('RFQ har ändrats. Granska den nya versionen.');
    validateLines(g);
    if(!g.lines.some(l=>!l.sample)||status(g,r).pending)throw Error('Besvara varje artikel med pris eller Kan inte offerera före Completed.');
    r.completedAt=now();r.completedRevision=g.revision;r.needsConfirmation=false;r.history.push({type:'completed',at:r.completedAt,revision:g.revision,answers:copy(r.answers)});
  }
  function reopen(p,mid){const r=recipient(p.projectRfq,mid);if(!r.completedAt) return;r.history.push({type:'reopened',at:now(),completedAt:r.completedAt,answers:copy(r.answers)});r.completedAt=null;r.needsConfirmation=true;}
  function withdraw(p,mid){const r=recipient(p.projectRfq,mid);r.withdrawn=true;r.history.push({type:'withdrawn',at:now()});}
  // Explicit migration retains every old RFQ and selected-price snapshot.
  function adopt(state,p){
    if(p.projectRfq)return p.projectRfq;
    const old=state.rfqs.filter(r=>r.projectId===p.id);if(!old.length)return null;
    const ids=unique(old.map(r=>r.articleId)).filter(id=>state.articles.some(a=>a.id===id&&a.projectId===p.id));
    const mids=unique(old.map(r=>r.manufacturerId));
    if(!ids.length)return null;
    const samples=unique(old.filter(r=>S.sampleFor(state,r)?.required||r.requestSnapshot?.sample?.required).map(r=>r.articleId));
    // Historical recipients can be inactive. Preserve them without republishing.
    const id=S.uid('RFQ');p.projectRfq={id,number:'RFQ-'+new Date().getFullYear()+'-'+id.slice(4).toUpperCase(),createdAt:now(),revision:1,articleIds:ids,sampleIds:samples,lines:content(state,p,ids,samples),recipients:[],history:[],legacyIds:old.map(r=>r.id)};
    const g=p.projectRfq;
    for(const mid of mids){const rows=old.filter(r=>r.manufacturerId===mid),r={manufacturerId:mid,answers:{},history:[],publishedRevision:0,completedAt:null,withdrawn:false};
      for(const l of g.lines.filter(l=>!l.sample)){const prior=rows.filter(x=>x.articleId===l.articleId).at(-1);if(!prior)continue;
        let price=prior.price;if(prior.priceUnit==='per styck')price=price/l.area;
        const valid=prior.decision==='accepted'&&prior.currency==='EUR'&&['per styck','per m²'].includes(prior.priceUnit)&&Number.isFinite(price)&&price>0;
        r.answers[l.key]={decision:valid?'accepted':prior.decision==='declined'?'declined':'pending',price:valid?price:null,currency:'EUR',comment:prior.comment||'',legacyRfqId:prior.id};
      }g.recipients.push(r);
    }return g;
  }
  function supplierView(state,mid){
    // Return an allowlist of supplier data; no customer, margin or other recipient fields.
    return state.projects.flatMap(p=>{const g=p.projectRfq,r=g?.recipients.find(r=>r.manufacturerId===mid);if(!r?.publishedRevision||r.withdrawn)return [];
      return [{projectId:p.id,id:g.id,number:g.number,revision:g.revision,sentAt:r.sentAt,lines:copy(g.lines),answers:copy(r.answers),...status(g,r),completedAt:r.completedAt}];});
  }
  function selectArticle(state,p,mid,articleId,fxRate=1){
    const g=p.projectRfq,r=recipient(g,mid);if(!status(g,r).complete)throw Error('Tillverkaren måste slutföra sitt svar först.');
    const lines=g.lines.filter(l=>!l.sample&&l.articleId===articleId),a=state.articles.find(a=>a.id===articleId&&a.projectId===p.id);
    if(!a||!lines.length||lines.some(l=>r.answers[l.key]?.decision!=='accepted'))throw Error('Artikeln måste vara offererad i samtliga faser.');
    if(!Number.isFinite(Number(fxRate))||Number(fxRate)<=0)throw Error('Ange valutakurs från EUR till projektvaluta.');
    const response=S.createRfq(state,p,a,mid);S.recordAnswer(state,response,{decision:'accepted',price:r.answers[lines[0].key].price,currency:'EUR',priceUnit:'per m²',fxRate:p.currency==='EUR'?1:Number(fxRate),status:'Godkänt'});
    response.phasePrices=Object.fromEntries(lines.map(l=>[l.phaseId,r.answers[l.key].price]));response.projectRfqId=g.id;response.projectRfqRevision=g.revision;S.selectResponse(state,response);return response;
  }
  window.CDPProjectRfq={configure,sync,status,publish,saveAnswer,complete,reopen,withdraw,adopt,supplierView,selectArticle,recipient};
})();
