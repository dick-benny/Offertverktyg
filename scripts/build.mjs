import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
for(const file of fs.readdirSync(path.join(root,'JS')).filter(f=>f.endsWith('.js'))) execFileSync(process.execPath,['--check',path.join(root,'JS',file)],{stdio:'inherit'});
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
if(!html.includes('class="app-shell" hidden inert')||/src="JS\/(app|data|remote)\.js/.test(html))throw Error('Application must load after authentication.');
if(!fs.existsSync(path.join(root,'vendor/supabase.js')))throw Error('The bundled Supabase client is missing.');
const dist=path.join(root,'dist');
fs.mkdirSync(dist,{recursive:true});
for(const entry of ['index.html','JS','CSS','vendor'])fs.cpSync(path.join(root,entry),path.join(dist,entry),{recursive:true});
const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
if(Boolean(url)!==Boolean(key))throw Error('Provide both public Supabase URL and publishable key.');
if(url){if(!/^https:\/\/[a-z0-9.-]+\/?$/i.test(url)||!key.startsWith('sb_publishable_'))throw Error('Use an HTTPS project URL and a public sb_publishable_ key.');fs.writeFileSync(path.join(dist,'JS/supabase-config.js'),'window.OFFERTVERKTYG_SUPABASE='+JSON.stringify({url,publishableKey:key})+';\n');}
console.log('Built Projects v7.1 with Supabase authentication and persistence.');
