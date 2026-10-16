import { useCallback, useEffect, useState } from "react";
import { adminApi } from "@/lib/api-client";

export type OrgStatus = string;
export type UnitBank = { accountNumber?: string; ifsc?: string; bankName?: string };
export type Unit = { id: string; name: string; gst: string; location: string; bank: UnitBank };
export type OrgDocument = { id: string; type: string; fileName: string; uploadedAt: string; [key: string]: any };
export const ORG_DOCUMENT_TYPES = ["Certificate of Incorporation", "GST Certificate", "PAN", "Bank Proof"] as const;
export type Organization = {
  id: string; companyName: string; location: string; totalUnits: number; units: Unit[]; status: OrgStatus; createdAt: string;
  bank?: UnitBank; documents: OrgDocument[]; rejectionReason?: string; [key: string]: any;
};

function rows(payload: any): any[] {
  const data = payload?.data ?? payload;
  if (Array.isArray(data)) return data;
  return data?.items ?? data?.organizations ?? data?.data ?? [];
}

function mapOrganization(raw: any): Organization {
  const source = raw?.organization ?? raw ?? {};
  const units = Array.isArray(source.units) ? source.units : Array.isArray(source.operating_units) ? source.operating_units : [];
  const documents = Array.isArray(source.documents) ? source.documents : [];
  return {
    ...source,
    id: String(source.code ?? source.organization_code ?? source.id ?? ""),
    companyName: source.company_name ?? source.companyName ?? source.name ?? "",
    location: source.location ?? source.address ?? [source.city, source.state].filter(Boolean).join(", "),
    totalUnits: Number(source.total_units ?? source.totalUnits ?? units.length ?? 0),
    units: units.map((unit: any, index: number) => ({ ...unit, id: String(unit.code ?? unit.id ?? `U-${index + 1}`), name: unit.name ?? unit.unit_name ?? "", gst: unit.gst ?? unit.gstin ?? unit.gst_number ?? "", location: unit.location ?? unit.address ?? [unit.city, unit.state].filter(Boolean).join(", "), bank: unit.bank ?? { accountNumber: unit.account_number ?? "", ifsc: unit.ifsc ?? "", bankName: unit.bank_name ?? "" } })),
    status: source.status_label ?? source.status ?? "Pending",
    createdAt: source.created_at ?? source.createdAt ?? "",
    bank: source.bank ?? { accountNumber: source.account_number ?? "", ifsc: source.ifsc ?? "", bankName: source.bank_name ?? "" },
    documents: documents.map((doc: any, index: number) => ({ ...doc, id: String(doc.id ?? `D-${index + 1}`), type: doc.type ?? doc.kind ?? doc.name ?? "Document", fileName: doc.file_name ?? doc.fileName ?? doc.name ?? "", uploadedAt: doc.uploaded_at ?? doc.uploadedAt ?? "" })),
    rejectionReason: source.rejection_reason ?? source.rejectionReason,
  };
}

export async function fetchOrganizations(params: Record<string, any> = {}) { return rows(await adminApi.getOrganizations(params)).map(mapOrganization).filter((organization) => organization.id); }

export function useOrganizationsState() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const refetch = useCallback(async () => { setLoading(true); setError(null); try { setOrganizations(await fetchOrganizations()); } catch (cause) { setOrganizations([]); setError(cause instanceof Error ? cause.message : "Failed to load organizations."); } finally { setLoading(false); } }, []);
  useEffect(() => { void refetch(); }, [refetch]);
  return { organizations, loading, error, refetch };
}

export function useOrganizations(): Organization[] { return useOrganizationsState().organizations; }

export function useOrganization(id: string) {
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const refetch = useCallback(async () => { setLoading(true); setError(null); try { const found = (await fetchOrganizations()).find((item) => item.id === id); setOrganization(found ?? null); if (!found) setError("Organization not found."); } catch (cause) { setOrganization(null); setError(cause instanceof Error ? cause.message : "Failed to load organization."); } finally { setLoading(false); } }, [id]);
  useEffect(() => { void refetch(); }, [refetch]);
  return { organization, loading, error, refetch };
}

export function listOrganizations(): Organization[] { return []; }
export function getOrganization(_id: string): Organization | undefined { return undefined; }
export function upsertOrganization(_org: Organization) { return undefined; }
export function updateStatus(_id: string, _status: OrgStatus, _reason?: string) { return undefined; }
export function newOrgId() { return `ORG-${Date.now()}`; }
export function isUnitComplete(unit: Unit) { return Boolean(unit.name.trim() && unit.gst.trim() && unit.location.trim() && unit.bank?.bankName?.trim() && unit.bank?.accountNumber?.trim() && unit.bank?.ifsc?.trim()); }
export function isOrgComplete(org: Organization) { return Boolean(org.companyName.trim() && org.location.trim() && org.totalUnits > 0 && org.units.length === org.totalUnits && org.units.every(isUnitComplete)); }
export function statusTone(status: OrgStatus) { if (["Approved", "approved", "Active"].includes(status)) return { bg: "bg-emerald-50", text: "text-emerald-700", ring: "ring-emerald-200", dot: "bg-emerald-500" }; if (["Rejected", "rejected", "Suspended"].includes(status)) return { bg: "bg-red-50", text: "text-red-700", ring: "ring-red-200", dot: "bg-red-500" }; return { bg: "bg-accent/10", text: "text-accent", ring: "ring-accent/30", dot: "bg-accent" }; }
