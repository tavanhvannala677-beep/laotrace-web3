import React, { useEffect, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  Leaf,
  Loader2,
  Lock,
  MapPin,
  Printer,
  QrCode,
  Search,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Truck,
  Upload,
  Wallet,
} from "lucide-react";
import {
  DEFAULT_CONTRACT_ADDRESS,
  LAB_CHAIN_CONFIG,
  type ProductDetails,
  type ProductTraceData,
} from "./config/contract";
import { resolveIpfsUrl, uploadToIPFS } from "./services/ipfs";
import { exportProductCertificateJson } from "./services/export";
import { generateQRCode, type GeneratedQRData } from "./services/qrcode";
import {
  assignProductCustody,
  DEMO_WALLETS,
  fetchTraceabilityData,
  getAssignedWallet,
  getHandoverTargetFromUrl,
  getProductIdFromUrl,
  isWalletAuthorizedForBatch,
  listAvailableProductIds,
  listProductsAssignedToWallet,
  submitAddTraceStep,
  submitRegisterProduct,
} from "./services/traceability";

type AppPage = "consumer" | "farmer" | "midstream";

const CATEGORIES = [
  {
    id: "Coffee",
    label: "กาแฟโบลาเวน",
    emoji: "☕",
    defaultName: "กาแฟอาราบิก้า โบลาเวน พรีเมียม",
    defaultOrigin: "เมืองปากซ่อง แขวงจำปาสัก",
    defaultInitialAction: "เก็บเกี่ยวผลผลิต (Harvested)",
    defaultReceiver: DEMO_WALLETS.ROASTER_A,
  },
  {
    id: "Silk",
    label: "ผ้าไหมทอมือ",
    emoji: "🧣",
    defaultName: "ผ้าไหมมัดหมี่ทอมือ ลายพญานาค",
    defaultOrigin: "บ้านผานม เมืองหลวงพระบาง",
    defaultInitialAction: "สาวไหมและย้อมสีธรรมชาติ",
    defaultReceiver: DEMO_WALLETS.SILK_CENTER_B,
  },
  {
    id: "Tea",
    label: "ชาออร์แกนิก",
    emoji: "🍵",
    defaultName: "ชาออร์แกนิกต้นชาโบราณ 400 ปี",
    defaultOrigin: "แขวงพงสาลี",
    defaultInitialAction: "เก็บยอดอ่อนใบชาป่าโบราณ",
    defaultReceiver: DEMO_WALLETS.TEA_COOP_C,
  },
];

function shortenAddress(addr: string): string {
  if (!addr || addr.length < 10) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function formatTimestamp(ts: number): string {
  if (!ts) return "-";
  return new Date(ts * 1000).toLocaleString("th-TH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getInitialPage(): AppPage {
  if (typeof window === "undefined") return "consumer";
  const params = new URLSearchParams(window.location.search);
  const pageParam = params.get("page");
  if (pageParam === "farmer") return "farmer";
  if (pageParam === "midstream") return "midstream";
  return "consumer";
}

export default function App() {
  const urlProductId = getProductIdFromUrl();
  const urlHandoverTo = getHandoverTargetFromUrl();
  const [currentPage, setCurrentPage] = useState<AppPage>(getInitialPage);

  // Wallet & Settings
  const [walletAddress, setWalletAddress] = useState<string>(
    () => DEMO_WALLETS.ROASTER_A
  );
  const [contractAddress, setContractAddress] = useState<string>(
    () => localStorage.getItem("laotrace_contract_address") || DEFAULT_CONTRACT_ADDRESS
  );
  const [useLiveContract, setUseLiveContract] = useState<boolean>(
    () => Boolean(localStorage.getItem("laotrace_contract_address"))
  );
  const [pinataJwt, setPinataJwt] = useState<string>(
    () => localStorage.getItem("laotrace_pinata_jwt") || ""
  );
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);

  // All products (for Consumer lookup) vs Assigned products (for Midstream wallet only!)
  const [allProducts, setAllProducts] = useState<ProductDetails[]>(() =>
    listAvailableProductIds()
  );
  const [assignedProducts, setAssignedProducts] = useState<ProductDetails[]>(() =>
    listProductsAssignedToWallet(DEMO_WALLETS.ROASTER_A)
  );

  // ============================================================================
  // PAGE 1 STATE: ชาวสวน / ต้นน้ำ (Farmer Portal)
  // ============================================================================
  const [p1ProductId, setP1ProductId] = useState<string>("1004");
  const [p1Category, setP1Category] = useState<string>("Coffee");
  const [p1ProductName, setP1ProductName] = useState<string>(
    CATEGORIES[0].defaultName
  );
  const [p1InitialAction, setP1InitialAction] = useState<string>(
    CATEGORIES[0].defaultInitialAction
  );
  const [p1Location, setP1Location] = useState<string>(
    CATEGORIES[0].defaultOrigin
  );
  const [p1AssignedWallet, setP1AssignedWallet] = useState<string>(
    CATEGORIES[0].defaultReceiver
  );
  const [p1IpfsHash, setP1IpfsHash] = useState<string>(
    "bafybeibolavencoffeeharvestpakxong001"
  );
  const [p1FileName, setP1FileName] = useState<string>("ใบรับรองมาตรฐาน.jpg");
  const [p1UploadingIpfs, setP1UploadingIpfs] = useState<boolean>(false);
  const [p1Submitting, setP1Submitting] = useState<boolean>(false);
  const [p1GeneratedQr, setP1GeneratedQr] = useState<GeneratedQRData | null>(null);
  const [p1Error, setP1Error] = useState<string>("");

  // ============================================================================
  // PAGE 2 STATE: โรงคั่ว / ขนส่ง / กลางน้ำ (Midstream Portal)
  // ============================================================================
  const [p2ProductId, setP2ProductId] = useState<string>(urlProductId || "1001");
  const [p2Action, setP2Action] = useState<string>("");
  const [p2Location, setP2Location] = useState<string>("");
  const [p2NextWallet, setP2NextWallet] = useState<string>("");
  const [p2IpfsHash, setP2IpfsHash] = useState<string>(
    "bafybeibolavencoffeeroastervientiane003"
  );
  const [p2FileName, setP2FileName] = useState<string>("");
  const [p2UploadingIpfs, setP2UploadingIpfs] = useState<boolean>(false);
  const [p2Submitting, setP2Submitting] = useState<boolean>(false);
  const [p2Success, setP2Success] = useState<boolean>(false);
  const [p2Error, setP2Error] = useState<string>("");
  const [p2PreviewData, setP2PreviewData] = useState<ProductTraceData | null>(null);

  // ============================================================================
  // PAGE 3 STATE: ลูกค้าสแกน QR / ปลายน้ำ (Consumer Public Page)
  // ============================================================================
  const [p3SearchId, setP3SearchId] = useState<string>(urlProductId || "1001");
  const [p3Data, setP3Data] = useState<ProductTraceData | null>(null);
  const [p3Loading, setP3Loading] = useState<boolean>(false);
  const [p3Error, setP3Error] = useState<string>("");

  // Sync URL handover (?page=midstream&productId=1004&to=0x...)
  useEffect(() => {
    if (urlProductId && urlHandoverTo) {
      assignProductCustody(urlProductId, urlHandoverTo);
    }
  }, [urlProductId, urlHandoverTo]);

  // Refresh assigned products whenever walletAddress changes!
  useEffect(() => {
    const filtered = listProductsAssignedToWallet(walletAddress);
    setAssignedProducts(filtered);
    if (filtered.length > 0) {
      const stillHasSelected = filtered.some((p) => p.productId === p2ProductId);
      if (!stillHasSelected) {
        setP2ProductId(filtered[0].productId);
      }
    } else {
      setP2ProductId("");
      setP2PreviewData(null);
    }
  }, [walletAddress, allProducts]);

  function navigateToPage(page: AppPage, productId?: string) {
    setCurrentPage(page);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      if (page === "consumer") {
        url.searchParams.delete("page");
        url.searchParams.delete("to");
        if (productId) url.searchParams.set("productId", productId);
      } else {
        url.searchParams.set("page", page);
      }
      window.history.pushState({}, "", url.toString());
    }
  }

  async function connectWallet() {
    if (!window.ethereum) {
      alert(
        "ไม่พบส่วนขยาย MetaMask บนเบราว์เซอร์ คุณสามารถกดสลับกระเป๋าทดสอบด้านบนเพื่อทดสอบระบบจำกัดสิทธิ์ได้ทันทีครับ"
      );
      return;
    }
    try {
      const accounts = (await window.ethereum.request({
        method: "eth_requestAccounts",
      })) as string[];
      if (accounts.length > 0) {
        setWalletAddress(accounts[0]);
      }

      try {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: LAB_CHAIN_CONFIG.chainIdHex }],
        });
      } catch (switchErr: unknown) {
        const err = switchErr as { code?: number };
        if (err.code === 4902) {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: LAB_CHAIN_CONFIG.chainIdHex,
                chainName: LAB_CHAIN_CONFIG.chainName,
                nativeCurrency: LAB_CHAIN_CONFIG.nativeCurrency,
                rpcUrls: LAB_CHAIN_CONFIG.rpcUrls,
                blockExplorerUrls: LAB_CHAIN_CONFIG.blockExplorerUrls,
              },
            ],
          });
        }
      }
    } catch (err) {
      console.error(err);
    }
  }

  // Listen to MetaMask account switch automatically
  useEffect(() => {
    if (!window.ethereum?.on) return;
    const handleAccountsChanged = (accounts: unknown) => {
      const list = accounts as string[];
      if (list && list.length > 0) {
        setWalletAddress(list[0]);
      }
    };
    window.ethereum.on("accountsChanged", handleAccountsChanged);
    return () => {
      window.ethereum?.removeListener?.("accountsChanged", handleAccountsChanged);
    };
  }, []);

  useEffect(() => {
    if (!p2ProductId) {
      setP2PreviewData(null);
      return;
    }
    fetchTraceabilityData(p2ProductId, contractAddress, useLiveContract)
      .then((res) => setP2PreviewData(res))
      .catch(() => setP2PreviewData(null));
  }, [p2ProductId, contractAddress, useLiveContract]);

  async function handleFetchTraceability(targetId?: string) {
    const idToFetch = (targetId ?? p3SearchId).trim();
    if (!idToFetch) return;
    setP3Loading(true);
    setP3Error("");
    try {
      const data = await fetchTraceabilityData(
        idToFetch,
        contractAddress,
        useLiveContract
      );
      setP3Data(data);
    } catch (err: unknown) {
      setP3Data(null);
      setP3Error(err instanceof Error ? err.message : "ไม่พบข้อมูลสินค้า");
    } finally {
      setP3Loading(false);
    }
  }

  useEffect(() => {
    handleFetchTraceability(urlProductId || "1001");
  }, [useLiveContract, contractAddress]);

  function handleSelectCategory(catId: string) {
    setP1Category(catId);
    const found = CATEGORIES.find((c) => c.id === catId);
    if (found) {
      setP1ProductName(found.defaultName);
      setP1Location(found.defaultOrigin);
      setP1InitialAction(found.defaultInitialAction);
      setP1AssignedWallet(found.defaultReceiver);
    }
  }

  async function handleP1FileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setP1FileName(file.name);
    setP1UploadingIpfs(true);
    setP1Error("");
    try {
      const res = await uploadToIPFS(file, pinataJwt);
      setP1IpfsHash(res.ipfsHash);
    } catch (err: unknown) {
      setP1Error(err instanceof Error ? err.message : "อัปโหลดรูปไม่สำเร็จ");
    } finally {
      setP1UploadingIpfs(false);
    }
  }

  async function handleP2FileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setP2FileName(file.name);
    setP2UploadingIpfs(true);
    setP2Error("");
    try {
      const res = await uploadToIPFS(file, pinataJwt);
      setP2IpfsHash(res.ipfsHash);
    } catch (err: unknown) {
      setP2Error(err instanceof Error ? err.message : "อัปโหลดรูปไม่สำเร็จ");
    } finally {
      setP2UploadingIpfs(false);
    }
  }

  async function handleRegisterProduct(e: React.FormEvent) {
    e.preventDefault();
    setP1Submitting(true);
    setP1Error("");
    setP1GeneratedQr(null);
    try {
      await submitRegisterProduct({
        productId: p1ProductId,
        productName: p1ProductName,
        category: p1Category,
        initialAction: p1InitialAction,
        location: p1Location,
        ipfsHash: p1IpfsHash,
        assignedMidstreamWallet: p1AssignedWallet,
        contractAddress,
        useLiveContract,
        actorAddress: walletAddress,
      });
      setP1GeneratedQr(generateQRCode(p1ProductId, p1AssignedWallet));
      setAllProducts(listAvailableProductIds());
      setP3SearchId(p1ProductId);
    } catch (err: unknown) {
      setP1Error(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setP1Submitting(false);
    }
  }

  async function handleAddTraceStep(e: React.FormEvent) {
    e.preventDefault();
    setP2Submitting(true);
    setP2Error("");
    setP2Success(false);
    try {
      await submitAddTraceStep({
        productId: p2ProductId,
        action: p2Action,
        location: p2Location,
        ipfsHash: p2IpfsHash,
        nextHandoverWallet: p2NextWallet,
        contractAddress,
        useLiveContract,
        actorAddress: walletAddress,
      });
      setP2Success(true);
      setP2Action("");
      setP2Location("");
      setP2NextWallet("");
      setAllProducts(listAvailableProductIds());
      setAssignedProducts(listProductsAssignedToWallet(walletAddress));
      const updated = await fetchTraceabilityData(
        p2ProductId,
        contractAddress,
        useLiveContract
      );
      setP2PreviewData(updated);
      setP3SearchId(p2ProductId);
      setP3Data(updated);
    } catch (err: unknown) {
      setP2Error(err instanceof Error ? err.message : "อัปเดตสถานะไม่สำเร็จ");
    } finally {
      setP2Submitting(false);
    }
  }

  function handleSaveSettings(e: React.FormEvent) {
    e.preventDefault();
    localStorage.setItem("laotrace_contract_address", contractAddress.trim());
    localStorage.setItem("laotrace_pinata_jwt", pinataJwt.trim());
    setShowSettingsModal(false);
  }

  const isCurrentWalletAuthorized = p2ProductId
    ? isWalletAuthorizedForBatch(p2ProductId, walletAddress)
    : false;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-24">
      {/* ===================================================================== */}
      {/* PAGE 1: หน้าสำหรับลูกค้าผู้บริโภคสแกน QR (Consumer Public Page)         */}
      {/* ===================================================================== */}
      {currentPage === "consumer" && (
        <div>
          <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
            <div className="max-w-2xl mx-auto px-4 h-16 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white">
                  <Leaf className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-bold text-base tracking-tight text-slate-900">
                    LaoTrace
                  </span>
                  <span className="ml-2 text-xs text-slate-500">
                    Official Product Passport
                  </span>
                </div>
              </div>

              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Verified by Blockchain</span>
              </span>
            </div>
          </header>

          <main className="max-w-2xl mx-auto px-4 py-8 space-y-5">
            {p3Loading && (
              <div className="p-12 text-center bg-white border border-slate-200 rounded-2xl">
                <Loader2 className="w-6 h-6 animate-spin text-emerald-600 mx-auto mb-2" />
                <p className="text-xs text-slate-500">
                  กำลังตรวจสอบข้อมูลจาก LAB Chain Blockchain...
                </p>
              </div>
            )}

            {p3Error && !p3Loading && (
              <div className="p-6 text-center bg-white border border-red-200 rounded-2xl text-xs text-red-600">
                {p3Error}
              </div>
            )}

            {p3Data && !p3Loading && (
              <div className="space-y-5">
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="space-y-1.5">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>
                          สินค้าของแท้ 100% · รหัสล็อต #{p3Data.details.productId}
                        </span>
                      </div>
                      <h1 className="text-xl font-bold text-slate-900">
                        {p3Data.details.productName}
                      </h1>
                      <p className="text-xs text-slate-500">
                        หมวดหมู่: {p3Data.details.category} · ขึ้นทะเบียนโดยชาวสวน:{" "}
                        <span className="font-mono text-slate-700">
                          {shortenAddress(p3Data.details.creator)}
                        </span>
                      </p>
                      <div className="pt-1">
                        <button
                          type="button"
                          onClick={() => exportProductCertificateJson(p3Data)}
                          className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 underline"
                        >
                          ดาวน์โหลดใบรับรอง JSON (EUDR Compliance)
                        </button>
                      </div>
                    </div>

                    <img
                      src={generateQRCode(p3Data.details.productId).qrImageUrl}
                      alt="QR Code"
                      className="w-20 h-20 rounded-xl border border-slate-200 p-1 shrink-0"
                    />
                  </div>
                </div>

                {/* Vertical Provenance Timeline */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-5">
                    <h2 className="text-sm font-bold text-slate-900">
                      เส้นทางการเดินทางของสินค้าตั้งแต่วันเก็บเกี่ยว ({p3Data.timeline.length}{" "}
                      ขั้นตอน)
                    </h2>
                    <span className="text-xs text-slate-400">
                      ข้อมูลล็อกถาวรบน Blockchain
                    </span>
                  </div>

                  <div className="relative pl-6 border-l-2 border-emerald-500/40 space-y-6">
                    {p3Data.timeline.map((step, index) => {
                      const imgUrl = resolveIpfsUrl(step.ipfsHash);
                      return (
                        <div key={index} className="relative">
                          <div className="absolute -left-[31px] top-1.5 w-3.5 h-3.5 rounded-full bg-emerald-600 ring-4 ring-emerald-50" />

                          <div className="flex flex-col sm:flex-row justify-between gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200/70">
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-2 text-xs text-slate-500">
                                <span className="font-semibold text-emerald-700">
                                  ขั้นตอนที่ {index + 1}
                                </span>
                                <span>·</span>
                                <span>{formatTimestamp(step.timestamp)}</span>
                              </div>

                              <div className="font-bold text-sm text-slate-900">
                                {step.action}
                              </div>

                              <div className="text-xs text-slate-600 flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                <span>{step.location}</span>
                              </div>

                              <div className="pt-1 flex items-center gap-3 text-xs text-slate-400">
                                <span className="font-mono">
                                  ผู้บันทึก: {shortenAddress(step.actor)}
                                </span>
                                <a
                                  href={imgUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-emerald-600 hover:underline flex items-center gap-1 font-medium"
                                >
                                  <span>ดูใบรับรอง IPFS</span>
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              </div>
                            </div>

                            <img
                              src={imgUrl}
                              alt={step.action}
                              className="w-full sm:w-28 h-24 object-cover rounded-lg border border-slate-200 shrink-0 bg-slate-100"
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).src =
                                  "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80";
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Lookup Another Batch Box */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
                  <div className="text-xs font-semibold text-slate-600">
                    ตรวจสอบรหัสล็อตสินค้าอื่น
                  </div>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleFetchTraceability(p3SearchId);
                    }}
                    className="flex gap-2"
                  >
                    <input
                      type="text"
                      value={p3SearchId}
                      onChange={(e) => setP3SearchId(e.target.value)}
                      placeholder="กรอกรหัสล็อตสินค้า เช่น 1001"
                      className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-emerald-600"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 transition"
                    >
                      <Search className="w-3.5 h-3.5" />
                      <span>ค้นหา</span>
                    </button>
                  </form>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs text-slate-400 mr-1">ล็อตตัวอย่าง:</span>
                    {allProducts.map((item) => (
                      <button
                        key={item.productId}
                        type="button"
                        onClick={() => {
                          setP3SearchId(item.productId);
                          handleFetchTraceability(item.productId);
                        }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                          p3SearchId === item.productId
                            ? "bg-emerald-600 text-white"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        #{item.productId} {item.category}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      )}

      {/* ===================================================================== */}
      {/* PAGE 2: หน้าสำหรับชาวสวน / ผู้ผลิตต้นน้ำ (Farmer Portal Page)          */}
      {/* ===================================================================== */}
      {currentPage === "farmer" && (
        <div>
          <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
            <div className="max-w-2xl mx-auto px-4 h-16 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white">
                  <Leaf className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-bold text-base text-slate-900">
                    LaoTrace
                  </span>
                  <span className="ml-2 text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold">
                    ระบบชาวสวน (ต้นน้ำ)
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setWalletAddress(DEMO_WALLETS.FARMER)}
                  className="px-3 py-2 rounded-xl text-xs font-medium bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 transition hidden sm:inline-flex items-center gap-1.5"
                  title="จำลองการเข้าสู่ระบบด้วยเบอร์โทรสหกรณ์ (ไม่ต้องติดตั้ง MetaMask)"
                >
                  <span>📱 โหมดสหกรณ์/เบอร์โทร</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowSettingsModal(true)}
                  className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition"
                  title="ตั้งค่าเชื่อมต่อหลังบ้าน"
                >
                  <Settings className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={connectWallet}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 transition"
                >
                  <Wallet className="w-3.5 h-3.5" />
                  <span>
                    {walletAddress
                      ? shortenAddress(walletAddress)
                      : "เชื่อมกระเป๋าชาวสวน"}
                  </span>
                </button>
              </div>
            </div>
          </header>

          <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <div className="mb-6">
                <h1 className="text-lg font-bold text-slate-900">
                  ลงทะเบียนสินค้าล็อตใหม่ขึ้น Blockchain
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  บันทึกข้อมูลต้นกำเนิด พร้อมระบุกระเป๋าผู้รับช่วงต่อ (กลางน้ำ) ที่จะมีสิทธิ์อัปเดตล็อตนี้
                </p>
              </div>

              <form onSubmit={handleRegisterProduct} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-2">
                    หมวดหมู่สินค้า
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {CATEGORIES.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => handleSelectCategory(cat.id)}
                        className={`py-2.5 px-3 rounded-xl border text-xs font-semibold transition flex items-center justify-center gap-1.5 ${
                          p1Category === cat.id
                            ? "bg-emerald-50 border-emerald-600 text-emerald-800"
                            : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        <span>{cat.emoji}</span>
                        <span>{cat.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      รหัสล็อตสินค้า
                    </label>
                    <input
                      type="text"
                      required
                      value={p1ProductId}
                      onChange={(e) => setP1ProductId(e.target.value)}
                      placeholder="1004"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-emerald-600"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      ชื่อสินค้า
                    </label>
                    <input
                      type="text"
                      required
                      value={p1ProductName}
                      onChange={(e) => setP1ProductName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-emerald-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      กิจกรรมเริ่มต้น
                    </label>
                    <input
                      type="text"
                      required
                      value={p1InitialAction}
                      onChange={(e) => setP1InitialAction(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-emerald-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      สถานที่ / พิกัดสวน
                    </label>
                    <input
                      type="text"
                      required
                      value={p1Location}
                      onChange={(e) => setP1Location(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-emerald-600"
                    />
                  </div>
                </div>

                {/* NEW: กำหนดกระเป๋าผู้รับช่วงต่อ (กลางน้ำ) */}
                <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-emerald-900 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-emerald-600" />
                      <span>
                        ระบุกระเป๋ากลางน้ำที่รับของต่อ (เฉพาะกระเป๋านี้เท่านั้นที่จะเห็นและอัปเดตได้)
                      </span>
                    </label>
                  </div>
                  <input
                    type="text"
                    required
                    value={p1AssignedWallet}
                    onChange={(e) => setP1AssignedWallet(e.target.value)}
                    placeholder="0x..."
                    className="w-full px-3.5 py-2 rounded-xl bg-white border border-emerald-200 text-xs font-mono text-slate-800 focus:outline-none focus:border-emerald-600"
                  />
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    <span className="text-xs text-slate-500 self-center mr-1">
                      เลือกเร็ว:
                    </span>
                    {walletAddress && (
                      <button
                        type="button"
                        onClick={() => setP1AssignedWallet(walletAddress)}
                        className="text-xs px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-medium"
                      >
                        ส่งให้กระเป๋าที่เชื่อมอยู่ตอนนี้ ({shortenAddress(walletAddress)})
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setP1AssignedWallet(DEMO_WALLETS.ROASTER_A)}
                      className="text-xs px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
                    >
                      โรงคั่ว A ({shortenAddress(DEMO_WALLETS.ROASTER_A)})
                    </button>
                    <button
                      type="button"
                      onClick={() => setP1AssignedWallet(DEMO_WALLETS.SILK_CENTER_B)}
                      className="text-xs px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
                    >
                      ศูนย์ผ้าไหม B ({shortenAddress(DEMO_WALLETS.SILK_CENTER_B)})
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    รูปถ่ายใบรับรอง Organic / รูปสวน (เก็บลง IPFS)
                  </label>
                  <label className="w-full px-4 py-3 rounded-xl border border-dashed border-slate-300 hover:border-emerald-500 bg-slate-50/60 cursor-pointer flex items-center justify-between transition">
                    <div className="flex items-center gap-2.5 text-xs text-slate-600">
                      {p1UploadingIpfs ? (
                        <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                      ) : (
                        <Upload className="w-4 h-4 text-emerald-600" />
                      )}
                      <span>
                        {p1UploadingIpfs
                          ? "กำลังอัปโหลดไปที่ IPFS..."
                          : p1FileName || "คลิกเพื่อเลือกรูปภาพ"}
                      </span>
                    </div>
                    <span className="text-xs font-mono text-slate-400 truncate max-w-[160px]">
                      {p1IpfsHash}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleP1FileChange}
                      className="hidden"
                    />
                  </label>
                </div>

                {p1Error && (
                  <p className="text-xs text-red-600 bg-red-50 p-3 rounded-xl">
                    {p1Error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={p1Submitting}
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {p1Submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>กำลังบันทึกลง Blockchain...</span>
                    </>
                  ) : (
                    <span>บันทึกสินค้าและสร้าง QR Code ส่งมอบ</span>
                  )}
                </button>
              </form>
            </div>

            {p1GeneratedQr && (
              <div className="bg-white border border-emerald-200 rounded-2xl p-6 shadow-sm text-center space-y-4">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>สร้าง QR Code ประจำล็อต #{p1GeneratedQr.productId} สำเร็จ</span>
                </div>

                <div className="flex justify-center">
                  <img
                    src={p1GeneratedQr.qrImageUrl}
                    alt="QR Code"
                    className="w-44 h-44 rounded-xl border border-slate-200 p-2"
                  />
                </div>

                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-xs">
                  <Lock className="w-3.5 h-3.5 text-emerald-600" />
                  <span>
                    ล็อกสิทธิ์กลางน้ำให้เฉพาะกระเป๋า:{" "}
                    <b className="font-mono">{shortenAddress(p1AssignedWallet)}</b>
                  </span>
                </div>

                <div className="flex justify-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>พิมพ์แปะกระสอบ</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setWalletAddress(p1AssignedWallet);
                      setP2ProductId(p1GeneratedQr.productId);
                      navigateToPage("midstream");
                    }}
                    className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5"
                  >
                    <span>ไปหน้ากลางน้ำ (ในฐานะผู้รับมอบ)</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </main>
        </div>
      )}

      {/* ===================================================================== */}
      {/* PAGE 3: หน้าสำหรับโรงคั่ว / ขนส่ง / กลางน้ำ (Midstream Portal Page)   */}
      {/* (เห็นเฉพาะล็อตที่ต้นน้ำระบุส่งให้กระเป๋าใบนี้เท่านั้น!)                 */}
      {/* ===================================================================== */}
      {currentPage === "midstream" && (
        <div>
          <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
            <div className="max-w-2xl mx-auto px-4 h-16 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center text-white">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-bold text-base text-slate-900">
                    LaoTrace
                  </span>
                  <span className="ml-2 text-xs px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 font-semibold">
                    ระบบผู้ประกอบการ (กลางน้ำ)
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowSettingsModal(true)}
                  className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition"
                  title="ตั้งค่าเชื่อมต่อหลังบ้าน"
                >
                  <Settings className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={connectWallet}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white flex items-center gap-1.5 transition"
                >
                  <Wallet className="w-3.5 h-3.5" />
                  <span>
                    {walletAddress
                      ? shortenAddress(walletAddress)
                      : "เชื่อมกระเป๋ากลางน้ำ"}
                  </span>
                </button>
              </div>
            </div>
          </header>

          <main className="max-w-2xl mx-auto px-4 py-8 space-y-5">
            {/* แถบจำลองสลับกระเป๋า เพื่อพิสูจน์ว่ากระเป๋าอื่นจะมองไม่เห็นล็อตของเรา! */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-emerald-600" />
                  <span>กระเป๋ากลางน้ำที่กำลังล็อกอินอยู่:</span>
                </span>
                <span className="font-mono font-bold text-emerald-700">
                  {shortenAddress(walletAddress)}
                </span>
              </div>

              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => setWalletAddress(DEMO_WALLETS.ROASTER_A)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition ${
                    walletAddress.toLowerCase() ===
                    DEMO_WALLETS.ROASTER_A.toLowerCase()
                      ? "bg-emerald-600 text-white border-emerald-600"
                      : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  ☕ กระเป๋าโรงคั่ว A ({shortenAddress(DEMO_WALLETS.ROASTER_A)})
                </button>

                <button
                  type="button"
                  onClick={() => setWalletAddress(DEMO_WALLETS.SILK_CENTER_B)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition ${
                    walletAddress.toLowerCase() ===
                    DEMO_WALLETS.SILK_CENTER_B.toLowerCase()
                      ? "bg-emerald-600 text-white border-emerald-600"
                      : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  🧣 กระเป๋าศูนย์ผ้าไหม B ({shortenAddress(DEMO_WALLETS.SILK_CENTER_B)})
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setWalletAddress("0x0000000000000000000000000000000000009999")
                  }
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition ${
                    walletAddress.endsWith("9999")
                      ? "bg-red-600 text-white border-red-600"
                      : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  🚫 ลองสลับเป็นกระเป๋าคนนอก (ไม่ได้รับสิทธิ์)
                </button>
              </div>
            </div>

            {/* Main Midstream Card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
              <div>
                <h1 className="text-lg font-bold text-slate-900">
                  รายการล็อตสินค้าที่ส่งมอบให้กระเป๋าของคุณ
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  แสดงเฉพาะรหัสล็อตที่ต้นน้ำระบุส่งต่อให้กระเป๋า{" "}
                  <span className="font-mono font-semibold text-slate-700">
                    {shortenAddress(walletAddress)}
                  </span>{" "}
                  เท่านั้น (กระเป๋าอื่นจะมองไม่เห็น)
                </p>
              </div>

              {assignedProducts.length === 0 ? (
                <div className="p-8 rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-center space-y-2">
                  <ShieldAlert className="w-8 h-8 text-amber-500 mx-auto" />
                  <div className="text-sm font-bold text-slate-800">
                    ไม่พบล็อตสินค้าที่ส่งมอบให้กระเป๋านี้
                  </div>
                  <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                    กระเป๋า <code className="font-mono">{shortenAddress(walletAddress)}</code>{" "}
                    ยังไม่ได้รับมอบหมายจากต้นน้ำให้ดูแลล็อตสินค้าใดๆ
                    จึงไม่สามารถมองเห็นหรือแอบอัปเดตข้อมูลของคนอื่นได้
                  </p>
                </div>
              ) : (
                <form onSubmit={handleAddTraceStep} className="space-y-4">
                  {/* แสดงเฉพาะล็อตที่กระเป๋านี้ได้รับสิทธิ์เท่านั้น */}
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1.5">
                      รหัสล็อตสินค้าที่คุณได้รับมอบสิทธิ์ ({assignedProducts.length} รายการ)
                    </label>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {assignedProducts.map((item) => (
                        <button
                          key={item.productId}
                          type="button"
                          onClick={() => setP2ProductId(item.productId)}
                          className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition flex items-center gap-1.5 ${
                            p2ProductId === item.productId
                              ? "bg-slate-900 text-white border-slate-900"
                              : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                          }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>
                            #{item.productId} · {item.productName}
                          </span>
                        </button>
                      ))}
                    </div>

                    {p2PreviewData && (
                      <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200 space-y-1 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-emerald-950">
                            {p2PreviewData.details.productName}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold">
                            ✓ กระเป๋าของคุณได้รับสิทธิ์ถูกต้อง
                          </span>
                        </div>
                        <div className="text-slate-600">
                          สถานะล่าสุด:{" "}
                          <span className="font-medium text-slate-900">
                            {
                              p2PreviewData.timeline[
                                p2PreviewData.timeline.length - 1
                              ]?.action
                            }
                          </span>{" "}
                          (บันทึกแล้ว {p2PreviewData.timeline.length} ขั้นตอน)
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      ขั้นตอนที่ดำเนินการใหม่
                    </label>
                    <input
                      type="text"
                      required
                      value={p2Action}
                      onChange={(e) => setP2Action(e.target.value)}
                      placeholder="เช่น ตากแห้ง, คั่วระดับกลาง, ตรวจสอบคุณภาพ Lab, ส่งออก"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-slate-900"
                    />
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {[
                        "ตากแห้งธรรมชาติ 14 วัน",
                        "คั่วระดับ Medium Roast",
                        "ผ่านการตรวจคุณภาพ Lab",
                        "บรรจุพร้อมส่งออก",
                      ].map((sample) => (
                        <button
                          key={sample}
                          type="button"
                          onClick={() => setP2Action(sample)}
                          className="text-xs px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-600 transition"
                        >
                          + {sample}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      สถานที่ดำเนินการปัจจุบัน
                    </label>
                    <input
                      type="text"
                      required
                      value={p2Location}
                      onChange={(e) => setP2Location(e.target.value)}
                      placeholder="เช่น โรงคั่วเวียงจันทน์"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      แนบรูปผลตรวจ Lab / รูปหลักฐาน (เก็บลง IPFS)
                    </label>
                    <label className="w-full px-4 py-3 rounded-xl border border-dashed border-slate-300 hover:border-slate-900 bg-slate-50/60 cursor-pointer flex items-center justify-between transition">
                      <div className="flex items-center gap-2.5 text-xs text-slate-600">
                        {p2UploadingIpfs ? (
                          <Loader2 className="w-4 h-4 animate-spin text-slate-900" />
                        ) : (
                          <Upload className="w-4 h-4 text-slate-900" />
                        )}
                        <span>
                          {p2UploadingIpfs
                            ? "กำลังอัปโหลด..."
                            : p2FileName || "คลิกเพื่อเลือกรูปหลักฐาน"}
                        </span>
                      </div>
                      <span className="text-xs font-mono text-slate-400 truncate max-w-[160px]">
                        {p2IpfsHash}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleP2FileChange}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {/* ส่งไม้ต่อให้กระเป๋าถัดไป (Optional) */}
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                    <label className="block text-xs font-medium text-slate-700">
                      ส่งมอบสิทธิ์ต่อให้กระเป๋าถัดไป (เช่น บริษัทขนส่ง — เว้นว่างไว้ได้หากยังดูแลต่อ)
                    </label>
                    <input
                      type="text"
                      value={p2NextWallet}
                      onChange={(e) => setP2NextWallet(e.target.value)}
                      placeholder="0x... (เว้นว่างไว้หากยังไม่ส่งต่อ)"
                      className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-xs font-mono text-slate-800"
                    />
                  </div>

                  {p2Error && (
                    <p className="text-xs text-red-600 bg-red-50 p-3 rounded-xl">
                      {p2Error}
                    </p>
                  )}

                  {p2Success && (
                    <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs text-emerald-800">
                      <span className="font-semibold">
                        ✓ บันทึกสถานะต่อท้ายลง Blockchain เรียบร้อยแล้ว
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setP3SearchId(p2ProductId);
                          handleFetchTraceability(p2ProductId);
                          navigateToPage("consumer", p2ProductId);
                        }}
                        className="underline font-bold"
                      >
                        เปิดดูหน้าของลูกค้า →
                      </button>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={p2Submitting || !isCurrentWalletAuthorized}
                    className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm transition flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {p2Submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>กำลังบันทึก...</span>
                      </>
                    ) : (
                      <span>บันทึกสถานะต่อท้ายลง Blockchain</span>
                    )}
                  </button>
                </form>
              )}
            </div>
          </main>
        </div>
      )}

      {/* ===================================================================== */}
      {/* FLOATING ROLE SWITCHER BAR                                            */}
      {/* ===================================================================== */}
      <div className="fixed bottom-4 inset-x-0 z-30 flex justify-center px-4 pointer-events-none">
        <div className="pointer-events-auto bg-slate-900/95 text-white backdrop-blur-md px-2 py-1.5 rounded-full shadow-xl border border-slate-700 flex items-center gap-1 text-xs">
          <span className="px-2.5 text-slate-400 hidden sm:inline">
            สลับหน้าจอ:
          </span>
          <button
            type="button"
            onClick={() => navigateToPage("farmer")}
            className={`px-3 py-1.5 rounded-full font-medium transition flex items-center gap-1.5 ${
              currentPage === "farmer"
                ? "bg-emerald-500 text-slate-950 font-bold"
                : "text-slate-300 hover:text-white"
            }`}
          >
            <Leaf className="w-3.5 h-3.5" />
            <span>หน้าชาวสวน (ต้นน้ำ)</span>
          </button>

          <button
            type="button"
            onClick={() => navigateToPage("midstream")}
            className={`px-3 py-1.5 rounded-full font-medium transition flex items-center gap-1.5 ${
              currentPage === "midstream"
                ? "bg-amber-400 text-slate-950 font-bold"
                : "text-slate-300 hover:text-white"
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            <span>หน้าโรงคั่ว (กลางน้ำ)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              handleFetchTraceability(p3SearchId);
              navigateToPage("consumer", p3SearchId);
            }}
            className={`px-3 py-1.5 rounded-full font-medium transition flex items-center gap-1.5 ${
              currentPage === "consumer"
                ? "bg-white text-slate-950 font-bold"
                : "text-slate-300 hover:text-white"
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>หน้าลูกค้าสแกน QR (ปลายน้ำ)</span>
          </button>
        </div>
      </div>

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900">
                ตั้งค่าการเชื่อมต่อหลังบ้าน
              </h3>
              <button
                type="button"
                onClick={() => setShowSettingsModal(false)}
                className="text-slate-400 hover:text-slate-700 text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <div className="font-semibold text-slate-800">
                    เชื่อมต่อ Smart Contract จริง
                  </div>
                  <div className="text-slate-500">
                    ปิดไว้หากต้องการทดสอบด้วยข้อมูลจำลอง (Demo)
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={useLiveContract}
                  onChange={(e) => setUseLiveContract(e.target.checked)}
                  className="w-4 h-4 accent-emerald-600"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Contract Address (LAB Chain)
                </label>
                <input
                  type="text"
                  value={contractAddress}
                  onChange={(e) => setContractAddress(e.target.value)}
                  placeholder="0x..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono text-slate-800"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Pinata JWT (เว้นว่างไว้ได้ ระบบจะสร้าง CID ให้อัตโนมัติ)
                </label>
                <input
                  type="text"
                  autoComplete="off"
                  value={pinataJwt}
                  onChange={(e) => setPinataJwt(e.target.value)}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono text-slate-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSettingsModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-semibold"
                >
                  บันทึก
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
