# LP360 /user/ + Central Config

## จุดแก้ไขกลางเพียงไฟล์เดียว
ไฟล์ `/sites-config.js` เก็บ:
- `GLOBAL_ICON_URL` icon/favion กลางทุกเว็บไซต์
- `/exec` ของเว็บอำเภอ/ตำบล/ห้องสมุด
- `SEO_TITLE` และ `SEO_DESCRIPTION` ของเว็บหลัก
- `USER_PAGES` สำหรับ `/user/1.html`, `/user/2.html`, ...

## ตัวอย่างเพิ่ม /user/2.html
1. Copy `/user/1.html` เป็น `/user/2.html`
2. เพิ่มใน `USER_PAGES` ของ `/sites-config.js`

```js
'2': Object.freeze({
  EXEC_URL: 'https://script.google.com/macros/s/XXXXX/exec',
  SEO_TITLE: 'ชื่อหน้า 2',
  SEO_DESCRIPTION: 'คำอธิบายหน้า 2'
})
```

ไม่ต้องแก้ `/user/2.html` จุดอื่น ระบบจะดูเลข `2` จากชื่อไฟล์เอง

## Icon / Favicon
แก้เพียง:
```js
const GLOBAL_ICON_URL = 'URL รูป icon';
```
ใช้ร่วมกันกับ:
- เว็บอำเภอ
- ทุกเว็บตำบล
- ห้องสมุด
- `/user/1.html`, `/user/2.html`, ...

## LINE title/description
GitHub Action `.github/workflows/update-line-seo.yml` จะอ่านค่าจาก `sites-config.js` และเขียน `<title>`, `<meta name=description>`, Open Graph และ favicon แบบ static ลง HTML เพื่อให้ LINE อ่านได้โดยไม่ต้องรอ JavaScript.
