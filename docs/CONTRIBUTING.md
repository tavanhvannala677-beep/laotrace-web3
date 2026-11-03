# คู่มือการมีส่วนร่วมในโปรเจกต์ (Contributing Guide)

ยินดีต้อนรับผู้พัฒนาทุกท่านที่มีความสนใจในการต่อยอดและพัฒนา **LaoTrace Web3**! เอกสารนี้อธิบายแนวทางการพัฒนาและส่งมอบโค้ดสำหรับโปรเจกต์

---

## 🛠️ ขั้นตอนการพัฒนา (Workflow)

1. **Clone & Install Dependencies**
   ```bash
   git clone https://github.com/tavanhvannala677-beep/laotrace-web3.git
   cd laotrace-web3
   npm install
   ```

2. **Branching Strategy**
   - แตกกิ่งพัฒนาใหม่จาก `main`:
     ```bash
     git checkout -b feat/your-feature-name
     ```

3. **Code Style & Type Checking**
   - ตรวจสอบความถูกต้องของ TypeScript เสมอ:
     ```bash
     npm run typecheck
     ```
   - ปฏิบัติตามหลักการเขียนโค้ดที่อ่านง่าย สะอาด และมีคอมเมนต์อธิบาย

4. **Conventional Commits**
   - ตั้งชื่อข้อความ Commit ให้สื่อความหมาย เช่น:
     - `feat:` สำหรับฟีเจอร์ใหม่
     - `fix:` สำหรับการแก้ไขบัก
     - `docs:` สำหรับการปรับปรุงเอกสาร
     - `refactor:` สำหรับการจัดโครงสร้างโค้ดใหม่
