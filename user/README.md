# /user/

## เพิ่มไฟล์ใหม่ เช่น 2.html
1. คัดลอก `1.html` เป็น `2.html` (หรือใช้ `_template.html`).
2. เปิด `/sites-config.js` แล้วเพิ่ม entry ใน `USER_PAGES` เช่น:

```js
'2': Object.freeze({
  EXEC_URL: 'https://script.google.com/macros/s/XXXXX/exec',
  SEO_TITLE: 'ชื่อหน้า 2',
  SEO_DESCRIPTION: 'คำอธิบายหน้า 2'
})
```

3. Push ขึ้น GitHub. GitHub Action จะเขียน title/description/OG และ favicon แบบ static ให้ทุกหน้า.

> Icon แก้ที่ `GLOBAL_ICON_URL` ใน `/sites-config.js` จุดเดียว.
