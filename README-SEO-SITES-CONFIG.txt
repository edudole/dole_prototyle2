LP360 SEO / LINE Preview — sites-config.js เป็นแหล่งข้อมูลเดียว

แก้เฉพาะ sites-config.js ของแต่ละเว็บไซต์:
  SEO_TITLE: 'ข้อความ Title',
  SEO_DESCRIPTION: 'ข้อความ Description',

เมื่อ push sites-config.js ขึ้น branch main:
- GitHub Action จะเขียนค่าจริงลง index.html ของเว็บไซต์นั้น
- <title> และ <meta name="description"> เป็น static HTML
- เพิ่ม og:title และ og:description เพื่อให้ LINE อ่านได้
- ไม่อ่าน Google Sheet
- ไม่เรียก Apps Script สำหรับ SEO
- ไม่มี schedule ทุก 30 นาที

หากเพิ่มตำบลใหม่ เช่น /tambon4/:
1) copy โฟลเดอร์เว็บไซต์
2) เพิ่ม tambon4 ใน sites-config.js
3) ระบุ SEO_TITLE / SEO_DESCRIPTION
4) push ขึ้น GitHub

หมายเหตุ: JavaScript ใน browser อย่างเดียวไม่เพียงพอสำหรับ LINE Preview จึงยังต้องมี GitHub Action ขนาดเล็กเพื่อเขียนค่า static ลง HTML ตอน deploy
