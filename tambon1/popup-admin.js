/* LP360 popup_admin - public display on index.html only */
(() => {
  'use strict';
  const cfg = window.APP_CONFIG || {};
  const execUrl = String(cfg.MAIN_EXEC_URL || cfg.EXEC_URL || '').trim();
  if (!execUrl) return;

  function jsonp(baseUrl, params) {
    return new Promise((resolve, reject) => {
      const cb = '__lp360PopupAdmin_' + Date.now() + '_' + Math.random().toString(36).slice(2);
      const script = document.createElement('script');
      const timer = setTimeout(() => done(false, new Error('timeout')), 15000);
      function done(ok, value) {
        clearTimeout(timer);
        try { delete window[cb]; } catch (_) { window[cb] = undefined; }
        if (script.parentNode) script.parentNode.removeChild(script);
        ok ? resolve(value) : reject(value);
      }
      window[cb] = payload => done(true, payload);
      const u = new URL(baseUrl);
      Object.entries(params || {}).forEach(([k,v]) => u.searchParams.set(k, v));
      u.searchParams.set('callback', cb);
      u.searchParams.set('_', Date.now());
      script.src = u.toString();
      script.async = true;
      script.onerror = () => done(false, new Error('network'));
      document.head.appendChild(script);
    });
  }

  function cleanColor(value, fallback) {
    const v = String(value || '').trim();
    return /^#[0-9a-f]{3,8}$/i.test(v) || /^(rgb|hsl)a?\(/i.test(v) ? v : fallback;
  }

  function closePopup(root) {
    if (!root) return;
    root.hidden = true;
    root.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('lp360-popup-admin-open');
  }

  function render(data) {
    data = data || {};
    if (String(data.mode || '').trim().toLowerCase() !== 'block') return;
    const title = String(data.text || '').trim();
    const imageUrl = String(data.imageUrl || '').trim();
    const detailUrl = String(data.detailUrl || '').trim();
    if (!title && !imageUrl && !detailUrl) return;

    let root = document.getElementById('lp360PopupAdmin');
    if (root) root.remove();
    root = document.createElement('div');
    root.id = 'lp360PopupAdmin';
    root.className = 'lp360-popup-admin swal2-container swal2-center swal2-backdrop-show';
    root.setAttribute('aria-hidden', 'false');

    const dialog = document.createElement('div');
    dialog.className = 'lp360-popup-admin__dialog';
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');
    dialog.style.background = cleanColor(data.backgroundColor, '#ffffff');
    dialog.style.color = cleanColor(data.textColor, '#263238');

    const close = document.createElement('button');
    close.type = 'button'; close.className = 'lp360-popup-admin__close'; close.setAttribute('aria-label','ปิด'); close.textContent = '×';
    close.addEventListener('click', () => closePopup(root));
    dialog.appendChild(close);

    if (title) {
      const h = document.createElement('div');
      h.className = 'lp360-popup-admin__title';
      h.textContent = title;
      h.style.color = cleanColor(data.textColor, '#263238');
      dialog.appendChild(h);
    }
    if (imageUrl) {
      const wrap = document.createElement('div'); wrap.className='lp360-popup-admin__image-wrap';
      const img = document.createElement('img'); img.className='lp360-popup-admin__image'; img.src=imageUrl; img.alt=title || 'ประชาสัมพันธ์';
      wrap.appendChild(img); dialog.appendChild(wrap);
    }
    if (detailUrl) {
      const actions = document.createElement('div'); actions.className='lp360-popup-admin__actions';
      const a = document.createElement('a'); a.className='lp360-popup-admin__detail'; a.href=detailUrl; a.target='_blank'; a.rel='noopener noreferrer'; a.textContent='รายละเอียด';
      actions.appendChild(a); dialog.appendChild(actions);
    }
    root.appendChild(dialog);
    root.addEventListener('click', e => { if (e.target === root) closePopup(root); });
    document.addEventListener('keydown', function esc(e){ if(e.key==='Escape'){ closePopup(root); document.removeEventListener('keydown',esc); }});
    document.body.appendChild(root);
    document.body.classList.add('lp360-popup-admin-open');
  }

  function start() {
    jsonp(execUrl, { mode: 'popupadmin' })
      .then(res => { if (res && res.success !== false) render(res.data || res); })
      .catch(() => {});
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once:true });
  else start();
})();
