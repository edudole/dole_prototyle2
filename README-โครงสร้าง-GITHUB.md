# LP360 — GitHub repository เดียว / Central Config

โครงสร้าง

- `/index.html` — เว็บไซต์อำเภอ
- `/tambon1/index.html` — เว็บไซต์ตำบลต้นแบบ/ตำบลที่ 1
- `/tambon2/` และ `/tambon3/` — โฟลเดอร์ว่างสำหรับใส่สำเนาจาก `tambon1`
- `/library/index.html` — เว็บไซต์ห้องสมุด
- `/sites-config.js` — **จุดเดียวสำหรับ MAIN /exec และ Student Profile /exec ของทุกเว็บไซต์**
- `/site-bootstrap.js` — แยก localStorage/sessionStorage/cache ตามเว็บไซต์อัตโนมัติ

## เพิ่มตำบลใหม่

1. คัดลอกโฟลเดอร์ `tambon1` ทั้งหมดเป็น `tambon4` (หรือชื่อโฟลเดอร์ใหม่ที่ต้องการ)
2. เพิ่ม entry ใน `sites-config.js` เช่น:

```js
tambon4: Object.freeze({
  SITE_TYPE: 'TAMBOL',
  MAIN_EXEC_URL: 'https://script.google.com/macros/s/.../exec',
  STUDENT_PROFILE_EXEC_URL: 'https://script.google.com/macros/s/.../exec',
  CACHE_PREFIX: 'LP360:TAMBOL:TAMBON4:'
}),
```

3. ไม่ต้องแก้ `profile-config.js` และไม่ต้องแก้ `STUDENT_PROFILE_WEB_APP_URL` ใน `index-fast.js`
4. `CACHE_PREFIX` ของทุกเว็บไซต์ต้องไม่ซ้ำกัน

## ป้องกันข้อมูลสลับเว็บไซต์

`site-bootstrap.js` จะบังคับ key ที่ขึ้นต้นด้วย `LP360:` ให้เข้าพื้นที่ของเว็บไซต์ปัจจุบัน แม้ไฟล์ที่คัดลอกจาก `tambon1` ยังมี key เก่า เช่น `LP360:TAMBOL:BANG_RAK:...` ก็ตาม จึงลดความเสี่ยง cache, URL รูป, session และ theme ของตำบลหนึ่งไปปรากฏอีกตำบลหนึ่งบน GitHub Pages origin เดียวกัน

## Endpoint ที่ยังไม่ถูกรวม

URL `/exec` ของระบบอื่นที่เป็นคนละบริการ เช่น iframe DB Admin, Quiz/Classroom หรือระบบเฉพาะหน้า ถูกคงไว้เหมือนต้นฉบับ เพื่อไม่เปลี่ยนฟังก์ชันเดิม การรวมครั้งนี้ครอบคลุม **MAIN website API** และ **Student Profile API** ตามที่ร้องขอ


## เว็บไซต์ห้องสมุด
เว็บไซต์ห้องสมุดใช้เฉพาะ `MAIN_EXEC_URL` และไม่ใช้ `STUDENT_PROFILE_EXEC_URL` / `STUDENT_PROFILE_WEB_APP_URL`
ไฟล์ `library/profile-config.js`, `library/profile.html` และ `library/student-profile-login.js` ถูกนำออกแล้วเพื่อไม่ให้มีการเรียก Student Profile Web App โดยไม่จำเป็น
