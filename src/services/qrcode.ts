/**
 * 2. ฟังก์ชันฝั่ง Frontend: generateQRCode(productId, assignedWallet?)
 * สร้างลิงก์สำหรับผู้บริโภคสแกน (?productId=1001)
 * และลิงก์สำหรับส่งมอบงานให้กลางน้ำ (?page=midstream&productId=1001&to=0x...)
 */

export interface GeneratedQRData {
  productId: string;
  verificationUrl: string;
  qrImageUrl: string;
  midstreamHandoverUrl?: string;
  midstreamQrImageUrl?: string;
}

export function generateQRCode(
  productId: string,
  assignedWallet?: string
): GeneratedQRData {
  const cleanId = productId.trim();
  const origin =
    typeof window !== "undefined" ? window.location.origin : "https://laotrace.app";
  const pathname =
    typeof window !== "undefined" ? window.location.pathname : "/";

  // ลิงก์สำหรับลูกค้าสแกนดูประวัติ (ปลายน้ำ)
  const verificationUrl = `${origin}${pathname}?productId=${encodeURIComponent(cleanId)}`;
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=320x320&margin=12&color=064e3b&bgcolor=ffffff&data=${encodeURIComponent(
    verificationUrl
  )}`;

  // ลิงก์สำหรับส่งต่อให้กลางน้ำที่ระบุกระเป๋าไว้
  const cleanWallet = (assignedWallet || "").trim();
  const midstreamHandoverUrl = cleanWallet
    ? `${origin}${pathname}?page=midstream&productId=${encodeURIComponent(
        cleanId
      )}&to=${encodeURIComponent(cleanWallet)}`
    : `${origin}${pathname}?page=midstream&productId=${encodeURIComponent(cleanId)}`;

  const midstreamQrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=320x320&margin=12&color=0f172a&bgcolor=ffffff&data=${encodeURIComponent(
    midstreamHandoverUrl
  )}`;

  return {
    productId: cleanId,
    verificationUrl,
    qrImageUrl,
    midstreamHandoverUrl,
    midstreamQrImageUrl,
  };
}

/**
 * สร้างข้อความพร้อมลิงก์สำหรับแชร์ใบรับรองสินค้าให้ลูกค้าหรือคู่ค้า
 */
export function buildConsumerShareText(
  productId: string,
  productName: string
): string {
  const { verificationUrl } = generateQRCode(productId);
  return `ตรวจสอบย้อนกลับแหล่งที่มาบน LAB Chain: ${productName} (ล็อต #${productId}) -> ${verificationUrl}`;
}

