/**
 * 1. ฟังก์ชันฝั่ง Frontend: uploadToIPFS(file)
 * - หากผู้ใช้ตั้งค่า Pinata JWT ที่ถูกต้องไว้ (ขึ้นต้นด้วย eyJ... มี 3 ส่วน) จะอัปโหลดไฟล์จริงขึ้น Pinata IPFS
 * - หากยังไม่ได้ใส่ Pinata JWT หรือ Token ไม่ถูกต้อง ระบบจะสลับมาจำลองรหัส IPFS CID (bafybei...)
 *   พร้อมเก็บภาพตัวอย่างไว้แสดงผลบนหน้าเว็บให้อัตโนมัติ เพื่อให้การทดสอบและพรีเซนต์ไม่สะดุด
 */

const LOCAL_IPFS_PREVIEW_KEY = "laotrace_ipfs_previews_v1";

function getLocalPreviews(): Record<string, string> {
  try {
    const raw = localStorage.getItem(LOCAL_IPFS_PREVIEW_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveLocalPreview(cid: string, dataUrl: string): void {
  try {
    const current = getLocalPreviews();
    current[cid] = dataUrl;
    localStorage.setItem(LOCAL_IPFS_PREVIEW_KEY, JSON.stringify(current));
  } catch {
    // Ignore storage quota errors
  }
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function generateDeterministicCid(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const alphabet = "abcdefghijklmnopqrstuvwxyz234567";
  let suffix = "";
  for (let i = 0; i < 44; i++) {
    suffix += alphabet[hashArray[i % hashArray.length] % alphabet.length];
  }
  return `bafybei${suffix}`;
}

function isValidJwtFormat(token: string): boolean {
  const parts = token.trim().split(".");
  return parts.length === 3 && token.trim().startsWith("eyJ");
}

export interface IpfsUploadResult {
  ipfsHash: string;
  gatewayUrl: string;
  isSimulated: boolean;
}

export async function uploadToIPFS(
  file: File,
  pinataJwt?: string
): Promise<IpfsUploadResult> {
  const cleanJwt = (pinataJwt || localStorage.getItem("laotrace_pinata_jwt") || "").trim();

  // ตรวจสอบว่าเป็น Pinata JWT ของจริง (รูปแบบ eyJ... 3 ส่วน)
  if (cleanJwt && isValidJwtFormat(cleanJwt)) {
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append(
        "pinataMetadata",
        JSON.stringify({
          name: `laotrace-${Date.now()}-${file.name}`,
        })
      );

      const response = await fetch(
        "https://api.pinata.cloud/pinning/pinFileToIPFS",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${cleanJwt}`,
          },
          body: formData,
        }
      );

      if (response.ok) {
        const result = (await response.json()) as { IpfsHash: string };
        const cid = result.IpfsHash;
        const dataUrl = await fileToDataUrl(file);
        saveLocalPreview(cid, dataUrl);
        return {
          ipfsHash: cid,
          gatewayUrl: `https://gateway.pinata.cloud/ipfs/${cid}`,
          isSimulated: false,
        };
      }
    } catch (err) {
      console.warn("Pinata upload fallback to local IPFS simulation:", err);
    }
  }

  // โหมดจำลอง IPFS อัตโนมัติ (สร้าง CID จากไฟล์จริงด้วย SHA-256 + แสดงรูปได้ทันที)
  await new Promise((r) => setTimeout(r, 450));
  const cid = await generateDeterministicCid(file);
  const dataUrl = await fileToDataUrl(file);
  saveLocalPreview(cid, dataUrl);

  return {
    ipfsHash: cid,
    gatewayUrl: dataUrl,
    isSimulated: true,
  };
}

/**
 * แปลงรหัส IPFS CID หรือ ipfs://... ให้เป็นลิงก์รูปภาพที่แสดงบนแท็ก <img> ได้ทันที
 */
export function resolveIpfsUrl(ipfsHash: string): string {
  if (!ipfsHash) return "";
  const cleaned = ipfsHash.replace(/^ipfs:\/\//, "").trim();

  // เช็คว่ามีรูป Preview ที่อัปโหลดไว้ในเครื่องหรือไม่
  const previews = getLocalPreviews();
  if (previews[cleaned]) {
    return previews[cleaned];
  }

  // หากเป็น URL เต็มอยู่แล้ว
  if (
    cleaned.startsWith("http://") ||
    cleaned.startsWith("https://") ||
    cleaned.startsWith("data:")
  ) {
    return cleaned;
  }

  // รูปตัวอย่างสำหรับชุดข้อมูล Demo (1001, 1002, 1003)
  const demoAssetMap: Record<string, string> = {
    bafybeibolavencoffeeharvestpakxong001:
      "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=900&q=80",
    bafybeibolavencoffeedryingbedpakxong002:
      "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&w=900&q=80",
    bafybeibolavencoffeeroastervientiane003:
      "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=900&q=80",
    bafybeilaosilknaturaldyeingluangprabang01:
      "https://images.unsplash.com/photo-1606722590583-6951b5ea92ad?auto=format&fit=crop&w=900&q=80",
    bafybeilaosilkhandweavingnagapattern02:
      "https://images.unsplash.com/photo-1584992236310-6edddc08a227?auto=format&fit=crop&w=900&q=80",
    bafybeiphongsalyancientteaharvest400yr01:
      "https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?auto=format&fit=crop&w=900&q=80",
    bafybeiphongsalyteapanroastingorganic02:
      "https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=900&q=80",
  };

  if (demoAssetMap[cleaned]) {
    return demoAssetMap[cleaned];
  }

  return `https://gateway.pinata.cloud/ipfs/${cleaned}`;
}
