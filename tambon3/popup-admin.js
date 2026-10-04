(() => {
  'use strict';

  const getApiUrl = () => {
    const cfg = window.APP_CONFIG || {};
    return String(cfg.EXEC_URL || cfg.API_URL || cfg.MAIN_EXEC_URL || '').trim();
  };

  const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'
  }[ch]));

  const safeColor = (value, fallback) => {
    const v = String(value || '').trim();
    return /^#[0-9a-f]{3,8}$/i.test(v) || /^(rgb|hsl)a?\(/i.test(v) || /^[a-z]+$/i.test(v) ? v : fallback;
  };

  async function loadPopupAdmin() {
    const api = getApiUrl();
    if (!api) return null;
    const joiner = api.includes('?') ? '&' : '?';
    const response = await fetch(api + joiner + 'mode=popupadmin&_=' + Date.now(), {
      method: 'GET',
      cache: 'no-store'
    });
    if (!response.ok) throw new Error('HTTP ' + response.status);
    const payload = await response.json();
    if (payload && payload.success === false) throw new Error(payload.message || 'โหลด popup_admin ไม่สำเร็จ');
    return payload && payload.data ? payload.data : payload;
  }

  async function showPopupAdmin() {
    try {
      const data = await loadPopupAdmin();
      if (!data || String(data.mode || '').toLowerCase() !== 'block') return;

      const message = String(data.message || '').trim();
      const imageUrl = String(data.imageUrl || '').trim();
      const detailUrl = String(data.detailUrl || '').trim();
      if (!message && !imageUrl && !detailUrl) return;

      const background = safeColor(data.backgroundColor, '#ffffff');
      const textColor = safeColor(data.textColor, '#000000');

      let html = '<div class="lp360-popup-admin-content">';
      if (imageUrl) {
        html += '<img class="lp360-popup-admin-image" src="' + esc(imageUrl) + '" alt="" loading="eager">';
      }
      html += '</div>';

      if (window.Swal && typeof Swal.fire === 'function') {
        await Swal.fire({
          title: message || undefined,
          html,
          width: 'min(620px, 94vw)',
          background,
          color: textColor,
          showCloseButton: true,
          showConfirmButton: !!detailUrl,
          confirmButtonText: 'รายละเอียด',
          confirmButtonColor: '#ff7258',
          allowOutsideClick: true,
          customClass: {
            popup: 'lp360-popup-admin',
            title: 'lp360-popup-admin-title',
            htmlContainer: 'lp360-popup-admin-html',
            confirmButton: 'lp360-popup-admin-detail'
          },
          didOpen: popup => {
            popup.style.setProperty('--lp360-popup-admin-text', textColor);
            const title = popup.querySelector('.swal2-title');
            if (title) title.style.color = textColor;
          }
        }).then(result => {
          if (result.isConfirmed && detailUrl) {
            window.open(detailUrl, '_blank', 'noopener,noreferrer');
          }
        });
      }
    } catch (error) {
      console.warn('popup_admin:', error);
    }
  }

  function start() {
    // ให้ popup หลักของหน้าเว็บโหลดก่อนเล็กน้อย แล้วจึงแสดง popup_admin ตรงกลางจอ
    setTimeout(showPopupAdmin, 450);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
