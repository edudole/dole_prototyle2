(() => {
  'use strict';

  const WEB_APP_URL = window.APP_CONFIG.EXEC_URL;
  const API_URL = WEB_APP_URL + '?mode=plan';
  let allItems = [];

  const escapeHtml = value => String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

  const safeUrl = value => {
    const url = String(value || '').trim();
    if (!/^https?:\/\//i.test(url)) return '';
    return url.replace(/^http:\/\//i, 'https://');
  };

  function populateLevelFilter() {
    const select = document.getElementById('planLevelFilter');
    if (!select) return;
    const current = String(select.value || '').trim();
    const seen = new Set(allItems.map(item => item.level).filter(Boolean));
    const preferred = ['ประถม', 'ม.ต้น', 'ม.ปลาย'].filter(value => seen.has(value));
    const extras = [...seen].filter(value => !preferred.includes(value));
    const options = [...preferred, ...extras];
    select.innerHTML = '<option value="">ทั้งหมด</option>' + options.map(value =>
      `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`
    ).join('');
    if (options.includes(current)) select.value = current;
  }

  function getFilteredItems() {
    const search = document.getElementById('planSearch');
    const filter = document.getElementById('planLevelFilter');
    const keyword = String(search?.value || '').trim().toLocaleLowerCase('th');
    const level = String(filter?.value || '').trim();

    return allItems.filter(item => {
      if (level && item.level !== level) return false;
      if (!keyword) return true;
      return item.title.toLocaleLowerCase('th').includes(keyword);
    });
  }

  function renderTable() {
    const body = document.getElementById('planTableBody');
    const count = document.getElementById('planCount');
    if (!body || !count) return;

    const items = getFilteredItems();
    count.textContent = `จำนวน ${items.length} รายการ`;

    if (!items.length) {
      body.innerHTML = '<tr><td class="plan-empty" colspan="5">ไม่พบแผนการจัดการเรียนรู้ที่ค้นหา</td></tr>';
      return;
    }

    body.innerHTML = items.map(item => {
      const fileUrl = safeUrl(item.fileUrl);
      const button = fileUrl
        ? `<a class="plan-download" href="${escapeHtml(fileUrl)}" target="_blank" rel="noopener noreferrer">ดาวน์โหลดไฟล์</a>`
        : '<span class="plan-no-file">ไม่มีไฟล์</span>';

      return `<tr>
        <td class="plan-number">${escapeHtml(item.order || '-')}</td>
        <td class="plan-title">${escapeHtml(item.title || '-')}</td>
        <td class="plan-level">${escapeHtml(item.level || '-')}</td>
        <td class="plan-date">${escapeHtml(item.uploadDate || '-')}</td>
        <td class="plan-download-cell">${button}</td>
      </tr>`;
    }).join('');
  }

  async function loadPlans() {
    const status = document.getElementById('planStatus');
    const body = document.getElementById('planTableBody');
    const count = document.getElementById('planCount');

    try {
      const response = await fetch(API_URL, { method: 'GET', cache: 'no-store' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result = await response.json();
      if (result.success === false) throw new Error(result.message || 'โหลดข้อมูลไม่สำเร็จ');

      allItems = (Array.isArray(result.items) ? result.items : [])
        .map(item => ({
          rowNumber: Number(item.rowNumber || 0),
          order: String(item.order || '').trim(),
          title: String(item.title || '').trim(),
          level: String(item.level || '').trim(),
          uploadDate: String(item.uploadDate || '').trim(),
          fileUrl: String(item.fileUrl || '').trim()
        }))
        .filter(item => item.title || item.level || item.uploadDate || item.fileUrl)
        .sort((a, b) => b.rowNumber - a.rowNumber);

      populateLevelFilter();
      status.hidden = true;
      renderTable();
    } catch (error) {
      console.error('โหลดแผนการจัดการเรียนรู้ไม่สำเร็จ:', error);
      status.hidden = true;
      count.textContent = 'โหลดข้อมูลไม่สำเร็จ';
      body.innerHTML = `<tr><td class="plan-error" colspan="5">โหลดรายการไม่สำเร็จ<br>${escapeHtml(error.message)}</td></tr>`;
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('planSearch')?.addEventListener('input', renderTable);
    document.getElementById('planLevelFilter')?.addEventListener('change', renderTable);
    loadPlans();
  });
  document.addEventListener('plan-admin-updated', loadPlans);
})();
