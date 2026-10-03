LP360 LINE SEO FIX — 2026-10-04

สาเหตุเดิม:
- GitHub Pages ส่ง <title></title> และ meta description ว่างก่อน JavaScript ทำงาน
- LINE crawler ไม่รอ JavaScript จึงหยิบข้อความ Login ในหน้าแทน
- workflow เดิมใช้ CNAME เพื่อสร้าง og:url ทั้งที่กำลังแชร์ github.io URL

สิ่งที่แก้:
1) Apps Script เพิ่ม mode=seo อ่าน setting!T3:T4 โดยตรง
   - อำเภอ: DATABSE_MAIN_ID > setting!T3:T4
   - ตำบล: DATABSE_MAIN_TEATHER_ID > setting!T3:T4
   - ห้องสมุด: WEBSITE_SPREADSHEET_ID > setting!T3:T4
2) homefast ส่ง data.seo ด้วย เพื่อ browser ใช้ค่าเดียวกัน
3) GitHub Action ใช้ mode=seo ก่อน แล้ว fallback homefast
4) GitHub Action เขียนค่าจริงลง HTML: title, description, og:title, og:description, og:image
5) og:url ใช้ GitHub Pages URL จาก GITHUB_REPOSITORY โดยอัตโนมัติ ไม่อ่าน CNAME
   - ถ้าจะใช้ custom domain ให้ตั้ง Repository Variable: SEO_PUBLIC_BASE_URL
6) workflow รันได้จาก Actions > Run workflow, ทุก 30 นาที และเมื่อ config/workflow/tool เปลี่ยน
7) มี validation ถ้า title/OG ยังว่าง workflow จะ fail แทนการ commit หน้า SEO ผิด

ขั้นตอนใช้งานสำคัญ:
A. นำไฟล์ AppsScript ทั้ง 3 ไฟล์ไปแทนโค้ดของ deployment ที่ตรงกัน แล้ว Deploy > New version บน deployment เดิม
B. อัปโหลด GitHub ชุดนี้
C. ไปที่ Actions > Update LINE SEO from Google Sheet > Run workflow
D. รอให้ workflow สีเขียว จากนั้นเปิด index.html ใน GitHub ตรวจว่ามี <title>ข้อความ T3</title> และ og:title/og:description
E. LINE อาจ cache URL เดิม ให้ทดสอบครั้งแรกด้วย ?v=20261004-1 เช่น
   https://edudole.github.io/dole_prototyle2/tambon1/?v=20261004-1
