# คำถามที่พบบ่อย (FAQ) — LaoTrace Web3

เอกสารรวบรวมคำถามที่พบบ่อยสำหรับการพัฒนา เชื่อมต่อระบบหลังบ้าน (Smart Contract) และการนำเสนอโปรเจกต์

---

## 1. ทำไมถึงแยกเก็บข้อมูลระหว่าง LAB Chain กับ IPFS?
- **LAB Chain (On-Chain):** เก็บข้อมูลสำคัญที่ต้องการความโปร่งใสและห้ามแก้ไข เช่น `productId`, `productName`, `category`, `action`, `location`, `ipfsHash`, `timestamp` และ `actor` (Wallet Address ของผู้บันทึก)
- **IPFS (Off-Chain Storage):** เก็บไฟล์รูปภาพหลักฐานและใบรับรองคุณภาพที่มีขนาดใหญ่ แล้วนำรหัส `CID (Content Identifier)` ที่คำนวณจากเนื้อหาไฟล์ไปผูกไว้บน Smart Contract ทำให้ประหยัดค่า Gas แต่ยังตรวจสอบความถูกต้องของรูปภาพได้ 100%

---

## 2. การแก้ไขฝั่ง Frontend กระทบกับ Smart Contract ของเพื่อนฝั่งหลังบ้านไหม?
- **ไม่กระทบ 100%** เพราะระบบฝั่ง Frontend เรียกใช้งานผ่าน ABI มาตรฐาน 4 ฟังก์ชันหลักที่ตกลงกันไว้:
  1. `registerProduct(_productId, _productName, _category, _initialAction, _location, _ipfsHash)`
  2. `addTraceStep(_productId, _action, _location, _ipfsHash)`
  3. `getTimeline(_productId)`
  4. `getProductDetails(_productId)`
- ฟีเจอร์เสริม เช่น ระบบล็อกสิทธิ์ผู้รับช่วงต่อ (`Chain of Custody`) และการส่งออกไฟล์ `JSON` / `CSV` ทำงานในเลเยอร์ Frontend โดยไม่ต้องแก้พารามิเตอร์ของ Smart Contract

---

## 3. ถ้าไม่มี Pinata JWT หรืออินเทอร์เน็ตขัดข้องตอนนำเสนอ ระบบจะพังไหม?
- **ไม่พัง** ฟังก์ชัน `uploadToIPFS(file)` ใน [`src/services/ipfs.ts`](../src/services/ipfs.ts) มีระบบ **Automatic Deterministic Fallback**:
  - หากใส่ Pinata JWT ที่ถูกต้อง ระบบจะอัปโหลดขึ้น Pinata IPFS จริง
  - หากไม่ได้ใส่ หรือ Token ผิดพลาด ระบบจะคำนวณรหัส `CID (bafybei...)` จากไฟล์รูปภาพจริงด้วยอัลกอริทึม `SHA-256` และแสดงผลรูปภาพได้ทันทีโดยไม่เกิด Error ขัดจังหวะการสาธิต

---

## 4. ข้อมูลการตั้งค่าเครือข่าย LAB Chain สำหรับเพิ่มใน MetaMask คืออะไร?
- **Network Name:** `LAB Chain`
- **RPC URL:** `https://rpc.labchain.la`
- **Chain ID:** `5222`
- **Currency Symbol:** `LAB`
- **Block Explorer URL:** `https://explorer.labchain.la`
