import { isValidEvmAddress, normalizeBatchId } from "./format";

export interface ValidationResult {
  valid: boolean;
  errorMessage?: string;
}

/**
 * ตรวจสอบความครบถ้วนของข้อมูลก่อนเรียกฟังก์ชัน registerProduct บน Smart Contract
 */
export function validateProductRegistrationInput(params: {
  productId: string;
  productName: string;
  category: string;
  initialAction: string;
  location: string;
  ipfsHash: string;
  receiverWallet?: string;
}): ValidationResult {
  if (!normalizeBatchId(params.productId)) {
    return { valid: false, errorMessage: "กรุณาระบุรหัสล็อตสินค้า (Product ID)" };
  }
  if (!params.productName.trim()) {
    return { valid: false, errorMessage: "กรุณาระบุชื่อสินค้า" };
  }
  if (!params.category.trim()) {
    return { valid: false, errorMessage: "กรุณาเลือกหมวดหมู่สินค้า" };
  }
  if (!params.initialAction.trim()) {
    return { valid: false, errorMessage: "กรุณาระบุขั้นตอนเริ่มต้น" };
  }
  if (!params.location.trim()) {
    return { valid: false, errorMessage: "กรุณาระบุสถานที่หรือพิกัดต้นกำเนิด" };
  }
  if (!params.ipfsHash.trim()) {
    return { valid: false, errorMessage: "กรุณาอัปโหลดรูปภาพหรือระบุรหัส IPFS CID" };
  }
  if (
    params.receiverWallet &&
    params.receiverWallet.trim() !== "" &&
    !isValidEvmAddress(params.receiverWallet)
  ) {
    return {
      valid: false,
      errorMessage: "รูปแบบกระเป๋าผู้รับช่วงต่อ (0x...) ไม่ถูกต้อง",
    };
  }
  return { valid: true };
}

/**
 * ตรวจสอบความครบถ้วนของข้อมูลก่อนเรียกฟังก์ชัน addTraceStep บน Smart Contract
 */
export function validateTraceStepInput(params: {
  productId: string;
  action: string;
  location: string;
  ipfsHash: string;
}): ValidationResult {
  if (!normalizeBatchId(params.productId)) {
    return { valid: false, errorMessage: "กรุณาเลือกรหัสล็อตสินค้า" };
  }
  if (!params.action.trim()) {
    return { valid: false, errorMessage: "กรุณาระบุขั้นตอนการแปรรูปหรือขนส่ง" };
  }
  if (!params.location.trim()) {
    return { valid: false, errorMessage: "กรุณาระบุสถานที่ดำเนินการ" };
  }
  if (!params.ipfsHash.trim()) {
    return { valid: false, errorMessage: "กรุณาอัปโหลดรูปภาพหรือระบุรหัส IPFS CID" };
  }
  return { valid: true };
}

/**
 * ตรวจสอบความถูกต้องของ Contract Address ที่กรอกในหน้าตั้งค่าเชื่อมต่อหลังบ้าน
 */
export function validateContractAddressInput(address: string): ValidationResult {
  const clean = address.trim();
  if (!clean) {
    return { valid: false, errorMessage: "กรุณาระบุ Contract Address (0x...)" };
  }
  if (!isValidEvmAddress(clean)) {
    return {
      valid: false,
      errorMessage: "รูปแบบ Contract Address ไม่ถูกต้อง (ต้องขึ้นต้นด้วย 0x และมี 42 ตัวอักษร)",
    };
  }
  return { valid: true };
}

/**
 * ทำความสะอาดคำค้นหาหรือรหัสล็อตสินค้า ป้องกันอักขระพิเศษที่ไม่จำเป็น
 */
export function sanitizeSearchQuery(query: string): string {
  return query.trim().replace(/[<>'"`;()]/g, "");
}


