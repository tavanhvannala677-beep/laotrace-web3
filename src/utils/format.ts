import { LAB_CHAIN_CONFIG } from "../config/contract";

/**
 * ย่อที่อยู่กระเป๋า Web3 (0x1234...abcd) เพื่อแสดงผลบนหน้า UI อย่างกระชับ
 */
export function shortenWalletAddress(addr: string): string {
  if (!addr || addr.length < 10) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

/**
 * แปลง Unix Timestamp (วินาที) จาก Smart Contract เป็นวันที่และเวลาภาษาไทย
 */
export function formatThaiTimestamp(ts: number): string {
  if (!ts) return "-";
  return new Date(ts * 1000).toLocaleString("th-TH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * ทำความสะอาดรหัสล็อตสินค้า (ตัดช่องว่างและเครื่องหมาย # นำหน้า)
 */
export function normalizeBatchId(rawId: string): string {
  return rawId.trim().replace(/^#+/, "");
}

/**
 * สร้างลิงก์ตรวจสอบที่อยู่กระเป๋าหรือ Smart Contract บน LAB Chain Explorer
 */
export function buildLabChainExplorerAddressUrl(address: string): string {
  const baseUrl = LAB_CHAIN_CONFIG.blockExplorerUrls[0].replace(/\/+$/, "");
  return `${baseUrl}/address/${encodeURIComponent(address.trim())}`;
}
