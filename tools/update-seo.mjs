import fs from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const configPath = path.join(root, 'sites-config.js');

function decodeJsString(value) { return value.replace(/\\(['"\\])/g, '$1'); }
function parseSitesConfig(source) {
  const sites = [];
  const blockRe = /([A-Za-z0-9_-]+)\s*:\s*Object\.freeze\(\{([\s\S]*?)\}\)\s*,?/g;
  let m;
  while ((m = blockRe.exec(source))) {
    const urlMatch = m[2].match(/MAIN_EXEC_URL\s*:\s*(['"])(.*?)\1/);
    if (!urlMatch) continue;
    const url = decodeJsString(urlMatch[2].trim());
    if (url) sites.push({ key: m[1], execUrl: url });
  }
  return sites;
}
function htmlEscape(value) {
  return String(value ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}
function attrEscape(value) { return htmlEscape(value).replace(/\r?\n/g,' '); }
function normalizeImageUrl(url) {
  const value=String(url||'').trim(); if(!value) return '';
  const lh3=value.match(/lh3\.googleusercontent\.com\/d\/([-\w]{25,})/i); if(lh3) return `https://lh3.googleusercontent.com/d/${lh3[1]}=w1600`;
  if(/drive\.google\.com/i.test(value)){ const id=value.match(/[-\w]{25,}/)?.[0]; if(id) return `https://lh3.googleusercontent.com/d/${id}=w1600`; }
  return value;
}
function githubPagesBase() {
  const override=String(process.env.SEO_PUBLIC_BASE_URL||'').trim();
  if(override) return override.endsWith('/') ? override : `${override}/`;
  const repo=process.env.GITHUB_REPOSITORY||''; const [owner,repoName]=repo.split('/');
  if(!owner||!repoName) return '';
  if(repoName.toLowerCase()===`${owner.toLowerCase()}.github.io`) return `https://${owner}.github.io/`;
  return `https://${owner}.github.io/${repoName}/`;
}
function siteUrl(base,key){ if(!base) return ''; return key==='district'?base:new URL(`${key}/`,base).href; }
function siteIndexPath(key){ return key==='district'?path.join(root,'index.html'):path.join(root,key,'index.html'); }
function updateHtml(html,{title,description,image,url}){
  const safeTitle=htmlEscape(title), safeDesc=attrEscape(description), safeImage=attrEscape(image), safeUrl=attrEscape(url);
  html=html.replace(/<title(?:\s[^>]*)?>[\s\S]*?<\/title>/i,`<title>${safeTitle}</title>`);
  const descTag=`<meta name="description" content="${safeDesc}" data-lp360-dynamic-seo="description" />`;
  if(/<meta\s+[^>]*name=["']description["'][^>]*>/i.test(html)) html=html.replace(/<meta\s+[^>]*name=["']description["'][^>]*>/i,descTag);
  else html=html.replace(/<\/title>/i,`</title>\n  ${descTag}`);
  html=html.replace(/\n?\s*<meta\s+[^>]*data-lp360-static-seo=["']1["'][^>]*\/>/gi,'');
  const tags=[
    `<meta property="og:title" content="${attrEscape(title)}" data-lp360-static-seo="1" />`,
    `<meta property="og:description" content="${safeDesc}" data-lp360-static-seo="1" />`,
    `<meta property="og:type" content="website" data-lp360-static-seo="1" />`,
    url?`<meta property="og:url" content="${safeUrl}" data-lp360-static-seo="1" />`:'',
    image?`<meta property="og:image" content="${safeImage}" data-lp360-static-seo="1" />`:'',
    `<meta name="twitter:card" content="summary_large_image" data-lp360-static-seo="1" />`,
    `<meta name="twitter:title" content="${attrEscape(title)}" data-lp360-static-seo="1" />`,
    `<meta name="twitter:description" content="${safeDesc}" data-lp360-static-seo="1" />`,
    image?`<meta name="twitter:image" content="${safeImage}" data-lp360-static-seo="1" />`:''
  ].filter(Boolean).map(x=>`  ${x}`).join('\n');
  return html.replace(descTag,`${descTag}\n${tags}`);
}
async function fetchJson(url){
  const response=await fetch(url,{redirect:'follow',headers:{'user-agent':'LP360-GitHub-SEO-Prerender/2.0','cache-control':'no-cache'}});
  if(!response.ok) throw new Error(`HTTP ${response.status}`);
  const text=await response.text();
  let payload; try{payload=JSON.parse(text);}catch{throw new Error(`ตอบกลับไม่ใช่ JSON: ${text.slice(0,120)}`);}
  if(!payload||payload.success===false) throw new Error(payload?.message||'Apps Script returned success=false');
  return payload.data||payload;
}
async function fetchSeo(execUrl){
  // ใช้ mode=seo โดยตรงก่อน เพราะเร็วกว่าและไม่ติด homefast cache
  const seoUrl=new URL(execUrl); seoUrl.searchParams.set('mode','seo'); seoUrl.searchParams.set('_ts',Date.now().toString());
  try{
    const data=await fetchJson(seoUrl);
    const title=String(data?.title||'').trim(), description=String(data?.description||'').trim();
    if(title||description) return {title,description,image:normalizeImageUrl(data?.image||'')};
  }catch(err){ console.warn(`[warn] mode=seo ใช้ไม่ได้: ${err.message}; fallback homefast`); }
  const homeUrl=new URL(execUrl); homeUrl.searchParams.set('mode','homefast'); homeUrl.searchParams.set('fresh','1'); homeUrl.searchParams.set('_ts',Date.now().toString());
  const data=await fetchJson(homeUrl);
  return {title:String(data?.seo?.title||'').trim(),description:String(data?.seo?.description||'').trim(),image:normalizeImageUrl(data?.images?.heroImage||'')};
}

const config=await fs.readFile(configPath,'utf8');
const sites=parseSitesConfig(config); const base=githubPagesBase();
if(!sites.length) throw new Error('ไม่พบ MAIN_EXEC_URL ใน sites-config.js');
let changed=0, failed=0;
for(const site of sites){
  const indexPath=siteIndexPath(site.key);
  try{await fs.access(indexPath);}catch{console.log(`[skip] ${site.key}: ไม่มี ${path.relative(root,indexPath)}`);continue;}
  try{
    const seo=await fetchSeo(site.execUrl);
    if(!seo.title) throw new Error('T3 ว่าง หรือ Apps Script ยังไม่ได้ Deploy รุ่น SEO');
    if(!seo.description) throw new Error('T4 ว่าง หรือ Apps Script ยังไม่ได้ Deploy รุ่น SEO');
    const before=await fs.readFile(indexPath,'utf8');
    const after=updateHtml(before,{...seo,url:siteUrl(base,site.key)});
    if(after!==before){await fs.writeFile(indexPath,after,'utf8');changed++;console.log(`[updated] ${site.key}: ${seo.title}`);}else console.log(`[unchanged] ${site.key}`);
  }catch(error){failed++;console.error(`[error] ${site.key}: ${error.message}`);}
}
console.log(`SEO prerender complete: changed=${changed}, failed=${failed}, base=${base||'(none)'}`);
if(failed>0) process.exitCode=1;
