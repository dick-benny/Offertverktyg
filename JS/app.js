(() => {
  "use strict";

  const store = window.CDPData.createRemoteStore();
  const state = store.getState();
  let quotationFilter = "active";
  let projectFilter = "active";
  let leadFilter = "active";
  let meetingFilter = "active";
  let inquiryMode = "active";
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const money = (value, currency = "EUR") => new Intl.NumberFormat("en-GB", { style: "currency", currency, minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
  const decimal = value => new Intl.NumberFormat("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value || 0);
  const date = value => value ? new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(new Date(`${value}T12:00:00`)) : "—";
  const month = value => value ? new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric" }).format(new Date(`${value}-01T12:00:00`)) : "Not specified";
  const leadMonth = value => {
    if (!value) return `<strong>—</strong><span>Start</span>`;
    const monthDate = new Date(`${value}-01T12:00:00`);
    return `<strong>${new Intl.DateTimeFormat("en-GB", { month: "short" }).format(monthDate)}</strong><span>${monthDate.getFullYear()}</span>`;
  };
  const esc = value => String(value ?? "").replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[character]));
  const statusTone = status => ({ "Aktivt": ["#e8edef", "#617783"], "Konverterat": ["#e6ebe3", "#536851"], "Ny": ["#e8edef", "#617783"], "Bedöms": ["#f3ecdf", "#8a6e42"], "Go": ["#e6ebe3", "#536851"], "No Go": ["#f3e6e2", "#8b584f"], "Skickad": ["#e8edef", "#617783"], "Utkast": ["#f3ecdf", "#8a6e42"], "Ersatt": ["#ecece8", "#74786f"], "Accepterad": ["#e6ebe3", "#536851"], "Avböjd": ["#f3e6e2", "#8b584f"], "Utgången": ["#ecece8", "#74786f"], "Återkallad": ["#ecece8", "#74786f"], "Vunnet": ["#e6ebe3", "#536851"], "Förfrågan": ["#e8edef", "#617783"], "Förhandlas": ["#f3ecdf", "#8a6e42"], "Godkänt": ["#e6ebe3", "#536851"], "Prisförfrågan": ["#e8edef", "#617783"], "Förhandling": ["#f3ecdf", "#8a6e42"], "Pris godkänt": ["#e6ebe3", "#536851"], "Första pris": ["#e8edef", "#617783"], "Förhandlat": ["#f3ecdf", "#8a6e42"], "Väntar orderunderlag": ["#f3ecdf", "#8a6e42"], "Orderbekräftad": ["#e8edef", "#617783"], "Produktion": ["#e8edef", "#617783"], "Klar för leverans": ["#f3ecdf", "#8a6e42"], "Levererad": ["#e6ebe3", "#536851"], "Avslutad": ["#e6ebe3", "#536851"] }[status] || ["#ecece8", "#666"]);

  function saveState() { CDPStructure.products.sync(state); modalDataRevision++; state.projects.forEach(p=>{CDPStructure.syncSinglePhase(state,p);window.CDPProjectRfq?.sync(state,p);}); return store.save(); }
  function statusBadge(status) { const [bg, color] = statusTone(status); return `<span class="status" style="--status-bg:${bg};--status-color:${color}">${esc(uiLabel(status))}</span>`; }
  function articleArea(article) {
    if (article.shape === "Specialform") return Number(article.manualArea) || 0;
    if (article.shape === "Rund") return Math.PI * Math.pow((Number(article.widthCm) || 0) / 200, 2);
    return ((Number(article.widthCm) || 0) * (Number(article.lengthCm) || 0)) / 10000;
  }
  function articleUnitCost(article) {
    const price = Number(article.pricePerSqm) || 0;
    const extra = Number(article.additionalCost) || 0;
    const unit = article.priceUnit || "per m²";
    if (unit === "per styck") return price + extra;
    if (unit === "fast pris") return price + extra;
    return articleArea(article) * price + extra;
  }
  function articleCost(article) {
    const quantity = Number(article.quantity) || 1;
    if ((article.priceUnit || "per m²") === "fast pris") return articleUnitCost(article);
    return articleUnitCost(article) * quantity;
  }
  function priceUnitLabel(unit) { return unit === "per styck" ? "/item" : unit === "fast pris" ? " fixed" : "/m²"; }
  function articleTotalArea(article) { return articleArea(article) * (Number(article.quantity) || 1); }
  function legacy_projectCalculation(project, articles) {
    const calc = project.calculation || {};
    const productionCost = articles.reduce((sum, article) => sum + articleCost(article), 0);
    const freightCost = Number(calc.freightCost) || 0;
    const dutyCost = calc.deliveryTerm === "DDP" ? (Number(calc.dutyCost) || 0) : 0;
    const importVatCost = calc.deliveryTerm === "DDP" && calc.includeImportVatInCost ? (Number(calc.importVatCost) || 0) : 0;
    const otherImportCost = calc.deliveryTerm === "DDP" ? (Number(calc.otherImportCost) || 0) : 0;
    const totalCost = productionCost + freightCost + dutyCost + importVatCost + otherImportCost;
    const margin = Math.min(95, Math.max(0, Number(calc.targetMargin) || 0));
    const salesPrice = margin >= 100 ? totalCost : totalCost / (1 - margin / 100);
    const grossProfit = salesPrice - totalCost;
    return { productionCost, freightCost, dutyCost, importVatCost, otherImportCost, totalCost, margin, salesPrice, grossProfit };
  }
  function articleSize(article) {
    if (article.shape === "Specialform") return `Custom shape · ${decimal(articleArea(article))} m²`;
    if (article.shape === "Rund") return `Ø ${article.widthCm || 0} cm`;
    return `${article.widthCm || 0} × ${article.lengthCm || 0} cm`;
  }
  function toast(message) { if(window.CDPRemote?.adapter?.busy)return; const el = $("#toast"); el.textContent = message; el.classList.add("show"); clearTimeout(toast.timer); toast.timer = setTimeout(() => el.classList.remove("show"), 2400); }

  function showView(view) { closeModal(); if(view==="inquiries")view="leads";
    if (view === "meetings") renderMeetings();
    $$(".view").forEach(el => el.classList.toggle("active", el.id === `view-${view}`));
    $$(".nav-item[data-view]").forEach(el => el.classList.toggle("active", el.dataset.view === view));
    const active = $(`#view-${view}`); $("#breadcrumbCurrent").textContent = active?.dataset.title || view;
    $("#sidebar").classList.remove("open"); window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function renderAll() {
    renderCustomers();
    renderMeetings(); renderMetrics(); renderDashboardLeads(); renderLeads();  renderProjects(); renderArticles(); renderQuotations(); renderAgents(); renderManufacturers(); renderSettings();
    $("#leadNavCount").textContent = state.leads.filter(lead => lead.status === "Aktivt").length;
    
    $("#articleNavCount").textContent = state.articles.length;
  }


  function renderSettings() {
    const form = $("#companySettingsForm");
    if (!form) return;
    const c = state.company || {};
    ["name","address","zip","city","country","orgNumber","vatNumber","eori","iban","bic","email","phone","web"].forEach(key => { if (form.elements[key]) form.elements[key].value = c[key] || ""; });
  }
  function renderMetrics() {
    const activeProjects = state.projects.filter(p => p.businessStatus !== "Vunnet" && p.businessStatus !== "Förlorat");
    const acceptedQuotes = state.quotations.filter(q => q.status === "Accepterad");
    const openValue = activeProjects.reduce((sum, p) => sum + p.value, 0);
    const weighted = activeProjects.reduce((sum, p) => sum + p.value * p.probability / 100, 0);
    const acceptedValue = acceptedQuotes.reduce((sum, q) => sum + q.amount, 0);
    const metrics = [
      ["Open pipeline", money(openValue), "Active projects", "↗", "#536851", "#e6ebe3"],
      ["Weighted pipeline", money(weighted), "Based on probability", "◒", "#6d7f89", "#e8edef"],
      ["Accepted YTD", money(acceptedValue), `${acceptedQuotes.length} won projects`, "✓", "#536851", "#e6ebe3"],
      ["Leads", state.leads.filter(i => i.status === "Aktivt").length, `${state.leads.filter(i => i.status === "Aktivt").length} new to review`, "◎", "#8a6e42", "#f3ecdf"],
      ["Average margin", `${(state.quotations.length?state.quotations.reduce((s,q)=>s+(Number(q.margin)||0),0)/state.quotations.length:0).toFixed(1)} %`, "Target: 45%", "◇", "#8b584f", "#f3e6e2"]
    ];
    $("#metricGrid").innerHTML = metrics.map(m => `<article class="metric-card" style="--accent:${m[4]};--accent-pale:${m[5]}"><div class="metric-label">${m[0]}<span class="metric-icon">${m[3]}</span></div><div class="metric-value">${m[1]}</div><div class="metric-foot"><strong>${m[2]}</strong></div></article>`).join("");
    const phases = ["Kalkyl", "Offert skickad", "Förhandling"];
    const max = Math.max(...phases.map(ph => state.projects.filter(p => p.phase === ph).reduce((s,p)=>s+p.value,0)));
    const colors = ["#9ba998", "#c1ad87", "#82939b", "#a87a70"];
    $("#pipelineChart").innerHTML = phases.map((phase, i) => { const value = state.projects.filter(p => p.phase === phase).reduce((s,p)=>s+p.value,0); return `<div class="bar-group"><span class="bar-value">${money(value).replace(/,00/,"")}</span><div class="bar" style="--height:${Math.max(5, value/(max||1)*78)}%;--color:${colors[i]}"></div><span class="bar-label">${esc(uiLabel(phase))}</span></div>`; }).join("");
    const attention=state.quotations.filter(q=>q.status==='Skickad').slice(0,4).map(q=>`<div class="attention-item"><div><strong>Follow up sent quotation</strong><span>${esc(q.project)} · V${esc(q.version)}</span></div><button data-quote-id="${esc(q.id)}" data-version="${esc(q.version)}">→</button></div>`);
    if(state.leads.some(l=>l.status==='Aktivt'))attention.push("<div class=\"attention-item\"><div><strong>Review active leads</strong><span>Continue to the project when the specification is ready.</span></div><button data-target-view=\"leads\">→</button></div>");
    $("#attentionList").innerHTML=attention.join('')||"<p class=\"detail-sub\">No pending quotation or lead actions.</p>";
  }


  function meetingHostOptions(selected = "") {
    const hosts = new Map([["", "Select host"], ["DE", "Dick Eriksson"], ["JE", "Jacob"]]);
    for(const u of window.CDPProjectUsers||[])hosts.set(u.email,u.initials?u.initials+' · '+(u.name||u.email):u.name||u.email);
    state.projects.forEach(p => { if (p.owner && !hosts.has(p.owner)) hosts.set(p.owner, p.owner); });
    state.meetings.forEach(m => { if (m.host && !hosts.has(m.host)) hosts.set(m.host, m.host); });
    return [...hosts].map(([id, name]) => `<option value="${esc(id)}" ${id === selected ? "selected" : ""}>${esc(window.CDPUserLabels?.find(id)?window.CDPUserLabels.initials(id)+' · '+(window.CDPUserLabels.find(id).name||name):name)}</option>`).join("");
  }

  function legacy_renderMeetings() {
    const active = store.listMeetings(), archive = store.listMeetings(true);
    $("#meetingNavCount").textContent = active.length;
    $("#activeMeetingCount").textContent = active.length;
    $("#archivedMeetingCount").textContent = archive.length;
    $$("[data-meeting-filter]").forEach(b => b.classList.toggle("active", b.dataset.meetingFilter === meetingFilter));
    $("#meetingRows").innerHTML = (meetingFilter === "archive" ? archive : active).map(m => {
      const attr = `data-meeting-id="${esc(m.id)}"`;
      return `<tr><td><input class="meeting-input" type="datetime-local" required ${attr} data-meeting-field="time" value="${esc(m.time)}" aria-label="Time"></td><td><input class="meeting-input" required ${attr} data-meeting-field="visitor" value="${esc(m.visitor)}" aria-label="Visitor"></td><td><textarea class="inline-comment" rows="2" ${attr} data-meeting-field="comment" aria-label="Comment">${esc(m.comment)}</textarea></td><td><select class="meeting-input" ${attr} data-meeting-field="host" aria-label="Host">${meetingHostOptions(m.host)}</select></td><td><button class="text-button delete-action" data-delete-meeting="${esc(m.id)}">Delete</button></td></tr>`;
    }).join("") || `<tr><td colspan="5">${meetingFilter === "archive" ? "No archived meetings." : "No upcoming meetings."}</td></tr>`;
  }

  function openMeetingForm() {
    openModal(`<form id="meetingForm"><div class="modal-header"><h2 id="modalTitle">New meeting</h2><button type="button" class="modal-close" data-close>×</button></div><div class="modal-body"><div class="form-grid"><label class="field"><span>Time *</span><input name="time" type="datetime-local" required value="${store.meetingDay()}T09:00"></label><label class="field"><span>Visitor *</span><input name="visitor" required></label><label class="field full"><span>Comment</span><textarea name="comment"></textarea></label><label class="field"><span>Host</span><select name="host">${meetingHostOptions("DE")}</select></label></div></div><div class="modal-footer"><button type="button" class="button secondary" data-close>Cancel</button><button class="button primary">Add meeting</button></div></form>`);
  }

  document.addEventListener("submit", event => {
    if (event.target.id !== "meetingForm") return;
    event.preventDefault();
    const meeting = store.createMeeting(Object.fromEntries(new FormData(event.target)));
    if (!meeting) { toast("Enter a valid time and visitor."); return; }
    meetingFilter = meeting.time.slice(0, 10) < store.meetingDay() ? "archive" : "active";
    closeModal(); showView("meetings"); toast("The meeting has been added.");
  });

  document.addEventListener("change", event => {
    const el = event.target, field = el.dataset.meetingField;
    if (!field) return;
    const meeting = store.updateMeeting(el.dataset.meetingId, { [field]: el.value });
    if (!meeting) { toast("Enter a valid time and visitor. The change was not saved."); renderMeetings(); return; }
    if (field === "time") renderMeetings();
    toast("The meeting has been saved.");
  });

  // Reclassify after local midnight, including when returning from sleep/background.
  let lastMeetingDay = store.meetingDay();
  function refreshMeetingDay() {
    const today = store.meetingDay();
    if (today === lastMeetingDay) return;
    // Commit an in-progress field before rebuilding rows.
    const focused = document.activeElement;
    if (focused?.dataset.meetingField) focused.dispatchEvent(new Event("change", { bubbles: true }));
    lastMeetingDay = today; renderMeetings();
  }
  setInterval(refreshMeetingDay, 1000);
  window.addEventListener("focus", refreshMeetingDay);
  document.addEventListener("visibilitychange", refreshMeetingDay);

  function sortedLeads(leads) {
    return [...leads].sort((a, b) => {
      if (!a.expectedStart && !b.expectedStart) return a.name.localeCompare(b.name, "sv");
      if (!a.expectedStart) return 1;
      if (!b.expectedStart) return -1;
      return a.expectedStart.localeCompare(b.expectedStart);
    });
  }

  function renderDashboardLeads() {
    const leads = sortedLeads(state.leads.filter(lead => lead.status === "Aktivt")).slice(0, 3);
    $("#dashboardLeadRows").innerHTML = leads.map(lead => `<button class="lead-watch-item" data-edit-lead="${lead.id}"><span class="lead-month">${leadMonth(lead.expectedStart)}</span><span><strong>${esc(lead.name)}</strong><small>${esc(lead.comments || "No comment recorded.")}</small></span><span>→</span></button>`).join("") || `<div class="empty-state"><p>No active leads yet.</p></div>`;
  }

  function legacy_renderLeads() {
    const active = state.leads.filter(lead => lead.status === "Aktivt");
    const converted = state.leads.filter(lead => lead.status === "Konverterat");
    $("#activeLeadCount").textContent = active.length;
    $("#convertedLeadCount").textContent = converted.length;
    $$('[data-lead-filter]').forEach(button => button.classList.toggle("active", button.dataset.leadFilter === leadFilter));
    let leads = state.leads;
    if (leadFilter === "active") leads = active;
    if (leadFilter === "converted") leads = converted;
    $("#leadRows").innerHTML = sortedLeads(leads).map(lead => {
      const comment = lead.status === "Aktivt"
        ? `<textarea class="inline-comment" data-lead-comment="${lead.id}" rows="2" aria-label="Comment for ${esc(lead.name)}" placeholder="Add a comment…">${esc(lead.comments || "")}</textarea>`
        : `<span class="readonly-comment">${esc(lead.comments || "—")}</span>`;
      const actions = lead.status === "Aktivt"
        ? `<div class="action-buttons"><button class="text-button" data-edit-lead="${lead.id}">Edit</button><button class="text-button" data-convert-lead="${lead.id}">Create enquiry</button><button class="text-button delete-action" data-delete-lead="${lead.id}">Delete</button></div>`
        : `<button class="text-button converted-link" data-inquiry-id="${lead.inquiryId}">Visa enquiry →</button>`;
      return `<tr><td><button class="id-link" data-edit-lead="${lead.id}">${esc(lead.name)}</button></td><td><span class="cell-primary">${esc(lead.name)}</span></td><td><span class="month-display">${esc(month(lead.expectedStart))}</span></td><td class="comment-cell">${comment}</td><td>${date(lead.createdAt)}</td><td>${statusBadge(lead.status)}</td><td>${actions}</td></tr>`;
    }).join("") || `<tr><td colspan="7">No leads in this category.</td></tr>`;
  }

  function inquiryRow(i, compact = false) {
    return `<tr><td><button class="id-link" data-inquiry-id="${i.id}">Open</button></td><td><span class="cell-primary">${i.project}</span><span class="cell-secondary">${i.customer}</span></td><td>${i.country}</td><td><span class="source-tag">${i.source}</span></td>${compact ? "" : `<td>${i.agent}</td>`}<td>${money(i.value, i.currency)}</td>${compact ? "" : `<td><strong>${i.probability} %</strong><div class="progress" style="--progress:${i.probability}%"><span></span></div></td>`}<td>${statusBadge(i.status)}</td><td>${date(compact ? i.received : (i.decisionAt || i.decision))}</td><td><button class="row-menu" data-inquiry-id="${i.id}" aria-label="Open">•••</button></td></tr>`;
  }
  function scopeRowArea(row) {
    const width=Number(row.widthCm)||0, length=Number(row.lengthCm)||0, qty=Math.max(1,Number(row.quantity)||1);
    return width>0 && length>0 ? (width/100)*(length/100)*qty : 0;
  }
  function scopeTotals(rows=[]) {
    return rows.reduce((acc,row)=>{ acc.items += Math.max(1,Number(row.quantity)||1); acc.area += scopeRowArea(row); return acc; },{items:0,area:0});
  }
  function inquiryTabs(i, tab) {
    const scopeCount=(i.preliminaryScope||[]).length;
    return `<div class="project-tabs inquiry-tabs"><button class="project-tab ${tab==="overview"?"active":""}" data-inquiry-tab="overview" data-id="${i.id}">Overview</button><button class="project-tab ${tab==="customer"?"active":""}" data-inquiry-tab="customer" data-id="${i.id}">Customer</button><button class="project-tab ${tab==="scope"?"active":""}" data-inquiry-tab="scope" data-id="${i.id}">Preliminary scope (${scopeCount})</button><button class="project-tab ${tab==="files"?"active":""}" data-inquiry-tab="files" data-id="${i.id}">Design & files</button></div>`;
  }
  function inquiryScopeRow(row={}, index=0, disabled=false) {
    return `<tr data-scope-row><td><select name="scopeType" ${disabled?"disabled":""}><option ${row.type!=="Tapestry"&&row.type!=="Other"?"selected":""}>Rug</option><option ${row.type==="Tapestry"?"selected":""}>Tapestry</option><option ${row.type==="Other"?"selected":""}>Other</option></select></td><td><input name="scopeDescription" value="${esc(row.description||"")}" placeholder="Guest room rug" ${disabled?"disabled":""}></td><td><input name="scopeQuantity" type="number" min="1" step="1" value="${Number(row.quantity)||1}" ${disabled?"disabled":""}></td><td><input name="scopeWidth" type="number" min="0" step="1" value="${Number(row.widthCm)||""}" placeholder="200" ${disabled?"disabled":""}></td><td><input name="scopeLength" type="number" min="0" step="1" value="${Number(row.lengthCm)||""}" placeholder="300" ${disabled?"disabled":""}></td><td class="scope-area">${decimal(scopeRowArea(row))} m²</td><td><input name="scopeComment" value="${esc(row.comment||"")}" placeholder="Custom colour" ${disabled?"disabled":""}></td><td>${disabled?"":`<button type="button" class="row-menu" data-remove-scope-row aria-label="Delete">×</button>`}<input type="hidden" name="scopeId" value="${esc(row.id||"")}"></td></tr>`;
  }
  function updateInquiryScopeSummary(form) {
    if(!form) return; let items=0,area=0;
    $$('[data-scope-row]',form).forEach(row=>{ const qty=Math.max(1,Number($('[name="scopeQuantity"]',row)?.value)||1),w=Number($('[name="scopeWidth"]',row)?.value)||0,l=Number($('[name="scopeLength"]',row)?.value)||0; items+=qty; const a=w>0&&l>0?(w/100)*(l/100)*qty:0; area+=a; const cell=$('.scope-area',row); if(cell) cell.textContent=`${decimal(a)} m²`; });
    const out=$('[data-scope-summary]',form); if(out) out.textContent=`Estimated scope: ${items} items · approx. ${decimal(area)} m²`;
  }

  function renderDashboardInquiries() { $("#dashboardInquiryRows").innerHTML = state.inquiries.filter(i => ["Ny", "Bedöms"].includes(i.status)).slice(0, 4).map(i => inquiryRow(i, true)).join("") || `<tr><td colspan="8">No active enquiries at the moment.</td></tr>`; }
  function renderInquiries() {
    const term = $("#inquirySearch")?.value.trim().toLowerCase() || "";
    const status = $("#inquiryStatusFilter")?.value || "all";
    const source = $("#inquirySourceFilter")?.value || "all";
    const activeStatuses = ["Ny", "Bedöms"];
    const archiveStatuses = ["Go", "No Go"];
    const modeStatuses = inquiryMode === "archive" ? archiveStatuses : activeStatuses;
    const base = state.inquiries.filter(i => modeStatuses.includes(i.status));
    const filtered = base.filter(i => (!term || [i.id,i.project,i.customer,i.country,i.agent].join(" ").toLowerCase().includes(term)) && (status === "all" || i.status === status) && (source === "all" || i.source === source));
    $("#inquiryRows").innerHTML = filtered.map(i => inquiryRow(i)).join("") || `<tr><td colspan="10">${inquiryMode === "archive" ? "No archived enquiries match the filter." : "No active enquiries match the filter."}</td></tr>`;
    $("#inquiryResultCount").textContent = `${filtered.length} of ${base.length} ${inquiryMode === "archive" ? "archived" : "active"} enquiries`;
    const activeCount = state.inquiries.filter(i => activeStatuses.includes(i.status)).length;
    const archiveCount = state.inquiries.filter(i => archiveStatuses.includes(i.status)).length;
    if ($("#activeInquiryCount")) $("#activeInquiryCount").textContent = `(${activeCount})`;
    if ($("#archiveInquiryCount")) $("#archiveInquiryCount").textContent = `(${archiveCount})`;
    $$('[data-inquiry-mode]').forEach(button => button.classList.toggle("active", button.dataset.inquiryMode === inquiryMode));
    const statusSelect = $("#inquiryStatusFilter");
    if (statusSelect) {
      [...statusSelect.options].forEach(option => {
        if (option.value === "all") { option.hidden = false; return; }
        option.hidden = !modeStatuses.includes(option.value);
      });
      if (statusSelect.value !== "all" && !modeStatuses.includes(statusSelect.value)) statusSelect.value = "all";
    }
  }

  function renderProjects() {
    const phases = ["Kalkyl", "Offert skickad", "Förhandling"];
    $$("[data-project-filter]").forEach(button=>button.classList.toggle("active",button.dataset.projectFilter===projectFilter));
    const won=state.projects.filter(p=>p.businessStatus==="Vunnet" || p.phase==="Vunnet");
    if(projectFilter==="won") {
      $("#projectKanban").className="won-project-grid";
      $("#projectKanban").innerHTML=won.map(p=>`<article class="won-card" data-project-id="${p.id}" tabindex="0" role="button" aria-label="Open project ${p.name}"><div class="won-card-head"><div><h2>${p.name}</h2><p>${esc(p.customer)}</p></div>${statusBadge("Vunnet")}</div><div class="won-card-stats"><div><span>Accepted value</span><strong>${money(p.value,p.currency)}</strong></div><div><span>Accepted</span><strong>${date(p.acceptedAt)}</strong></div><div><span>Delivery</span><strong>${date(p.deliveryDate)}</strong></div><div><span>Status</span><strong>${esc(uiLabel(p.deliveryStatus||"Väntar orderunderlag"))}</strong></div></div><button class="text-button" style="margin-top:14px" data-project-id="${p.id}">Open project →</button></article>`).join("") || `<div class="empty-state"><h2>No won projects yet</h2></div>`;
      return;
    }
    $("#projectKanban").className="kanban";
    const visiblePhases=projectFilter==="lost"?["Förlorat"]:projectFilter==="all"?[...phases,"Vunnet","Förlorat"]:phases;
    $("#projectKanban").innerHTML = visiblePhases.map(phase => { const items = state.projects.filter(p=>p.phase===phase); return `<section class="kanban-column"><div class="kanban-head"><strong>${esc(uiLabel(phase))}</strong><span>${items.length}</span></div>${items.map(p => { return `<article class="project-card" data-project-id="${esc(p.id)}" tabindex="0" role="button" aria-label="Open project ${esc(p.name)}"><div class="project-card-heading"><button type="button" data-project-id="${esc(p.id)}">${esc(p.name)}</button><span class="owner-dot" title="${esc(window.CDPUserLabels?.title(p.owner)||p.owner)}">${esc(window.CDPUserLabels?.initials(p.owner)||p.owner)}</span></div><p>${esc(p.customer)} · ${p.projectType==='simple'?'Simple':'Complete'}</p></article>`; }).join("") || `<p class="cell-secondary">No projects</p>`}</section>`; }).join("");
  }

  function articleRow(article, compact = false) {
    const project = state.projects.find(p=>p.id===article.projectId);
    return `<tr><td><button class="id-link" data-article-id="${article.id}">${esc(publicReference(article.code))}</button></td>${compact ? "" : `<td><span class="cell-primary">${project?.name || "—"}</span></td>`}<td><span class="cell-primary">${article.name}</span><span class="cell-secondary">${article.location || "—"}</span></td><td><span class="size-value">${articleSize(article)}</span></td><td>${decimal(articleArea(article))}</td><td>${article.manufacturer || "—"}</td><td>${article.pricePerSqm ? `${money(article.pricePerSqm, article.currency)}${priceUnitLabel(article.priceUnit)}` : "—"}</td><td><span class="cost-value">${money(articleCost(article), article.currency)}</span></td><td>${statusBadge(article.status)}</td><td><button class="row-menu" data-article-id="${article.id}">•••</button></td></tr>`;
  }

  function populateArticleProjectFilter() {
    const select = $("#articleProjectFilter"); if (!select) return; const current=select.value;
    select.innerHTML = `<option value="all">All projects</option>${state.projects.map(p=>`<option value="${esc(p.id)}">${esc(p.name)}</option>`).join("")}`;
    if ([...select.options].some(o=>o.value===current)) select.value=current;
  }

  function articleInline(a,key,value,label,extra='') {return `<input class="article-inline" type="number" data-article-inline="${key}" data-id="${esc(a.id)}" data-saved="${esc(value??'')}" value="${esc(value??'')}" aria-label="${esc(label+' '+a.name)}" ${extra}><small class="article-inline-status" aria-live="polite"></small>`;}
  function articleRegisterRows(filtered,projectScoped=false){return filtered.map(a=>{const price=a.selectedPrice||a,p=state.projects.find(p=>p.id===a.projectId),area=articleArea(a),amount=price.price??price.pricePerSqm,perSqm=price.priceUnit==='per styck'?(area>0?Number(amount)/area:null):price.priceUnit==='fast pris'?(area>0&&Number(a.quantity)>0?Number(amount)/(area*Number(a.quantity)):null):amount,currency=price.currency||a.currency||'EUR',rate=a.manualProductionPrice?.fxRate||price.fxRate||'';return `<tr><td>${esc(CDPStructure.products.find(state,a)?.name||'—')}</td><td><button class="text-button" data-edit-article="${esc(a.id)}">${esc(a.name)}</button></td><td>${articleInline(a,'quantity',a.quantity??1,"Quantity","min=\"1\" step=\"1\" required title=\"Planned quantity. One phase follows this total automatically; multiple phases have separate allocations.\"")}</td><td>${articleInline(a,'production',currency==='EUR'?perSqm:'',"Production price EUR/m²",'min="0" step="any" required')}${currency!=='EUR'&&perSqm!=null?`<small>Previous: ${money(perSqm,currency)}/m²</small>`:''}${p?.currency!=='EUR'?`<label class="article-fx">1 EUR = <input type="number" min="0.000001" step="any" data-article-fx="${esc(a.id)}" value="${esc(rate)}" aria-label="Valutakurs ${esc(a.name)}"> ${esc(p?.currency||'')}</label>`:''}</td><td>${articleInline(a,'target',a.targetPrice,"Target EUR/m²",'min="0.01" step="any"')}</td><td><button class="button secondary" data-v6-bom="${esc(a.id)}">BOM</button> ${projectScoped||p?.projectType==='simple'?'':`<button class="button secondary" data-quality-for-article="${esc(a.id)}">Sample</button>`} <button class="text-button" data-edit-article="${esc(a.id)}">Edit</button><button class="text-button" data-article-delete="${esc(a.id)}">Delete</button></td></tr>`;}).join('') || "<tr><td colspan=\"6\">No articles match the filter.</td></tr>";}
  function projectArticlesView(p){return `<div data-project-article-list="${esc(p.id)}"><div class="toolbar"><input data-project-article-search type="search" placeholder="Search article…" aria-label="Search project articles"><select aria-label="Project" disabled><option>${esc(p.name)}</option></select><select data-project-article-status aria-label="Filter status"><option value="all">All statuses</option><option value="Förfrågan">Enquiry</option><option value="Förhandlas">Under negotiation</option><option value="Godkänt">Approved</option></select><div class="project-article-create"><button class="button primary" data-new-article-project="${esc(p.id)}">New article</button><select class="button secondary" aria-label="Copy from project" data-copy-project="${esc(p.id)}"><option value="">Copy from project</option>${state.projects.filter(x=>x.id!==p.id).map(x=>`<option value="${esc(x.id)}">${esc(x.name)}</option>`).join('')}</select>${p.projectType==='simple'?'':`<button class="button secondary" data-quality-new="${esc(p.id)}">New sample</button>`}</div></div><div class="table-scroll"><table><thead><tr><th>Product</th><th>Article name</th><th>Quantity</th><th>Production price/m² <small>EUR</small></th><th>Target/m² <small>EUR</small></th><th></th></tr></thead><tbody data-project-article-rows></tbody></table></div></div>`;}
  document.addEventListener('change',e=>{
    const select=e.target.closest('[data-copy-project]');if(!select||!select.value)return;
    const targetId=select.dataset.copyProject,sourceId=select.value;select.value='';
    const source=state.projects.find(p=>p.id===sourceId),articles=state.articles.filter(a=>a.projectId===sourceId);
    v6Dialog('Copy from project',`<form id="copyProjectArticlesForm" data-target="${esc(targetId)}" data-source="${esc(sourceId)}"><h3>${esc(source.name)}</h3><p>Select articles to copy. Products, BOM, sizes, locations, quantities and target prices are copied independently. Production prices, samples, RFQs and order history are not copied. Existing product names receive a copy suffix.</p>${articles.length?`<label class="v6-check"><input type="checkbox" data-copy-all checked> Select all</label><table><thead><tr><th>Product</th><th>Article</th><th>Quantity</th></tr></thead><tbody>${articles.map(a=>`<tr><td><label><input type="checkbox" name="article" value="${esc(a.id)}" checked> ${esc(CDPStructure.products.find(state,a)?.name||'')}</label></td><td>${esc(a.name)}</td><td>${esc(a.quantity)}</td></tr>`).join('')}</tbody></table><button class="button primary">Copy articles</button>`:'<p>This project has no articles.</p>'}</form>`);
  });
  document.addEventListener('change',e=>{if(e.target.matches('[data-copy-all]'))$$('[name=article]',e.target.form).forEach(input=>input.checked=e.target.checked);});
  document.addEventListener('submit',async e=>{
    const f=e.target;if(f.id!=='copyProjectArticlesForm')return;e.preventDefault();const button=$('button',f);
    try{writableRfq();if(f.dataset.copied)return;button.disabled=true;const articles=CDPStructure.copyProjectArticles(state,f.dataset.target,f.dataset.source,new FormData(f).getAll('article'));f.dataset.copied='true';await persistRfq();renderAll();closeModal(true);filterProjectArticles();toast(articles.length+' articles copied.');}catch(error){toast(error.message);}finally{if(button)button.disabled=!!f.dataset.copied;}
  });
  function filterProjectArticles(){const root=$('[data-project-article-list]');if(!root)return;const term=$('[data-project-article-search]',root).value.trim().toLowerCase(),status=$('[data-project-article-status]',root).value;const all=state.articles.filter(a=>a.projectId===root.dataset.projectArticleList),rows=all.filter(a=>(status==='all'||a.status===status)&&[a.code,a.name,a.location,a.manufacturer,CDPStructure.products.find(state,a)?.name].join(' ').toLowerCase().includes(term));$('[data-project-article-rows]',root).innerHTML=articleRegisterRows(rows,true)+qualitySampleRows(state.projects.find(p=>p.id===root.dataset.projectArticleList),term,status);}
  for(const type of ['input','change'])document.addEventListener(type,e=>{if(e.target.matches('[data-project-article-search],[data-project-article-status]'))filterProjectArticles();});
  function renderArticles() {
    populateArticleProjectFilter();
    const term = $("#articleSearch")?.value.trim().toLowerCase() || "";
    const projectId = $("#articleProjectFilter")?.value || "all";
    const status = $("#articleStatusFilter")?.value || "all";
    const filtered = state.articles.filter(a => {
      const project=state.projects.find(p=>p.id===a.projectId);
      return (!term || [a.code,a.name,a.location,a.manufacturer,project?.name].join(" ").toLowerCase().includes(term)) && (projectId==="all" || a.projectId===projectId) && (status==="all" || a.status===status);
    });
    $("#articleSummary").innerHTML = '';
    $("#articleRows").innerHTML = articleRegisterRows(filtered);
    $("#articleResultCount").textContent = `${filtered.length} of ${state.articles.length} articles`;
  }

  function renderQuotations() {
    const activeStatuses=["Utkast","Intern granskning","Skickad","Revidering begärd"];
    const lostStatuses=["Avböjd","Utgången","Återkallad"];
    const accepted=state.quotations.filter(q=>q.status==="Accepterad"); const active=state.quotations.filter(q=>activeStatuses.includes(q.status)); const lost=state.quotations.filter(q=>lostStatuses.includes(q.status));
    const acceptedValue=accepted.reduce((s,q)=>s+q.amount,0); const avgMargin=accepted.length?accepted.reduce((s,q)=>s+q.margin,0)/accepted.length:0; const upcoming=state.projects.filter(p=>p.businessStatus==="Vunnet" && !["Levererad","Avslutad"].includes(p.deliveryStatus)).length;
    $("#acceptedSummary").innerHTML=`<div class="accepted-card"><span>Accepted value YTD</span><strong>${money(acceptedValue)}</strong></div><div class="accepted-card"><span>Won projects</span><strong>${accepted.length}</strong></div><div class="accepted-card"><span>Average margin</span><strong>${decimal(avgMargin)} %</strong></div><div class="accepted-card"><span>Ongoing deliveries</span><strong>${upcoming}</strong></div>`;
    $("#activeQuoteCount").textContent=active.length; $("#acceptedQuoteCount").textContent=accepted.length; $("#lostQuoteCount").textContent=lost.length;
    $$("[data-quote-filter]").forEach(button=>button.classList.toggle("active",button.dataset.quoteFilter===quotationFilter));
    let rows=state.quotations;
    if(quotationFilter==="active") rows=active; else if(quotationFilter==="accepted") rows=accepted; else if(quotationFilter==="lost") rows=lost;
    $("#quotationRows").innerHTML = [...rows].reverse().map(q => { const snapshots=q.articleSnapshots||[]; const productionCost=snapshots.reduce((s,a)=>s+(a.cost||0),0); const project=state.projects.find(p=>p.id===q.projectId); return `<tr><td><button class="id-link" data-quote-id="${q.id}" data-version="${q.version}">${esc(quoteReference(q))}</button></td><td><span class="cell-primary">${q.project}</span></td><td>V${q.version}</td><td>${snapshots.length}</td><td>${snapshots.length ? money(productionCost) : "—"}</td><td>${money(q.amount)}</td><td><strong style="color:${q.margin < 40 ? '#8b584f' : '#536851'}">${q.margin.toFixed(1)} %</strong></td><td>${statusBadge(q.status)}</td><td>${date(q.acceptedAt)}</td><td>${q.status==="Accepterad"?statusBadge(project?.deliveryStatus||"Väntar orderunderlag"):"—"}</td><td><button class="row-menu" data-quote-id="${q.id}" data-version="${q.version}">•••</button></td></tr>`; }).join("") || `<tr><td colspan="11">No quotations in this category.</td></tr>`;
  }
  function renderAgents() {
    $("#agentGrid").innerHTML = state.agents.map(a => `<article class="agent-card"><div class="agent-header"><div class="agent-logo">${a.name.split(" ").map(x=>x[0]).slice(0,2).join("")}</div><div><h2>${a.name}</h2><p>${a.contact} · ${a.country} · Provision ${a.commission}%</p></div>${statusBadge(a.active ? "Aktiv" : "Inaktiv")}</div><div class="agent-stats"><div><strong>${a.inquiries}</strong><span>Enquiries</span></div><div><strong>${a.projects}</strong><span>Project</span></div><div><strong>${money(a.value).replace(/,00/,"")}</strong><span>Won</span></div></div></article>`).join("");
  }

  function renderManufacturers() {
    const grid = $("#manufacturerGrid"); if (!grid) return;
    grid.innerHTML = state.manufacturers.map(m =>
      `<button type="button" class="manufacturer-row" data-edit-manufacturer="${esc(m.id)}">${esc(m.name)}</button>`
    ).join("");
  }
  function openManufacturerForm(manufacturer = null) {
    const editing = Boolean(manufacturer);
    openModal(`<form id="manufacturerForm" ${editing?`data-edit-id="${manufacturer.id}"`:""}><div class="modal-header"><div><h2 id="modalTitle">${editing?"Edit manufacturer":"New manufacturer"}</h2><p>The manufacturer can be selected for project articles and supplier prices.</p></div><button type="button" class="modal-close" data-close>×</button></div><div class="modal-body"><div class="form-grid"><label class="field full"><span>Name *</span><input name="name" required value="${esc(manufacturer?.name||"")}"></label><label class="field"><span>Country</span><input name="country" value="${esc(manufacturer?.country||"")}"></label><label class="field"><span>Contact person</span><input name="contact" value="${esc(manufacturer?.contact||"")}"></label><label class="field"><span>E-mail</span><input name="email" type="email" value="${esc(manufacturer?.email||"")}"></label><label class="field"><span>Phone</span><input name="phone" value="${esc(manufacturer?.phone||"")}"></label><label class="field"><span>Default currency</span><select name="currency"><option ${manufacturer?.currency!=="USD"?"selected":""}>EUR</option><option ${manufacturer?.currency==="USD"?"selected":""}>USD</option></select></label><label class="field checkbox-field"><span>Active</span><input name="active" type="checkbox" ${manufacturer?.active!==false?"checked":""}></label></div></div><div class="modal-footer"><button type="button" class="button secondary" data-close>Cancel</button><button class="button primary">Save manufacturer</button></div></form>`);
  }

  // User-driven Close returns one level; programmatic completion still closes fully.
  const modalHistory=[];
  let activeModalKey='',returningToModal=false,modalDataRevision=0;
  function modalRoute(root){
    const tab=$('.project-tab.active',root);
    if(tab)return {key:'project:'+tab.dataset.id+':'+tab.dataset.projectTab,render:()=>openProject(tab.dataset.id,tab.dataset.projectTab)};
    const supplier=$('#supplierPreviewSelect',root);
    if(supplier){const id=supplier.value;return {key:'supplier-preview',render:()=>showSupplierPreview(id)};}
    const form=$('form',root);
    return {key:form?'form:'+form.id+':'+(form.dataset.id||form.dataset.editId||form.dataset.p||''):'dialog:'+($('#modalTitle',root)?.textContent||'')};
  }
  function modalPosition(root){
    const expanded=[];
    for(const attr of ['data-phase-items','data-rfq-detail','data-supplier-detail'])for(const el of $$('['+attr+']',root))if(!el.hidden)expanded.push([attr,el.getAttribute(attr)]);
    const scrolls=$$('.table-scroll',root).map(el=>({left:el.scrollLeft,top:el.scrollTop}));
    return {top:root.scrollTop,left:root.scrollLeft,expanded,scrolls};
  }
  function restoreModalPosition(root,position){
    for(const [attr,id] of position.expanded){const row=$$('['+attr+']',root).find(el=>el.getAttribute(attr)===id);if(!row)continue;row.hidden=false;const toggle=({'data-phase-items':'data-v6-toggle-phase','data-rfq-detail':'data-rfq-toggle','data-supplier-detail':'data-supplier-toggle'})[attr];const button=$$('['+toggle+']',root).find(el=>el.getAttribute(toggle)===id);button?.setAttribute('aria-expanded','true');}
    $$('.table-scroll',root).forEach((el,i)=>{el.scrollLeft=position.scrolls[i]?.left||0;el.scrollTop=position.scrolls[i]?.top||0;});
    root.scrollTop=position.top;root.scrollLeft=position.left;
  }
  function modalCloseLabels(){for(const button of $$('[data-close]',$('#modal')))if(button.classList.contains('modal-close')){button.title=modalHistory.length?"Back to previous view":"Close";button.setAttribute('aria-label',button.title);}}
  function openModal(html,small=false){
    const modal=$('#modal'),backdrop=$('#modalBackdrop');if(!modal||!backdrop)return;
    const incoming=document.createElement('div');incoming.innerHTML=html;const next=modalRoute(incoming);
    let position=null;
    if(!returningToModal&&!backdrop.hidden&&modal.childNodes.length){
      if(activeModalKey===next.key)position=modalPosition(modal);
      else {
        const earlier=modalHistory.findIndex(entry=>entry.key===next.key);
        if(earlier!==-1){position=modalHistory[earlier].position;modalHistory.splice(earlier);}
        else {const route=modalRoute(modal);modalHistory.push({...route,key:activeModalKey,nodes:Array.from(modal.childNodes),className:modal.className,position:modalPosition(modal),revision:modalDataRevision,focus:document.activeElement});if(modalHistory.length>30)modalHistory.shift();}
      }
    }
    activeModalKey=next.key;modal.className=`modal${small?' small':''}`;modal.replaceChildren(...incoming.childNodes);backdrop.hidden=false;
    $('input,select,textarea',modal)?.focus({preventScroll:true});modalCloseLabels();
    if(position)restoreModalPosition(modal,position);else modal.scrollTop=0;
  }
  function closeModal(goBack=false){
    const modal=$('#modal'),backdrop=$('#modalBackdrop');
    if(goBack&&modalHistory.length){
      const previous=modalHistory.pop();returningToModal=true;
      try{
        if(previous.render&&previous.revision!==modalDataRevision)previous.render();
        else {modal.className=previous.className;modal.replaceChildren(...previous.nodes);backdrop.hidden=false;activeModalKey=previous.key;}
        // Preview identity belongs to the restored screen, not the last opened supplier.
        if(previous.key==='supplier-preview')supplierPreviewId=$('#supplierPreviewSelect',modal)?.value||'';
        modalCloseLabels();restoreModalPosition(modal,previous.position);
        if(previous.focus?.isConnected)previous.focus.focus({preventScroll:true});
      }finally{returningToModal=false;}
      return;
    }
    modalHistory.length=0;activeModalKey='';if(backdrop)backdrop.hidden=true;if(modal)modal.replaceChildren();
  }


  function legacy_openLeadForm(lead = null) {
    const editing = Boolean(lead);
    openModal(`<form id="leadForm" ${editing ? `data-edit-id="${lead.id}"` : ""}><div class="modal-header"><div><h2 id="modalTitle">${editing ? "Edit lead" : "New lead"}</h2><p>Register an early business opportunity for future follow-up.</p></div><button type="button" class="modal-close" data-close>×</button></div><div class="modal-body"><div class="form-grid">
      <label class="field full"><span>Name *</span><input name="name" required value="${esc(lead?.name || "")}" placeholder="Example: New hotel in Malmö"></label>
      <label class="field"><span>Expected start</span><input name="expectedStart" type="month" value="${esc(lead?.expectedStart || "")}"></label>
      <label class="field full"><span>Comment</span><textarea name="comments" placeholder="Where the tip came from and when to follow up">${esc(lead?.comments || "")}</textarea></label>
    </div></div><div class="modal-footer"><button type="button" class="button secondary" data-close>Cancel</button><button class="button primary">${editing ? "Save changes" : "Add lead"}</button></div></form>`);
  }

  function confirmDeleteLead(id) {
    const lead = state.leads.find(item => item.id === id); if (!lead) return;
    openModal(`<div class="modal-header"><div><h2 id="modalTitle">Delete lead?</h2><p>${esc(lead.name)}</p></div><button type="button" class="modal-close" data-close>×</button></div><div class="modal-body"><p>The lead will be removed from the watch list. This cannot be undone.</p></div><div class="modal-footer"><button class="button secondary" data-close>Cancel</button><button class="button danger" data-confirm-delete-lead="${lead.id}">Delete</button></div>`, true);
  }

  function openNewInquiry(lead = null) {
    openModal(`<form id="newInquiryForm"><div class="modal-header"><div><h2 id="modalTitle">New project enquiry</h2><p>Enter the basic details. Assessment takes place after the enquiry has been saved.</p></div><button type="button" class="modal-close" data-close>×</button></div><div class="modal-body"><div class="form-grid">
      ${lead ? `<input type="hidden" name="sourceLeadId" value="${lead.id}"><input type="hidden" name="expectedStart" value="${esc(lead.expectedStart || "")}">` : ""}
      <label class="field full"><span>Project name *</span><input name="project" required value="${esc(lead?.name || "")}" placeholder="Exempel: Grand Hôtel – Lobby Rugs"></label>
      <label class="field"><span>Customer / buyer *</span><input name="customer" required></label><label class="field"><span>Country *</span><input name="country" required></label>
      <label class="field"><span>Contact person</span><input name="contact"></label><label class="field"><span>E-mail</span><input name="email" type="email"></label>
      <label class="field"><span>Phone</span><input name="phone"></label><label class="field"><span>City</span><input name="city"></label>
      <label class="field"><span>Source</span><select name="source"><option ${lead ? "selected" : ""}>Lead</option><option ${lead ? "" : "selected"}>Direct</option><option>Agent</option><option value="Arkitekt">Architect</option><option>Designer</option><option value="Befintlig kund">Existing customer</option><option value="Annat">Other</option></select></label><label class="field"><span>Agent</span><select name="agent"><option>—</option>${state.agents.map(a=>`<option>${esc(a.name)}</option>`).join("")}</select></label>
      <label class="field"><span>Estimated value, EUR</span><input name="value" type="number" min="0" value="0"></label><label class="field"><span>Estimated area, m²</span><input name="area" type="number" min="0"></label>
      <label class="field"><span>Project type</span><select name="type"><option>High End</option><option>Standard</option><option value="Kontor">Office</option></select></label><label class="field"><span>Expected decision</span><input name="decision" type="date"></label>
      <label class="field full"><span>Description</span><textarea name="description" placeholder="Needs, scope, schedule and other requirements">${esc(lead?.comments || "")}</textarea></label>
    </div></div><div class="modal-footer"><button type="button" class="button secondary" data-close>Cancel</button><button type="button" class="button primary" data-save-new-inquiry>Save enquiry</button></div></form>`);
  }

  function saveNewInquiryForm(form) {
    if (!form) return null;
    if (typeof form.reportValidity === "function" && !form.reportValidity()) return null;
    const values = Object.fromEntries(new FormData(form));
    const inquiry = store.createInquiry({ ...values, currency: "EUR", probability: 20, status: "Ny" });
    if (values.sourceLeadId) store.convertLead(values.sourceLeadId, inquiry.id);
    renderAll();
    closeModal();
    showView("inquiries");
    toast(values.sourceLeadId ? "The lead has been converted to an enquiry." : "The enquiry has been registered.");
    return inquiry;
  }

  function openInquiry(id, tab = "overview") {
    const i = state.inquiries.find(x=>x.id===id); if (!i) return;
    const converted = i.status === "Go" && i.projectId;
    const archived = ["Go", "No Go"].includes(i.status);
    const readOnly = archived;
    const cd = i.customerData || {};
    const scope = i.preliminaryScope || [];
    const totals = scopeTotals(scope);
    let content = "";

    if (tab === "customer") {
      content = `<form id="inquiryCustomerForm" data-inquiry-id="${i.id}"><div class="section-action"><div><h3>Customer details</h3><span class="cell-secondary">Basic details are transferred automatically when the enquiry becomes a project.</span></div></div><div class="form-grid">
        <label class="field full"><span>Company / kundnamn</span><input name="name" value="${esc(cd.name||i.customer||"")}" ${readOnly?"disabled":""}></label>
        <label class="field"><span>Contact person</span><input name="contact" value="${esc(cd.contact||"")}" ${readOnly?"disabled":""}></label><label class="field"><span>E-mail</span><input name="email" type="email" value="${esc(cd.email||"")}" ${readOnly?"disabled":""}></label>
        <label class="field"><span>Phone</span><input name="phone" value="${esc(cd.phone||"")}" ${readOnly?"disabled":""}></label><label class="field"><span>VAT number</span><input name="vatNumber" value="${esc(cd.vatNumber||"")}" ${readOnly?"disabled":""}></label>
        <label class="field full"><span>Address</span><input name="address" value="${esc(cd.address||"")}" ${readOnly?"disabled":""}></label><label class="field"><span>ZIP</span><input name="zip" value="${esc(cd.zip||"")}" ${readOnly?"disabled":""}></label><label class="field"><span>City</span><input name="city" value="${esc(cd.city||"")}" ${readOnly?"disabled":""}></label><label class="field"><span>Country</span><input name="country" value="${esc(cd.country||i.country||"")}" ${readOnly?"disabled":""}></label>
      </div>${readOnly?`<p class="article-form-note">The enquiry has been converted. Edit customer details in the project.</p>`:`<div class="inline-actions"><button class="button primary">Save customer details</button></div>`}</form>`;
    } else if (tab === "scope") {
      content = `<form id="inquiryScopeForm" data-inquiry-id="${i.id}"><div class="section-action"><div><h3>Preliminary scope</h3><span class="cell-secondary">A rough estimate is sufficient. These rows will be transferred to the project.</span></div>${readOnly?"":`<button type="button" class="button primary" data-add-inquiry-scope>＋ New row</button>`}</div>
        <div class="table-scroll"><table class="scope-table"><thead><tr><th>Type</th><th>Description</th><th>Quantity</th><th>Width cm</th><th>Length cm</th><th>Approx. m²</th><th>Comment</th><th></th></tr></thead><tbody data-scope-body>${scope.length?scope.map((row,index)=>inquiryScopeRow(row,index,readOnly)).join(""):(readOnly?`<tr><td colspan="8" class="detail-sub">No preliminary scope recorded.</td></tr>`:inquiryScopeRow({},0,false))}</tbody></table></div>
        <div class="scope-summary" data-scope-summary>Estimated scope: ${totals.items} items · approx. ${decimal(totals.area)} m²</div>
        ${readOnly?`<p class="article-form-note">The enquiry has been converted. Its scope is now available in the project.</p>`:`<div class="inline-actions"><button class="button primary">Save scope</button></div>`}</form>`;
      setTimeout(()=>updateInquiryScopeSummary($("#inquiryScopeForm")),20);
    } else if (tab === "files") {
      content = `<div class="section-action"><div><h3>Design & files</h3><span class="cell-secondary">Sketches, renderings, moodboards, drawings and customer brief.</span></div></div><div class="empty-state file-placeholder" style="min-height:230px"><div class="empty-icon">▧</div><h2>File upload coming soon</h2><p>Image files are not stored in localStorage because they quickly fill browser storage. This feature will use external file storage, such as Supabase Storage, when connected.</p></div>`;
    } else {
      const decisionActions = converted
        ? `<button type="button" class="go" data-project-id="${i.projectId}">✓ GO – open projects</button>`
        : i.status === "No Go"
          ? `<button type="button" class="go" data-reactivate-inquiry="${i.id}">↺ Reactivate enquiry</button>`
          : `<button type="button" class="go" data-decision="go" data-id="${i.id}">✓ GO – create projects</button><button type="button" class="no-go" data-decision="no-go" data-id="${i.id}">× NO GO</button>`;
      const footerAction = archived ? "" : `<button type="button" class="button secondary" data-save-assessment="${i.id}">Save assessment</button>`;
      content = `<div class="detail-top"><div><div class="detail-title">${i.project}</div><div class="detail-sub">${i.customer} · ${i.country}</div></div>${statusBadge(i.status)}</div>
        <div class="detail-grid"><div class="detail-stat"><span>Estimated value</span><strong>${money(i.value,i.currency)}</strong></div><div class="detail-stat"><span>Source</span><strong>${i.source}${i.agent !== "—" ? ` · ${i.agent}` : ""}</strong></div><div class="detail-stat"><span>Preliminary scope</span><strong>${totals.items} pcs · ${decimal(totals.area)} m²</strong></div></div>
        <p class="detail-sub">${i.description || "No description recorded."}</p>
        <div class="qualification"><h3>Qualification</h3><div class="form-grid"><label class="field"><span>Probability</span><div class="input-suffix"><input id="qualificationProbability" type="number" min="0" max="100" value="${i.probability}" ${converted?"disabled":""}><span>%</span></div></label><label class="field"><span>Current status</span><select id="qualificationStatus" ${converted?"disabled":""}><option ${i.status==="Ny"?"selected":""}>New</option><option ${i.status==="Bedöms"?"selected":""}>Under review</option><option ${i.status==="Go"?"selected":""}>Go</option><option ${i.status==="No Go"?"selected":""}>No Go</option></select></label></div><div class="decision-buttons">${decisionActions}</div></div><div class="inquiry-footer-actions">${footerAction}</div>`;
    }

    openModal(`<div class="modal-header"><div><h2 id="modalTitle">Enquiry</h2><p>${esc(i.project)}</p></div><button class="modal-close" data-close>×</button></div><div class="modal-body">${inquiryTabs(i,tab)}<div class="project-tab-content">${content}</div></div><div class="modal-footer"><button class="button primary" data-close>Close</button></div>`);
  }

  function convertToProject(id) {
    const i = state.inquiries.find(x=>x.id===id); if(!i) return;
    const result = store.convertInquiryToProject(id,{probability:Number($("#qualificationProbability")?.value || i.probability),owner:"DE"});
    if(!result) return;
    renderAll(); closeModal(); showView("projects"); openProject(result.project.id); toast(result.created ? "The project has been created." : "The enquiry is linked to the project.");
  }

  function saveInquiryAssessment(id) {
    const i = state.inquiries.find(x => x.id === id);
    if (!i) return;
    const statusField = $("#qualificationStatus");
    const probabilityField = $("#qualificationProbability");
    const status = statusField?.value || i.status || "Ny";
    const probability = Number(probabilityField?.value ?? i.probability);
    i.probability = Number.isFinite(probability) ? probability : 0;
    if (status === "Go") {
      convertToProject(id);
      return;
    }
    i.status = status;
    saveState();
    renderAll();
    closeModal();
    showView("inquiries");
    toast("The assessment has been saved.");
  }
  function nextId() { return crypto.randomUUID(); }

  function legacy_openProject(id, tab = "overview") {
    const p = state.projects.find(x=>x.id===id); if(!p) return;
    const versions=state.quotations.filter(q=>q.projectId===id); const articles=state.articles.filter(a=>a.projectId===id);
    const totalArea=articles.reduce((s,a)=>s+articleTotalArea(a),0); const productionCost=articles.reduce((s,a)=>s+articleCost(a),0);
    let content="";
    if (tab === "articles") {
      const preliminary=p.preliminaryScope||[]; const preTotals=scopeTotals(preliminary);
      const preliminaryBlock=preliminary.length?`<div class="preliminary-scope"><div class="section-action"><div><h3>Preliminary scope from inquiry</h3><span class="cell-secondary">${preTotals.items} items · approx. ${decimal(preTotals.area)} m². Use as a reference – these details are preliminary.</span></div></div><div class="table-scroll"><table><thead><tr><th>Type</th><th>Description</th><th>Quantity</th><th>Approx. size</th><th>Approx. m²</th><th>Comment</th><th></th></tr></thead><tbody>${preliminary.map(row=>`<tr><td>${esc(row.type||"Rug")}</td><td>${esc(row.description||"—")}</td><td>${Number(row.quantity)||1}</td><td>${row.widthCm&&row.lengthCm?`${row.widthCm} × ${row.lengthCm} cm`:"—"}</td><td>${decimal(scopeRowArea(row))}</td><td>${esc(row.comment||"")}</td><td>${row.convertedArticleId?`<span class="cell-secondary">Article created</span>`:`<button class="text-button" data-create-article-from-scope="${esc(row.id)}" data-project-id-ref="${p.id}">Create article</button>`}</td></tr>`).join("")}</tbody></table></div></div>`:"";
      content = `${preliminaryBlock}<div class="section-action"><div><h3>Project articles</h3><span class="cell-secondary">${articles.length} articles · ${decimal(totalArea)} m² · ${money(productionCost)} production cost</span></div><button class="button primary" data-new-article-project="${p.id}">＋ New article</button></div>${articles.length ? `<div class="table-scroll"><table><thead><tr><th>Article</th><th>Description</th><th>Size</th><th>m²</th><th>Manufacturer</th><th>Production price</th><th>Cost</th><th>Price status</th><th></th></tr></thead><tbody>${articles.map(a=>articleRow(a,true)).join("")}</tbody></table></div>` : `<div class="empty-state" style="min-height:210px"><div class="empty-icon">◫</div><h2>No articles yet</h2><p>Add the first article or create an article from the preliminary scope above.</p></div>`}`;
    }
    else if (tab === "customer") {
      const cd=p.customerData||{}; const b=cd.billing||{}; const d=cd.delivery||{};
      content = `<form id="projectCustomerForm" data-project-id="${p.id}"><div class="section-action"><div><h3>Customer & address details</h3><span class="cell-secondary">These details are used in new quotation versions.</span></div></div>
      <div class="address-panels"><section class="address-panel"><h4>Billing details</h4><div class="form-grid"><label class="field full"><span>Name / company</span><input name="billingName" value="${esc(b.name||p.customer||"")}"></label><label class="field full"><span>Address</span><input name="billingAddress" value="${esc(b.address||"")}"></label><label class="field"><span>ZIP</span><input name="billingZip" value="${esc(b.zip||"")}"></label><label class="field"><span>City</span><input name="billingCity" value="${esc(b.city||"")}"></label><label class="field"><span>Country</span><input name="billingCountry" value="${esc(b.country||p.country||"")}"></label><label class="field"><span>VAT number</span><input name="billingVatNumber" value="${esc(b.vatNumber||"")}"></label><label class="field"><span>Contact person</span><input name="billingContact" value="${esc(b.contact||"")}"></label><label class="field"><span>E-mail</span><input name="billingEmail" type="email" value="${esc(b.email||"")}"></label></div></section>
      <section class="address-panel"><div class="address-heading"><h4>Delivery details</h4><label class="same-address"><input name="sameAsBilling" type="checkbox" ${cd.sameAsBilling!==false?"checked":""}> Same as billing</label></div><div class="form-grid delivery-address-fields" data-delivery-address-fields><label class="field full"><span>Name / company</span><input name="deliveryName" value="${esc(d.name||p.customer||"")}"></label><label class="field full"><span>Address</span><input name="deliveryAddress" value="${esc(d.address||"")}"></label><label class="field"><span>ZIP</span><input name="deliveryZip" value="${esc(d.zip||"")}"></label><label class="field"><span>City</span><input name="deliveryCity" value="${esc(d.city||"")}"></label><label class="field"><span>Country</span><input name="deliveryCountry" value="${esc(d.country||p.country||"")}"></label></div><div class="form-grid"><label class="field"><span>Contact person</span><input name="deliveryContact" value="${esc(d.contact||"")}"></label><label class="field"><span>Phone</span><input name="deliveryPhone" value="${esc(d.phone||"")}"></label></div></section></div>
      <div class="modal-footer" style="margin:20px -23px -20px"><button class="button primary">Save customer details</button></div></form>`;
      setTimeout(()=>bindSameAddress($("#projectCustomerForm")),20);
    }
    else if (tab === "calculation") {
      const calc=p.calculation||{}; const pc=projectCalculation(p,articles);
      content = `<form id="calculationForm" data-project-id="${p.id}"><div class="section-action"><div><h3>Internal costing</h3><span class="cell-secondary">Production cost + delivery + import costs → target margin → quotation price.</span></div>${statusBadge(p.phase)}</div>
      <div class="calc-section"><h4>1. Production cost</h4><div class="calc-preview"><div><span>Articles</span><strong>${articles.length}</strong></div><div><span>Total area</span><strong>${decimal(totalArea)} m²</strong></div><div><span>Production</span><strong>${money(pc.productionCost,p.currency)}</strong></div></div>${articles.some(a=>a.status!=="Godkänt")?`<p class="article-form-note"><strong>Note:</strong> ${articles.filter(a=>a.status!=="Godkänt").length} article price is not approved. The costing still uses the currently recorded price.</p>`:`<p class="article-form-note">All article prices are approved.</p>`}<button type="button" class="button secondary" data-project-tab="articles" data-id="${p.id}">Hantera articles</button></div>
      <div class="calc-section"><h4>2. Delivery & import</h4><div class="form-grid"><label class="field"><span>Delivery terms</span><select name="deliveryTerm" data-calc-live><option ${calc.deliveryTerm!=="DDP"?"selected":""}>DAP</option><option ${calc.deliveryTerm==="DDP"?"selected":""}>DDP</option></select></label><label class="field"><span>Destination</span><input name="destination" value="${esc(calc.destination||p.country||"")}"></label><label class="field"><span>Our freight cost</span><input name="freightCost" data-calc-live type="number" min="0" step="0.01" value="${Number(calc.freightCost)||0}"></label><label class="field"><span>Customs duty (DDP)</span><input name="dutyCost" data-calc-live type="number" min="0" step="0.01" value="${Number(calc.dutyCost)||0}"></label><label class="field"><span>Import VAT (DDP)</span><input name="importVatCost" data-calc-live type="number" min="0" step="0.01" value="${Number(calc.importVatCost)||0}"></label><label class="field checkbox-field"><span>Import VAT as cost</span><input name="includeImportVatInCost" data-calc-live type="checkbox" ${calc.includeImportVatInCost?"checked":""}></label><label class="field"><span>Other import costs</span><input name="otherImportCost" data-calc-live type="number" min="0" step="0.01" value="${Number(calc.otherImportCost)||0}"></label></div></div>
      <div class="calc-section"><h4>3. Price & margin</h4><div class="form-grid"><label class="field"><span>Target margin, %</span><input name="targetMargin" data-calc-live type="number" min="0" max="95" step="0.1" value="${Number(calc.targetMargin)||45}"></label><label class="field"><span>Freight on customer quotation</span><select name="freightPresentation"><option ${calc.freightPresentation!=="Ingår i produktpris"?"selected":""}>Separate line</option><option ${calc.freightPresentation==="Ingår i produktpris"?"selected":""}>Included in product price</option></select></label><label class="field"><span>Freight charged to customer</span><input name="customerFreight" type="number" min="0" step="0.01" value="${Number(calc.customerFreight)||0}"></label><label class="field"><span>Validity, days</span><input name="validityDays" type="number" min="1" value="${Number(calc.validityDays)||30}"></label><label class="field"><span>Payment terms</span><input name="paymentTerms" value="${esc(calc.paymentTerms||"")}"></label><label class="field"><span>Delivery time</span><input name="deliveryTime" value="${esc(calc.deliveryTime||"")}" placeholder="Exempel: 14–16 weeks"></label><label class="field full"><span>Quotation comment / exclusions</span><textarea name="notes">${esc(calc.notes||"")}</textarea></label></div>
      <div class="calc-summary" data-calc-summary><div><span>Production cost</span><strong>${money(pc.productionCost,p.currency)}</strong></div><div><span>Freight</span><strong>${money(pc.freightCost,p.currency)}</strong></div><div><span>Customs/import</span><strong>${money(pc.dutyCost+pc.importVatCost+pc.otherImportCost,p.currency)}</strong></div><div><span>Total cost</span><strong>${money(pc.totalCost,p.currency)}</strong></div><div><span>Gross profit</span><strong>${money(pc.grossProfit,p.currency)}</strong></div><div class="calc-total"><span>Estimated quotation price</span><strong>${money(pc.salesPrice,p.currency)}</strong><small>${decimal(pc.margin)} % target margin</small></div></div></div>
      <div class="modal-footer split" style="margin:20px -23px -20px"><div class="modal-footer-group"><button type="button" class="button secondary" data-preview-quote-from-calc="${p.id}">Preview quotation</button></div><div class="modal-footer-group"><button type="button" class="button secondary" data-save-calculation="${p.id}">Save costing</button><button type="button" class="button primary" data-create-quote-from-calc="${p.id}">Create quotation version</button></div></div></form>`;
      setTimeout(()=>bindCalculationLive($("#calculationForm"),p.id),20);
    }
    else if (tab === "quotes") content = `<div class="section-action"><div><h3>Quotation versions</h3><span class="cell-secondary">Each new version saves a snapshot of the current articles.</span></div>${p.businessStatus!=="Vunnet"?`<button class="button primary" data-new-quote="${p.id}">＋ New quotation version</button>`:""}</div>${versions.length ? versions.map(q=>`<div class="attention-item"><span class="attention-symbol" style="--bg:#e6ebe3;--color:#536851">V${q.version}</span><div><button class="id-link" data-quote-id="${q.id}" data-version="${q.version}">${esc(quoteReference(q))} · ${money(q.amount)}</button><span>${q.margin.toFixed(1)}% margin · ${esc(uiLabel(q.status))} · ${(q.articleSnapshots||[]).length} articles</span></div><button data-quote-id="${q.id}" data-version="${q.version}">→</button></div>`).join("") : `<p class="detail-sub">No quotation created yet.</p>`}`;
    else if (tab === "delivery") content = `<form id="deliveryForm" data-project-id="${p.id}"><div class="section-action"><div><h3>Order & delivery</h3><span class="cell-secondary">Track the won project from acceptance to completion.</span></div>${statusBadge(p.deliveryStatus||"Väntar orderunderlag")}</div><div class="form-grid"><label class="field"><span>Delivery status</span><select name="deliveryStatus">${["Väntar orderunderlag","Orderbekräftad","Produktion","Klar för leverans","Levererad","Avslutad"].map(x=>`<option value="${esc(x)}" ${x===(p.deliveryStatus||"Väntar orderunderlag")?"selected":""}>${esc(uiLabel(x))}</option>`).join("")}</select></label><label class="field"><span>Estimated delivery</span><input name="deliveryDate" type="date" value="${p.deliveryDate||""}"></label><label class="field"><span>Customer PO number</span><input name="poNumber" value="${p.poNumber||""}"></label><label class="field"><span>Next activity</span><input name="next" value="${p.next||""}"></label><label class="field full"><span>Delivery comment</span><textarea name="deliveryComment">${p.deliveryComment||""}</textarea></label></div><div class="modal-footer" style="margin:20px -23px -20px"><button class="button primary">Save delivery tracking</button></div></form>`;
    else content = `<div class="detail-grid"><div class="detail-stat"><span>Phase</span><strong>${p.phase}</strong></div><div class="detail-stat"><span>Value</span><strong>${money(p.value,p.currency)}</strong></div><div class="detail-stat"><span>Probability</span><strong>${p.probability} %</strong></div></div><div class="calc-preview"><div><span>Articles</span><strong>${articles.length}</strong></div><div><span>Total area</span><strong>${decimal(totalArea)} m²</strong></div><div><span>Production cost</span><strong>${money(productionCost)}</strong></div></div>${p.businessStatus==="Vunnet"?`<div class="acceptance-box"><h3>Won business</h3><div class="acceptance-grid"><div><span>Accepted</span><strong>${date(p.acceptedAt)}</strong></div><div><span>Accepted quotation</span><strong>Quotation · V${p.acceptedQuoteVersion||"—"}</strong></div><div><span>Delivery status</span><strong>${esc(uiLabel(p.deliveryStatus||"Väntar orderunderlag"))}</strong></div></div></div>`:`<p class="article-form-note">Next, register the project articles and supplier price/m². Size changes are recalculated automatically and included in the next quotation version.</p>`}`;
    openModal(`<div class="modal-header"><div><h2 id="modalTitle">${p.name}</h2><p>${esc(p.customer)}</p></div><div>${p.businessStatus==="Vunnet"?statusBadge("Vunnet"):""}<button class="modal-close" data-close>×</button></div></div><div class="modal-body">${projectTabs(p,tab)}<div class="project-tab-content">${content}</div></div>${tab!=="delivery"?`<div class="modal-footer"><button class="button secondary" data-close>Close</button>${tab==="overview" ? `<button class="button primary" data-project-tab="articles" data-id="${p.id}">Visa articles</button>` : ""}</div>`:""}`);
  }

  function bindSameAddress(form) {
    if (!form) return;
    const cb=form.elements.sameAsBilling;
    const pairs=[["billingName","deliveryName"],["billingAddress","deliveryAddress"],["billingZip","deliveryZip"],["billingCity","deliveryCity"],["billingCountry","deliveryCountry"]];
    const sync=()=>{
      const same=cb?.checked;
      pairs.forEach(([from,to])=>{ if(form.elements[to]) { if(same) form.elements[to].value=form.elements[from]?.value||""; form.elements[to].disabled=!!same; }});
      const addressFields=form.querySelector("[data-delivery-address-fields]");
      if(addressFields) addressFields.hidden=!!same;
      ["deliveryContact","deliveryPhone"].forEach(name=>{ if(form.elements[name]) form.elements[name].disabled=false; });
    };
    cb?.addEventListener("change",sync);
    pairs.forEach(([from])=>form.elements[from]?.addEventListener("input",()=>{if(cb?.checked)sync();}));
    sync();
  }

  function customerSnapshot(project) {
    const cd=project?.customerData||{}; const billing={...(cd.billing||{})}; let delivery={...(cd.delivery||{})};
    if(cd.sameAsBilling!==false) delivery={...delivery,name:billing.name||project?.customer||"",address:billing.address||"",zip:billing.zip||"",city:billing.city||"",country:billing.country||project?.country||""};
    return {sameAsBilling:cd.sameAsBilling!==false,billing,delivery};
  }

  function cadFields(a={}){return `<fieldset><legend>CAD</legend><div class="form-grid">${field('cadUrl',"File link",a.cadUrl||'','url','pattern="https?://.+"')}${field('cadName',"Link name",a.cadName||'')}</div>${/^https?:\/\//i.test(a.cadUrl||'')?`<a href="${esc(a.cadUrl)}" target="_blank" rel="noopener noreferrer">${esc(a.cadName||"Open CAD")}</a>`:''}</fieldset>`;}
  function shapeField(a={}){return `<label class="field"><span>Shape</span><select name="shape">${a.shape==='Specialform'?"<option value=\"\" selected>Select shape (existing shape retained)</option>":''}${['Rektangulär','Rund'].map(x=>`<option value="${esc(x)}" ${a.shape===x?'selected':''}>${esc(uiLabel(x))}</option>`).join('')}</select></label>`;}
  function articleLocationField(value=''){const rooms=["Standard room","Superior room","Deluxe room","Family room","Junior suite","Suite",'Lobby / reception','Lounge',"Corridor","Restaurant",'Bar',"Conference room","Spa / relaxation","Other"];if(value&&!rooms.includes(uiLabel(value)))rooms.push(value);else if(value)rooms[rooms.indexOf(uiLabel(value))]=value;return `<label class="field"><span>Location</span><select name="location"><option value="">Select room type</option>${rooms.map(r=>`<option value="${esc(r)}" ${r===value?'selected':''}>${esc(uiLabel(r))}</option>`).join('')}</select></label>`;}
  function articleProductFields(pid,a={}){const p=state.projects.find(p=>p.id===pid);CDPStructure.products.sync(state);return `<div data-article-product-fields class="form-grid"><label class="field"><span>Product</span><select name="productId" required><option value="new" ${!a.productId?'selected':''}>＋ New product</option>${(p?.products||[]).map(x=>`<option value="${esc(x.id)}" ${x.id===a.productId?'selected':''}>${esc(x.name)}</option>`).join('')}</select></label><label class="field" data-new-product-name ${a.productId?'hidden':''}><span>Product name</span><input name="productName" value="" ${a.productId?'':'required'}></label></div>`;}
  function bindArticleProduct(f){
    if(f._productListener)f.removeEventListener('input',f._productListener);if(f._productChange)f.removeEventListener('change',f._productChange);
    const dimensionName=!f.dataset.editId||state.articles.find(a=>a.id===f.dataset.editId)?.nameMode==='dimensions';f.elements.name.readOnly=dimensionName;
    const refresh=(changed=false)=>{const p=state.projects.find(p=>p.id===f.elements.projectId.value),isNew=f.elements.productId.value==='new',product=isNew?{name:f.elements.productName.value}:p?.products?.find(x=>x.id===f.elements.productId.value);$('[data-new-product-name]',f).hidden=!isNew;f.elements.productName.required=isNew;f.elements.productName.disabled=!isNew;if(changed&&product&&!isNew)f.elements.specification.value=product.specification||'';if(dimensionName)f.elements.name.value=CDPStructure.products.articleName(product,Object.fromEntries(new FormData(f)));};
    f._productListener=()=>refresh();
    f._productChange=e=>refresh(e.target.name==='productId');f.addEventListener('input',f._productListener);f.addEventListener('change',f._productChange);refresh();
  }
  function productList(pid){CDPStructure.products.sync(state);const p=state.projects.find(p=>p.id===pid);v6Dialog('Products · '+p.name,`<div class="section-action"><p>Products shared by articles within this project.</p><button class="button primary" data-product-edit="new" data-p="${esc(pid)}">New product</button></div>${p.products.map(x=>`<section class="v6-card"><strong>${esc(x.name)}</strong><p>${state.articles.filter(a=>a.projectId===pid&&a.productId===x.id).length} articles · ${esc([x.material,x.colours,x.quality].filter(Boolean).join(' · '))}</p><button class="button secondary" data-product-edit="${esc(x.id)}" data-p="${esc(pid)}">Edit product</button><button class="text-button" data-product-article="${esc(x.id)}" data-p="${esc(pid)}">New article</button></section>`).join('')||'<p>No products yet.</p>'}`);}
  function editProduct(pid,id){const p=state.projects.find(p=>p.id===pid),product=p.products.find(x=>x.id===id)||{};v6Dialog(id==='new'?'New product':'Edit product',`<form id="projectProductForm" data-p="${esc(pid)}" data-id="${id==='new'?'':esc(id)}"><p>Shared specifications update linked articles unless a field has an article-specific override. Saved quotations and sent full-size sample orders remain unchanged.</p><div class="form-grid">${field('name','Product name',product.name||'','text','required')}${['design','construction','material','quality','pileHeight','colours','finish','nof'].map(k=>field(k,({pileHeight:'Pile height, mm',nof:'NOF / technical values',colours:'Colour / colour references'})[k]||k[0].toUpperCase()+k.slice(1),product[k]||'')).join('')}</div><label class="field"><span>Shared specification</span><textarea name="specification">${esc(product.specification||'')}</textarea></label><h3>Shared materials and components</h3><div class="table-scroll"><table><thead><tr><th>Component</th><th>Quantity</th><th>Unit</th><th>Specification</th><th></th></tr></thead><tbody id="v6BomRows">${(product.bom||[]).map(bomRow).join('')}</tbody></table></div><button type="button" class="button secondary" data-v6-add-bom>＋ Component</button><button class="button primary">Save product</button></form>`);}
  function linkArticleProduct(id){const a=state.articles.find(a=>a.id===id),p=state.projects.find(p=>p.id===a.projectId);v6Dialog('Link to product',`<form id="linkProductForm" data-id="${esc(id)}"><h3>${esc(a.name)}</h3><label class="field"><span>Product</span><select name="productId" required>${p.products.map(x=>`<option value="${esc(x.id)}" ${x.id===a.productId?'selected':''}>${esc(x.name)}</option>`).join('')}</select></label><label class="v6-check"><input type="checkbox" name="useProduct"> Use the product specifications and replace this article's technical overrides</label><p>Size, location, quantity and price are retained. Without the checkbox, different technical values remain article-specific.</p><button class="button primary">Save product link</button></form>`);}
  document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;const d=b.dataset;try{if(d.products)productList(d.products);if(d.productEdit)editProduct(d.p,d.productEdit);if(d.productArticle)openNewArticle(d.p,{productId:d.productArticle});if(d.linkProduct)linkArticleProduct(d.linkProduct);if(d.articleVariant){const a=state.articles.find(a=>a.id===d.articleVariant);openNewArticle(a.projectId,{productId:a.productId,shape:a.shape,widthCm:a.widthCm,lengthCm:a.lengthCm,location:a.location,quantity:1});}}catch(err){toast(err.message);}});
  document.addEventListener('submit',async e=>{const f=e.target;if(!['projectProductForm','linkProductForm'].includes(f.id))return;e.preventDefault();try{writableRfq();const fd=new FormData(f),v=Object.fromEntries(fd);if(f.id==='projectProductForm'){const p=state.projects.find(p=>p.id===f.dataset.p);v.name=fd.get('name');v.bom=$$('[data-bom-row]',f).map(row=>Object.fromEntries($$('input',row).map(el=>[el.name,el.type==='number'?Number(el.value):el.value])));CDPStructure.products.save(state,p,f.dataset.id,v);await persistRfq();renderAll();productList(p.id);}else{const a=state.articles.find(a=>a.id===f.dataset.id);CDPStructure.products.link(state,a,v.productId,fd.has('useProduct'));await persistRfq();renderAll();closeModal(true);filterProjectArticles();}toast('Saved.');}catch(err){toast(err.message);}});
  function articleForm(article = {}, forcedProjectId = "") {
    const projectId=forcedProjectId || article.projectId || state.projects[0]?.id || "";
    return `${articleProductFields(projectId,article)}<input type="hidden" name="projectId" value="${esc(projectId)}"><div class="form-grid">${field('name',"Article name",article.name||'','text','required')}${field('quantity',"Quantity",article.quantity||1,'number','min="1" step="1" required')}${articleLocationField(article.location||'')}${shapeField(article)}${field('widthCm',"Width / diameter, cm",article.widthCm||0,'number','min="0" step="0.01"')}${field('lengthCm',"Length, cm",article.lengthCm||0,'number','min="0" step="0.01"')}</div><label class="field"><span>Specification / design / material / colour</span><textarea name="specification">${esc(article.specification||'')}</textarea></label>`;
  }
  function bindArticleCalculation(form) {}

  function bomProjectName(id){return state.projects.find(p=>p.id===id)?.name||"Projects";}
  function openNewArticle(projectId = "", defaults = {}) {
    projectId=projectId||defaults.projectId||state.projects[0]?.id||'';
    openModal(`<form id="articleForm" ${defaults.sourceScopeId?`data-source-scope-id="${esc(defaults.sourceScopeId)}"`:""}><div class="modal-header"><div><h2 id="modalTitle">New project article</h2>${!arguments[0]&&!defaults.projectId?`<label class="field"><span>Project</span><select data-bom-project>${state.projects.map(p=>`<option value="${esc(p.id)}" ${p.id===projectId?'selected':''}>${esc(p.name)}</option>`).join('')}</select></label>`:''}<p>Article name is generated from width x length in cm. For round rugs, the diameter is used for both dimensions.</p></div><button type="button" class="modal-close" data-close>×</button></div><div class="modal-body">${articleForm(defaults,projectId)}<p class="article-form-note">For rectangular rugs, area is width × length. For round rugs, the diameter is used.</p></div><div class="modal-footer"><button type="button" class="button secondary" data-close>Cancel</button><button class="button primary">Save article</button></div></form>`);
    const form=$("#articleForm");bindArticleProduct(form); $('[data-bom-project]',form)?.addEventListener('change',e=>{form.elements.projectId.value=e.target.value; $('[data-article-product-fields]',form).outerHTML=articleProductFields(e.target.value,{});bindArticleProduct(form); $('#modalTitle').textContent="New project article";});
    bindArticleCalculation(form);
  }

  function legacy_openEditArticle(id) {
    const article=state.articles.find(a=>a.id===id); if(!article) return;
    openModal(`<form id="articleForm" data-edit-id="${id}"><div class="modal-header"><div><h2 id="modalTitle">Edit article – ${esc(article.name)}</h2><p>${esc(article.name)} · Changing the size recalculates the cost immediately.</p></div><button type="button" class="modal-close" data-close>×</button></div><div class="modal-body">${articleForm(article)}</div><div class="modal-footer"><button type="button" class="button secondary" data-close>Cancel</button><button class="button primary">Save changes</button></div></form>`);
    $("#articleForm [name=projectId]").style.pointerEvents="none"; $("#articleForm [name=projectId]").addEventListener("change",e=>{e.target.value=article.projectId;}); bindArticleCalculation($("#articleForm"));bindArticleProduct($("#articleForm"));
  }

  function legacy_openArticle(id) {
    const article=state.articles.find(a=>a.id===id); if(!article) return; const project=state.projects.find(p=>p.id===article.projectId);
    openModal(`<div class="modal-header"><div><h2 id="modalTitle">${article.name}</h2><p>${esc(publicReference(article.code))} · ${project?.name||"Projects"}</p></div><button class="modal-close" data-close>×</button></div><div class="modal-body"><div class="detail-top"><div><span class="detail-id">${esc(publicReference(article.code))}</span><div class="detail-title">${articleSize(article)}</div><div class="detail-sub">${article.location||"No location"} · ${article.manufacturer||"No manufacturer"}</div></div>${statusBadge(article.status)}</div><div class="calc-preview"><div><span>Calculated area</span><strong>${decimal(articleArea(article))} m²</strong></div><div><span>Approved production price</span><strong>${article.pricePerSqm?`${money(article.pricePerSqm,article.currency)}${priceUnitLabel(article.priceUnit)}`:"—"}</strong></div><div><span>Production cost</span><strong>${money(articleCost(article),article.currency)}</strong></div></div><div class="price-history"><div class="section-action"><h3>Price negotiation with manufacturer</h3><button class="button secondary" data-new-price="${article.id}">＋ Nytt price</button></div>${article.priceHistory.length ? [...article.priceHistory].reverse().map(price=>`<div class="price-entry"><time>${date(price.date)}</time><span><strong>${price.manufacturer}</strong><span class="cell-secondary">Valid until ${date(price.validUntil)}</span></span><strong>${money(price.pricePerSqm,price.currency)}${priceUnitLabel(price.priceUnit)}</strong>${statusBadge(price.status)}</div>`).join("") : `<p class="detail-sub">No prices recorded yet.</p>`}</div></div><div class="modal-footer"><button class="button secondary" data-project-tab="articles" data-id="${article.projectId}">Till projektet</button><button class="button primary" data-edit-article="${article.id}">Edit article/size</button></div>`);
  }

  function openNewPrice(id) {
    const article=state.articles.find(a=>a.id===id); if(!article) return; if(article.selectedRfqId){openProject(article.projectId,"rfq");return;}
    const manufacturerOptions = `<option value="">— Select manufacturer —</option>` + state.manufacturers.filter(m=>m.active!==false || m.id===article.manufacturerId).map(m=>`<option value="${m.id}" ${m.id===article.manufacturerId || (!article.manufacturerId && m.name===article.manufacturer)?"selected":""}>${esc(m.name)}</option>`).join("");
    openModal(`<form id="priceForm" data-article-id="${id}"><div class="modal-header"><div><h2 id="modalTitle">New supplier price</h2><p>${esc(publicReference(article.code))} · ${article.name}</p></div><button type="button" class="modal-close" data-close>×</button></div><div class="modal-body"><div class="form-grid"><label class="field"><span>Date</span><input name="date" type="date" required value="${new Date().toISOString().slice(0,10)}"></label><label class="field"><span>Manufacturer *</span><select name="manufacturerId" required>${manufacturerOptions}</select></label><label class="field"><span>Price *</span><input name="pricePerSqm" required type="number" min="0" step="0.01" value="${article.pricePerSqm||""}"></label><label class="field"><span>Price unit</span><select name="priceUnit"><option ${article.priceUnit!=="per styck"&&article.priceUnit!=="fast pris"?"selected":""}>per m²</option><option ${article.priceUnit==="per styck"?"selected":""}>per item</option><option ${article.priceUnit==="fast pris"?"selected":""}>fixed price</option></select></label><label class="field"><span>Currency</span><select name="currency"><option ${article.currency!=="USD"?"selected":""}>EUR</option><option ${article.currency==="USD"?"selected":""}>USD</option></select></label><label class="field"><span>Valid until</span><input name="validUntil" type="date"></label><label class="field"><span>Price status</span><select name="priceStatus"><option value="Förfrågan">Enquiry</option><option value="Förhandlas">Under negotiation</option><option value="Godkänt">Approved</option></select></label></div><p class="article-form-note">The approved price becomes the article's current production price and receives an approval date automatically.</p></div><div class="modal-footer"><button type="button" class="button secondary" data-article-id="${id}">Cancel</button><button class="button primary">Save price</button></div></form>`);
  }

  function articleSnapshot(article) { return { articleId:article.id, code:article.code, name:article.name, quantity:Number(article.quantity)||1, location:article.location, shape:article.shape, widthCm:article.widthCm, lengthCm:article.lengthCm, area:articleArea(article), totalArea:articleTotalArea(article), manufacturer:article.manufacturer, manufacturerId:article.manufacturerId||"", currency:article.currency, pricePerSqm:article.pricePerSqm, priceUnit:article.priceUnit||"per m²", status:article.status, additionalCost:article.additionalCost, unitCost:articleUnitCost(article), cost:articleCost(article) }; }

  function saveCalculationFromForm(projectId, quiet=false) {
    const p=state.projects.find(x=>x.id===projectId); const form=$("#calculationForm"); if(!p||!form) return null;
    const v=Object.fromEntries(new FormData(form));
    p.calculation={deliveryTerm:v.deliveryTerm||"DAP",destination:v.destination||"",freightCost:Number(v.freightCost)||0,dutyCost:Number(v.dutyCost)||0,importVatCost:Number(v.importVatCost)||0,otherImportCost:Number(v.otherImportCost)||0,includeImportVatInCost:form.elements.includeImportVatInCost?.checked||false,targetMargin:Number(v.targetMargin)||0,freightPresentation:v.freightPresentation||"Separat rad",customerFreight:Number(v.customerFreight)||0,validityDays:Number(v.validityDays)||30,paymentTerms:v.paymentTerms||"",deliveryTime:v.deliveryTime||"",notes:v.notes||""};
    const pc=projectCalculation(p,state.articles.filter(a=>a.projectId===projectId)); p.value=Math.round(pc.salesPrice); saveState(); renderAll(); if(!quiet) toast("The costing has been saved."); return pc;
  }

  function bindCalculationLive(form, projectId) {
    if (!form) return;

    const freightInput = form.elements.freightCost;
    const customerFreightInput = form.elements.customerFreight;
    let previousFreight = Number(freightInput?.value) || 0;

    const update = () => {
      const p = state.projects.find(x => x.id === projectId);
      if (!p) return;
      const v = Object.fromEntries(new FormData(form));
      const draft = {
        ...p,
        calculation: {
          ...(p.calculation || {}),
          deliveryTerm: v.deliveryTerm,
          freightCost: Number(v.freightCost) || 0,
          dutyCost: Number(v.dutyCost) || 0,
          importVatCost: Number(v.importVatCost) || 0,
          otherImportCost: Number(v.otherImportCost) || 0,
          includeImportVatInCost: form.elements.includeImportVatInCost?.checked || false,
          targetMargin: Number(v.targetMargin) || 0
        }
      };
      const pc = projectCalculation(draft, state.articles.filter(a => a.projectId === projectId));
      const box = $("[data-calc-summary]", form);
      if (box) box.innerHTML = `<div><span>Production cost</span><strong>${money(pc.productionCost,p.currency)}</strong></div><div><span>Freight</span><strong>${money(pc.freightCost,p.currency)}</strong></div><div><span>Customs/import</span><strong>${money(pc.dutyCost+pc.importVatCost+pc.otherImportCost,p.currency)}</strong></div><div><span>Total cost</span><strong>${money(pc.totalCost,p.currency)}</strong></div><div><span>Gross profit</span><strong>${money(pc.grossProfit,p.currency)}</strong></div><div class="calc-total"><span>Estimated quotation price</span><strong>${money(pc.salesPrice,p.currency)}</strong><small>${decimal(pc.margin)} % target margin</small></div>`;
    };

    // Defaultregel för kundfrakt:
    // 1) 0 -> nytt belopp: kundfrakten sätts till samma belopp.
    // 2) Befintligt belopp -> nytt belopp: kundfrakten flyttas med samma differens.
    // Ett manuellt kundfraktpåslag bevaras därmed vid senare ändringar av vår fraktkostnad.
    if (freightInput && customerFreightInput) {
      freightInput.addEventListener("input", () => {
        const newFreight = Number(freightInput.value) || 0;
        const currentCustomerFreight = Number(customerFreightInput.value) || 0;

        if (previousFreight === 0) {
          customerFreightInput.value = String(newFreight);
        } else {
          const difference = newFreight - previousFreight;
          customerFreightInput.value = String(Math.max(0, currentCustomerFreight + difference));
        }

        previousFreight = newFreight;
        update();
      });
    }

    $$('[data-calc-live]', form).forEach(el => {
      if (el !== freightInput) el.addEventListener("input", update);
    });
    update();
  }

  function legacy_addQuoteVersion(projectId) {
    const p=state.projects.find(x=>x.id===projectId); if(!p) return; saveCalculationFromForm(projectId,true); const articles=state.articles.filter(a=>a.projectId===projectId); if(!articles.length){toast("Add at least one article before creating the quotation.");return;} const existing=state.quotations.filter(q=>q.projectId===projectId); const version=Math.max(0,...existing.map(q=>q.version))+1; existing.filter(q=>q.status==="Utkast").forEach(q=>q.status="Ersatt"); const articleSnapshots=articles.map(articleSnapshot); const pc=projectCalculation(p,articles); const calcSnapshot=JSON.parse(JSON.stringify(p.calculation||{})); state.quotations.push({id:`Q-${projectId.slice(2)}`,projectId,project:p.name,version,amount:Math.round(pc.salesPrice),margin:pc.margin,status:"Utkast",created:new Date().toISOString().slice(0,10),articleSnapshots,calculationSnapshot:calcSnapshot,costSnapshot:pc,companySnapshot:JSON.parse(JSON.stringify(state.company||{})),customerSnapshot:customerSnapshot(p)}); p.value=Math.round(pc.salesPrice); saveState(); renderAll(); openProject(projectId,"quotes"); toast(`Quotation version V${version} created. The costing is frozen in this version.`);
  }

  function legacy_previewQuoteFromCalculation(projectId) {
    const p=state.projects.find(x=>x.id===projectId); const form=$("#calculationForm"); if(!p||!form) return;
    const articles=state.articles.filter(a=>a.projectId===projectId); if(!articles.length){toast("Add at least one article before previewing the quotation.");return;}
    const v=Object.fromEntries(new FormData(form));
    const previewCalc={deliveryTerm:v.deliveryTerm||"DAP",destination:v.destination||"",freightCost:Number(v.freightCost)||0,dutyCost:Number(v.dutyCost)||0,importVatCost:Number(v.importVatCost)||0,otherImportCost:Number(v.otherImportCost)||0,includeImportVatInCost:form.elements.includeImportVatInCost?.checked||false,targetMargin:Number(v.targetMargin)||0,freightPresentation:v.freightPresentation||"Separat rad",customerFreight:Number(v.customerFreight)||0,validityDays:Number(v.validityDays)||30,paymentTerms:v.paymentTerms||"",deliveryTime:v.deliveryTime||"",notes:v.notes||""};
    const tempProject={...p,calculation:previewCalc};
    const pc=projectCalculation(tempProject,articles);
    const q={id:"PREVIEW",projectId:p.id,project:p.name,version:"—",amount:Math.round(pc.salesPrice),margin:pc.margin,status:"Utkast",created:new Date().toISOString().slice(0,10),articleSnapshots:articles.map(articleSnapshot),calculationSnapshot:previewCalc,costSnapshot:pc,companySnapshot:JSON.parse(JSON.stringify(state.company||{})),customerSnapshot:customerSnapshot(p),isPreview:true};
    renderQuotePdf(q,p,{autoPrint:false,preview:true});
  }

  function findQuote(id, version) { return state.quotations.find(q=>q.id===id && q.version===Number(version)); }

  function legacy_openQuote(id, version) {
    const q=findQuote(id,version); if(!q) return; const project=state.projects.find(p=>p.id===q.projectId); const snapshots=q.articleSnapshots||[]; const productionCost=snapshots.reduce((s,a)=>s+(a.cost||0),0); const cs=q.costSnapshot||{}; const calc=q.calculationSnapshot||{};
    const articleTable=snapshots.length?`<div class="table-scroll"><table><thead><tr><th>Article</th><th>Description</th><th>Size</th><th>m²</th><th>Price/m²</th><th>Cost</th></tr></thead><tbody>${snapshots.map(a=>`<tr><td>${esc(publicReference(a.code))}</td><td><span class="cell-primary">${a.name}</span><span class="cell-secondary">${a.location||"—"}</span></td><td>${a.shape==="Rund"?`Ø ${a.widthCm} cm`:`${a.widthCm} × ${a.lengthCm} cm`}</td><td>${decimal(a.area)}</td><td>${money(a.pricePerSqm,a.currency)}/m²</td><td class="cost-value">${money(a.cost,a.currency)}</td></tr>`).join("")}</tbody></table></div>`:`<p class="detail-sub">This older example version has no article snapshot.</p>`;
    const acceptance=q.status==="Accepterad"?`<div class="acceptance-box"><h3>Accepted quotation · ${money(q.acceptedAmount??q.amount)}</h3><div class="acceptance-grid"><div><span>Accepted</span><strong>${date(q.acceptedAt)}</strong></div><div><span>Accepted by</span><strong>${q.acceptedBy||"—"}</strong></div><div><span>Method</span><strong>${q.acceptanceMethod||"—"}</strong></div><div><span>PO-nummer</span><strong>${q.poNumber||"—"}</strong></div><div><span>Delivery</span><strong>${date(q.deliveryDate)}</strong></div><div><span>Delivery status</span><strong>${esc(uiLabel(project?.deliveryStatus||"Väntar orderunderlag"))}</strong></div></div>${q.acceptanceComment?`<p class="detail-sub" style="margin:12px 0 0">${q.acceptanceComment}</p>`:""}<div class="locked-note">The quotation version is locked and cannot be changed.</div></div>`:"";
    let actions="";
    if(q.status==="Utkast") actions=`<button class="button primary" data-mark-sent="${esc(q.id)}" data-version="${q.version}">Mark as sent</button>`;
    else if(q.status==="Skickad") actions=`<button class="button danger" data-mark-declined="${esc(q.id)}" data-version="${q.version}">Mark declined</button><button class="button primary" data-accept-quote="${esc(q.id)}" data-version="${q.version}">✓ Mark as accepted</button>`;
    else if(q.status==="Accepterad") actions=`<button class="button primary" data-project-tab="delivery" data-id="${q.projectId}">Track order & delivery</button>`;
    openModal(`<div class="modal-header"><div><h2 id="modalTitle">${esc(quoteReference(q))} · V${q.version}</h2><p>${q.project} · created ${date(q.created)}</p></div><div>${statusBadge(q.status)}<button class="modal-close" data-close>×</button></div></div><div class="modal-body"><div class="detail-grid"><div class="detail-stat"><span>Quotation amount</span><strong>${money(q.amount)}</strong></div><div class="detail-stat"><span>Margin</span><strong>${decimal(q.margin)} %</strong></div><div class="detail-stat"><span>Production cost</span><strong>${snapshots.length?money(productionCost):"—"}</strong></div><div class="detail-stat"><span>Delivery</span><strong>${calc.deliveryTerm||"—"}</strong></div><div class="detail-stat"><span>Total estimated cost</span><strong>${cs.totalCost!=null?money(cs.totalCost):"—"}</strong></div></div><div class="section-action"><h3>Articles in this version</h3><span class="cell-secondary">${snapshots.length} articles · frozen snapshot</span></div>${articleTable}${acceptance}</div><div class="modal-footer split"><div class="modal-footer-group"><button class="button secondary" data-export-quote-excel="${esc(q.id)}" data-version="${q.version}">Excel</button><button class="button secondary" data-export-quote-pdf="${esc(q.id)}" data-version="${q.version}">PDF / Skriv ut</button></div><div class="modal-footer-group">${actions}<button class="button secondary" data-close>Close</button></div></div>`);
  }

  function openAcceptanceForm(id, version) {
    const q=findQuote(id,version); if(!q) return; const project=state.projects.find(p=>p.id===q.projectId);
    openModal(`<form id="acceptanceForm" data-quote-id="${q.id}" data-version="${q.version}"><div class="modal-header"><div><h2 id="modalTitle">Accept ${esc(quoteReference(q))} · V${q.version}</h2><p>The quotation will be locked and the project marked as Won.</p></div><button type="button" class="modal-close" data-close>×</button></div><div class="modal-body"><div class="form-grid"><label class="field"><span>Acceptance date *</span><input name="acceptedAt" type="date" required value="${new Date().toISOString().slice(0,10)}"></label><label class="field"><span>Accepted by *</span><input name="acceptedBy" required placeholder="Kundens contact person"></label><label class="field"><span>Acceptance method</span><select name="acceptanceMethod"><option value="Signerad offert">Signed quotation</option><option value="E-post">Email</option><option value="Kundportal">Customer portal</option><option value="Inköpsorder">Purchase order</option></select></label><label class="field"><span>Customer PO number</span><input name="poNumber"></label><label class="field"><span>Accepted amount</span><input name="amount" type="number" min="0" step="0.01" value="${q.amount}"></label><label class="field"><span>Estimated delivery</span><input name="deliveryDate" type="date" value="${project?.deliveryDate||""}"></label><label class="field full"><span>Comment</span><textarea name="acceptanceComment"></textarea></label></div><p class="article-form-note">Saving marks the project's other ongoing quotation versions as Superseded. The accepted version can no longer be edited.</p></div><div class="modal-footer"><button type="button" class="button secondary" data-quote-id="${q.id}" data-version="${q.version}">Cancel</button><button class="button primary">Confirm acceptance</button></div></form>`);
  }

  function markQuoteSent(id, version) { const q=findQuote(id,version); if(!q||q.status!=="Utkast") return; q.status="Skickad"; const project=state.projects.find(p=>p.id===q.projectId); if(project){project.phase="Offert skickad";project.next="Follow up sent quotation";} saveState(); renderAll(); openQuote(id,version); toast("The quotation has been marked as sent."); }
  function unusedLegacyDecline(id, version) { const q=findQuote(id,version); if(!q||q.status!=="Skickad") return; q.status="Avböjd"; state.quotations.filter(other=>other.projectId===q.projectId && other!==q && ["Utkast","Intern granskning","Skickad","Revidering begärd"].includes(other.status)).forEach(other=>other.status="Ersatt"); const project=state.projects.find(p=>p.id===q.projectId); if(project){project.businessStatus="Förlorat";project.phase="Förlorat";project.probability=0;project.next="Record reason for loss";} saveState(); renderAll(); closeModal(); quotationFilter="lost"; showView("quotations"); renderQuotations(); toast("The quotation has been marked as declined and the project as lost."); }

  function quoteCustomerRows(q) {
    const snaps=q.articleSnapshots||[]; const totalCost=snaps.reduce((s,a)=>s+(Number(a.cost)||0),0); const calc=q.calculationSnapshot||{}; const freightShown=calc.freightPresentation==="Separat rad" ? Number(calc.customerFreight)||0 : 0; const productRevenue=Math.max(0,(Number(q.amount)||0)-freightShown); return snaps.map(a=>{const share=totalCost>0?(Number(a.cost)||0)/totalCost:(snaps.length?1/snaps.length:0); return {...a,salesTotal:productRevenue*share,salesUnit:(productRevenue*share)/(Number(a.quantity)||1)};});
  }
  function quotePartyData(q,p) {
    const company=q.companySnapshot||state.company||{};
    const customer=q.customerSnapshot||customerSnapshot(p); return {company,customer};
  }
  function addDaysIso(iso,days){ const d=new Date(`${iso}T12:00:00`); d.setDate(d.getDate()+(Number(days)||0)); return d.toISOString().slice(0,10); }
  function legacy_exportQuoteExcel(id,version){
    const q=findQuote(id,version); if(!q)return; const p=state.projects.find(x=>x.id===q.projectId); const rows=quoteCustomerRows(q); const calc=q.calculationSnapshot||{}; const {company,customer}=quotePartyData(q,p); const b=customer.billing||{}, d=customer.delivery||{};
    const escXml=v=>String(v??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); const tr=(cells)=>`<tr>${cells.map(c=>`<td>${escXml(c)}</td>`).join("")}</tr>`;
    const html=`<html><head><meta charset="utf-8"></head><body><table><tr><th colspan="6">${escXml(company.name||"Cappelen Dimyr Projects AB")} - QUOTATION ${esc(quoteReference(q))} V${q.version}</th></tr>${tr(["Date",q.created,"Valid until",addDaysIso(q.created,calc.validityDays||30),"Currency",p?.currency||"EUR"])}${tr(["Org no",company.orgNumber||"","VAT",company.vatNumber||"","EORI",company.eori||""])}${tr(["IBAN",company.iban||"","BIC/SWIFT",company.bic||"","Delivery",`${calc.deliveryTerm||""} ${calc.destination||""}`])}${tr(["BILL TO",b.name||p?.customer||"","SHIP TO",d.name||p?.customer||"","Project",q.project])}${tr(["Address",b.address||"","Address",d.address||"","",""])}${tr(["ZIP / City",`${b.zip||""} ${b.city||""}`,"ZIP / City",`${d.zip||""} ${d.city||""}`,"",""])}${tr(["Country",b.country||"","Country",d.country||"","",""])}${tr(["Article","Description","Qty","Size","Unit price","Total"])}${rows.map(r=>tr([publicReference(r.code),r.name,r.quantity||1,r.shape==="Rund"?`Ø ${r.widthCm} cm`:`${r.widthCm} x ${r.lengthCm} cm`,r.salesUnit.toFixed(2),r.salesTotal.toFixed(2)])).join("")}${calc.freightPresentation==="Separat rad"?tr(["Freight","",1,"","",Number(calc.customerFreight||0).toFixed(2)]):""}${tr(["TOTAL","","","","",Number(q.amount||0).toFixed(2)])}${tr(["Payment terms",calc.paymentTerms||"","Delivery time",calc.deliveryTime||"","Validity",`${calc.validityDays||30} days`])}</table></body></html>`;
    const blob=new Blob([html],{type:"application/vnd.ms-excel;charset=utf-8"}); const a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download=`${esc(quoteReference(q))}_V${q.version}.xls`; a.click(); URL.revokeObjectURL(a.href);
  }
  function exportQuotePdf(id,version){
    const q=findQuote(id,version); if(!q)return; const p=state.projects.find(x=>x.id===q.projectId); renderQuotePdf(q,p,{autoPrint:true,preview:false});
  }

  function legacy_renderQuotePdf(q,p,{autoPrint=true,preview=false}={}){
    const rows=quoteCustomerRows(q); const calc=q.calculationSnapshot||{}; const {company,customer}=quotePartyData(q,p); const b=customer.billing||{}, d=customer.delivery||{}; const currency=p?.currency||"EUR"; const validUntil=addDaysIso(q.created,calc.validityDays||30);
    const addr=x=>[x.name,x.address,[x.zip,x.city].filter(Boolean).join(" "),x.country].filter(Boolean).map(esc).join("<br>");
    const seller=[company.name,company.address,[company.zip,company.city].filter(Boolean).join(" "),company.country].filter(Boolean).map(esc).join("<br>");
    const ddpText=calc.deliveryTerm==="DDP"?"Freight, customs duties and import charges are included according to the delivery terms stated above.":"Import duties, taxes and customs clearance at destination are not included and are the responsibility of the buyer.";
    const title=preview?"QUOTATION PREVIEW":"QUOTATION"; const quoteNo=preview?"PREVIEW":quoteReference(q); const versionText=preview?"—":q.version;
    const w=window.open("","_blank"); if(!w){toast("Allow pop-ups to view quotations.");return;}
    w.document.write(`<!doctype html><html><head><title>${preview?"Preview ":""}${q.project}</title><meta charset="utf-8"><style>
      @page{size:A4;margin:16mm}*{box-sizing:border-box}body{font-family:Arial,Helvetica,sans-serif;margin:0;color:#232321;font-size:11px;line-height:1.45}.preview-banner{display:${preview?"block":"none"};position:fixed;top:42%;left:14%;font-size:68px;letter-spacing:.12em;font-weight:700;color:rgba(0,0,0,.055);transform:rotate(-28deg);z-index:-1;white-space:nowrap}.top{display:flex;justify-content:space-between;gap:30px;border-bottom:2px solid #232321;padding-bottom:18px}.brand{font-size:21px;letter-spacing:.08em;font-weight:700}.quote-title{text-align:right}.quote-title h1{font-size:26px;margin:0 0 8px;font-weight:500}.meta{display:grid;grid-template-columns:auto auto;gap:3px 18px}.meta span:nth-child(odd){color:#777}.parties{display:grid;grid-template-columns:1fr 1fr 1fr;gap:25px;margin:28px 0}.label{font-size:9px;letter-spacing:.12em;text-transform:uppercase;color:#777;margin-bottom:7px;font-weight:700}.party strong{font-size:12px}.projectline{background:#f4f3ef;padding:12px 14px;margin:0 0 22px;display:grid;grid-template-columns:2fr 1fr 1fr;gap:15px}table{width:100%;border-collapse:collapse;margin:0 0 20px}th{font-size:9px;letter-spacing:.08em;text-transform:uppercase;text-align:left;border-bottom:1px solid #555;padding:8px 6px}td{padding:10px 6px;border-bottom:1px solid #ddd;vertical-align:top}.num{text-align:right}.total td{border-top:2px solid #232321;border-bottom:0;font-size:15px;font-weight:700;padding-top:13px}.terms{display:grid;grid-template-columns:1fr 1fr;gap:14px 30px;margin:26px 0}.terms div{border-top:1px solid #ccc;padding-top:8px}.footer{margin-top:30px;padding-top:12px;border-top:1px solid #bbb;display:grid;grid-template-columns:2fr 1fr;gap:20px;color:#555;font-size:9.5px}.bank{text-align:right}.print{margin:25px 0;padding:9px 15px}.preview-note{margin:18px 0 0;padding:10px 12px;background:#f4f3ef;color:#666;font-size:10px}@media print{.print,.preview-note{display:none}}
    </style></head><body><div class="preview-banner">PREVIEW</div><div class="top"><div><div class="brand">${esc(company.name||"CAPPELEN DIMYR PROJECTS")}</div><div style="margin-top:8px">${seller}</div></div><div class="quote-title"><h1>${title}</h1><div class="meta"><span>Quotation no.</span><strong>${quoteNo}</strong><span>Version</span><strong>${versionText}</strong><span>Date</span><strong>${date(q.created)}</strong><span>Valid until</span><strong>${date(validUntil)}</strong><span>Currency</span><strong>${esc(currency)}</strong></div></div></div>
    <div class="parties"><div class="party"><div class="label">Bill to</div>${addr(b)}${b.vatNumber?`<br>VAT: ${esc(b.vatNumber)}`:""}${b.contact?`<br>Att: ${esc(b.contact)}`:""}${b.email?`<br>${esc(b.email)}`:""}</div><div class="party"><div class="label">Ship to</div>${addr(d)}${d.contact?`<br>Att: ${esc(d.contact)}`:""}${d.phone?`<br>${esc(d.phone)}`:""}</div><div class="party"><div class="label">Seller details</div>${company.orgNumber?`Org no: ${esc(company.orgNumber)}<br>`:""}${company.vatNumber?`VAT: ${esc(company.vatNumber)}<br>`:""}${company.eori?`EORI: ${esc(company.eori)}<br>`:""}${company.email?`${esc(company.email)}<br>`:""}${company.phone?`${esc(company.phone)}<br>`:""}${company.web?esc(company.web):""}</div></div>
    <div class="projectline"><div><div class="label">Project</div><strong>${esc(q.project)}</strong></div><div><div class="label">Delivery terms</div><strong>${esc(calc.deliveryTerm||"—")} ${esc(calc.destination||"")}</strong></div><div><div class="label">Delivery time</div><strong>${esc(calc.deliveryTime||"—")}</strong></div></div>
    <table><thead><tr><th>Item</th><th>Description</th><th>Size</th><th>Qty</th><th class="num">Unit price</th><th class="num">Total</th></tr></thead><tbody>${rows.map((r,i)=>`<tr><td>${i+1}</td><td><strong>${esc(r.name)}</strong>${r.location?`<br><small>${esc(r.location)}</small>`:""}</td><td>${r.shape==="Rund"?`Ø ${r.widthCm} cm`:`${r.widthCm} × ${r.lengthCm} cm`}</td><td>${r.quantity||1}</td><td class="num">${money(r.salesUnit,currency)}</td><td class="num">${money(r.salesTotal,currency)}</td></tr>`).join("")}${calc.freightPresentation==="Separat rad"?`<tr><td></td><td><strong>Freight</strong></td><td>${esc(calc.deliveryTerm||"")}</td><td>1</td><td></td><td class="num">${money(Number(calc.customerFreight)||0,currency)}</td></tr>`:""}<tr class="total"><td colspan="5">TOTAL QUOTATION</td><td class="num">${money(q.amount,currency)}</td></tr></tbody></table>
    <div class="terms"><div><div class="label">Payment terms</div>${esc(calc.paymentTerms||"—")}</div><div><div class="label">Validity</div>${calc.validityDays||30} days</div><div><div class="label">Delivery / import</div>${esc(ddpText)}</div><div><div class="label">Notes</div>${calc.notes?esc(calc.notes):"—"}</div></div>
    <div class="footer"><div>${esc(company.name||"")} · ${esc(company.address||"")} · ${esc([company.zip,company.city].filter(Boolean).join(" "))} · ${esc(company.country||"")}</div><div class="bank">${company.iban?`IBAN ${esc(company.iban)}<br>`:""}${company.bic?`BIC/SWIFT ${esc(company.bic)}`:""}</div></div>${preview?`<div class="preview-note">Preview generated from the current calculation. No quotation version has been created or locked.</div>`:""}<button class="print" onclick="window.print()">Print / Save as PDF</button></body></html>`); w.document.close(); if(autoPrint)setTimeout(()=>w.print(),250);
  }

  function handleSubmit(event) {
    if(event.target.id === "leadForm") {
      event.preventDefault(); const values=Object.fromEntries(new FormData(event.target)); const editId=event.target.dataset.editId;
      if(editId) store.updateLead(editId,{name:values.name,expectedStart:values.expectedStart,comments:values.comments});
      else store.createLead({name:values.name,expectedStart:values.expectedStart,comments:values.comments});
      renderAll(); closeModal(); showView("leads"); toast(editId ? "The lead has been updated." : "The lead has been added."); return;
    }
    if(event.target.id === "newInquiryForm") {
      event.preventDefault();
      saveNewInquiryForm(event.target);
      return;
    }
    if(event.target.id === "inquiryCustomerForm") {
      event.preventDefault(); const v=Object.fromEntries(new FormData(event.target)); const i=state.inquiries.find(x=>x.id===event.target.dataset.inquiryId); if(!i)return;
      i.customerData={name:v.name||i.customer||"",contact:v.contact||"",email:v.email||"",phone:v.phone||"",address:v.address||"",zip:v.zip||"",city:v.city||"",country:v.country||i.country||"",vatNumber:v.vatNumber||""};
      i.customer=i.customerData.name||i.customer; i.country=i.customerData.country||i.country; saveState(); renderAll(); openInquiry(i.id,"customer"); toast("Customer details have been saved."); return;
    }
    if(event.target.id === "inquiryScopeForm") {
      event.preventDefault(); const i=state.inquiries.find(x=>x.id===event.target.dataset.inquiryId); if(!i)return;
      const rows=[]; $$('[data-scope-row]',event.target).forEach((tr,index)=>{ const q=n=>$(n,tr)?.value||""; const description=q('[name="scopeDescription"]'); const width=Number(q('[name="scopeWidth"]'))||0; const length=Number(q('[name="scopeLength"]'))||0; const comment=q('[name="scopeComment"]'); if(!description && !width && !length && !comment && index>0)return; rows.push({id:q('[name="scopeId"]')||`SCOPE-${i.id}-${String(index+1).padStart(2,"0")}`,type:q('[name="scopeType"]')||"Rug",description,quantity:Math.max(1,Number(q('[name="scopeQuantity"]'))||1),widthCm:width,lengthCm:length,comment,convertedArticleId:null}); });
      i.preliminaryScope=rows; i.area=rows.reduce((sum,row)=>sum+scopeRowArea(row),0); saveState(); renderAll(); openInquiry(i.id,"scope"); toast("The preliminary scope has been saved."); return;
    }
    if(event.target.id === "manufacturerForm") {
      event.preventDefault(); const v=Object.fromEntries(new FormData(event.target)); const editId=event.target.dataset.editId;
      if(editId){ const m=state.manufacturers.find(x=>x.id===editId); if(m){ const oldName=m.name; Object.assign(m,{name:v.name,country:v.country||"",contact:v.contact||"",email:v.email||"",phone:v.phone||"",currency:v.currency||"EUR",active:event.target.elements.active?.checked||false}); state.articles.filter(a=>a.manufacturerId===m.id || (!a.manufacturerId && a.manufacturer===oldName)).forEach(a=>{a.manufacturerId=m.id;a.manufacturer=m.name;}); } }
      else { const n=Math.max(0,...state.manufacturers.map(m=>Number(String(m.id||"").split("-").pop())||0))+1; state.manufacturers.push({id:crypto.randomUUID(),name:v.name,country:v.country||"",contact:v.contact||"",email:v.email||"",phone:v.phone||"",currency:v.currency||"EUR",active:event.target.elements.active?.checked!==false}); }
      saveState(); renderAll(); closeModal(); showView("manufacturers"); toast(editId?"The manufacturer has been updated.":"The manufacturer has been added."); return;
    }
    if(event.target.id === "companySettingsForm") {
      event.preventDefault(); const v=Object.fromEntries(new FormData(event.target)); state.company={...state.company,...v}; saveState(); renderSettings(); toast("Company details have been saved."); return;
    }
    if(event.target.id === "projectCustomerForm") {
      event.preventDefault(); const v=Object.fromEntries(new FormData(event.target)); const p=state.projects.find(x=>x.id===event.target.dataset.projectId); if(!p)return;
      const same=event.target.elements.sameAsBilling?.checked||false; const billing={name:v.billingName||"",address:v.billingAddress||"",zip:v.billingZip||"",city:v.billingCity||"",country:v.billingCountry||"",vatNumber:v.billingVatNumber||"",contact:v.billingContact||"",email:v.billingEmail||""};
      const delivery=same?{name:billing.name,address:billing.address,zip:billing.zip,city:billing.city,country:billing.country,contact:v.deliveryContact||"",phone:v.deliveryPhone||""}:{name:v.deliveryName||"",address:v.deliveryAddress||"",zip:v.deliveryZip||"",city:v.deliveryCity||"",country:v.deliveryCountry||"",contact:v.deliveryContact||"",phone:v.deliveryPhone||""};
      p.customer=billing.name||p.customer; p.country=billing.country||p.country; p.customerData={sameAsBilling:same,billing,delivery}; saveState(); renderAll(); openProject(p.id,"customer"); toast("Customer and address details have been saved."); return;
    }
    if(event.target.id === "articleForm") {
      event.preventDefault(); const values=Object.fromEntries(new FormData(event.target)); const editId=event.target.dataset.editId;
      const dimensionName=!editId||state.articles.find(a=>a.id===editId)?.nameMode==='dimensions';if(dimensionName)values.name=CDPStructure.products.articleName(null,values);
      try { if(dimensionName&&!values.name)throw Error('Enter width and length to generate the article name.');values.name=CDPStructure.articleName(state,values.projectId,values.name,editId,dimensionName); } catch(err) { toast(err.message); return; } const base={specification:values.specification||"",projectId:values.projectId,name:values.name,quantity:Number(values.quantity)||1,location:values.location,shape:values.shape||(state.articles.find(a=>a.id===editId)?.shape)||"Rektangulär",widthCm:Number(values.widthCm)||0,lengthCm:Number(values.lengthCm)||0,...Object.fromEntries(["manualArea","currency","pricePerSqm","priceUnit","additionalCost"].map(k=>[k,state.articles.find(a=>a.id===editId)?.[k]??({currency:"EUR",priceUnit:"per m²"}[k]??0)])),status:(editId?state.articles.find(a=>a.id===editId)?.status:null)||"Förfrågan"}; if(base.status==="Godkänt"){base.approvedAt=new Date().toISOString().slice(0,10);base.approvedBy="DE";}
      let product;
      try{const p=state.projects.find(p=>p.id===values.projectId);product=values.productId==='new'?CDPStructure.products.save(state,p,'',{name:values.productName||values.name,specification:values.specification||''}):p.products?.find(x=>x.id===values.productId);if(!product)throw Error('Select a product.');}catch(err){toast(err.message);return;}
      base.productId=product.id;try{CDPStructure.products.assertUnique(state,{...base,id:editId});}catch(err){toast(err.message);return;}if(dimensionName)base.nameMode='dimensions';
      if(editId){Object.assign(state.articles.find(a=>a.id===editId),base);CDPStructure.products.overrides(state,state.articles.find(a=>a.id===editId));}
      else {
        const projectArticles=state.articles.filter(a=>a.projectId===values.projectId); const number=Math.max(0,...projectArticles.map(a=>(Number(String(a.code||'').split("A").pop())||0)))+1;
        const articleId=crypto.randomUUID();
        state.articles.push({...CDPStructure.products.spec(product),...base,specification:values.specification||product.specification||'',id:articleId,code:`${values.projectId}-A${String(number).padStart(2,"0")}`,priceHistory:[]});
        const sourceScopeId=event.target.dataset.sourceScopeId; if(sourceScopeId){ const project=state.projects.find(p=>p.id===values.projectId); const scopeRow=project?.preliminaryScope?.find(r=>r.id===sourceScopeId); if(scopeRow) scopeRow.convertedArticleId=articleId; }
      }
      CDPStructure.migrate(state); saveState(); renderAll(); if(modalHistory.some(entry=>entry.key.startsWith("project:"+values.projectId+":"))) { closeModal(true); } else { closeModal(); if(event.target.dataset.sourceScopeId) openProject(values.projectId,"articleList"); else showView("articles"); } toast(editId ? "The article has been updated and its cost recalculated." : "The article has been added."); return;
    }
    if(event.target.id === "priceForm") {
      event.preventDefault(); const values=Object.fromEntries(new FormData(event.target)); const article=state.articles.find(a=>a.id===event.target.dataset.articleId); const manufacturer=state.manufacturers.find(m=>m.id===values.manufacturerId); const price={id:`PRICE-${String(Date.now()).slice(-8)}`,date:values.date,manufacturerId:values.manufacturerId||"",manufacturer:manufacturer?.name||"—",pricePerSqm:Number(values.pricePerSqm),priceUnit:values.priceUnit||"per m²",currency:values.currency,validUntil:values.validUntil,status:values.priceStatus};
      article.priceHistory.push(price); article.manufacturerId=price.manufacturerId; article.manufacturer=price.manufacturer;
      if(price.status==="Godkänt") { article.pricePerSqm=price.pricePerSqm; article.priceUnit=price.priceUnit; article.currency=price.currency; article.status="Godkänt"; article.approvedAt=values.date||new Date().toISOString().slice(0,10); article.approvedBy="DE"; }
      else { article.pricePerSqm=price.pricePerSqm; article.priceUnit=price.priceUnit; article.currency=price.currency; article.status=price.status; }
      saveState(); renderAll(); openArticle(article.id); toast("The supplier price has been saved in the history.");
      return;
    }
    if(event.target.id === "acceptanceForm") {
      event.preventDefault(); const values=Object.fromEntries(new FormData(event.target)); const q=findQuote(event.target.dataset.quoteId,event.target.dataset.version); if(!q||q.status!=="Skickad") return;
      state.quotations.filter(other=>other.projectId===q.projectId && other!==q && ["Utkast","Intern granskning","Skickad","Revidering begärd"].includes(other.status)).forEach(other=>other.status="Ersatt");
      q.status="Accepterad"; q.acceptedAt=values.acceptedAt; q.acceptedBy=values.acceptedBy; q.acceptanceMethod=values.acceptanceMethod; q.poNumber=values.poNumber; q.acceptedAmount=Number(values.amount)||q.amount; q.deliveryDate=values.deliveryDate; q.acceptanceComment=values.acceptanceComment;
      const project=state.projects.find(p=>p.id===q.projectId);
      if(project){ project.businessStatus="Vunnet"; project.phase="Vunnet"; project.probability=100; project.value=q.acceptedAmount??q.amount; project.acceptedAt=q.acceptedAt; project.acceptedBy=q.acceptedBy; project.acceptanceMethod=q.acceptanceMethod; project.acceptedQuoteId=q.id; project.acceptedQuoteVersion=q.version; project.poNumber=q.poNumber; project.deliveryDate=q.deliveryDate; project.deliveryStatus="Väntar orderunderlag"; project.next="Inväntar orderunderlag"; const agent=state.agents.find(a=>a.name===project.agent); project.commissionEstimate=agent?(q.acceptedAmount??q.amount)*agent.commission/100:0; }
      saveState(); renderAll(); quotationFilter="accepted"; showView("quotations"); renderQuotations(); openQuote(q.id,q.version); toast("The quotation has been accepted and the project marked as Won."); return;
    }
    if(event.target.id === "deliveryForm") {
      event.preventDefault(); const values=Object.fromEntries(new FormData(event.target)); const project=state.projects.find(p=>p.id===event.target.dataset.projectId); if(!project) return;
      project.deliveryStatus=values.deliveryStatus; project.deliveryDate=values.deliveryDate; project.poNumber=values.poNumber; project.next=values.next; project.deliveryComment=values.deliveryComment;
      saveState(); renderAll(); openProject(project.id,"delivery"); toast("Delivery tracking has been saved.");
    }
  }

  function bindPrimaryActions() {
    $$('[data-action="new-lead"]').forEach(button => {
      if (button.dataset.boundPrimary === "1") return;
      button.dataset.boundPrimary = "1";
      button.type = "button";
      button.addEventListener("click", event => {
        event.preventDefault();
        event.stopPropagation();
        openLeadForm();
      });
    });
    $$('[data-action="new-inquiry"]').forEach(button => {
      if (button.dataset.boundPrimary === "1") return;
      button.dataset.boundPrimary = "1";
      button.type = "button";
      button.addEventListener("click", event => {
        event.preventDefault();
        event.stopPropagation();
        openNewInquiry();
      });
    });
  }

  // Expose only the two primary creation dialogs for diagnostics/manual fallback.
  window.CDPApp = Object.assign(window.CDPApp || {}, { openLeadForm });

  document.addEventListener("click", event => {
    const target=event.target.closest("button,[data-target-view],.project-card[data-project-id],.won-card[data-project-id]"); if(!target) return;
    if(target.dataset.view) showView(target.dataset.view);
    if(target.dataset.targetView) showView(target.dataset.targetView);
    if(target.dataset.action==="new-meeting") openMeetingForm();
    if(target.dataset.meetingFilter) { meetingFilter=target.dataset.meetingFilter; renderMeetings(); }
    if(target.dataset.deleteMeeting) {
      const m=state.meetings.find(m=>m.id===target.dataset.deleteMeeting); if(!m) return;
      openModal(`<div class="modal-header"><h2 id="modalTitle">Delete meeting?</h2><button class="modal-close" data-close>×</button></div><div class="modal-body"><p>${esc(m.visitor)} · ${esc(m.time.replace("T", " "))}</p><p>The meeting will be archived in the database.</p></div><div class="modal-footer"><button class="button secondary" data-close>Cancel</button><button class="button danger" data-confirm-delete-meeting="${esc(m.id)}">Delete</button></div>`, true);
    }
    if(target.dataset.confirmDeleteMeeting) { store.removeMeeting(target.dataset.confirmDeleteMeeting); closeModal(); renderMeetings(); toast("The meeting has been deleted."); }
    if(target.dataset.action==="new-lead") openLeadForm();
    if(target.dataset.action==="new-inquiry") openNewInquiry();
    if(target.dataset.saveNewInquiry !== undefined) {
      event.preventDefault();
      saveNewInquiryForm(target.closest("form"));
      return;
    }
    if(target.dataset.action==="new-article") openNewArticle();
    if(target.dataset.action==="new-agent") toast("The agent form will be added in the next version.");
    if(target.dataset.action==="new-manufacturer") openManufacturerForm();
    if(target.dataset.editManufacturer) { const m=state.manufacturers.find(x=>x.id===target.dataset.editManufacturer); if(m) openManufacturerForm(m); }
    if(target.dataset.action==="export-projects") toast("Excel/CSV export is being prepared.");
    if(target.dataset.close !== undefined) closeModal(true);
    if(target.dataset.leadFilter) { leadFilter=target.dataset.leadFilter; renderLeads(); }
    if(target.dataset.editLead) { const lead=state.leads.find(item=>item.id===target.dataset.editLead); if(lead) openLeadForm(lead); }
    if(target.dataset.convertLead) { const lead=state.leads.find(item=>item.id===target.dataset.convertLead); if(lead?.status==="Aktivt") {const p=CDPStructure.go(state,lead.id);saveState();renderAll();openProject(p.id);} }
    if(target.dataset.deleteLead) confirmDeleteLead(target.dataset.deleteLead);
    if(target.dataset.confirmDeleteLead) { store.removeLead(target.dataset.confirmDeleteLead); renderAll(); closeModal(); showView("leads"); toast("The lead has been deleted."); }
    if(target.dataset.inquiryId) openInquiry(target.dataset.inquiryId);
    if(target.dataset.inquiryMode) { inquiryMode=target.dataset.inquiryMode; const statusSelect=$("#inquiryStatusFilter"); if(statusSelect) statusSelect.value="all"; renderInquiries(); return; }
    if(target.dataset.inquiryTab) { openInquiry(target.dataset.id,target.dataset.inquiryTab); return; }
    if(target.dataset.addInquiryScope !== undefined) { const form=target.closest("form"); const body=$("[data-scope-body]",form); if(body){ if(body.children.length===1 && body.children[0].querySelector("td[colspan]")) body.innerHTML=""; body.insertAdjacentHTML("beforeend",inquiryScopeRow({},body.children.length,false)); updateInquiryScopeSummary(form); } return; }
    if(target.dataset.removeScopeRow !== undefined) { const form=target.closest("form"); target.closest("[data-scope-row]")?.remove(); updateInquiryScopeSummary(form); return; }
    if(target.dataset.createArticleFromScope) { const p=state.projects.find(x=>x.id===target.dataset.projectIdRef); const row=p?.preliminaryScope?.find(r=>r.id===target.dataset.createArticleFromScope); if(row){ openNewArticle(p.id,{sourceScopeId:row.id,name:row.description||`${row.type||"Rug"}`,quantity:Number(row.quantity)||1,location:row.comment||"",shape:"Rektangulär",widthCm:Number(row.widthCm)||0,lengthCm:Number(row.lengthCm)||0,currency:p.currency||"EUR",status:"Förfrågan"}); } return; }
    if(target.dataset.projectId) openProject(target.dataset.projectId);
    if(target.dataset.projectFilter) { projectFilter=target.dataset.projectFilter; renderProjects(); }
    if(target.dataset.quoteFilter) { quotationFilter=target.dataset.quoteFilter; renderQuotations(); }
    if(target.dataset.projectTab) openProject(target.dataset.id,target.dataset.projectTab);
    if(target.dataset.newArticleProject) openNewArticle(target.dataset.newArticleProject);
    if(target.dataset.articleId) openArticle(target.dataset.articleId);
    if(target.dataset.editArticle) openEditArticle(target.dataset.editArticle);
    if(target.dataset.newPrice) {const a=state.articles.find(a=>a.id===target.dataset.newPrice);if(a)openProject(a.projectId,"rfq");}
    if(target.dataset.decision==="go") { convertToProject(target.dataset.id); return; }
    if(target.dataset.decision==="no-go") { const i=state.inquiries.find(x=>x.id===target.dataset.id); if(!i)return; i.previousProbability=Number(i.probability)||0; i.status="No Go"; i.probability=0; i.decisionAt=new Date().toISOString().slice(0,10); i.history=Array.isArray(i.history)?i.history:[]; i.history.push({status:"No Go",date:i.decisionAt}); saveState(); inquiryMode="archive"; renderAll(); closeModal(); showView("inquiries"); toast("The enquiry was marked No Go and moved to Archive."); return; }
    if(target.dataset.reactivateInquiry) { const i=state.inquiries.find(x=>x.id===target.dataset.reactivateInquiry); if(!i || i.status!=="No Go")return; i.status="Bedöms"; i.probability=Number(i.previousProbability)||20; i.reactivatedAt=new Date().toISOString().slice(0,10); i.history=Array.isArray(i.history)?i.history:[]; i.history.push({status:"Bedöms",date:i.reactivatedAt,note:"Reactivated from No Go"}); saveState(); inquiryMode="active"; renderAll(); closeModal(); showView("inquiries"); toast("The enquiry has been reactivated and is listed under Active again."); return; }
    if(target.dataset.saveAssessment) { saveInquiryAssessment(target.dataset.saveAssessment); return; }
    if(target.dataset.saveCalculation) { saveCalculationFromForm(target.dataset.saveCalculation); openProject(target.dataset.saveCalculation,"calculation"); }
    if(target.dataset.previewQuoteFromCalc) previewQuoteFromCalculation(target.dataset.previewQuoteFromCalc);
    if(target.dataset.createQuoteFromCalc) addQuoteVersion(target.dataset.createQuoteFromCalc);
    if(target.dataset.newQuote) addQuoteVersion(target.dataset.newQuote);
    if(target.dataset.quoteId) openQuote(target.dataset.quoteId,target.dataset.version);
    if(target.dataset.markSent) markQuoteSent(target.dataset.markSent,target.dataset.version);
    if(target.dataset.markDeclined) markQuoteDeclined(target.dataset.markDeclined,target.dataset.version);
    if(target.dataset.acceptQuote) openAcceptanceForm(target.dataset.acceptQuote,target.dataset.version);
    if(target.dataset.exportQuoteExcel) exportQuoteExcel(target.dataset.exportQuoteExcel,target.dataset.version);
    if(target.dataset.exportQuotePdf) exportQuotePdf(target.dataset.exportQuotePdf,target.dataset.version);
  });
  document.addEventListener("keydown", event => {
    if (event.key !== "Enter" && event.key !== " ") return;
    const card = event.target.closest?.(".project-card[data-project-id], .won-card[data-project-id]");
    if (!card || event.target.closest("button, a, input, select, textarea")) return;
    event.preventDefault();
    openProject(card.dataset.projectId);
  });
  document.addEventListener("submit", handleSubmit);
  document.addEventListener("change", event => {
    const id=event.target.dataset.leadComment; if(!id) return;
    const lead=state.leads.find(item=>item.id===id); if(!lead || lead.status!=="Aktivt") return;
    store.updateLead(id,{name:lead.name,expectedStart:lead.expectedStart,comments:event.target.value});
    renderDashboardLeads(); toast("The comment has been saved.");
  });
  $("#menuToggle")?.addEventListener("click",()=>$("#sidebar")?.classList.toggle("open"));
  document.addEventListener("input", event => { const form=event.target.closest?.("#inquiryScopeForm"); if(form && ["scopeQuantity","scopeWidth","scopeLength"].includes(event.target.name)) updateInquiryScopeSummary(form); });
  ["#inquirySearch","#inquiryStatusFilter","#inquirySourceFilter"].forEach(sel => $(sel)?.addEventListener(sel.includes("Search") ? "input" : "change",renderInquiries));
  ["#articleSearch","#articleProjectFilter","#articleStatusFilter"].forEach(sel => $(sel)?.addEventListener(sel.includes("Search") ? "input" : "change",renderArticles));
  $("#globalSearch")?.addEventListener("input", event => { if(event.target.value.length > 1) { showView("inquiries"); inquiryMode="active"; if($("#inquirySearch")) $("#inquirySearch").value=event.target.value; renderInquiries(); } });
  initializeV6();
  bindPrimaryActions();
  renderAll();
  bindPrimaryActions();
  // v6 project workflow.
  function uiLabel(value){const labels={"Aktivt":"Active","Konverterat":"Converted","Ny":"New","Bedöms":"Under review","Skickad":"Sent","Utkast":"Draft","Ersatt":"Superseded","Accepterad":"Accepted","Avböjd":"Declined","Utgången":"Expired","Återkallad":"Withdrawn","Vunnet":"Won","Förlorat":"Lost","Förfrågan":"Enquiry","Förhandlas":"Under negotiation","Godkänt":"Approved","Prisförfrågan":"Price enquiry","Förhandling":"Negotiation","Pris godkänt":"Price approved","Första pris":"Initial price","Förhandlat":"Negotiated","Väntar orderunderlag":"Awaiting order documents","Inväntar orderunderlag":"Awaiting order documents","Orderbekräftad":"Order confirmed","Produktion":"Production","Klar för leverans":"Ready for delivery","Levererad":"Delivered","Avslutad":"Closed","Kalkyl":"Costing","Offert skickad":"Quotation sent","Rektangulär":"Rectangular","Rund":"Round","Specialform":"Custom shape","per styck":"per item","fast pris":"fixed price","Kund":"Customer","Beställare":"Buyer","Arkitekt/inredare":"Architect/interior designer","Beställd":"Ordered","Inväntar bedömning":"Awaiting assessment","Godkänd":"Approved","Ändring krävs":"Changes required","Ej besvarad":"Unanswered","Offererad":"Quoted","Kan inte offerera":"Unable to quote","Ingår i produktpris":"Included in product price","Separat rad":"Separate line","Aktiv":"Active","Inaktiv":"Inactive","Intern granskning":"Internal review","Revidering begärd":"Revision requested","Administratör":"Administrator","Medarbetare":"Team member","Inköpsorder":"Purchase order","Signerad offert":"Signed quotation","Inaktiverad":"Disabled","Inbjuden":"Invited","Ej bekräftad":"Unconfirmed","Ej angiven":"Not specified","Tillverkare":"Manufacturer","Standardrum":"Standard room","Superiorrum":"Superior room","Deluxerum":"Deluxe room","Familjerum":"Family room","Juniorsvit":"Junior suite","Svit":"Suite","Konferensrum":"Conference room","Restaurang":"Restaurant","Kontor":"Office","Korridor":"Corridor","Spa / relax":"Spa / relaxation","Annat":"Other","Planera artiklar och faser":"Plan articles and phases","Påbörja kalkyl":"Start costing","Följ upp skickad offert":"Follow up sent quotation"};return Object.prototype.hasOwnProperty.call(labels,value)?labels[value]:value;}
  function publicReference(value,fallback=''){const text=String(value||'');return /[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i.test(text)?fallback:text||fallback;}
  function quoteReference(q){return publicReference(q.id,"Quotation");}
  function projectOptionFields(p){return `<label class="field"><span>Project type</span><select name="projectType"><option value="simple" ${p.projectType==='simple'?'selected':''}>Simple</option><option value="complete" ${p.projectType!=='simple'?'selected':''}>Complete</option></select><small>Simple: articles, agreed prices, costing and quotations. Complete also includes samples and RFQs.</small></label><label class="field"><span>Delivery setup</span><select name="phaseMode"><option value="single" ${p.phaseMode==='single'?'selected':''}>One phase</option><option value="multiple" ${p.phaseMode!=='single'?'selected':''}>Multiple phases</option></select><small>One phase: all articles share one delivery. Multiple phases: allocate articles and quantities to separate deliveries.</small></label>`;}
  function projectOptionsSummary(p){const ph=p.phases[0];return `<section class="v6-card"><div class="section-action"><h3>${p.projectType==='simple'?'Simple':'Complete'} · ${p.phaseMode==='single'?'One phase':'Multiple phases'}</h3><div class="project-overview-actions"><button type="button" class="button secondary" data-project-tab="customer" data-id="${esc(p.id)}">Customer & address details</button><button type="button" class="button secondary" data-project-options="${esc(p.id)}">Project settings</button><details class="project-action-menu"><summary class="button secondary" aria-label="Project actions" title="Actions">⋯</summary><div class="project-action-options">${p.businessStatus!=='Vunnet'&&p.phase!=='Vunnet'&&p.businessStatus!=='Förlorat'?`<button type="button" class="text-button" data-v6-lose-project="${esc(p.id)}">Mark as lost</button>`:''}<button type="button" class="text-button" data-delete-project="${esc(p.id)}">Delete</button></div></details></div></div></section>`;}
  function editProjectOptions(id){const p=state.projects.find(p=>p.id===id);if(!p)return;v6Dialog('Project settings',`<form id="projectOptionsForm" data-p="${esc(id)}">${field('name','Project name',p.name,'text','required')}<div class="form-grid">${projectOptionFields(p)}</div><div data-single-dates ${p.phaseMode==='single'?'':'hidden'}><div class="form-grid">${field('productionStart','Production start',p.phases[0]?.productionStart||'','date')}${field('deliveryDate','Delivery date',p.phases[0]?.deliveryDate||'','date')}</div></div><p>Existing samples, RFQs and quotations are retained when changing the project type.</p><button class="button primary">Save project settings</button></form>`);}
  document.addEventListener('click',e=>{const b=e.target.closest('[data-project-options]');if(b)editProjectOptions(b.dataset.projectOptions);});
  document.addEventListener('change',e=>{if(e.target.matches('#projectOptionsForm [name=phaseMode]'))$('[data-single-dates]').hidden=e.target.value!=='single';});
  document.addEventListener('submit',async e=>{const f=e.target;if(f.id!=='projectOptionsForm')return;e.preventDefault();const button=$('button',f);try{writableRfq();button.disabled=true;const p=state.projects.find(p=>p.id===f.dataset.p);const values=Object.fromEntries(new FormData(f)),name=String(values.name||'').trim();if(!name)throw Error('Enter a project name.');CDPStructure.setProjectOptions(state,p,values);p.name=name;await persistRfq();renderAll();closeModal(true);openProject(p.id,'overview');toast('Project settings saved.');}catch(error){button.disabled=false;toast(error.message);}});
  function projectTabs(p,tab){return `<div class="project-tabs">${[['overview',"Overview"],['articleList',"Articles"],['rfqPreliminary',"RFQ – Preliminary"],['phases',"Phases"],['rfq','RFQ – Complete'],['modelSamples',"Full-size samples"],['calculation','Kalkyl'],['quotes',"Quotations"],['delivery',"Order & delivery"]].filter(([key])=>!(p.projectType==='simple'&&['rfqPreliminary','rfq','modelSamples'].includes(key))&&!(p.phaseMode==='single'&&key==='phases')).map(([key,label])=>`<button type="button" class="project-tab ${tab===key||tab==='customer'&&key==='overview'?'active':''}" data-project-tab="${key}" data-id="${esc(p.id)}">${esc(uiLabel(label))}</button>`).join('')}${tab==='articles'?`<button type="button" class="button primary bom-new-article" data-new-article-project="${esc(p.id)}">New article</button>`:''}</div>`;}
  function renderMeetings(){legacy_renderMeetings();$$('#meetingRows [data-delete-meeting]').forEach(b=>{const m=state.meetings.find(m=>m.id===b.dataset.deleteMeeting);b.insertAdjacentHTML('beforebegin',`<button class="text-button" data-v6-meeting-lead="${esc(m.id)}">${m.leadId?"Open lead":"Create lead"}</button>`);});}
  function openEditArticle(id){legacy_openEditArticle(id);const a=state.articles.find(a=>a.id===id),f=$('#articleForm');if(!a||!f)return;const locked=['projectId',...(a.selectedPrice?['manufacturerId','currency','pricePerSqm','priceUnit','status']:[])];locked.forEach(name=>{const el=f.elements[name];if(!el)return;const hidden=document.createElement('input');hidden.type='hidden';hidden.name=name;hidden.value=el.value;f.append(hidden);el.disabled=true;});if(a.selectedPrice)f.insertAdjacentHTML('afterbegin',"<p class=\"article-form-note\">The selected production price and manufacturer are changed under RFQ. Dimensions, specifications and other article details can be edited here.</p>");}
  function field(name,label,value='',type='text',extra=''){return `<label class="field"><span>${esc(uiLabel(label))}</span><input name="${name}" type="${type}" value="${esc(value??'')}" ${extra}></label>`;}
  function selectField(name,label,values,value){return `<label class="field"><span>${esc(uiLabel(label))}</span><select name="${name}">${values.map(v=>`<option value="${esc(v)}" ${v===value?'selected':''}>${esc(uiLabel(v))}</option>`).join('')}</select></label>`;}
  function v6Dialog(title,body,footer=''){openModal(`<div class="modal-header"><h2 id="modalTitle">${esc(title)}</h2><button type="button" class="modal-close" data-close>×</button></div><div class="modal-body">${body}</div><div class="modal-footer">${footer||"<button class=\"button secondary\" data-close>Close</button>"}</div>`);}
  function projectCalculation(p){return CDPStructure.calculate(state,p);}
  function calculationSummary(pc,p){return `<div class="calc-summary"><div><span>Production</span><strong>${money(pc.productionCost,p.currency)}</strong></div><div><span>Total project cost</span><strong>${money(pc.totalCost,p.currency)}</strong></div><div><span>Gross profit</span><strong>${money(pc.grossProfit,p.currency)}</strong></div><div class="calc-total"><span>Total quotation price</span><strong>${money(pc.salesPrice,p.currency)}</strong><small>${decimal(pc.margin)} % target margin</small></div></div>${pc.errors.map(x=>`<p class="v6-error">${esc(x)}</p>`).join('')}${pc.warnings.map(x=>`<p class="article-form-note">${esc(x)}</p>`).join('')}`;}
  function openProject(id,tab='overview'){
    if(tab==='samples'||tab==='articles')tab='articleList';
    const p=state.projects.find(p=>p.id===id);if(!p)return;CDPStructure.migrate(state);
    if(p.projectType==='simple'&&['rfq','rfqPreliminary','modelSamples'].includes(tab)||p.phaseMode==='single'&&tab==='phases')tab='overview';
    if(!['articles','articleList','rfq','rfqPreliminary','samples','phases','calculation','modelSamples'].includes(tab)){
      legacy_openProject(id,tab);
      const body=$('.project-tab-content');
      if(tab==='overview'){
        const accepted=body.querySelector('.acceptance-box')?.outerHTML||'';
        body.innerHTML=projectOptionsSummary(p)+(p.businessStatus==='Förlorat'?projectOutcomeActions(p):p.description?`<p class="preserve-lines">${esc(p.description)}</p>`:'')+`<h3>Project overview</h3><div class="project-overview-financials">${calculationSummary(projectCalculation(p),p)}</div>`+accepted;
      }
      if(tab==='customer')body.insertAdjacentHTML('afterbegin',`<div class="section-action"><p>Select the customer, buyer, architect and end customer from the register.</p><button type="button" class="button secondary" data-project-parties="${esc(p.id)}">Companies & contacts</button></div>`);
      if(tab==='delivery')body.insertAdjacentHTML('afterbegin',phaseDelivery(p)+butlerView(p));
      return;
    }
    let content=tab==='articleList'?projectArticlesView(p):tab==='modelSamples'?modelSampleList(p):tab==='articles'?bomOverview(p):tab==='samples'?samplesView(p):(tab==='rfq'||tab==='rfqPreliminary')?rfqStageView(p,tab==='rfqPreliminary'?'preliminary':'complete'):tab==='phases'?phasesView(p):calculationView(p);
    openModal(`<div class="modal-header"><div><h2 id="modalTitle">${tab==='articles'?'BOM – ':''}${esc(p.name)}</h2>${tab==='articles'?'':tab==='rfq'?`<p>${esc(p.customer)}</p>`:`<p>${esc(p.customer)}</p>`}</div><button class="modal-close" data-close>×</button></div><div class="modal-body">${projectTabs(p,tab)}<div class="project-tab-content">${content}</div></div>`);
    if(tab==='articleList')filterProjectArticles();
    if(tab==='calculation')bindPhaseCalculation(p);
  }
  function phaseDelivery(p){return `<div class="v6-cards">${p.phases.map(ph=>`<div class="v6-card"><strong>${esc(ph.name)}</strong><p>Production start ${date(ph.productionStart)}<br>At customer ${date(ph.deliveryDate)}</p>${p.phaseMode==='single'?`<button class="text-button" data-project-options="${esc(p.id)}">Edit delivery dates</button>`:`<button class="text-button" data-v6-phase="${esc(ph.id)}" data-p="${esc(p.id)}">Edit phase</button>`}</div>`).join('')}</div>`;}
  function phasesView(p){return `<div class="section-action"><div><h3>Project phases</h3><p>The same article can be delivered in multiple phases.</p></div><button class="button primary" data-v6-phase="new" data-p="${esc(p.id)}">＋ New phase</button></div><div class="table-scroll"><table><thead><tr><th>Phase number</th><th>Production start</th><th>Delivery date</th><th></th></tr></thead><tbody>${p.phases.map(ph=>`<tr><td><button type="button" class="text-button" data-v6-toggle-phase="${esc(ph.id)}" aria-expanded="false"><span class="phase-expand-arrow" aria-hidden="true">▸</span> ${esc(ph.name)}</button></td><td><input type="date" class="phase-date" aria-label="Production start ${esc(ph.name)}" data-phase-date="productionStart" data-phase-id="${esc(ph.id)}" data-p="${esc(p.id)}" value="${esc(ph.productionStart||'')}"></td><td><input type="date" class="phase-date" aria-label="Delivery date ${esc(ph.name)}" data-phase-date="deliveryDate" data-phase-id="${esc(ph.id)}" data-p="${esc(p.id)}" value="${esc(ph.deliveryDate||'')}"></td><td><button class="text-button" data-v6-phase="${esc(ph.id)}" data-p="${esc(p.id)}">Edit</button> <button class="text-button" data-v6-remove-phase="${esc(ph.id)}" data-p="${esc(p.id)}">Delete</button></td></tr><tr data-phase-items="${esc(ph.id)}" hidden><td colspan="4"><table><thead><tr><th>Article</th><th>Quantity</th><th class="phase-article-action"><button type="button" class="button secondary" data-v6-phase-article="${esc(ph.id)}" data-p="${esc(p.id)}">Select articles</button></th></tr></thead><tbody>${ph.items.map(i=>{const a=state.articles.find(a=>a.id===i.articleId);return `<tr><td>${esc(a?a.name:"Article missing")}</td><td><input class="article-inline" type="number" min="1" step="1" required data-phase-quantity="${esc(ph.id)}" data-p="${esc(p.id)}" data-article="${esc(i.articleId)}" data-saved="${i.quantity}" value="${i.quantity}" aria-label="Quantity ${esc(a?.name||"Article")} i ${esc(ph.name)}"><small class="article-inline-status" aria-live="polite"></small></td><td><button class="text-button" data-v6-remove-phase-article="${esc(ph.id)}" data-p="${esc(p.id)}" data-article="${esc(i.articleId)}">Delete</button></td></tr>`;}).join('')||"<tr><td colspan=\"3\">No articles assigned.</td></tr>"}</tbody></table></td></tr>`).join('')||"<tr><td colspan=\"4\">No phases yet. Click New phase to begin.</td></tr>"}</tbody></table></div>`;}
  document.addEventListener('change',event=>{
    const input=event.target;if(!input.matches('[data-phase-date]'))return;
    const p=state.projects.find(p=>p.id===input.dataset.p),ph=p?.phases.find(ph=>ph.id===input.dataset.phaseId),key=input.dataset.phaseDate;
    if(!ph||!['productionStart','deliveryDate'].includes(key))return;
    const previous=ph[key]||'',value=input.value;
    try{
      if(window.CDPRemote?.adapter?.busy||window.CDPRemote?.adapter?.failure)throw Error("Wait until the previous change has been saved.");
      if(!input.validity.valid)throw Error("Select a valid date.");
      const start=key==='productionStart'?value:ph.productionStart,end=key==='deliveryDate'?value:ph.deliveryDate;
      if(start&&end&&start>end)throw Error("Production start must precede the delivery date.");
      ph[key]=value;saveState();
    }catch(error){ph[key]=previous;input.value=previous;alert(error.message);}
  });
  function expandPhase(id){const button=Array.from($$('[data-v6-toggle-phase]')).find(b=>b.dataset.v6TogglePhase===id),row=Array.from($$('[data-phase-items]')).find(r=>r.dataset.phaseItems===id);if(row&&button){row.hidden=false;button.setAttribute('aria-expanded','true');}}
  function editPhase(pid,id){const p=state.projects.find(p=>p.id===pid);if(id==='new'){const n=Math.max(0,...p.phases.map(ph=>Number(String(ph.name).replace(/^Fas\s*/i,''))||0))+1;p.phases.push({id:CDPStructure.uid('PH'),name:"Phase "+n,productionStart:'',deliveryDate:'',items:[],calculation:CDPStructure.defaults()});saveState();openProject(pid,'phases');return;}const ph=p.phases.find(ph=>ph.id===id);v6Dialog("Project stage",`<form id="v6Phase" data-p="${esc(pid)}" data-id="${esc(id)}"><div class="form-grid">${field('name',"Phase number",ph.name,'text','required')}${field('productionStart',"Production start",ph.productionStart,'date')}${field('deliveryDate',"Delivery date",ph.deliveryDate,'date')}</div><button class="button primary">Save phase</button></form>`);}
  function editPhaseArticle(pid,id){const p=state.projects.find(p=>p.id===pid),ph=p.phases.find(ph=>ph.id===id),articles=state.articles.filter(a=>a.projectId===pid),first=p.phases[0]?.id===id;v6Dialog("Select articles · "+ph.name,`<form id="v6PhaseArticle" data-p="${esc(pid)}" data-id="${esc(id)}"><p>Select the articles to include and enter quantities. Deselected articles will be removed from this phase. ${first?"The first phase defaults to the article's total quantity.":"New selections default to the quantity remaining after other phases."}</p><table><thead><tr><th>Article</th><th>Quantity</th></tr></thead><tbody>${articles.map(a=>{const item=ph.items.find(i=>i.articleId===a.id),remaining=Number(a.quantity||1)-p.phases.filter(other=>other.id!==id).flatMap(other=>other.items).filter(i=>i.articleId===a.id).reduce((sum,i)=>sum+Number(i.quantity),0),quantity=item?.quantity??(first?Number(a.quantity||1):remaining>0?remaining:'');return `<tr><td><label><input type="checkbox" name="article" value="${esc(a.id)}" ${item?'checked':''}> ${esc(a.name)}</label></td><td><input class="article-inline" type="number" min="1" step="1" required data-phase-pick-quantity="${esc(a.id)}" aria-label="Quantity ${esc(a.name)}" value="${quantity}" ${item?'':'disabled'}></td></tr>`;}).join('')||"<tr><td colspan=\"2\">First add articles under the project's Articles tab.</td></tr>"}</tbody></table><button class="button primary">Save articles</button></form>`);}
  document.addEventListener('change',e=>{if(e.target.matches('#v6PhaseArticle [name=article]'))e.target.closest('tr').querySelector('[data-phase-pick-quantity]').disabled=!e.target.checked;});
  function calculationView(p){const c=p.calculation||{};return `<form id="v6Calculation" data-p="${esc(p.id)}">${p.projectType==='simple'?`<div class="simple-costing-overview"><h3>Costing for all phases</h3><div id="v6Totals">${calculationSummary(projectCalculation(p),p)}</div></div>`:'<h3>Costing for all phases</h3>'}<p>Freight charged = our freight cost × (1 + markup %) + other import costs (DDP). The target margin applies to the remaining costs.</p><div class="form-grid costing-header-row">${field('targetMargin',"Margin %",c.targetMargin??45,'number','min="0" max="99.99" step="0.01" required')}${field('validityDays',"Validity in days",c.validityDays||30,'number','min="1" required')}${field('paymentTerms',"Payment terms",c.paymentTerms||'')}${field('notes',"Quotation comment",c.notes||'')}</div>${p.phases.map(ph=>{const c=ph.calculation;return `<fieldset class="v6-card" data-phase-calc="${esc(ph.id)}"><legend>${esc(ph.name)} · at customer ${date(ph.deliveryDate)}</legend><div class="form-grid"><div class="freight-cost-row">${selectField('deliveryTerm',"Delivery terms",['DAP','DDP'],c.deliveryTerm)}${field('destination','Destination',c.destination||p.country||'')}${field('freightCost',"Our freight cost",c.freightCost,'number','min="0" step="0.01"')}${field('freightMarkupPercent',"Freight markup %",c.freightMarkupPercent??15,'number','min="0" step="any" required')}<div data-ddp-import ${c.deliveryTerm==='DDP'?'':'hidden'}>${field('otherImportCost',"Other import costs",(Number(c.otherImportCost)||0)+(Number(c.dutyCost)||0),'number','min="0" step="0.01"')}</div><label class="field"><span>Freight charged to customer</span><output data-customer-freight></output></label></div>${selectField('freightPresentation',"Freight on quotation",['Separat rad','Ingår i produktpris'],c.freightPresentation)}<div data-ddp-fields ${c.deliveryTerm==='DDP'?'':'hidden'}>${field('importVatCost',"Import VAT (DDP)",c.importVatCost,'number','min="0" step="0.01"')}</div></div></fieldset>`;}).join('')}${p.projectType==='simple'?'':`<div id="v6Totals">${calculationSummary(projectCalculation(p),p)}</div>`}<div class="modal-footer"><button type="button" class="button secondary" data-v6-preview="${esc(p.id)}">Preview quotation</button><button class="button secondary">Save costing</button><button type="button" class="button primary" data-v6-quote="${esc(p.id)}">Create quotation version</button></div></form>`;}
  function calculationDraft(p){const f=$('#v6Calculation');if(!f||f.dataset.p!==p.id)return CDPStructure.clone(p);if(!f.reportValidity())throw Error("Check the costing fields.");const draft=CDPStructure.clone(p);for(const k of ['targetMargin','validityDays'])draft.calculation[k]=Number(f.elements[k].value);for(const k of ['paymentTerms','notes'])draft.calculation[k]=f.elements[k].value;$$('[data-phase-calc]',f).forEach(box=>{const ph=draft.phases.find(ph=>ph.id===box.dataset.phaseCalc);ph.calculation.freightPricing='markup-import';ph.calculation.dutyCost=0;ph.calculation.includeImportVatInCost=true;$$('input,select',box).forEach(el=>ph.calculation[el.name]=el.type==='checkbox'?el.checked:el.type==='number'?Number(el.value):el.value);ph.calculation.customerFreight=Math.round((Number(ph.calculation.freightCost)*(1+Number(ph.calculation.freightMarkupPercent)/100)+(ph.calculation.deliveryTerm==='DDP'?Number(ph.calculation.otherImportCost)||0:0)+Number.EPSILON)*100)/100;});return draft;}
  function bindPhaseCalculation(p){
    const f=$('#v6Calculation');
    const refresh=()=>{
      $$('[data-phase-calc]',f).forEach(box=>{
        const ddp=$('[name=deliveryTerm]',box).value==='DDP',fields=$('[data-ddp-fields]',box);
        const imports=$('[data-ddp-import]',box);imports.hidden=!ddp;$('input',imports).disabled=!ddp;fields.hidden=!ddp;$$('input',fields).forEach(el=>el.disabled=!ddp);
        const cost=Number($('[name=freightCost]',box).value),markup=Number($('[name=freightMarkupPercent]',box).value);
        $('[data-customer-freight]',box).textContent=Number.isFinite(cost)&&Number.isFinite(markup)&&cost>=0&&markup>=0?money(Math.round((cost*(1+markup/100)+(ddp?Number($('[name=otherImportCost]',box).value)||0:0)+Number.EPSILON)*100)/100,p.currency):'—';
      });
      try{const draft=calculationDraft(p),pc=projectCalculation(draft);$('#v6Totals').innerHTML=calculationSummary(pc,p);}catch{}
    };
    f.addEventListener('input',refresh);f.addEventListener('change',refresh);refresh();
  }
  function addQuoteVersion(pid){try{const p=state.projects.find(p=>p.id===pid),draft=calculationDraft(p);const q=CDPStructure.snapshot(state,draft);const versions=state.quotations.filter(q=>q.projectId===pid);q.version=Math.max(0,...versions.map(q=>Number(q.version)))+1;q.id=versions[0]?.id||'Q-'+pid.slice(2);versions.filter(q=>q.status==='Utkast').forEach(q=>q.status='Ersatt');Object.assign(p,draft,{value:q.amount});state.quotations.push(q);saveState();renderAll();openProject(pid,'quotes');toast("Quotation version created with all phases.");}catch(e){toast(e.message);}}
  function previewQuoteFromCalculation(pid){try{const p=state.projects.find(p=>p.id===pid),q=CDPStructure.snapshot(state,calculationDraft(p));q.id='PREVIEW';q.version='—';renderQuotePdf(q,p,{autoPrint:false,preview:true});}catch(e){toast(e.message);}}
  function v6old_openArticle(id){legacy_openArticle(id);const a=state.articles.find(a=>a.id===id);if(!a)return;$('.modal-body').insertAdjacentHTML('beforeend',`<section class="v6-card"><h3>BOM & specification</h3><p class="preserve-lines">${esc(a.specification||"No specification yet.")}</p><table><thead><tr><th>Component / material</th><th>Quantity</th><th>Unit</th><th>Specification</th></tr></thead><tbody>${(a.bom||[]).map(b=>`<tr><td>${esc(b.name)}</td><td>${b.quantity}</td><td>${esc(b.unit)}</td><td>${esc(b.notes)}</td></tr>`).join('')}</tbody></table><button class="button secondary" data-v6-bom="${esc(id)}">Edit BOM / specification</button><button class="button secondary" data-project-tab="rfq" data-id="${esc(a.projectId)}">RFQ & selected production price</button></section>`);}
  function bomRow(b={}){return `<tr data-bom-row><td><input name="name" aria-label="Component" value="${esc(b.name||'')}" required></td><td><input name="quantity" aria-label="Quantity" type="number" min="0" step="0.01" value="${b.quantity??1}"></td><td><input name="unit" aria-label="Unit" value="${esc(b.unit||'st')}"></td><td><input name="notes" aria-label="Specification" value="${esc(b.notes||'')}"></td><td><button type="button" class="text-button" data-v6-remove-bom>Delete</button></td></tr>`;}
  function v6old_editBom(id){const a=state.articles.find(a=>a.id===id);v6Dialog('BOM – '+a.name,`<form id="v6Bom" data-id="${esc(id)}"><label class="field"><span>Article specification</span><textarea name="specification" rows="4">${esc(a.specification||'')}</textarea></label><p>The BOM describes each article's materials/components. Cost comes from the selected production price and is not counted again from the BOM.</p><div class="table-scroll"><table><thead><tr><th>Component</th><th>Quantity</th><th>Unit</th><th>Specification</th><th></th></tr></thead><tbody id="v6BomRows">${(a.bom||[]).map(bomRow).join('')}</tbody></table></div><button type="button" class="button secondary" data-v6-add-bom>＋ Component</button><button class="button primary">Save BOM</button></form>`);}
  function v6old_rfqView(p){return `<div class="section-action"><div><h3>RFQ to manufacturer</h3><p>Create an enquiry for one or more articles and manufacturers. Email opens as a draft in your email application.</p></div><button class="button primary" data-v6-rfq-new="${esc(p.id)}">＋ New RFQ</button></div>${state.articles.filter(a=>a.projectId===p.id).map(a=>{const selected=CDPStructure.price(a);return `<section class="v6-card"><h3>${esc(a.name)}</h3><p>Selected: ${esc(selected.manufacturer||"None")} · ${money(selected.pricePerSqm||0,selected.currency||p.currency)} ${esc(uiLabel(selected.priceUnit||'per m²'))} · ${esc(uiLabel(selected.status||'Förfrågan'))}</p>${state.rfqs.filter(r=>r.projectId===p.id&&r.articleId===a.id).map(r=>`<div class="v6-rfq"><div><strong>${esc(state.manufacturers.find(m=>m.id===r.manufacturerId)?.name||"Manufacturer missing")}</strong><br>${esc(r.sentAt?"Marked as sent "+r.sentAt:'Utkast')} · ${esc(uiLabel(r.status||'Förfrågan'))}<br>${r.price!=null?money(r.price,r.currency)+' '+esc(uiLabel(r.priceUnit)):"No response"} · MOQ ${r.moq??'—'} · ${r.leadTime??'—'} days<br>${esc(r.comment||'')}</div><div><button class="text-button" data-v6-rfq-mail="${esc(r.id)}">Email / specification</button><button class="text-button" data-v6-rfq-answer="${esc(r.id)}">Record response</button>${r.price!=null?`<button class="text-button" data-v6-rfq-select="${esc(r.id)}">${a.selectedRfqId===r.id?"✓ Selected":"Select price"}</button>`:''}</div></div>`).join('')||"<p>No RFQ created.</p>"}</section>`;}).join('')}`;}
  function v6old_newRfq(pid){const articles=state.articles.filter(a=>a.projectId===pid);v6Dialog("New RFQ",`<form id="v6Rfq" data-p="${esc(pid)}"><h3>Articles</h3>${articles.map(a=>`<label class="v6-check"><input type="checkbox" name="article" value="${esc(a.id)}"> ${esc(a.name)}</label>`).join('')}<h3>Manufacturer</h3>${state.manufacturers.filter(m=>m.active!==false).map(m=>`<label class="v6-check"><input type="checkbox" name="manufacturer" value="${esc(m.id)}"> ${esc(m.name)}</label>`).join('')}<p>Each combination receives a frozen BOM, specification and phase quantities.</p><button class="button primary">Create RFQ specification</button></form>`);}
  function v6old_rfqText(r){const s=r.requestSnapshot;return `RFQ
Projects: ${s.project}
Article: ${publicReference(s.article.code)} – ${s.article.name}
Size: ${s.article.widthCm||0} × ${s.article.lengthCm||0} cm; ${uiLabel(s.article.shape)}
Specification: ${s.article.specification||''}\nBOM:\n${(s.article.bom||[]).map(b=>`${b.name}: ${b.quantity} ${b.unit}; ${b.notes||''}`).join('\n')}
Phases:
${s.phases.map(ph=>`${ph.name}: ${ph.quantity} st; production start ${ph.productionStart||"not determined"}; at customer ${ph.deliveryDate||"not determined"}`).join('\n')}
Enter the production price per item or m², currency, MOQ, lead time in days and a comment.`;}
  function rfqMail(id){const r=state.rfqs.find(r=>r.id===id),m=state.manufacturers.find(m=>m.id===r.manufacturerId),body=rfqText(r);v6Dialog('RFQ · '+(m?.name||''),`<p>Open an email draft or copy the specification. Mark as sent only after sending it.</p><textarea rows="16" class="v6-full" readonly>${esc(body)}</textarea>${m?.email?`<a class="button primary" href="mailto:${encodeURIComponent(m.email)}?subject=${encodeURIComponent('RFQ '+(r.requestSnapshot.projectReference||r.projectId)+' – '+r.requestSnapshot.article.name)}&body=${encodeURIComponent(body)}">Open e-postutkast</a>`:"<p>The manufacturer has no email address in the register.</p>"}<button class="button secondary" data-v7-rfq-download="${esc(id)}">Download RFQ specification (.txt)</button><button class="button secondary" data-v6-rfq-sent="${esc(id)}">Mark as sent</button>`);}
  function v6old_answerRfq(id){const r=state.rfqs.find(r=>r.id===id),p=state.projects.find(p=>p.id===r.projectId);v6Dialog("RFQ response",`<form id="v6Answer" data-id="${esc(id)}"><div class="form-grid">${field('price',"Production price",r.price??'','number','min="0" step="0.01" required')}${selectField('priceUnit',"Price unit",['per m²','per styck'],r.priceUnit||'per m²')}${selectField('currency',"Currency",['EUR','USD','SEK','GBP','NOK','DKK'],r.currency||p.currency)}${field('fxRate','1 prisvaluta = projektvaluta ('+p.currency+')',r.fxRate??1,'number','min="0.000001" step="0.000001" required')}${field('moq',"MOQ, number of articles",r.moq??0,'number','min="0" step="1"')}${field('leadTime',"Lead time, days",r.leadTime??0,'number','min="0" step="1"')}${selectField('status',"Price status",['Förfrågan','Förhandlas','Godkänt'],r.status||'Förhandlas')}${field('validUntil',"Valid until",r.validUntil||'','date')}</div><label class="field"><span>Comment</span><textarea name="comment">${esc(r.comment||'')}</textarea></label><p>Saving a response does not automatically change the selected article price. Click Select price after reviewing it.</p><button class="button primary">Save response</button></form>`);}
  function openLeadForm(l=null){v6Dialog(l?'Lead · '+l.name:"New lead",`<form id="v6Lead" data-id="${esc(l?.id||'')}"><div class="form-grid">${field('name',"Project name",l?.name||'','text','required')}${field('customer',"Customer / company",l?.customer||'')}${field('country',"Country",l?.country||'')}${field('expectedStart',"Expected start",l?.expectedStart||'','month')}${field('value',"Estimated value EUR",l?.value||0,'number','min="0"')}${field('contact',"Contact person",l?.customerData?.contact||'')}${field('email',"Email",l?.customerData?.email||'','email')}${field('phone',"Phone",l?.customerData?.phone||'')}</div><label class="field"><span>Comment / description</span><textarea name="comments">${esc(l?.comments||l?.description||'')}</textarea></label>${l?.legacyInquiryId?`<p>Transferred specification. Customer addresses, preliminary scope, design references and history are retained and transferred to the project.</p>`:''}<button class="button primary">Save lead</button>${l&&!l.projectId?`<button type="button" class="button secondary" data-v6-go="${esc(l.id)}">Go → create Projects</button><button type="button" class="button secondary" data-v6-nogo="${esc(l.id)}">No Go / arkivera</button>`:''}${l?.projectId?`<button type="button" class="button secondary" data-project-id="${esc(l.projectId)}">Open projects</button>`:''}</form>`);}
  function renderLeads(){const active=state.leads.filter(l=>l.status==='Aktivt'),archived=state.leads.filter(l=>l.status!=='Aktivt');$('#activeLeadCount').textContent=active.length;$('#convertedLeadCount').textContent=archived.length;$$('[data-lead-filter]').forEach(b=>b.classList.toggle('active',b.dataset.leadFilter===leadFilter));const search=$('#globalSearch')?.value.toLowerCase()||'';const rows=(leadFilter==='active'?active:leadFilter==='converted'?archived:state.leads).filter(l=>(l.name+' '+(l.customer||'')+' '+(l.comments||'')).toLowerCase().includes(search));$('#leadRows').innerHTML=sortedLeads(rows).map(l=>`<tr><td><button class="text-button" data-edit-lead="${esc(l.id)}"><strong>${esc(l.name)}</strong></button><br>${esc(l.customer||'')}</td><td>${esc(l.expectedStart||'—')}</td><td>${esc(l.comments||'')}</td><td>${date(l.createdAt)}</td><td>${statusBadge(l.status)}</td><td>${l.projectId?`<button class="text-button" data-project-id="${esc(l.projectId)}">Open projects</button>`:l.status==='No Go'?`<button class="text-button" data-v6-reactivate="${esc(l.id)}">Reactivate</button>`:`<button class="text-button" data-edit-lead="${esc(l.id)}">Edit</button><button class="text-button" data-v6-go="${esc(l.id)}">Go → Projects</button><button class="text-button" data-v6-nogo="${esc(l.id)}">No Go</button>`}</td></tr>`).join('')||"<tr><td colspan=\"6\">No leads.</td></tr>";}
  function downloadV6(name,text,type='application/json'){const url=URL.createObjectURL(new Blob([text],{type})),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
  function initializeV6(){
    $('#view-inquiries')?.remove();$('#dashboardInquiryRows')?.closest('article')?.remove();
    $$('[data-target-view="inquiries"]').forEach(b=>b.dataset.targetView='leads');
    const archive=$('[data-lead-filter="converted"]');if(archive)archive.innerHTML="Archive <span id=\"convertedLeadCount\"></span>";
    initializeV7();
    document.addEventListener('click',v6Click,true);document.addEventListener('submit',v6Submit,true);
    $('#globalSearch')?.addEventListener('input',()=>{showView('leads');renderLeads();});
  }
  function saveLeadV6(f){const v=Object.fromEntries(new FormData(f));let l=state.leads.find(l=>l.id===f.dataset.id);if(!l){l={id:CDPStructure.uid('L'),status:'Aktivt',createdAt:CDPStructure.today()};state.leads.unshift(l);}Object.assign(l,{name:v.name,customer:v.customer,country:v.country,expectedStart:v.expectedStart,value:Number(v.value),comments:v.comments,customerData:{...(l.customerData||{}),name:v.customer,contact:v.contact,email:v.email,phone:v.phone,country:v.country}});return l;}
  function v6Click(e){const t=e.target.closest('button');if(!t)return;const d=t.dataset;if(!Object.keys(d).some(k=>k.startsWith('v6')))return;e.preventDefault();e.stopImmediatePropagation();try{
    if(d.v6MeetingLead){const m=state.meetings.find(m=>m.id===d.v6MeetingLead);let l=state.leads.find(l=>l.id===m.leadId);if(!l){l={id:CDPStructure.uid('L'),name:m.visitor,comments:m.comment||'',meetingId:m.id,status:'Aktivt',createdAt:CDPStructure.today()};m.leadId=l.id;state.leads.unshift(l);saveState();renderAll();}openLeadForm(l);}
    if('v6NewProject' in d)openDirectProject();
    if(d.v6LoseProject)openProjectLoss(d.v6LoseProject);
    if(d.v6ReopenProject){const p=CDPStructure.reopenProject(state,d.v6ReopenProject);saveState();renderAll();openProject(p.id);toast("The project is active again. Previous quotations retain their status.");}
    if(d.v6TogglePhase){const row=Array.from($$('[data-phase-items]')).find(r=>r.dataset.phaseItems===d.v6TogglePhase);row.hidden=!row.hidden;t.setAttribute('aria-expanded',String(!row.hidden));}
    if(d.v6PhaseArticle)editPhaseArticle(d.p,d.v6PhaseArticle,d.article);
    if(d.v6RemovePhaseArticle){const p=state.projects.find(p=>p.id===d.p),ph=p.phases.find(ph=>ph.id===d.v6RemovePhaseArticle);ph.items=ph.items.filter(i=>i.articleId!==d.article);saveState();openProject(p.id,'phases');expandPhase(ph.id);}
    if(d.v6Phase)editPhase(d.p,d.v6Phase);
    if(d.v6RemovePhase){const p=state.projects.find(p=>p.id===d.p);if(confirm("Delete this phase and its quantities? The article register and previous quotation versions are retained.")){p.phases=p.phases.filter(ph=>ph.id!==d.v6RemovePhase);saveState();openProject(p.id,'phases');}}
    if(d.v6Bom)editBom(d.v6Bom);
    if('v6AddBom'in d)$('#v6BomRows').insertAdjacentHTML('beforeend',bomRow());
    if('v6RemoveBom'in d)t.closest('tr').remove();
    if(d.v6RfqNew)newRfq(d.v6RfqNew);
    if(d.v6RfqMail)rfqMail(d.v6RfqMail);
    if(d.v6RfqAnswer)answerRfq(d.v6RfqAnswer);
    if(d.v6RfqSent){const r=state.rfqs.find(r=>r.id===d.v6RfqSent);r.sentAt=CDPStructure.today();saveState();openProject(r.projectId,'rfq');}
    if(d.v6RfqSelect){const r=state.rfqs.find(r=>r.id===d.v6RfqSelect);CDPStructure.selectResponse(state,r);saveState();renderAll();openProject(r.projectId,'rfq');}
    if(d.v6Go){const f=$('#v6Lead');if(f){if(!f.reportValidity())return;saveLeadV6(f);}const p=CDPStructure.go(state,d.v6Go);saveState();renderAll();openProject(p.id);}
    if(d.v6Nogo||d.v6Reactivate){const l=state.leads.find(l=>l.id===(d.v6Nogo||d.v6Reactivate));l.status=d.v6Nogo?'No Go':'Aktivt';l.history=l.history||[];l.history.push({status:l.status,date:CDPStructure.today()});saveState();renderAll();closeModal();}
    if(d.v6Preview)previewQuoteFromCalculation(d.v6Preview);
    if(d.v6Quote)addQuoteVersion(d.v6Quote);
    if('v6Backup'in d)downloadV6('cappelen-dimyr-data-'+CDPStructure.today()+'.json',JSON.stringify(state,null,2));
  }catch(err){toast(err.message);}}
  function v6Submit(e){const f=e.target;if(!f.id.startsWith('v6'))return;e.preventDefault();e.stopImmediatePropagation();try{if(!f.reportValidity())return;const v=Object.fromEntries(new FormData(f));
    if(f.id==='v6NewProject'){const customer=state.customers.find(c=>c.id===v.customerId&&c.active!==false);if(!customer)throw Error("Select a customer from the register.");if(!(window.CDPProjectUsers||[]).some(u=>u.email===v.owner))throw Error("Select an owner.");const p=CDPStructure.createProject(state,{...v,customer:customer.name});p.qualitySamples=[];CDPCustomers.link(state,p,{customer:customer.id,customerContact:customer.contacts?.find(c=>c.primary&&c.active!==false)?.id||'',refreshCustomer:true});saveState();projectFilter='active';renderAll();showView('projects');openProject(p.id);toast("The project has been created.");}
    if(f.id==='v6ProjectLoss'){const p=CDPStructure.loseProject(state,f.dataset.p,v);saveState();projectFilter='lost';renderAll();showView('projects');openProject(p.id);toast("The project has been marked as lost.");}
    if(f.id==='v6Lead'){saveLeadV6(f);saveState();renderAll();closeModal();showView('leads');}
    if(f.id==='v6Phase'){const p=state.projects.find(p=>p.id===f.dataset.p);if(v.productionStart&&v.deliveryDate&&v.productionStart>v.deliveryDate)throw Error("Production start must precede the delivery date.");const ph=p.phases.find(ph=>ph.id===f.dataset.id);if(!v.name.trim())throw Error("Enter a phase number.");Object.assign(ph,{name:v.name.trim(),productionStart:v.productionStart,deliveryDate:v.deliveryDate});saveState();openProject(p.id,'phases');}
    if(f.id==='v6PhaseArticle'){writableRfq();const p=state.projects.find(p=>p.id===f.dataset.p),ph=p.phases.find(ph=>ph.id===f.dataset.id),ids=new FormData(f).getAll('article'),items=ids.map(articleId=>{if(!state.articles.some(a=>a.id===articleId&&a.projectId===p.id))throw Error("Select articles from the project.");const input=Array.from(f.querySelectorAll('[data-phase-pick-quantity]')).find(el=>el.dataset.phasePickQuantity===articleId),quantity=Number(input.value);if(!Number.isSafeInteger(quantity)||quantity<1)throw Error("Quantity must be a positive integer.");return {...ph.items.find(i=>i.articleId===articleId),articleId,quantity};});ph.items=items;saveState();openProject(p.id,'phases');expandPhase(ph.id);}



    if(f.id==='v6Calculation'){const p=state.projects.find(p=>p.id===f.dataset.p),draft=calculationDraft(p),pc=projectCalculation(draft);if(pc.errors.length)throw Error(pc.errors.join(' '));Object.assign(p,draft);saveState();renderAll();toast("Costing saved.");}
  }catch(err){toast(err.message);}}

  function phaseQuoteRows(q,internal=false){const currency=q.currency||'EUR';return q.phaseSnapshots.map(ph=>`<tr class="phase-heading"><th colspan="6">${esc(ph.name)} · Delivery to customer ${date(ph.deliveryDate)} · ${esc(ph.calculation.deliveryTerm)} ${esc(ph.calculation.destination||'')}</th></tr>${ph.items.map(a=>`<tr><td>${esc(publicReference(a.code))}</td><td>${esc(a.name)}<br><small>${esc(a.location||'')}</small></td><td>${esc(articleSize(a))}</td><td>${a.quantity}</td><td class="num">${money(a.salesUnit,currency)}</td><td class="num">${money(a.salesTotal,currency)}</td></tr>`).join('')}${ph.freightShown?`<tr><td colspan="5">Freight · ${esc(ph.name)}</td><td class="num">${money(ph.freightShown,currency)}</td></tr>`:''}<tr><td colspan="5">Phase quotation price${internal?" · cost "+money(ph.totalCost,currency):''}</td><td class="num">${money(ph.salesPrice,currency)}</td></tr>`).join('');}
  function openQuote(id,version){legacy_openQuote(id,version);const q=findQuote(id,version);if(!q?.phaseSnapshots)return;const container=$('.modal-body .table-scroll');if(container)container.innerHTML=`<table><thead><tr><th>Article</th><th>Description</th><th>Size</th><th>Quantity</th><th>Unit price</th><th>Quotation price</th></tr></thead><tbody>${phaseQuoteRows(q,true)}</tbody></table>`;}
  function quoteDocument(q,p,preview=false){const {company,customer}=quotePartyData(q,p),b=customer.billing||{},d=customer.sameAsBilling!==false?{...b,contact:customer.delivery?.contact,phone:customer.delivery?.phone}:customer.delivery||{},c=q.calculationSnapshot||{},currency=q.currency||p?.currency||'EUR';const address=x=>[x.name,x.address,[x.zip,x.city].filter(Boolean).join(' '),x.country,x.contact,x.email,x.phone].filter(Boolean).map(esc).join('<br>');return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${esc(q.project)} · ${preview?'PREVIEW':esc(quoteReference(q))}</title><style>@page{size:A4;margin:15mm}*{box-sizing:border-box}body{font:12px Arial,sans-serif;color:#252720;margin:24px auto;max-width:1000px;line-height:1.45}h1{font-size:25px}.top,.parties,.terms{display:flex;justify-content:space-between;gap:28px}.parties>div{flex:1}.top{border-bottom:2px solid #333}.parties,.terms{margin:25px 0}table{border-collapse:collapse;width:100%;margin:20px 0}td,th{padding:9px 5px;border-bottom:1px solid #ccc;text-align:left}.num{text-align:right}.phase-heading{background:#eeeee8}tr{break-inside:avoid}thead{display:table-header-group}.total{font-size:16px;font-weight:bold}.footer{border-top:1px solid #555;margin-top:25px;padding-top:12px;font-size:11px}.preview{background:#fff0c7;padding:10px}.print{padding:10px;margin:20px 0}@media print{.print{display:none}body{margin:0;max-width:none}}</style></head><body>${preview?"<p class=\"preview\">PREVIEW – no quotation version has been created.</p>":''}<div class="top"><div><h1>${esc(company.name||'Cappelen Dimyr Projects')}</h1>${address(company)}</div><div><h1>QUOTATION ${preview?'PREVIEW':''}</h1>${esc(quoteReference(q))} · V${esc(q.version)}<br>Date ${date(q.created)}<br>Valid until ${date(addDaysIso(q.created,c.validityDays||30))}<br>Currency ${esc(currency)}</div></div><div class="parties"><div><strong>Bill to</strong><p>${address(b)}</p>VAT ${esc(b.vatNumber||'—')}</div><div><strong>Ship to</strong><p>${address(d)}</p></div><div><strong>Seller details</strong><p>Company reg. no. ${esc(company.orgNumber||'—')}<br>VAT ${esc(company.vatNumber||'—')}<br>EORI ${esc(company.eori||'—')}<br>${esc(company.web||'')}</p></div></div><h2>${esc(q.project)}</h2><table><thead><tr><th>Article</th><th>Description</th><th>Size</th><th>Quantity</th><th class="num">Unit price</th><th class="num">Amount</th></tr></thead><tbody>${phaseQuoteRows(q)}<tr class="total"><td colspan="5">TOTAL QUOTATION – ALL PHASES</td><td class="num">${money(q.amount,currency)}</td></tr></tbody></table><div class="terms"><div><strong>Payment terms</strong><p>${esc(c.paymentTerms||'—')}</p></div><div><strong>Comment</strong><p>${esc(c.notes||'—')}</p></div></div>${q.phaseSnapshots.map(ph=>`<p><strong>${esc(ph.name)} · ${esc(ph.calculation.deliveryTerm)}</strong>: ${ph.calculation.deliveryTerm==='DDP'?"Customs duties and import costs are included according to the stated delivery terms.":"Import duties, taxes and customs clearance at destination are paid by the buyer."}</p>`).join('')}<div class="footer">${esc(company.name||'')} · ${esc(company.email||'')} · ${esc(company.phone||'')}<br>IBAN ${esc(company.iban||'—')} · BIC/SWIFT ${esc(company.bic||'—')}</div><button class="print" onclick="window.print()">Print / Save as PDF</button></body></html>`;}
  function renderQuotePdf(q,p,{autoPrint=true,preview=false}={}){if(!q.phaseSnapshots)return legacy_renderQuotePdf(q,p,{autoPrint,preview});document.getElementById('v6PreviewOverlay')?.remove();const overlay=document.createElement('div');overlay.id='v6PreviewOverlay';overlay.setAttribute('role','dialog');overlay.setAttribute('aria-label',"Quotation preview");overlay.innerHTML="<div class=\"v6-preview-bar\"><strong>Quotation · all phases</strong><button type=\"button\" class=\"button secondary\" data-print-preview>Print / Save PDF</button><button type=\"button\" class=\"button secondary\" data-close-preview>Close preview</button></div><iframe title=\"Quotation all phases\"></iframe>";document.body.append(overlay);const frame=overlay.querySelector('iframe');frame.srcdoc=quoteDocument(q,p,preview);overlay.querySelector('[data-close-preview]').onclick=()=>overlay.remove();overlay.querySelector('[data-print-preview]').onclick=()=>frame.contentWindow.print();if(autoPrint)frame.onload=()=>frame.contentWindow.print();}
  function customerExcelRows(q,p){
    const {company,customer}=quotePartyData(q,p),b=customer.billing||{},d=customer.sameAsBilling!==false?{...b,...Object.fromEntries(Object.entries(customer.delivery||{}).filter(([k])=>['contact','phone'].includes(k)))}:customer.delivery||{},c=q.calculationSnapshot||{};
    const rows=[[company.name||'Cappelen Dimyr Projects'],["QUOTATION",quoteReference(q),'Version',q.version],["Project",q.project],["Date",q.created,"Valid until",addDaysIso(q.created,c.validityDays||30)],["Currency",q.currency||p?.currency||'EUR'],["Seller",company.address,company.zip,company.city,company.country],["Company reg. no.",company.orgNumber,'VAT',company.vatNumber,'EORI',company.eori],["Bill to",b.name,b.address,b.zip,b.city,b.country],["Customer contact",b.contact,b.email,b.phone],["Ship to",d.name,d.address,d.zip,d.city,d.country],["Delivery contact",d.contact,d.phone],[]];
    for(const ph of q.phaseSnapshots){rows.push(["PHASE",ph.name,"Delivery to customer",ph.deliveryDate],["Delivery terms",ph.calculation.deliveryTerm,ph.calculation.destination||''],["Article","Description","Size","Quantity","Unit price","Amount"]);for(const a of ph.items)rows.push([publicReference(a.code),a.name,articleSize(a),a.quantity,a.salesUnit,a.salesTotal]);if(ph.freightShown)rows.push(["Freight",ph.name,'',1,ph.freightShown,ph.freightShown]);rows.push(["Phase quotation price",'','','','',ph.salesPrice],[]);}
    rows.push(["TOTAL QUOTATION – ALL PHASES",'','','','',q.amount],["Payment terms",c.paymentTerms||''],["Comment",c.notes||''],['IBAN',company.iban,'BIC/SWIFT',company.bic],["Contact",company.email,company.phone,company.web]);return rows;
  }
  function exportQuoteExcel(id,version){const q=findQuote(id,version);if(!q?.phaseSnapshots)return legacy_exportQuoteExcel(id,version);const p=state.projects.find(p=>p.id===q.projectId),blob=window.CDPExcel.workbook(customerExcelRows(q,p)),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=quoteReference(q)+'_V'+q.version+'.xlsx';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}


  async function openDirectProject(){await window.CDPLoadProjectUsers?.({all:true});v6Dialog("New project",`<form id="v6NewProject"><p>Create a project directly. No lead or meeting is required.</p><div class="form-grid">${field('name',"Project name",'','text','required')}${projectOptionFields({projectType:'simple',phaseMode:'single'})}<label class="field"><span>Customer</span><select name="customerId" required><option value="">Select customer</option>${(state.customers||[]).filter(c=>c.active!==false).map(c=>`<option value="${esc(c.id)}">${esc(c.name)}</option>`).join('')}</select></label>${field('country',"Country")}${selectField('currency',"Currency",['EUR','SEK','USD','GBP','NOK','DKK'],'EUR')}<label class="field"><span>Owner</span><select name="owner" required><option value="">Select owner</option>${(window.CDPProjectUsers||[]).map(u=>`<option value="${esc(u.email)}" ${u.email.toLowerCase()==='david@cappelendimyr.com'?'selected':''}>${esc(u.initials||window.CDPUserLabels?.suggest(u.name,u.email)||'—')}</option>`).join('')}</select></label>${window.CDPProjectUsersComplete?'':"<p>The full user list could not be loaded. Showing available users. Check access to User admin and reopen this form to retry.</p>"}</div><label class="field"><span>Description</span><textarea name="description"></textarea></label><button class="button primary">Create project</button></form>`);}
  function projectOutcomeActions(p){if(p.businessStatus==='Förlorat')return `<section class="v6-card"><h3>Lost project</h3><p>${date(p.lostAt)} · ${esc(p.lossReason||"Reason not recorded")}</p><p class="preserve-lines">${esc(p.lossComment||'')}</p><button class="button secondary" data-v6-reopen-project="${esc(p.id)}">Reactivate projects</button></section>`;if(p.businessStatus==='Vunnet'||p.phase==='Vunnet')return '';return `<div class="section-action"><span>${p.description?esc(p.description):''}</span><button class="button danger" data-v6-lose-project="${esc(p.id)}">Mark as lost</button></div>`;}
  function openProjectLoss(id){const p=state.projects.find(p=>p.id===id);if(!p)return;v6Dialog("Mark project as lost",`<form id="v6ProjectLoss" data-p="${esc(id)}"><h3>${esc(p.name)}</h3><p>The project moves to Lost projects and is removed from the active pipeline. Sent quotations are marked Declined and drafts Withdrawn. Articles, phases and quotation versions are retained.</p><div class="form-grid">${field('lostAt',"Loss date",CDPStructure.today(),'date','required')}${selectField('reason',"Reason for loss",["Price","Chose another supplier","Project cancelled","Schedule / delivery","Requirements or product do not match","No feedback","Other"],"Price")}</div><label class="field"><span>Comment</span><textarea name="comment"></textarea></label><button class="button danger">Confirm lost project</button><button type="button" class="button secondary" data-project-id="${esc(id)}">Cancel</button></form>`);}
  function markQuoteDeclined(id,version){const q=findQuote(id,version);if(q?.status==='Skickad')openProjectLoss(q.projectId);}

  // v7: project-owned BOM, reusable master templates and samples linked to RFQs.
  function bomOverview(p) {
    const rows=state.articles.filter(a=>a.projectId===p.id);
    return `${rows.length?`<ul class="bom-article-list">${rows.map(a=>`<li><button type="button" class="text-button" data-v6-bom="${esc(a.id)}">${esc(a.name)}</button>${p.projectType==='simple'?'':`<button type="button" class="button secondary" data-quality-for-article="${esc(a.id)}">Sample</button>`}</li>`).join('')}</ul>`:''}`;
  }
  function openArticle(id){editBom(id);}
  function cadLinks(a){return (Array.isArray(a.cadLinks)?a.cadLinks:(a.cadUrl?[{url:a.cadUrl,name:a.cadName||"Open CAD"}]:[])).filter(l=>/^https?:\/\//i.test(l.url||''));}
  function cadDropdown(links,label='CAD'){links=links.filter(l=>/^https?:\/\//i.test(l.url||''));return `<span class="cad-field-label">${esc(uiLabel(label))}</span><details class="cad-dropdown"><summary>${links.length?"Select "+label+" file ("+links.length+')':"None "+label+" links"}</summary><div class="cad-dropdown-menu">${links.map(l=>`<a href="${esc(l.url)}" target="_blank" rel="noopener noreferrer">${esc(l.name||"Open "+label)}</a>`).join('')||"<span>None "+label+" links have been added.</span>"}</div></details>`;}
  function labelLinks(a){return Array.isArray(a.labelLinks)?CDPStructure.clone(a.labelLinks):[];}
  function labelDropdown(links){return cadDropdown(links,'Label');}
  function openCadLinkModal(kind='cad'){
    const dialog=document.createElement('dialog');dialog.id='cadLinkDialog';dialog.setAttribute('aria-labelledby','cadLinkTitle');
    dialog.innerHTML=`<form id="v7CadLink"><h2 id="cadLinkTitle">New CAD link</h2>${field('newCadUrl',"Link",'','url','required pattern="https?://.+"')}${field('newCadName',"Name",'','text','required')}<p class="cad-error" role="alert" hidden></p><div class="modal-footer"><button type="button" class="button secondary" data-v7-cancel-cad>Cancel</button><button class="button primary" type="submit">Save</button></div></form>`;
    if(kind==='label'){dialog.innerHTML=dialog.innerHTML.replace("New CAD link","New label link");dialog.querySelector('form').dataset.linkKind='label';}
    dialog.addEventListener('cancel',e=>e.preventDefault());dialog.addEventListener('keydown',e=>{if(e.key==='Escape')e.stopPropagation();});dialog.addEventListener('close',()=>{dialog.remove();$('.bom-functions summary')?.focus();});document.body.append(dialog);dialog.showModal();
  }
  function bomFunctionPanel(action){
    const f=$('#v7Bom'),p=$('#bomFunctionPanel');$('.bom-functions').open=false;if(action==='add'||action==='add-label'){openCadLinkModal(action==='add-label'?'label':'cad');return;}p.hidden=false;
    if(action==='copy')p.innerHTML=`<label class="field"><span>Copy BOM from product</span><select name="copySource"><option value="">Select…</option>${state.projects.find(p=>p.id===state.articles.find(a=>a.id===f.dataset.id)?.projectId).products.filter(a=>a.id!==state.articles.find(x=>x.id===f.dataset.id)?.productId).map(a=>`<option value="${esc(a.id)}">${esc(a.name)}</option>`).join('')}</select></label><button type="button" class="button secondary" data-v7-copy-bom>Load BOM</button>`;
    if(action==='remove')p.innerHTML=`<h3>Delete CAD-link</h3>${f._cadLinks.length?f._cadLinks.map((l,i)=>`<div class="section-action"><span>${esc(l.name||l.url)}</span><button type="button" class="button secondary" data-v7-remove-cad="${i}">Delete</button></div>`).join(''):"<p>No CAD links.</p>"}`;
    p.insertAdjacentHTML('beforeend',"<button type=\"button\" class=\"button secondary\" data-v7-cancel-function>Cancel</button>");
  }
  function editBom(id,draft=null) {
    const article=state.articles.find(a=>a.id===id);if(!article)return;CDPStructure.products.sync(state);const product=CDPStructure.products.find(state,article);const a=draft||{...CDPStructure.clone(article),...CDPStructure.products.spec(product),productEditName:product.name};
    const sources=state.articles.filter(x=>x.id!==id);
    const options=rows=>"<option value=\"\">Select…</option>"+rows.map(x=>`<option value="${esc(x.id)}">${esc(x.name)}</option>`).join('');
    v6Dialog('BOM – '+a.productEditName,`<form id="v7Bom" data-id="${esc(id)}"><p>Shared product BOM. Article sizes, locations and quantities are managed separately.</p><section id="bomFunctionPanel" hidden></section><div class="form-grid">${field('productName',"Product name",a.productEditName,'text','required')}${field('design',"Design",a.design||'')}${field('construction',"Construction",a.construction||'')}${field('material',"Material / material mix",a.material||'')}${field('quality',"Quality",a.quality||'')}${field('pileHeight','Pile height, mm',a.pileHeight||'')}${field('colours',"Colours / colour references",a.colours||'')}${field('finish',"Edge / finish",a.finish||'')}${field('nof',"NOF / technical values",a.nof||'')}<div id="bomCadField" class="field">${cadDropdown(cadLinks(a))}</div><div id="bomLabelField" class="field">${labelDropdown(labelLinks(a))}</div></div><label class="field"><span>Technical specification / comments</span><textarea name="specification" rows="4">${esc(a.specification||'')}</textarea></label><p class="detail-sub">References are saved in Supabase. Attach the actual files when emailing the RFQ.</p><h3>Materials and components</h3><div class="table-scroll"><table><thead><tr><th>Component</th><th>Quantity</th><th>Unit</th><th>Specification</th><th></th></tr></thead><tbody id="v6BomRows">${(a.bom||[]).map(bomRow).join('')}</tbody></table></div><button type="button" class="button secondary" data-v6-add-bom>＋ Component</button><div class="modal-footer"><button type="button" class="button secondary" data-project-tab="articles" data-id="${esc(a.projectId)}">Till projektet</button><button class="button primary">Save BOM</button>${state.projects.find(p=>p.id===a.projectId)?.projectType==='simple'?'':`<button type="button" class="button secondary" data-quality-for-article="${esc(id)}">Sample</button><button type="button" class="button primary" data-v7-bom-rfq>Save & create RFQ</button>`}</div></form>`);
    $('#v7Bom')._cadLinks=cadLinks(a);$('#v7Bom')._labelLinks=labelLinks(a);
    $('.modal-header .modal-close').insertAdjacentHTML('beforebegin',`<details class="bom-functions"><summary class="button secondary">Functions</summary><div class="bom-functions-menu"><button type="button" data-v7-function="copy">Copy BOM from product</button><button type="button" data-v7-function="add">New CAD link</button><button type="button" data-v7-function="remove">Delete CAD-link</button><button type="button" data-v7-function="add-label">New label link</button></div></details>`);

  }
  function bomDraft() {
    const f=$('#v7Bom');if(!f.reportValidity())throw Error("Check the BOM fields.");
    const fd=new FormData(f),v=Object.fromEntries([...fd.keys()].map(k=>[k,fd.get(k)])),original=state.articles.find(a=>a.id===f.dataset.id),a={...CDPStructure.clone(original),...CDPStructure.products.spec(CDPStructure.products.find(state,original))};a.productEditName=v.productName;
    for(const k of ['design','construction','material','quality','pileHeight','colours','finish','nof','specification'])a[k]=v[k];
    a.cadLinks=CDPStructure.clone(f._cadLinks||[]);a.cadUrl=a.cadLinks[0]?.url||'';a.cadName=a.cadLinks[0]?.name||'';
    a.labelLinks=CDPStructure.clone(f._labelLinks||[]);
    a.bom=$$('[data-bom-row]',f).map(row=>Object.fromEntries($$('input',row).map(el=>[el.name,el.type==='number'?Number(el.value):el.value])));
    a.updatedAt=new Date().toISOString();return a;
  }
  function commitBom(){const draft=bomDraft(),a=state.articles.find(x=>x.id===draft.id),p=state.projects.find(p=>p.id===a.projectId);CDPStructure.products.save(state,p,a.productId,{...CDPStructure.products.spec(draft),name:draft.productEditName});saveState();renderAll();return a;}
  function templateRegister() {
    v6Dialog("Article register · Templates",`<p>Standalone technical master data. Save from a project article's BOM and copy into other project articles.</p>${state.articleTemplates.map(t=>`<section class="v6-card"><h3>${esc(t.name)}</h3><p>${esc(t.material||'')} · ${esc(t.construction||'')} · ${esc(articleSize(t))}</p><p class="preserve-lines">${esc(t.specification||'')}</p><button class="button secondary" data-v7-template-detail="${esc(t.id)}">Visa grunddata</button></section>`).join('')||"<p>No templates saved. Open a project article → BOM → Save as article template.</p>"}`);
  }
  function legacyNewRfq(pid,articleId='') {
    const articles=state.articles.filter(a=>a.projectId===pid);
    v6Dialog("New RFQ",`<form id="v7Rfq" data-p="${esc(pid)}"><h3>Articles</h3>${articles.map(a=>`<label class="v6-check"><input type="checkbox" name="article" value="${esc(a.id)}" ${a.id===articleId?'checked':''}> ${esc(a.name)}</label>`).join('')}<h3>Manufacturer</h3>${state.manufacturers.filter(m=>m.active!==false).map(m=>`<label class="v6-check"><input type="checkbox" name="manufacturer" value="${esc(m.id)}"> ${esc(m.name)}</label>`).join('')||"<p>First add a manufacturer to the manufacturer register.</p>"}<section class="v6-card"><h3>Sample request</h3><label class="v6-check"><input type="checkbox" name="sampleRequired"> Sample required</label><div class="form-grid">${field('sampleType','Sample type')}${field('sampleSize','Sample size')}${field('requestedDate','Requested date',CDPStructure.today(),'date')}${field('deliveryAddress',"Sample delivery address")}${field('instructions',"Sample instructions")}</div></section><p>Each article and manufacturer receives a specification with a frozen BOM and phase quantities. Email drafts are opened manually afterwards.</p><button class="button primary">Create RFQ specification</button></form>`);
  }
  function rfqSchedule(r){const phases=CDPStructure.rfqPhases(state,r);return phases.length?phases:[{name:"No phase assigned",productionStart:'',deliveryDate:''}];}
  function rfqScheduleTable(r){return "<table><thead><tr><th>Phase</th><th>Production start</th><th>Delivery date</th></tr></thead><tbody>"+rfqSchedule(r).map(ph=>'<tr><td>'+esc(ph.name)+'</td><td>'+date(ph.productionStart)+'</td><td>'+date(ph.deliveryDate)+'</td></tr>').join('')+"</tbody></table><p>Dates are set by Cappelen in the phase details.</p>";}
  function legacyRfqView(p) {
    return `<div class="section-action"><div><h3>RFQ · compare by article</h3><p>Purchase prices are entered in EUR. Production start and delivery dates follow the project phases.</p></div><button class="button primary" data-v6-rfq-new="${esc(p.id)}">＋ New RFQ</button></div>${state.articles.filter(a=>a.projectId===p.id).map(a=>`<section class="v6-card"><h3>${esc(a.name)}</h3><p>Selected manufacturer: <strong>${esc(a.selectedPrice?.manufacturer||"No RFQ selected")}</strong>${a.selectedPrice?' · '+money(a.selectedPrice.price,a.selectedPrice.currency)+' '+esc(uiLabel(a.selectedPrice.priceUnit)):''}</p><div class="table-scroll"><table><thead><tr><th>Manufacturer / response</th><th>Phase</th><th>Production start</th><th>Delivery date</th><th>Price EUR</th><th>MOQ / lead time</th><th>Sample</th><th>Comment</th><th>Actions</th></tr></thead><tbody>${state.rfqs.filter(r=>r.articleId===a.id&&r.projectId===p.id).map(r=>{const sample=CDPStructure.sampleFor(state,r),selected=a.selectedRfqId===r.id,changed=selected&&a.selectedPrice?.revision!==r.revision;return `<tr><td><strong>${esc(state.manufacturers.find(m=>m.id===r.manufacturerId)?.name||"Manufacturer missing")}</strong><br>${esc(uiLabel(r.status))} · ${r.decision==='declined'?'Kan inte offerera':r.decision==='accepted'?'Offererad':'Ej besvarad'}<br><small>${r.sentAt?"Marked as sent "+esc(r.sentAt):'Draft'}</small></td>${['name','productionStart','deliveryDate'].map(key=>`<td>${rfqSchedule(r).map(ph=>`<div class="rfq-phase-value">${key==='name'?esc(ph.name):date(ph[key])}</div>`).join('')}</td>`).join('')}<td>${r.price!=null?(r.currency==='EUR'?money(r.price,'EUR')+' '+esc(uiLabel(r.priceUnit)):"Previous price in "+esc(r.currency)+" – enter EUR"):'—'}</td><td>${Number(r.moq)||0} st<br>${Number(r.leadTime)||0} days</td><td>${sample?.required?esc(uiLabel(sampleLabel(sample.status))):"Not requested"}<br><button class="text-button" data-v7-sample="${esc(r.id)}">Sample</button></td><td>${esc(r.comment||'')}${changed?"<p class=\"v6-error\">The response has changed. The previously selected price remains until you select again.</p>":''}</td><td><button class="text-button" data-v6-rfq-mail="${esc(r.id)}">Email / specification</button><button class="text-button" data-v6-rfq-answer="${esc(r.id)}">Record response</button>${r.decision==='accepted'&&r.status==='Godkänt'&&r.currency==='EUR'?`<button class="text-button" data-v6-rfq-select="${esc(r.id)}">${selected&&!changed?"✓ Selected price":"Select price"}</button>`:''}<button class="text-button" data-v7-rfq-history="${esc(r.id)}">History</button></td></tr>`;}).join('')||"<tr><td colspan=\"9\">No RFQ created.</td></tr>"}</tbody></table></div></section>`).join('')}`;
  }
  function rfqText(r) {
    const s=r.requestSnapshot,a=s.article,sample=s.sample||{};
    return `RFQ
Project reference: ${s.project||state.projects.find(p=>p.id===r.projectId)?.name||"Projects"}
Article: ${publicReference(a.code)} – ${a.name}
Size: ${articleSize(a)}\n${[["Construction",'construction'],['Material','material'],["Quality",'quality'],['Pile height (mm)','pileHeight'],["Colours",'colours'],["Edge / finish",'finish'],['NOF','nof'],["Specification",'specification']].map(([label,key])=>label+': '+(a[key]||'')).join('\n')}\nCAD:\n${cadLinks(a).map(l=>l.name+': '+l.url).join('\n')||'—'}\nLabel:\n${labelLinks(a).map(l=>l.name+': '+l.url).join('\n')||'—'}
Design references:
${(a.designReferences||[]).join('\n')}\nBOM:\n${(a.bom||[]).map(b=>`${b.name}: ${b.quantity} ${b.unit}; ${b.notes||''}`).join('\n')}
Phases:
${CDPStructure.rfqPhases(state,r).map(ph=>`${ph.name}: ${ph.quantity} st; production start ${ph.productionStart||"not determined"}; delivery date ${ph.deliveryDate||"not determined"}`).join('\n')}\nSample required: ${sample.required?'Yes':'No'}\n${sample.required?`Type: ${sample.type||''}\nSize: ${sample.size||''}\nRequested date: ${sample.requestedDate||''}\nDelivery address: ${sample.deliveryAddress||''}\nInstructions: ${sample.instructions||''}\n`:''}
Respond with Unanswered, Quoted (price in EUR) or Unable to quote, price per m²/unit, MOQ, lead time in days, validity and comment. If a sample was requested, enter estimated dispatch and tracking when available.
Production start and delivery dates are set by Cappelen and cannot be changed by the manufacturer. A comment is optional.
Images/CAD are attached separately by the sender.`;
  }
  function answerRfq(id) {
    const r=state.rfqs.find(r=>r.id===id),p=state.projects.find(p=>p.id===r.projectId);
    v6Dialog("RFQ response",`<form id="v7Answer" data-id="${esc(id)}">${rfqScheduleTable(r)}<div class="form-grid"><label class="field"><span>Status per article</span><select name="decision"><option value="pending" ${r.decision==='pending'?'selected':''}>Unanswered</option><option value="accepted" ${r.decision==='accepted'?'selected':''}>Quoted (price EUR)</option><option value="declined" ${r.decision==='declined'?'selected':''}>Unable to quote</option></select></label>${field('price',"Production price EUR",r.currency==='EUR'?(r.price??''):'','number','min="0" step="0.01"')}${selectField('priceUnit',"Price unit",['per m²','per styck'],r.priceUnit||'per m²')}<input type="hidden" name="currency" value="EUR"><p>Purchase currency: EUR</p>${field('fxRate','1 EUR = projektvaluta ('+p.currency+')',r.fxRate??1,'number','min="0.000001" step="0.000001"')}${field('moq',"MOQ, number of articles",r.moq??0,'number','min="0" step="1"')}${field('leadTime',"Lead time, days",r.leadTime??0,'number','min="0" step="1"')}${selectField('status',"Price status",['Förhandlas','Godkänt'],r.status||'Förhandlas')}${field('validUntil',"Valid until",r.validUntil||'','date')}</div><label class="field"><span>Comment (optional)</span><textarea name="comment">${esc(r.comment||'')}</textarea></label><p>A saved response does not replace a previously selected price. Select an approved price in the comparison view.</p><button class="button primary">Save response</button></form>`);
    const form=$('#v7Answer'),decision=form.elements.decision,price=form.elements.price;
    const update=()=>{price.disabled=decision.value!=='accepted';price.required=decision.value==='accepted';};
    decision.addEventListener('change',update);update();
  }
  function sampleLabel(status){return ({requested:'Requested',accepted:'Accepted',shipped:'Shipped',received:'Received',approved:'Approved',rejected:'Rejected'})[status]||status;}
  function samplesView(p){return bomOverview(p);}
  function editSample(id){const r=state.rfqs.find(r=>r.id===id);if(r)openArticleSample(r.articleId);}
  function butlerView(p) {
    return `<section class="v6-card"><h3>BUTLER · Purchase Orders</h3><p>Integration prepared. External PO references can be recorded manually per phase and manufacturer.</p><button class="button secondary" disabled title="Requires a future BUTLER API">Create Purchase Order · coming later</button><form id="v7Butler" data-p="${esc(p.id)}"><div class="form-grid"><label class="field"><span>Phase</span><select name="phaseId" required>${p.phases.map(ph=>`<option value="${esc(ph.id)}">${esc(ph.name)}</option>`).join('')}</select></label><label class="field"><span>Manufacturer</span><select name="manufacturerId" required><option value="">Select…</option>${state.manufacturers.map(m=>`<option value="${esc(m.id)}">${esc(m.name)}</option>`).join('')}</select></label>${field('externalPoId',"External Butler PO reference",'','text','required')}${field('status',"External Butler status",'','text','required')}</div><button class="button primary">Save / update PO reference</button></form>${(p.butlerOrders||[]).map(o=>`<p><strong>${esc(o.externalPoId)}</strong> · ${esc(uiLabel(o.status))} · ${esc(p.phases.find(ph=>ph.id===o.phaseId)?.name||"Phase missing")} · ${esc(state.manufacturers.find(m=>m.id===o.manufacturerId)?.name||"Manufacturer missing")}</p>`).join('')}</section>`;
  }
  function initializeV7() {
    $('#view-settings').insertAdjacentHTML('beforeend',`<section class="panel v6-card"><h2>Shared storage · Supabase</h2><p>Changes are saved for all signed-in users. Reload to fetch other users' latest changes. Conflicting changes are not overwritten.</p><button class="button secondary" onclick="location.reload()">Reload from database</button><button class="button secondary" data-v6-backup>Export loaded data (JSON)</button><button class="button secondary" data-v7-legacy>Previous enquiries (archive)</button><p>Previously worked locally in v7.0? A JSON backup can be imported into an empty database. Existing cloud data is not replaced.</p><label class="button secondary">Import local JSON<input id="v7Import" type="file" accept=".json" hidden></label></section>`);
    $('#view-articles .page-heading').insertAdjacentHTML('afterend',"<div class=\"v7-toolbar\"><button class=\"button secondary\" data-v7-templates>Article register · Templates</button></div>");
    document.addEventListener('click',v7Click,true);document.addEventListener('submit',v7Submit,true);
    $('#v7Import').addEventListener('change',async e=>{try{if(!e.target.files[0])return;const imported=JSON.parse(await e.target.files[0].text());const preview=window.CDPRemote.adapter.previewImport(imported);if(!confirm("Import "+preview.projects+" projects, "+preview.articles+" articles and "+preview.quotations+" quotation versions into the empty database?"))return;if(await window.CDPRemote.adapter.importLocal(imported))location.reload();}catch(error){alert("Import cancelled: "+error.message);}});
  }
  function v7Click(e) {
    const t=e.target.closest('button');if(!t)return;const d=t.dataset;if(!Object.keys(d).some(k=>k.startsWith('v7')))return;e.preventDefault();e.stopImmediatePropagation();
    try {
      if('v7CancelCad' in d)$('#cadLinkDialog').close();
      if(d.v7Function)bomFunctionPanel(d.v7Function);
      if('v7CancelFunction' in d){$('#bomFunctionPanel').innerHTML='';$('#bomFunctionPanel').hidden=true;}
      if('v7RemoveCad' in d){const a=bomDraft();a.cadLinks.splice(Number(d.v7RemoveCad),1);editBom(a.id,a);}
      if('v7CopyBom' in d||'v7UseTemplate' in d){const a=bomDraft(),f=$('#v7Bom'),source='v7CopyBom' in d?state.projects.find(p=>p.id===a.projectId).products.find(x=>x.id===f.elements.copySource.value):state.articleTemplates.find(x=>x.id===f.elements.templateSource.value);if(!source)throw Error("Select an article or template first.");CDPStructure.copyBom(source,a);editBom(a.id,a);toast("BOM loaded. Review and save the changes.");}
      if('v7SaveTemplate' in d){const a=bomDraft();CDPStructure.saveTemplate(state,a,$('#v7Bom').elements.templateName.value);saveState();toast("Master data saved as a standalone article template.");}
      if('v7BomRfq' in d){const a=commitBom();newRfq(a.projectId,a.id);}
      if('v7Templates' in d)templateRegister();
      if(d.v7TemplateDetail){const t=state.articleTemplates.find(t=>t.id===d.v7TemplateDetail);v6Dialog(t.name,`<p>Technical master data. Use this template from a project article's BOM.</p><div class="detail-grid">${[["Size",articleSize(t)],["Construction",t.construction],['Material',t.material],["Quality",t.quality],['Pile height, mm',t.pileHeight],["Colours",t.colours],["Edge / finish",t.finish],['NOF',t.nof]].map(([label,value])=>`<div class="detail-stat"><span>${esc(uiLabel(label))}</span><strong>${esc(value||'—')}</strong></div>`).join('')}</div><p class="preserve-lines">${esc(t.specification||'')}</p><h3>Design references</h3><p class="preserve-lines">${esc((t.designReferences||[]).join('\n')||'—')}</p><h3>Components</h3>${(t.bom||[]).map(b=>`<p>${esc(b.name)} · ${Number(b.quantity)||0} ${esc(b.unit)} · ${esc(b.notes||'')}</p>`).join('')}`);}
      if(d.v7Sample)editSample(d.v7Sample);
      if(d.v7RfqDownload){const r=state.rfqs.find(r=>r.id===d.v7RfqDownload);downloadV6('RFQ.txt',rfqText(r),'text/plain;charset=utf-8');}
      if(d.v7RfqHistory){const r=state.rfqs.find(r=>r.id===d.v7RfqHistory);v6Dialog("RFQ · previous responses",r.history.map(h=>`<section class="v6-card"><p>${esc(h.receivedAt||'Draft')} · ${esc(uiLabel(h.status||''))} · ${h.price!=null?money(h.price,h.currency):'—'} ${esc(uiLabel(h.priceUnit||''))}</p><p>${esc(h.comment||'')}</p></section>`).join('')||"<p>No previous response version.</p>");}
      if('v7Legacy' in d)v6Dialog("Previous enquiries · archive",state.inquiries.map(i=>`<section class="v6-card"><h3>${esc(i.project)}</h3><p>${esc(i.customer)} · ${esc(uiLabel(i.status))}</p><p class="preserve-lines">${esc(i.description||'')}</p></section>`).join('')||"<p>No previous enquiries.</p>");
    }catch(error){toast(error.message);}
  }
  function v7Submit(e) {
    const f=e.target;if(!f.id.startsWith('v7'))return;e.preventDefault();e.stopImmediatePropagation();
    try{
      if(!f.reportValidity())return;const v=Object.fromEntries(new FormData(f));
      if(f.id==='v7CadLink'){
        const url=v.newCadUrl.trim(),name=v.newCadName.trim();if(!/^https?:\/\//i.test(url)||!name){const error=$('.cad-error',f);error.hidden=false;error.textContent="Enter a valid link and a name.";return;}
        const bom=$('#v7Bom'),article=state.articles.find(x=>x.id===bom.dataset.id),p=state.projects.find(p=>p.id===article.projectId),product=CDPStructure.products.find(state,article),a={};const isLabel=f.dataset.linkKind==='label';if(isLabel){bom._labelLinks.push({url,name});a.labelLinks=CDPStructure.clone(bom._labelLinks);}else{bom._cadLinks.push({url,name});a.cadLinks=CDPStructure.clone(bom._cadLinks);a.cadUrl=a.cadLinks[0]?.url||'';a.cadName=a.cadLinks[0]?.name||'';}CDPStructure.products.save(state,p,product.id,{...a,name:product.name});saveState();renderAll();if(isLabel)$('#bomLabelField').innerHTML=labelDropdown(bom._labelLinks);else $('#bomCadField').innerHTML=cadDropdown(bom._cadLinks);$('#cadLinkDialog').close();
      }
      if(f.id==='v7Bom'){
const a=commitBom();editBom(a.id);toast("BOM saved.");}
      if(f.id==='v7Rfq'){const fd=new FormData(f),aa=fd.getAll('article'),mm=fd.getAll('manufacturer'),p=state.projects.find(p=>p.id===f.dataset.p);if(!aa.length||!mm.length)throw Error("Select at least one article and one manufacturer.");const sample={required:f.elements.sampleRequired.checked,type:v.sampleType,size:v.sampleSize,requestedDate:v.requestedDate,deliveryAddress:v.deliveryAddress,instructions:v.instructions};aa.forEach(id=>mm.forEach(mid=>CDPStructure.createRfq(state,p,state.articles.find(a=>a.id===id),mid,sample)));saveState();openProject(p.id,'rfq');}
      if(f.id==='v7Answer'){const r=state.rfqs.find(r=>r.id===f.dataset.id);CDPStructure.recordAnswer(state,r,v);saveState();openProject(r.projectId,'rfq');}
      if(f.id==='v7Sample'){const r=state.rfqs.find(r=>r.id===f.dataset.id);CDPStructure.saveSample(state,r,{...v,required:f.elements.required.checked});saveState();openProject(r.projectId,'samples');}
      if(f.id==='v7Butler'){const p=state.projects.find(p=>p.id===f.dataset.p);let o=p.butlerOrders.find(o=>o.externalPoId===v.externalPoId);if(!o){o={id:CDPStructure.uid('po'),projectId:p.id,workspaceId:state.workspaceId};p.butlerOrders.push(o);}Object.assign(o,v,{updatedAt:new Date().toISOString()});saveState();openProject(p.id,'delivery');}
    }catch(error){toast(error.message);}
  }



  let selectedRfqStage='complete',supplierStage='complete';
  function rfqStageView(p,type){selectedRfqStage=type;const archived=projectRfq().preliminary(p),current=p.projectRfq;
    if(type==='preliminary'&&archived)return `<h3>RFQ – Preliminary · saved reference</h3><p>The preliminary specification and responses are retained when RFQ – Complete is created.</p>${archived.recipients.map(r=>`<details><summary>${esc(state.manufacturers.find(m=>m.id===r.manufacturerId)?.name||"Manufacturer")}</summary>${rfqLines({...archived,answers:r.answers,readOnly:true},false,r.manufacturerId,p.id)}</details>`).join('')}<button class="button secondary" data-supplier-preview>Test supplier portal</button>`;
    if(current&&(current.type||'complete')!==type)return `<h3>RFQ – ${type==='preliminary'?"Preliminary":'Complete'}</h3><p>${type==='complete'?"Create a complete RFQ from the preliminary specification. Previous responses are retained separately.":"No preliminary RFQ was saved for this older project."}</p>${type==='complete'?`<button class="button primary" data-v6-rfq-new="${esc(p.id)}">Create RFQ – Complete</button>`:''}`;
    return rfqView(p);
  }
  function projectRfq(){return window.CDPProjectRfq;}
  function rfqSampleOptions(p,selected){return CDPStructure.qualitySamples(state,p).map(sample=>`<label class="v6-check"><input type="checkbox" name="sample" value="${esc(sample.id)}" ${(selected?selected.includes(sample.id):selectedRfqStage!=='preliminary')?'checked':''}> Sample – ${esc(CDPStructure.qualitySampleName(state,sample))} · ${esc(sample.size)} · 0 EUR</label>`).join('')||'<p>No samples yet. Create samples under the project’s Articles tab, then select them here.</p>';}
  function newRfq(pid,articleId=''){
    const p=state.projects.find(p=>p.id===pid),g=p.projectRfq,articles=state.articles.filter(a=>a.projectId===pid);
    v6Dialog(g?"Edit RFQ":"Create project RFQ",`<form id="projectRfqConfig" data-p="${esc(pid)}"><p>Separate preliminary and complete RFQs. Preliminary responses are retained for reference. Select articles, samples and manufacturers. SEND RFQ makes the request available to the selected manufacturer.</p><input type="hidden" name="rfqType" value="${selectedRfqStage}"><h3>RFQ – ${selectedRfqStage==='preliminary'?"Preliminary":'Complete'}</h3><p>Preliminary: production price and time in weeks until ready for dispatch; no phases or dates. Complete: BOM dimensions, phases and dates are required.</p><div class="table-scroll"><table><thead><tr><th>Article</th><th>Target EUR/m²</th></tr></thead><tbody>${articles.map(a=>`<tr><td><label><input type="checkbox" name="article" value="${esc(a.id)}" ${(g?.articleIds.includes(a.id)||a.id===articleId)?'checked':''}> ${esc(a.name)}</label></td><td><input type="number" min="0.01" step="0.01" aria-label="Target price ${esc(a.name)}" data-rfq-target="${esc(a.id)}" value="${g?(g.targetPrices?.[a.id]??''):(a.targetPrice??'')}"></td></tr>`).join('')}</tbody></table></div><h3>Quality samples</h3><div data-rfq-sample-options>${rfqSampleOptions(p,g?.sampleIds)}</div><p>${selectedRfqStage==='preliminary'?'Select the project samples to include in this preliminary RFQ.':'Select samples covering the selected articles.'} Create and edit samples under the project’s Articles tab.</p><p>Quality samples listed in this RFQ must be supplied free of charge.</p><h3>Manufacturer</h3>${state.manufacturers.filter(m=>m.active!==false).map(m=>`<label class="v6-check"><input type="checkbox" name="manufacturer" value="${esc(m.id)}" ${g?.recipients.some(r=>r.manufacturerId===m.id)?'checked':''}> ${esc(m.name)}</label>`).join('')||"<p>First add a manufacturer to the register.</p>"}<p>Existing recipients are retained. Use Withdraw in the RFQ list to remove their access. Changes to the specification require confirmation again.</p><button class="button primary">${g?"Save RFQ":"Create RFQ"}</button></form>`);
  }
  function rfqLines(view,editable=false,mid='',pid=''){
    const supplier=editable,preliminary=view.type==='preliminary';editable=editable&&!view.readOnly;return `<p>${preliminary?'Production time: from confirmed order and approved production documents until ready for dispatch. Transport excluded. ':''}Quality samples listed in this RFQ must be supplied free of charge.</p><div class="table-scroll"><table class="project-rfq-lines"><thead><tr><th>Article</th>${preliminary?'':"<th>Phase</th>"}<th>Number of</th>${preliminary?'':"<th>Production start</th><th>Delivery date</th>"}<th>Target EUR/m²</th><th>Price/SQM EUR</th><th>${preliminary?'Production weeks':"Schedule confirmed"}</th><th>Status</th><th>Comment</th><th>BOM</th></tr></thead><tbody>${view.lines.map(l=>{const a=view.answers[l.key]||{decision:'pending',price:null,comment:''},locked=!editable||Boolean(view.completedAt)||l.sample;return `<tr data-rfq-line="${esc(l.key)}" data-p="${esc(pid)}" data-mid="${esc(mid)}" data-revision="${view.revision}"><td>${esc((l.sample?'Sample – ':'')+l.article.name)}</td>${preliminary?'':`<td>${esc(l.phase||'—')}</td>`}<td>${l.sample?'—':l.quantity}</td>${preliminary?'':`<td>${l.sample?'—':date(l.productionStart)}</td><td>${l.sample?'ASAP':date(l.deliveryDate)}</td>`}<td>${!l.sample&&l.targetPrice!=null?money(l.targetPrice,'EUR'):'—'}</td><td>${l.sample?'0':editable?`<input class="rfq-price" aria-label="Price/SQM ${esc(l.article.name)} ${esc(l.phase)}" data-answer-price type="number" min="0.01" step="0.01" value="${a.price??''}" ${locked||a.decision!=='accepted'?'disabled':''}>`:a.decision==='accepted'?money(a.price,'EUR'):'—'}</td><td>${l.sample?'—':preliminary?(editable?`<input aria-label="Produktionstid weeks ${esc(l.article.name)}" data-answer-weeks type="number" min="0.1" step="any" value="${a.productionWeeks??''}" ${locked||a.decision!=='accepted'?'disabled':''}>`:a.productionWeeks??'—'):(editable?`<input aria-label="Confirm schedule ${esc(l.article.name)} ${esc(l.phase)}" data-answer-schedule type="checkbox" ${a.scheduleConfirmed&&a.scheduleRevision===view.revision?'checked':''} ${locked||a.decision!=='accepted'?'disabled':''}>`:a.scheduleConfirmed&&a.scheduleRevision===view.revision?"Yes":'—')}</td><td>${l.sample?'Sample':editable?`<select aria-label="Status ${esc(l.article.name)} ${esc(l.phase)}" data-answer-decision ${locked?'disabled':''}><option value="pending" ${a.decision==='pending'?'selected':''}>Unanswered</option><option value="accepted" ${a.decision==='accepted'?'selected':''}>Quoted</option><option value="declined" ${a.decision==='declined'?'selected':''}>Unable to quote</option></select>`:a.decision==='accepted'?'Offererad':a.decision==='declined'?'Kan inte offerera':'Ej besvarad'}</td><td>${l.sample?'—':editable?`<input aria-label="Comment ${esc(l.article.name)} ${esc(l.phase)}" data-answer-comment maxlength="4000" value="${esc(a.comment)}" ${locked?'disabled':''}><small data-answer-save></small>`:esc(a.comment||'—')}</td><td><button type="button" class="text-button" data-project-rfq-bom="${esc(l.key)}" data-rfq-archive="${view.readOnly?'1':''}" data-p="${esc(pid)}" data-mid="${esc(mid)}" data-preview="${supplier?'1':''}">${l.sample?'Sample':'BOM'}</button></td></tr>`;}).join('')}</tbody></table></div>`;
  }
  function rfqView(p){
    const g=p.projectRfq;
    const toolbar=`<div class="section-action"><div><h3>${g?'RFQ · '+(g.type==='preliminary'?"Preliminary":"Complete")+' · Revision '+g.revision:"Project RFQ"}</h3><p>${g?"Purchasing is in EUR. SEND RFQ publishes to the portal; no email is sent.":"Create a shared RFQ and select manufacturers."}</p></div><div class="rfq-actions"><button class="button secondary" data-supplier-preview>Test supplier portal</button><button class="button primary" data-v6-rfq-new="${esc(p.id)}">${g?"Edit RFQ":"Create RFQ – "+(selectedRfqStage==='preliminary'?"Preliminary":'Complete')}</button></div></div>`;
    if(!g)return toolbar+(state.rfqs.some(r=>r.projectId===p.id)?`<p>Previous RFQ responses exist for the project. Combine them in a project RFQ while retaining history.</p><button class="button secondary" data-project-rfq-adopt="${esc(p.id)}">Samla befintliga RFQ</button>`:"<p class=\"empty-state\">No RFQ has been created.</p>");
    return toolbar+`<div class="table-scroll"><table class="project-rfq-manufacturers"><thead><tr><th>Manufacturer</th><th>Total price EUR</th><th>SEND RFQ</th><th>Status</th></tr></thead><tbody>${g.recipients.map(r=>{const st=projectRfq().status(g,r),name=state.manufacturers.find(m=>m.id===r.manufacturerId)?.name||"Manufacturer missing",sent=r.publishedRevision&&!r.withdrawn;return `<tr><td><button class="text-button" data-rfq-toggle="${esc(r.manufacturerId)}" aria-expanded="false">▸ ${esc(name)}</button></td><td>${st.offered?(st.totalKnown?(st.full?'':"Subtotal: ")+money(st.total,'EUR'):"— (dimensions missing)"):'—'}<small class="rfq-progress">${st.offered} of ${st.count} quoted${st.declined?' · '+st.declined+" declined":''}</small></td><td><button class="button ${sent?'rfq-green':'secondary'}" data-project-rfq-send="${esc(p.id)}" data-mid="${esc(r.manufacturerId)}">${sent?'✓ SEND RFQ':'SEND RFQ'}</button>${r.sentAt?`<small class="rfq-progress">${date(r.sentAt.slice(0,10))}</small>`:''}</td><td><span class="rfq-status ${st.complete?'rfq-green':''}">${esc(uiLabel(st.label))}</span></td></tr><tr data-rfq-detail="${esc(r.manufacturerId)}" hidden><td colspan="4">${rfqLines({...g,answers:r.answers},false,r.manufacturerId,p.id)}<div class="rfq-actions"><button class="button primary" data-model-new="${esc(r.manufacturerId)}" data-p="${esc(p.id)}">Order full-size sample</button><button class="button secondary" data-supplier-preview="${esc(r.manufacturerId)}">Test as ${esc(name)}</button>${st.complete?`<button class="button secondary" data-project-rfq-reopen="${esc(p.id)}" data-mid="${esc(r.manufacturerId)}">Reopen for revision</button>`:''}${sent?`<button class="text-button" data-project-rfq-withdraw="${esc(p.id)}" data-mid="${esc(r.manufacturerId)}">Withdraw access</button>`:''}<button class="text-button" data-project-rfq-history="${esc(p.id)}" data-mid="${esc(r.manufacturerId)}">History</button>${st.complete&&g.type!=='preliminary'?g.articleIds.map(id=>{const ls=g.lines.filter(l=>!l.sample&&l.articleId===id);return ls.length&&ls.every(l=>r.answers[l.key]?.decision==='accepted')?`<button class="button secondary" data-project-rfq-select="${esc(p.id)}" data-mid="${esc(r.manufacturerId)}" data-article="${esc(id)}">Select price: ${esc(ls[0].article.name)}</button>`:'';}).join(''):''}</div></td></tr>`;}).join('')}</tbody></table></div>${g.legacyIds?.length?`<p>${g.legacyIds.length} previous RFQ records retained. <button class="text-button" data-rfq-legacy="${esc(p.id)}">View previous responses</button></p>`:''}`;
  }
  let supplierPreviewId='',supplierSaveQueue=Promise.resolve();
  function showSupplierPreview(mid=''){
    supplierPreviewId=mid;const manufacturer=state.manufacturers.find(m=>m.id===mid),views=(mid?projectRfq().supplierView(state,mid):[]).filter(v=>v.type===supplierStage);
    v6Dialog("Supplier portal · internal test",`<div class="supplier-preview"><div class="project-tabs"><button class="project-tab ${supplierStage==='preliminary'?'active':''}" data-supplier-stage="preliminary">Preliminary RFQ</button><button class="project-tab ${supplierStage==='complete'?'active':''}" data-supplier-stage="complete">Complete RFQ</button></div><div class="supplier-test-banner">Internal test mode in Projects. Responses saved here affect the project's RFQ. External manufacturer sign-in is not enabled.</div><label class="field"><span>View as manufacturer</span><select id="supplierPreviewSelect"><option value="">Select manufacturer</option>${state.manufacturers.map(m=>`<option value="${esc(m.id)}" ${m.id===mid?'selected':''}>${esc(m.name)}</option>`).join('')}</select></label><div class="section-action"><div><p class="eyebrow">CAPPELEN DIMYR · SUPPLIER</p><h2>${esc(manufacturer?.name||'RFQ portal')}</h2><p>Prices in EUR per m². Respond to every product row, then select Completed. Quality samples listed in this RFQ must be supplied free of charge.</p></div><button class="button secondary" data-supplier-refresh>Refresh view</button></div>${mid?state.projects.filter(p=>(p.modelSampleOrders||[]).some(o=>o.manufacturerId===mid&&o.sentAt)).map(p=>modelSampleList(p,mid)).join(''):''}${!mid?"<p>Select a manufacturer to test the portal.</p>":!views.length?"<p class=\"empty-state\">No RFQs have been made available to this manufacturer.</p>":`<div class="table-scroll"><table class="supplier-rfq-list"><thead><tr><th>RFQ</th><th>Sent</th><th>Completed</th></tr></thead><tbody>${views.map(v=>`<tr><td><button class="text-button" data-supplier-toggle="${esc(v.id)}" aria-expanded="false">▸ RFQ</button><small class="rfq-progress">${v.type==='preliminary'?'Preliminary':'Complete'} · Revision ${v.revision}</small></td><td>${date(v.sentAt?.slice(0,10))}</td><td><button class="button ${v.complete?'rfq-green':'secondary'}" data-supplier-complete="${esc(v.projectId)}" data-revision="${v.revision}" ${v.complete||v.readOnly?'disabled':''}>${v.readOnly?"Saved reference":v.complete?'✓ Completed':'Completed'}</button><small class="rfq-progress" data-supplier-status="${esc(v.projectId)}">${esc(uiLabel(v.label))} · ${v.count-v.pending}/${v.count} answered</small></td></tr><tr data-supplier-detail="${esc(v.id)}" hidden><td colspan="3">${rfqLines(v,true,mid,v.projectId)}<p>${v.type==='preliminary'?'Enter price and production time in weeks.':'Confirm the dates set by Cappelen for each offered article.'} ${v.type==='preliminary'?"A comment is optional.":"A comment is required when declining."} Completed locks the response until Cappelen reopens it for revision.</p></td></tr>`).join('')}</tbody></table></div>`}</div>`);
  }
  async function persistRfq(){const ok=await saveState();if(ok===false)throw Error("The change could not be saved. Use Retry saving.");}
  function writableRfq(){if(window.CDPRemote.adapter.busy||window.CDPRemote.adapter.failure)throw Error("Wait until the changes have been saved.");}
  function safeRfqLink(url){try{const u=new URL(url);return ['http:','https:'].includes(u.protocol)?u.href:'';}catch{return '';}}
  function showRfqBom(p,key,mid,preview){
    const l=p.projectRfq.lines.find(l=>l.key===key);if(!l)return;const a=l.article;
    if(l.sample){v6Dialog('Sample – '+a.name,sampleDescription(l.sampleDetails||{})+'<button type="button" class="button secondary" '+(preview?'data-preview-return data-supplier-preview="'+esc(mid)+'"':'data-project-tab="'+(p.projectRfq.type==='preliminary'?'rfqPreliminary':'rfq')+'" data-id="'+esc(p.id)+'"')+">Back to RFQ</button>");return;}
    const links=[...(a.cadLinks||[]),...(a.labelLinks||[]),...(!a.cadLinks?.length&&a.cadUrl?[{url:a.cadUrl,name:a.cadName||'CAD'}]:[])];
    v6Dialog('BOM · '+a.name,`<p>${esc(publicReference(a.code))} · ${esc(articleSize(a))} · ${decimal(l.area)} m²</p><dl class="rfq-bom-spec">${[["Construction",'construction'],['Material','material'],["Quality",'quality'],['Pile height','pileHeight'],["Colours",'colours'],['Finish','finish'],['NOF','nof'],["Specification",'specification']].map(([label,k])=>`<dt>${esc(uiLabel(label))}</dt><dd>${esc(a[k]||'—')}</dd>`).join('')}</dl><table><thead><tr><th>Component</th><th>Quantity</th><th>Unit</th><th>Specification</th></tr></thead><tbody>${(a.bom||[]).map(b=>`<tr><td>${esc(b.name)}</td><td>${b.quantity}</td><td>${esc(b.unit)}</td><td>${esc(b.notes)}</td></tr>`).join('')}</tbody></table><p>${links.map(l=>safeRfqLink(l.url)?`<a href="${esc(safeRfqLink(l.url))}" target="_blank" rel="noopener noreferrer">${esc(l.name||"BOM file")}</a>`:'').join(' · ')}</p><button class="button secondary" ${preview?`data-preview-return data-supplier-preview="${esc(mid)}"`:`data-project-tab="${p.projectRfq.type==='preliminary'?'rfqPreliminary':'rfq'}" data-id="${esc(p.id)}"`}>Back to RFQ</button>`);
  }
  document.addEventListener('change',event=>{
    const el=event.target;
    if(el.id==='supplierPreviewSelect'){supplierSaveQueue.then(()=>showSupplierPreview(el.value));return;}
    if(!el.matches('[data-answer-price],[data-answer-decision],[data-answer-comment],[data-answer-weeks],[data-answer-schedule]'))return;
    const row=el.closest('[data-rfq-line]'),decision=$('[data-answer-decision]',row).value,price=$('[data-answer-price]',row),label=$('[data-answer-save]',row);
    price.disabled=decision!=='accepted';const weeks=$('[data-answer-weeks]',row),schedule=$('[data-answer-schedule]',row);if(weeks)weeks.disabled=decision!=='accepted';if(schedule)schedule.disabled=decision!=='accepted';
    if(decision==='accepted'&&(!price.value||Number(price.value)<=0)){label.textContent="Enter a price to save";return;}
    if(decision==='accepted'&&weeks&&!(Number(weeks.value)>0)){label.textContent="Enter production time to save";return;}
    const values={decision,price:price.value,productionWeeks:weeks?.value,scheduleConfirmed:!!schedule?.checked,comment:$('[data-answer-comment]',row).value,revision:Number(row.dataset.revision)},pid=row.dataset.p,mid=row.dataset.mid,lineKey=row.dataset.rfqLine;
    label.textContent="Saving…";
    supplierSaveQueue=supplierSaveQueue.then(async()=>{writableRfq();const p=state.projects.find(p=>p.id===pid);projectRfq().saveAnswer(state,p,mid,lineKey,values);await persistRfq();label.textContent="Saved";const r=projectRfq().recipient(p.projectRfq,mid),st=projectRfq().status(p.projectRfq,r),node=Array.from($$('[data-supplier-status]')).find(el=>el.dataset.supplierStatus===pid);if(node)node.textContent=st.label+' · '+(st.count-st.pending)+'/'+st.count+" answered";}).catch(error=>{label.textContent="Not saved";toast(error.message);});
  });
  document.addEventListener('submit',async event=>{
    const f=event.target;if(f.id!=='projectRfqConfig')return;event.preventDefault();
    try{writableRfq();const data=new FormData(f),p=state.projects.find(p=>p.id===f.dataset.p);projectRfq().configure(state,p,data.getAll('article'),data.getAll('manufacturer'),data.getAll('sample'),Object.fromEntries(Array.from($$('[data-rfq-target]',f)).map(el=>[el.dataset.rfqTarget,el.value])),data.get('rfqType'));await persistRfq();openProject(p.id,selectedRfqStage==='preliminary'?'rfqPreliminary':'rfq');}catch(error){toast(error.message);}
  });
  document.addEventListener('click',async event=>{
    const t=event.target.closest('button');if(!t)return;const d=t.dataset;
    try{
      if(d.supplierStage){await supplierSaveQueue;supplierStage=d.supplierStage;showSupplierPreview(supplierPreviewId);}
      if('supplierPreview' in d){await supplierSaveQueue;if(!('previewReturn' in d))supplierStage=selectedRfqStage;showSupplierPreview(d.supplierPreview||'');}
      if('supplierRefresh' in d){await supplierSaveQueue;showSupplierPreview(supplierPreviewId);}
      if(d.rfqToggle){const row=Array.from($$('[data-rfq-detail]')).find(r=>r.dataset.rfqDetail===d.rfqToggle);row.hidden=!row.hidden;t.setAttribute('aria-expanded',String(!row.hidden));}
      if(d.supplierToggle){const row=Array.from($$('[data-supplier-detail]')).find(r=>r.dataset.supplierDetail===d.supplierToggle);row.hidden=!row.hidden;t.setAttribute('aria-expanded',String(!row.hidden));}
      if(d.projectRfqBom){await supplierSaveQueue;showRfqBom((()=>{const p=state.projects.find(p=>p.id===d.p);return d.rfqArchive?{...p,projectRfq:projectRfq().preliminary(p)}:p;})(),d.projectRfqBom,d.mid,d.preview==='1');}
      if(d.projectRfqAdopt){writableRfq();const p=state.projects.find(p=>p.id===d.projectRfqAdopt);projectRfq().adopt(state,p);await persistRfq();openProject(p.id,p.projectRfq?.type==='preliminary'?'rfqPreliminary':'rfq');}
      if(d.projectRfqSend||d.projectRfqReopen||d.projectRfqWithdraw){writableRfq();const p=state.projects.find(p=>p.id===(d.projectRfqSend||d.projectRfqReopen||d.projectRfqWithdraw));if(d.projectRfqSend)projectRfq().publish(state,p,d.mid);if(d.projectRfqReopen)projectRfq().reopen(p,d.mid);if(d.projectRfqWithdraw)projectRfq().withdraw(p,d.mid);await persistRfq();openProject(p.id,p.projectRfq?.type==='preliminary'?'rfqPreliminary':'rfq');}
      if(d.supplierComplete){await supplierSaveQueue;writableRfq();const p=state.projects.find(p=>p.id===d.supplierComplete);const bad=Array.from($$('[data-rfq-line]')).filter(row=>row.dataset.p===p.id).some(row=>$('[data-answer-save]',row)?.textContent==="Enter a price to save"||$('[data-answer-save]',row)?.textContent==="Enter production time to save"||$('[data-answer-save]',row)?.textContent==="Not saved");if(bad)throw Error("Save all changed rows before selecting Completed.");projectRfq().complete(state,p,supplierPreviewId,Number(d.revision));await persistRfq();showSupplierPreview(supplierPreviewId);}
      if(d.projectRfqHistory){const p=state.projects.find(p=>p.id===d.projectRfqHistory),r=projectRfq().recipient(p.projectRfq,d.mid);v6Dialog("RFQ · history",`<p>RFQ · Revision ${p.projectRfq.revision}</p>${r.history.slice().reverse().map(h=>`<section class="v6-card"><strong>${esc(({published:"Published",completed:'Completed',reopened:"Reopened for revision",withdrawn:'Withdrawn','request-changed':"Specification changed",'stage-changed':"RFQ type changed – previous responses",answer:"Response changed"})[h.type]||h.type)}</strong><p>${esc(h.at)}${h.revision?' · revision '+h.revision:''}</p>${h.answers?Object.entries(h.answers).map(([key,a])=>`<p>${esc(p.projectRfq.lines.find(l=>l.key===key)?.article.name||p.projectRfq.history.flatMap(h=>h.lines).find(l=>l.key===key)?.article.name||"Article")}: ${esc(uiLabel(a.decision))} · ${a.price==null?'—':money(a.price,'EUR')} · ${a.productionWeeks!=null?a.productionWeeks+" weeks · ":''}${esc(a.comment||'')}</p>`).join(''):''}</section>`).join('')||"<p>No history yet.</p>"}`);}
      if(d.rfqLegacy){const rows=state.rfqs.filter(r=>r.projectId===d.rfqLegacy);v6Dialog("Previous RFQ responses",rows.map(r=>`<section class="v6-card"><h3>${esc(r.requestSnapshot?.article?.name)}</h3><p>${esc(state.manufacturers.find(m=>m.id===r.manufacturerId)?.name)}</p><p>${esc(uiLabel(r.decision))} · ${r.price==null?'—':money(r.price,r.currency)} ${esc(uiLabel(r.priceUnit))} · ${esc(r.comment)}</p></section>`).join(''));}
      if(d.projectRfqSelect){writableRfq();const p=state.projects.find(p=>p.id===d.projectRfqSelect),rate=p.currency==='EUR'?1:prompt("1 EUR equals how many "+p.currency+'?');if(rate===null)return;projectRfq().selectArticle(state,p,d.mid,d.article,Number(rate));await persistRfq();openProject(p.id,'rfq');toast("Production price selected for the article and its phases.");}
    }catch(error){toast(error.message);}
  });


  function modelSampleList(p,mid=''){
    const orders=(p.modelSampleOrders||[]).filter(o=>!mid||o.manufacturerId===mid&&o.sentAt);
    return `<h3>Full-size samples</h3>${!mid?"<p>Order from the manufacturer's RFQ row. Sent orders appear in the supplier portal.</p>":''}${orders.map(o=>`<section class="v6-card"><button class="text-button" data-model-open="${esc(o.id)}" data-p="${esc(p.id)}" data-supplier="${esc(mid)}">${esc(o.number)} · ${esc(o.manufacturerName)}</button><p>${esc(o.projectName)} · ${esc(uiLabel(o.status))} · ${date(o.deliveryDate)}</p><p>${o.lines.filter(l=>l.review==='Godkänd').length}/${o.lines.length} articles approved</p></section>`).join('')||"<p>No full-size sample orders.</p>"}`;
  }
  function editModelSample(p,mid,id){
    const o=id?CDPModelSamples.get(p,id):null,articles=state.articles.filter(a=>a.projectId===p.id&&p.projectRfq.articleIds.includes(a.id));
    v6Dialog(o?"Edit "+o.number:"Order full-size sample",`<form id="modelSampleForm" data-p="${esc(p.id)}" data-mid="${esc(mid)}" data-order="${esc(id||'')}"><p>Manufacturer: ${esc(state.manufacturers.find(m=>m.id===mid)?.name)}. The order is for samples in the article's actual size.</p><table><thead><tr><th>Article</th><th>Size</th><th>Quantity</th><th>Unit price EUR</th></tr></thead><tbody>${articles.map(a=>{const l=o?.lines.find(l=>l.articleId===a.id);return `<tr data-model-article="${esc(a.id)}"><td><label><input type="checkbox" name="article" value="${esc(a.id)}" ${l?'checked':''}>${esc(a.name)}</label></td><td>${esc(articleSize(a))}</td><td><input aria-label="Quantity ${esc(a.name)}" data-model-qty type="number" min="1" step="1" value="${l?.quantity||1}"></td><td><input aria-label="Styckpris ${esc(a.name)}" data-model-price type="number" min="0" step="0.01" value="${l?.price??''}"></td></tr>`;}).join('')}</tbody></table><p>The price is for one full-size sample, not the RFQ price per m². Enter 0 if free of charge.</p><label class="field"><span>Hotel delivery address</span><textarea name="deliveryAddress">${esc(o?.deliveryAddress||'')}</textarea></label>${field('contact',"Contact person and details",o?.contact||'')}${field('deliveryDate',"Requested delivery date",o?.deliveryDate||'','date')}<label class="field"><span>Instructions</span><textarea name="instructions">${esc(o?.instructions||'')}</textarea></label><button class="button primary">Save draft</button></form>`);
  }
  function openModelSample(p,id,mid=''){
    const o=CDPModelSamples.get(p,id);if(mid&&(o.manufacturerId!==mid||!o.sentAt))return;
    v6Dialog(o.number+" · Full-size sample",`<p>${esc(o.projectName)} · ${esc(o.manufacturerName)} · ${esc(uiLabel(o.status))}</p><p style="white-space:pre-line">${esc(o.deliveryAddress)}</p><p>${esc(o.contact)} · Delivery ${date(o.deliveryDate)}</p><p>${esc(o.instructions)}</p><p>Total: ${o.lines.some(l=>l.price===null)?"Price missing":money(o.lines.reduce((s,l)=>s+l.quantity*l.price,0),'EUR')}</p>${o.lines.map(l=>`<section class="v6-card"><h3>${esc(l.article.name)}</h3><p>${esc(articleSize(l.article))} · ${l.quantity} pcs · ${l.price===null?"Price missing":money(l.price,'EUR')+'/item'}</p><button class="text-button" data-model-bom="${esc(l.articleId)}" data-order="${esc(o.id)}" data-p="${esc(p.id)}" data-supplier="${esc(mid)}">BOM</button>${!mid&&o.sentAt?`<form class="model-review" data-p="${esc(p.id)}" data-order="${esc(o.id)}" data-article="${esc(l.articleId)}">${selectField('review',"Customer assessment",CDPModelSamples.reviews,l.review)}<label class="field"><span>Customer comment</span><textarea name="comment">${esc(l.comment)}</textarea></label><button class="button secondary">Save assessment</button></form>`:`<p>${esc(uiLabel(l.review))} · ${esc(l.comment)}</p>`}</section>`).join('')}<div class="rfq-actions">${!o.sentAt&&!mid?`<button class="button secondary" data-model-edit="${esc(id)}" data-p="${esc(p.id)}">Edit draft</button><button class="button primary" data-model-send="${esc(id)}" data-p="${esc(p.id)}">Send order</button><p>Makes the order available in the supplier portal and locks the specification. No email or Butler PO is sent.</p>`:''}${o.sentAt?CDPModelSamples.statuses.filter(s=>CDPModelSamples.statuses.indexOf(s)>CDPModelSamples.statuses.indexOf(o.status)&&(!mid||s==='Skickad')).map(s=>`<button class="button secondary" data-model-status="${esc(s)}" data-order="${esc(id)}" data-p="${esc(p.id)}" data-supplier="${esc(mid)}">Mark ${esc(uiLabel(s).toLowerCase())}</button>`).join(''):''}${o.sentAt&&!mid?`<button class="button secondary" data-model-new="${esc(o.manufacturerId)}" data-p="${esc(p.id)}">New full-size sample order</button>`:''}</div><details><summary>History</summary>${o.history.map(h=>`<p>${esc(h.at)} · ${esc(uiLabel(h.status))}</p>`).join('')}${o.lines.map(l=>l.reviewHistory.map(h=>`<p>${esc(l.article.name)} · ${esc(h.at)} · ${esc(uiLabel(h.review))} · ${esc(h.comment)}</p>`).join('')).join('')}</details>`);
  }
  document.addEventListener('submit',async e=>{
    const f=e.target;if(f.id!=='modelSampleForm'&&!f.matches('.model-review'))return;e.preventDefault();
    try{writableRfq();const p=state.projects.find(p=>p.id===f.dataset.p),v=Object.fromEntries(new FormData(f));let id=f.dataset.order;
    if(f.id==='modelSampleForm'){const lines=Array.from($$('[data-model-article]',f)).filter(r=>$('input[type=checkbox]',r).checked).map(r=>({articleId:r.dataset.modelArticle,quantity:$('[data-model-qty]',r).value,price:$('[data-model-price]',r).value}));id=CDPModelSamples.draft(state,p,f.dataset.mid,{...v,lines},id).id;}else CDPModelSamples.review(p,id,f.dataset.article,v.review,v.comment);
    await persistRfq();openModelSample(p,id);toast("Saved.");}catch(error){toast(error.message);}
  });
  document.addEventListener('click',async e=>{
    const t=e.target.closest('button');if(!t)return;const d=t.dataset;if(!Object.keys(d).some(k=>k.startsWith('model')))return;
    try{const p=state.projects.find(p=>p.id===d.p);if(!p)return;
    if(d.modelNew)editModelSample(p,d.modelNew);
    if(d.modelOpen)openModelSample(p,d.modelOpen,d.supplier);
    if(d.modelEdit)editModelSample(p,CDPModelSamples.get(p,d.modelEdit).manufacturerId,d.modelEdit);
    if(d.modelSend||d.modelStatus){writableRfq();t.disabled=true;const id=d.modelSend||d.order;if(d.modelSend)CDPModelSamples.send(state,p,id);else{if(d.supplier&&(d.supplier!==supplierPreviewId||CDPModelSamples.get(p,id).manufacturerId!==d.supplier||d.modelStatus!=='Skickad'))throw Error("Invalid change.");CDPModelSamples.progress(p,id,d.modelStatus);}await persistRfq();openModelSample(p,id,d.supplier);}
    if(d.modelBom){const o=CDPModelSamples.get(p,d.order);if(d.supplier&&(o.manufacturerId!==d.supplier||!o.sentAt))return;const l=o.lines.find(l=>l.articleId===d.modelBom);showRfqBom({id:p.id,projectRfq:{lines:[{key:l.articleId,article:l.article,area:l.area}]}},l.articleId,o.manufacturerId,false);const back=$('[data-project-tab="rfq"]',$('#modal'));if(back){back.removeAttribute('data-project-tab');back.removeAttribute('data-id');back.dataset.modelOpen=o.id;back.dataset.p=p.id;back.dataset.supplier=d.supplier||'';back.textContent="Back to order";}}
    }catch(error){t.disabled=false;toast(error.message);}
  });

  document.addEventListener('click',async event=>{
    const button=event.target.closest('[data-delete-project],[data-confirm-project-delete]');if(!button)return;
    try{
      const id=button.dataset.deleteProject||button.dataset.confirmProjectDelete,p=state.projects.find(p=>p.id===id);if(!p)throw Error("The project is missing.");
      if(button.dataset.deleteProject){
        v6Dialog("Delete projects",`<p>Delete <strong>${esc(p.name)}</strong> for ${esc(p.customer||"customer not specified")}?</p><p>This removes the project's ${state.articles.filter(a=>a.projectId===id).length} articles, ${(p.phases||[]).length} phases and their RFQs, samples, full-size sample orders, quotations and order/delivery tracking from Projects and the supplier portal.</p><p>Customer and manufacturer details are retained. Deletion cannot be undone in the app; the data is archived in the database.</p><div class="modal-footer"><button type="button" class="button secondary" data-close>Cancel</button><button type="button" class="button danger" data-confirm-project-delete="${esc(id)}">Yes, delete projektet</button></div>`);return;
      }
      writableRfq();button.disabled=true;CDPStructure.deleteProject(state,id);await persistRfq();closeModal();renderAll();showView('projects');toast("The project has been deleted.");
    }catch(error){button.disabled=false;toast(error.message);}
  });
  function renderCustomers(){
    const root=$('#customerRegister');if(!root)return;
    root.innerHTML=`<div class="section-action"><input id="customerSearch" aria-label="Search company or contact" placeholder="Search company or contact"><button class="button primary" data-customer-new>New company</button></div><div class="table-scroll"><table><thead><tr><th>Company</th><th>Roles</th><th>Primary contact</th><th>Email</th><th>City</th><th>Owner</th><th>Status</th></tr></thead><tbody>${(state.customers||[]).map(c=>{const contact=c.contacts?.find(x=>x.primary&&x.active!==false)||c.contacts?.find(x=>x.active!==false);return `<tr tabindex="0" data-customer-row="${esc(c.id)}" data-customer-search="${esc([c.name,...(c.contacts||[]).map(x=>x.name+' '+x.email)].join(' ').toLowerCase())}"><td><button class="text-button" data-customer-edit="${esc(c.id)}">${esc(c.name)}</button></td><td>${esc((c.roles||['Kund']).map(uiLabel).join(', '))}</td><td>${esc(contact?.name||'—')}</td><td>${esc(contact?.email||c.invoiceEmail||'—')}</td><td>${esc(c.billing?.city||'')}</td><td>${esc(window.CDPUserLabels?.initials(c.owner)||c.owner||'')}</td><td>${c.active===false?'Inactive':'Active'}</td></tr>`;}).join('')||"<tr><td colspan=\"7\">No companies yet.</td></tr>"}</tbody></table></div>`;
  }
  document.addEventListener('click',e=>{const row=e.target.closest('[data-customer-row]');if(row&&!e.target.closest('button'))editCustomer(row.dataset.customerRow);});
  document.addEventListener('keydown',e=>{if(e.target.matches('[data-customer-row]')&&['Enter',' '].includes(e.key)){e.preventDefault();editCustomer(e.target.dataset.customerRow);}});
  function customerContactRow(c={}){return `<section class="v6-card" data-contact-id="${esc(c.id||'')}"><div class="form-grid">${field('contactName',"Name",c.name||'','text','required')}${field('contactTitle',"Title / role",c.title||'')}${field('contactEmail',"Email",c.email||'','email')}${field('contactPhone',"Phone",c.phone||'')}${field('contactNotes',"Notes",c.notes||'')}</div><label><input name="contactPrimary" type="checkbox" ${c.primary?'checked':''}> Primary contact</label> <label><input name="contactActive" type="checkbox" ${c.active!==false?'checked':''}> Active</label>${!c.id?"<button type=\"button\" class=\"text-button\" data-customer-contact-remove>Delete contact</button>":''}</section>`;}
  function editCustomer(id){const c=state.customers?.find(c=>c.id===id)||{},b=c.billing||{};const projects=state.projects.filter(p=>p._customerId===(c._dbId||c.id)||Object.values(p.parties||{}).some(x=>x.companyId===c.id));
    v6Dialog(c.id?c.name:"New company",`<form id="customerRegisterForm" data-id="${esc(c.id||'')}"><div class="form-grid">${field('name',"Company name",c.name||'','text','required')}${field('orgNumber',"Company registration number",c.orgNumber||'')}${field('vatNumber',"VAT number",b.vatNumber||'')}${field('country',"Country",b.country||'')}${field('address',"Billing address",b.address||'')}${field('zip',"Postal code",b.zip||'')}${field('city',"City",b.city||'')}${field('invoiceEmail',"Billing email",c.invoiceEmail||'','email')}${field('invoiceRequirements',"Invoice requirements / reference",c.invoiceRequirements||'')}${field('paymentTerms',"Default payment terms",c.paymentTerms||'')}${field('web',"Website",c.web||'')}${field('owner',"Our contact",c.owner||'')}</div><p>Roles</p>${CDPCustomers.roles.map(r=>`<label class="v6-check"><input name="roles" type="checkbox" value="${esc(r)}" ${(c.roles||['Kund']).includes(r)?'checked':''}>${esc(uiLabel(r))}</label>`).join('')}<label class="field"><span>Notes</span><textarea name="notes">${esc(c.notes||'')}</textarea></label><label><input name="active" type="checkbox" ${c.active!==false?'checked':''}> Active company</label><h3>Contacts</h3><div id="customerContactRows">${(c.contacts||[]).map(customerContactRow).join('')}</div><button type="button" class="button secondary" data-customer-contact-add>Add contact</button><div class="modal-footer"><button type="button" class="button secondary" data-close>Cancel</button><button class="button primary">Save company</button></div></form><h3>Linked projects</h3>${projects.map(p=>`<button class="text-button" data-project-id="${esc(p.id)}">${esc(p.name)}</button>`).join(' · ')||"<p>No linked projects.</p>"}`);
  }
  function customerCompanyOptions(value){return "<option value=\"\">Select company</option>"+state.customers.filter(c=>c.active!==false||c.id===value).map(c=>`<option value="${esc(c.id)}" ${c.id===value?'selected':''}>${esc(c.name)}${c.active===false?" (inactive)":''}</option>`).join('');}
  function customerContactOptions(id,selected){return "<option value=\"\">No contact selected</option>"+(state.customers.find(c=>c.id===id)?.contacts||[]).filter(c=>c.active!==false||c.id===selected).map(c=>`<option value="${esc(c.id)}" ${c.id===selected?'selected':''}>${esc(c.name)}${c.active===false?" (inactive)":''}</option>`).join('');}
  function editProjectParties(id){const p=state.projects.find(p=>p.id===id);if(!p)return;
    v6Dialog("Companies and contacts – "+p.name,`<form id="projectPartiesForm" data-p="${esc(id)}">${[['customer',"Customer / billing recipient"],['buyer','Beställare'],['architect',"Architect / interior designer"],['endCustomer',"Hotel / end customer"]].map(([key,label])=>{const value=p.parties?.[key]?.companyId||(key==='customer'?state.customers.find(c=>c._dbId===p._customerId)?.id:'')||'',contact=p.parties?.[key]?.contactId||'';return `<div class="form-grid"><label class="field"><span>${esc(uiLabel(label))}</span><select name="${key}" data-party-company="${key}">${customerCompanyOptions(value)}</select></label><label class="field"><span>Contact person</span><select name="${key}Contact">${customerContactOptions(value,contact)}</select></label></div>`;}).join('')}${field('customerProjectReference',"Customer project reference",p.customerProjectReference||'')}<label class="v6-check"><input name="refreshCustomer" type="checkbox">Load current billing details and payment terms from the customer register</label><p>Details load automatically when changing the customer. The project's delivery address is retained and can be edited under Customer & address details. Saved quotations keep their original details.</p><button class="button primary">Save links</button></form>`);
  }
  document.addEventListener('input',e=>{if(e.target.id==='customerSearch')for(const row of $$('[data-customer-search]'))row.hidden=!row.dataset.customerSearch.includes(e.target.value.trim().toLowerCase());});
  document.addEventListener('change',e=>{const key=e.target.dataset.partyCompany;if(!key)return;const f=e.target.form,c=state.customers.find(c=>c.id===e.target.value),primary=c?.contacts?.find(c=>c.primary&&c.active!==false);f.elements[key+'Contact'].innerHTML=customerContactOptions(e.target.value,primary?.id||'');});
  document.addEventListener('click',e=>{const t=e.target.closest('button');if(!t)return;const d=t.dataset;if('customerContactRemove' in d)t.closest('[data-contact-id]').remove();if('customerNew' in d)editCustomer();if(d.customerEdit)editCustomer(d.customerEdit);if('customerContactAdd' in d)$('#customerContactRows').insertAdjacentHTML('beforeend',customerContactRow());if(d.projectParties)editProjectParties(d.projectParties);});
  document.addEventListener('submit',async e=>{
    const f=e.target;if(!['customerRegisterForm','projectPartiesForm'].includes(f.id))return;e.preventDefault();
    try{writableRfq();const fd=new FormData(f),v=Object.fromEntries(fd);
      if(f.id==='customerRegisterForm'){const contacts=Array.from($$('[data-contact-id]',f)).map(row=>{const value=n=>$('[name="'+n+'"]',row);return {id:row.dataset.contactId,name:value('contactName').value,title:value('contactTitle').value,email:value('contactEmail').value,phone:value('contactPhone').value,notes:value('contactNotes').value,primary:value('contactPrimary').checked,active:value('contactActive').checked};});const c=CDPCustomers.save(state,f.dataset.id,{...v,roles:fd.getAll('roles'),active:fd.has('active'),contacts,billing:Object.fromEntries(['address','zip','city','country','vatNumber'].map(k=>[k,v[k]]))});await persistRfq();renderAll();editCustomer(c.id);toast("The company has been saved.");}
      else{const p=state.projects.find(p=>p.id===f.dataset.p);CDPCustomers.link(state,p,{...v,refreshCustomer:fd.has('refreshCustomer')});await persistRfq();renderAll();openProject(p.id,'customer');toast("Project links have been saved.");}
    }catch(error){toast(error.message);}
  });

  function editProductionPrice(id){const a=state.articles.find(a=>a.id===id),p=state.projects.find(p=>p.id===a?.projectId);if(!a||!p)return;const current=a.selectedPrice||a,manual=a.manualProductionPrice;
    v6Dialog("Production price – "+a.name,`<form id="productionPriceForm" data-id="${esc(id)}"><p>Agreed price for all article phases. Saving uses this price in the costing instead of a previously selected RFQ price. Saved quotations are not changed.</p><div class="form-grid">${field('price',"Production price EUR/m²",current.priceUnit==='per m²'?(current.price??current.pricePerSqm??''):'','number','min="0" step="0.01" required')}${p.currency!=='EUR'?field('fxRate',"1 EUR = quantity "+p.currency,current.fxRate||'','number','min="0.000001" step="any" required'):''}<label class="field"><span>Manufacturer (optional)</span><select name="manufacturerId"><option value="">Not specified</option>${state.manufacturers.map(m=>`<option value="${esc(m.id)}" ${m.id===(a.selectedPrice?.manufacturerId||manual?.manufacturerId)?'selected':''}>${esc(m.name)}</option>`).join('')}</select></label></div><label class="field"><span>Agreement notes</span><textarea name="comment">${esc(manual?.comment||'')}</textarea></label><div class="modal-footer"><button type="button" class="button secondary" data-close>Cancel</button><button class="button primary">Save production price</button></div></form><details><summary>Price history</summary>${(a.productionPriceHistory||[]).slice().reverse().map(h=>`<p>${esc(h.at)} · ${money(h.price,'EUR')}/m² · ${esc(h.manufacturer||'')} · ${esc(h.comment||'')}<br>Previous: ${h.previous?.price==null?'—':money(h.previous.price,h.previous.currency||'EUR')} ${esc(uiLabel(h.previous?.priceUnit||''))}</p>`).join('')||"<p>No manual price changes yet.</p>"}</details>`);
  }
  document.addEventListener('click',e=>{const button=e.target.closest('[data-production-price]');if(button)editProductionPrice(button.dataset.productionPrice);});
  document.addEventListener('submit',async e=>{const f=e.target;if(f.id!=='productionPriceForm')return;e.preventDefault();try{writableRfq();CDPStructure.setProductionPrice(state,f.dataset.id,Object.fromEntries(new FormData(f)));await persistRfq();renderAll();closeModal(true);filterProjectArticles();toast("The production price has been saved.");}catch(error){toast(error.message);}});

  function sampleDescription(sample){
    return `<dl class="rfq-bom-spec"><dt>Sample type</dt><dd>${esc(sample.type||'—')}</dd><dt>Sample size</dt><dd>${esc(sample.size||'—')}</dd><dt>Requested date</dt><dd>${date(sample.requestedDate)}</dd><dt>Description / instructions</dt><dd>${esc(sample.instructions||'—')}</dd><dt>Delivery address</dt><dd>${esc(sample.deliveryAddress||"The address is missing from company details.")}</dd></dl>`;
  }
  function openArticleSample(id){
    const a=state.articles.find(a=>a.id===id);if(!a)return;const sample=CDPStructure.articleSample(state,a);
    v6Dialog('Sample – '+a.name,`<form id="articleSampleForm" data-id="${esc(id)}"><p>Describe the article sample. A quality sample is always included when the article is included in an RFQ.</p><div class="form-grid">${field('type','Sample type',sample.type)}${field('size','Sample size',sample.size)}${field('requestedDate','Requested date',sample.requestedDate,'date')}</div><label class="field"><span>Description / instructions</span><textarea name="instructions" rows="4">${esc(sample.instructions)}</textarea></label><label class="field"><span>Delivery address – from our company details</span><textarea name="deliveryAddress" rows="4" readonly>${esc(sample.deliveryAddress)}</textarea></label>${!state.company?.address?"<p>Enter our address under Settings → Company details.</p>":''}<div class="modal-footer"><button type="button" class="button secondary" data-close>Cancel</button><button class="button primary">Save sample</button></div></form>`);
  }
  function confirmDeleteArticle(id){
    const a=state.articles.find(a=>a.id===id);if(!a)return;
    v6Dialog("Delete article",`<p>Delete <strong>${esc(a.name)}</strong> ? Links from quality samples will be removed, but samples will be retained</p><p>The article will be removed from the article database, project phases and current RFQ. Previous quotation versions and history are retained.</p><div class="modal-footer"><button type="button" class="button secondary" data-close>Cancel</button><button type="button" class="button danger" data-confirm-article-delete="${esc(id)}">Delete article</button></div>`);
  }
  document.addEventListener('click',async event=>{
    const button=event.target.closest('button');if(!button)return;const d=button.dataset;
    try{
      if(d.articleSample)openArticleSample(d.articleSample);
      if(d.articleDelete)confirmDeleteArticle(d.articleDelete);
      if(d.confirmArticleDelete){writableRfq();const pid=state.articles.find(a=>a.id===d.confirmArticleDelete)?.projectId,fromProject=modalHistory.some(h=>h.key==='project:'+pid+':articleList');CDPStructure.deleteArticle(state,d.confirmArticleDelete);await persistRfq();closeModal();renderAll();if(fromProject)openProject(pid,'articleList');else showView('articles');toast("The article has been deleted.");}
    }catch(error){toast(error.message);}
  });
  document.addEventListener('submit',async event=>{
    const form=event.target;if(form.id!=='articleSampleForm')return;event.preventDefault();
    try{writableRfq();CDPStructure.saveArticleSample(state,form.dataset.id,Object.fromEntries(new FormData(form)));await persistRfq();renderAll();closeModal(true);toast("The sample description has been saved.");}catch(error){toast(error.message);}
  });

  window.CDPApp.ready=true;

  function qualitySampleRows(p,term='',status='all'){
    if(status!=='all'||p.projectType==='simple')return '';return CDPStructure.qualitySamples(state,p).filter(s=>[CDPStructure.qualitySampleName(state,s),s.size].join(' ').toLowerCase().includes(term)).map(s=>`<tr><td>${esc(s.productId?(p.products||[]).find(x=>x.id===s.productId)?.name||'—':'—')}</td><td>Sample – ${esc(CDPStructure.qualitySampleName(state,s))}<small class="rfq-progress">${esc(s.size)} · ${s.articleIds.map(id=>esc(state.articles.find(a=>a.id===id)?.name||"Deleted article")).join(', ')}</small></td><td>—</td><td>0 EUR</td><td>—</td><td><button class="button secondary" data-quality-edit="${esc(s.id)}" data-p="${esc(p.id)}">Open Sample</button><button class="button secondary" data-quality-add-related="${esc(p.id)}" data-article="${esc(s.articleIds[0]||'')}">New sample</button><button class="text-button" data-quality-delete="${esc(s.id)}" data-p="${esc(p.id)}">Delete</button></td></tr>`).join('');
  }
  function updateQualitySampleName(){const f=$('#qualitySampleForm');if(!f)return;const p=state.projects.find(p=>p.id===f.dataset.p),product=p.products.find(x=>x.id===f.elements.productId.value);$('[data-quality-auto-name]',f).textContent=product?'Sample – '+product.name+' · Covers all articles linked to this product.':'Existing article links are retained.';}
  document.addEventListener('change',e=>{if(e.target.matches('#qualitySampleForm [name=productId]'))updateQualitySampleName();});
  function openQualitySample(pid,id='',articleId=''){
    CDPStructure.products.sync(state);const p=state.projects.find(p=>p.id===pid),sample=CDPStructure.qualitySamples(state,p).find(s=>s.id===id)||{},productId=sample.productId||(!id?state.articles.find(a=>a.id===articleId)?.productId:'');
    v6Dialog(id?'Edit quality sample':'New sample',`<form id="qualitySampleForm" data-p="${esc(pid)}" data-id="${esc(id)}"><label class="field"><span>Product</span><select name="productId" ${id&&!sample.productId?'':'required'}><option value="">${id&&!sample.productId?'Keep existing article links':'Select product'}</option>${(p.products||[]).map(product=>`<option value="${esc(product.id)}" ${product.id===productId?'selected':''}>${esc(product.name)}</option>`).join('')}</select></label>${id&&!sample.productId?sample.articleIds.map(a=>`<input type="hidden" name="article" value="${esc(a)}">`).join(''):''}<p data-quality-auto-name aria-live="polite"></p><p>Quality sample · 0 EUR · no BOM. Quantity will be set later on the Purchase Order.</p>${field('size','Size',sample.size||'','text','required')}<label class="field"><span>Description / requirements</span><textarea name="instructions">${esc(sample.instructions||'')}</textarea></label><h3>Delivery address</h3><p class="preserve-lines">${esc(CDPStructure.sampleAddress(state)||'The address is missing from company details.')}</p><button class="button primary">Save sample</button></form>`);updateQualitySampleName();
  }
  document.addEventListener('click',async e=>{
    const t=e.target.closest('button');if(!t)return;const d=t.dataset;
    try{
      if(d.qualityAddRelated)openQualitySample(d.qualityAddRelated,'',d.article||'');
      if(d.qualityNew)openQualitySample(d.qualityNew,'',d.article||'');
      if(d.qualityEdit)openQualitySample(d.p,d.qualityEdit);
      if(d.qualityForArticle){const a=state.articles.find(a=>a.id===d.qualityForArticle),p=state.projects.find(p=>p.id===a.projectId),sample=CDPStructure.qualitySamples(state,p).find(s=>s.articleIds.includes(a.id));openQualitySample(p.id,sample?.id||'',a.id);}
      if(d.qualityDelete){if(!confirm("Delete this quality sample? RFQs containing it will receive a new revision."))return;writableRfq();const p=state.projects.find(p=>p.id===d.p);p.qualitySamples=CDPStructure.qualitySamples(state,p).filter(s=>s.id!==d.qualityDelete);if(p.projectRfq)p.projectRfq.sampleIds=p.projectRfq.sampleIds.filter(id=>id!==d.qualityDelete);await persistRfq();openProject(p.id,'articleList');}
      if(d.articleTarget){const a=state.articles.find(a=>a.id===d.articleTarget);v6Dialog("Target price · "+a.name,`<form id="articleTargetForm" data-id="${esc(a.id)}"><p>Copied to new RFQs. Existing RFQs and production prices are not affected.</p>${field('price','Target EUR/m²',a.targetPrice??'','number','min="0.01" step="0.01"')}<button class="button primary">Save target price</button></form>`);}
    }catch(error){toast(error.message);}
  });
  document.addEventListener('submit',async e=>{
    const f=e.target;if(!['qualitySampleForm','articleTargetForm'].includes(f.id))return;e.preventDefault();
    try{writableRfq();const fd=new FormData(f),v=Object.fromEntries(fd);
      if(f.id==='articleTargetForm'){CDPStructure.setTargetPrice(state,f.dataset.id,v.price);await persistRfq();renderAll();closeModal(true);filterProjectArticles();}
      else{const p=state.projects.find(p=>p.id===f.dataset.p);CDPStructure.saveQualitySample(state,p,f.dataset.id,{...v,articleIds:fd.getAll('article')});await persistRfq();renderAll();closeModal(true);filterProjectArticles();}
    }catch(error){toast(error.message);}
  });

  let articleInlineQueue=Promise.resolve();
  document.addEventListener('keydown',e=>{if(!e.target.matches('[data-article-inline],[data-phase-quantity]'))return;if(e.key==='Enter'){e.preventDefault();e.target.blur();}if(e.key==='Escape'){e.target.value=e.target.dataset.saved;e.target.blur();}});
  document.addEventListener('change',e=>{
    const input=e.target;if(input.matches('[data-article-fx]')){const price=input.closest('tr').querySelector('[data-article-inline=production]');if(price.value!==''){price.dataset.saved='';price.dispatchEvent(new Event('change',{bubbles:true}));}return;}if(!input.matches('[data-article-inline],[data-phase-quantity]'))return;
    const value=input.value;if(value===input.dataset.saved)return;
    const label=input.nextElementSibling;if(!input.checkValidity()){label.textContent="Check the value";input.reportValidity();return;}
    const rate=input.closest('tr').querySelector('[data-article-fx]')?.value;
    label.textContent="Saving…";
    articleInlineQueue=articleInlineQueue.then(async()=>{
      writableRfq();const a=state.articles.find(a=>a.id===input.dataset.id);
      if(input.dataset.phaseQuantity){const p=state.projects.find(p=>p.id===input.dataset.p),item=p.phases.find(ph=>ph.id===input.dataset.phaseQuantity)?.items.find(i=>i.articleId===input.dataset.article),n=Number(value);if(!item)throw Error("The phase row is missing.");if(!Number.isSafeInteger(n)||n<1)throw Error("Quantity must be a positive integer.");item.quantity=n;}

      else if(input.dataset.articleInline==='target')CDPStructure.setTargetPrice(state,a.id,value);
      else if(input.dataset.articleInline==='quantity'){const n=Number(value);if(!Number.isSafeInteger(n)||n<1)throw Error("Quantity must be an integer greater than 0.");a.quantity=n;}
      else{const current=a.selectedPrice||a,manual=a.manualProductionPrice;CDPStructure.setProductionPrice(state,a.id,{price:value,fxRate:rate,manufacturerId:current.manufacturerId||manual?.manufacturerId||'',comment:manual?.comment||''});}
      await persistRfq();input.dataset.saved=value;label.textContent="Saved";
    }).catch(error=>{label.textContent="Not saved: "+error.message;toast(error.message);});
  });

  let userDirectoryRequest=0;
  function userDirectoryDate(value){const d=new Date(value);return value&&Number.isFinite(d.getTime())?new Intl.DateTimeFormat("en-GB",{dateStyle:'medium',timeStyle:'short',timeZone:'Europe/Stockholm'}).format(d):'—';}
  async function openUserAdmin(){
    $('#accountSettings').open=false;
    const request=++userDirectoryRequest;
    v6Dialog('User admin',`<section id="userAdminPanel"><div class="section-action"><div><p>Supabase user accounts</p><p>Edit initials used for signed-in users and project owners. New accounts receive suggested initials automatically.</p></div><button class="button secondary" data-user-admin-refresh>Update</button></div><div data-user-admin-results aria-live="polite" aria-busy="true"><p>Loading users from Supabase…</p></div><details class="user-admin-proposals"><summary>Proposed features – next steps</summary><p>Proposed actions. These buttons are not enabled yet.</p><div class="rfq-actions">${["Invite user","Edit name and role","Reset password","Deactivate / reactivate"].map(label=>`<button type="button" class="button secondary" disabled>${esc(uiLabel(label))}</button>`).join('')}</div></details></section>`);
    const panel=$('#userAdminPanel'),results=$('[data-user-admin-results]',panel),refresh=$('[data-user-admin-refresh]',panel);refresh.disabled=true;
    try{
      const users=await window.CDPReadUserDirectory();
      if(request!==userDirectoryRequest||!panel.isConnected)return;
      results.innerHTML=`<div class="toolbar"><input data-user-admin-search type="search" aria-label="Search users" placeholder="Search name or email…"><span>${users.length} users</span></div><div class="table-scroll"><table class="user-admin-table"><thead><tr><th>Name</th><th>Initials</th><th>Email</th><th>Role</th><th>Account status</th><th>Created</th><th>Last sign-in</th></tr></thead><tbody>${users.map(u=>`<tr data-user-search="${esc([u.name,u.email,u.role,u.initials].join(' ').toLocaleLowerCase('en'))}"><td>${esc(u.name||'—')}</td><td><form data-user-initials-form="${esc(u.user_id)}" class="user-initials-editor"><input name="initials" aria-label="Initials for ${esc(u.name||u.email)}" value="${esc(u.initials)}" maxlength="6" required autocomplete="off" ${u.can_edit_initials?'':'disabled'}><button class="button secondary" ${u.can_edit_initials?'':'disabled'}>Save</button><span data-initials-status role="status" aria-live="polite"></span></form></td><td>${esc(u.email||'—')}</td><td>${esc(uiLabel(u.role))}</td><td>${esc(uiLabel(u.account_status))}</td><td>${esc(userDirectoryDate(u.created_at))}</td><td>${esc(userDirectoryDate(u.last_sign_in_at))}</td></tr>`).join('')}</tbody></table></div><p data-user-admin-empty ${users.length?'hidden':''}>No users to display.</p><p class="detail-sub">Roles come from server-managed role data. Account status refers to the Supabase sign-in. Times are shown in Sweden's time zone.</p>`;
      if(!window.CDPUserInitialsConfigured)results.insertAdjacentHTML('beforeend','<p>Initials editing requires the supplied database update (007_user_initials.sql).</p>');
      else if(users.length&&!users.some(u=>u.can_edit_initials))results.insertAdjacentHTML('beforeend','<p>Your access is read-only. An administrator can edit initials.</p>');
      for(const form of $$('[data-user-initials-form]',results))form.addEventListener('submit',async event=>{
        event.preventDefault();event.stopPropagation();const user=users.find(u=>u.user_id===form.dataset.userInitialsForm);if(!user?.can_edit_initials)return;
        const input=form.elements.initials,button=$('button',form),status=$('[data-initials-status]',form);if(button.disabled)return;
        const value=input.value;input.disabled=true;button.disabled=true;refresh.disabled=true;status.textContent='Saving…';
        try{const saved=await window.CDPSaveUserInitials(user,value,user.initials);user.initials=saved;input.value=saved;status.textContent='Saved';form.closest('tr').dataset.userSearch=[user.name,user.email,user.role,saved].join(' ').toLocaleLowerCase('en');renderAll();}
        catch(error){status.textContent=error.code==='42501'?'Administrator access is required to edit initials.':error.code==='40001'?'Initials changed elsewhere. Refresh the list before saving.':error.message||'Could not save initials. Try again.';}
        finally{input.disabled=false;button.disabled=false;refresh.disabled=false;}
      });
    }catch(error){
      if(request!==userDirectoryRequest||!panel.isConnected)return;
      const code=String(error.code||''),message=String(error.message||'');
      const text=code==='42501'||/administrator access|permission denied/i.test(message)?"You do not have permission to view the user directory. Check your administrator role in Supabase following the installation instructions.":code==='PGRST202'||code==='42883'||/could not find.*function|does not exist/i.test(message)?"The user directory is not enabled in Supabase yet. Run the included 006_user_admin_readonly.sql following the installation instructions.":"Could not load users from Supabase. Check your connection and try again.";
      results.innerHTML=`<p role="alert">${esc(text)}</p>`;
    }finally{if(panel.isConnected){results.setAttribute('aria-busy','false');refresh.disabled=false;}}
  }
  document.addEventListener('click',e=>{if(e.target.closest('[data-user-admin],[data-user-admin-refresh]'))openUserAdmin();const menu=$('#accountSettings');if(menu?.open&&!menu.contains(e.target))menu.open=false;});
  document.addEventListener('keydown',e=>{const menu=$('#accountSettings');if(e.key==='Escape'&&menu?.open){menu.open=false;menu.querySelector('summary').focus();}});
  document.addEventListener('input',e=>{if(!e.target.matches('[data-user-admin-search]'))return;const panel=e.target.closest('#userAdminPanel'),term=e.target.value.trim().toLocaleLowerCase('en');let visible=0;for(const row of $$('[data-user-search]',panel)){row.hidden=!row.dataset.userSearch.includes(term);if(!row.hidden)visible++;}$('[data-user-admin-empty]',panel).hidden=visible>0;});
})();

