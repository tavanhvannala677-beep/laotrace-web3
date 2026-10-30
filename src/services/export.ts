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

/**
 * ส่งออกตารางประวัติการเดินทางของสินค้า (Provenance Timeline) เป็นไฟล์ CSV
 * เปิดได้ทันทีใน Excel หรือ Google Sheets พร้อมรองรับภาษาไทย/ลาว (UTF-8 BOM)
 */
export function exportProductTimelineCsv(data: ProductTraceData): void {
  const headers = [
    "Step",
    "ProductID",
    "ProductName",
    "Category",
    "Action",
    "Location",
    "IPFS_CID",
    "Timestamp_ISO",
    "RecordedByWallet",
  ];

  const escapeCsvCell = (value: string | number): string => {
    const str = String(value ?? "").replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = data.timeline.map((step, index) => [
    index + 1,
    data.details.productId,
    data.details.productName,
    data.details.category,
    step.action,
    step.location,
    step.ipfsHash,
    new Date(step.timestamp * 1000).toISOString(),
    step.actor,
  ]);

  const csvBody = [
    headers.map(escapeCsvCell).join(","),
    ...rows.map((row) => row.map(escapeCsvCell).join(",")),
  ].join("\r\n");

  const blob = new Blob(["\uFEFF" + csvBody], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `laotrace-timeline-${data.details.productId}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

