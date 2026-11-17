/* Cappelen Dimyr Projects v6: additive migration and phase calculations. */
(() => {
  'use strict';
  const clone = x => JSON.parse(JSON.stringify(x));
  const uid = prefix => prefix + '-' + crypto.randomUUID();
  const today = () => new Date().toLocaleDateString('sv-SE');
  const defaults = () => ({deliveryTerm:'DDP', freightCost:0, freightMarkupPercent:15, customerFreight:0, dutyCost:0, importVatCost:0, otherImportCost:0, otherDeliveryCost:0, includeImportVatInCost:true, freightPresentation:'Separat rad'});
  function migrate(s) {
    const first = Number(s.schemaVersion || 0) < 6;
    for (const k of ['leads','projects','articles','quotations','inquiries','manufacturers','meetings','rfqs']) if (!Array.isArray(s[k])) s[k]=[];
    if (first) {
      s.inquiries.forEach(i => {
        let l=s.leads.find(l=>l.id===i.sourceLeadId || l.inquiryId===i.id || l.legacyInquiryId===i.id);
        if (!l) { l={id:'L-MIG-'+i.id, name:i.project, createdAt:i.received, comments:i.description||''}; s.leads.push(l); }
        l.legacyInquiryId=i.id;
        l.customer=l.customer||i.customer; l.country=l.country||i.country;
        for(const k of ['customerData','preliminaryScope','designFiles','history']) if(l[k]==null) l[k]=clone(i[k]|| (k==='customerData'?{}:[]));
        for(const k of ['value','currency','probability','agent','expectedStart','description']) if(l[k]==null) l[k]=i[k];
        const p=s.projects.find(p=>p.id===i.projectId || p.sourceInquiryId===i.id || (i.status==='Go' && p.name===i.project && p.customer===i.customer));
        if(p){l.projectId=p.id;p.sourceLeadId=l.id;l.status='Go';} else l.status=i.status==='No Go'?'No Go':'Aktivt';
      });
      s.leads.forEach(l=>{if(l.status==='Konverterat')l.status=l.projectId?'Go':'Aktivt';});
    }
    s.projects.forEach(p=>{
      p.projectType = p.projectType === "simple" ? "simple" : "complete";
      p.phaseMode = p.phaseMode === "single" ? "single" : "multiple";
      if(!Array.isArray(p.phases)) p.phases=[{id:'PH-'+p.id+'-1',name:"Phase 1",productionStart:'',deliveryDate:p.deliveryDate||'',items:s.articles.filter(a=>a.projectId===p.id).map(a=>({articleId:a.id,quantity:Number(a.quantity)||1})),calculation:{...defaults(),...clone(p.calculation||{})}}];
      syncSinglePhase(s,p);
      p.phases.forEach(ph=>{if(!Array.isArray(ph.items))ph.items=[];ph.calculation={...defaults(),...(ph.calculation||{})};});
      p.calculation={targetMargin:45,validityDays:30,paymentTerms:"50% on order / 50% before delivery",...(p.calculation||{})};
    });
    s.articles.forEach(a=>{if(!Array.isArray(a.bom))a.bom=[];if(a.specification==null)a.specification='';});
    s.schemaVersion=6;
    return s;
  }
  // A single delivery uses the same phase model as costing and RFQs, without manual allocation.
  function syncSinglePhase(s,p){
    if(p.phaseMode!=='single')return;
    if(p.phases?.length>1)throw Error("Multiple phases exist. Keep Multiple phases to preserve their allocations.");
    p.phases ||= [];
    if(!p.phases.length)p.phases.push({id:uid('PH'),name:'Delivery',productionStart:'',deliveryDate:'',items:[],calculation:defaults()});
    const ph=p.phases[0],old=new Map((ph.items||[]).map(i=>[i.articleId,i]));
    ph.items=s.articles.filter(a=>a.projectId===p.id).map(a=>({...old.get(a.id),articleId:a.id,quantity:Number(a.quantity??1)}));
  }
  function setProjectOptions(s,p,v){
    if(!['simple','complete'].includes(v.projectType)||!['single','multiple'].includes(v.phaseMode))throw Error("Select a project type and delivery setup.");
    if(v.projectType==='simple'&&p.projectType!=='simple'){
      const active=[p.projectRfq,p.preliminaryRfq].some(g=>g?.recipients?.some(r=>r.publishedRevision&&!r.withdrawn));
      if(active||s.rfqs.some(r=>r.projectId===p.id&&r.sentAt)||(p.modelSampleOrders||[]).some(o=>o.sentAt))throw Error("This project has sent RFQs or full-size sample orders. Keep Complete while these records are in use.");
    }
    if(v.phaseMode==='single'&&p.phaseMode!=='single'){
      if(p.phases.length>1)throw Error("This project has multiple phases. Keep Multiple phases to preserve their dates, costs and allocations.");
      const items=p.phases[0]?.items||[];
      if(items.length&&(s.articles.filter(a=>a.projectId===p.id).some(a=>items.filter(i=>i.articleId===a.id).length!==1||Number(items.find(i=>i.articleId===a.id)?.quantity)!==Number(a.quantity??1))||items.some(i=>!s.articles.some(a=>a.id===i.articleId&&a.projectId===p.id))))throw Error("The phase has a custom article allocation. Match it to the full project quantities before selecting One phase.");
    }
    if(v.phaseMode==='single'&&v.productionStart&&v.deliveryDate&&v.productionStart>v.deliveryDate)throw Error("Production start must precede the delivery date.");
    p.projectType=v.projectType;p.phaseMode=v.phaseMode;
    syncSinglePhase(s,p);
    if(p.phaseMode==='single'){
      if(v.productionStart!==undefined)p.phases[0].productionStart=v.productionStart;
      if(v.deliveryDate!==undefined)p.phases[0].deliveryDate=v.deliveryDate;
    }
    return p;
  }
  function go(s,id){
    const l=s.leads.find(l=>l.id===id);if(!l)throw Error("The lead is missing.");
    let p=s.projects.find(p=>p.id===l.projectId || p.sourceLeadId===id);
    if(!p){
      const c=clone(l.customerData||{}),b=c.billing||{...c,name:c.name||l.customer||''};
      const year=String(new Date().getFullYear()).slice(-2),prefix='P-'+year+'-';
      const number=Math.max(0,...s.projects.map(p=>p.id.startsWith(prefix)?Number(p.id.slice(prefix.length))||0:0))+1;
      p={id:window.CDPRemote?crypto.randomUUID():prefix+String(number).padStart(4,'0'),sourceLeadId:id,phases:[],name:l.name,customer:l.customer||b.name||'',country:l.country||'',currency:l.currency||'EUR',value:Number(l.value)||0,probability:Number(l.probability)||20,owner:'DE',phase:'Kalkyl',businessStatus:'Aktivt',next:"Plan articles and phases",agent:l.agent||'',customerData:{sameAsBilling:c.sameAsBilling!==false,billing:b,delivery:c.delivery||clone(b)},preliminaryScope:clone(l.preliminaryScope||[]),designFiles:clone(l.designFiles||[]),createdAt:today()};
      s.projects.unshift(p);migrate(s);
    }
    l.projectId=p.id;l.status='Go';l.convertedAt=today();
    return p;
  }
  function area(a){return a.shape==='Specialform'?Number(a.manualArea)||0:a.shape==='Rund'?Math.PI*Math.pow(Number(a.widthCm)/200,2):(Number(a.widthCm)||0)*(Number(a.lengthCm)||0)/10000;}
  function price(a){return a.selectedPrice?{...a.selectedPrice,pricePerSqm:a.selectedPrice.price}:a;}
  const cents=n=>Math.round((n+Number.EPSILON)*100)/100;
  const isProductionSamples=name=>String(name||'').toLowerCase().replace(/\s+/g,'').replace(/&amp;/g,'&')==='production&testsamples';
  function calculate(s,p){
    syncSinglePhase(s,p);
    const errors=[],warnings=[];
    const margin=Number(p.calculation?.targetMargin ?? 45);
    if(!Number.isFinite(margin)||margin<0||margin>=100)errors.push("Margin must be at least 0 and less than 100%.");
    const counts=new Map();
    (p.phases||[]).forEach(ph=>ph.items.forEach(i=>counts.set(i.articleId,(counts.get(i.articleId)||0)+Number(i.quantity))));
    s.articles.filter(a=>a.projectId===p.id).forEach(a=>{if(!counts.has(a.id))warnings.push(a.name+": not assigned to any phase.");});
    const phases=(p.phases||[]).map(ph=>{
      const c={...defaults(),...ph.calculation};
      if(!ph.deliveryDate)warnings.push(ph.name+": delivery date missing.");
      if(ph.productionStart&&ph.deliveryDate&&ph.productionStart>ph.deliveryDate)errors.push(ph.name+": production start is after delivery.");
      const items=ph.items.map(i=>{
        const a=s.articles.find(a=>a.id===i.articleId&&a.projectId===p.id);
        if(!a){errors.push(ph.name+": article missing.");return null;}
        const selected=price(a),r=selected.phasePrices?{...selected,pricePerSqm:selected.phasePrices[ph.id]}:selected,qty=Number(i.quantity),rate=r.currency&&r.currency!==p.currency?Number(r.fxRate):1;
        if(!Number.isFinite(qty)||qty<=0)errors.push(a.name+": quantity must be greater than 0.");
        if(!Number.isFinite(rate)||rate<=0)errors.push(a.name+": enter the exchange rate to "+p.currency+'.');
        if(!Number.isFinite(Number(r.pricePerSqm))||Number(r.pricePerSqm)<0)errors.push(a.name+": invalid production price.");
        if(r.status!=='Godkänt')warnings.push(a.name+": production price is not approved.");
        if(Number(r.moq)>Number(counts.get(a.id)))warnings.push(a.name+": total quantity is below MOQ "+r.moq+'.');
        const unit=r.priceUnit||'per m²';
        // Legacy fixed prices represent the complete article quantity; allocate once across phases.
        const base=Number(r.pricePerSqm)||0;
        const cost=(unit==='fast pris'?(base+(Number(a.additionalCost)||0))*qty/counts.get(a.id):((unit==='per m²'?area(a)*base:base)+(Number(a.additionalCost)||0))*qty)*(rate||0);
        const productName=(p.products||[]).find(product=>product.id===a.productId)?.name||'',productionSample=isProductionSamples(productName),supplement=Number(a.shippingSupplement||0),planned=Number(a.quantity);
        if(productionSample&&(!Number.isFinite(supplement)||supplement<0||!Number.isFinite(planned)||planned<=0))errors.push(a.name+': enter a valid shipping supplement and quantity.');
        const shippingSupplementCost=productionSample?supplement*qty/planned:0;
        return {...clone(a),productionSample,shippingSupplementCost,productName:(p.products||[]).find(product=>product.id===a.productId)?.name||'',articleId:a.id,quantity:qty,area:area(a),totalArea:area(a)*qty,manufacturer:r.manufacturer||a.manufacturer,pricePerSqm:base,priceUnit:unit,cost,unitCost:cost/qty,phaseId:ph.id};
      }).filter(Boolean);
      if(['markup','markup-import'].includes(c.freightPricing)){
        if(!Number.isFinite(Number(c.freightMarkupPercent))||Number(c.freightMarkupPercent)<0)errors.push(ph.name+': freight markup must be zero or greater.');
        c.customerFreight=cents(Number(c.freightCost)*(1+Number(c.freightMarkupPercent)/100)+(c.freightPricing==='markup-import'&&c.deliveryTerm==='DDP'?Number(c.otherImportCost)||0:0));
      }
      for(const k of ['freightCost','customerFreight','otherDeliveryCost',...(c.deliveryTerm==='DDP'?['dutyCost','importVatCost','otherImportCost']:[])])if(!Number.isFinite(Number(c[k]))||Number(c[k])<0)errors.push(ph.name+": invalid delivery cost.");
      const productionCost=items.reduce((n,a)=>n+a.cost,0),freightCost=Number(c.freightCost)||0;
      const dutyCost=c.deliveryTerm==='DDP'?Number(c.dutyCost)||0:0,importVatCost=c.deliveryTerm==='DDP'&&c.includeImportVatInCost?Number(c.importVatCost)||0:0,otherImportCost=c.deliveryTerm==='DDP'?Number(c.otherImportCost)||0:0;
      const shippingSupplementCost=items.reduce((n,a)=>n+a.shippingSupplementCost,0),sampleCost=items.filter(a=>a.productionSample).reduce((n,a)=>n+a.cost+a.shippingSupplementCost,0);
      const totalCost=productionCost+shippingSupplementCost+freightCost+dutyCost+importVatCost+otherImportCost+(Number(c.otherDeliveryCost)||0);
      const sampleQuotedCost=items.filter(a=>a.productionSample).reduce((n,a)=>n+cents(a.cost+a.shippingSupplementCost),0);
      const salesPrice=cents(['markup','markup-import'].includes(c.freightPricing)?(totalCost-sampleCost-freightCost-(c.freightPricing==='markup-import'?otherImportCost:0))/(1-margin/100)+c.customerFreight+sampleQuotedCost:(totalCost-sampleCost)/(1-margin/100)+sampleQuotedCost);
      const regular=items.filter(a=>!a.productionSample),regularCost=regular.reduce((n,a)=>n+a.cost,0);
      const freightShown=items.length&&!regular.length?cents(salesPrice-items.reduce((n,a)=>n+cents(a.cost+a.shippingSupplementCost),0)):(c.freightPresentation==='Separat rad'?Number(c.customerFreight)||0:0);
      const freightLabel=items.length&&!regular.length?'Freight & other project costs':'Freight';
      if(freightShown>salesPrice)errors.push(ph.name+": freight charged exceeds the phase quotation price.");
      if(!items.length&&salesPrice>freightShown)errors.push(ph.name+": add articles to allocate the quotation price.");
      let sampleSales=0;for(const a of items.filter(a=>a.productionSample)){a.salesTotal=cents(a.cost+a.shippingSupplementCost);a.salesUnit=a.salesTotal/a.quantity;sampleSales+=a.salesTotal;}
      let allocated=0;regular.forEach((a,index)=>{a.salesTotal=index===regular.length-1?cents(salesPrice-freightShown-sampleSales-allocated):cents((salesPrice-freightShown-sampleSales)*(regularCost?a.cost/regularCost:1/regular.length));allocated+=a.salesTotal;a.salesUnit=a.salesTotal/a.quantity;});
      return {...clone(ph),items,calculation:c,productionCost,shippingSupplementCost,sampleCost,sampleQuotedCost,freightLabel,freightCost,dutyCost,importVatCost,otherImportCost,totalCost,salesPrice,freightShown};
    });
    const sum=k=>phases.reduce((n,p)=>n+p[k],0);
    // Reconcile the final cent against the project formula, not a sum of rounded phases.
    const correction=cents(cents(phases.reduce((n,ph)=>n+(['markup','markup-import'].includes(ph.calculation.freightPricing)?(ph.totalCost-ph.sampleCost-ph.freightCost-(ph.calculation.freightPricing==='markup-import'?ph.otherImportCost:0))/(1-margin/100)+ph.calculation.customerFreight+ph.sampleQuotedCost:(ph.totalCost-ph.sampleCost)/(1-margin/100)+ph.sampleQuotedCost),0))-sum('salesPrice'));
    const last=phases.filter(ph=>ph.items.length).at(-1);
    if(last && correction){last.salesPrice=cents(last.salesPrice+correction);const item=last.items.filter(a=>!a.productionSample).at(-1);if(item){item.salesTotal=cents(item.salesTotal+correction);item.salesUnit=item.salesTotal/item.quantity;}else last.freightShown=cents(last.freightShown+correction);}
    return {phases,productionCost:sum('productionCost'),shippingSupplementCost:sum('shippingSupplementCost'),freightCost:sum('freightCost'),dutyCost:sum('dutyCost'),importVatCost:sum('importVatCost'),otherImportCost:sum('otherImportCost'),totalCost:sum('totalCost'),salesPrice:cents(sum('salesPrice')),grossProfit:sum('salesPrice')-sum('totalCost'),margin,errors:[...new Set(errors)],warnings:[...new Set(warnings)]};
  }
  function snapshot(s,p){const pc=calculate(s,p);if(pc.errors.length)throw Error(pc.errors.join('\n'));if(!pc.phases.some(ph=>ph.items.length))throw Error("Add articles to at least one phase.");return {projectId:p.id,project:p.name,currency:p.currency||'EUR',amount:pc.salesPrice,margin:pc.margin,status:'Utkast',created:today(),articleSnapshots:clone(pc.phases.flatMap(ph=>ph.items)),phaseSnapshots:clone(pc.phases),calculationSnapshot:{...clone(p.calculation),notes:[p.calculation?.notes,pc.phases.some(ph=>ph.items.some(a=>a.productionSample))?'The price for “Production & test samples” includes shipping.':''].filter(Boolean).join('\n')},costSnapshot:clone(pc),companySnapshot:clone(s.company||{}),customerSnapshot:clone(p.customerData||{})};}
  function isoWeek(date){const d=new Date(date);d.setUTCHours(0,0,0,0);d.setUTCDate(d.getUTCDate()+4-(d.getUTCDay()||7));const year=d.getUTCFullYear(),start=new Date(Date.UTC(year,0,1)),week=Math.ceil(((d-start)/86400000+1)/7);return year+'-W'+String(week).padStart(2,'0');}
  function weekMonday(value){const match=/^(\d{4})-W(\d{2})$/.exec(value||'');if(!match||Number(match[1])<1900||Number(match[1])>9999)throw Error('Enter a valid delivery week (YYYY-Www).');const d=new Date(Date.UTC(Number(match[1]),0,4));d.setUTCDate(d.getUTCDate()-(d.getUTCDay()||7)+1+(Number(match[2])-1)*7);if(isoWeek(d)!==value)throw Error('Enter a valid delivery week (YYYY-Www).');return d;}
  function validateDeliveryWeek(value){if(value)weekMonday(value);return value||'';}
  function planningSettings(values){const result={};for(const key of ['productionWeeks','airWeeks','seaWeeks']){const n=Number(values[key]);if(values[key]==null||String(values[key]).trim()===''||!Number.isInteger(n)||n<0||n>520)throw Error('Enter whole weeks from 0 to 520 for all three times.');result[key]=n;}return result;}
  function productionStartWeeks(week,settings){if(!week)return {air:'',sea:''};const monday=weekMonday(week);let times;try{times=planningSettings(settings||{});}catch{return {air:'',sea:'',missingSettings:true};}const start=freight=>{const d=new Date(monday);d.setUTCDate(d.getUTCDate()-7*(times.productionWeeks+freight));return isoWeek(d);};return {air:start(times.airWeeks),sea:start(times.seaWeeks)};}
  function createProject(s,v){
    const name=String(v.name||'').trim();if(!name)throw Error("Enter a project name.");
    const value=Number(v.value||0),probability=Number(v.probability??20);
    if(!Number.isFinite(value)||value<0||!Number.isFinite(probability)||probability<0||probability>100)throw Error("Check the value and probability.");
    const prefix='P-'+String(new Date().getFullYear()).slice(-2)+'-';
    const n=Math.max(0,...s.projects.map(p=>p.id.startsWith(prefix)?Number(p.id.slice(prefix.length))||0:0))+1;
    const requestedDeliveryWeek=validateDeliveryWeek(v.requestedDeliveryWeek),customer=String(v.customer||'').trim(),country=String(v.country||'').trim();
    const billing={name:customer,country,address:'',zip:'',city:'',vatNumber:'',contact:'',email:''};
    const p={requestedDeliveryWeek,id:window.CDPRemote?crypto.randomUUID():prefix+String(n).padStart(4,'0'),name,customer,country,currency:v.currency||'EUR',value,probability,owner:v.owner||'DE',phase:'Kalkyl',businessStatus:'Aktivt',next:"Plan articles and phases",createdAt:today(),createdDirectly:true,projectType:v.projectType==='simple'?'simple':'complete',phaseMode:v.phaseMode==='single'?'single':'multiple',phases:[],description:v.description||'',customerData:{sameAsBilling:true,billing,delivery:{...billing,phone:''}},preliminaryScope:[],designFiles:[]};
    s.projects.unshift(p);migrate(s);return p;
  }
  function loseProject(s,id,v){
    const p=s.projects.find(p=>p.id===id);if(!p)throw Error("The project is missing.");
    if(p.businessStatus==='Vunnet'||p.phase==='Vunnet'||s.quotations.some(q=>q.projectId===id&&q.status==='Accepterad'))throw Error("An accepted project cannot be marked as lost.");
    if(p.businessStatus==='Förlorat')return p;
    const reason=String(v.reason||'').trim(),lostAt=v.lostAt||today();if(!reason)throw Error("Enter the reason for the loss.");
    if(!/^\d{4}-\d{2}-\d{2}$/.test(lostAt)||Number.isNaN(Date.parse(lostAt)))throw Error("Enter a valid date.");
    p.beforeLoss={phase:p.phase,probability:p.probability,next:p.next};
    Object.assign(p,{businessStatus:'Förlorat',phase:'Förlorat',probability:0,lostAt,lossReason:reason,lossComment:String(v.comment||'').trim(),next:"Lost: "+reason});
    p.history=p.history||[];p.history.push({status:'Förlorat',date:lostAt,reason,comment:p.lossComment});
    s.quotations.filter(q=>q.projectId===id).forEach(q=>{if(['Skickad','Revidering begärd'].includes(q.status))q.status='Avböjd';else if(['Utkast','Intern granskning'].includes(q.status))q.status='Återkallad';});
    return p;
  }
  function reopenProject(s,id){const p=s.projects.find(p=>p.id===id);if(!p)throw Error("The project is missing.");if(p.businessStatus!=='Förlorat')return p;const old=p.beforeLoss||{};Object.assign(p,{businessStatus:'Aktivt',phase:['Kalkyl','Offert skickad','Förhandling'].includes(old.phase)?old.phase:'Kalkyl',probability:old.probability??20,next:old.next||"Planera next steg"});p.history=p.history||[];p.history.push({status:'Aktivt',date:today(),note:"Reactivated"});return p;}
  window.CDPStructure={validateDeliveryWeek,planningSettings,productionStartWeeks,isProductionSamples,migrate,go,calculate,snapshot,area,price,uid,today,defaults,clone,createProject,loseProject,reopenProject,syncSinglePhase,setProjectOptions};
})();
