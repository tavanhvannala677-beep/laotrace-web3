import { LAB_CHAIN_CONFIG, type ProductTraceData } from "../config/contract";

/**
 * ส่งออกใบรับรองแหล่งกำเนิดสินค้า (On-Chain Provenance Certificate) เป็นไฟล์ JSON
 * รองรับการตรวจสอบย้อนกลับตามมาตรฐานการส่งออก (เช่น EUDR Compliance)
 */
export function exportProductCertificateJson(data: ProductTraceData): void {
  const payload = {
    standard: "LaoTrace-Web3-Provenance-v1",
    network: {
      name: LAB_CHAIN_CONFIG.chainName,
      chainId: LAB_CHAIN_CONFIG.chainId,
      rpcUrl: LAB_CHAIN_CONFIG.rpcUrls[0],
      explorerUrl: LAB_CHAIN_CONFIG.blockExplorerUrls[0],
    },
    exportedAt: new Date().toISOString(),
    product: data.details,
    provenanceTimeline: data.timeline.map((step, index) => ({
      stepNumber: index + 1,
      action: step.action,
      location: step.location,
      ipfsCid: step.ipfsHash,
      timestamp: step.timestamp,
      isoDate: new Date(step.timestamp * 1000).toISOString(),
      recordedByWallet: step.actor,
    })),
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `laotrace-certificate-${data.details.productId}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
