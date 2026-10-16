import { useCallback, useEffect, useRef, useState } from "react";
import { adminApi } from "./api-client";

export type VendorStatus = "Pending" | "Approved" | "Rejected" | "Suspended" | "Draft";

export type MaterialCategory =
  "Ferrous" | "Non-Ferrous" | "E-Waste" | "Paper" | "Plastic" | "Rubber";
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
  available?: boolean;
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

export type RegistrationPayment = {
  method?: string | null;
  reference?: string | null;
  status: "success" | "pending" | "failed" | "not_started" | string;
  amount?: number | null;
  baseAmount?: number | null;
  discountAmount?: number | null;
  offerCode?: string | null;
  offerDescription?: string | null;
  gateway?: string | null;
  paidAt?: string | null;
  proofUrl?: string | null;
  transactionId?: string | null;
  verificationReference?: string | null;
  submittedAt?: string | null;
  verifiedAt?: string | null;
  rejectionReason?: string | null;
};

export type Vendor = {
  id: string;
  code: string;
  userId?: number;
  userRole: "buyer" | "seller";
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
  registeredEmail?: string;
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
  registrationPayment: RegistrationPayment;
};

function asArray(value: unknown): any[] {
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== "object") return [];
  const record = value as Record<string, unknown>;
  for (const key of ["data", "items", "results", "vendors", "documents", "participation"]) {
    if (Array.isArray(record[key])) return record[key] as any[];
  }
  return [];
}

function normalizeStatus(value: unknown): VendorStatus {
  const raw = String(value ?? "pending").trim().toLowerCase().replace(/[-_ ]+/g, "");
  if (raw === "approved") return "Approved";
  if (raw === "rejected") return "Rejected";
  if (raw === "suspended") return "Suspended";
  if (raw === "draft") return "Draft";
  return "Pending";
}

/** Map a single vendor from the Laravel API snake_case shape to the front-end camelCase Vendor type. */
function mapVendor(v: any): Vendor {
  const source = v && typeof v === "object" ? v : {};
  const status = normalizeStatus(source.status);
  const materials = asArray(source.materials ?? source.material_interest);
  const documents = asArray(source.documents);
  const participation = asArray(source.participation);
  return {
    id: String(source.code ?? source.id ?? ""),
    code: String(source.code ?? source.id ?? ""),
    userId: Number.isFinite(Number(source.user_id ?? source.user?.id))
      ? Number(source.user_id ?? source.user?.id)
      : undefined,
    userRole: String(source.user_role ?? source.user?.role ?? source.role).toLowerCase() === "seller" ? "seller" : "buyer",
    companyName: source.company_name ?? source.companyName ?? "",
    tradeName: source.trade_name ?? source.tradeName ?? "",
    businessType: source.business_type ?? source.businessType ?? "",
    cinNumber: source.cin_number ?? source.cinNumber ?? "",
    turnoverBand: source.turnover_band ?? source.turnoverBand ?? "",
    yearsInBusiness: source.years_in_business ?? source.yearsInBusiness ?? "",
    annualCapacity: source.annual_capacity ?? source.annualCapacity ?? "",

    location: source.location ?? (source.city && source.state ? `${source.city}, ${source.state}` : ""),
    address: source.address ?? "",
    addressLine1: source.address_line1 ?? source.addressLine1 ?? source.address ?? "",
    city: source.city ?? "",
    state: source.state ?? "",
    pincode: source.pincode ?? "",
    operatingStates: asArray(source.operating_states ?? source.operatingStates),

    contactName: source.contact_name ?? source.contactName ?? "",
    email: source.email ?? "",
    registeredEmail: source.registered_email ?? source.registeredEmail ?? source.user?.email ?? source.email ?? "",
    phone: source.phone ?? "",

    gstNumber: source.gst_number ?? source.gstNumber ?? "",
    gstStatus: source.gst_status ?? source.gstStatus ?? "",
    panNumber: source.pan_number ?? source.panNumber ?? "",
    panStatus: source.pan_status ?? source.panStatus ?? "",
    licenseNumber: source.license_number ?? source.licenseNumber ?? "",

    bankName: source.bank_name ?? source.bankName ?? "",
    accountNumber: source.account_number ?? source.accountNumber ?? "",
    ifscCode: source.ifsc_code ?? source.ifscCode ?? "",
    accountHolderName: source.account_holder_name ?? source.accountHolderName ?? "",
    branchName: source.branch_name ?? source.branchName ?? "",
    accountType: source.account_type ?? source.accountType ?? "",
    bankStatus: source.bank_status ?? source.bankStatus ?? "",

    signatoryName: source.signatory_name ?? source.signatoryName ?? "",
    signatoryDesignation: source.signatory_designation ?? source.signatoryDesignation ?? "",
    signatoryEmail: source.signatory_email ?? source.signatoryEmail ?? "",
    signatoryPhone: source.signatory_phone ?? source.signatoryPhone ?? "",

    materialInterest: materials.map((m: any) =>
      typeof m === "string" ? m : m.name,
    ),
    status,
    canBid: typeof source.can_bid === "boolean" ? source.can_bid : Boolean(source.canBid),
    createdAt: source.created_at ?? source.createdAt ?? "",
    submittedAt: source.submitted_at ?? source.submittedAt,
    approvedAt: source.approved_at ?? source.approvedAt,
    rejectionReason: source.rejection_reason ?? source.rejectionReason,
    rejectionItems: asArray(source.rejection_items ?? source.rejectionItems),
    suspensionReason: source.suspension_reason ?? source.suspensionReason,
    documents: documents.map((d: any) => ({
      id: String(d.id),
      key: d.key ?? d.doc_key,
      name: d.name ?? d.kind ?? "",
      kind: d.kind ?? "KYC Document",
      fileName: d.file_name ?? d.fileName ?? "",
      available: d.available !== false,
      sizeKb: d.size_kb ?? d.sizeKb ?? 0,
      uploadedAt: d.uploaded_at ?? d.uploadedAt ?? "",
      // Missing status is not proof of verification. Treat legacy/incomplete
      // payloads as pending so a reviewer cannot approve on an ambiguous row.
      status: d.status ?? "pending",
      reason: d.reason ?? "",
      ocrStatus: d.ocr_status ?? d.ocrStatus,
      ocrConfidence: d.ocr_confidence ?? d.ocrConfidence,
      ocrExtractedData: d.ocr_extracted_data ?? d.ocrExtractedData,
      approvedOn: d.approved_on ?? d.approvedOn,
    })),
    participation: participation.map((p: any) => ({
      id: String(p.id),
      auction: p.auction ?? "",
      date: p.date ?? "",
      bids: p.bids ?? 0,
      won: !!p.won,
      amountInr: p.amount_inr ?? p.amountInr ?? 0,
    })),
    registrationPayment: {
      method: source.registration_payment?.method ?? source.registrationPayment?.method ?? null,
      reference: source.registration_payment?.reference ?? source.registrationPayment?.reference ?? null,
      status: source.registration_payment?.status ?? source.registrationPayment?.status ?? "not_started",
      amount: source.registration_payment?.amount ?? source.registrationPayment?.amount ?? null,
      baseAmount: source.registration_payment?.base_amount ?? source.registrationPayment?.baseAmount ?? null,
      discountAmount: source.registration_payment?.discount_amount ?? source.registrationPayment?.discountAmount ?? null,
      offerCode: source.registration_payment?.offer_code ?? source.registrationPayment?.offerCode ?? null,
      offerDescription: source.registration_payment?.offer_description ?? source.registrationPayment?.offerDescription ?? null,
      gateway: source.registration_payment?.gateway ?? source.registrationPayment?.gateway ?? null,
      paidAt: source.registration_payment?.paid_at ?? source.registrationPayment?.paidAt ?? null,
      proofUrl: source.registration_payment?.proof_url ?? source.registrationPayment?.proofUrl ?? null,
      transactionId: source.registration_payment?.transaction_id ?? source.registrationPayment?.transactionId ?? null,
      verificationReference: source.registration_payment?.verification_reference ?? source.registrationPayment?.verificationReference ?? null,
      submittedAt: source.registration_payment?.submitted_at ?? source.registrationPayment?.submittedAt ?? null,
      verifiedAt: source.registration_payment?.verified_at ?? source.registrationPayment?.verifiedAt ?? null,
      rejectionReason: source.registration_payment?.rejection_reason ?? source.registrationPayment?.rejectionReason ?? null,
    },
  };
}

/* ------------------------------------------------------------------ */
/*  API-backed fetching                                                */
/* ------------------------------------------------------------------ */

export async function fetchVendors(params: Record<string, any> = {}): Promise<Vendor[]> {
  const res = await adminApi.getVendors(params);
  const payload = Array.isArray(res) ? res : ((res as any).data ?? res);
  const list = Array.isArray(payload)
    ? payload
    : (payload?.vendors ?? payload?.items ?? payload?.data ?? []);
  return asArray(list).map(mapVendor);
}

export async function fetchVendorById(id: string): Promise<Vendor | null> {
  const res = await adminApi.getVendor(id);
  const data = (res as any).data ?? res;
  const record = data && typeof data === "object" ? data as Record<string, unknown> : {};
  return mapVendor(record.vendor ?? record.item ?? data);
}

export async function approveVendorApi(
  id: string,
  data: { documents_verified: boolean; verification_remarks?: string } = { documents_verified: true },
): Promise<void> {
  await adminApi.approveVendor(id, data);
}

export async function rejectVendorApi(id: string, reason: string): Promise<void> {
  await adminApi.rejectVendor(id, reason);
}

export async function suspendVendorApi(id: string, reason: string): Promise<void> {
  await adminApi.suspendVendor(id, reason);
}

export async function reviewVendorDocumentApi(
  vendorCode: string,
  docId: string,
  status: "approved" | "rejected",
  reason?: string,
): Promise<void> {
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
  const hasLoaded = useRef(false);

  const load = useCallback(async () => {
    if (!id) return;
    if (!hasLoaded.current) setLoading(true);
    setError(null);
    try {
      const v = await fetchVendorById(id);
      setVendor(v);
      hasLoaded.current = true;
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
  const headers = [
    "Vendor ID",
    "Company",
    "Role",
    "Location",
    "Contact",
    "Email",
    "Phone",
    "GSTIN",
    "Bank",
    "IFSC",
    "Status",
    "Registered",
  ];
  const rows = vendors.map((v) => [
    v.id,
    `"${v.companyName.replace(/"/g, '""')}"`,
    v.userRole,
    `"${v.location.replace(/"/g, '""')}"`,
    `"${v.contactName.replace(/"/g, '""')}"`,
    v.email,
    v.phone,
    v.gstNumber,
    `"${(v.bankName || "").replace(/"/g, '""')}"`,
    v.ifscCode || "",
    v.status,
    v.createdAt,
  ]);
  return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
}
