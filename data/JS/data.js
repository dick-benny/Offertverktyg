(() => {
  "use strict";

  const clone = value => JSON.parse(JSON.stringify(value));

  function createLocalStore(seed, options = {}) {
    const storageKey = options.storageKey || "cdp-projects-local";
    let state = load();

    function load() {
      const raw=localStorage.getItem(storageKey) ?? localStorage.getItem('cdp-prototype-state-v3');
      if(!raw)return normalize(clone(seed));
      let saved;
      try { saved=JSON.parse(raw); if(!saved || typeof saved!=='object' || Array.isArray(saved))throw Error(); }
      catch { document.body.textContent='Lagrade data kunde inte läsas. De har inte skrivits över. Återställ från din JSON-säkerhetskopia.'; throw Error('Invalid local data; refusing to overwrite'); }
      if(Number(saved.schemaVersion||0)<6 && !localStorage.getItem(storageKey+'-backup-before-v6'))localStorage.setItem(storageKey+'-backup-before-v6',raw);
      return normalize(saved);
    }

    function normalize(data) {
      ["leads", "inquiries", "projects", "articles", "quotations", "agents", "manufacturers"].forEach(key => {
        if (!Array.isArray(data[key])) data[key] = [];
      });
      // v5.14: additive migration; existing collections and meeting fields survive.
      if (!Array.isArray(data.meetings)) data.meetings = [];
      data.meetings.forEach(meeting => { if (meeting.leadId === undefined) meeting.leadId = null; });
      data.inquiries.forEach(inquiry => {
        const baseCustomer = { name: inquiry.customer || "", contact: "", email: "", phone: "", address: "", zip: "", city: "", country: inquiry.country || "", vatNumber: "" };
        inquiry.customerData = { ...baseCustomer, ...(inquiry.customerData || {}) };
        if (!Array.isArray(inquiry.preliminaryScope)) inquiry.preliminaryScope = [];
        inquiry.preliminaryScope = inquiry.preliminaryScope.map((row, index) => ({
          id: row.id || `SCOPE-${inquiry.id}-${String(index + 1).padStart(2, "0")}`,
          type: row.type || "Rug",
          description: row.description || "",
          quantity: Number(row.quantity) || 1,
          widthCm: Number(row.widthCm) || 0,
          lengthCm: Number(row.lengthCm) || 0,
          comment: row.comment || "",
          convertedArticleId: row.convertedArticleId || null
        }));
        if (!Array.isArray(inquiry.designFiles)) inquiry.designFiles = [];
        if (!Array.isArray(inquiry.history)) inquiry.history = [];
        if (["Go", "No Go"].includes(inquiry.status) && !inquiry.decisionAt) inquiry.decisionAt = inquiry.decision || "";
      });
      const defaultCompany = { name: "Cappelen Dimyr Projects AB", address: "Regementsgatan 8", zip: "211 42", city: "Malmö", country: "Sweden", orgNumber: "", vatNumber: "", eori: "", iban: "", bic: "", email: "", phone: "", web: "cappelendimyr.com" };
      data.company = { ...defaultCompany, ...(seed.company || {}), ...(data.company || {}) };
      data.quotations.forEach(quote => {
        if (!Array.isArray(quote.articleSnapshots)) quote.articleSnapshots = [];
        if (!quote.calculationSnapshot) quote.calculationSnapshot = null;
        if (!quote.companySnapshot) quote.companySnapshot = null;
        if (!quote.customerSnapshot) quote.customerSnapshot = null;
      });
      if (!Array.isArray(data.manufacturers)) data.manufacturers = clone(seed.manufacturers || []);
      const statusMap = { "Prisförfrågan": "Förfrågan", "Förhandling": "Förhandlas", "Pris godkänt": "Godkänt" };
      data.articles.forEach(article => {
        if (!Number.isFinite(Number(article.quantity)) || Number(article.quantity) < 1) article.quantity = 1;
        article.status = statusMap[article.status] || article.status || "Förfrågan";
        article.priceUnit = article.priceUnit || "per m²";
        const existing = data.manufacturers.find(m => m.id === article.manufacturerId || (article.manufacturer && article.manufacturer !== "—" && m.name === article.manufacturer));
        if (existing) { article.manufacturerId = existing.id; article.manufacturer = existing.name; }
        else if (article.manufacturer && article.manufacturer !== "—") {
          const n = Math.max(0, ...data.manufacturers.map(m => Number(String(m.id || "").split("-").pop()) || 0)) + 1;
          const created = { id: `MFG-${String(n).padStart(4, "0")}`, name: article.manufacturer, country: "", contact: "", email: "", phone: "", currency: article.currency || "EUR", active: true };
          data.manufacturers.push(created); article.manufacturerId = created.id;
        }
        if (!Array.isArray(article.priceHistory)) article.priceHistory = [];
        article.priceHistory.forEach(price => { price.priceUnit = price.priceUnit || "per m²"; if (price.status === "Förhandlat") price.status = "Förhandlas"; if (price.status === "Första pris") price.status = "Förfrågan"; });
      });
      // Backward-compatible migration: older localStorage data may lack projectId/sourceInquiryId.
      data.inquiries.forEach(inquiry => {
        if (inquiry.projectId && !data.projects.some(project => project.id === inquiry.projectId)) inquiry.projectId = null;
        if (!inquiry.projectId) {
          const linkedProject = data.projects.find(project => project.sourceInquiryId === inquiry.id);
          if (linkedProject) inquiry.projectId = linkedProject.id;
        }
      });
      data.projects.forEach(project => {
        // v5.4 migration: Kvalificerat has been removed. Go projects start directly in Kalkyl.
        if (project.phase === "Kvalificerat") project.phase = "Kalkyl";
        if (!project.calculation) {
          project.calculation = { deliveryTerm: "DAP", destination: project.country || "", freightCost: 0, dutyCost: 0, importVatCost: 0, otherImportCost: 0, includeImportVatInCost: false, targetMargin: 45, freightPresentation: "Separat rad", customerFreight: 0, validityDays: 30, paymentTerms: "50% vid order / 50% före leverans", deliveryTime: "", notes: "" };
        }
        const baseBilling = { name: project.customer || "", address: "", zip: "", city: "", country: project.country || "", vatNumber: "", contact: "", email: "" };
        const baseDelivery = { name: project.customer || "", address: "", zip: "", city: "", country: project.country || "", contact: "", phone: "" };
        project.customerData = project.customerData || {};
        project.customerData.billing = { ...baseBilling, ...(project.customerData.billing || {}) };
        project.customerData.delivery = { ...baseDelivery, ...(project.customerData.delivery || {}) };
        if (project.customerData.sameAsBilling == null) project.customerData.sameAsBilling = true;
        if (!project.sourceInquiryId) {
          const linkedInquiry = data.inquiries.find(inquiry => inquiry.projectId === project.id);
          if (linkedInquiry) project.sourceInquiryId = linkedInquiry.id;
        }
      });
      // v5.8 migration: freeze current master/customer data into older quote versions that predate snapshots.
      data.quotations.forEach(quote => {
        const project = data.projects.find(item => item.id === quote.projectId);
        if (!quote.companySnapshot) quote.companySnapshot = clone(data.company);
        if (!quote.customerSnapshot && project) quote.customerSnapshot = clone(project.customerData);
      });
      return window.CDPStructure.migrate(data);
    }

    function save() {
      localStorage.setItem(storageKey, JSON.stringify(state));
      return state;
    }

    function nextId(prefix, collection, digits = 4) {
      const highest = Math.max(0, ...collection.map(item => Number(String(item.id || "").split("-").pop()) || 0));
      return `${prefix}-26-${String(highest + 1).padStart(digits, "0")}`;
    }

    function meetingDay(now = new Date()) {
      return [now.getFullYear(), String(now.getMonth() + 1).padStart(2, "0"), String(now.getDate()).padStart(2, "0")].join("-");
    }

    function listMeetings(archive = false, now = new Date()) {
      const today = meetingDay(now);
      return state.meetings.filter(m => Boolean(m.time && m.time.slice(0, 10) < today) === archive)
        .sort((a, b) => (archive ? -1 : 1) * String(a.time || "").localeCompare(String(b.time || "")) || String(a.id).localeCompare(String(b.id)));
    }

    function validMeeting(values) {
      const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(values.time || "");
      if (!match || !String(values.visitor || "").trim()) return false;
      const [, y, m, d, h, min] = match.map(Number);
      const date = new Date(0); date.setFullYear(y, m - 1, d); date.setHours(12, 0, 0, 0);
      return y > 0 && date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d && h < 24 && min < 60;
    }

    function createMeeting(values) {
      if (!validMeeting(values)) return null;
      const meeting = { id: nextId("M", state.meetings), time: values.time, visitor: values.visitor.trim(), comment: values.comment || "", host: values.host || "", leadId: values.leadId || null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      state.meetings.push(meeting); save(); return meeting;
    }

    function updateMeeting(id, values) {
      const meeting = state.meetings.find(m => m.id === id);
      if (!meeting) return null;
      const changes = {};
      ["time", "visitor", "comment", "host"].forEach(key => { if (values[key] !== undefined) changes[key] = values[key]; });
      if (!validMeeting({ ...meeting, ...changes })) return null;
      Object.assign(meeting, changes, { updatedAt: new Date().toISOString() });
      save(); return meeting;
    }

    function removeMeeting(id) {
      const index = state.meetings.findIndex(m => m.id === id);
      if (index < 0) return false;
      state.meetings.splice(index, 1); save(); return true;
    }

    function createLead(values) {
      const lead = {
        id: nextId("L", state.leads),
        name: values.name,
        expectedStart: values.expectedStart || "",
        comments: values.comments || "",
        status: "Aktivt",
        createdAt: new Date().toISOString().slice(0, 10),
        createdBy: "DE",
        updatedAt: new Date().toISOString()
      };
      state.leads.unshift(lead);
      save();
      return lead;
    }

    function updateLead(id, values) {
      const lead = state.leads.find(item => item.id === id);
      if (!lead || lead.status === "Konverterat") return null;
      Object.assign(lead, values, { updatedAt: new Date().toISOString() });
      save();
      return lead;
    }

    function removeLead(id) {
      const index = state.leads.findIndex(item => item.id === id);
      if (index < 0) return false;
      state.leads.splice(index, 1);
      save();
      return true;
    }

    function createInquiry(values) {
      const inquiry = {
        id: nextId("I", state.inquiries),
        project: values.project,
        customer: values.customer,
        country: values.country,
        source: values.source,
        agent: values.agent || "—",
        value: Number(values.value) || 0,
        currency: values.currency || "EUR",
        probability: Number(values.probability) || 20,
        status: values.status || "Ny",
        received: values.received || new Date().toISOString().slice(0, 10),
        decision: values.decision || "",
        expectedStart: values.expectedStart || "",
        type: values.type || "Standard",
        area: Number(values.area) || 0,
        description: values.description || "",
        sourceLeadId: values.sourceLeadId || null,
        customerData: {
          name: values.customer || "",
          contact: values.contact || "",
          email: values.email || "",
          phone: values.phone || "",
          address: values.address || "",
          zip: values.zip || "",
          city: values.city || "",
          country: values.country || "",
          vatNumber: values.vatNumber || ""
        },
        preliminaryScope: [],
        designFiles: []
      };
      state.inquiries.unshift(inquiry);
      save();
      return inquiry;
    }

    function convertLead(id, inquiryId) {
      const lead = state.leads.find(item => item.id === id);
      if (!lead) return null;
      lead.status = "Konverterat";
      lead.inquiryId = inquiryId;
      lead.convertedAt = new Date().toISOString().slice(0, 10);
      lead.updatedAt = new Date().toISOString();
      save();
      return lead;
    }

    function convertInquiryToProject(id, values = {}) {
      const inquiry = state.inquiries.find(item => item.id === id);
      if (!inquiry) return null;
      inquiry.status = "Go";
      inquiry.probability = Number(values.probability ?? inquiry.probability) || 0;
      inquiry.decisionAt = new Date().toISOString().slice(0, 10);
      if (!Array.isArray(inquiry.history)) inquiry.history = [];
      inquiry.history.push({ status: "Go", date: inquiry.decisionAt });

      let project = state.projects.find(item => item.id === inquiry.projectId)
        || state.projects.find(item => item.sourceInquiryId === inquiry.id)
        || state.projects.find(item => item.name === inquiry.project && item.customer === inquiry.customer);
      const created = !project;
      if (!project) {
        project = {
          id: nextId("P", state.projects),
          sourceInquiryId: inquiry.id,
          name: inquiry.project,
          customer: inquiry.customer,
          country: inquiry.country,
          phase: "Kalkyl",
          businessStatus: "Aktivt",
          value: inquiry.value,
          currency: inquiry.currency,
          probability: inquiry.probability,
          owner: values.owner || "DE",
          agent: inquiry.agent !== "—" ? inquiry.agent : "",
          next: "Påbörja kalkyl",
          createdAt: new Date().toISOString().slice(0, 10),
          customerData: {
            sameAsBilling: true,
            billing: {
              name: inquiry.customerData?.name || inquiry.customer || "",
              address: inquiry.customerData?.address || "",
              zip: inquiry.customerData?.zip || "",
              city: inquiry.customerData?.city || "",
              country: inquiry.customerData?.country || inquiry.country || "",
              vatNumber: inquiry.customerData?.vatNumber || "",
              contact: inquiry.customerData?.contact || "",
              email: inquiry.customerData?.email || ""
            },
            delivery: {
              name: inquiry.customerData?.name || inquiry.customer || "",
              address: inquiry.customerData?.address || "",
              zip: inquiry.customerData?.zip || "",
              city: inquiry.customerData?.city || "",
              country: inquiry.customerData?.country || inquiry.country || "",
              contact: inquiry.customerData?.contact || "",
              phone: inquiry.customerData?.phone || ""
            }
          },
          preliminaryScope: clone(inquiry.preliminaryScope || []),
          designFiles: clone(inquiry.designFiles || [])
        };
        state.projects.unshift(project);
      } else {
        project.sourceInquiryId = project.sourceInquiryId || inquiry.id;
        if (!Array.isArray(project.preliminaryScope) || project.preliminaryScope.length === 0) project.preliminaryScope = clone(inquiry.preliminaryScope || []);
        if (!Array.isArray(project.designFiles) || project.designFiles.length === 0) project.designFiles = clone(inquiry.designFiles || []);
      }
      inquiry.projectId = project.id;
      save();
      return { project, created };
    }

    function reset() {
      state = normalize(clone(seed));
      save();
      return state;
    }

    return {
      adapter: "localStorage",
      getState: () => state,
      save,
      meetingDay, listMeetings, createMeeting, updateMeeting, removeMeeting,
      createLead,
      updateLead,
      removeLead,
      createInquiry,
      convertLead,
      convertInquiryToProject,
      reset
    };
  }

  window.CDPData = { createLocalStore };
})();
