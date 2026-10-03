import fs from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const configPath = path.join(root, 'sites-config.js');

function decodeJsString(value) {
  return value.replace(/\\(['"\\])/g, '$1');
}

function parseSitesConfig(source) {
  const sites = [];
  const blockRe = /([A-Za-z0-9_-]+)\s*:\s*Object\.freeze\(\{([\s\S]*?)\}\)\s*,?/g;
  let m;
  while ((m = blockRe.exec(source))) {
    const key = m[1];
    const body = m[2];
    const urlMatch = body.match(/MAIN_EXEC_URL\s*:\s*(['"])(.*?)\1/);
    if (!urlMatch) continue;
    const url = decodeJsString(urlMatch[2].trim());
    if (!url) continue;
    sites.push({ key, execUrl: url });
  }
  return sites;
}

function htmlEscape(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function attrEscape(value) {
  return htmlEscape(value).replace(/\r?\n/g, ' ');
}

function normalizeImageUrl(url) {
  const value = String(url || '').trim();
  if (!value) return '';
  const lh3 = value.match(/lh3\.googleusercontent\.com\/d\/([-\w]{25,})/i);
  if (lh3) return `https://lh3.googleusercontent.com/d/${lh3[1]}=w1600`;
  if (/drive\.google\.com/i.test(value)) {
    const id = value.match(/[-\w]{25,}/)?.[0];
    if (id) return `https://lh3.googleusercontent.com/d/${id}=w1600`;
  }
  return value;
}

function basePagesUrl() {
  const cnamePath = path.join(root, 'CNAME');
  return fs.readFile(cnamePath, 'utf8').then(text => {
    const host = text.trim().split(/\s+/)[0];
    return host ? `https://${host.replace(/^https?:\/\//, '').replace(/\/$/, '')}/` : '';
  }).catch(() => {
    const repo = process.env.GITHUB_REPOSITORY || '';
    const [owner, repoName] = repo.split('/');
    if (!owner || !repoName) return '';
    if (repoName.toLowerCase() === `${owner.toLowerCase()}.github.io`) {
      return `https://${owner}.github.io/`;
    }
    return `https://${owner}.github.io/${repoName}/`;
  });
}

function siteUrl(base, key) {
  if (!base) return '';
  if (key === 'district') return base;
  return new URL(`${key}/`, base).href;
}

function siteIndexPath(key) {
  return key === 'district' ? path.join(root, 'index.html') : path.join(root, key, 'index.html');
}

function setOrInsertMeta(html, selectorRegex, tag, marker) {
  if (selectorRegex.test(html)) return html.replace(selectorRegex, tag);
  const marked = `${tag}${marker ? `\n  <!-- ${marker} -->` : ''}`;
  return html.replace(/<\/title>/i, `</title>\n  ${marked}`);
}

function updateHtml(html, { title, description, image, url }) {
  const safeTitle = htmlEscape(title);
  const safeDesc = attrEscape(description);
  const safeImage = attrEscape(image);
  const safeUrl = attrEscape(url);

  html = html.replace(/<title(?:\s[^>]*)?>[\s\S]*?<\/title>/i, `<title>${safeTitle}</title>`);

  const descTag = `<meta name="description" content="${safeDesc}" data-lp360-dynamic-seo="description" />`;
  if (/<meta\s+[^>]*name=["']description["'][^>]*>/i.test(html)) {
    html = html.replace(/<meta\s+[^>]*name=["']description["'][^>]*>/i, descTag);
  } else {
    html = html.replace(/<\/title>/i, `</title>\n  ${descTag}`);
  }

  const tags = [
    ['og:title', `<meta property="og:title" content="${attrEscape(title)}" data-lp360-static-seo="1" />`],
    ['og:description', `<meta property="og:description" content="${safeDesc}" data-lp360-static-seo="1" />`],
    ['og:type', `<meta property="og:type" content="website" data-lp360-static-seo="1" />`],
    ['og:url', `<meta property="og:url" content="${safeUrl}" data-lp360-static-seo="1" />`],
    ['og:image', `<meta property="og:image" content="${safeImage}" data-lp360-static-seo="1" />`],
    ['twitter:card', `<meta name="twitter:card" content="summary_large_image" data-lp360-static-seo="1" />`],
    ['twitter:title', `<meta name="twitter:title" content="${attrEscape(title)}" data-lp360-static-seo="1" />`],
    ['twitter:description', `<meta name="twitter:description" content="${safeDesc}" data-lp360-static-seo="1" />`],
    ['twitter:image', `<meta name="twitter:image" content="${safeImage}" data-lp360-static-seo="1" />`],
  ];

  // ลบ tag SEO static ชุดเดิมก่อน เพื่อให้การอัปเดตซ้ำไม่เกิด tag ซ้อน
  html = html.replace(/\n?\s*<meta\s+[^>]*data-lp360-static-seo=["']1["'][^>]*\/>/gi, '');

  const rendered = tags
    .filter(([name]) => !((name === 'og:image' || name === 'twitter:image') && !image))
    .filter(([name]) => !(name === 'og:url' && !url))
    .map(([, tag]) => `  ${tag}`)
    .join('\n');

  html = html.replace(descTag, `${descTag}\n${rendered}`);
  return html;
}

async function fetchSeo(execUrl) {
  const u = new URL(execUrl);
  u.searchParams.set('mode', 'homefast');
  u.searchParams.set('fresh', '1');
  u.searchParams.set('_seo_prerender', Date.now().toString());

  const response = await fetch(u, {
    redirect: 'follow',
    headers: { 'user-agent': 'LP360-GitHub-SEO-Prerender/1.0' },
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const payload = await response.json();
  if (!payload || payload.success === false) throw new Error(payload?.message || 'Apps Script returned success=false');
  const data = payload.data || payload;
  return {
    title: String(data?.seo?.title || '').trim(),
    description: String(data?.seo?.description || '').trim(),
    image: normalizeImageUrl(data?.images?.heroImage || ''),
  };
}

const config = await fs.readFile(configPath, 'utf8');
const sites = parseSitesConfig(config);
const pagesBase = await basePagesUrl();

if (!sites.length) throw new Error('ไม่พบ MAIN_EXEC_URL ใน sites-config.js');

let changed = 0;
let failed = 0;

for (const site of sites) {
  const indexPath = siteIndexPath(site.key);
  try {
    await fs.access(indexPath);
  } catch {
    console.log(`[skip] ${site.key}: ไม่มี ${path.relative(root, indexPath)}`);
    continue;
  }

  try {
    const seo = await fetchSeo(site.execUrl);
    if (!seo.title && !seo.description) throw new Error('T3/T4 ว่างทั้งคู่');

    const before = await fs.readFile(indexPath, 'utf8');
    const after = updateHtml(before, {
      title: seo.title || 'Learning Platform 360',
      description: seo.description,
      image: seo.image,
      url: siteUrl(pagesBase, site.key),
    });

    if (after !== before) {
      await fs.writeFile(indexPath, after, 'utf8');
      changed++;
      console.log(`[updated] ${site.key}: ${seo.title || '(ไม่มี T3)'}`);
    } else {
      console.log(`[unchanged] ${site.key}`);
    }
  } catch (error) {
    failed++;
    console.error(`[error] ${site.key}: ${error.message}`);
  }
}

console.log(`SEO prerender complete: changed=${changed}, failed=${failed}`);
if (failed > 0) process.exitCode = 1;
