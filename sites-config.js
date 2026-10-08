/* LP360 central site configuration
 * แก้ URL /exec หลักของทุกเว็บไซต์ และ Student Profile เฉพาะเว็บไซต์ที่ใช้งาน ที่ไฟล์นี้ไฟล์เดียว
 * เวลาเพิ่มตำบล: copy /tambon1 -> /tambon4 แล้วเพิ่ม entry tambon4 ด้านล่าง
 */
(() => {
  'use strict';
  // ===== Global shared icon =====
  // แก้ URL รูปที่นี่จุดเดียว แล้วใช้ร่วมกันกับเว็บอำเภอ/ตำบล/ห้องสมุด และ /user/*.html
  const GLOBAL_ICON_URL = 'https://static.wixstatic.com/media/a503e5_b1f34c9cb73e40a0b027042bb3f6c959~mv2.png';

  // ===== User iframe pages =====
  // เพิ่มไฟล์ใหม่: copy /user/1.html -> /user/2.html แล้วเพิ่ม entry "2" ที่นี่
  const USER_PAGES = Object.freeze({
    '1': Object.freeze({
      EXEC_URL: 'https://script.google.com/macros/s/AKfycbxhPzR-m9fQL09JxWIJ3wyhaFu7dP2e3mZIO-WbFpiZMBlpHvagUsEwpcfk-eOG4lAW4Q/exec',
      SEO_TITLE: 'ศกร.ระดับตำบลปารีส',
      SEO_DESCRIPTION: 'ศกร.ระดับตำบลปารีส'
    })
  });

  const SITES = Object.freeze({
    district: Object.freeze({
      SITE_TYPE: 'DISTRICT',
      SEO_TITLE: "เว็บไซต์ สกร.ระดับอำเภอ",
      SEO_DESCRIPTION: "เว็บไซต์ศูนย์ส่งเสริมการเรียนรู้ระดับอำเภอ",
      MAIN_EXEC_URL: 'https://script.google.com/macros/s/AKfycbyGRs8U6Y_90v4vp-b89DbPys6XdK10wNfk6wr9GlOodS56eCmt9mRAQaor06sPXSyw/exec',
      STUDENT_PROFILE_EXEC_URL: 'https://script.google.com/macros/s/AKfycbxRKggOqUnVELn9bzGp8CJq445aMjMjsLGb_QA9TlO-IQQ3v9-iduafBZYGAOWZY6MWMg/exec',
      CACHE_PREFIX: 'LP360:DISTRICT:ROOT:'
    }),
    tambon1: Object.freeze({
      SITE_TYPE: 'TAMBOL',
      SEO_TITLE: "เว็บไซต์ ศกร.ระดับตำบล 1",
      SEO_DESCRIPTION: "เว็บไซต์ศูนย์การเรียนรู้ระดับตำบล",
      MAIN_EXEC_URL: 'https://script.google.com/macros/s/AKfycby7DjChYbHHeFr2aiPFzORgzGpTcsWmkyo80g7RXc3Vfmn7rV7lN5QhORBAgQpSNRmg/exec',
      STUDENT_PROFILE_EXEC_URL: 'https://script.google.com/macros/s/AKfycbwNB4dq0YXzd0Igk3KxXC_8vUG519Ceii8aZG3sc1nv2qYbzn4519K5LiYHCyl2Sfia9A/exec',
      CACHE_PREFIX: 'LP360:TAMBOL:TAMBON1:'
    }),
    tambon2: Object.freeze({
      SITE_TYPE: 'TAMBOL',
      SEO_TITLE: "เว็บไซต์ ศกร.ระดับตำบล 2",
      SEO_DESCRIPTION: "เว็บไซต์ศูนย์การเรียนรู้ระดับตำบล",
      MAIN_EXEC_URL: 'https://script.google.com/macros/s/AKfycbyXrG7HZVrpflXKo-rr4jf2Ez79NqWpSEgh6bBD0OXSrk5oX9_SWl4CatDBFX5gS8c-RA/exec',
      STUDENT_PROFILE_EXEC_URL: 'https://script.google.com/macros/s/AKfycby6Djhw21tB-lHRdJUT5ZO6yDL-Ha6-cdzglEQ9TW6N_7Teyr1_xp4Ic07g8Ja2rh-Y/exec',
      CACHE_PREFIX: 'LP360:TAMBOL:TAMBON2:'
    }),
    tambon3: Object.freeze({
      SITE_TYPE: 'TAMBOL',
      SEO_TITLE: "เว็บไซต์ ศกร.ระดับตำบล 3",
      SEO_DESCRIPTION: "เว็บไซต์ศูนย์การเรียนรู้ระดับตำบล",
      MAIN_EXEC_URL: 'https://script.google.com/macros/s/AKfycbzdxC1rPWTuehzRtKKgzKOhiwFLYz5i6-e4Ak9wsDnRd3lMtNnI2KqKS90PdOPUPsVH/exec',
      STUDENT_PROFILE_EXEC_URL: 'https://script.google.com/macros/s/AKfycbxbrG5aYd2c0Fzz7aZ0qjqY3I1lDgnw4Wm2DUWo_oRzlfXP453wHSXgdv8Y3K5ZgMic/exec',
      CACHE_PREFIX: 'LP360:TAMBOL:TAMBON3:'
    }),
    library: Object.freeze({
      SITE_TYPE: 'LIBRARY',
      SEO_TITLE: "เว็บไซต์ห้องสมุด",
      SEO_DESCRIPTION: "เว็บไซต์ห้องสมุดประชาชน",
      MAIN_EXEC_URL: 'https://script.google.com/macros/s/AKfycbwjxamEm78z1EzEg29ZdAOlsicha9sBB_c0wqYaVU8vqm8YBcbk1fxlOeApojTfJkb9/exec',
      CACHE_PREFIX: 'LP360:LIBRARY:MAIN:'
    }),
  });

  function detectSiteKey() {
    const script = document.currentScript;
    let basePath = '/';
    try {
      if (script && script.src) basePath = new URL('.', script.src).pathname;
    } catch (_) {}
    let path = location.pathname || '/';
    if (path.startsWith(basePath)) path = path.slice(basePath.length);
    path = path.replace(/^\/+/, '');
    const first = (path.split('/')[0] || '').toLowerCase();
    if (first && Object.prototype.hasOwnProperty.call(SITES, first)) return first;
    return 'district';
  }

  const SITE_KEY = detectSiteKey();
  const site = SITES[SITE_KEY] || SITES.district;
  const cfg = Object.freeze({
    SITE_KEY,
    SITE_TYPE: site.SITE_TYPE,
    SEO_TITLE: site.SEO_TITLE || '',
    SEO_DESCRIPTION: site.SEO_DESCRIPTION || '',
    EXEC_URL: site.MAIN_EXEC_URL,
    API_URL: site.MAIN_EXEC_URL,
    MAIN_EXEC_URL: site.MAIN_EXEC_URL,
    STUDENT_PROFILE_EXEC_URL: site.STUDENT_PROFILE_EXEC_URL || '',
    CACHE_PREFIX: site.CACHE_PREFIX,
    GLOBAL_ICON_URL: GLOBAL_ICON_URL
  });

  function applyGlobalIcon_() {
    if (!GLOBAL_ICON_URL || !document || !document.head) return;
    const defs = [
      ['icon', 'image/png'],
      ['shortcut icon', 'image/png'],
      ['apple-touch-icon', ''],
      ['apple-touch-icon-precomposed', '']
    ];
    defs.forEach(([rel, type]) => {
      let el = document.head.querySelector('link[data-lp360-global-icon="' + rel + '"]');
      if (!el) {
        el = document.createElement('link');
        el.rel = rel;
        el.setAttribute('data-lp360-global-icon', rel);
        document.head.appendChild(el);
      }
      if (type) el.type = type;
      el.href = GLOBAL_ICON_URL;
    });
  }

  window.LP360_SITES_CONFIG = SITES;
  window.LP360_USER_PAGES_CONFIG = USER_PAGES;
  window.LP360_GLOBAL_ICON_URL = GLOBAL_ICON_URL;
  window.LP360_CURRENT_SITE_KEY = SITE_KEY;
  window.APP_CONFIG = cfg;
  if (cfg.STUDENT_PROFILE_EXEC_URL) {
    window.STUDENT_PROFILE_WEB_APP_URL = cfg.STUDENT_PROFILE_EXEC_URL;
  }
  applyGlobalIcon_();
})();
