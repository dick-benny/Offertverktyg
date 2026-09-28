(() => {
  "use strict";

  const seed = {
    leads: [
      { id: "L-26-0004", name: "Harbour Offices Copenhagen", expectedStart: "2026-11", comments: "Introducerades av Studio Nord och har nu blivit en konkret förfrågan.", status: "Konverterat", createdAt: "2026-05-12", createdBy: "DE", convertedAt: "2026-08-26", inquiryId: "I-26-0151" },
      { id: "L-26-0003", name: "New Harbour Hotel Malmö", expectedStart: "2028-09", comments: "Tips från arkitekt. Cirka 150 rum och större gemensamma ytor.", status: "Aktivt", createdAt: "2026-09-04", createdBy: "DE" },
      { id: "L-26-0002", name: "Oslo Airport Expansion", expectedStart: "2029-01", comments: "Möjlig ny lounge och hotellutbyggnad. Följ upp efter årsskiftet 2027/2028.", status: "Aktivt", createdAt: "2026-09-02", createdBy: "DE" },
      { id: "L-26-0001", name: "Members Club London", expectedStart: "2027-05", comments: "Tidig information från designer. Beslut om fastighet väntas under hösten.", status: "Aktivt", createdAt: "2026-08-18", createdBy: "JE" }
    ],
    inquiries: [
      { id: "I-26-0154", project: "Grand Hôtel – Lobby Rugs", customer: "Grand Hôtel Stockholm", country: "Sverige", source: "Direkt", agent: "—", value: 128000, currency: "EUR", probability: 60, status: "Bedöms", received: "2026-08-31", decision: "2026-09-18", type: "High End", area: 185, description: "Specialdesignade mattor till lobby, lounge och reception." },
      { id: "I-26-0153", project: "Fjord Hotel Oslo", customer: "Nordic Hospitality Group", country: "Norge", source: "Agent", agent: "Daretodeco AS", value: 94000, currency: "EUR", probability: 40, status: "Ny", received: "2026-08-30", decision: "2026-10-02", type: "Standard", area: 120, description: "Mattor till 42 rum och gemensamma ytor. Tidig budgetfas." },
      { id: "I-26-0152", project: "Maison Verne", customer: "Atelier Verne", country: "Frankrike", source: "Arkitekt", agent: "—", value: 68000, currency: "EUR", probability: 30, status: "Ny", received: "2026-08-28", decision: "2026-09-25", type: "High End", area: 76, description: "Fyra custom rugs för privat medlemsklubb i Paris." },
      { id: "I-26-0151", projectId: "P-26-0047", project: "Harbour Offices", customer: "Harbour Properties", country: "Danmark", source: "Agent", agent: "Studio Nord ApS", value: 52000, currency: "EUR", probability: 70, status: "Go", received: "2026-08-26", decision: "2026-09-12", type: "Kontor", area: 98, description: "Reception, board room och executive offices." },
      { id: "I-26-0150", project: "Restaurant Alma", customer: "Alma Group", country: "Sverige", source: "Designer", agent: "—", value: 18000, currency: "EUR", probability: 10, status: "No Go", received: "2026-08-22", decision: "2026-08-29", type: "Standard", area: 24, description: "Tidsplanen kunde inte mötas." }
    ],
    projects: [
      { id: "P-26-0047", sourceInquiryId: "I-26-0151", name: "Harbour Offices", customer: "Harbour Properties", phase: "Kalkyl", value: 52000, currency: "EUR", probability: 70, owner: "JE", next: "Behovsgenomgång 4 sep" },
      { id: "P-26-0046", name: "Villa Copenhagen Suites", customer: "BC Hospitality", phase: "Kalkyl", value: 87000, currency: "EUR", probability: 65, owner: "DE", next: "Kalkyl klar 7 sep" },
      { id: "P-26-0045", name: "Scandic Helsinki Hub", customer: "Scandic Hotels", phase: "Offert skickad", value: 112000, currency: "EUR", probability: 55, owner: "JE", next: "Följ upp 3 sep" },
      { id: "P-26-0044", name: "The North House", customer: "North House Group", phase: "Förhandling", value: 164000, currency: "EUR", probability: 80, owner: "DE", next: "Revision V4 2 sep" },
      { id: "P-26-0043", name: "Kunsthalle Berlin", customer: "Kulturraum GmbH", phase: "Offert skickad", value: 73000, currency: "EUR", probability: 45, owner: "JE", next: "Beslut 21 sep" },
      { id: "P-26-0042", name: "Asteria Restaurant", customer: "Asteria AB", phase: "Kalkyl", value: 31000, currency: "EUR", probability: 60, owner: "DE", next: "Inväntar frakt" },
      { id: "P-26-0041", name: "Hotel Aurora Oslo", customer: "Aurora Hospitality AS", phase: "Vunnet", businessStatus: "Vunnet", value: 98000, currency: "EUR", probability: 100, owner: "DE", agent: "Daretodeco AS", next: "Inväntar orderunderlag", acceptedAt: "2026-08-20", acceptedQuoteId: "Q-26-0041", acceptedQuoteVersion: 2, acceptedBy: "Mette Larsen", acceptanceMethod: "Inköpsorder", poNumber: "PO-8841", deliveryDate: "2027-01-18", deliveryStatus: "Väntar orderunderlag" }
    ],
    articles: [
      { id: "ART-0001", projectId: "P-26-0044", code: "P-26-0044-A01", name: "Lobby Rug", location: "Main lobby", shape: "Rektangulär", widthCm: 420, lengthCm: 650, manualArea: 0, manufacturer: "Anisa Carpets", currency: "EUR", pricePerSqm: 285, additionalCost: 0, status: "Pris godkänt", priceHistory: [
        { id: "PRICE-0001", date: "2026-08-08", manufacturer: "Anisa Carpets", pricePerSqm: 310, currency: "EUR", validUntil: "2026-09-30", status: "Första pris" },
        { id: "PRICE-0002", date: "2026-08-12", manufacturer: "Anisa Carpets", pricePerSqm: 285, currency: "EUR", validUntil: "2026-10-15", status: "Godkänt" }
      ]},
      { id: "ART-0002", projectId: "P-26-0044", code: "P-26-0044-A02", name: "Lounge Rug", location: "Members lounge", shape: "Rektangulär", widthCm: 300, lengthCm: 400, manualArea: 0, manufacturer: "Anisa Carpets", currency: "EUR", pricePerSqm: 295, additionalCost: 180, status: "Pris godkänt", priceHistory: [
        { id: "PRICE-0003", date: "2026-08-14", manufacturer: "Anisa Carpets", pricePerSqm: 295, currency: "EUR", validUntil: "2026-10-15", status: "Godkänt" }
      ]},
      { id: "ART-0003", projectId: "P-26-0045", code: "P-26-0045-A01", name: "Suite Rug Type A", location: "Guest suites · 24 pcs", shape: "Rektangulär", widthCm: 240, lengthCm: 340, manualArea: 0, manufacturer: "Bhadohi Workshop", currency: "EUR", pricePerSqm: 245, additionalCost: 0, status: "Förhandling", priceHistory: [
        { id: "PRICE-0004", date: "2026-08-22", manufacturer: "Bhadohi Workshop", pricePerSqm: 265, currency: "EUR", validUntil: "2026-09-20", status: "Första pris" },
        { id: "PRICE-0005", date: "2026-08-27", manufacturer: "Bhadohi Workshop", pricePerSqm: 245, currency: "EUR", validUntil: "2026-09-20", status: "Förhandlat" }
      ]},
      { id: "ART-0004", projectId: "P-26-0046", code: "P-26-0046-A01", name: "Suite Round Rug", location: "Executive suites", shape: "Rund", widthCm: 320, lengthCm: 320, manualArea: 0, manufacturer: "—", currency: "EUR", pricePerSqm: 0, additionalCost: 0, status: "Prisförfrågan", priceHistory: [] },
      { id: "ART-0005", projectId: "P-26-0041", code: "P-26-0041-A01", name: "Reception Rug", location: "Hotel reception", shape: "Rektangulär", widthCm: 360, lengthCm: 520, manualArea: 0, manufacturer: "Anisa Carpets", currency: "EUR", pricePerSqm: 270, additionalCost: 0, status: "Pris godkänt", priceHistory: [] },
      { id: "ART-0006", projectId: "P-26-0041", code: "P-26-0041-A02", name: "Library Rug", location: "Guest library", shape: "Rektangulär", widthCm: 280, lengthCm: 380, manualArea: 0, manufacturer: "Anisa Carpets", currency: "EUR", pricePerSqm: 275, additionalCost: 0, status: "Pris godkänt", priceHistory: [] }
    ],
    quotations: [
      { id: "Q-26-0044", projectId: "P-26-0044", project: "The North House", version: 3, amount: 159500, margin: 43.8, status: "Ersatt", created: "2026-08-18" },
      { id: "Q-26-0044", projectId: "P-26-0044", project: "The North House", version: 4, amount: 164000, margin: 44.6, status: "Utkast", created: "2026-08-31" },
      { id: "Q-26-0045", projectId: "P-26-0045", project: "Scandic Helsinki Hub", version: 1, amount: 116800, margin: 46.1, status: "Ersatt", created: "2026-08-16" },
      { id: "Q-26-0045", projectId: "P-26-0045", project: "Scandic Helsinki Hub", version: 2, amount: 112000, margin: 42.9, status: "Skickad", created: "2026-08-25" },
      { id: "Q-26-0043", projectId: "P-26-0043", project: "Kunsthalle Berlin", version: 1, amount: 73000, margin: 38.4, status: "Skickad", created: "2026-08-28" },
      { id: "Q-26-0041", projectId: "P-26-0041", project: "Hotel Aurora Oslo", version: 1, amount: 104000, margin: 45.2, status: "Ersatt", created: "2026-08-05" },
      { id: "Q-26-0041", projectId: "P-26-0041", project: "Hotel Aurora Oslo", version: 2, amount: 98000, margin: 44.8, status: "Accepterad", created: "2026-08-14", acceptedAt: "2026-08-20", acceptedBy: "Mette Larsen", acceptanceMethod: "Inköpsorder", poNumber: "PO-8841", deliveryDate: "2027-01-18", acceptanceComment: "Accepterad enligt kundens inköpsorder.", articleSnapshots: [
        { articleId: "ART-0005", code: "P-26-0041-A01", name: "Reception Rug", location: "Hotel reception", shape: "Rektangulär", widthCm: 360, lengthCm: 520, area: 18.72, manufacturer: "Anisa Carpets", currency: "EUR", pricePerSqm: 270, additionalCost: 0, cost: 5054.4 },
        { articleId: "ART-0006", code: "P-26-0041-A02", name: "Library Rug", location: "Guest library", shape: "Rektangulär", widthCm: 280, lengthCm: 380, area: 10.64, manufacturer: "Anisa Carpets", currency: "EUR", pricePerSqm: 275, additionalCost: 0, cost: 2926 }
      ] }
    ],
    company: {
      name: "Cappelen Dimyr Projects AB", address: "Regementsgatan 8", zip: "211 42", city: "Malmö", country: "Sweden", orgNumber: "", vatNumber: "", eori: "", iban: "", bic: "", email: "", phone: "", web: "cappelendimyr.com"
    },
    manufacturers: [
      { id: "MFG-0001", name: "Anisa Carpets", country: "India", contact: "", email: "", phone: "", currency: "EUR", active: true },
      { id: "MFG-0002", name: "Bhadohi Workshop", country: "India", contact: "", email: "", phone: "", currency: "EUR", active: true }
    ],
    agents: [
      { name: "Daretodeco AS", contact: "Christina", country: "Norge", territory: "Norway", inquiries: 12, projects: 7, won: 2, value: 185000, commission: 15, active: true },
      { name: "Studio Nord ApS", contact: "Frederik Holm", country: "Danmark", territory: "Denmark", inquiries: 8, projects: 4, won: 1, value: 92000, commission: 12, active: true },
      { name: "Atelier Marché", contact: "Sophie Laurent", country: "Frankrike", territory: "France", inquiries: 5, projects: 2, won: 0, value: 0, commission: 15, active: true }
    ]
  };

  const store = window.CDPData.createLocalStore(seed, { storageKey: "cdp-projects-local" });
  const state = store.getState();
  let quotationFilter = "active";
  let projectFilter = "active";
  let leadFilter = "active";
  let inquiryMode = "active";
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const money = (value, currency = "EUR") => new Intl.NumberFormat("sv-SE", { style: "currency", currency, maximumFractionDigits: 0 }).format(value);
  const decimal = value => new Intl.NumberFormat("sv-SE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value || 0);
  const date = value => value ? new Intl.DateTimeFormat("sv-SE", { day: "numeric", month: "short", year: "numeric" }).format(new Date(`${value}T12:00:00`)) : "—";
  const month = value => value ? new Intl.DateTimeFormat("sv-SE", { month: "long", year: "numeric" }).format(new Date(`${value}-01T12:00:00`)) : "Ej angivet";
  const leadMonth = value => {
    if (!value) return `<strong>—</strong><span>Start</span>`;
    const monthDate = new Date(`${value}-01T12:00:00`);
    return `<strong>${new Intl.DateTimeFormat("sv-SE", { month: "short" }).format(monthDate)}</strong><span>${monthDate.getFullYear()}</span>`;
  };
  const esc = value => String(value ?? "").replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[character]));
  const statusTone = status => ({ "Aktivt": ["#e8edef", "#617783"], "Konverterat": ["#e6ebe3", "#536851"], "Ny": ["#e8edef", "#617783"], "Bedöms": ["#f3ecdf", "#8a6e42"], "Go": ["#e6ebe3", "#536851"], "No Go": ["#f3e6e2", "#8b584f"], "Skickad": ["#e8edef", "#617783"], "Utkast": ["#f3ecdf", "#8a6e42"], "Ersatt": ["#ecece8", "#74786f"], "Accepterad": ["#e6ebe3", "#536851"], "Avböjd": ["#f3e6e2", "#8b584f"], "Utgången": ["#ecece8", "#74786f"], "Återkallad": ["#ecece8", "#74786f"], "Vunnet": ["#e6ebe3", "#536851"], "Förfrågan": ["#e8edef", "#617783"], "Förhandlas": ["#f3ecdf", "#8a6e42"], "Godkänt": ["#e6ebe3", "#536851"], "Prisförfrågan": ["#e8edef", "#617783"], "Förhandling": ["#f3ecdf", "#8a6e42"], "Pris godkänt": ["#e6ebe3", "#536851"], "Första pris": ["#e8edef", "#617783"], "Förhandlat": ["#f3ecdf", "#8a6e42"], "Väntar orderunderlag": ["#f3ecdf", "#8a6e42"], "Orderbekräftad": ["#e8edef", "#617783"], "Produktion": ["#e8edef", "#617783"], "Klar för leverans": ["#f3ecdf", "#8a6e42"], "Levererad": ["#e6ebe3", "#536851"], "Avslutad": ["#e6ebe3", "#536851"] }[status] || ["#ecece8", "#666"]);

  function saveState() { store.save(); }
  function statusBadge(status) { const [bg, color] = statusTone(status); return `<span class="status" style="--status-bg:${bg};--status-color:${color}">${status}</span>`; }
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
  function priceUnitLabel(unit) { return unit === "per styck" ? "/st" : unit === "fast pris" ? " fast" : "/m²"; }
  function articleTotalArea(article) { return articleArea(article) * (Number(article.quantity) || 1); }
  function projectCalculation(project, articles) {
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
    if (article.shape === "Specialform") return `Specialform · ${decimal(articleArea(article))} m²`;
    if (article.shape === "Rund") return `Ø ${article.widthCm || 0} cm`;
    return `${article.widthCm || 0} × ${article.lengthCm || 0} cm`;
  }
  function toast(message) { const el = $("#toast"); el.textContent = message; el.classList.add("show"); clearTimeout(toast.timer); toast.timer = setTimeout(() => el.classList.remove("show"), 2400); }

  function showView(view) {
    $$(".view").forEach(el => el.classList.toggle("active", el.id === `view-${view}`));
    $$(".nav-item[data-view]").forEach(el => el.classList.toggle("active", el.dataset.view === view));
    const active = $(`#view-${view}`); $("#breadcrumbCurrent").textContent = active?.dataset.title || view;
    $("#sidebar").classList.remove("open"); window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function renderAll() {
    renderMetrics(); renderDashboardLeads(); renderLeads(); renderDashboardInquiries(); renderInquiries(); renderProjects(); renderArticles(); renderQuotations(); renderAgents(); renderManufacturers(); renderSettings();
    $("#leadNavCount").textContent = state.leads.filter(lead => lead.status === "Aktivt").length;
    $("#inquiryNavCount").textContent = state.inquiries.filter(i => ["Ny", "Bedöms"].includes(i.status)).length;
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
      ["Öppen pipeline", money(openValue), "+12 % mot förra månaden", "↗", "#536851", "#e6ebe3"],
      ["Viktad pipeline", money(weighted), "Baserat på sannolikhet", "◒", "#6d7f89", "#e8edef"],
      ["Accepterat YTD", money(acceptedValue), `${acceptedQuotes.length} vunna projekt`, "✓", "#536851", "#e6ebe3"],
      ["Förfrågningar", state.inquiries.filter(i => i.status !== "No Go").length, `${state.inquiries.filter(i => i.status === "Ny").length} nya att bedöma`, "◎", "#8a6e42", "#f3ecdf"],
      ["Genomsnittsmarginal", `${(state.quotations.reduce((s,q)=>s+q.margin,0)/state.quotations.length).toFixed(1)} %`, "Mål: 45 %", "◇", "#8b584f", "#f3e6e2"]
    ];
    $("#metricGrid").innerHTML = metrics.map(m => `<article class="metric-card" style="--accent:${m[4]};--accent-pale:${m[5]}"><div class="metric-label">${m[0]}<span class="metric-icon">${m[3]}</span></div><div class="metric-value">${m[1]}</div><div class="metric-foot"><strong>${m[2]}</strong></div></article>`).join("");
    const phases = ["Kalkyl", "Offert skickad", "Förhandling"];
    const max = Math.max(...phases.map(ph => state.projects.filter(p => p.phase === ph).reduce((s,p)=>s+p.value,0)));
    const colors = ["#9ba998", "#c1ad87", "#82939b", "#a87a70"];
    $("#pipelineChart").innerHTML = phases.map((phase, i) => { const value = state.projects.filter(p => p.phase === phase).reduce((s,p)=>s+p.value,0); return `<div class="bar-group"><span class="bar-value">${money(value).replace(/,00/,"")}</span><div class="bar" style="--height:${Math.max(5, value/max*78)}%;--color:${colors[i]}"></div><span class="bar-label">${phase}</span></div>`; }).join("");
    $("#attentionList").innerHTML = [
      ["!", "Offert kräver marginalgodkännande", "Kunsthalle Berlin · 38,4 %", "#f3e6e2", "#8b584f"],
      ["↗", "Följ upp skickad offert", "Scandic Helsinki Hub · idag", "#e8edef", "#617783"],
      ["◎", "Två nya förfrågningar", "Väntar på första bedömning", "#f3ecdf", "#8a6e42"]
    ].map(a => `<div class="attention-item"><span class="attention-symbol" style="--bg:${a[3]};--color:${a[4]}">${a[0]}</span><div><strong>${a[1]}</strong><span>${a[2]}</span></div><button data-target-view="inquiries">→</button></div>`).join("");
  }

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
    $("#dashboardLeadRows").innerHTML = leads.map(lead => `<button class="lead-watch-item" data-edit-lead="${lead.id}"><span class="lead-month">${leadMonth(lead.expectedStart)}</span><span><strong>${esc(lead.name)}</strong><small>${esc(lead.comments || "Ingen kommentar registrerad.")}</small></span><span>→</span></button>`).join("") || `<div class="empty-state"><p>Inga aktiva leads ännu.</p></div>`;
  }

  function renderLeads() {
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
        ? `<textarea class="inline-comment" data-lead-comment="${lead.id}" rows="2" aria-label="Kommentar för ${esc(lead.name)}" placeholder="Lägg till kommentar…">${esc(lead.comments || "")}</textarea>`
        : `<span class="readonly-comment">${esc(lead.comments || "—")}</span>`;
      const actions = lead.status === "Aktivt"
        ? `<div class="action-buttons"><button class="text-button" data-edit-lead="${lead.id}">Ändra</button><button class="text-button" data-convert-lead="${lead.id}">Skapa förfrågan</button><button class="text-button delete-action" data-delete-lead="${lead.id}">Ta bort</button></div>`
        : `<button class="text-button converted-link" data-inquiry-id="${lead.inquiryId}">${esc(lead.inquiryId || "Visa förfrågan")} →</button>`;
      return `<tr><td><button class="id-link" data-edit-lead="${lead.id}">${lead.id}</button></td><td><span class="cell-primary">${esc(lead.name)}</span></td><td><span class="month-display">${esc(month(lead.expectedStart))}</span></td><td class="comment-cell">${comment}</td><td>${date(lead.createdAt)}</td><td>${statusBadge(lead.status)}</td><td>${actions}</td></tr>`;
    }).join("") || `<tr><td colspan="7">Inga leads i den här kategorin.</td></tr>`;
  }

  function inquiryRow(i, compact = false) {
    return `<tr><td><button class="id-link" data-inquiry-id="${i.id}">${i.id}</button></td><td><span class="cell-primary">${i.project}</span><span class="cell-secondary">${i.customer}</span></td><td>${i.country}</td><td><span class="source-tag">${i.source}</span></td>${compact ? "" : `<td>${i.agent}</td>`}<td>${money(i.value, i.currency)}</td>${compact ? "" : `<td><strong>${i.probability} %</strong><div class="progress" style="--progress:${i.probability}%"><span></span></div></td>`}<td>${statusBadge(i.status)}</td><td>${date(compact ? i.received : (i.decisionAt || i.decision))}</td><td><button class="row-menu" data-inquiry-id="${i.id}" aria-label="Öppna">•••</button></td></tr>`;
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
    return `<div class="project-tabs inquiry-tabs"><button class="project-tab ${tab==="overview"?"active":""}" data-inquiry-tab="overview" data-id="${i.id}">Översikt</button><button class="project-tab ${tab==="customer"?"active":""}" data-inquiry-tab="customer" data-id="${i.id}">Kund</button><button class="project-tab ${tab==="scope"?"active":""}" data-inquiry-tab="scope" data-id="${i.id}">Preliminär omfattning (${scopeCount})</button><button class="project-tab ${tab==="files"?"active":""}" data-inquiry-tab="files" data-id="${i.id}">Design & filer</button></div>`;
  }
  function inquiryScopeRow(row={}, index=0, disabled=false) {
    return `<tr data-scope-row><td><select name="scopeType" ${disabled?"disabled":""}><option ${row.type!=="Tapestry"&&row.type!=="Other"?"selected":""}>Rug</option><option ${row.type==="Tapestry"?"selected":""}>Tapestry</option><option ${row.type==="Other"?"selected":""}>Other</option></select></td><td><input name="scopeDescription" value="${esc(row.description||"")}" placeholder="Guest room rug" ${disabled?"disabled":""}></td><td><input name="scopeQuantity" type="number" min="1" step="1" value="${Number(row.quantity)||1}" ${disabled?"disabled":""}></td><td><input name="scopeWidth" type="number" min="0" step="1" value="${Number(row.widthCm)||""}" placeholder="200" ${disabled?"disabled":""}></td><td><input name="scopeLength" type="number" min="0" step="1" value="${Number(row.lengthCm)||""}" placeholder="300" ${disabled?"disabled":""}></td><td class="scope-area">${decimal(scopeRowArea(row))} m²</td><td><input name="scopeComment" value="${esc(row.comment||"")}" placeholder="Custom colour" ${disabled?"disabled":""}></td><td>${disabled?"":`<button type="button" class="row-menu" data-remove-scope-row aria-label="Ta bort">×</button>`}<input type="hidden" name="scopeId" value="${esc(row.id||"")}"></td></tr>`;
  }
  function updateInquiryScopeSummary(form) {
    if(!form) return; let items=0,area=0;
    $$('[data-scope-row]',form).forEach(row=>{ const qty=Math.max(1,Number($('[name="scopeQuantity"]',row)?.value)||1),w=Number($('[name="scopeWidth"]',row)?.value)||0,l=Number($('[name="scopeLength"]',row)?.value)||0; items+=qty; const a=w>0&&l>0?(w/100)*(l/100)*qty:0; area+=a; const cell=$('.scope-area',row); if(cell) cell.textContent=`${decimal(a)} m²`; });
    const out=$('[data-scope-summary]',form); if(out) out.textContent=`Estimated scope: ${items} items · approx. ${decimal(area)} m²`;
  }

  function renderDashboardInquiries() { $("#dashboardInquiryRows").innerHTML = state.inquiries.filter(i => ["Ny", "Bedöms"].includes(i.status)).slice(0, 4).map(i => inquiryRow(i, true)).join("") || `<tr><td colspan="8">Inga aktiva förfrågningar just nu.</td></tr>`; }
  function renderInquiries() {
    const term = $("#inquirySearch")?.value.trim().toLowerCase() || "";
    const status = $("#inquiryStatusFilter")?.value || "all";
    const source = $("#inquirySourceFilter")?.value || "all";
    const activeStatuses = ["Ny", "Bedöms"];
    const archiveStatuses = ["Go", "No Go"];
    const modeStatuses = inquiryMode === "archive" ? archiveStatuses : activeStatuses;
    const base = state.inquiries.filter(i => modeStatuses.includes(i.status));
    const filtered = base.filter(i => (!term || [i.id,i.project,i.customer,i.country,i.agent].join(" ").toLowerCase().includes(term)) && (status === "all" || i.status === status) && (source === "all" || i.source === source));
    $("#inquiryRows").innerHTML = filtered.map(i => inquiryRow(i)).join("") || `<tr><td colspan="10">${inquiryMode === "archive" ? "Inga arkiverade förfrågningar matchar filtret." : "Inga aktiva förfrågningar matchar filtret."}</td></tr>`;
    $("#inquiryResultCount").textContent = `${filtered.length} av ${base.length} ${inquiryMode === "archive" ? "arkiverade" : "aktiva"} förfrågningar`;
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
      $("#projectKanban").innerHTML=won.map(p=>`<article class="won-card" data-project-id="${p.id}" tabindex="0" role="button" aria-label="Öppna projekt ${p.name}"><div class="won-card-head"><div><h2>${p.name}</h2><p>${p.id} · ${p.customer}</p></div>${statusBadge("Vunnet")}</div><div class="won-card-stats"><div><span>Accepterat värde</span><strong>${money(p.value,p.currency)}</strong></div><div><span>Accepterad</span><strong>${date(p.acceptedAt)}</strong></div><div><span>Leverans</span><strong>${date(p.deliveryDate)}</strong></div><div><span>Status</span><strong>${p.deliveryStatus||"Väntar orderunderlag"}</strong></div></div><button class="text-button" style="margin-top:14px" data-project-id="${p.id}">Öppna projekt →</button></article>`).join("") || `<div class="empty-state"><h2>Inga vunna projekt ännu</h2></div>`;
      return;
    }
    $("#projectKanban").className="kanban";
    const visiblePhases=projectFilter==="all"?[...phases,"Vunnet","Förlorat"]:phases;
    $("#projectKanban").innerHTML = visiblePhases.map(phase => { const items = state.projects.filter(p=>p.phase===phase); return `<section class="kanban-column"><div class="kanban-head"><strong>${phase}</strong><span>${items.length}</span></div>${items.map(p => { const articleCount=state.articles.filter(a=>a.projectId===p.id).length; return `<article class="project-card" data-project-id="${p.id}" tabindex="0" role="button" aria-label="Öppna projekt ${p.name}"><button type="button" data-project-id="${p.id}">${p.name}</button><p>${p.id} · ${p.customer}</p><div class="project-meta"><div><strong>${money(p.value,p.currency)}</strong><span class="cell-secondary">${p.probability}% sannolikhet · ${articleCount} artiklar</span></div><span class="owner-dot">${p.owner}</span></div><span class="cell-secondary" style="margin-top:12px">Nästa: ${p.next}</span></article>`; }).join("") || `<p class="cell-secondary">Inga projekt</p>`}</section>`; }).join("");
  }

  function articleRow(article, compact = false) {
    const project = state.projects.find(p=>p.id===article.projectId);
    return `<tr><td><button class="id-link" data-article-id="${article.id}">${article.code}</button></td>${compact ? "" : `<td><span class="cell-primary">${project?.name || "—"}</span><span class="cell-secondary">${article.projectId}</span></td>`}<td><span class="cell-primary">${article.name}</span><span class="cell-secondary">${article.location || "—"}</span></td><td><span class="size-value">${articleSize(article)}</span></td><td>${decimal(articleArea(article))}</td><td>${article.manufacturer || "—"}</td><td>${article.pricePerSqm ? `${money(article.pricePerSqm, article.currency)}${priceUnitLabel(article.priceUnit)}` : "—"}</td><td><span class="cost-value">${money(articleCost(article), article.currency)}</span></td><td>${statusBadge(article.status)}</td><td><button class="row-menu" data-article-id="${article.id}">•••</button></td></tr>`;
  }

  function populateArticleProjectFilter() {
    const select = $("#articleProjectFilter"); if (!select) return; const current=select.value;
    select.innerHTML = `<option value="all">Alla projekt</option>${state.projects.map(p=>`<option value="${p.id}">${p.id} · ${p.name}</option>`).join("")}`;
    if ([...select.options].some(o=>o.value===current)) select.value=current;
  }

  function renderArticles() {
    populateArticleProjectFilter();
    const term = $("#articleSearch")?.value.trim().toLowerCase() || "";
    const projectId = $("#articleProjectFilter")?.value || "all";
    const status = $("#articleStatusFilter")?.value || "all";
    const filtered = state.articles.filter(a => {
      const project=state.projects.find(p=>p.id===a.projectId);
      return (!term || [a.code,a.name,a.location,a.manufacturer,project?.name].join(" ").toLowerCase().includes(term)) && (projectId==="all" || a.projectId===projectId) && (status==="all" || a.status===status);
    });
    const totalArea=filtered.reduce((s,a)=>s+articleArea(a),0); const totalCost=filtered.reduce((s,a)=>s+articleCost(a),0); const awaiting=filtered.filter(a=>a.status!=="Godkänt").length;
    $("#articleSummary").innerHTML = `<div class="summary-card"><span>Visade artiklar</span><strong>${filtered.length}</strong></div><div class="summary-card"><span>Total yta</span><strong>${decimal(totalArea)} m²</strong></div><div class="summary-card"><span>Produktionskostnad</span><strong>${money(totalCost)}</strong></div><div class="summary-card"><span>Pris ej godkänt</span><strong>${awaiting}</strong></div>`;
    $("#articleRows").innerHTML = filtered.map(a=>articleRow(a)).join("") || `<tr><td colspan="10">Inga artiklar matchar filtret.</td></tr>`;
    $("#articleResultCount").textContent = `${filtered.length} av ${state.articles.length} artiklar`;
  }

  function renderQuotations() {
    const activeStatuses=["Utkast","Intern granskning","Skickad","Revidering begärd"];
    const lostStatuses=["Avböjd","Utgången","Återkallad"];
    const accepted=state.quotations.filter(q=>q.status==="Accepterad"); const active=state.quotations.filter(q=>activeStatuses.includes(q.status)); const lost=state.quotations.filter(q=>lostStatuses.includes(q.status));
    const acceptedValue=accepted.reduce((s,q)=>s+q.amount,0); const avgMargin=accepted.length?accepted.reduce((s,q)=>s+q.margin,0)/accepted.length:0; const upcoming=state.projects.filter(p=>p.businessStatus==="Vunnet" && !["Levererad","Avslutad"].includes(p.deliveryStatus)).length;
    $("#acceptedSummary").innerHTML=`<div class="accepted-card"><span>Accepterat värde YTD</span><strong>${money(acceptedValue)}</strong></div><div class="accepted-card"><span>Vunna projekt</span><strong>${accepted.length}</strong></div><div class="accepted-card"><span>Genomsnittsmarginal</span><strong>${decimal(avgMargin)} %</strong></div><div class="accepted-card"><span>Pågående leveranser</span><strong>${upcoming}</strong></div>`;
    $("#activeQuoteCount").textContent=active.length; $("#acceptedQuoteCount").textContent=accepted.length; $("#lostQuoteCount").textContent=lost.length;
    $$("[data-quote-filter]").forEach(button=>button.classList.toggle("active",button.dataset.quoteFilter===quotationFilter));
    let rows=state.quotations;
    if(quotationFilter==="active") rows=active; else if(quotationFilter==="accepted") rows=accepted; else if(quotationFilter==="lost") rows=lost;
    $("#quotationRows").innerHTML = [...rows].reverse().map(q => { const snapshots=q.articleSnapshots||[]; const productionCost=snapshots.reduce((s,a)=>s+(a.cost||0),0); const project=state.projects.find(p=>p.id===q.projectId); return `<tr><td><button class="id-link" data-quote-id="${q.id}" data-version="${q.version}">${q.id}</button></td><td><span class="cell-primary">${q.project}</span><span class="cell-secondary">${q.projectId}</span></td><td>V${q.version}</td><td>${snapshots.length}</td><td>${snapshots.length ? money(productionCost) : "—"}</td><td>${money(q.amount)}</td><td><strong style="color:${q.margin < 40 ? '#8b584f' : '#536851'}">${q.margin.toFixed(1)} %</strong></td><td>${statusBadge(q.status)}</td><td>${date(q.acceptedAt)}</td><td>${q.status==="Accepterad"?statusBadge(project?.deliveryStatus||"Väntar orderunderlag"):"—"}</td><td><button class="row-menu" data-quote-id="${q.id}" data-version="${q.version}">•••</button></td></tr>`; }).join("") || `<tr><td colspan="11">Inga offerter i den här kategorin.</td></tr>`;
  }
  function renderAgents() {
    $("#agentGrid").innerHTML = state.agents.map(a => `<article class="agent-card"><div class="agent-header"><div class="agent-logo">${a.name.split(" ").map(x=>x[0]).slice(0,2).join("")}</div><div><h2>${a.name}</h2><p>${a.contact} · ${a.country} · Provision ${a.commission}%</p></div>${statusBadge(a.active ? "Aktiv" : "Inaktiv")}</div><div class="agent-stats"><div><strong>${a.inquiries}</strong><span>Förfrågningar</span></div><div><strong>${a.projects}</strong><span>Projekt</span></div><div><strong>${money(a.value).replace(/,00/,"")}</strong><span>Vunnet</span></div></div></article>`).join("");
  }

  function renderManufacturers() {
    const grid = $("#manufacturerGrid"); if (!grid) return;
    grid.innerHTML = state.manufacturers.map(m => {
      const articleCount = state.articles.filter(a => (a.manufacturerId && a.manufacturerId === m.id) || (!a.manufacturerId && a.manufacturer === m.name)).length;
      return `<article class="agent-card"><div class="agent-header"><div class="agent-logo">${esc(m.name).split(" ").map(x=>x[0]).slice(0,2).join("")}</div><div><h2>${esc(m.name)}</h2><p>${esc(m.contact||"Ingen kontaktperson")} · ${esc(m.country||"—")}</p></div>${statusBadge(m.active!==false ? "Aktiv" : "Inaktiv")}</div><div class="agent-stats"><div><strong>${articleCount}</strong><span>Artiklar</span></div><div><strong>${esc(m.currency||"EUR")}</strong><span>Standardvaluta</span></div><div><strong>${esc(m.email||"—")}</strong><span>E-mail</span></div></div><button class="text-button" data-edit-manufacturer="${m.id}">Ändra →</button></article>`;
    }).join("") || `<div class="empty-state"><h2>Inga tillverkare registrerade</h2><p>Lägg till den första tillverkaren.</p></div>`;
  }

  function openManufacturerForm(manufacturer = null) {
    const editing = Boolean(manufacturer);
    openModal(`<form id="manufacturerForm" ${editing?`data-edit-id="${manufacturer.id}"`:""}><div class="modal-header"><div><h2 id="modalTitle">${editing?"Ändra tillverkare":"Ny tillverkare"}</h2><p>Tillverkaren kan väljas på projektartiklar och leverantörspriser.</p></div><button type="button" class="modal-close" data-close>×</button></div><div class="modal-body"><div class="form-grid"><label class="field full"><span>Namn *</span><input name="name" required value="${esc(manufacturer?.name||"")}"></label><label class="field"><span>Land</span><input name="country" value="${esc(manufacturer?.country||"")}"></label><label class="field"><span>Kontaktperson</span><input name="contact" value="${esc(manufacturer?.contact||"")}"></label><label class="field"><span>E-mail</span><input name="email" type="email" value="${esc(manufacturer?.email||"")}"></label><label class="field"><span>Telefon</span><input name="phone" value="${esc(manufacturer?.phone||"")}"></label><label class="field"><span>Standardvaluta</span><select name="currency"><option ${manufacturer?.currency!=="USD"?"selected":""}>EUR</option><option ${manufacturer?.currency==="USD"?"selected":""}>USD</option></select></label><label class="field checkbox-field"><span>Aktiv</span><input name="active" type="checkbox" ${manufacturer?.active!==false?"checked":""}></label></div></div><div class="modal-footer"><button type="button" class="button secondary" data-close>Avbryt</button><button class="button primary">Spara tillverkare</button></div></form>`);
  }

  function openModal(html, small = false) { const modal = $("#modal"); const backdrop = $("#modalBackdrop"); if (!modal || !backdrop) { console.error("Modal container missing"); return; } modal.className = `modal${small ? " small" : ""}`; modal.innerHTML = html; backdrop.hidden = false; setTimeout(()=>$("input, select, textarea", modal)?.focus(), 20); }
  function closeModal() { const backdrop=$("#modalBackdrop"); const modal=$("#modal"); if(backdrop) backdrop.hidden=true; if(modal) modal.innerHTML=""; }

  function openLeadForm(lead = null) {
    const editing = Boolean(lead);
    openModal(`<form id="leadForm" ${editing ? `data-edit-id="${lead.id}"` : ""}><div class="modal-header"><div><h2 id="modalTitle">${editing ? "Ändra lead" : "Nytt lead"}</h2><p>Registrera en tidig affärsmöjlighet för framtida bevakning.</p></div><button type="button" class="modal-close" data-close>×</button></div><div class="modal-body"><div class="form-grid">
      <label class="field full"><span>Namn *</span><input name="name" required value="${esc(lead?.name || "")}" placeholder="Exempel: Nytt hotell i Malmö"></label>
      <label class="field"><span>Förväntad start</span><input name="expectedStart" type="month" value="${esc(lead?.expectedStart || "")}"></label>
      <label class="field full"><span>Kommentar</span><textarea name="comments" placeholder="Varifrån tipset kommer och när det bör följas upp">${esc(lead?.comments || "")}</textarea></label>
    </div></div><div class="modal-footer"><button type="button" class="button secondary" data-close>Avbryt</button><button class="button primary">${editing ? "Spara ändringar" : "Lägg till lead"}</button></div></form>`);
  }

  function confirmDeleteLead(id) {
    const lead = state.leads.find(item => item.id === id); if (!lead) return;
    openModal(`<div class="modal-header"><div><h2 id="modalTitle">Ta bort lead?</h2><p>${esc(lead.id)} · ${esc(lead.name)}</p></div><button type="button" class="modal-close" data-close>×</button></div><div class="modal-body"><p>Leadet tas bort från den lokala bevakningslistan. Åtgärden kan inte ångras.</p></div><div class="modal-footer"><button class="button secondary" data-close>Avbryt</button><button class="button danger" data-confirm-delete-lead="${lead.id}">Ta bort</button></div>`, true);
  }

  function openNewInquiry(lead = null) {
    openModal(`<form id="newInquiryForm"><div class="modal-header"><div><h2 id="modalTitle">Ny projektförfrågan</h2><p>Registrera grunduppgifter. Bedömningen görs efter att förfrågan sparats.</p></div><button type="button" class="modal-close" data-close>×</button></div><div class="modal-body"><div class="form-grid">
      ${lead ? `<input type="hidden" name="sourceLeadId" value="${lead.id}"><input type="hidden" name="expectedStart" value="${esc(lead.expectedStart || "")}">` : ""}
      <label class="field full"><span>Projektnamn *</span><input name="project" required value="${esc(lead?.name || "")}" placeholder="Exempel: Grand Hôtel – Lobby Rugs"></label>
      <label class="field"><span>Kund / beställare *</span><input name="customer" required></label><label class="field"><span>Land *</span><input name="country" required></label>
      <label class="field"><span>Kontaktperson</span><input name="contact"></label><label class="field"><span>E-mail</span><input name="email" type="email"></label>
      <label class="field"><span>Telefon</span><input name="phone"></label><label class="field"><span>City</span><input name="city"></label>
      <label class="field"><span>Källa</span><select name="source"><option ${lead ? "selected" : ""}>Lead</option><option ${lead ? "" : "selected"}>Direkt</option><option>Agent</option><option>Arkitekt</option><option>Designer</option><option>Befintlig kund</option><option>Annat</option></select></label><label class="field"><span>Agent</span><select name="agent"><option>—</option>${state.agents.map(a=>`<option>${esc(a.name)}</option>`).join("")}</select></label>
      <label class="field"><span>Uppskattat värde, EUR</span><input name="value" type="number" min="0" value="0"></label><label class="field"><span>Uppskattad yta, m²</span><input name="area" type="number" min="0"></label>
      <label class="field"><span>Projekttyp</span><select name="type"><option>High End</option><option>Standard</option><option>Kontor</option></select></label><label class="field"><span>Förväntat beslut</span><input name="decision" type="date"></label>
      <label class="field full"><span>Beskrivning</span><textarea name="description" placeholder="Behov, omfattning, tidplan och övriga förutsättningar">${esc(lead?.comments || "")}</textarea></label>
    </div></div><div class="modal-footer"><button type="button" class="button secondary" data-close>Avbryt</button><button type="button" class="button primary" data-save-new-inquiry>Spara förfrågan</button></div></form>`);
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
    toast(values.sourceLeadId ? "Leadet har konverterats till en förfrågan." : "Förfrågan har registrerats.");
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
      content = `<form id="inquiryCustomerForm" data-inquiry-id="${i.id}"><div class="section-action"><div><h3>Kunduppgifter</h3><span class="cell-secondary">Grunduppgifter följer med automatiskt när förfrågan blir projekt.</span></div></div><div class="form-grid">
        <label class="field full"><span>Företag / kundnamn</span><input name="name" value="${esc(cd.name||i.customer||"")}" ${readOnly?"disabled":""}></label>
        <label class="field"><span>Kontaktperson</span><input name="contact" value="${esc(cd.contact||"")}" ${readOnly?"disabled":""}></label><label class="field"><span>E-mail</span><input name="email" type="email" value="${esc(cd.email||"")}" ${readOnly?"disabled":""}></label>
        <label class="field"><span>Telefon</span><input name="phone" value="${esc(cd.phone||"")}" ${readOnly?"disabled":""}></label><label class="field"><span>VAT number</span><input name="vatNumber" value="${esc(cd.vatNumber||"")}" ${readOnly?"disabled":""}></label>
        <label class="field full"><span>Adress</span><input name="address" value="${esc(cd.address||"")}" ${readOnly?"disabled":""}></label><label class="field"><span>ZIP</span><input name="zip" value="${esc(cd.zip||"")}" ${readOnly?"disabled":""}></label><label class="field"><span>City</span><input name="city" value="${esc(cd.city||"")}" ${readOnly?"disabled":""}></label><label class="field"><span>Country</span><input name="country" value="${esc(cd.country||i.country||"")}" ${readOnly?"disabled":""}></label>
      </div>${readOnly?`<p class="article-form-note">Förfrågan är konverterad. Kunduppgifter ändras nu i projektet.</p>`:`<div class="inline-actions"><button class="button primary">Spara kunduppgifter</button></div>`}</form>`;
    } else if (tab === "scope") {
      content = `<form id="inquiryScopeForm" data-inquiry-id="${i.id}"><div class="section-action"><div><h3>Preliminär omfattning</h3><span class="cell-secondary">Grov uppskattning – behöver inte vara exakt. Raderna följer med till projektet.</span></div>${readOnly?"":`<button type="button" class="button primary" data-add-inquiry-scope>＋ Ny rad</button>`}</div>
        <div class="table-scroll"><table class="scope-table"><thead><tr><th>Typ</th><th>Beskrivning</th><th>Antal</th><th>Bredd cm</th><th>Längd cm</th><th>Ca m²</th><th>Kommentar</th><th></th></tr></thead><tbody data-scope-body>${scope.length?scope.map((row,index)=>inquiryScopeRow(row,index,readOnly)).join(""):(readOnly?`<tr><td colspan="8" class="detail-sub">Ingen preliminär omfattning registrerad.</td></tr>`:inquiryScopeRow({},0,false))}</tbody></table></div>
        <div class="scope-summary" data-scope-summary>Estimated scope: ${totals.items} items · approx. ${decimal(totals.area)} m²</div>
        ${readOnly?`<p class="article-form-note">Förfrågan är konverterad. Omfattningen finns nu som underlag i projektet.</p>`:`<div class="inline-actions"><button class="button primary">Spara omfattning</button></div>`}</form>`;
      setTimeout(()=>updateInquiryScopeSummary($("#inquiryScopeForm")),20);
    } else if (tab === "files") {
      content = `<div class="section-action"><div><h3>Design & filer</h3><span class="cell-secondary">Skisser, renderings, moodboards, ritningar och kundbrief.</span></div></div><div class="empty-state file-placeholder" style="min-height:230px"><div class="empty-icon">▧</div><h2>Filuppladdning förbereds</h2><p>Vi sparar inte bildfiler i localStorage eftersom det snabbt fyller webbläsarens lagringsutrymme. Den här delen kopplas till extern fillagring (t.ex. Supabase Storage) när databasen ansluts.</p></div>`;
    } else {
      const decisionActions = converted
        ? `<button type="button" class="go" data-project-id="${i.projectId}">✓ GO – öppna projekt ${i.projectId}</button>`
        : i.status === "No Go"
          ? `<button type="button" class="go" data-reactivate-inquiry="${i.id}">↺ Återaktivera förfrågan</button>`
          : `<button type="button" class="go" data-decision="go" data-id="${i.id}">✓ GO – skapa projekt</button><button type="button" class="no-go" data-decision="no-go" data-id="${i.id}">× NO GO</button>`;
      const footerAction = archived ? "" : `<button type="button" class="button secondary" data-save-assessment="${i.id}">Spara bedömning</button>`;
      content = `<div class="detail-top"><div><span class="detail-id">${i.id}</span><div class="detail-title">${i.project}</div><div class="detail-sub">${i.customer} · ${i.country}</div></div>${statusBadge(i.status)}</div>
        <div class="detail-grid"><div class="detail-stat"><span>Uppskattat värde</span><strong>${money(i.value,i.currency)}</strong></div><div class="detail-stat"><span>Källa</span><strong>${i.source}${i.agent !== "—" ? ` · ${i.agent}` : ""}</strong></div><div class="detail-stat"><span>Preliminär omfattning</span><strong>${totals.items} st · ${decimal(totals.area)} m²</strong></div></div>
        <p class="detail-sub">${i.description || "Ingen beskrivning registrerad."}</p>
        <div class="qualification"><h3>Kvalificering</h3><div class="form-grid"><label class="field"><span>Sannolikhet</span><div class="input-suffix"><input id="qualificationProbability" type="number" min="0" max="100" value="${i.probability}" ${converted?"disabled":""}><span>%</span></div></label><label class="field"><span>Pågående status</span><select id="qualificationStatus" ${converted?"disabled":""}><option ${i.status==="Ny"?"selected":""}>Ny</option><option ${i.status==="Bedöms"?"selected":""}>Bedöms</option><option ${i.status==="Go"?"selected":""}>Go</option><option ${i.status==="No Go"?"selected":""}>No Go</option></select></label></div><div class="decision-buttons">${decisionActions}</div></div><div class="inquiry-footer-actions">${footerAction}</div>`;
    }

    openModal(`<div class="modal-header"><div><h2 id="modalTitle">Förfrågan</h2><p>${esc(i.id)} · ${esc(i.project)}</p></div><button class="modal-close" data-close>×</button></div><div class="modal-body">${inquiryTabs(i,tab)}<div class="project-tab-content">${content}</div></div><div class="modal-footer"><button class="button primary" data-close>Stäng</button></div>`);
  }

  function convertToProject(id) {
    const i = state.inquiries.find(x=>x.id===id); if(!i) return;
    const result = store.convertInquiryToProject(id,{probability:Number($("#qualificationProbability")?.value || i.probability),owner:"DE"});
    if(!result) return;
    renderAll(); closeModal(); showView("projects"); openProject(result.project.id); toast(result.created ? `${i.id} har konverterats till projekt ${result.project.id}.` : `${i.id} är kopplad till projekt ${result.project.id}.`);
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
    toast("Bedömningen har sparats.");
  }
  function nextId(prefix, ids) { const n = Math.max(0,...ids.map(id=>Number(id.split("-").pop())))+1; return `${prefix}-26-${String(n).padStart(4,"0")}`; }

  function openProject(id, tab = "overview") {
    const p = state.projects.find(x=>x.id===id); if(!p) return;
    const versions=state.quotations.filter(q=>q.projectId===id); const articles=state.articles.filter(a=>a.projectId===id);
    const totalArea=articles.reduce((s,a)=>s+articleTotalArea(a),0); const productionCost=articles.reduce((s,a)=>s+articleCost(a),0);
    let content="";
    if (tab === "articles") {
      const preliminary=p.preliminaryScope||[]; const preTotals=scopeTotals(preliminary);
      const preliminaryBlock=preliminary.length?`<div class="preliminary-scope"><div class="section-action"><div><h3>Preliminary scope from inquiry</h3><span class="cell-secondary">${preTotals.items} items · approx. ${decimal(preTotals.area)} m². Använd som underlag – uppgifterna är preliminära.</span></div></div><div class="table-scroll"><table><thead><tr><th>Typ</th><th>Beskrivning</th><th>Antal</th><th>Ca storlek</th><th>Ca m²</th><th>Kommentar</th><th></th></tr></thead><tbody>${preliminary.map(row=>`<tr><td>${esc(row.type||"Rug")}</td><td>${esc(row.description||"—")}</td><td>${Number(row.quantity)||1}</td><td>${row.widthCm&&row.lengthCm?`${row.widthCm} × ${row.lengthCm} cm`:"—"}</td><td>${decimal(scopeRowArea(row))}</td><td>${esc(row.comment||"")}</td><td>${row.convertedArticleId?`<span class="cell-secondary">→ ${esc(row.convertedArticleId)}</span>`:`<button class="text-button" data-create-article-from-scope="${esc(row.id)}" data-project-id-ref="${p.id}">Skapa artikel</button>`}</td></tr>`).join("")}</tbody></table></div></div>`:"";
      content = `${preliminaryBlock}<div class="section-action"><div><h3>Projektartiklar</h3><span class="cell-secondary">${articles.length} artiklar · ${decimal(totalArea)} m² · ${money(productionCost)} produktionskostnad</span></div><button class="button primary" data-new-article-project="${p.id}">＋ Ny artikel</button></div>${articles.length ? `<div class="table-scroll"><table><thead><tr><th>Artikel</th><th>Benämning</th><th>Storlek</th><th>Kvm</th><th>Tillverkare</th><th>Produktionspris</th><th>Kostnad</th><th>Prisstatus</th><th></th></tr></thead><tbody>${articles.map(a=>articleRow(a,true)).join("")}</tbody></table></div>` : `<div class="empty-state" style="min-height:210px"><div class="empty-icon">◫</div><h2>Inga artiklar ännu</h2><p>Lägg till den första artikeln eller skapa en artikel från den preliminära omfattningen ovan.</p></div>`}`;
    }
    else if (tab === "customer") {
      const cd=p.customerData||{}; const b=cd.billing||{}; const d=cd.delivery||{};
      content = `<form id="projectCustomerForm" data-project-id="${p.id}"><div class="section-action"><div><h3>Kund- & adressuppgifter</h3><span class="cell-secondary">Dessa uppgifter används i nya offertversioner.</span></div></div>
      <div class="address-panels"><section class="address-panel"><h4>Faktureringsuppgifter</h4><div class="form-grid"><label class="field full"><span>Namn / företag</span><input name="billingName" value="${esc(b.name||p.customer||"")}"></label><label class="field full"><span>Adress</span><input name="billingAddress" value="${esc(b.address||"")}"></label><label class="field"><span>ZIP</span><input name="billingZip" value="${esc(b.zip||"")}"></label><label class="field"><span>City</span><input name="billingCity" value="${esc(b.city||"")}"></label><label class="field"><span>Country</span><input name="billingCountry" value="${esc(b.country||p.country||"")}"></label><label class="field"><span>VAT number</span><input name="billingVatNumber" value="${esc(b.vatNumber||"")}"></label><label class="field"><span>Kontaktperson</span><input name="billingContact" value="${esc(b.contact||"")}"></label><label class="field"><span>E-mail</span><input name="billingEmail" type="email" value="${esc(b.email||"")}"></label></div></section>
      <section class="address-panel"><div class="address-heading"><h4>Leveransuppgifter</h4><label class="same-address"><input name="sameAsBilling" type="checkbox" ${cd.sameAsBilling!==false?"checked":""}> Samma som fakturering</label></div><div class="form-grid delivery-address-fields" data-delivery-address-fields><label class="field full"><span>Namn / företag</span><input name="deliveryName" value="${esc(d.name||p.customer||"")}"></label><label class="field full"><span>Adress</span><input name="deliveryAddress" value="${esc(d.address||"")}"></label><label class="field"><span>ZIP</span><input name="deliveryZip" value="${esc(d.zip||"")}"></label><label class="field"><span>City</span><input name="deliveryCity" value="${esc(d.city||"")}"></label><label class="field"><span>Country</span><input name="deliveryCountry" value="${esc(d.country||p.country||"")}"></label></div><div class="form-grid"><label class="field"><span>Kontaktperson</span><input name="deliveryContact" value="${esc(d.contact||"")}"></label><label class="field"><span>Telefon</span><input name="deliveryPhone" value="${esc(d.phone||"")}"></label></div></section></div>
      <div class="modal-footer" style="margin:20px -23px -20px"><button class="button primary">Spara kunduppgifter</button></div></form>`;
      setTimeout(()=>bindSameAddress($("#projectCustomerForm")),20);
    }
    else if (tab === "calculation") {
      const calc=p.calculation||{}; const pc=projectCalculation(p,articles);
      content = `<form id="calculationForm" data-project-id="${p.id}"><div class="section-action"><div><h3>Intern kalkyl</h3><span class="cell-secondary">Produktionskostnad + leverans + importkostnader → målmargin → offertpris.</span></div>${statusBadge(p.phase)}</div>
      <div class="calc-section"><h4>1. Produktionskostnad</h4><div class="calc-preview"><div><span>Artiklar</span><strong>${articles.length}</strong></div><div><span>Total yta</span><strong>${decimal(totalArea)} m²</strong></div><div><span>Produktion</span><strong>${money(pc.productionCost,p.currency)}</strong></div></div>${articles.some(a=>a.status!=="Godkänt")?`<p class="article-form-note"><strong>Obs:</strong> ${articles.filter(a=>a.status!=="Godkänt").length} artikelpris är inte godkänt. Kalkylen använder ändå aktuellt registrerat pris.</p>`:`<p class="article-form-note">Alla artikelpriser är godkända.</p>`}<button type="button" class="button secondary" data-project-tab="articles" data-id="${p.id}">Hantera artiklar</button></div>
      <div class="calc-section"><h4>2. Leverans & import</h4><div class="form-grid"><label class="field"><span>Leveransvillkor</span><select name="deliveryTerm" data-calc-live><option ${calc.deliveryTerm!=="DDP"?"selected":""}>DAP</option><option ${calc.deliveryTerm==="DDP"?"selected":""}>DDP</option></select></label><label class="field"><span>Destination</span><input name="destination" value="${esc(calc.destination||p.country||"")}"></label><label class="field"><span>Vår fraktkostnad</span><input name="freightCost" data-calc-live type="number" min="0" step="0.01" value="${Number(calc.freightCost)||0}"></label><label class="field"><span>Tull (DDP)</span><input name="dutyCost" data-calc-live type="number" min="0" step="0.01" value="${Number(calc.dutyCost)||0}"></label><label class="field"><span>Importmoms (DDP)</span><input name="importVatCost" data-calc-live type="number" min="0" step="0.01" value="${Number(calc.importVatCost)||0}"></label><label class="field checkbox-field"><span>Importmoms som kostnad</span><input name="includeImportVatInCost" data-calc-live type="checkbox" ${calc.includeImportVatInCost?"checked":""}></label><label class="field"><span>Övriga importkostnader</span><input name="otherImportCost" data-calc-live type="number" min="0" step="0.01" value="${Number(calc.otherImportCost)||0}"></label></div></div>
      <div class="calc-section"><h4>3. Pris & marginal</h4><div class="form-grid"><label class="field"><span>Önskad marginal, %</span><input name="targetMargin" data-calc-live type="number" min="0" max="95" step="0.1" value="${Number(calc.targetMargin)||45}"></label><label class="field"><span>Frakt på kundoffert</span><select name="freightPresentation"><option ${calc.freightPresentation!=="Ingår i produktpris"?"selected":""}>Separat rad</option><option ${calc.freightPresentation==="Ingår i produktpris"?"selected":""}>Ingår i produktpris</option></select></label><label class="field"><span>Debiterad frakt till kund</span><input name="customerFreight" type="number" min="0" step="0.01" value="${Number(calc.customerFreight)||0}"></label><label class="field"><span>Giltighet, dagar</span><input name="validityDays" type="number" min="1" value="${Number(calc.validityDays)||30}"></label><label class="field"><span>Betalningsvillkor</span><input name="paymentTerms" value="${esc(calc.paymentTerms||"")}"></label><label class="field"><span>Leveranstid</span><input name="deliveryTime" value="${esc(calc.deliveryTime||"")}" placeholder="Exempel: 14–16 veckor"></label><label class="field full"><span>Offertkommentar / undantag</span><textarea name="notes">${esc(calc.notes||"")}</textarea></label></div>
      <div class="calc-summary" data-calc-summary><div><span>Produktionskostnad</span><strong>${money(pc.productionCost,p.currency)}</strong></div><div><span>Frakt</span><strong>${money(pc.freightCost,p.currency)}</strong></div><div><span>Tull/import</span><strong>${money(pc.dutyCost+pc.importVatCost+pc.otherImportCost,p.currency)}</strong></div><div><span>Total kostnad</span><strong>${money(pc.totalCost,p.currency)}</strong></div><div><span>Bruttovinst</span><strong>${money(pc.grossProfit,p.currency)}</strong></div><div class="calc-total"><span>Beräknat offertpris</span><strong>${money(pc.salesPrice,p.currency)}</strong><small>${decimal(pc.margin)} % marginal</small></div></div></div>
      <div class="modal-footer split" style="margin:20px -23px -20px"><div class="modal-footer-group"><button type="button" class="button secondary" data-preview-quote-from-calc="${p.id}">Preview offert</button></div><div class="modal-footer-group"><button type="button" class="button secondary" data-save-calculation="${p.id}">Spara kalkyl</button><button type="button" class="button primary" data-create-quote-from-calc="${p.id}">Skapa offertversion</button></div></div></form>`;
      setTimeout(()=>bindCalculationLive($("#calculationForm"),p.id),20);
    }
    else if (tab === "quotes") content = `<div class="section-action"><div><h3>Offertversioner</h3><span class="cell-secondary">Varje ny version sparar en ögonblicksbild av aktuella artiklar.</span></div>${p.businessStatus!=="Vunnet"?`<button class="button primary" data-new-quote="${p.id}">＋ Ny offertversion</button>`:""}</div>${versions.length ? versions.map(q=>`<div class="attention-item"><span class="attention-symbol" style="--bg:#e6ebe3;--color:#536851">V${q.version}</span><div><button class="id-link" data-quote-id="${q.id}" data-version="${q.version}">${q.id} · ${money(q.amount)}</button><span>${q.margin.toFixed(1)}% marginal · ${q.status} · ${(q.articleSnapshots||[]).length} artiklar</span></div><button data-quote-id="${q.id}" data-version="${q.version}">→</button></div>`).join("") : `<p class="detail-sub">Ingen offert skapad ännu.</p>`}`;
    else if (tab === "delivery") content = `<form id="deliveryForm" data-project-id="${p.id}"><div class="section-action"><div><h3>Order & leverans</h3><span class="cell-secondary">Följ det vunna projektet från acceptans till avslut.</span></div>${statusBadge(p.deliveryStatus||"Väntar orderunderlag")}</div><div class="form-grid"><label class="field"><span>Leveransstatus</span><select name="deliveryStatus">${["Väntar orderunderlag","Orderbekräftad","Produktion","Klar för leverans","Levererad","Avslutad"].map(x=>`<option ${x===(p.deliveryStatus||"Väntar orderunderlag")?"selected":""}>${x}</option>`).join("")}</select></label><label class="field"><span>Preliminär leverans</span><input name="deliveryDate" type="date" value="${p.deliveryDate||""}"></label><label class="field"><span>Kundens PO-nummer</span><input name="poNumber" value="${p.poNumber||""}"></label><label class="field"><span>Nästa aktivitet</span><input name="next" value="${p.next||""}"></label><label class="field full"><span>Leveranskommentar</span><textarea name="deliveryComment">${p.deliveryComment||""}</textarea></label></div><div class="modal-footer" style="margin:20px -23px -20px"><button class="button primary">Spara leveransuppföljning</button></div></form>`;
    else content = `<div class="detail-grid"><div class="detail-stat"><span>Fas</span><strong>${p.phase}</strong></div><div class="detail-stat"><span>Värde</span><strong>${money(p.value,p.currency)}</strong></div><div class="detail-stat"><span>Sannolikhet</span><strong>${p.probability} %</strong></div></div><div class="calc-preview"><div><span>Artiklar</span><strong>${articles.length}</strong></div><div><span>Total yta</span><strong>${decimal(totalArea)} m²</strong></div><div><span>Produktionskostnad</span><strong>${money(productionCost)}</strong></div></div>${p.businessStatus==="Vunnet"?`<div class="acceptance-box"><h3>Vunnen affär</h3><div class="acceptance-grid"><div><span>Accepterad</span><strong>${date(p.acceptedAt)}</strong></div><div><span>Accepterad offert</span><strong>${p.acceptedQuoteId||"—"} V${p.acceptedQuoteVersion||"—"}</strong></div><div><span>Leveransstatus</span><strong>${p.deliveryStatus||"Väntar orderunderlag"}</strong></div></div></div>`:`<p class="article-form-note">Nästa steg: registrera projektets artiklar och leverantörens pris/kvm. Storleksändringar räknas om automatiskt och följer med till nästa offertversion.</p>`}`;
    openModal(`<div class="modal-header"><div><h2 id="modalTitle">${p.name}</h2><p>${p.id} · ${p.customer}</p></div><div>${p.businessStatus==="Vunnet"?statusBadge("Vunnet"):""}<button class="modal-close" data-close>×</button></div></div><div class="modal-body"><div class="project-tabs"><button class="project-tab ${tab==="overview"?"active":""}" data-project-tab="overview" data-id="${p.id}">Översikt</button><button class="project-tab ${tab==="customer"?"active":""}" data-project-tab="customer" data-id="${p.id}">Kunduppgifter</button><button class="project-tab ${tab==="articles"?"active":""}" data-project-tab="articles" data-id="${p.id}">Artiklar (${articles.length})</button><button class="project-tab ${tab==="calculation"?"active":""}" data-project-tab="calculation" data-id="${p.id}">Kalkyl</button><button class="project-tab ${tab==="quotes"?"active":""}" data-project-tab="quotes" data-id="${p.id}">Offerter (${versions.length})</button>${p.businessStatus==="Vunnet"?`<button class="project-tab ${tab==="delivery"?"active":""}" data-project-tab="delivery" data-id="${p.id}">Order & leverans</button>`:""}</div><div class="project-tab-content">${content}</div></div>${tab!=="delivery"?`<div class="modal-footer"><button class="button secondary" data-close>Stäng</button>${tab==="overview" ? `<button class="button primary" data-project-tab="articles" data-id="${p.id}">Visa artiklar</button>` : ""}</div>`:""}`);
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

  function articleForm(article = {}, forcedProjectId = "") {
    const projectId=forcedProjectId || article.projectId || state.projects[0]?.id || "";
    const status=article.status || "Förfrågan";
    const currentManufacturer=article.manufacturerId || "";
    const legacyManufacturer=article.manufacturer && article.manufacturer!=="—" ? article.manufacturer : "";
    const manufacturerOptions = `<option value="">— Välj tillverkare —</option>` + state.manufacturers.filter(m=>m.active!==false || m.id===currentManufacturer).map(m=>`<option value="${m.id}" ${m.id===currentManufacturer || (!currentManufacturer && m.name===legacyManufacturer)?"selected":""}>${esc(m.name)}</option>`).join("");
    return `<div class="form-grid">
      <label class="field"><span>Projekt *</span><select name="projectId" required>${state.projects.map(p=>`<option value="${p.id}" ${p.id===projectId?"selected":""}>${p.id} · ${p.name}</option>`).join("")}</select></label><label class="field"><span>Prisstatus</span><select name="status"><option ${status==="Förfrågan"?"selected":""}>Förfrågan</option><option ${status==="Förhandlas"?"selected":""}>Förhandlas</option><option ${status==="Godkänt"?"selected":""}>Godkänt</option></select></label>
      <label class="field"><span>Benämning *</span><input name="name" required value="${article.name||""}" placeholder="Exempel: Lobby Rug"></label><label class="field"><span>Antal</span><input name="quantity" data-article-calc type="number" min="1" step="1" value="${article.quantity||1}"></label><label class="field"><span>Placering</span><input name="location" value="${article.location||""}" placeholder="Exempel: Main lobby"></label>
      <label class="field"><span>Form</span><select name="shape" data-article-calc><option ${article.shape==="Rektangulär"?"selected":""}>Rektangulär</option><option ${article.shape==="Rund"?"selected":""}>Rund</option><option ${article.shape==="Specialform"?"selected":""}>Specialform</option></select></label><label class="field"><span>Tillverkare</span><select name="manufacturerId">${manufacturerOptions}</select></label>
      <label class="field"><span>Bredd/diameter, cm</span><input name="widthCm" data-article-calc type="number" min="0" step="1" value="${article.widthCm||""}"></label><label class="field"><span>Längd, cm</span><input name="lengthCm" data-article-calc type="number" min="0" step="1" value="${article.lengthCm||""}"></label>
      <label class="field"><span>Manuell yta för specialform, m²</span><input name="manualArea" data-article-calc type="number" min="0" step="0.01" value="${article.manualArea||""}"></label><label class="field"><span>Valuta</span><select name="currency"><option ${article.currency!=="USD"?"selected":""}>EUR</option><option ${article.currency==="USD"?"selected":""}>USD</option></select></label>
      <label class="field"><span>Prisenhet</span><select name="priceUnit" data-article-calc><option ${article.priceUnit!=="per styck" && article.priceUnit!=="fast pris"?"selected":""}>per m²</option><option ${article.priceUnit==="per styck"?"selected":""}>per styck</option><option ${article.priceUnit==="fast pris"?"selected":""}>fast pris</option></select></label><label class="field"><span>Aktuellt produktionspris</span><input name="pricePerSqm" data-article-calc type="number" min="0" step="0.01" value="${article.pricePerSqm||""}"></label><label class="field"><span>Övrig kostnad</span><input name="additionalCost" data-article-calc type="number" min="0" step="0.01" value="${article.additionalCost||""}"></label>
    </div><div class="calc-preview" id="articleCalcPreview"><div><span>Beräknad yta</span><strong data-preview-area>0,00 m²</strong></div><div><span>Produktionspris</span><strong data-preview-price>€0</strong></div><div><span>Produktionskostnad totalt</span><strong data-preview-cost>€0</strong></div></div>`;
  }

  function bindArticleCalculation(form) {
    const update=()=>{ const values=Object.fromEntries(new FormData(form)); const draft={shape:values.shape,widthCm:Number(values.widthCm),lengthCm:Number(values.lengthCm),manualArea:Number(values.manualArea),pricePerSqm:Number(values.pricePerSqm),priceUnit:values.priceUnit||"per m²",additionalCost:Number(values.additionalCost),quantity:Number(values.quantity)||1}; $("[data-preview-area]",form).textContent=`${decimal(articleArea(draft))} m²`; $("[data-preview-price]",form).textContent=money(draft.pricePerSqm,values.currency); $("[data-preview-cost]",form).textContent=money(articleCost(draft),values.currency); };
    $$('[data-article-calc], select[name="currency"], select[name="priceUnit"]',form).forEach(el=>el.addEventListener("input",update)); update();
  }

  function openNewArticle(projectId = "", defaults = {}) {
    openModal(`<form id="articleForm" ${defaults.sourceScopeId?`data-source-scope-id="${esc(defaults.sourceScopeId)}"`:""}><div class="modal-header"><div><h2 id="modalTitle">Ny projektartikel</h2><p>Artikeln kopplas till ett projekt och får ett automatiskt artikelnummer.</p></div><button type="button" class="modal-close" data-close>×</button></div><div class="modal-body">${articleForm(defaults,projectId)}<p class="article-form-note">För rektangulär matta beräknas ytan som bredd × längd. För rund matta används diametern. Specialform använder den manuellt angivna ytan.</p></div><div class="modal-footer"><button type="button" class="button secondary" data-close>Avbryt</button><button class="button primary">Spara artikel</button></div></form>`);
    bindArticleCalculation($("#articleForm"));
  }

  function openEditArticle(id) {
    const article=state.articles.find(a=>a.id===id); if(!article) return;
    openModal(`<form id="articleForm" data-edit-id="${id}"><div class="modal-header"><div><h2 id="modalTitle">Ändra artikel</h2><p>${article.code} · Ändrad storlek räknar om kostnaden direkt.</p></div><button type="button" class="modal-close" data-close>×</button></div><div class="modal-body">${articleForm(article)}</div><div class="modal-footer"><button type="button" class="button secondary" data-close>Avbryt</button><button class="button primary">Spara ändringar</button></div></form>`);
    bindArticleCalculation($("#articleForm"));
  }

  function openArticle(id) {
    const article=state.articles.find(a=>a.id===id); if(!article) return; const project=state.projects.find(p=>p.id===article.projectId);
    openModal(`<div class="modal-header"><div><h2 id="modalTitle">${article.name}</h2><p>${article.code} · ${project?.name||article.projectId}</p></div><button class="modal-close" data-close>×</button></div><div class="modal-body"><div class="detail-top"><div><span class="detail-id">${article.code}</span><div class="detail-title">${articleSize(article)}</div><div class="detail-sub">${article.location||"Ingen placering"} · ${article.manufacturer||"Ingen tillverkare"}</div></div>${statusBadge(article.status)}</div><div class="calc-preview"><div><span>Beräknad yta</span><strong>${decimal(articleArea(article))} m²</strong></div><div><span>Godkänt produktionspris</span><strong>${article.pricePerSqm?`${money(article.pricePerSqm,article.currency)}${priceUnitLabel(article.priceUnit)}`:"—"}</strong></div><div><span>Produktionskostnad</span><strong>${money(articleCost(article),article.currency)}</strong></div></div><div class="price-history"><div class="section-action"><h3>Prisförhandling med tillverkare</h3><button class="button secondary" data-new-price="${article.id}">＋ Nytt pris</button></div>${article.priceHistory.length ? [...article.priceHistory].reverse().map(price=>`<div class="price-entry"><time>${date(price.date)}</time><span><strong>${price.manufacturer}</strong><span class="cell-secondary">Giltigt till ${date(price.validUntil)}</span></span><strong>${money(price.pricePerSqm,price.currency)}${priceUnitLabel(price.priceUnit)}</strong>${statusBadge(price.status)}</div>`).join("") : `<p class="detail-sub">Inga priser registrerade ännu.</p>`}</div></div><div class="modal-footer"><button class="button secondary" data-project-tab="articles" data-id="${article.projectId}">Till projektet</button><button class="button primary" data-edit-article="${article.id}">Ändra artikel/storlek</button></div>`);
  }

  function openNewPrice(id) {
    const article=state.articles.find(a=>a.id===id); if(!article) return;
    const manufacturerOptions = `<option value="">— Välj tillverkare —</option>` + state.manufacturers.filter(m=>m.active!==false || m.id===article.manufacturerId).map(m=>`<option value="${m.id}" ${m.id===article.manufacturerId || (!article.manufacturerId && m.name===article.manufacturer)?"selected":""}>${esc(m.name)}</option>`).join("");
    openModal(`<form id="priceForm" data-article-id="${id}"><div class="modal-header"><div><h2 id="modalTitle">Nytt leverantörspris</h2><p>${article.code} · ${article.name}</p></div><button type="button" class="modal-close" data-close>×</button></div><div class="modal-body"><div class="form-grid"><label class="field"><span>Datum</span><input name="date" type="date" required value="${new Date().toISOString().slice(0,10)}"></label><label class="field"><span>Tillverkare *</span><select name="manufacturerId" required>${manufacturerOptions}</select></label><label class="field"><span>Pris *</span><input name="pricePerSqm" required type="number" min="0" step="0.01" value="${article.pricePerSqm||""}"></label><label class="field"><span>Prisenhet</span><select name="priceUnit"><option ${article.priceUnit!=="per styck"&&article.priceUnit!=="fast pris"?"selected":""}>per m²</option><option ${article.priceUnit==="per styck"?"selected":""}>per styck</option><option ${article.priceUnit==="fast pris"?"selected":""}>fast pris</option></select></label><label class="field"><span>Valuta</span><select name="currency"><option ${article.currency!=="USD"?"selected":""}>EUR</option><option ${article.currency==="USD"?"selected":""}>USD</option></select></label><label class="field"><span>Giltigt till</span><input name="validUntil" type="date"></label><label class="field"><span>Prisstatus</span><select name="priceStatus"><option>Förfrågan</option><option>Förhandlas</option><option>Godkänt</option></select></label></div><p class="article-form-note">Godkänt pris blir artikelns aktuella produktionspris och får godkännandedatum automatiskt.</p></div><div class="modal-footer"><button type="button" class="button secondary" data-article-id="${id}">Avbryt</button><button class="button primary">Spara pris</button></div></form>`);
  }

  function articleSnapshot(article) { return { articleId:article.id, code:article.code, name:article.name, quantity:Number(article.quantity)||1, location:article.location, shape:article.shape, widthCm:article.widthCm, lengthCm:article.lengthCm, area:articleArea(article), totalArea:articleTotalArea(article), manufacturer:article.manufacturer, manufacturerId:article.manufacturerId||"", currency:article.currency, pricePerSqm:article.pricePerSqm, priceUnit:article.priceUnit||"per m²", status:article.status, additionalCost:article.additionalCost, unitCost:articleUnitCost(article), cost:articleCost(article) }; }

  function saveCalculationFromForm(projectId, quiet=false) {
    const p=state.projects.find(x=>x.id===projectId); const form=$("#calculationForm"); if(!p||!form) return null;
    const v=Object.fromEntries(new FormData(form));
    p.calculation={deliveryTerm:v.deliveryTerm||"DAP",destination:v.destination||"",freightCost:Number(v.freightCost)||0,dutyCost:Number(v.dutyCost)||0,importVatCost:Number(v.importVatCost)||0,otherImportCost:Number(v.otherImportCost)||0,includeImportVatInCost:form.elements.includeImportVatInCost?.checked||false,targetMargin:Number(v.targetMargin)||0,freightPresentation:v.freightPresentation||"Separat rad",customerFreight:Number(v.customerFreight)||0,validityDays:Number(v.validityDays)||30,paymentTerms:v.paymentTerms||"",deliveryTime:v.deliveryTime||"",notes:v.notes||""};
    const pc=projectCalculation(p,state.articles.filter(a=>a.projectId===projectId)); p.value=Math.round(pc.salesPrice); saveState(); renderAll(); if(!quiet) toast("Kalkylen har sparats."); return pc;
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
      if (box) box.innerHTML = `<div><span>Produktionskostnad</span><strong>${money(pc.productionCost,p.currency)}</strong></div><div><span>Frakt</span><strong>${money(pc.freightCost,p.currency)}</strong></div><div><span>Tull/import</span><strong>${money(pc.dutyCost+pc.importVatCost+pc.otherImportCost,p.currency)}</strong></div><div><span>Total kostnad</span><strong>${money(pc.totalCost,p.currency)}</strong></div><div><span>Bruttovinst</span><strong>${money(pc.grossProfit,p.currency)}</strong></div><div class="calc-total"><span>Beräknat offertpris</span><strong>${money(pc.salesPrice,p.currency)}</strong><small>${decimal(pc.margin)} % marginal</small></div>`;
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

  function addQuoteVersion(projectId) {
    const p=state.projects.find(x=>x.id===projectId); if(!p) return; saveCalculationFromForm(projectId,true); const articles=state.articles.filter(a=>a.projectId===projectId); if(!articles.length){toast("Lägg till minst en artikel innan offert skapas.");return;} const existing=state.quotations.filter(q=>q.projectId===projectId); const version=Math.max(0,...existing.map(q=>q.version))+1; existing.filter(q=>q.status==="Utkast").forEach(q=>q.status="Ersatt"); const articleSnapshots=articles.map(articleSnapshot); const pc=projectCalculation(p,articles); const calcSnapshot=JSON.parse(JSON.stringify(p.calculation||{})); state.quotations.push({id:`Q-${projectId.slice(2)}`,projectId,project:p.name,version,amount:Math.round(pc.salesPrice),margin:pc.margin,status:"Utkast",created:new Date().toISOString().slice(0,10),articleSnapshots,calculationSnapshot:calcSnapshot,costSnapshot:pc,companySnapshot:JSON.parse(JSON.stringify(state.company||{})),customerSnapshot:customerSnapshot(p)}); p.value=Math.round(pc.salesPrice); saveState(); renderAll(); openProject(projectId,"quotes"); toast(`Offertversion V${version} skapad. Kalkylen är fryst i versionen.`);
  }

  function previewQuoteFromCalculation(projectId) {
    const p=state.projects.find(x=>x.id===projectId); const form=$("#calculationForm"); if(!p||!form) return;
    const articles=state.articles.filter(a=>a.projectId===projectId); if(!articles.length){toast("Lägg till minst en artikel innan offert kan förhandsgranskas.");return;}
    const v=Object.fromEntries(new FormData(form));
    const previewCalc={deliveryTerm:v.deliveryTerm||"DAP",destination:v.destination||"",freightCost:Number(v.freightCost)||0,dutyCost:Number(v.dutyCost)||0,importVatCost:Number(v.importVatCost)||0,otherImportCost:Number(v.otherImportCost)||0,includeImportVatInCost:form.elements.includeImportVatInCost?.checked||false,targetMargin:Number(v.targetMargin)||0,freightPresentation:v.freightPresentation||"Separat rad",customerFreight:Number(v.customerFreight)||0,validityDays:Number(v.validityDays)||30,paymentTerms:v.paymentTerms||"",deliveryTime:v.deliveryTime||"",notes:v.notes||""};
    const tempProject={...p,calculation:previewCalc};
    const pc=projectCalculation(tempProject,articles);
    const q={id:"PREVIEW",projectId:p.id,project:p.name,version:"—",amount:Math.round(pc.salesPrice),margin:pc.margin,status:"Utkast",created:new Date().toISOString().slice(0,10),articleSnapshots:articles.map(articleSnapshot),calculationSnapshot:previewCalc,costSnapshot:pc,companySnapshot:JSON.parse(JSON.stringify(state.company||{})),customerSnapshot:customerSnapshot(p),isPreview:true};
    renderQuotePdf(q,p,{autoPrint:false,preview:true});
  }

  function findQuote(id, version) { return state.quotations.find(q=>q.id===id && q.version===Number(version)); }

  function openQuote(id, version) {
    const q=findQuote(id,version); if(!q) return; const project=state.projects.find(p=>p.id===q.projectId); const snapshots=q.articleSnapshots||[]; const productionCost=snapshots.reduce((s,a)=>s+(a.cost||0),0); const cs=q.costSnapshot||{}; const calc=q.calculationSnapshot||{};
    const articleTable=snapshots.length?`<div class="table-scroll"><table><thead><tr><th>Artikel</th><th>Benämning</th><th>Storlek</th><th>Kvm</th><th>Pris/kvm</th><th>Kostnad</th></tr></thead><tbody>${snapshots.map(a=>`<tr><td>${a.code}</td><td><span class="cell-primary">${a.name}</span><span class="cell-secondary">${a.location||"—"}</span></td><td>${a.shape==="Rund"?`Ø ${a.widthCm} cm`:`${a.widthCm} × ${a.lengthCm} cm`}</td><td>${decimal(a.area)}</td><td>${money(a.pricePerSqm,a.currency)}/m²</td><td class="cost-value">${money(a.cost,a.currency)}</td></tr>`).join("")}</tbody></table></div>`:`<p class="detail-sub">Den här äldre exempelversionen saknar artikelsnapshot.</p>`;
    const acceptance=q.status==="Accepterad"?`<div class="acceptance-box"><h3>Accepterad offert</h3><div class="acceptance-grid"><div><span>Accepterad</span><strong>${date(q.acceptedAt)}</strong></div><div><span>Accepterad av</span><strong>${q.acceptedBy||"—"}</strong></div><div><span>Metod</span><strong>${q.acceptanceMethod||"—"}</strong></div><div><span>PO-nummer</span><strong>${q.poNumber||"—"}</strong></div><div><span>Leverans</span><strong>${date(q.deliveryDate)}</strong></div><div><span>Leveransstatus</span><strong>${project?.deliveryStatus||"Väntar orderunderlag"}</strong></div></div>${q.acceptanceComment?`<p class="detail-sub" style="margin:12px 0 0">${q.acceptanceComment}</p>`:""}<div class="locked-note">Offertversionen är låst och kan inte ändras.</div></div>`:"";
    let actions="";
    if(q.status==="Utkast") actions=`<button class="button primary" data-mark-sent="${q.id}" data-version="${q.version}">Markera som skickad</button>`;
    else if(q.status==="Skickad") actions=`<button class="button danger" data-mark-declined="${q.id}" data-version="${q.version}">Markera avböjd</button><button class="button primary" data-accept-quote="${q.id}" data-version="${q.version}">✓ Markera som accepterad</button>`;
    else if(q.status==="Accepterad") actions=`<button class="button primary" data-project-tab="delivery" data-id="${q.projectId}">Följ order & leverans</button>`;
    openModal(`<div class="modal-header"><div><h2 id="modalTitle">${q.id} · V${q.version}</h2><p>${q.project} · skapad ${date(q.created)}</p></div><div>${statusBadge(q.status)}<button class="modal-close" data-close>×</button></div></div><div class="modal-body"><div class="detail-grid"><div class="detail-stat"><span>Offertbelopp</span><strong>${money(q.amount)}</strong></div><div class="detail-stat"><span>Marginal</span><strong>${decimal(q.margin)} %</strong></div><div class="detail-stat"><span>Produktionskostnad</span><strong>${snapshots.length?money(productionCost):"—"}</strong></div><div class="detail-stat"><span>Leverans</span><strong>${calc.deliveryTerm||"—"}</strong></div><div class="detail-stat"><span>Total kalkylkostnad</span><strong>${cs.totalCost!=null?money(cs.totalCost):"—"}</strong></div></div><div class="section-action"><h3>Artiklar i denna version</h3><span class="cell-secondary">${snapshots.length} artiklar · fryst ögonblicksbild</span></div>${articleTable}${acceptance}</div><div class="modal-footer split"><div class="modal-footer-group"><button class="button secondary" data-export-quote-excel="${q.id}" data-version="${q.version}">Excel</button><button class="button secondary" data-export-quote-pdf="${q.id}" data-version="${q.version}">PDF / Skriv ut</button></div><div class="modal-footer-group">${actions}<button class="button secondary" data-close>Stäng</button></div></div>`);
  }

  function openAcceptanceForm(id, version) {
    const q=findQuote(id,version); if(!q) return; const project=state.projects.find(p=>p.id===q.projectId);
    openModal(`<form id="acceptanceForm" data-quote-id="${q.id}" data-version="${q.version}"><div class="modal-header"><div><h2 id="modalTitle">Acceptera ${q.id} · V${q.version}</h2><p>Offerten låses och projektet ändras till Vunnet.</p></div><button type="button" class="modal-close" data-close>×</button></div><div class="modal-body"><div class="form-grid"><label class="field"><span>Acceptdatum *</span><input name="acceptedAt" type="date" required value="${new Date().toISOString().slice(0,10)}"></label><label class="field"><span>Accepterad av *</span><input name="acceptedBy" required placeholder="Kundens kontaktperson"></label><label class="field"><span>Acceptansmetod</span><select name="acceptanceMethod"><option>Signerad offert</option><option>E-post</option><option>Kundportal</option><option>Inköpsorder</option></select></label><label class="field"><span>Kundens PO-nummer</span><input name="poNumber"></label><label class="field"><span>Accepterat belopp</span><input name="amount" type="number" min="0" step="0.01" value="${q.amount}"></label><label class="field"><span>Preliminär leverans</span><input name="deliveryDate" type="date" value="${project?.deliveryDate||""}"></label><label class="field full"><span>Kommentar</span><textarea name="acceptanceComment"></textarea></label></div><p class="article-form-note">När du sparar markeras andra pågående offertversioner för projektet som Ersatta. Den accepterade versionen kan därefter inte redigeras.</p></div><div class="modal-footer"><button type="button" class="button secondary" data-quote-id="${q.id}" data-version="${q.version}">Avbryt</button><button class="button primary">Bekräfta acceptans</button></div></form>`);
  }

  function markQuoteSent(id, version) { const q=findQuote(id,version); if(!q||q.status!=="Utkast") return; q.status="Skickad"; const project=state.projects.find(p=>p.id===q.projectId); if(project){project.phase="Offert skickad";project.next="Följ upp skickad offert";} saveState(); renderAll(); openQuote(id,version); toast("Offerten har markerats som skickad."); }
  function markQuoteDeclined(id, version) { const q=findQuote(id,version); if(!q) return; q.status="Avböjd"; state.quotations.filter(other=>other.projectId===q.projectId && other!==q && ["Utkast","Intern granskning","Skickad","Revidering begärd"].includes(other.status)).forEach(other=>other.status="Ersatt"); const project=state.projects.find(p=>p.id===q.projectId); if(project){project.businessStatus="Förlorat";project.phase="Förlorat";project.probability=0;project.next="Registrera förlustorsak";} saveState(); renderAll(); closeModal(); quotationFilter="lost"; showView("quotations"); renderQuotations(); toast("Offerten har markerats som avböjd och projektet som förlorat."); }

  function quoteCustomerRows(q) {
    const snaps=q.articleSnapshots||[]; const totalCost=snaps.reduce((s,a)=>s+(Number(a.cost)||0),0); const calc=q.calculationSnapshot||{}; const freightShown=calc.freightPresentation==="Separat rad" ? Number(calc.customerFreight)||0 : 0; const productRevenue=Math.max(0,(Number(q.amount)||0)-freightShown); return snaps.map(a=>{const share=totalCost>0?(Number(a.cost)||0)/totalCost:(snaps.length?1/snaps.length:0); return {...a,salesTotal:productRevenue*share,salesUnit:(productRevenue*share)/(Number(a.quantity)||1)};});
  }
  function quotePartyData(q,p) {
    const company={...(state.company||{}),...(q.companySnapshot||{})};
    const customer=q.customerSnapshot||customerSnapshot(p); return {company,customer};
  }
  function addDaysIso(iso,days){ const d=new Date(`${iso}T12:00:00`); d.setDate(d.getDate()+(Number(days)||0)); return d.toISOString().slice(0,10); }
  function exportQuoteExcel(id,version){
    const q=findQuote(id,version); if(!q)return; const p=state.projects.find(x=>x.id===q.projectId); const rows=quoteCustomerRows(q); const calc=q.calculationSnapshot||{}; const {company,customer}=quotePartyData(q,p); const b=customer.billing||{}, d=customer.delivery||{};
    const escXml=v=>String(v??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); const tr=(cells)=>`<tr>${cells.map(c=>`<td>${escXml(c)}</td>`).join("")}</tr>`;
    const html=`<html><head><meta charset="utf-8"></head><body><table><tr><th colspan="6">${escXml(company.name||"Cappelen Dimyr Projects AB")} - QUOTATION ${q.id} V${q.version}</th></tr>${tr(["Date",q.created,"Valid until",addDaysIso(q.created,calc.validityDays||30),"Currency",p?.currency||"EUR"])}${tr(["Org no",company.orgNumber||"","VAT",company.vatNumber||"","EORI",company.eori||""])}${tr(["IBAN",company.iban||"","BIC/SWIFT",company.bic||"","Delivery",`${calc.deliveryTerm||""} ${calc.destination||""}`])}${tr(["BILL TO",b.name||p?.customer||"","SHIP TO",d.name||p?.customer||"","Project",q.project])}${tr(["Address",b.address||"","Address",d.address||"","",""])}${tr(["ZIP / City",`${b.zip||""} ${b.city||""}`,"ZIP / City",`${d.zip||""} ${d.city||""}`,"",""])}${tr(["Country",b.country||"","Country",d.country||"","",""])}${tr(["Article","Description","Qty","Size","Unit price","Total"])}${rows.map(r=>tr([r.code,r.name,r.quantity||1,r.shape==="Rund"?`Ø ${r.widthCm} cm`:`${r.widthCm} x ${r.lengthCm} cm`,r.salesUnit.toFixed(2),r.salesTotal.toFixed(2)])).join("")}${calc.freightPresentation==="Separat rad"?tr(["Freight","",1,"","",Number(calc.customerFreight||0).toFixed(2)]):""}${tr(["TOTAL","","","","",Number(q.amount||0).toFixed(2)])}${tr(["Payment terms",calc.paymentTerms||"","Delivery time",calc.deliveryTime||"","Validity",`${calc.validityDays||30} days`])}</table></body></html>`;
    const blob=new Blob([html],{type:"application/vnd.ms-excel;charset=utf-8"}); const a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download=`${q.id}_V${q.version}.xls`; a.click(); URL.revokeObjectURL(a.href);
  }
  function exportQuotePdf(id,version){
    const q=findQuote(id,version); if(!q)return; const p=state.projects.find(x=>x.id===q.projectId); renderQuotePdf(q,p,{autoPrint:true,preview:false});
  }

  function renderQuotePdf(q,p,{autoPrint=true,preview=false}={}){
    const rows=quoteCustomerRows(q); const calc=q.calculationSnapshot||{}; const {company,customer}=quotePartyData(q,p); const b=customer.billing||{}, d=customer.delivery||{}; const currency=p?.currency||"EUR"; const validUntil=addDaysIso(q.created,calc.validityDays||30);
    const addr=x=>[x.name,x.address,[x.zip,x.city].filter(Boolean).join(" "),x.country].filter(Boolean).map(esc).join("<br>");
    const seller=[company.name,company.address,[company.zip,company.city].filter(Boolean).join(" "),company.country].filter(Boolean).map(esc).join("<br>");
    const ddpText=calc.deliveryTerm==="DDP"?"Freight, customs duties and import charges are included according to the delivery terms stated above.":"Import duties, taxes and customs clearance at destination are not included and are the responsibility of the buyer.";
    const title=preview?"QUOTATION PREVIEW":"QUOTATION"; const quoteNo=preview?"PREVIEW":q.id; const versionText=preview?"—":q.version;
    const w=window.open("","_blank"); if(!w){toast("Tillåt popup-fönster för offertvisning.");return;}
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
      renderAll(); closeModal(); showView("leads"); toast(editId ? "Leadet har uppdaterats." : "Leadet har lagts till."); return;
    }
    if(event.target.id === "newInquiryForm") {
      event.preventDefault();
      saveNewInquiryForm(event.target);
      return;
    }
    if(event.target.id === "inquiryCustomerForm") {
      event.preventDefault(); const v=Object.fromEntries(new FormData(event.target)); const i=state.inquiries.find(x=>x.id===event.target.dataset.inquiryId); if(!i)return;
      i.customerData={name:v.name||i.customer||"",contact:v.contact||"",email:v.email||"",phone:v.phone||"",address:v.address||"",zip:v.zip||"",city:v.city||"",country:v.country||i.country||"",vatNumber:v.vatNumber||""};
      i.customer=i.customerData.name||i.customer; i.country=i.customerData.country||i.country; saveState(); renderAll(); openInquiry(i.id,"customer"); toast("Kunduppgifterna har sparats."); return;
    }
    if(event.target.id === "inquiryScopeForm") {
      event.preventDefault(); const i=state.inquiries.find(x=>x.id===event.target.dataset.inquiryId); if(!i)return;
      const rows=[]; $$('[data-scope-row]',event.target).forEach((tr,index)=>{ const q=n=>$(n,tr)?.value||""; const description=q('[name="scopeDescription"]'); const width=Number(q('[name="scopeWidth"]'))||0; const length=Number(q('[name="scopeLength"]'))||0; const comment=q('[name="scopeComment"]'); if(!description && !width && !length && !comment && index>0)return; rows.push({id:q('[name="scopeId"]')||`SCOPE-${i.id}-${String(index+1).padStart(2,"0")}`,type:q('[name="scopeType"]')||"Rug",description,quantity:Math.max(1,Number(q('[name="scopeQuantity"]'))||1),widthCm:width,lengthCm:length,comment,convertedArticleId:null}); });
      i.preliminaryScope=rows; i.area=rows.reduce((sum,row)=>sum+scopeRowArea(row),0); saveState(); renderAll(); openInquiry(i.id,"scope"); toast("Den preliminära omfattningen har sparats."); return;
    }
    if(event.target.id === "manufacturerForm") {
      event.preventDefault(); const v=Object.fromEntries(new FormData(event.target)); const editId=event.target.dataset.editId;
      if(editId){ const m=state.manufacturers.find(x=>x.id===editId); if(m){ const oldName=m.name; Object.assign(m,{name:v.name,country:v.country||"",contact:v.contact||"",email:v.email||"",phone:v.phone||"",currency:v.currency||"EUR",active:event.target.elements.active?.checked||false}); state.articles.filter(a=>a.manufacturerId===m.id || (!a.manufacturerId && a.manufacturer===oldName)).forEach(a=>{a.manufacturerId=m.id;a.manufacturer=m.name;}); } }
      else { const n=Math.max(0,...state.manufacturers.map(m=>Number(String(m.id||"").split("-").pop())||0))+1; state.manufacturers.push({id:`MFG-${String(n).padStart(4,"0")}`,name:v.name,country:v.country||"",contact:v.contact||"",email:v.email||"",phone:v.phone||"",currency:v.currency||"EUR",active:event.target.elements.active?.checked!==false}); }
      saveState(); renderAll(); closeModal(); showView("manufacturers"); toast(editId?"Tillverkaren har uppdaterats.":"Tillverkaren har lagts till."); return;
    }
    if(event.target.id === "companySettingsForm") {
      event.preventDefault(); const v=Object.fromEntries(new FormData(event.target)); state.company={...state.company,...v}; saveState(); renderSettings(); toast("Företagsuppgifterna har sparats."); return;
    }
    if(event.target.id === "projectCustomerForm") {
      event.preventDefault(); const v=Object.fromEntries(new FormData(event.target)); const p=state.projects.find(x=>x.id===event.target.dataset.projectId); if(!p)return;
      const same=event.target.elements.sameAsBilling?.checked||false; const billing={name:v.billingName||"",address:v.billingAddress||"",zip:v.billingZip||"",city:v.billingCity||"",country:v.billingCountry||"",vatNumber:v.billingVatNumber||"",contact:v.billingContact||"",email:v.billingEmail||""};
      const delivery=same?{name:billing.name,address:billing.address,zip:billing.zip,city:billing.city,country:billing.country,contact:v.deliveryContact||"",phone:v.deliveryPhone||""}:{name:v.deliveryName||"",address:v.deliveryAddress||"",zip:v.deliveryZip||"",city:v.deliveryCity||"",country:v.deliveryCountry||"",contact:v.deliveryContact||"",phone:v.deliveryPhone||""};
      p.customer=billing.name||p.customer; p.country=billing.country||p.country; p.customerData={sameAsBilling:same,billing,delivery}; saveState(); renderAll(); openProject(p.id,"customer"); toast("Kund- och adressuppgifterna har sparats."); return;
    }
    if(event.target.id === "articleForm") {
      event.preventDefault(); const values=Object.fromEntries(new FormData(event.target)); const editId=event.target.dataset.editId;
      const manufacturer=state.manufacturers.find(m=>m.id===values.manufacturerId); const base={projectId:values.projectId,name:values.name,quantity:Number(values.quantity)||1,location:values.location,shape:values.shape,widthCm:Number(values.widthCm)||0,lengthCm:Number(values.lengthCm)||0,manualArea:Number(values.manualArea)||0,manufacturerId:values.manufacturerId||"",manufacturer:manufacturer?.name||"—",currency:values.currency,pricePerSqm:Number(values.pricePerSqm)||0,priceUnit:values.priceUnit||"per m²",additionalCost:Number(values.additionalCost)||0,status:values.status||"Förfrågan"}; if(base.status==="Godkänt"){base.approvedAt=new Date().toISOString().slice(0,10);base.approvedBy="DE";}
      if(editId) Object.assign(state.articles.find(a=>a.id===editId),base);
      else {
        const projectArticles=state.articles.filter(a=>a.projectId===values.projectId); const number=Math.max(0,...projectArticles.map(a=>Number(a.code.split("A").pop())))+1;
        const articleId=`ART-${String(Math.max(0,...state.articles.map(a=>Number(a.id.split("-").pop())))+1).padStart(4,"0")}`;
        state.articles.push({...base,id:articleId,code:`${values.projectId}-A${String(number).padStart(2,"0")}`,priceHistory:[]});
        const sourceScopeId=event.target.dataset.sourceScopeId; if(sourceScopeId){ const project=state.projects.find(p=>p.id===values.projectId); const scopeRow=project?.preliminaryScope?.find(r=>r.id===sourceScopeId); if(scopeRow) scopeRow.convertedArticleId=articleId; }
      }
      saveState(); renderAll(); closeModal(); if(event.target.dataset.sourceScopeId) { openProject(values.projectId,"articles"); } else { showView("articles"); } toast(editId ? "Artikeln har uppdaterats och kostnaden räknats om." : "Artikeln har lagts till."); return;
    }
    if(event.target.id === "priceForm") {
      event.preventDefault(); const values=Object.fromEntries(new FormData(event.target)); const article=state.articles.find(a=>a.id===event.target.dataset.articleId); const manufacturer=state.manufacturers.find(m=>m.id===values.manufacturerId); const price={id:`PRICE-${String(Date.now()).slice(-8)}`,date:values.date,manufacturerId:values.manufacturerId||"",manufacturer:manufacturer?.name||"—",pricePerSqm:Number(values.pricePerSqm),priceUnit:values.priceUnit||"per m²",currency:values.currency,validUntil:values.validUntil,status:values.priceStatus};
      article.priceHistory.push(price); article.manufacturerId=price.manufacturerId; article.manufacturer=price.manufacturer;
      if(price.status==="Godkänt") { article.pricePerSqm=price.pricePerSqm; article.priceUnit=price.priceUnit; article.currency=price.currency; article.status="Godkänt"; article.approvedAt=values.date||new Date().toISOString().slice(0,10); article.approvedBy="DE"; }
      else { article.pricePerSqm=price.pricePerSqm; article.priceUnit=price.priceUnit; article.currency=price.currency; article.status=price.status; }
      saveState(); renderAll(); openArticle(article.id); toast("Leverantörspriset har sparats i historiken.");
      return;
    }
    if(event.target.id === "acceptanceForm") {
      event.preventDefault(); const values=Object.fromEntries(new FormData(event.target)); const q=findQuote(event.target.dataset.quoteId,event.target.dataset.version); if(!q) return;
      state.quotations.filter(other=>other.projectId===q.projectId && other!==q && ["Utkast","Intern granskning","Skickad","Revidering begärd"].includes(other.status)).forEach(other=>other.status="Ersatt");
      q.status="Accepterad"; q.acceptedAt=values.acceptedAt; q.acceptedBy=values.acceptedBy; q.acceptanceMethod=values.acceptanceMethod; q.poNumber=values.poNumber; q.amount=Number(values.amount)||q.amount; q.deliveryDate=values.deliveryDate; q.acceptanceComment=values.acceptanceComment;
      const project=state.projects.find(p=>p.id===q.projectId);
      if(project){ project.businessStatus="Vunnet"; project.phase="Vunnet"; project.probability=100; project.value=q.amount; project.acceptedAt=q.acceptedAt; project.acceptedBy=q.acceptedBy; project.acceptanceMethod=q.acceptanceMethod; project.acceptedQuoteId=q.id; project.acceptedQuoteVersion=q.version; project.poNumber=q.poNumber; project.deliveryDate=q.deliveryDate; project.deliveryStatus="Väntar orderunderlag"; project.next="Inväntar orderunderlag"; const agent=state.agents.find(a=>a.name===project.agent); project.commissionEstimate=agent?q.amount*agent.commission/100:0; }
      saveState(); renderAll(); quotationFilter="accepted"; showView("quotations"); renderQuotations(); openQuote(q.id,q.version); toast("Offerten är accepterad och projektet har markerats som Vunnet."); return;
    }
    if(event.target.id === "deliveryForm") {
      event.preventDefault(); const values=Object.fromEntries(new FormData(event.target)); const project=state.projects.find(p=>p.id===event.target.dataset.projectId); if(!project) return;
      project.deliveryStatus=values.deliveryStatus; project.deliveryDate=values.deliveryDate; project.poNumber=values.poNumber; project.next=values.next; project.deliveryComment=values.deliveryComment;
      saveState(); renderAll(); openProject(project.id,"delivery"); toast("Leveransuppföljningen har sparats.");
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
  window.CDPApp = Object.assign(window.CDPApp || {}, { openLeadForm, openNewInquiry, saveNewInquiryForm });

  document.addEventListener("click", event => {
    const target=event.target.closest("button,[data-target-view],.project-card[data-project-id],.won-card[data-project-id]"); if(!target) return;
    if(target.dataset.view) showView(target.dataset.view);
    if(target.dataset.targetView) showView(target.dataset.targetView);
    if(target.dataset.action==="new-lead") openLeadForm();
    if(target.dataset.action==="new-inquiry") openNewInquiry();
    if(target.dataset.saveNewInquiry !== undefined) {
      event.preventDefault();
      saveNewInquiryForm(target.closest("form"));
      return;
    }
    if(target.dataset.action==="new-article") openNewArticle();
    if(target.dataset.action==="new-agent") toast("Agentformuläret läggs till i nästa version.");
    if(target.dataset.action==="new-manufacturer") openManufacturerForm();
    if(target.dataset.editManufacturer) { const m=state.manufacturers.find(x=>x.id===target.dataset.editManufacturer); if(m) openManufacturerForm(m); }
    if(target.dataset.action==="export-projects") toast("Exportfunktionen förbereds för Excel/CSV.");
    if(target.dataset.close !== undefined) closeModal();
    if(target.dataset.leadFilter) { leadFilter=target.dataset.leadFilter; renderLeads(); }
    if(target.dataset.editLead) { const lead=state.leads.find(item=>item.id===target.dataset.editLead); if(lead?.status==="Aktivt") openLeadForm(lead); }
    if(target.dataset.convertLead) { const lead=state.leads.find(item=>item.id===target.dataset.convertLead); if(lead?.status==="Aktivt") openNewInquiry(lead); }
    if(target.dataset.deleteLead) confirmDeleteLead(target.dataset.deleteLead);
    if(target.dataset.confirmDeleteLead) { store.removeLead(target.dataset.confirmDeleteLead); renderAll(); closeModal(); showView("leads"); toast("Leadet har tagits bort."); }
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
    if(target.dataset.newPrice) openNewPrice(target.dataset.newPrice);
    if(target.dataset.decision==="go") { convertToProject(target.dataset.id); return; }
    if(target.dataset.decision==="no-go") { const i=state.inquiries.find(x=>x.id===target.dataset.id); if(!i)return; i.previousProbability=Number(i.probability)||0; i.status="No Go"; i.probability=0; i.decisionAt=new Date().toISOString().slice(0,10); i.history=Array.isArray(i.history)?i.history:[]; i.history.push({status:"No Go",date:i.decisionAt}); saveState(); inquiryMode="archive"; renderAll(); closeModal(); showView("inquiries"); toast("Förfrågan markerades som No Go och flyttades till Arkiv."); return; }
    if(target.dataset.reactivateInquiry) { const i=state.inquiries.find(x=>x.id===target.dataset.reactivateInquiry); if(!i || i.status!=="No Go")return; i.status="Bedöms"; i.probability=Number(i.previousProbability)||20; i.reactivatedAt=new Date().toISOString().slice(0,10); i.history=Array.isArray(i.history)?i.history:[]; i.history.push({status:"Bedöms",date:i.reactivatedAt,note:"Återaktiverad från No Go"}); saveState(); inquiryMode="active"; renderAll(); closeModal(); showView("inquiries"); toast("Förfrågan har återaktiverats och ligger åter under Aktiva."); return; }
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
    renderDashboardLeads(); toast("Kommentaren har sparats.");
  });
  $("#modalBackdrop")?.addEventListener("click", event => { if(event.target === event.currentTarget) closeModal(); });
  document.addEventListener("keydown", event => { if(event.key === "Escape") closeModal(); });
  $("#menuToggle")?.addEventListener("click",()=>$("#sidebar")?.classList.toggle("open"));
  document.addEventListener("input", event => { const form=event.target.closest?.("#inquiryScopeForm"); if(form && ["scopeQuantity","scopeWidth","scopeLength"].includes(event.target.name)) updateInquiryScopeSummary(form); });
  ["#inquirySearch","#inquiryStatusFilter","#inquirySourceFilter"].forEach(sel => $(sel)?.addEventListener(sel.includes("Search") ? "input" : "change",renderInquiries));
  ["#articleSearch","#articleProjectFilter","#articleStatusFilter"].forEach(sel => $(sel)?.addEventListener(sel.includes("Search") ? "input" : "change",renderArticles));
  $("#globalSearch")?.addEventListener("input", event => { if(event.target.value.length > 1) { showView("inquiries"); inquiryMode="active"; if($("#inquirySearch")) $("#inquirySearch").value=event.target.value; renderInquiries(); } });
  bindPrimaryActions();
  renderAll();
  bindPrimaryActions();
})();
