(() => {
  'use strict';
  const ONLINE = [
    { label: 'หลักสูตรออนไลน์', href: '#cliproomBox' },
    { label: 'อ่านหนังสือสะสมเวลา', href: '#readBookTimeBox' },
    { label: 'ช้อปกิจกรรม', href: '#learningBaseModule' }
  ];

  function sectionVisible(href) {
    if (!href || !href.startsWith('#')) return true;
    const el = document.getElementById(href.slice(1));
    if (!el) return false;
    if (el.dataset.sectionVisible === 'false' || el.hidden) return false;
    return true;
  }

  function ensureStudentLink(nav) {
    let a = nav.querySelector('[data-lp360-nav="student-services"]');
    if (!a) {
      a = document.createElement('a');
      a.dataset.lp360Nav = 'student-services';
      a.href = '#studentServicesBox';
      a.textContent = 'บริการนักศึกษา';
      const learning = Array.from(nav.children).find(n => n.matches?.('a[href="#learningSourceBox"]'));
      if (learning) learning.after(a); else nav.appendChild(a);
    }
    a.hidden = !sectionVisible('#studentServicesBox');
  }

  function ensureOnlineDropdown(nav) {
    // ลบลิงก์หลักสูตรออนไลน์เดิมออกจากระดับบนสุด
    Array.from(nav.children).forEach(node => {
      if (node.matches?.('a[href="#cliproomBox"]') && /หลักสูตรออนไลน์/.test(node.textContent || '')) node.remove();
    });

    let box = nav.querySelector('[data-lp360-nav="online-services"]');
    if (!box) {
      box = document.createElement('div');
      box.className = 'main-nav-dropdown';
      box.dataset.lp360Nav = 'online-services';
      box.innerHTML = '<button class="main-nav-dropdown-toggle" type="button" aria-expanded="false">บริการออนไลน์ <span aria-hidden="true">▾</span></button><div id="onlineServicesMenuList" class="main-nav-dropdown-menu" role="menu"></div>';
      const student = nav.querySelector('[data-lp360-nav="student-services"]');
      if (student) student.after(box); else nav.appendChild(box);
    }
    const menu = box.querySelector('#onlineServicesMenuList');
    ONLINE.forEach(item => {
      let a = menu.querySelector(`a[href="${item.href}"]`);
      if (!a) {
        a = document.createElement('a');
        a.href = item.href;
        a.setAttribute('role','menuitem');
        a.textContent = item.label;
        menu.appendChild(a);
      }
      a.hidden = !sectionVisible(item.href);
    });
    box.hidden = !Array.from(menu.querySelectorAll('a[href]')).some(a => !a.hidden);
  }

  function syncAutoSections(nav) {
    // Section ใหม่ที่กำหนด data-nav-label จะเพิ่มเข้าสู่ main-nav อัตโนมัติ
    document.querySelectorAll('main section[id][data-nav-label]').forEach(section => {
      const href = `#${section.id}`;
      if (nav.querySelector(`a[href="${href}"]`) || ONLINE.some(x => x.href === href) || section.id === 'studentServicesBox') return;
      const a = document.createElement('a');
      a.href = href;
      a.dataset.lp360AutoSection = section.id;
      a.textContent = section.dataset.navLabel || section.id;
      a.hidden = !sectionVisible(href);
      nav.appendChild(a);
    });
    nav.querySelectorAll('a[data-lp360-auto-section]').forEach(a => { a.hidden = !sectionVisible(a.getAttribute('href')); });
  }

  function sync() {
    const nav = document.querySelector('.site-header .main-nav');
    if (!nav) return;
    ensureStudentLink(nav);
    ensureOnlineDropdown(nav);
    syncAutoSections(nav);
    document.dispatchEvent(new CustomEvent('lp360:main-nav-updated'));
  }

  let queued=false;
  function queueSync(){ if(queued) return; queued=true; requestAnimationFrame(()=>{queued=false;sync();}); }
  function init(){
    sync();
    const main=document.querySelector('main');
    if(main){
      new MutationObserver(queueSync).observe(main,{subtree:true,childList:true,attributes:true,attributeFilter:['data-section-visible','hidden','data-nav-label']});
    }
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init,{once:true}); else init();
})();
