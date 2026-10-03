(function(){
  'use strict';
  const BREAKPOINT = 1024;
  const original = new WeakMap();
  let raf = 0;

  function remember(el, props){
    if(!el || original.has(el)) return;
    const snap = {};
    props.forEach(p => snap[p] = el.style.getPropertyValue(p));
    original.set(el, snap);
  }

  function restore(el){
    const snap = original.get(el);
    if(!el || !snap) return;
    Object.keys(snap).forEach(p => {
      const v = snap[p];
      if(v) el.style.setProperty(p, v, 'important');
      else el.style.removeProperty(p);
    });
  }

  function px(n){ return Math.max(1, Math.round(n * 10) / 10) + 'px'; }

  function apply(){
    raf = 0;
    const box = document.querySelector('#home.hero .hero-content.lp-hero-content-managed') || document.querySelector('#home.hero .hero-content');
    const kicker = document.getElementById('heroKickerText');
    const title = document.getElementById('heroTitleText');
    const desc = document.getElementById('heroDescriptionText');
    const overlay = document.getElementById('websiteHeroOverlay') || document.querySelector('#home.hero');
    if(!box || !kicker || !title || !desc) return;

    remember(box, ['width','max-width','min-width','padding-left','padding-right','overflow']);
    remember(kicker, ['font-size','line-height','max-width','width']);
    remember(title, ['font-size','line-height','max-width','width','margin-top','margin-bottom']);
    remember(desc, ['font-size','line-height','max-width','width','margin-top']);

    if(window.innerWidth > BREAKPOINT){
      [box,kicker,title,desc].forEach(restore);
      return;
    }

    const w = Math.max(320, window.innerWidth || 320);
    const small = w <= 640;
    let ks = small ? Math.min(10, Math.max(8.5, w * 0.025)) : Math.min(12, Math.max(9.5, w * 0.014));
    let ts = small ? Math.min(32, Math.max(21, w * 0.072)) : Math.min(42, Math.max(24, w * 0.043));
    let ds = small ? Math.min(12.5, Math.max(10.5, w * 0.032)) : Math.min(15, Math.max(11.5, w * 0.017));

    box.style.setProperty('width', small ? '86vw' : '84vw', 'important');
    box.style.setProperty('max-width', 'calc(100vw - 24px)', 'important');
    box.style.setProperty('min-width', '0', 'important');
    box.style.setProperty('padding-left', '0', 'important');
    box.style.setProperty('padding-right', '0', 'important');
    box.style.setProperty('overflow', 'visible', 'important');

    kicker.style.setProperty('font-size', px(ks), 'important');
    kicker.style.setProperty('line-height', '1.3', 'important');
    kicker.style.setProperty('width', '100%', 'important');
    kicker.style.setProperty('max-width', '100%', 'important');

    title.style.setProperty('font-size', px(ts), 'important');
    title.style.setProperty('line-height', '1.08', 'important');
    title.style.setProperty('width', '100%', 'important');
    title.style.setProperty('max-width', '100%', 'important');
    title.style.setProperty('margin-top', small ? '4px' : '6px', 'important');
    title.style.setProperty('margin-bottom', small ? '4px' : '6px', 'important');

    desc.style.setProperty('font-size', px(ds), 'important');
    desc.style.setProperty('line-height', small ? '1.38' : '1.45', 'important');
    desc.style.setProperty('width', '100%', 'important');
    desc.style.setProperty('max-width', '100%', 'important');
    desc.style.setProperty('margin-top', '0', 'important');

    // ถ้าข้อความยังสูงเกินพื้นที่ Hero ให้ย่อทั้งสามข้อความลงอย่างสมดุล
    if(overlay){
      const ob = overlay.getBoundingClientRect();
      const bb = box.getBoundingClientRect();
      const availableBottom = ob.bottom - 10;
      if(bb.bottom > availableBottom && bb.height > 0){
        const availableHeight = Math.max(80, availableBottom - bb.top);
        const ratio = Math.max(0.62, Math.min(1, availableHeight / bb.height));
        ks *= ratio; ts *= ratio; ds *= ratio;
        kicker.style.setProperty('font-size', px(ks), 'important');
        title.style.setProperty('font-size', px(ts), 'important');
        desc.style.setProperty('font-size', px(ds), 'important');
      }
    }
  }

  function schedule(){
    if(raf) cancelAnimationFrame(raf);
    raf = requestAnimationFrame(apply);
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', schedule, {once:true});
  else schedule();
  window.addEventListener('resize', schedule, {passive:true});
  window.addEventListener('orientationchange', schedule, {passive:true});
  window.addEventListener('load', schedule, {once:true});
  setTimeout(schedule, 350);
  setTimeout(schedule, 1200);
})();
