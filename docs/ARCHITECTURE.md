# สถาปัตยกรรมระบบ LaoTrace Web3 (System Architecture & Data Flow)

เอกสารสรุปโครงสร้างการไหลของข้อมูล (Data Flow) และผังงานระบบ (System Flowchart) สำหรับโปรเจกต์ **LaoTrace Web3** บนเครือข่าย **LAB Chain (Chain ID: 5222)**

---

## 1. สเปกฟังก์ชันที่เชื่อมต่อระหว่างหน้าบ้าน (Frontend) และหลังบ้าน (Smart Contract)

| เฟส | ฟังก์ชัน Smart Contract (`LaoTrace.sol`) | พารามิเตอร์ (Parameters) | ฟังก์ชันฝั่งหน้าบ้าน (`src/services/`) |
| :--- | :--- | :--- | :--- |
| **1. ต้นน้ำ** | `registerProduct` | `(_productId, _productName, _category, _initialAction, _location, _ipfsHash)` | `uploadToIPFS(file)`, `submitRegisterProduct()`, `generateQRCode()` |
| **2. กลางน้ำ** | `addTraceStep` | `(_productId, _action, _location, _ipfsHash)` | `uploadToIPFS(file)`, `submitAddTraceStep()`, `listProductsAssignedToWallet()` |
| **3. ปลายน้ำ** | `getProductDetails`, `getTimeline` | `(_productId)` | `fetchTraceabilityData()`, `resolveIpfsUrl()` |

---

## 2. ระบบส่งมอบสิทธิ์ตามกระเป๋า (Chain of Custody)

1. **ต้นน้ำ (ชาวสวน):** ลงทะเบียนสินค้าล็อตใหม่พร้อมระบุเลขกระเป๋า (Wallet Address) ของผู้รับช่วงต่อในระดับกลางน้ำ
2. **กลางน้ำ (โรงคั่ว / ศูนย์ตรวจ / ขนส่ง):** ระบบจะแสดงเฉพาะรหัสล็อตสินค้าที่ต้นน้ำระบุส่งมอบให้กระเป๋าที่กำลังเชื่อมต่ออยู่เท่านั้น กระเป๋าอื่นจะไม่สามารถมองเห็นหรือกดอัปเดตข้อมูลข้ามสิทธิ์ได้
3. **ปลายน้ำ (ผู้บริโภค):** สแกน QR Code เพื่ออ่านข้อมูลผ่าน Public RPC ของ LAB Chain ได้ฟรีทันทีโดยไม่ต้องเชื่อมต่อกระเป๋า Web3
