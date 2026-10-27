import { BrowserProvider, Contract, JsonRpcProvider } from "ethers";
import {
  LAB_CHAIN_CONFIG,
  LAOTRACE_ABI,
  type ProductDetails,
  type ProductTraceData,
  type TraceStepItem,
} from "../config/contract";

const MOCK_STORAGE_KEY = "laotrace_mock_products_v2";
const CUSTODY_STORAGE_KEY = "laotrace_custody_map_v2";

// กระเป๋าตัวอย่างสำหรับทดสอบระบบสิทธิ์ (แก้ไขหรือวางกระเป๋า MetaMask จริงของคุณทับได้เลย)
export const DEMO_WALLETS = {
  FARMER: "0x71C95911E9a5D330f4D621842EC243EE1343292e",
  ROASTER_A: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
  SILK_CENTER_B: "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65",
  TEA_COOP_C: "0x976EA74026E726554dB657fA54763abd0C3a0aa9",
};

/**
 * ข้อมูลตัวอย่างเริ่มต้น
 */
const INITIAL_MOCK_PRODUCTS: Record<string, ProductTraceData> = {
  "1001": {
    details: {
      productId: "1001",
      productName: "กาแฟอาราบิก้า โบลาเวน พรีเมียม (Bolaven Single Origin)",
      category: "Coffee",
      creator: DEMO_WALLETS.FARMER,
      createdAt: 1760500800,
      exists: true,
    },
    timeline: [
      {
        action: "เก็บเกี่ยวผลเชอร์รี่สุกด้วยมือ (Hand-Picked Red Cherry)",
        location: "บ้านหนองหลวง เมืองปากซ่อง แขวงจำปาสัก (GPS: 15.1782, 106.2341)",
        ipfsHash: "bafybeibolavencoffeeharvestpakxong001",
        timestamp: 1760500800,
        actor: DEMO_WALLETS.FARMER,
        txHash: "0x94a8f1c2e7b40129c8a31f44b891e23c987a6510d23e4f5a6b7c8d9e0f1a2b3c",
      },
      {
        action: "แปรรูป Washed Process & ตากแห้งบนแคร่ไม้ไผ่ 14 วัน",
        location: "กลุ่มสหกรณ์กาแฟออร์แกนิกปากซ่อง (GPS: 15.1810, 106.2405)",
        ipfsHash: "bafybeibolavencoffeedryingbedpakxong002",
        timestamp: 1760587200,
        actor: DEMO_WALLETS.FARMER,
        txHash: "0x3b7e91d4a8c2f019e723d651a89f0123b45c6789d01e23f45a67b89c01d2e3f4",
      },
      {
        action: "คั่วระดับ Medium Roast & ผ่านผลตรวจ Lab (Cupping Score 86.5)",
        location: "โรงคั่ว Vientiane Specialty Roastery นครหลวงเวียงจันทน์",
        ipfsHash: "bafybeibolavencoffeeroastervientiane003",
        timestamp: 1760673600,
        actor: DEMO_WALLETS.ROASTER_A,
        txHash: "0x81f2c3d4e5a6b7890123456789abcdef0123456789abcdef0123456789abcdef",
      },
    ],
  },
  "1002": {
    details: {
      productId: "1002",
      productName: "ผ้าไหมมัดหมี่ทอมือ ลายพญานาคโบราณ (Heritage Naga Silk)",
      category: "Silk",
      creator: "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
      createdAt: 1760414400,
      exists: true,
    },
    timeline: [
      {
        action: "สาวไหมพื้นบ้าน & ย้อมสีธรรมชาติจากครั่งและครามป่า",
        location: "บ้านผานม เมืองหลวงพระบาง (GPS: 19.9045, 102.1682)",
        ipfsHash: "bafybeilaosilknaturaldyeingluangprabang01",
        timestamp: 1760414400,
        actor: "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
        txHash: "0x55a1b2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcde",
      },
      {
        action: "ทอมือด้วยกี่กระตุกโบราณ (ใช้เวลาทอ 21 วัน) & ตรวจสอบมาตรฐาน GI",
        location: "ศูนย์หัตถกรรมสิ่งทอหลวงพระบาง นครหลวงพระบาง",
        ipfsHash: "bafybeilaosilkhandweavingnagapattern02",
        timestamp: 1760640000,
        actor: DEMO_WALLETS.SILK_CENTER_B,
        txHash: "0x77c8d9e0f1a2b3c4d5e6f708192a3b4c5d6e7f8091a2b3c4d5e6f708192a3b4c",
      },
    ],
  },
  "1003": {
    details: {
      productId: "1003",
      productName: "ชาออร์แกนิกต้นชาโบราณ 400 ปี (Ancient Forest Shan Tea)",
      category: "Tea",
      creator: "0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc",
      createdAt: 1760328000,
      exists: true,
    },
    timeline: [
      {
        action: "เก็บยอดอ่อนใบชาป่าโบราณ (1 ยอด 2 ใบ) ระดับความสูง 1,600 เมตร",
        location: "บ้านกอแหม่ง แขวงพงสาลี (GPS: 21.6833, 102.1058)",
        ipfsHash: "bafybeiphongsalyancientteaharvest400yr01",
        timestamp: 1760328000,
        actor: "0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc",
        txHash: "0x12f3e4d5c6b7a890123456789abcdef0123456789abcdef0123456789abcdef0",
      },
      {
        action: "คั่วใบชาด้วยกระทะเหล็กโบราณ & รับรองมาตรฐาน EU Organic",
        location: "วิสาหกิจชุมชนชาพงสาลี แขวงพงสาลี",
        ipfsHash: "bafybeiphongsalyteapanroastingorganic02",
        timestamp: 1760550000,
        actor: DEMO_WALLETS.TEA_COOP_C,
        txHash: "0x64d5e6f7a8b9c0123456789abcdef0123456789abcdef0123456789abcdef012",
      },
    ],
  },
};

/**
 * ตารางผูกสิทธิ์ว่าแต่ละล็อต (productId) ถูกส่งมอบให้กระเป๋ากลางน้ำใบไหนดูแลต่อ
 * (เก็บที่ฝั่ง Frontend โดยไม่กระทบ Smart Contract ของเพื่อน)
 */
const INITIAL_CUSTODY_MAP: Record<string, string> = {
  "1001": DEMO_WALLETS.ROASTER_A.toLowerCase(),
  "1002": DEMO_WALLETS.SILK_CENTER_B.toLowerCase(),
  "1003": DEMO_WALLETS.TEA_COOP_C.toLowerCase(),
};

export function loadCustodyMap(): Record<string, string> {
  try {
    const raw = localStorage.getItem(CUSTODY_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(CUSTODY_STORAGE_KEY, JSON.stringify(INITIAL_CUSTODY_MAP));
      return { ...INITIAL_CUSTODY_MAP };
    }
    return { ...INITIAL_CUSTODY_MAP, ...JSON.parse(raw) };
  } catch {
    return { ...INITIAL_CUSTODY_MAP };
  }
}

export function assignProductCustody(productId: string, walletAddress: string): void {
  const cleanId = productId.trim();
  const cleanWallet = walletAddress.trim().toLowerCase();
  if (!cleanId || !cleanWallet) return;
  try {
    const current = loadCustodyMap();
    current[cleanId] = cleanWallet;
    localStorage.setItem(CUSTODY_STORAGE_KEY, JSON.stringify(current));
  } catch {
    // Ignore storage quota errors
  }
}

export function getAssignedWallet(productId: string): string {
  const map = loadCustodyMap();
  return map[productId.trim()] || "";
}

export function isWalletAuthorizedForBatch(
  productId: string,
  walletAddress: string
): boolean {
  if (!walletAddress) return false;
  const assigned = getAssignedWallet(productId);
  if (!assigned) return false;
  return assigned.toLowerCase() === walletAddress.trim().toLowerCase();
}

export function loadMockStore(): Record<string, ProductTraceData> {
  try {
    const raw = localStorage.getItem(MOCK_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(INITIAL_MOCK_PRODUCTS));
      return INITIAL_MOCK_PRODUCTS;
    }
    return { ...INITIAL_MOCK_PRODUCTS, ...JSON.parse(raw) };
  } catch {
    return INITIAL_MOCK_PRODUCTS;
  }
}

function saveMockStore(store: Record<string, ProductTraceData>): void {
  try {
    localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(store));
  } catch {
    // Ignore storage quota issues
  }
}

function getReadProvider(): JsonRpcProvider {
  return new JsonRpcProvider(LAB_CHAIN_CONFIG.rpcUrls[0], LAB_CHAIN_CONFIG.chainId, {
    staticNetwork: true,
  });
}

export function getProductIdFromUrl(): string | null {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  return params.get("productId") || params.get("id");
}

export function getHandoverTargetFromUrl(): string | null {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  return params.get("to");
}

/**
 * 3. ฟังก์ชันฝั่ง Frontend: fetchTraceabilityData(productId)
 */
export async function fetchTraceabilityData(
  productIdInput?: string,
  contractAddress?: string,
  useLiveContract?: boolean
): Promise<ProductTraceData> {
  const targetId = (productIdInput || getProductIdFromUrl() || "1001").trim();

  if (useLiveContract && contractAddress && contractAddress.startsWith("0x")) {
    const provider = getReadProvider();
    const contract = new Contract(contractAddress, LAOTRACE_ABI, provider);

    const rawDetails = await contract.getProductDetails(targetId);
    const rawTimeline = await contract.getTimeline(targetId);

    const details: ProductDetails = {
      productId: String(rawDetails.productId || targetId),
      productName: String(rawDetails.productName),
      category: String(rawDetails.category),
      creator: String(rawDetails.creator),
      createdAt: Number(rawDetails.createdAt),
      exists: Boolean(rawDetails.exists),
    };

    const timeline: TraceStepItem[] = (rawTimeline as Array<{
      action: string;
      location: string;
      ipfsHash: string;
      timestamp: bigint;
      actor: string;
    }>).map((step) => ({
      action: String(step.action),
      location: String(step.location),
      ipfsHash: String(step.ipfsHash),
      timestamp: Number(step.timestamp),
      actor: String(step.actor),
    }));

    return { details, timeline };
  }

  const store = loadMockStore();
  const found = store[targetId];
  if (!found) {
    throw new Error(`ไม่พบรหัสล็อตสินค้า #${targetId} ในระบบ`);
  }
  return found;
}

/**
 * เรียกฟังก์ชัน registerProduct บน Smart Contract (คง 6 ตัวแปรเดิมเป๊ะ ไม่กระทบหลังบ้านของเพื่อน)
 * พร้อมผูกสิทธิ์กระเป๋าผู้รับช่วงต่อ (assignedMidstreamWallet) ไว้ที่หน้าบ้าน
 */
export async function submitRegisterProduct(params: {
  productId: string;
  productName: string;
  category: string;
  initialAction: string;
  location: string;
  ipfsHash: string;
  assignedMidstreamWallet: string;
  contractAddress?: string;
  useLiveContract?: boolean;
  actorAddress?: string;
}): Promise<{ txHash: string }> {
  const {
    productId,
    productName,
    category,
    initialAction,
    location,
    ipfsHash,
    assignedMidstreamWallet,
    contractAddress,
    useLiveContract,
    actorAddress,
  } = params;

  const cleanId = productId.trim();

  if (useLiveContract && contractAddress && contractAddress.startsWith("0x")) {
    if (!window.ethereum) {
      throw new Error("กรุณาติดตั้ง MetaMask ก่อนทำรายการบน Blockchain");
    }
    const browserProvider = new BrowserProvider(window.ethereum);
    const signer = await browserProvider.getSigner();
    const contract = new Contract(contractAddress, LAOTRACE_ABI, signer);

    // ส่ง 6 ตัวแปรตามสเปกที่ตกลงกับเพื่อนเป๊ะ 100%
    const tx = await contract.registerProduct(
      cleanId,
      productName.trim(),
      category.trim(),
      initialAction.trim(),
      location.trim(),
      ipfsHash.trim()
    );
    const receipt = await tx.wait();

    // บันทึกสิทธิ์กระเป๋ากลางน้ำที่ได้รับมอบหมายไว้ที่ฝั่งหน้าบ้าน
    if (assignedMidstreamWallet.trim()) {
      assignProductCustody(cleanId, assignedMidstreamWallet.trim());
    }

    return { txHash: receipt?.hash || tx.hash };
  }

  // โหมด Demo
  await new Promise((r) => setTimeout(r, 600));
  const store = loadMockStore();
  if (store[cleanId]) {
    throw new Error(`รหัสล็อตสินค้า #${cleanId} มีอยู่ในระบบแล้ว กรุณาใช้รหัสใหม่`);
  }

  const nowSec = Math.floor(Date.now() / 1000);
  const sender = actorAddress || DEMO_WALLETS.FARMER;
  const mockTxHash =
    "0x" +
    Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("");

  store[cleanId] = {
    details: {
      productId: cleanId,
      productName: productName.trim(),
      category: category.trim(),
      creator: sender,
      createdAt: nowSec,
      exists: true,
    },
    timeline: [
      {
        action: initialAction.trim(),
        location: location.trim(),
        ipfsHash: ipfsHash.trim(),
        timestamp: nowSec,
        actor: sender,
        txHash: mockTxHash,
      },
    ],
  };

  saveMockStore(store);

  if (assignedMidstreamWallet.trim()) {
    assignProductCustody(cleanId, assignedMidstreamWallet.trim());
  }

  return { txHash: mockTxHash };
}

/**
 * เรียกฟังก์ชัน addTraceStep บน Smart Contract (คง 4 ตัวแปรเดิมเป๊ะ ไม่กระทบหลังบ้านของเพื่อน)
 * พร้อมตรวจสอบว่ากระเป๋าที่กดอัปเดตได้รับมอบสิทธิ์จากต้นน้ำจริงหรือไม่
 */
export async function submitAddTraceStep(params: {
  productId: string;
  action: string;
  location: string;
  ipfsHash: string;
  nextHandoverWallet?: string;
  contractAddress?: string;
  useLiveContract?: boolean;
  actorAddress?: string;
}): Promise<{ txHash: string }> {
  const {
    productId,
    action,
    location,
    ipfsHash,
    nextHandoverWallet,
    contractAddress,
    useLiveContract,
    actorAddress,
  } = params;

  const cleanId = productId.trim();
  const assignedWallet = getAssignedWallet(cleanId);

  // เช็คสิทธิ์: กระเป๋าที่กดอัปเดตต้องตรงกับกระเป๋าที่ได้รับมอบหมายเท่านั้น!
  if (
    assignedWallet &&
    (!actorAddress || assignedWallet.toLowerCase() !== actorAddress.trim().toLowerCase())
  ) {
    throw new Error(
      `ปฏิเสธการเข้าถึง: ล็อต #${cleanId} ถูกส่งมอบให้กระเป๋า ${assignedWallet} เท่านั้น กระเป๋าของคุณไม่มีสิทธิ์อัปเดตล็อตนี้`
    );
  }

  if (useLiveContract && contractAddress && contractAddress.startsWith("0x")) {
    if (!window.ethereum) {
      throw new Error("กรุณาติดตั้ง MetaMask ก่อนทำรายการบน Blockchain");
    }
    const browserProvider = new BrowserProvider(window.ethereum);
    const signer = await browserProvider.getSigner();
    const contract = new Contract(contractAddress, LAOTRACE_ABI, signer);

    // ส่ง 4 ตัวแปรตามสเปกที่ตกลงกับเพื่อนเป๊ะ 100%
    const tx = await contract.addTraceStep(
      cleanId,
      action.trim(),
      location.trim(),
      ipfsHash.trim()
    );
    const receipt = await tx.wait();

    // หากส่งไม้ต่อให้ผู้รับคนถัดไป (เช่น โรงคั่วส่งต่อให้ขนส่ง) ก็อัปเดตสิทธิ์
    if (nextHandoverWallet && nextHandoverWallet.trim().startsWith("0x")) {
      assignProductCustody(cleanId, nextHandoverWallet.trim());
    }

    return { txHash: receipt?.hash || tx.hash };
  }

  await new Promise((r) => setTimeout(r, 600));
  const store = loadMockStore();
  const product = store[cleanId];
  if (!product) {
    throw new Error(`ไม่พบรหัสล็อตสินค้า #${cleanId} ในระบบ`);
  }

  const nowSec = Math.floor(Date.now() / 1000);
  const sender = actorAddress || assignedWallet || DEMO_WALLETS.ROASTER_A;
  const mockTxHash =
    "0x" +
    Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("");

  product.timeline.push({
    action: action.trim(),
    location: location.trim(),
    ipfsHash: ipfsHash.trim(),
    timestamp: nowSec,
    actor: sender,
    txHash: mockTxHash,
  });

  saveMockStore(store);

  if (nextHandoverWallet && nextHandoverWallet.trim().startsWith("0x")) {
    assignProductCustody(cleanId, nextHandoverWallet.trim());
  }

  return { txHash: mockTxHash };
}

/**
 * ดึงรายการล็อตทั้งหมด (ใช้สำหรับหน้าลูกค้าปลายน้ำ)
 */
export function listAvailableProductIds(): ProductDetails[] {
  const store = loadMockStore();
  return Object.values(store).map((item) => item.details);
}

/**
 * ดึงเฉพาะรายการล็อตที่ถูกส่งมอบให้กระเป๋ากลางน้ำใบนี้เท่านั้น!
 * (กระเป๋าอื่นจะมองไม่เห็นล็อตของคนอื่นเลย)
 */
export function listProductsAssignedToWallet(walletAddress: string): ProductDetails[] {
  if (!walletAddress) return [];
  const cleanWallet = walletAddress.trim().toLowerCase();
  const store = loadMockStore();
  const custodyMap = loadCustodyMap();

  return Object.values(store)
    .map((item) => item.details)
    .filter((details) => {
      const assigned = (custodyMap[details.productId] || "").toLowerCase();
      return assigned === cleanWallet;
    });
}
