(() => {
  'use strict';
  const DESKTOP_MIN = 1025;
  const FIT_TOLERANCE = 6;
  let queued = false;
  let measuring = false;

  const isDesktop = () => window.innerWidth >= DESKTOP_MIN;
  const visibleOriginals = nav => Array.from(nav.children).filter(el => !el.hidden);
  const getLabel = node => {
    if (!node) return '';
    if (node.matches('a')) return (node.textContent || '').trim();
    const t = node.querySelector(':scope > .main-nav-dropdown-toggle');
    if (!t) return (node.textContent || '').trim();
    return (t.childNodes[0]?.textContent || t.textContent || '').replace(/▾/g,'').trim();
  };

  function ensureOverflow(navWrap, nav){
    let box = navWrap.querySelector(':scope > .desktop-nav-overflow');
    if (box) return box;
    box = document.createElement('div');
    box.className = 'desktop-nav-overflow';
    box.hidden = true;
    box.innerHTML = '<button class="desktop-nav-overflow-toggle" type="button" aria-expanded="false" aria-label="เมนูเพิ่มเติม"><i class="fa-solid fa-bars" aria-hidden="true"></i></button><div class="desktop-nav-overflow-panel" hidden></div>';
    const profile = navWrap.querySelector(':scope > .nav-profile-actions');
    if (profile) navWrap.insertBefore(box, profile); else navWrap.appendChild(box);
    const btn = box.querySelector('.desktop-nav-overflow-toggle');
    const panel = box.querySelector('.desktop-nav-overflow-panel');
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const open = panel.hidden;
      panel.hidden = !open;
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (open) rebuildPanel(nav, panel);
    });
    document.addEventListener('click', e => {
      if (!box.contains(e.target)) { panel.hidden = true; btn.setAttribute('aria-expanded','false'); }
    });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && !panel.hidden) { panel.hidden=true; btn.setAttribute('aria-expanded','false'); btn.focus(); }
    });
    return box;
  }

  function cloneLinks(source, target){
    const links = Array.from(source.querySelectorAll('a[href]')).filter(a => !a.hidden);
    if (!links.length) {
      const status = source.querySelector('.main-nav-dropdown-status,.main-nav-dropdown-label');
      const empty = document.createElement('div');
      empty.className = 'desktop-nav-overflow-empty';
      empty.textContent = (status?.textContent || 'ไม่มีรายการ').trim();
      target.appendChild(empty);
      return;
    }
    links.forEach(a => {
      const c = document.createElement('a');
      c.href = a.getAttribute('href') || '#';
      c.textContent = (a.textContent || '').trim();
      if (a.target) c.target = a.target;
      if (a.rel) c.rel = a.rel;
      c.addEventListener('click', () => closeOverflow());
      target.appendChild(c);
    });
  }

  function closeOverflow(){
    const box=document.querySelector('.site-header .desktop-nav-overflow');
    if(!box) return;
    const panel=box.querySelector('.desktop-nav-overflow-panel');
    const btn=box.querySelector('.desktop-nav-overflow-toggle');
    if(panel) panel.hidden=true;
    if(btn) btn.setAttribute('aria-expanded','false');
  }

  function rebuildPanel(nav, panel){
    panel.textContent = '';
    const hidden = Array.from(nav.children).filter(el => el.classList.contains('lp-desktop-overflow-hidden') && !el.hidden);
    hidden.forEach(node => {
      if (node.matches('a[href]')) {
        const a=document.createElement('a');
        a.href=node.getAttribute('href') || '#';
        a.textContent=(node.textContent||'').trim();
        if(node.target) a.target=node.target;
        if(node.rel) a.rel=node.rel;
        a.addEventListener('click',closeOverflow);
        panel.appendChild(a);
        return;
      }
      const menu=node.querySelector(':scope > .main-nav-dropdown-menu');
      const row=document.createElement('button');
      row.type='button'; row.className='desktop-nav-overflow-row';
      row.innerHTML='<span></span><i class="fa-solid fa-chevron-down" aria-hidden="true"></i>';
      row.querySelector('span').textContent=getLabel(node);
      const sub=document.createElement('div');
      sub.className='desktop-nav-overflow-submenu'; sub.hidden=true;
      if(menu) cloneLinks(menu,sub); else { const e=document.createElement('div'); e.className='desktop-nav-overflow-empty'; e.textContent='ไม่มีรายการ'; sub.appendChild(e); }
      row.addEventListener('click',()=>{ sub.hidden=!sub.hidden; });
      panel.append(row,sub);
    });
  }

  function layout(){
    if(measuring) return;
    const header=document.querySelector('.site-header');
    const nav=header?.querySelector('.main-nav');
    const wrap=header?.querySelector('.nav-wrap');
    if(!nav||!wrap) return;
    measuring=true;
    try{
      const box=ensureOverflow(wrap,nav);
      const panel=box.querySelector('.desktop-nav-overflow-panel');
      const btn=box.querySelector('.desktop-nav-overflow-toggle');
      const wasOpen=!!(panel && !panel.hidden && btn?.getAttribute('aria-expanded')==='true');

      Array.from(nav.children).forEach(el=>el.classList.remove('lp-desktop-overflow-hidden'));
      if(!isDesktop()) {
        box.hidden=true;
        box.style.removeProperty('visibility');
        box.style.removeProperty('pointer-events');
        closeOverflow();
        return;
      }

      const candidates=visibleOriginals(nav);
      if(!candidates.length) {
        box.hidden=true;
        closeOverflow();
        return;
      }

      // วัดโดยสำรองพื้นที่ของปุ่มแฮมเบอร์เกอร์ไว้ตลอดรอบการคำนวณ
      // เพื่อไม่ให้ available width เปลี่ยนไปมาแล้วเมนูเด้งเข้า/ออก overflow.
      box.hidden=false;
      box.style.visibility='hidden';
      box.style.pointerEvents='none';
      panel.hidden=true;

      for(let i=candidates.length-1; i>=0 && nav.scrollWidth > nav.clientWidth + FIT_TOLERANCE; i--){
        candidates[i].classList.add('lp-desktop-overflow-hidden');
      }

      const hasHidden=!!nav.querySelector('.lp-desktop-overflow-hidden');
      if(!hasHidden){
        box.hidden=true;
        box.style.removeProperty('visibility');
        box.style.removeProperty('pointer-events');
        closeOverflow();
        return;
      }

      box.hidden=false;
      box.style.removeProperty('visibility');
      box.style.removeProperty('pointer-events');
      rebuildPanel(nav,panel);
      if(wasOpen){ panel.hidden=false; btn.setAttribute('aria-expanded','true'); }
      else { panel.hidden=true; btn.setAttribute('aria-expanded','false'); }
    } finally { measuring=false; }
  }

  function queue(){
    if(queued) return;
    queued=true;
    requestAnimationFrame(()=>{queued=false;layout();});
  }
  function init(){
    layout();
    window.addEventListener('resize',queue,{passive:true});
    document.addEventListener('lp360:main-nav-updated',queue);
    const nav=document.querySelector('.site-header .main-nav');
    if(nav){
      new MutationObserver(queue).observe(nav,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['hidden']});
    }
    if(document.fonts?.ready) document.fonts.ready.then(queue).catch(()=>{});
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init,{once:true}); else init();
})();
