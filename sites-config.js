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
      MAIN_EXEC_URL: 'https://script.google.com/macros/s/AKfycbwuKYgVZRYIbujm1hHv4lQchRIPaKN-X300y7jOHgcNyvK_60-CFOzadomro0e4HVS59A/exec',
      STUDENT_PROFILE_EXEC_URL: 'https://script.google.com/macros/s/AKfycbytWX0psf7c4a88mgfeDnnOy13x4KcPSpS32G66NTm32igiHb2y-c0QqzkrgWpf4l0J/exec',
      CACHE_PREFIX: 'LP360:TAMBOL:TAMBON1:'
    }),
    tambon2: Object.freeze({
      SITE_TYPE: 'TAMBOL',
      MAIN_EXEC_URL: 'https://script.google.com/macros/s/AKfycbyXrG7HZVrpflXKo-rr4jf2Ez79NqWpSEgh6bBD0OXSrk5oX9_SWl4CatDBFX5gS8c-RA/exec',
      STUDENT_PROFILE_EXEC_URL: 'https://script.google.com/macros/s/AKfycbzdAKhonGUj6_kCjxqaFC-C-ZpDWx1BDNLYB5Rr_PdnNgeNYshkUTu9dL7LP24Uu1PQlg/exec',
      CACHE_PREFIX: 'LP360:TAMBOL:TAMBON2:'
    }),
    tambon3: Object.freeze({
      SITE_TYPE: 'TAMBOL',
      MAIN_EXEC_URL: 'https://script.google.com/macros/s/AKfycby4zrYBs2oTyzy_NdWxRimVFTEJUdvb6_TclonS4MlFLlVqmOdaYFucnVnXV3FaFPQs_A/exec',
      STUDENT_PROFILE_EXEC_URL: 'https://script.google.com/macros/s/AKfycbwptlgqNH1jg2NjwyeumhD6Mdtyx7niQo6L8wI8H_fMbbyflNx4IHbFwwGg8Su6VIlbPg/exec',
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
