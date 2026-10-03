(() => {
  'use strict';

  const STANDALONE_ONLINE = [
    { label: 'หลักสูตรออนไลน์', href: '#cliproomBox' },
    { label: 'อ่านหนังสือสะสมเวลา', href: '#readBookTimeBox' }
  ];

  const EXCLUDED_SECTION_IDS = new Set(['studentBox', 'buttonsection']);

  const KNOWN_SECTION_LABELS = Object.freeze({
    news: 'ข่าวสาร',
    studentBox: 'เมนูลัด',
    studentServicesBox: 'บริการนักศึกษา',
    userBox: 'รายการ User',
    learningSourceBox: 'แหล่งเรียนรู้',
    activityBox: 'จดหมายข่าว',
    FBpostBox: 'โพสต์จากพื้นที่',
    featured: 'หนังสือที่น่าสนใจ',
    bestPracticeBox: 'แนวปฏิบัติที่เป็นเลิศ',
    buttonsection: 'ปุ่มทางลัด'
  });

  function cleanLabel(value) {
    return String(value || '').replace(/[▾▼⌄]+/g, '').replace(/\s+/g, ' ').trim();
  }

  function sectionVisibleByElement(el) {
    return !!el && el.dataset.sectionVisible !== 'false' && !el.hidden;
  }

  function sectionVisible(href) {
    if (!href || !href.startsWith('#')) return true;
    return sectionVisibleByElement(document.getElementById(href.slice(1)));
  }

  function sectionLabel(section) {
    if (!section) return '';
    const explicit = cleanLabel(section.dataset.navLabel || section.dataset.onlineServiceLabel || '');
    if (explicit) return explicit;

    const labelledBy = cleanLabel(section.getAttribute('aria-labelledby'));
    if (labelledBy) {
      const labelled = document.getElementById(labelledBy);
      const text = cleanLabel(labelled?.textContent || '');
      if (text) return text;
    }

    const heading = section.querySelector('h1,h2,h3,[data-section-title]');
    const headingText = cleanLabel(heading?.textContent || '');
    if (headingText) return headingText;

    const aria = cleanLabel(section.getAttribute('aria-label') || '');
    if (aria) return aria;

    return KNOWN_SECTION_LABELS[section.id] || section.id;
  }

  function removeExcludedShortcutLinks(nav) {
    Array.from(nav.children).forEach(node => {
      if (!node.matches?.('a[href^="#"]')) return;
      const href = node.getAttribute('href') || '';
      const id = href.startsWith('#') ? href.slice(1) : '';
      const label = cleanLabel(node.textContent || '');
      if (EXCLUDED_SECTION_IDS.has(id) || /^(เมนูลัด|ปุ่มทางลัด)$/i.test(label)) node.remove();
    });
  }

  function removeStandaloneShopActivity(nav) {
    Array.from(nav.children).forEach(node => {
      if (!node.matches?.('a[href="#learningBaseModule"]')) return;
      if (/ช้อปกิจกรรม/i.test(cleanLabel(node.textContent))) node.remove();
    });
  }

  function ensureStudentLink(nav) {
    let a = nav.querySelector('[data-lp360-nav="student-services"]');
    const section = document.getElementById('studentServicesBox');
    if (!section) {
      a?.remove();
      return;
    }
    if (!a) {
      a = document.createElement('a');
      a.dataset.lp360Nav = 'student-services';
      a.href = '#studentServicesBox';
      const learning = Array.from(nav.children).find(n => n.matches?.('a[href="#learningSourceBox"]'));
      if (learning) learning.after(a); else nav.appendChild(a);
    }
    a.textContent = sectionLabel(section) || 'บริการนักศึกษา';
    a.hidden = !sectionVisibleByElement(section);
  }

  function ensureStandaloneOnlineLinks(nav) {
    // Remove the old “บริการออนไลน์” dropdown if it still exists from an earlier build.
    nav.querySelector('[data-lp360-nav="online-services"]')?.remove();

    STANDALONE_ONLINE.forEach((item, index) => {
      const section = document.getElementById(item.href.slice(1));
      let a = Array.from(nav.children).find(node => node.matches?.(`a[href="${item.href}"]`));
      if (!section) {
        a?.remove();
        return;
      }
      if (!a) {
        a = document.createElement('a');
        a.href = item.href;
        a.dataset.lp360Nav = index === 0 ? 'online-course' : 'readbook-time';
        const student = nav.querySelector('[data-lp360-nav="student-services"]');
        const previous = index > 0 ? Array.from(nav.children).find(node => node.matches?.(`a[href="${STANDALONE_ONLINE[index - 1].href}"]`)) : null;
        if (previous) previous.after(a);
        else if (student) student.after(a);
        else nav.appendChild(a);
      }
      a.textContent = item.label;
      a.hidden = !sectionVisibleByElement(section);
    });

    // “ช้อปกิจกรรม” stays out of the top-level menu.
    removeStandaloneShopActivity(nav);
  }

  function syncExistingSectionLinks(nav) {
    Array.from(nav.children).forEach(node => {
      if (!node.matches?.('a[href^="#"]')) return;
      const href = node.getAttribute('href');
      if (!href || href === '#home') return;
      const target = document.getElementById(href.slice(1));
      // Non-generated section links disappear when their SECTION no longer exists.
      if (!target) {
        node.hidden = true;
        return;
      }
      node.hidden = !sectionVisibleByElement(target);
      const autoName = node.dataset.lp360AutoSection;
      if (autoName) node.textContent = sectionLabel(target);
    });
  }

  function syncAutoSections(nav) {
    const sections = Array.from(document.querySelectorAll('main section[id]'));
    const currentIds = new Set(sections.map(section => section.id));

    // Remove generated menu entries when the corresponding SECTION is deleted.
    nav.querySelectorAll('a[data-lp360-auto-section]').forEach(a => {
      const id = a.dataset.lp360AutoSection || '';
      if (!currentIds.has(id)) a.remove();
    });

    sections.forEach(section => {
      if (!section.id || section.id === 'home') return;
      const href = `#${section.id}`;

      // These are intentionally represented elsewhere.
      if (STANDALONE_ONLINE.some(item => item.href === href) || href === '#learningBaseModule' || section.id === 'studentServicesBox' || EXCLUDED_SECTION_IDS.has(section.id)) return;

      const existing = Array.from(nav.children).find(node => node.matches?.(`a[href="${href}"]`));
      if (existing) {
        existing.hidden = !sectionVisibleByElement(section);
        if (existing.dataset.lp360AutoSection) existing.textContent = sectionLabel(section);
        return;
      }

      const a = document.createElement('a');
      a.href = href;
      a.dataset.lp360AutoSection = section.id;
      a.textContent = sectionLabel(section);
      a.hidden = !sectionVisibleByElement(section);
      nav.appendChild(a);
    });
  }

  function sync() {
    const nav = document.querySelector('.site-header .main-nav');
    if (!nav) return;
    removeExcludedShortcutLinks(nav);
    removeStandaloneShopActivity(nav);
    ensureStudentLink(nav);
    ensureStandaloneOnlineLinks(nav);
    syncAutoSections(nav);
    syncExistingSectionLinks(nav);
    document.dispatchEvent(new CustomEvent('lp360:main-nav-updated'));
  }

  let queued = false;
  function queueSync() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      sync();
    });
  }

  function init() {
    sync();
    const main = document.querySelector('main');
    if (main) {
      new MutationObserver(queueSync).observe(main, {
        subtree: true,
        childList: true,
        attributes: true,
        attributeFilter: ['data-section-visible', 'hidden', 'data-nav-label', 'data-online-service-label', 'aria-label', 'aria-labelledby']
      });
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
