(() => {
  'use strict';

  const ICON_RULES = [
    [/^home$/i, 'fa-solid fa-house'],
    [/รู้จักเรา|เกี่ยวกับ|about/i, 'fa-solid fa-circle-info'],
    [/ผลงาน/i, 'fa-solid fa-trophy'],
    [/แหล่งเรียนรู้/i, 'fa-solid fa-location-dot'],
    [/หลักสูตร/i, 'fa-solid fa-graduation-cap'],
    [/ช้อปกิจกรรม|กิจกรรม/i, 'fa-solid fa-bag-shopping'],
    [/ห้องสมุด/i, 'fa-solid fa-book-open'],
    [/ตำบล|ศกร|ศศช/i, 'fa-solid fa-map-location-dot']
  ];

  let nav;
  let moreButton;
  let panel;
  let panelTitle;
  let panelBody;
  let mobileItems = [];
  let resizeFrame = 0;
  let activeHref = '#home';
  let sectionObserver = null;
  let visibilityObserver = null;

  function cleanLabel(value) {
    return String(value || '')
      .replace(/[▾▼⌄]+/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, char => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
    }[char]));
  }

  function iconFor(label) {
    const match = ICON_RULES.find(([pattern]) => pattern.test(label));
    return match ? match[1] : 'fa-solid fa-link';
  }

  function desktopTopLevelItems() {
    const desktopNav = document.querySelector('.site-header .main-nav');
    if (!desktopNav) return [];

    return Array.from(desktopNav.children).map((node, index) => {
      if (node.matches('a[href]')) {
        const label = cleanLabel(node.textContent);
        return {
          key: `link-${index}`,
          type: 'link',
          label,
          href: node.getAttribute('href') || '#',
          target: node.getAttribute('target') || '',
          rel: node.getAttribute('rel') || '',
          icon: iconFor(label),
          source: node
        };
      }

      if (node.classList.contains('main-nav-dropdown')) {
        const toggle = node.querySelector(':scope > .main-nav-dropdown-toggle');
        if (!toggle) return null;
        const label = cleanLabel(toggle.textContent);
        const menu = node.querySelector(':scope > .main-nav-dropdown-menu');
        return {
          key: `dropdown-${index}`,
          type: 'submenu',
          label,
          icon: iconFor(label),
          source: node,
          submenuId: menu?.id || '',
          desktopIndex: index
        };
      }

      return null;
    }).filter(Boolean);
  }

  function resolveSubmenuMenu(item) {
    if (!item) return null;

    // เมนู สกร.ระดับตำบล/ห้องสมุด ถูกเติมข้อมูลแบบ dynamic หลังหน้าเริ่มโหลด
    // จึงต้องหา element ปัจจุบันใหม่ทุกครั้ง แทนการพึ่ง DOM reference ตอนเริ่มต้นเพียงครั้งเดียว
    if (item.submenuId) {
      const byId = document.getElementById(item.submenuId);
      if (byId) return byId;
    }

    const desktopNav = document.querySelector('.site-header .main-nav');
    if (desktopNav && Number.isInteger(item.desktopIndex)) {
      const currentNode = desktopNav.children[item.desktopIndex];
      const currentMenu = currentNode?.querySelector?.(':scope > .main-nav-dropdown-menu');
      if (currentMenu) return currentMenu;
    }

    return item.source?.querySelector?.(':scope > .main-nav-dropdown-menu') || null;
  }

  function submenuItems(item) {
    const menu = resolveSubmenuMenu(item);
    if (!menu) return [];
    return Array.from(menu.querySelectorAll('a[href]')).map(link => ({
      label: cleanLabel(link.textContent),
      href: link.getAttribute('href') || link.href,
      target: link.getAttribute('target') || '',
      rel: link.getAttribute('rel') || ''
    })).filter(row => row.label && row.href);
  }

  function makeMobileItem(item) {
    let el;
    if (item.type === 'submenu') {
      el = document.createElement('button');
      el.type = 'button';
      el.setAttribute('aria-expanded', 'false');
      el.className = 'mobile-bottom-link mobile-bottom-menu-trigger';
      el.addEventListener('click', () => {
        const isOpen = el.getAttribute('aria-expanded') === 'true' && panel && !panel.hidden;
        if (isOpen) closePanel();
        else openSubmenu(item, el);
      });
    } else {
      el = document.createElement('a');
      el.href = item.href;
      if (item.target) el.target = item.target;
      if (item.rel) el.rel = item.rel;
      el.className = 'mobile-bottom-link';
      el.dataset.mobileHref = item.href;
      el.addEventListener('click', () => {
        activeHref = item.href;
        setActiveByHref(item.href);
        closePanel();
      });
    }

    el.dataset.mobileBottomItem = '1';
    el.dataset.mobileMenuKey = item.key;
    el.innerHTML = `<i class="${item.icon}" aria-hidden="true"></i><span>${escapeHtml(item.label)}</span>`;
    el._mobileMenuDefinition = item;
    return el;
  }

  function buildFromMainNav() {
    if (!nav || !moreButton) return;

    nav.querySelectorAll('[data-mobile-bottom-item]').forEach(node => node.remove());

    const definitions = [{
      key: 'home', type: 'link', label: 'Home', href: '#home', target: '', rel: '',
      icon: 'fa-solid fa-house', source: document.querySelector('.site-header .brand')
    }, ...desktopTopLevelItems()];

    definitions.forEach(def => nav.insertBefore(makeMobileItem(def), moreButton));
    mobileItems = Array.from(nav.querySelectorAll('[data-mobile-bottom-item]'));

    syncSectionVisibility();
    bindSectionObserver();
    fitItems();
    setActiveByHref(activeHref);
  }

  function closePanel() {
    if (!panel) return;
    panel.hidden = true;
    nav?.classList.remove('mobile-bottom-panel-open');
    mobileItems.forEach(item => item.setAttribute('aria-expanded', 'false'));
    moreButton?.setAttribute('aria-expanded', 'false');
  }

  function renderPanel(title, rows, options = {}) {
    if (!panel || !panelTitle || !panelBody) return;
    panelTitle.textContent = title;
    panelBody.innerHTML = '';

    if (options.back) {
      const back = document.createElement('button');
      back.type = 'button';
      back.className = 'mobile-bottom-panel-row';
      back.innerHTML = '<i class="fa-solid fa-arrow-left" aria-hidden="true"></i><span>เมนูเพิ่มเติม</span>';
      back.addEventListener('click', openOverflow);
      panelBody.appendChild(back);
    }

    if (!rows.length) {
      const empty = document.createElement('div');
      empty.className = 'mobile-bottom-panel-empty';
      empty.textContent = 'กำลังโหลดหรือยังไม่มีข้อมูล';
      panelBody.appendChild(empty);
    } else {
      rows.forEach(row => {
        if (row.type === 'submenu') {
          const button = document.createElement('button');
          button.type = 'button';
          button.className = 'mobile-bottom-panel-row mobile-bottom-panel-submenu';
          button.innerHTML = `<i class="${row.icon}" aria-hidden="true"></i><span>${escapeHtml(row.label)}</span><i class="fa-solid fa-chevron-right mobile-bottom-panel-chevron" aria-hidden="true"></i>`;
          button.addEventListener('click', () => openSubmenu(row, null, true));
          panelBody.appendChild(button);
          return;
        }

        const link = document.createElement('a');
        link.className = 'mobile-bottom-panel-row';
        link.href = row.href;
        if (row.target) link.target = row.target;
        if (row.rel) link.rel = row.rel;
        link.innerHTML = `<i class="${row.icon || 'fa-solid fa-link'}" aria-hidden="true"></i><span>${escapeHtml(row.label)}</span>`;
        link.addEventListener('click', closePanel);
        panelBody.appendChild(link);
      });
    }

    panel.hidden = false;
    nav.classList.add('mobile-bottom-panel-open');
  }

  function openSubmenu(item, trigger, fromOverflow = false) {
    mobileItems.forEach(node => node.setAttribute('aria-expanded', 'false'));
    moreButton?.setAttribute('aria-expanded', 'false');
    if (trigger) trigger.setAttribute('aria-expanded', 'true');

    const rows = submenuItems(item).map(row => ({
      ...row,
      type: 'link',
      icon: 'fa-solid fa-angle-right'
    }));
    renderPanel(item.label, rows, { back: fromOverflow });
  }

  function openOverflow() {
    const rows = mobileItems
      .filter(item => item.classList.contains('mobile-bottom-overflowed') && !item.hidden)
      .map(item => item._mobileMenuDefinition)
      .filter(Boolean);

    mobileItems.forEach(item => item.setAttribute('aria-expanded', 'false'));
    moreButton?.setAttribute('aria-expanded', 'true');
    renderPanel('เมนูเพิ่มเติม', rows);
  }

  function sectionIdFromHref(href) {
    if (!href || !href.startsWith('#') || href.length < 2) return '';
    try { return decodeURIComponent(href.slice(1)); } catch (_) { return href.slice(1); }
  }

  function isTargetVisible(item) {
    const def = item._mobileMenuDefinition;
    if (!def || def.type !== 'link') return true;
    const id = sectionIdFromHref(def.href);
    if (!id) return true;
    const section = document.getElementById(id);
    return !section || section.dataset.sectionVisible !== 'false';
  }

  function syncSectionVisibility() {
    mobileItems.forEach(item => {
      const visible = isTargetVisible(item);
      item.hidden = !visible;
      item.setAttribute('aria-hidden', visible ? 'false' : 'true');
      if (!visible) item.setAttribute('tabindex', '-1');
      else item.removeAttribute('tabindex');
    });
    if (panel && !panel.hidden) closePanel();
    fitItems();
  }

  function fitItems() {
    if (!nav || window.innerWidth > 1024) return;
    const available = mobileItems.filter(item => !item.hidden);
    available.forEach(item => item.classList.remove('mobile-bottom-overflowed'));
    moreButton.hidden = true;

    const navWidth = Math.max(280, nav.clientWidth || window.innerWidth);
    const minItemWidth = navWidth <= 390 ? 88 : (navWidth <= 768 ? 92 : 96);
    const capacity = Math.max(4, Math.floor(navWidth / minItemWidth));

    if (available.length > capacity) {
      const directCount = Math.max(3, capacity - 1);
      available.forEach((item, index) => item.classList.toggle('mobile-bottom-overflowed', index >= directCount));
      moreButton.hidden = false;
    }

    const directCount = available.filter(item => !item.classList.contains('mobile-bottom-overflowed')).length;
    nav.style.setProperty('--mobile-bottom-columns', String(Math.max(1, directCount + (moreButton.hidden ? 0 : 1))));
  }

  function setActiveByHref(href) {
    activeHref = href || '#home';
    mobileItems.forEach(item => {
      const def = item._mobileMenuDefinition;
      item.classList.toggle('active', !!def && def.type === 'link' && def.href === activeHref);
    });
  }

  function bindSectionObserver() {
    sectionObserver?.disconnect();
    if (!('IntersectionObserver' in window)) return;

    const targets = [];
    mobileItems.forEach(item => {
      const def = item._mobileMenuDefinition;
      if (!def || def.type !== 'link') return;
      const id = sectionIdFromHref(def.href);
      const target = id && document.getElementById(id);
      if (target) targets.push({ target, href: def.href });
    });

    const hrefById = new Map(targets.map(x => [x.target.id, x.href]));
    sectionObserver = new IntersectionObserver(entries => {
      const visible = entries
        .filter(entry => entry.isIntersecting && entry.target.dataset.sectionVisible !== 'false')
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
      if (visible.length) setActiveByHref(hrefById.get(visible[0].target.id));
    }, { root: null, rootMargin: '-18% 0px -62% 0px', threshold: [0.01, 0.12, 0.25] });

    targets.forEach(({ target }) => sectionObserver.observe(target));
  }

  function bindVisibilityObserver() {
    visibilityObserver?.disconnect();
    visibilityObserver = new MutationObserver(records => {
      if (records.some(record => record.type === 'attributes' && record.attributeName === 'data-section-visible')) {
        syncSectionVisibility();
      }
    });
    document.querySelectorAll('[data-section-visible]').forEach(node => {
      visibilityObserver.observe(node, { attributes: true, attributeFilter: ['data-section-visible'] });
    });
  }

  function bindDesktopMenuObserver() {
    const desktopNav = document.querySelector('.site-header .main-nav');
    if (!desktopNav) return;

    const observer = new MutationObserver(records => {
      const topLevelChanged = records.some(record =>
        record.type === 'childList' && record.target === desktopNav
      );

      // รายการ สกร.ระดับตำบล/ห้องสมุด ถูก render ภายหลังด้วย innerHTML
      // ไม่ rebuild mobile nav ทั้งชุดเพื่อไม่ให้ panel กระพริบ แต่ถ้า submenu ที่เปิดอยู่
      // เปลี่ยนข้อมูล ให้ render รายการล่าสุดทันที
      const submenuChanged = records.some(record =>
        record.type === 'childList' &&
        record.target instanceof Element &&
        record.target.classList.contains('main-nav-dropdown-menu')
      );

      if (topLevelChanged) {
        buildFromMainNav();
        return;
      }

      if (submenuChanged && panel && !panel.hidden) {
        const title = cleanLabel(panelTitle?.textContent || '');
        const current = mobileItems
          .map(node => node._mobileMenuDefinition)
          .find(def => def?.type === 'submenu' && cleanLabel(def.label) === title);
        if (current) openSubmenu(current, null, false);
      }
    });

    observer.observe(desktopNav, { childList: true, subtree: true });
  }

  function init() {
    nav = document.getElementById('mobileBottomNav');
    if (!nav) return;
    moreButton = document.getElementById('mobileBottomMore');
    panel = document.getElementById('mobileBottomPanel');
    panelTitle = document.getElementById('mobileBottomPanelTitle');
    panelBody = document.getElementById('mobileBottomPanelBody');

    moreButton?.addEventListener('click', () => {
      const isOpen = moreButton.getAttribute('aria-expanded') === 'true' && panel && !panel.hidden;
      if (isOpen) closePanel();
      else openOverflow();
    });
    document.getElementById('mobileBottomPanelClose')?.addEventListener('click', closePanel);

    document.addEventListener('click', event => {
      if (!panel || panel.hidden || nav.contains(event.target)) return;
      closePanel();
    });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape') closePanel();
    });

    buildFromMainNav();
    bindVisibilityObserver();
    bindDesktopMenuObserver();

    window.addEventListener('resize', () => {
      cancelAnimationFrame(resizeFrame);
      resizeFrame = requestAnimationFrame(() => {
        if (window.innerWidth > 1024) closePanel();
        fitItems();
      });
    }, { passive: true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
