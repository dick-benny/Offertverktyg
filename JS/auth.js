(() => {
  "use strict";

  const ASSET_VERSION = "5.16";
  const loginScreen = document.querySelector("#login-screen");
  const appShell = document.querySelector(".app-shell");
  const form = document.querySelector("#login-form");
  const statusEl = document.querySelector("#login-status");
  const errorEl = document.querySelector("#login-error");
  const config = window.OFFERTVERKTYG_SUPABASE || {};

  let appStarted = false;

  function showLogin(message) {
    if (appShell) {
      appShell.hidden = true;
      appShell.inert = true;
    }
    if (loginScreen) loginScreen.hidden = false;
    if (statusEl) statusEl.hidden = true;
    if (form) form.hidden = false;
    if (!errorEl) return;
    errorEl.hidden = !message;
    errorEl.textContent = message || "";
    if (!message) form?.querySelector('input[name="email"]')?.focus();
  }

  function showBlockingMessage(message) {
    if (appShell) {
      appShell.hidden = true;
      appShell.inert = true;
    }
    if (loginScreen) loginScreen.hidden = false;
    if (form) form.hidden = true;
    if (statusEl) statusEl.hidden = true;
    if (errorEl) {
      errorEl.hidden = false;
      errorEl.textContent = message;
    }
  }

  function translateError(error) {
    const message = String(error?.message || error || "").toLowerCase();
    if (message.includes("invalid login") || message.includes("invalid email or password") || message.includes("invalid credentials")) {
      return "Fel e-postadress eller lösenord.";
    }
    if (message.includes("email not confirmed")) {
      return "E-postadressen är inte bekräftad. Skapa användaren med automatisk bekräftelse, eller bekräfta mejlet först.";
    }
    if (message.includes("too many") || message.includes("rate limit")) {
      return "För många försök. Vänta en stund och försök igen.";
    }
    if (message.includes("failed to fetch") || message.includes("network") || message.includes("load failed")) {
      return "Kunde inte nå inloggningen. Kontrollera nätverket och försök igen.";
    }
    return "Inloggningen misslyckades. Försök igen.";
  }

  function showToast(message) {
    const toast = document.querySelector("#toast");
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 3200);
  }

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = src;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(src));
      document.body.appendChild(script);
    });
  }

  function greeting() {
    const hour = new Date().getHours();
    if (hour < 5 || hour >= 18) return "God kväll";
    if (hour < 10) return "God morgon";
    if (hour < 14) return "God dag";
    return "God eftermiddag";
  }

  function applySession(session) {
    const email = session?.user?.email || "";
    const local = email.split("@")[0] || "";
    const letters = local.replace(/[^a-zA-Z0-9ÅÄÖåäö]/g, "");
    const avatar = document.querySelector("#profileAvatar");
    const name = document.querySelector("#profileName");
    const role = document.querySelector("#profileRole");
    const heading = document.querySelector("#view-dashboard h1");
    if (avatar) avatar.textContent = (letters.slice(0, 2) || "•").toUpperCase();
    if (name) {
      name.textContent = email || "Inloggad";
      name.title = email;
    }
    if (role) role.textContent = "Inloggad";
    if (heading) heading.textContent = local ? `${greeting()}, ${local}` : greeting();
  }

  async function showApp(session) {
    applySession(session);
    if (!appStarted) {
      appStarted = true;
      if (statusEl) {
        statusEl.hidden = false;
        statusEl.textContent = "Öppnar offertverktyget…";
      }
      if (form) form.hidden = true;
      try {
        await loadScript(`JS/data.js?v=${ASSET_VERSION}`);
        await loadScript(`JS/app.js?v=${ASSET_VERSION}`);
      } catch (error) {
        appStarted = false;
        showBlockingMessage("Kunde inte läsa in appen. Ladda om sidan.");
        return;
      }
    }
    if (loginScreen) loginScreen.hidden = true;
    if (appShell) {
      appShell.hidden = false;
      appShell.inert = false;
    }
  }

  function bindLogout(client) {
    document.querySelectorAll("[data-logout]").forEach(button => {
      button.addEventListener("click", async () => {
        button.disabled = true;
        const { error } = await client.auth.signOut();
        if (error) {
          button.disabled = false;
          showToast("Kunde inte logga ut. Försök igen.");
          return;
        }
        location.reload();
      });
    });
  }

  async function main() {
    if (!config.url || !config.publishableKey) {
      showBlockingMessage("Supabase är inte konfigurerat. Ange URL och nyckel enligt README.");
      return;
    }
    if (!window.supabase || typeof window.supabase.createClient !== "function") {
      showBlockingMessage("Inloggningsbiblioteket saknas. Kör npm install och npm run build, se README.");
      return;
    }

    let client;
    try {
      client = window.supabase.createClient(config.url, config.publishableKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: false
        }
      });
    } catch (error) {
      showBlockingMessage("Supabase kunde inte startas. Kontrollera URL och nyckel.");
      return;
    }

    bindLogout(client);
    form?.addEventListener("submit", async event => {
      event.preventDefault();
      if (errorEl) errorEl.hidden = true;
      const submit = form.querySelector('button[type="submit"]');
      const email = form.email.value.trim();
      const password = form.password.value;
      if (submit) {
        submit.disabled = true;
        submit.textContent = "Loggar in…";
      }
      try {
        const { data, error } = await client.auth.signInWithPassword({ email, password });
        if (error || !data.session) {
          showLogin(translateError(error));
          return;
        }
        form.password.value = "";
        await showApp(data.session);
      } catch (error) {
        showLogin(translateError(error));
      } finally {
        if (submit) {
          submit.disabled = false;
          submit.textContent = "Logga in";
        }
      }
    });

    try {
      const { data: sessionData, error: sessionError } = await client.auth.getSession();
      if (sessionError) {
        showLogin("Kunde inte kontrollera inloggningen. Ladda om sidan.");
        return;
      }
      if (!sessionData.session) {
        showLogin();
        return;
      }
      const { data: userData, error: userError } = await client.auth.getUser();
      if (userError || !userData.user) {
        await client.auth.signOut();
        showLogin("Sessionen är inte längre giltig. Logga in igen.");
        return;
      }
      await showApp(sessionData.session);
    } catch (error) {
      showLogin(translateError(error));
    }
  }

  main();
})();
