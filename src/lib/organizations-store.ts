import { useEffect, useState } from "react";

export type OrgStatus = "Draft" | "Pending Super Admin Approval" | "Approved" | "Rejected";

export type UnitBank = {
  accountNumber: string;
  ifsc: string;
  bankName: string;
};

export type Unit = {
  id: string;
  name: string;
  gst: string;
  location: string;
  bank: UnitBank;
};

export type OrgDocument = {
  id: string;
  type: string;
  fileName: string;
  uploadedAt: string; // ISO
};

export const ORG_DOCUMENT_TYPES = [
  "GST Certificate",
  "PAN Card",
  "Cancelled Cheque",
  "Certificate of Incorporation",
  "Authorisation Letter",
] as const;

export type Organization = {
  id: string;
  companyName: string;
  location: string;
  totalUnits: number;
  units: Unit[];
  status: OrgStatus;
  createdAt: string; // ISO
  rejectionReason?: string;
  bank?: UnitBank;
  documents?: OrgDocument[];
};

const KEY = "admin.organizations.v1";
const EVT = "admin:organizations";

function seed(): Organization[] {
  return [
    {
      id: "ORG-0001",
      companyName: "Meridian Metals Pvt Ltd",
      location: "Plot 42, MIDC Industrial Area, Pune, MH",
      totalUnits: 2,
      status: "Approved",
      createdAt: "2026-06-14T10:20:00Z",
      bank: { accountNumber: "50100234500001", ifsc: "HDFC0000123", bankName: "HDFC Bank — Corporate" },
      documents: [
        { id: "D-1", type: "GST Certificate", fileName: "meridian-gst.pdf", uploadedAt: "2026-06-14T10:22:00Z" },
        { id: "D-2", type: "PAN Card", fileName: "meridian-pan.pdf", uploadedAt: "2026-06-14T10:23:00Z" },
        { id: "D-3", type: "Cancelled Cheque", fileName: "meridian-cheque.jpg", uploadedAt: "2026-06-14T10:24:00Z" },
      ],
      units: [
        {
          id: "U-1",
          name: "Pune HQ",
          gst: "27AABCM1234N1Z5",
          location: "Pune, MH",
          bank: { accountNumber: "50100234567890", ifsc: "HDFC0001234", bankName: "HDFC Bank" },
        },
        {
          id: "U-2",
          name: "Nashik Yard",
          gst: "27AABCM1234N2Z4",
          location: "Nashik, MH",
          bank: { accountNumber: "50100234567891", ifsc: "HDFC0001235", bankName: "HDFC Bank" },
        },
      ],
    },
    {
      id: "ORG-0002",
      companyName: "Southern Railway — Salem Div.",
      location: "Salem Divisional Office, Salem, TN",
      totalUnits: 1,
      status: "Pending Super Admin Approval",
      createdAt: "2026-07-24T14:05:00Z",
      bank: { accountNumber: "31245678900000", ifsc: "SBIN0000456", bankName: "State Bank of India" },
      documents: [
        { id: "D-1", type: "GST Certificate", fileName: "salem-gst.pdf", uploadedAt: "2026-07-24T14:07:00Z" },
      ],
      units: [
        {
          id: "U-1",
          name: "Salem Depot",
          gst: "33AAACS1234R1ZP",
          location: "Salem, TN",
          bank: { accountNumber: "31245678901", ifsc: "SBIN0000456", bankName: "State Bank of India" },
        },
      ],
    },
    {
      id: "ORG-0003",
      companyName: "Coastal Recyclers LLP",
      location: "Kandla SEZ, Gujarat",
      totalUnits: 3,
      status: "Draft",
      createdAt: "2026-07-25T02:30:00Z",
      units: [],
    },
    {
      id: "ORG-0004",
      companyName: "Everblue Traders",
      location: "Vizag Port Rd, AP",
      totalUnits: 1,
      status: "Rejected",
      createdAt: "2026-07-10T09:00:00Z",
      rejectionReason: "Incomplete KYC documentation for the primary unit.",
      units: [
        {
          id: "U-1",
          name: "Vizag Yard",
          gst: "37AAECE1234K1ZA",
          location: "Vizag, AP",
          bank: { accountNumber: "998877665544", ifsc: "ICIC0004321", bankName: "ICICI Bank" },
        },
      ],
    },
  ];
}

function read(): Organization[] {
  if (typeof window === "undefined") return seed();
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) {
      const s = seed();
      window.localStorage.setItem(KEY, JSON.stringify(s));
      return s;
    }
    return JSON.parse(raw) as Organization[];
  } catch {
    return seed();
  }
}

function write(orgs: Organization[]) {
  window.localStorage.setItem(KEY, JSON.stringify(orgs));
  window.dispatchEvent(new CustomEvent(EVT));
}

export function listOrganizations(): Organization[] {
  return read();
}

export function getOrganization(id: string): Organization | undefined {
  return read().find((o) => o.id === id);
}

export function upsertOrganization(org: Organization) {
  const all = read();
  const idx = all.findIndex((o) => o.id === org.id);
  if (idx >= 0) all[idx] = org;
  else all.unshift(org);
  write(all);
}

export function updateStatus(id: string, status: OrgStatus, reason?: string) {
  const all = read();
  const idx = all.findIndex((o) => o.id === id);
  if (idx < 0) return;
  all[idx] = { ...all[idx], status, rejectionReason: reason };
  write(all);
}

export function newOrgId() {
  const all = read();
  const nums = all
    .map((o) => parseInt(o.id.replace(/\D/g, ""), 10))
    .filter((n) => !Number.isNaN(n));
  const next = (nums.length ? Math.max(...nums) : 0) + 1;
  return `ORG-${String(next).padStart(4, "0")}`;
}

export function useOrganizations(): Organization[] {
  const [orgs, setOrgs] = useState<Organization[]>([]);
  useEffect(() => {
    setOrgs(read());
    const onChange = () => setOrgs(read());
    window.addEventListener(EVT, onChange);
    return () => window.removeEventListener(EVT, onChange);
  }, []);
  return orgs;
}

export function isUnitComplete(u: Unit): boolean {
  return Boolean(
    u.name.trim() &&
      u.gst.trim() &&
      u.location.trim() &&
      u.bank.accountNumber.trim() &&
      u.bank.ifsc.trim() &&
      u.bank.bankName.trim(),
  );
}

export function isOrgComplete(o: Organization): boolean {
  if (!o.companyName.trim() || !o.location.trim() || o.totalUnits < 1) return false;
  if (o.units.length !== o.totalUnits) return false;
  return o.units.every(isUnitComplete);
}

export function statusTone(s: OrgStatus): { bg: string; text: string; ring: string; dot: string } {
  switch (s) {
    case "Approved":
      return { bg: "bg-emerald-50", text: "text-emerald-700", ring: "ring-emerald-200", dot: "bg-emerald-500" };
    case "Rejected":
      return { bg: "bg-red-50", text: "text-red-700", ring: "ring-red-200", dot: "bg-red-500" };
    case "Pending Super Admin Approval":
      return { bg: "bg-accent/10", text: "text-accent", ring: "ring-accent/30", dot: "bg-accent" };
    default:
      return { bg: "bg-muted", text: "text-muted-foreground", ring: "ring-border", dot: "bg-muted-foreground/60" };
  }
}