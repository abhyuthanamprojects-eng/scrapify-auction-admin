import { useCallback, useEffect, useState } from "react";
import { adminApi } from "./api-client";

export type VendorStatus = "Pending" | "Approved" | "Rejected" | "Suspended" | "Draft";

export type MaterialCategory = "Ferrous" | "Non-Ferrous" | "E-Waste" | "Paper" | "Plastic" | "Rubber";
export const MATERIAL_CATEGORIES: MaterialCategory[] = [
  "Ferrous",
  "Non-Ferrous",
  "E-Waste",
  "Paper",
  "Plastic",
  "Rubber",
];

export type VendorDocument = {
  id: string;
  name: string;
  kind: string;
  key?: string;
  fileName: string;
  sizeKb: number;
  uploadedAt: string;
  status: "approved" | "rejected" | "pending";
  reason?: string;
  ocrStatus?: string;
  ocrConfidence?: number;
  ocrExtractedData?: Record<string, any>;
  approvedOn?: string;
};

export type AuctionParticipation = {
  id: string;
  auction: string;
  date: string;
  bids: number;
  won: boolean;
  amountInr: number;
};

export type Vendor = {
  id: string;
  code: string;
  userRole: "buyer" | "seller" | "admin";
  companyName: string;
  tradeName?: string;
  businessType?: string;
  cinNumber?: string;
  turnoverBand?: string;
  yearsInBusiness?: string;
  annualCapacity?: string;

  location: string;
  address?: string;
  addressLine1?: string;
  city?: string;
  state?: string;
  pincode?: string;
  operatingStates?: string[];

  contactName: string;
  email: string;
  phone: string;

  gstNumber: string;
  gstStatus: string;
  panNumber?: string;
  panStatus?: string;
  licenseNumber: string;

  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
  accountHolderName?: string;
  branchName?: string;
  accountType?: string;
  bankStatus?: string;

  signatoryName?: string;
  signatoryDesignation?: string;
  signatoryEmail?: string;
  signatoryPhone?: string;

  materialInterest: MaterialCategory[];
  status: VendorStatus;
  canBid: boolean;
  createdAt: string;
  submittedAt?: string;
  approvedAt?: string;
  rejectionReason?: string;
  rejectionItems?: string[];
  suspensionReason?: string;
  documents: VendorDocument[];
  participation: AuctionParticipation[];
};

/** Map a single vendor from the Laravel API snake_case shape to the front-end camelCase Vendor type. */
function mapVendor(v: any): Vendor {
  const rawStatus = (v.status || "pending") as string;
  const status = (rawStatus.charAt(0).toUpperCase() + rawStatus.slice(1)) as VendorStatus;
  return {
    id: v.code ?? v.id,
    code: v.code ?? v.id,
    userRole: v.user_role ?? v.user?.role ?? (v.role === 'seller' ? 'seller' : 'buyer'),
    companyName: v.company_name ?? v.companyName ?? "",
    tradeName: v.trade_name ?? v.tradeName ?? "",
    businessType: v.business_type ?? v.businessType ?? "Private Limited",
    cinNumber: v.cin_number ?? v.cinNumber ?? "",
    turnoverBand: v.turnover_band ?? v.turnoverBand ?? "",
    yearsInBusiness: v.years_in_business ?? v.yearsInBusiness ?? "",
    annualCapacity: v.annual_capacity ?? v.annualCapacity ?? "",

    location: v.location ?? (v.city && v.state ? `${v.city}, ${v.state}` : ""),
    address: v.address ?? "",
    addressLine1: v.address_line1 ?? v.addressLine1 ?? v.address ?? "",
    city: v.city ?? "",
    state: v.state ?? "",
    pincode: v.pincode ?? "",
    operatingStates: v.operating_states ?? v.operatingStates ?? [],

    contactName: v.contact_name ?? v.contactName ?? "",
    email: v.email ?? "",
    phone: v.phone ?? "",

    gstNumber: v.gst_number ?? v.gstNumber ?? "",
    gstStatus: v.gst_status ?? v.gstStatus ?? "not_checked",
    panNumber: v.pan_number ?? v.panNumber ?? "",
    panStatus: v.pan_status ?? v.panStatus ?? "not_checked",
    licenseNumber: v.license_number ?? v.licenseNumber ?? "",

    bankName: v.bank_name ?? v.bankName ?? "",
    accountNumber: v.account_number ?? v.accountNumber ?? "",
    ifscCode: v.ifsc_code ?? v.ifscCode ?? "",
    accountHolderName: v.account_holder_name ?? v.accountHolderName ?? "",
    branchName: v.branch_name ?? v.branchName ?? "",
    accountType: v.account_type ?? v.accountType ?? "Current Account",
    bankStatus: v.bank_status ?? v.bankStatus ?? "not_checked",

    signatoryName: v.signatory_name ?? v.signatoryName ?? "",
    signatoryDesignation: v.signatory_designation ?? v.signatoryDesignation ?? "",
    signatoryEmail: v.signatory_email ?? v.signatoryEmail ?? "",
    signatoryPhone: v.signatory_phone ?? v.signatoryPhone ?? "",

    materialInterest: (v.materials || v.material_interest || []).map((m: any) =>
      typeof m === "string" ? m : m.name,
    ),
    status,
    canBid: typeof v.can_bid === 'boolean' ? v.can_bid : status === 'Approved',
    createdAt: v.created_at ?? v.createdAt ?? "",
    submittedAt: v.submitted_at ?? v.submittedAt,
    approvedAt: v.approved_at ?? v.approvedAt,
    rejectionReason: v.rejection_reason ?? v.rejectionReason,
    rejectionItems: v.rejection_items ?? v.rejectionItems ?? [],
    suspensionReason: v.suspension_reason ?? v.suspensionReason,
    documents: (v.documents || []).map((d: any) => ({
      id: String(d.id),
      key: d.key ?? d.doc_key,
      name: d.name ?? d.kind ?? "",
      kind: d.kind ?? "KYC Document",
      fileName: d.file_name ?? d.fileName ?? "",
      sizeKb: d.size_kb ?? d.sizeKb ?? 0,
      uploadedAt: d.uploaded_at ?? d.uploadedAt ?? "",
      status: d.status ?? "approved",
      reason: d.reason ?? "",
      ocrStatus: d.ocr_status ?? d.ocrStatus,
      ocrConfidence: d.ocr_confidence ?? d.ocrConfidence,
      ocrExtractedData: d.ocr_extracted_data ?? d.ocrExtractedData,
      approvedOn: d.approved_on ?? d.approvedOn,
    })),
    participation: (v.participation || []).map((p: any) => ({
      id: String(p.id),
      auction: p.auction ?? "",
      date: p.date ?? "",
      bids: p.bids ?? 0,
      won: !!p.won,
      amountInr: p.amount_inr ?? p.amountInr ?? 0,
    })),
  };
}

/* ------------------------------------------------------------------ */
/*  API-backed fetching                                                */
/* ------------------------------------------------------------------ */

export async function fetchVendors(params: Record<string, any> = {}): Promise<Vendor[]> {
  const res = await adminApi.getVendors(params);
  const list = Array.isArray(res) ? res : (res as any).data ?? [];
  return list.map(mapVendor);
}

export async function fetchVendorById(id: string): Promise<Vendor | null> {
  try {
    const res = await adminApi.getVendor(id);
    const data = (res as any).data ?? res;
    return mapVendor(data);
  } catch (err) {
    console.error("fetchVendorById error:", err);
    return null;
  }
}

export async function approveVendorApi(id: string): Promise<void> {
  await adminApi.approveVendor(id);
}

export async function rejectVendorApi(id: string, reason: string): Promise<void> {
  await adminApi.rejectVendor(id, reason);
}

export async function suspendVendorApi(id: string, reason: string): Promise<void> {
  await adminApi.suspendVendor(id, reason);
}

export async function reviewVendorDocumentApi(vendorCode: string, docId: string, status: "approved" | "rejected", reason?: string): Promise<void> {
  await adminApi.reviewVendorDocument(vendorCode, docId, status, reason);
}

export function useVendors() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchVendors();
      setVendors(data);
    } catch (err: any) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { vendors, loading, error, refetch: load };
}

export function useVendor(id: string) {
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const v = await fetchVendorById(id);
      setVendor(v);
    } catch (err: any) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  return { vendor, loading, error, refetch: load };
}

export function vendorStatusTone(status: VendorStatus) {
  switch (status) {
    case "Approved":
      return "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";
    case "Pending":
      return "border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400";
    case "Rejected":
      return "border-red-500/40 bg-red-500/10 text-red-600 dark:text-red-400";
    case "Suspended":
      return "border-slate-500/40 bg-slate-500/10 text-slate-400";
    case "Draft":
      return "border-blue-500/40 bg-blue-500/10 text-blue-400";
    default:
      return "border-border bg-muted/40 text-muted-foreground";
  }
}

export function vendorsToCSV(vendors: Vendor[]): string {
  const headers = ["Vendor ID", "Company", "Role", "Location", "Contact", "Email", "Phone", "GSTIN", "Bank", "IFSC", "Status", "Registered"];
  const rows = vendors.map((v) => [
    v.id,
    `"${v.companyName.replace(/"/g, '""')}"`,
    v.userRole,
    `"${v.location.replace(/"/g, '""')}"`,
    `"${v.contactName.replace(/"/g, '""')}"`,
    v.email,
    v.phone,
    v.gstNumber,
    `"${(v.bankName || '').replace(/"/g, '""')}"`,
    v.ifscCode || '',
    v.status,
    v.createdAt,
  ]);
  return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
}
