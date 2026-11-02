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

/**
 * สร้างลิงก์ตรวจสอบธุรกรรม (Transaction Hash) บน LAB Chain Explorer
 */
export function buildLabChainExplorerTxUrl(txHash: string): string {
  const baseUrl = LAB_CHAIN_CONFIG.blockExplorerUrls[0].replace(/\/+$/, "");
  return `${baseUrl}/tx/${encodeURIComponent(txHash.trim())}`;
}

/**
 * ตรวจสอบความถูกต้องของรูปแบบที่อยู่กระเป๋า EVM (0x ตามด้วยเลขฐานสิบหก 40 ตัวอักษร)
 */
export function isValidEvmAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address.trim());
}

/**
 * ดึงค่าพิกัดละติจูดและลองจิจูด (GPS) จากข้อความสถานที่หากมีการระบุไว้
 */
export function extractGpsCoordinates(
  locationText: string
): { lat: number; lng: number } | null {
  const match = locationText.match(/(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)/);
  if (!match) return null;
  const lat = Number.parseFloat(match[1]);
  const lng = Number.parseFloat(match[2]);
  if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
  return { lat, lng };
}

/**
 * คำนวณจำนวนวันทั้งหมดตั้งแต่ขั้นตอนแรกจนถึงขั้นตอนล่าสุดใน Timeline
 */
export function calculateJourneyDays(timestamps: number[]): number {
  if (!timestamps || timestamps.length < 2) return 0;
  const sorted = [...timestamps].sort((a, b) => a - b);
  const diffSeconds = sorted[sorted.length - 1] - sorted[0];
  return Math.max(0, Math.round(diffSeconds / 86400));
}

/**
 * สร้างลิงก์แผนที่ Google Maps จากพิกัด GPS ที่ระบุในข้อความสถานที่
 */
export function buildGoogleMapsUrlFromLocation(
  locationText: string
): string | null {
  const coords = extractGpsCoordinates(locationText);
  if (!coords) return null;
  return `https://www.google.com/maps?q=${coords.lat},${coords.lng}`;
}



