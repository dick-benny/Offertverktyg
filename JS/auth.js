(() => {
  "use strict";

  const ASSET_VERSION = "7.9.43";
  const loginScreen = document.querySelector("#login-screen");
  const appShell = document.querySelector(".app-shell");
  const form = document.querySelector("#login-form");
  const statusEl = document.querySelector("#login-status");
  const errorEl = document.querySelector("#login-error");
  const config = window.OFFERTVERKTYG_SUPABASE || {};

  let appStarted = false;
  let client;

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
      return "Incorrect email address or password.";
    }
    if (message.includes("email not confirmed")) {
      return "The email address is not confirmed. Create the user with automatic confirmation, or confirm the email first.";
    }
    if (message.includes("too many") || message.includes("rate limit")) {
      return "Too many attempts. Wait a moment and try again.";
    }
    if (message.includes("failed to fetch") || message.includes("network") || message.includes("load failed")) {
      return "Could not reach the sign-in service. Check your network and try again.";
    }
    return "Sign-in failed. Please try again.";
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
    if (hour < 5 || hour >= 18) return "Good evening";
    if (hour < 10) return "Good morning";
    if (hour < 14) return "Hello";
    return "Good afternoon";
  }

  const userLabels=[];
  let signedInUserId='';
  function suggestedInitials(name,email=''){
    const label=String((name&&name!==email?name:String(email).split('@')[0])||'').replace(/[^\p{L}\p{N}]+/gu,' ').trim(),parts=label.split(/ +/);
    return (parts.length>1?parts[0].slice(0,1)+parts.at(-1).slice(0,1):label.slice(0,2)).toUpperCase()||'U';
  }
  function findUserLabel(value){const key=String(value||'').toLocaleLowerCase('en');if(!key)return null;const exact=userLabels.filter(u=>[u.id,u.email,u.name].some(v=>v&&String(v).toLocaleLowerCase('en')===key));if(exact.length===1)return exact[0];const initials=userLabels.filter(u=>[u.initials,suggestedInitials(u.name,u.email)].some(v=>v.toLocaleLowerCase('en')===key));return initials.length===1?initials[0]:null;}
  function updateUserLabels(rows){for(const row of rows){const u={id:row.user_id||row.id||'',email:String(row.email||''),name:String(row.name||''),initials:String(row.initials||suggestedInitials(row.name,row.email))};const index=userLabels.findIndex(old=>u.id&&old.id===u.id||u.email&&old.email.toLowerCase()===u.email.toLowerCase());if(index<0)userLabels.push(u);else userLabels[index]=u;const projectUser=(window.CDPProjectUsers||[]).find(p=>p.id===u.id||p.email===u.email);if(projectUser){projectUser.initials=u.initials;if(u.name)projectUser.name=u.name;}}const own=userLabels.find(u=>u.id===signedInUserId);if(own){const avatar=document.querySelector('#profileAvatar');if(avatar){avatar.textContent=own.initials;avatar.title=own.name||own.email;}}}
  window.CDPUserLabels={suggest:suggestedInitials,find:findUserLabel,update:updateUserLabels,initials:value=>findUserLabel(value)?.initials||(String(value||'').includes('@')?suggestedInitials('',value):String(value||'').length<=6?value:suggestedInitials(value,'')),title:value=>{const u=findUserLabel(value);return u?[u.name,u.email].filter(Boolean).join(' · '):value;}};
  function applySession(session) {
    const email = session?.user?.email || "";
    signedInUserId=session?.user?.id||'';
    userLabels.length=0;
    window.CDPProjectUsers=[{id:signedInUserId,email,name:session?.user?.user_metadata?.full_name||session?.user?.user_metadata?.name||email}];
    window.CDPLoadProjectUsers=async({all=false}={})=>{
      if(all){
        window.CDPProjectUsersComplete=false;
        try{
          const users=await window.CDPReadUserDirectory();
          window.CDPProjectUsers=users.filter(u=>u.email.trim()).map(u=>({id:u.user_id,email:u.email,name:u.name,initials:u.initials})).sort((a,b)=>(a.name||a.email).localeCompare(b.name||b.email));
          window.CDPProjectUsersConfigured=true;window.CDPProjectUsersComplete=true;return;
        }catch{/* Fall back to the authorized internal directory without hiding a failed full load. */}
      }
      try{const result=await client.rpc('cdp_list_project_users');if(!result.error&&Array.isArray(result.data)&&result.data.length){window.CDPProjectUsers=result.data;window.CDPProjectUsersConfigured=true;}}catch{}
      try{const result=await client.rpc('cdp_list_user_initials');if(!result.error&&Array.isArray(result.data)&&result.data.length){updateUserLabels(result.data);for(const u of result.data)if(!(window.CDPProjectUsers||[]).some(p=>p.id===u.id))window.CDPProjectUsers.push(u);window.CDPProjectUsersConfigured=true;}}catch{/* Initials are optional until migration 007 is installed. */}
    };
    window.CDPReadUserDirectory=async()=>{
      let result=await client.rpc('cdp_admin_list_users_v2');
      window.CDPUserInitialsConfigured=true;
      if(result.error&&['PGRST202','42883'].includes(result.error.code)){window.CDPUserInitialsConfigured=false;result=await client.rpc('cdp_admin_list_users');}
      if(result.error)throw result.error;
      if(!Array.isArray(result.data))throw new Error('Invalid directory response');
      const users=result.data.map(u=>({user_id:String(u.user_id||''),name:String(u.name||''),email:String(u.email||''),initials:String(u.initials||suggestedInitials(u.name,u.email)),can_edit_initials:u.can_edit_initials===true,role:String(u.role||'Not specified'),account_status:String(u.account_status||'Not specified'),created_at:u.created_at||null,last_sign_in_at:u.last_sign_in_at||null}));
      updateUserLabels(users);return users;
    };
    window.CDPSaveUserInitials=async(user,initials,expected)=>{
      const normalized=String(initials).trim().toUpperCase();if(!/^[\p{L}\p{N}]{1,6}$/u.test(normalized))throw Error('Enter 1–6 letters or digits.');
      const result=await client.rpc('cdp_save_user_initials',{target_user_id:user.user_id,new_initials:normalized,expected_initials:expected});
      if(result.error)throw result.error;
      if(typeof result.data!=='string'||!result.data)throw Error('The saved initials could not be confirmed. Refresh the list.');
      updateUserLabels([{...user,initials:result.data}]);return result.data;
    };
    const local = email.split("@")[0] || "";
    const letters = local.replace(/[^a-zA-Z0-9ÅÄÖåäö]/g, "");
    const avatar = document.querySelector("#profileAvatar");
    const name = document.querySelector("#profileName");
    const role = document.querySelector("#profileRole");
    const heading = document.querySelector("#view-dashboard h1");
    if (avatar) avatar.textContent = (letters.slice(0, 2) || "•").toUpperCase();
    if (name) {
      name.textContent = email || "Signed in";
      name.title = email;
    }
    updateUserLabels(window.CDPProjectUsers);
    if (role) role.textContent = "Signed in";
    if (heading) heading.textContent = local ? `${greeting()}, ${local}` : greeting();
  }

  async function showApp(session) {
    applySession(session);
    if (!appStarted) {
      appStarted = true;
      if (statusEl) {
        statusEl.hidden = false;
        statusEl.textContent = "Opening quotation management…";
      }
      if (form) form.hidden = true;
      try {
        await loadScript(`JS/structure.js?v=${ASSET_VERSION}`);
        await loadScript(`JS/workflow.js?v=${ASSET_VERSION}`);
        await loadScript(`JS/rfq-project.js?v=${ASSET_VERSION}`);
        await loadScript(`JS/remote.js?v=${ASSET_VERSION}`);
        await window.CDPRemote.start(client);
        await window.CDPLoadProjectUsers({all:true});
        await loadScript(`JS/data.js?v=${ASSET_VERSION}`);
        await loadScript(`JS/xlsx.js?v=${ASSET_VERSION}`);
        await loadScript(`JS/app.js?v=${ASSET_VERSION}`);
        if(!window.CDPApp?.ready)throw Error("The application could not start.");
      } catch (error) {
        appStarted = false;
        showBlockingMessage("Could not load Supabase data. Check that SQL 003_app_connection.sql has been run and the connection works. Then reload the page. " + (error.message || ""));
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
          showToast("Could not sign out. Try again.");
          return;
        }
        location.reload();
      });
    });
  }

  async function main() {
    if (!config.url || !config.publishableKey) {
      showBlockingMessage("Supabase is not configured. Enter the URL and key following the README.");
      return;
    }
    if (!window.supabase || typeof window.supabase.createClient !== "function") {
      showBlockingMessage("The sign-in library is missing. Run npm install and npm run build; see README.");
      return;
    }

    // One authenticated client is shared by auth and persistence.
    try {
      client = window.supabase.createClient(config.url, config.publishableKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: false
        }
      });
    } catch (error) {
      showBlockingMessage("Supabase could not start. Check the URL and key.");
      return;
    }

    client.auth.onAuthStateChange((event) => {
      if(event === "SIGNED_OUT") {
        if(appStarted) location.reload();
        else showLogin("You have been signed out. Sign in again.");
      }
    });
    bindLogout(client);
    form?.addEventListener("submit", async event => {
      event.preventDefault();
      if (errorEl) errorEl.hidden = true;
      const submit = form.querySelector('button[type="submit"]');
      const email = form.elements.email.value.trim();
      const password = form.elements.password.value;
      if (submit) {
        submit.disabled = true;
        submit.textContent = "Signing in…";
      }
      try {
        const { data, error } = await client.auth.signInWithPassword({ email, password });
        if (error || !data.session) {
          showLogin(translateError(error));
          return;
        }
        form.elements.password.value = "";
        await showApp(data.session);
      } catch (error) {
        showLogin(translateError(error));
      } finally {
        if (submit) {
          submit.disabled = false;
          submit.textContent = "Sign in";
        }
      }
    });

    try {
      const { data: sessionData, error: sessionError } = await client.auth.getSession();
      if (sessionError) {
        showLogin("Could not verify your sign-in. Reload the page.");
        return;
      }
      if (!sessionData.session) {
        showLogin();
        return;
      }
      const { data: userData, error: userError } = await client.auth.getUser();
      if (userError || !userData.user) {
        await client.auth.signOut();
        showLogin("Your session is no longer valid. Sign in again.");
        return;
      }
      await showApp(sessionData.session);
    } catch (error) {
      showLogin(translateError(error));
    }
  }

  main();
})();
