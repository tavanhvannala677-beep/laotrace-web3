# คู่มือการ Deploy Smart Contract และเชื่อมต่อระบบหน้าบ้าน (Deployment Guide)

คู่มือทีละขั้นตอนสำหรับนำไฟล์ [`contracts/LaoTrace.sol`](../contracts/LaoTrace.sol) ขึ้นเครือข่าย **LAB Chain (Chain ID: 5222)** และเชื่อมต่อกับระบบหน้าบ้าน (Frontend)

---

## 1. การเพิ่มเครือข่าย LAB Chain ใน MetaMask

1. เปิดส่วนขยาย **MetaMask** แล้วเลือก **Add Network -> Add a network manually**
2. กรอกข้อมูลดังนี้:
   - **Network Name:** `LAB Chain`
   - **New RPC URL:** `https://rpc.labchain.la`
   - **Chain ID:** `5222`
   - **Currency Symbol:** `LAB`
   - **Block Explorer URL:** `https://explorer.labchain.la`
3. กด **Save** และสลับเครือข่ายมาที่ **LAB Chain**

---

## 2. การ Deploy `LaoTrace.sol` ผ่าน Remix IDE

1. เปิดเว็บไซต์ Remix IDE (`https://remix.ethereum.org` หรือ `https://app.remix.live`)
2. สร้างไฟล์ใหม่ชื่อ `LaoTrace.sol` แล้วคัดลอกโค้ดจาก [`contracts/LaoTrace.sol`](../contracts/LaoTrace.sol) ไปวาง
3. ไปที่แถบ **Solidity Compiler**:
   - เลือก Compiler Version: `0.8.20` (หรือ `0.8.x`)
   - กดปุ่ม **Compile LaoTrace.sol**
4. ไปที่แถบ **Deploy & Run Transactions**:
   - ช่อง **Environment:** เลือก `Injected Provider - MetaMask` (ตรวจสอบว่าเชื่อมกับ Chain ID `5222`)
   - กดปุ่ม **Deploy** และกดยืนยันธุรกรรมใน MetaMask
5. เมื่อ Deploy สำเร็จ ให้คัดลอก **Contract Address (`0x...`)** ที่ได้จากส่วน **Deployed Contracts**

---

## 3. การนำ Contract Address มาเชื่อมกับระบบหน้าบ้าน (Frontend)

สามารถเชื่อมต่อได้ 2 วิธี:

### วิธีที่ 1: กรอกผ่านหน้าเว็บโดยตรง (ไม่ต้องแก้โค้ด)
1. เปิดหน้าชาวสวน (`/?page=farmer`) หรือหน้ากลางน้ำ (`/?page=midstream`)
2. คลิกปุ่ม **⚙️ ตั้งค่า** มุมขวาบน
3. วาง **Contract Address (`0x...`)** และกดติ๊กเปิด **"เชื่อมต่อ Smart Contract จริง"** จากนั้นกดบันทึก

### วิธีที่ 2: กำหนดเป็นค่าเริ่มต้นในโค้ด
1. เปิดไฟล์ [`src/config/contract.ts`](../src/config/contract.ts)
2. แก้ไขตัวแปร `DEFAULT_CONTRACT_ADDRESS`:
   ```ts
   export const DEFAULT_CONTRACT_ADDRESS = "0xYourDeployedContractAddressHere";
   ```
