export interface NetworkConfig {
  chainId: number;
  chainIdHex: string;
  chainName: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  rpcUrls: string[];
  blockExplorerUrls: string[];
}

export const LAB_CHAIN_CONFIG: NetworkConfig = {
  chainId: 5222,
  chainIdHex: "0x1466",
  chainName: "LAB Chain",
  nativeCurrency: {
    name: "LAB",
    symbol: "LAB",
    decimals: 18,
  },
  rpcUrls: ["https://rpc.labchain.la"],
  blockExplorerUrls: ["https://explorer.labchain.la"],
};

// 📌 เมื่อเพื่อนทำ Smart Contract เสร็จและ Deploy ลง LAB Chain แล้ว
// สามารถนำ Contract Address มาวางแทนค่าด้านล่างนี้ หรือกรอกผ่านปุ่มตั้งค่าบนหน้าเว็บได้เลย
export const DEFAULT_CONTRACT_ADDRESS = "";

// 📌 ABI ที่ตรงกับฟังก์ชันทั้ง 4 ที่ตกลงกับเพื่อนไว้
export const LAOTRACE_ABI = [
  "function registerProduct(string _productId, string _productName, string _category, string _initialAction, string _location, string _ipfsHash) external",
  "function addTraceStep(string _productId, string _action, string _location, string _ipfsHash) external",
  "function updateTraceability(string _productId, string _action, string _location, string _ipfsHash) external",
  "function getTimeline(string _productId) external view returns (tuple(string action, string location, string ipfsHash, uint256 timestamp, address actor)[])",
  "function getProductHistory(string _productId) external view returns (tuple(string action, string location, string ipfsHash, uint256 timestamp, address actor)[])",
  "function getProductDetails(string _productId) external view returns (tuple(string productId, string productName, string category, address creator, uint256 createdAt, bool exists))",
  "function getAllProductIds() external view returns (string[])",
  "event ProductRegistered(string indexed productIdHash, string productId, string productName, string category, address indexed creator, uint256 timestamp)",
  "event TraceStepAdded(string indexed productIdHash, string productId, string action, string location, string ipfsHash, address indexed actor, uint256 timestamp)"
];

export interface ProductDetails {
  productId: string;
  productName: string;
  category: string;
  creator: string;
  createdAt: number;
  exists: boolean;
}

export interface TraceStepItem {
  action: string;
  location: string;
  ipfsHash: string;
  timestamp: number;
  actor: string;
  txHash?: string;
}

export interface ProductTraceData {
  details: ProductDetails;
  timeline: TraceStepItem[];
}
