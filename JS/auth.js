(() => {
  "use strict";

  const ASSET_VERSION = "7.9.81";
  const loginScreen = document.querySelector("#login-screen");
  const appShell = document.querySelector(".app-shell");
  const form = document.querySelector("#login-form");
  const statusEl = document.querySelector("#login-status");
  const errorEl = document.querySelector("#login-error");
  const config = window.OFFERTVERKTYG_SUPABASE || {};

  let appStarted = false;
  let client;

  window.CDPUploadBomPdf=async file=>{
    if(!file||!file.name.toLowerCase().endsWith('.pdf')||file.size===0||file.size>20*1024*1024)throw Error('Choose a PDF file up to 20 MB.');
    if(new TextDecoder().decode(await file.slice(0,5).arrayBuffer())!=='%PDF-')throw Error('The file is not a valid PDF.');
    const path=crypto.randomUUID()+'.pdf',bucket=client.storage.from('cdp-bom-pdfs');
    const result=await bucket.upload(path,file,{contentType:'application/pdf',upsert:false});
    if(result.error)throw Error('PDF upload failed. Check that 018_bom_pdf_storage.sql is installed. '+result.error.message);
    return {name:file.name,url:config.url.replace(/\/$/,'')+'/storage/v1/object/authenticated/cdp-bom-pdfs/'+path};
  };
  document.addEventListener('click',async e=>{
    const link=e.target.closest?.('a[href]');if(!link)return;
    const prefix=config.url?.replace(/\/$/,'')+'/storage/v1/object/authenticated/cdp-bom-pdfs/';
    if(!link.href.startsWith(prefix))return;
    e.preventDefault();const path=link.href.slice(prefix.length);if(!/^[a-f0-9-]+\.pdf$/.test(path))return;
    const viewer=window.open('about:blank','_blank');if(viewer)viewer.opener=null;
    try{const result=await client.storage.from('cdp-bom-pdfs').createSignedUrl(path,60);if(result.error)throw result.error;if(viewer)viewer.location=result.data.signedUrl;else window.location.assign(result.data.signedUrl);}
    catch(error){viewer?.close();window.alert('Could not open PDF. '+error.message);}
  });

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
  function updateUserLabels(rows){for(const row of rows){const u={id:row.user_id||row.id||'',email:String(row.email||''),name:String(row.name||''),initials:String(row.initials||suggestedInitials(row.name,row.email))};const index=userLabels.findIndex(old=>u.id&&old.id===u.id||u.email&&old.email.toLowerCase()===u.email.toLowerCase());if(index<0)userLabels.push(u);else userLabels[index]=u;const projectUser=(window.CDPProjectUsers||[]).find(p=>p.id===u.id||p.email===u.email);if(projectUser){projectUser.initials=u.initials;if(u.name)projectUser.name=u.name;}}const own=userLabels.find(u=>u.id===signedInUserId);if(own){const avatar=document.querySelector('#profileAvatar');if(avatar){avatar.textContent=own.initials;avatar.title=own.name||own.email;}const display=own.name&&own.name!==own.email?own.name:'';const title=document.querySelector('#view-dashboard h1');if(title)title.textContent=display?`${greeting()}, ${display}`:greeting();const profile=document.querySelector('#profileName');if(profile)profile.textContent=display||'Signed in';}}
  window.CDPUserLabels={suggest:suggestedInitials,find:findUserLabel,update:updateUserLabels,initials:value=>findUserLabel(value)?.initials||(String(value||'').includes('@')?suggestedInitials('',value):String(value||'').length<=6?value:suggestedInitials(value,'')),title:value=>{const u=findUserLabel(value);return u?[u.name,u.email].filter(Boolean).join(' · '):value;}};
  function applySession(session) {
    const email = session?.user?.email || "";
    signedInUserId=session?.user?.id||'';
    window.CDPCurrentUserId=signedInUserId;
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
    window.CDPReadManufacturerResponses=async id=>{const r=await client.rpc('cdp_internal_manufacturer_responses',{project_key:id});if(r.error)throw Error(r.error.message||'Install 016_manufacturer_portal_responses.sql.');return r.data||[];};
    window.CDPSetManufacturerTarget=async(pid,product,value,expected)=>{const r=await client.rpc('cdp_set_manufacturer_target',{project_key:pid,product_key:product,new_target:value,expected_target:expected});if(r.error)throw r.error;};
    window.CDPReadBomApprovals=async id=>{const result=await client.rpc('cdp_internal_bom_approvals',{project_key:id});if(result.error){if(['PGRST202','42883'].includes(result.error.code))throw Error('Install 015_customer_portal_bom_approvals.sql to view approvals.');throw result.error;}return result.data||[];};
    window.CDPReadCompanyUsers=async(role,id)=>{const result=await client.rpc('cdp_company_users',{company_role:role,company_id:id});if(result.error){if(['PGRST202','42883'].includes(result.error.code))throw Error('Install 014_company_users.sql to display linked users.');throw result.error;}if(!Array.isArray(result.data))throw Error('Could not load linked users.');return result.data;};
    window.CDPReadUserDirectory=async()=>{
      let result=await client.rpc('cdp_admin_list_users_v3');
      window.CDPUserInitialsConfigured=true;
      if(result.error&&['PGRST202','42883'].includes(result.error.code)){throw Error('Install 011_user_entities_manufacturer_portal.sql to manage company links.');}
      if(result.error)throw result.error;
      if(!Array.isArray(result.data))throw new Error('Invalid directory response');
      const users=result.data.map(u=>({user_id:String(u.user_id||''),entity_id:u.entity_id||null,name:String(u.name||''),email:String(u.email||''),initials:String(u.initials||suggestedInitials(u.name,u.email)),can_edit_initials:u.can_edit_initials===true,role:String(u.role||'Not specified'),account_status:String(u.account_status||'Not specified'),created_at:u.created_at||null,last_sign_in_at:u.last_sign_in_at||null}));
      updateUserLabels(users);return users;
    };
    window.CDPCheckUserAdmin=async()=>{const result=await client.rpc('cdp_user_admin_enabled');if(result.error){if(['PGRST202','42883'].includes(result.error.code))return {configured:false,allowed:false};throw result.error;}return {configured:true,allowed:result.data===true};};
    window.CDPSaveUserProfile=async(user,name,initials,role,entityId)=>{const result=await client.rpc('cdp_save_user_profile_v3',{target_user_id:user.user_id,new_name:name.trim(),new_initials:initials.trim().toUpperCase(),expected_name:user.name,expected_initials:user.initials,new_role:role||null,expected_role:user.role,new_entity_id:entityId||null,expected_entity_id:user.entity_id||null});if(result.error){if(['PGRST202','42883'].includes(result.error.code))throw Error('Run 011_user_entities_manufacturer_portal.sql in Supabase to enable company links.');throw result.error;}if(!result.data?.name||!result.data?.initials)throw Error('Refresh the list to confirm saved details.');updateUserLabels([{...user,...result.data}]);return result.data;};
    window.CDPDeleteUser=async user=>{const result=await client.rpc('cdp_delete_user',{target_user_id:user.user_id,expected_email:user.email,expected_role:user.role});if(result.error){if(['PGRST202','42883'].includes(result.error.code))throw Error('Install 013_delete_user.sql to enable deleting users.');throw result.error;}if(result.data!==true)throw Error('Deletion could not be confirmed. Refresh the list before retrying.');};
    window.CDPCreateUser=async values=>{const result=await client.functions.invoke('projects-user-admin',{body:values});if(result.error){let message='Could not confirm account creation. Refresh the list before retrying. Check the User admin installation instructions.';try{const body=await result.error.context?.json();if(body?.error)message=body.error;}catch{}throw Error(message);}if(result.data?.error)throw Error(result.data.error);if(!result.data?.user_id)throw Error('Refresh the list to confirm account creation.');return result.data;};
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
    if (heading) {const display=session?.user?.user_metadata?.full_name||session?.user?.user_metadata?.name||'';heading.textContent=display?`${greeting()}, ${display}`:greeting();}
  }

  async function showApp(session) {
    const access=await client.rpc('cdp_session_role');
    if(access.error||!['internal','manufacturer','customer'].includes(access.data)){showBlockingMessage('Could not verify account access. Install 010_external_roles.sql and reload.');return;}
    const portal=document.querySelector('#external-portal');
    if(access.data!=='internal'){appStarted=true;if(appShell){appShell.hidden=true;appShell.inert=true;}if(loginScreen)loginScreen.hidden=true;portal.hidden=false;portal.querySelector('[data-portal-title]').textContent=access.data==='manufacturer'?'Manufacturer portal':'Customer portal';if(access.data==='manufacturer'){try{await loadScript(`JS/manufacturer-portal.js?v=${ASSET_VERSION}`);await window.CDPManufacturerPortal.start(client,portal);}catch{portal.querySelector('[data-portal-content]').textContent='Could not open the portal. Reload the page to try again.';}}else{try{await loadScript(`JS/customer-portal.js?v=${ASSET_VERSION}`);await window.CDPCustomerPortal.start(client,portal);}catch{portal.querySelector('[data-portal-content]').textContent='Could not open the portal. Reload the page to try again.';}}return;}
    if(portal)portal.hidden=true;
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
