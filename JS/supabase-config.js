/* Public Supabase client values. Not secret.
   scripts/build.mjs rewrites the dist copy when NEXT_PUBLIC_SUPABASE_URL
   or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is set. */
(function () {
  "use strict";

  var defaults = {
    url: "https://emludmnxyuzbicgkzhpn.supabase.co",
    publishableKey: "sb_publishable_GPRmV7tqR6WTYd2KwGMDNQ_MRP7YdQ4"
  };
  var override = window.OFFERTVERKTYG_SUPABASE || {};
  window.OFFERTVERKTYG_SUPABASE = {
    url: override.url || defaults.url,
    publishableKey: override.publishableKey || defaults.publishableKey
  };
})();
