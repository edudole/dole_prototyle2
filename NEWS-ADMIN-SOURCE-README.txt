LP360 - ข่าวสารของคุณ / ข่าวสารจาก admin
วันที่ 2026-10-04

Frontend ที่แก้:
- tambon1/news-manager.js + news-manager.css
- tambon2/news-manager.js + news-manager.css
- tambon3/news-manager.js + news-manager.css
- library/news-manager.js + news-manager.css
- index-fast.js และ admin-mode.js ของแต่ละเว็บไซต์เปลี่ยน cache version ของ news-manager

พฤติกรรม:
1. เปิดจัดการข่าวสาร ค่าเริ่มต้น = ข่าวสารของคุณ
2. สวิตช์ไป ข่าวสารจาก admin = อ่าน DATABSE_MAIN_ID > news_page
3. ข่าวสารจาก admin อ่านอย่างเดียว: ไม่มีปุ่มเพิ่ม/แก้ไข/ลบ/เลื่อนลำดับ และสวิตช์โหมดสไลด์ถูก disable
4. ข่าวสารของคุณยังใช้ฐานเดิมและแก้ไขได้เหมือนเดิม

Apps Script:
- เพิ่ม action newsadmin/listadmin
- เพิ่ม getCentralNewsAdminData_() อ่าน DATABSE_MAIN_ID > news_page แบบ read-only
- เว็บไซต์ตำบล: ให้นำโค้ดรุ่นนี้ไปใช้กับแต่ละ Apps Script ของตำบล โดยคง ID_SHEET ของตำบลนั้นไว้ตามเดิม
- เว็บไซต์ห้องสมุด: ใช้ไฟล์ Appscript เว็บไซต์ห้องสมุด_NEWS-ADMIN-SOURCE.txt
- หลังแก้ Apps Script ต้อง Deploy > New version บน deployment เดิม
