import fs from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const configPath = path.join(root, 'sites-config.js');

function decodeJsString(value) {
  return value.replace(/\\n/g, '\n').replace(/\\r/g, '\r').replace(/\\t/g, '\t').replace(/\\(['"\\])/g, '$1');
}
function readProp(body, name) {
  const re = new RegExp(name + "\\s*:\\s*(['\\\"])([\\s\\S]*?)\\1");
  const m = body.match(re);
  return m ? decodeJsString(m[2].trim()) : '';
}
function parseObjectFreezeEntries(block) {
  const out = [];
  const re = /(['"]?)([A-Za-z0-9_-]+)\1\s*:\s*Object\.freeze\(\{([\s\S]*?)\}\)\s*,?/g;
  let m;
  while ((m = re.exec(block))) out.push({ key:m[2], body:m[3] });
  return out;
}
function extractConstObject(source, constName) {
  const startToken = `const ${constName} = Object.freeze({`;
  const start = source.indexOf(startToken);
  if (start < 0) return '';
  let i = start + startToken.length, depth = 1;
  let quote = '', escape = false;
  for (; i < source.length; i++) {
    const ch=source[i];
    if (quote) {
      if (escape) escape=false;
      else if (ch==='\\') escape=true;
      else if (ch===quote) quote='';
      continue;
    }
    if (ch==='"' || ch==="'") { quote=ch; continue; }
    if (ch==='{') depth++;
    else if (ch==='}') { depth--; if (depth===0) return source.slice(start+startToken.length, i); }
  }
  return '';
}
function parseConfig(source) {
  const iconMatch = source.match(/const\s+GLOBAL_ICON_URL\s*=\s*(['"])([\s\S]*?)\1/);
  const icon = iconMatch ? decodeJsString(iconMatch[2].trim()) : '';
  const sitesBlock = extractConstObject(source, 'SITES');
  const userBlock = extractConstObject(source, 'USER_PAGES');
  const sites = parseObjectFreezeEntries(sitesBlock).map(x => ({
    kind:'site', key:x.key, title:readProp(x.body,'SEO_TITLE'), description:readProp(x.body,'SEO_DESCRIPTION')
  }));
  const users = parseObjectFreezeEntries(userBlock).map(x => ({
    kind:'user', key:x.key, title:readProp(x.body,'SEO_TITLE'), description:readProp(x.body,'SEO_DESCRIPTION'), exec:readProp(x.body,'EXEC_URL')
  }));
  return { icon, sites, users };
}
function htmlText(value) { return String(value ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function attr(value) { return htmlText(value).replace(/"/g,'&quot;').replace(/'/g,'&#39;').replace(/\r?\n/g,' '); }
function sitePath(key) { return key==='district' ? path.join(root,'index.html') : path.join(root,key,'index.html'); }
function userPath(key) { return path.join(root,'user',`${key}.html`); }
function updateHtml(html, title, description, icon) {
  const safeTitle=htmlText(title), safeDesc=attr(description), safeIcon=attr(icon);
  const titleTag=`<title data-lp360-config-seo="title">${safeTitle}</title>`;
  const descTag=`<meta name="description" content="${safeDesc}" data-lp360-config-seo="description" />`;
  if (/<title(?:\s[^>]*)?>[\s\S]*?<\/title>/i.test(html)) html=html.replace(/<title(?:\s[^>]*)?>[\s\S]*?<\/title>/i,titleTag);
  else html=html.replace(/<\/head>/i,`  ${titleTag}\n</head>`);
  if (/<meta\s+[^>]*name=["']description["'][^>]*>/i.test(html)) html=html.replace(/<meta\s+[^>]*name=["']description["'][^>]*>/i,descTag);
  else html=html.replace(titleTag,`${descTag}\n  ${titleTag}`);
  html=html.replace(/\n?\s*<meta\s+[^>]*data-lp360-(?:static-seo|config-og)=["']1["'][^>]*\/?\s*>/gi,'');
  const og=[
    `<meta property="og:title" content="${attr(title)}" data-lp360-config-og="1" />`,
    `<meta property="og:description" content="${safeDesc}" data-lp360-config-og="1" />`,
    `<meta property="og:type" content="website" data-lp360-config-og="1" />`
  ].map(x=>`  ${x}`).join('\n');
  html=html.replace(descTag,`${descTag}\n${og}`);
  // Replace only tags managed by this generator, then insert a fresh global set.
  html=html.replace(/\n?\s*<link\s+[^>]*data-lp360-static-icon=["']1["'][^>]*>/gi,'');
  if (safeIcon) {
    const icons=[
      `<link rel="icon" type="image/png" href="${safeIcon}" data-lp360-static-icon="1">`,
      `<link rel="shortcut icon" type="image/png" href="${safeIcon}" data-lp360-static-icon="1">`,
      `<link rel="apple-touch-icon" href="${safeIcon}" data-lp360-static-icon="1">`,
      `<link rel="apple-touch-icon-precomposed" href="${safeIcon}" data-lp360-static-icon="1">`
    ].map(x=>`  ${x}`).join('\n');
    html=html.replace(titleTag,`${icons}\n  ${titleTag}`);
  }
  return html;
}

const source=await fs.readFile(configPath,'utf8');
const cfg=parseConfig(source);
if (!cfg.sites.length) throw new Error('ไม่พบ SITES ใน sites-config.js');
if (!cfg.icon) throw new Error('GLOBAL_ICON_URL ว่างใน sites-config.js');
let changed=0, failed=0;
for (const item of [...cfg.sites,...cfg.users]) {
  const file=item.kind==='site' ? sitePath(item.key) : userPath(item.key);
  try { await fs.access(file); } catch { console.log(`[skip] ${item.kind}:${item.key}: ไม่มี ${path.relative(root,file)}`); continue; }
  if (!item.title || !item.description || (item.kind==='user' && !item.exec)) {
    console.error(`[error] ${item.kind}:${item.key}: config ไม่ครบ`); failed++; continue;
  }
  const before=await fs.readFile(file,'utf8');
  const after=updateHtml(before,item.title,item.description,cfg.icon);
  if (after!==before) { await fs.writeFile(file,after,'utf8'); changed++; console.log(`[updated] ${item.kind}:${item.key}: ${item.title}`); }
  else console.log(`[unchanged] ${item.kind}:${item.key}`);
}
console.log(`Static metadata/icon from sites-config complete: changed=${changed}, failed=${failed}`);
if (failed) process.exitCode=1;
