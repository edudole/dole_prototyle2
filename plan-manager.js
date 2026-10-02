(()=>{
  'use strict';
  const API=window.APP_CONFIG.EXEC_URL;
  const state={items:[],query:'',page:1};
  const LEVELS=['ประถม','ม.ต้น','ม.ปลาย'];
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const editIcon='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zm17.71-10.04a.996.996 0 0 0 0-1.41l-2.5-2.5a.996.996 0 1 0-1.41 1.41l2.5 2.5c.39.39 1.03.39 1.41 0z"/></svg>';
  const deleteIcon='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zm3.46-7.12 1.41-1.41L12 11.59l1.12-1.12 1.41 1.41L13.41 13l1.12 1.12-1.41 1.41L12 14.41l-1.12 1.12-1.41-1.41L10.59 13l-1.13-1.12zM15.5 4l-1-1h-5l-1 1H5v2h14V4z"/></svg>';

  async function api(action,data={}){
    const token=sessionStorage.getItem('LP360:DISTRICT:mysiteAdminToken')||'';
    const r=await fetch(API,{method:'POST',cache:'no-store',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({mode:'planadmin',action,data,token})});
    const j=await r.json();
    if(!r.ok||!j.success)throw new Error(j.message||'ดำเนินการไม่สำเร็จ');
    return j.data;
  }

  async function load(){const items=await api('list');state.items=Array.isArray(items)?items:[];}
  function filtered(){const q=state.query.trim().toLocaleLowerCase('th');return q?state.items.filter(x=>`${x.order} ${x.title} ${x.level} ${x.uploadDate}`.toLocaleLowerCase('th').includes(q)):state.items;}
  function safeHref(url){return /^https?:\/\//i.test(String(url||'').trim())?esc(String(url).trim()):'#';}
  function html(){
    const all=filtered(),pages=Math.max(1,Math.ceil(all.length/5));state.page=Math.min(state.page,pages);
    const rows=all.slice((state.page-1)*5,state.page*5).map(x=>`<tr><td>${esc(x.order)}</td><td>${esc(x.title||'-')}</td><td>${esc(x.level||'-')}</td><td>${esc(x.uploadDate||'-')}</td><td><a class="pl-file" href="${safeHref(x.fileUrl)}" target="_blank" rel="noopener">ดาวน์โหลดไฟล์</a></td><td><div class="pl-actions"><button class="pl-btn pl-edit" type="button" data-pl-edit="${x.rowNumber}" title="แก้ไข" aria-label="แก้ไข">${editIcon}</button><button class="pl-btn pl-delete" type="button" data-pl-delete="${x.rowNumber}" title="ลบ" aria-label="ลบ">${deleteIcon}</button></div></td></tr>`).join('')||'<tr><td colspan="6" style="text-align:center">ไม่พบรายการ</td></tr>';
    const nav=Array.from({length:pages},(_,i)=>`<button type="button" data-pl-page="${i+1}" class="${state.page===i+1?'active':''}">${i+1}</button>`).join('');
    return `<div class="pl-manager"><div class="pl-toolbar"><b class="pl-total">จำนวนรายการทั้งหมด ${all.length} รายการ</b><input id="plSearch" class="pl-search" value="${esc(state.query)}" placeholder="ค้นหารายการ"><button id="plAdd" class="pl-btn pl-add" type="button">+เพิ่มรายการ</button></div><div class="pl-table-wrap"><table class="pl-table"><thead><tr><th>ลำดับ</th><th>เรื่อง</th><th>ระดับชั้น</th><th>วันที่อัพโหลดไฟล์</th><th>ไฟล์แผนฯ</th><th>จัดการ</th></tr></thead><tbody>${rows}</tbody></table></div><div class="pl-pages">${nav}</div></div>`;
  }
  function rerender(){const c=document.querySelector('.swal2-html-container');if(c){c.innerHTML=html();bind();}}
  function bind(){
    const q=document.getElementById('plSearch');
    q?.addEventListener('input',e=>{const p=e.target.selectionStart;state.query=e.target.value;state.page=1;rerender();const n=document.getElementById('plSearch');n?.focus();n?.setSelectionRange(p,p);});
    document.getElementById('plAdd')?.addEventListener('click',()=>editor());
    document.querySelectorAll('[data-pl-page]').forEach(b=>b.onclick=()=>{state.page=+b.dataset.plPage;rerender();});
    document.querySelectorAll('[data-pl-edit]').forEach(b=>b.onclick=()=>editor(state.items.find(x=>x.rowNumber===+b.dataset.plEdit)));
    document.querySelectorAll('[data-pl-delete]').forEach(b=>b.onclick=()=>remove(+b.dataset.plDelete));
  }
  function overlay(title,body){const p=Swal.getPopup();if(!p)return null;p.querySelector('.pl-action')?.remove();const l=document.createElement('div');l.className='pl-overlay pl-action';l.innerHTML=`<div class="pl-dialog"><h3>${esc(title)}</h3>${body}</div>`;p.appendChild(l);return l;}
  function validUrl(v){try{return ['http:','https:'].includes(new URL(v).protocol);}catch(_){return false;}}
  function readFile(file){return new Promise((res,rej)=>{if(!file)return rej(new Error('กรุณาเลือกไฟล์'));if(!/\.(png|jpe?g|pdf|docx?)$/i.test(file.name))return rej(new Error('รองรับเฉพาะ PNG, JPG, PDF และ Word'));if(file.size>15*1024*1024)return rej(new Error('ไฟล์มีขนาดใหญ่เกิน 15 MB'));const r=new FileReader();r.onerror=()=>rej(new Error('อ่านไฟล์ไม่สำเร็จ'));r.onload=()=>res({dataUrl:r.result,fileName:file.name});r.readAsDataURL(file);});}
  function levelOptions(current){return LEVELS.map(v=>`<option value="${esc(v)}" ${v===current?'selected':''}>${esc(v)}</option>`).join('');}

  function editor(item){
    let upload=null;const editing=!!item;
    const l=overlay(editing?'แก้ไขแผนการจัดการเรียนรู้':'เพิ่มแผนการจัดการเรียนรู้',`<div class="pl-form"><label>เรื่อง *<input id="plTitle" value="${esc(item?.title||'')}" placeholder="กรอกเรื่อง"></label><label>ระดับชั้น *<select id="plLevel"><option value="">-- เลือกระดับชั้น --</option>${levelOptions(item?.level||'')}</select></label><label>อัพโหลดไฟล์<div class="pl-file-row"><input id="plFileUrl" type="url" value="${esc(item?.fileUrl||'')}" placeholder="https://..."><button id="plChooseFile" class="pl-btn pl-upload-button" type="button">อัปโหลดไฟล์</button></div></label><input id="plFileUpload" type="file" accept=".png,.jpg,.jpeg,.pdf,.doc,.docx" hidden><span class="pl-hint">รองรับ PNG, JPG, PDF, Word ขนาดไม่เกิน 15 MB</span><div id="plFileStatus" class="pl-file-status"></div><div id="plError" class="pl-error"></div><div class="pl-form-actions"><button class="pl-btn pl-cancel" type="button">ยกเลิก</button><button class="pl-btn pl-save" type="button">${editing?'บันทึกการแก้ไข':'เพิ่มรายการ'}</button></div></div>`);
    if(!l)return;
    const picker=l.querySelector('#plFileUpload');
    l.querySelector('.pl-cancel').onclick=()=>l.remove();
    l.querySelector('#plChooseFile').onclick=()=>picker.click();
    picker.onchange=async e=>{const status=l.querySelector('#plFileStatus'),er=l.querySelector('#plError');er.textContent='';try{status.textContent='กำลังอ่านไฟล์...';upload=await readFile(e.target.files[0]);status.textContent=`เลือกไฟล์แล้ว: ${upload.fileName}`;}catch(x){upload=null;status.textContent='';er.textContent=x.message;}};
    l.querySelector('.pl-save').onclick=async()=>{
      const er=l.querySelector('#plError'),b=l.querySelector('.pl-save');
      const data={rowNumber:item?.rowNumber||0,title:l.querySelector('#plTitle').value.trim(),level:l.querySelector('#plLevel').value.trim(),fileUrl:l.querySelector('#plFileUrl').value.trim(),fileData:upload?.dataUrl||'',fileName:upload?.fileName||''};
      er.textContent='';
      if(!data.title)return er.textContent='กรุณากรอกเรื่อง';
      if(!LEVELS.includes(data.level))return er.textContent='กรุณาเลือกระดับชั้น';
      if(!data.fileData&&!data.fileUrl)return er.textContent='กรุณาใส่ URL หรืออัปโหลดไฟล์';
      if(data.fileUrl&&!validUrl(data.fileUrl))return er.textContent='URL ไฟล์ไม่ถูกต้อง';
      b.disabled=true;b.textContent='กำลังบันทึก...';
      try{await api('save',data);await load();document.dispatchEvent(new Event('plan-admin-updated'));l.remove();rerender();}catch(x){er.textContent='บันทึกไม่สำเร็จ: '+x.message;b.disabled=false;b.textContent=editing?'บันทึกการแก้ไข':'เพิ่มรายการ';}
    };
  }

  function remove(rowNumber){
    const l=overlay('ยืนยันการลบ?',`<p style="text-align:center">รายการจะถูกลบออกจากชีต plan</p><div id="plDeleteError" class="pl-error"></div><div class="pl-form-actions"><button class="pl-btn pl-cancel" type="button">ยกเลิก</button><button class="pl-btn pl-confirm-delete" type="button">ลบ</button></div>`);
    if(!l)return;
    l.querySelector('.pl-cancel').onclick=()=>l.remove();
    l.querySelector('.pl-confirm-delete').onclick=async()=>{const b=l.querySelector('.pl-confirm-delete'),e=l.querySelector('#plDeleteError');b.disabled=true;b.textContent='กำลังลบ...';try{await api('delete',{rowNumber});await load();document.dispatchEvent(new Event('plan-admin-updated'));l.remove();rerender();}catch(x){e.textContent='ลบไม่สำเร็จ: '+x.message;b.disabled=false;b.textContent='ลบ';}};
  }

  async function open(){
    Swal.fire({title:'กำลังโหลดข้อมูล...',allowOutsideClick:false,didOpen:()=>Swal.showLoading()});
    try{await load();await Swal.fire({title:'จัดการแผนการจัดการเรียนรู้',html:html(),width:'min(1120px,96vw)',showConfirmButton:false,showCloseButton:true,didOpen:bind});}
    catch(e){Swal.fire({icon:'error',title:'โหลดข้อมูลไม่สำเร็จ',text:e.message});}
  }
  document.addEventListener('admin:manage-data',e=>{if(e.detail?.page==='plan')open();});
})();
