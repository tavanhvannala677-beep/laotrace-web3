# LaoTrace Web3 — On-Chain Traceability ສິນຄ້າພຣີມຽມລາວ

แพลตฟอร์มติดตามและยืนยันแหล่งที่มาสินค้าพรีเมียมลาว (กาแฟโบลาเวน, ผ้าไหมทอมือ, ชาออร์แกนิกพงสาลี) บน **LAB Chain (Chain ID: 5222)**

---

## 📁 โครงสร้างไฟล์ในโปรเจกต์

- [`contracts/LaoTrace.sol`](contracts/LaoTrace.sol) — โค้ด Smart Contract (Solidity) สำหรับส่งให้เพื่อนฝั่งหลังบ้านนำไป Deploy บน Remix (`https://app.remix.live`)
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — เอกสารสรุปสถาปัตยกรรมระบบ, Data Flow, และระบบส่งมอบสิทธิ์ตามกระเป๋า (Chain of Custody)
- [`src/config/contract.ts`](src/config/contract.ts) — ตั้งค่าเครือข่าย LAB Chain, `DEFAULT_CONTRACT_ADDRESS` และ `LAOTRACE_ABI`
- [`src/services/ipfs.ts`](src/services/ipfs.ts) — ฟังก์ชัน `uploadToIPFS(file)` และ `resolveIpfsUrl(ipfsHash)`
- [`src/services/qrcode.ts`](src/services/qrcode.ts) — ฟังก์ชัน `generateQRCode(productId)`
- [`src/services/traceability.ts`](src/services/traceability.ts) — ฟังก์ชัน `fetchTraceabilityData()`, `submitRegisterProduct()`, `submitAddTraceStep()`, และ `listProductsAssignedToWallet()`
- [`src/App.tsx`](src/App.tsx) — หน้าเว็บหลักแยก 3 หน้าตามบทบาทจริง (หน้าชาวสวนต้นน้ำ, หน้าผู้ประกอบการกลางน้ำ, และหน้าลูกค้าสแกนตรวจสอบ)

---

## 🚀 วิธีรันหน้าเว็บ (Frontend)

```bash
npm install
npm run dev
```

จากนั้นเปิดเบราว์เซอร์ไปที่:
- **หน้าลูกค้าสแกน QR (ปลายน้ำ):** `http://localhost:5173/?productId=1001`
- **หน้าชาวสวน (ต้นน้ำ):** `http://localhost:5173/?page=farmer`
- **หน้าโรงคั่ว/ขนส่ง (กลางน้ำ):** `http://localhost:5173/?page=midstream`

---

## 🔌 วิธีเชื่อมต่อกับหลังบ้านเมื่อเพื่อน Deploy เสร็จแล้ว

1. ให้เพื่อนนำไฟล์ [`contracts/LaoTrace.sol`](contracts/LaoTrace.sol) ไป Deploy ลง **LAB Chain (Chain ID 5222)**
2. คัดลอก **Contract Address (`0x...`)** ที่ได้จากเพื่อน
3. กดปุ่ม **⚙️ ตั้งค่า** บนมุมขวาบนของหน้าชาวสวนหรือหน้ากลางน้ำ แล้ววาง Contract Address (หรือใส่ไว้ใน [`src/config/contract.ts`](src/config/contract.ts))
4. กดติ๊กเปิด **"เชื่อมต่อ Smart Contract จริง"**
