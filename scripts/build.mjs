import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");
const defaultUrl = "https://emludmnxyuzbicgkzhpn.supabase.co";
const defaultKey = "sb_publishable_GPRmV7tqR6WTYd2KwGMDNQ_MRP7YdQ4";

function loadDotEnv(file) {
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

function assertEmbeddable(value, name) {
  if (!value || !String(value).trim()) {
    console.error(`${name} is empty`);
    process.exit(1);
  }
  if (/["\\\r\n]/.test(value)) {
    console.error(`${name} contains characters that cannot be embedded in the client config`);
    process.exit(1);
  }
}

function assertHtmlGate(html) {
  const required = [
    'id="login-screen"',
    'id="login-form"',
    'class="app-shell" hidden',
    "data-logout",
    "vendor/supabase.js",
    "JS/supabase-config.js",
    "JS/auth.js"
  ];
  for (const needle of required) {
    if (!html.includes(needle)) {
      console.error(`index.html is missing ${needle}`);
      process.exit(1);
    }
  }
  if (html.includes('src="JS/app.js') || html.includes('src="JS/data.js')) {
    console.error("JS/app.js and JS/data.js must load only after login");
    process.exit(1);
  }
  if (html.indexOf('id="login-screen"') > html.indexOf('class="app-shell"')) {
    console.error("The login screen must come before the app shell");
    process.exit(1);
  }
}

loadDotEnv(path.join(root, ".env"));

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || defaultUrl;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || defaultKey;
assertEmbeddable(url, "NEXT_PUBLIC_SUPABASE_URL");
assertEmbeddable(publishableKey, "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
if (!/^https:\/\/.+/i.test(url)) {
  console.error("NEXT_PUBLIC_SUPABASE_URL must be an https URL");
  process.exit(1);
}

for (const file of ["JS/auth.js", "JS/data.js", "JS/app.js", "JS/supabase-config.js"]) {
  execFileSync(process.execPath, ["--check", path.join(root, file)], { stdio: "inherit" });
}

const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
assertHtmlGate(html);

const authSource = fs.readFileSync(path.join(root, "JS/auth.js"), "utf8");
for (const needle of ["signInWithPassword", "getSession", "getUser", "signOut"]) {
  if (!authSource.includes(needle)) {
    console.error(`JS/auth.js is missing ${needle}`);
    process.exit(1);
  }
}

const umdPath = path.join(root, "node_modules/@supabase/supabase-js/dist/umd/supabase.js");
if (!fs.existsSync(umdPath)) {
  console.error("Missing @supabase/supabase-js. Run npm install before npm run build.");
  process.exit(1);
}
const umd = fs.readFileSync(umdPath);
if (!umd.includes(Buffer.from("createClient"))) {
  console.error("The installed Supabase UMD build does not expose createClient");
  process.exit(1);
}

fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(dist, { recursive: true });
for (const entry of ["index.html", "CSS", "JS", "data"]) {
  fs.cpSync(path.join(root, entry), path.join(dist, entry), { recursive: true });
}
fs.mkdirSync(path.join(dist, "vendor"), { recursive: true });
fs.copyFileSync(umdPath, path.join(dist, "vendor/supabase.js"));

const configPath = path.join(dist, "JS/supabase-config.js");
let config = fs.readFileSync(configPath, "utf8");
if (!config.includes(defaultUrl) || !config.includes(defaultKey)) {
  console.error("JS/supabase-config.js no longer contains the expected default values");
  process.exit(1);
}
config = config.replaceAll(defaultUrl, url).replaceAll(defaultKey, publishableKey);
fs.writeFileSync(configPath, config);

const usingDefaults = url === defaultUrl && publishableKey === defaultKey;
console.log(`Built dist/ (${usingDefaults ? "Supabase public defaults" : "Supabase env override for " + url})`);
