/* LP360 per-site storage isolation.
 * Prevents localStorage/sessionStorage cache, image URLs, admin sessions and UI preferences
 * from one website being read by another website on the same GitHub Pages origin.
 */
(() => {
  'use strict';
  const cfg = window.APP_CONFIG || {};
  const prefix = String(cfg.CACHE_PREFIX || 'LP360:UNKNOWN:');
  const siteType = String(cfg.SITE_TYPE || 'UNKNOWN');
  const siteKey = String(cfg.SITE_KEY || 'unknown');

  function canonicalKey(input) {
    const key = String(input == null ? '' : input);
    if (!key.startsWith('LP360:')) return key;
    if (key.startsWith(prefix)) return key;

    let m;
    // Old site-scoped keys: convert to this site's namespace.
    if ((m = key.match(/^LP360:DISTRICT:(.*)$/))) return prefix + m[1];
    if ((m = key.match(/^LP360:LIBRARY:(.*)$/))) return prefix + m[1];
    if ((m = key.match(/^LP360:TAMBOL:[^:]+:(.*)$/))) return prefix + m[1];
    if ((m = key.match(/^LP360:TAMBOL:(.*)$/))) return prefix + m[1];

    // Previously-global UI keys such as LP360:TEMPLATE / COLOR / HERO_CONTENT.
    return prefix + 'UI:' + key.slice('LP360:'.length);
  }

  function patchStoragePrototype() {
    if (!window.Storage || !Storage.prototype || Storage.prototype.__lp360SiteIsolated) return;
    const proto = Storage.prototype;
    const get = proto.getItem;
    const set = proto.setItem;
    const remove = proto.removeItem;
    Object.defineProperties(proto, {
      getItem: {
        value: function (k) { return get.call(this, canonicalKey(k)); },
        configurable: true,
        writable: true
      },
      setItem: {
        value: function (k, v) { return set.call(this, canonicalKey(k), v); },
        configurable: true,
        writable: true
      },
      removeItem: {
        value: function (k) { return remove.call(this, canonicalKey(k)); },
        configurable: true,
        writable: true
      },
      __lp360SiteIsolated: { value: true, configurable: true }
    });
  }

  try { patchStoragePrototype(); } catch (_) {}
  window.LP360_STORAGE_KEY = canonicalKey;
  window.LP360_SITE_IDENTITY = Object.freeze({ siteKey, siteType, cachePrefix: prefix });
})();
