# ตั้งค่าระบบวิเคราะห์ทองอัตโนมัติ

เว็บไซต์จะเผยแพร่ข้อมูลชุดล่าสุดให้ผู้ชมทุกคนใช้ร่วมกัน ไม่เรียก AI แยกตามผู้เข้าชม

## ตารางอัปเดต

- ทุกวัน 08:00 น. เวลาไทย: ดึงราคา Spot/ค่าเงินและแท่ง OHLC ที่ปิดแล้วเพื่อคำนวณแนวรับ–แนวต้าน, คัดข่าว, วิเคราะห์ Scenario และ checklist ตลาด
- ทุกวัน 22:00 น. เวลาไทย: อัปเดตราคา/แนวรับ–แนวต้านและคัดข่าวใหม่; คง Scenario และ checklist จากรอบ 08:00
- GitHub Actions ใช้ UTC และอาจเริ่มช้ากว่าเวลาที่ตั้งไว้ในช่วงระบบหนาแน่นเล็กน้อย

## เปิดใช้ AI และคัดข่าวอัตโนมัติ

1. เข้า repository `jedikup/friend` บน GitHub
2. ไปที่ **Settings → Secrets and variables → Actions → New repository secret**
3. ตั้งชื่อ secret เป็น `OPENAI_API_KEY` และวาง API key ที่สร้างจากบัญชี OpenAI API โดยตรง
4. ห้ามใส่ key ในไฟล์เว็บ, commit หรือส่งในแชต เพราะ repository และเว็บไซต์เป็นสาธารณะ
5. ไปที่ **Actions → Refresh public gold market board → Run workflow** เพื่อเริ่มรอบแรกทันที

หากไม่มี `OPENAI_API_KEY` งานยังพยายามอัปเดตราคาและแนวรับ–แนวต้าน แต่ส่วนข่าวคัดกรอง, Scenario และ checklist จะยังไม่ถูกสร้างอัตโนมัติ และหน้าเว็บจะแสดงสถานะให้ทราบ

## แหล่งข้อมูลและข้อจำกัด

- ราคา Spot/FX: [GoldPriceZone widget/API](https://goldpricezone.com/widget)
- แท่งราคา OHLC: [GoldPrice.dev Historical API](https://goldprice.dev/docs/historical)
- ข่าว: Google News RSS ที่ลิงก์กลับไปยังผู้เผยแพร่ต้นทาง
- แนวรับ–แนวต้านคำนวณจาก swing pivot, high/low 10 วัน และ ATR(14) ของแท่งรายวันที่ปิดแล้ว; ราคาไทยเป็นค่าประมาณ Spot × USD/THB × 0.47296 จึงไม่ใช่ราคาประกาศสมาคมค้าทองคำ
- Scenario และ checklist เป็นความเห็นวิเคราะห์จาก AI ตามข้อมูลที่ป้อน ไม่ใช่ข่าวจริงหรือคำแนะนำรับประกันผลตอบแทน
