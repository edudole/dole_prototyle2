/* LP360 central site configuration
 * แก้ URL /exec หลักของทุกเว็บไซต์ และ Student Profile เฉพาะเว็บไซต์ที่ใช้งาน ที่ไฟล์นี้ไฟล์เดียว
 * เวลาเพิ่มตำบล: copy /tambon1 -> /tambon4 แล้วเพิ่ม entry tambon4 ด้านล่าง
 */
(() => {
  'use strict';
  const SITES = Object.freeze({
    district: Object.freeze({
      SITE_TYPE: 'DISTRICT',
      MAIN_EXEC_URL: 'https://script.google.com/macros/s/AKfycbzGOcbm-5oerlRH5T0z_HPn-wddQVySLeUqL29zObB8LcHmFTW7L101G3zxX_ucfX-y/exec',
      STUDENT_PROFILE_EXEC_URL: 'https://script.google.com/macros/s/AKfycbzKjAvy0NQXPI0vG-BkeAu1tmYEaooUHabIQUfwZ2Hn00prrOfCtLWHz6QewWA6qVPqgw/exec',
      CACHE_PREFIX: 'LP360:DISTRICT:ROOT:'
    }),
    tambon1: Object.freeze({
      SITE_TYPE: 'TAMBOL',
      MAIN_EXEC_URL: 'https://script.google.com/macros/s/AKfycby7DjChYbHHeFr2aiPFzORgzGpTcsWmkyo80g7RXc3Vfmn7rV7lN5QhORBAgQpSNRmg/exec',
      STUDENT_PROFILE_EXEC_URL: 'https://script.google.com/macros/s/AKfycbwNB4dq0YXzd0Igk3KxXC_8vUG519Ceii8aZG3sc1nv2qYbzn4519K5LiYHCyl2Sfia9A/exec',
      CACHE_PREFIX: 'LP360:TAMBOL:TAMBON1:'
    }),
    tambon2: Object.freeze({
      SITE_TYPE: 'TAMBOL',
      MAIN_EXEC_URL: '',
      STUDENT_PROFILE_EXEC_URL: '',
      CACHE_PREFIX: 'LP360:TAMBOL:TAMBON2:'
    }),
    tambon3: Object.freeze({
      SITE_TYPE: 'TAMBOL',
      MAIN_EXEC_URL: '',
      STUDENT_PROFILE_EXEC_URL: '',
      CACHE_PREFIX: 'LP360:TAMBOL:TAMBON3:'
    }),
    library: Object.freeze({
      SITE_TYPE: 'LIBRARY',
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
    EXEC_URL: site.MAIN_EXEC_URL,
    API_URL: site.MAIN_EXEC_URL,
    MAIN_EXEC_URL: site.MAIN_EXEC_URL,
    STUDENT_PROFILE_EXEC_URL: site.STUDENT_PROFILE_EXEC_URL || '',
    CACHE_PREFIX: site.CACHE_PREFIX
  });

  window.LP360_SITES_CONFIG = SITES;
  window.LP360_CURRENT_SITE_KEY = SITE_KEY;
  window.APP_CONFIG = cfg;
  if (cfg.STUDENT_PROFILE_EXEC_URL) {
    window.STUDENT_PROFILE_WEB_APP_URL = cfg.STUDENT_PROFILE_EXEC_URL;
  }
})();
