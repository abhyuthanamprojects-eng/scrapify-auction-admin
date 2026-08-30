import { useEffect, useState } from "react";

export type VendorStatus = "Pending" | "Approved" | "Rejected" | "Suspended";

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
  kind: "License" | "GST Certificate" | "PAN Card" | "Cancelled Cheque";
  fileName: string;
  sizeKb: number;
  uploadedAt: string;
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
  companyName: string;
  location: string;
  contactName: string;
  email: string;
  phone: string;
  gstNumber: string;
  materialInterest: MaterialCategory[];
  licenseNumber: string;
  status: VendorStatus;
  createdAt: string;
  rejectionReason?: string;
  suspensionReason?: string;
  documents: VendorDocument[];
  participation: AuctionParticipation[];
};

const KEY = "admin.vendors.v1";
const EVT = "admin:vendors";

function doc(id: string, kind: VendorDocument["kind"], fileName: string, sizeKb: number): VendorDocument {
  return { id, kind, name: kind, fileName, sizeKb, uploadedAt: "2026-07-20T10:00:00Z" };
}

function seed(): Vendor[] {
  return [
    {
      id: "V-1042",
      companyName: "Meridian Metals Pvt Ltd",
      location: "Pune, MH",
      contactName: "Rahul Deshmukh",
      email: "rahul@meridianmetals.in",
      phone: "+91 98220 11223",
      gstNumber: "27AABCM1234N1Z5",
      materialInterest: ["Ferrous", "Non-Ferrous"],
      licenseNumber: "MPCB/PUN/2025/0421",
      status: "Pending",
      createdAt: "2026-07-24T09:12:00Z",
      documents: [
        doc("d1", "License", "mpcb-license.pdf", 420),
        doc("d2", "GST Certificate", "gst-cert.pdf", 210),
        doc("d3", "PAN Card", "pan.jpg", 88),
        doc("d4", "Cancelled Cheque", "cheque.jpg", 96),
      ],
      participation: [],
    },
    {
      id: "V-1051",
      companyName: "Coastal Recyclers LLP",
      location: "Kandla, GJ",
      contactName: "Nisha Patel",
      email: "nisha@coastalrecyclers.co",
      phone: "+91 98980 44112",
      gstNumber: "24AAFFC1234Q1Z2",
      materialInterest: ["E-Waste", "Plastic"],
      licenseNumber: "GPCB/KND/2025/0187",
      status: "Pending",
      createdAt: "2026-07-25T02:30:00Z",
      documents: [
        doc("d1", "License", "gpcb-license.pdf", 512),
        doc("d2", "GST Certificate", "gst.pdf", 245),
        doc("d3", "PAN Card", "pan.pdf", 102),
        doc("d4", "Cancelled Cheque", "cheque.pdf", 118),
      ],
      participation: [],
    },
    {
      id: "V-1060",
      companyName: "Deccan E-Waste Solutions",
      location: "Hyderabad, TS",
      contactName: "K. Srinivas",
      email: "srinivas@deccanewaste.in",
      phone: "+91 90000 51122",
      gstNumber: "36AABCD5678L1Z9",
      materialInterest: ["E-Waste"],
      licenseNumber: "TSPCB/HYD/2025/0902",
      status: "Pending",
      createdAt: "2026-07-25T06:45:00Z",
      documents: [
        doc("d1", "License", "tspcb-license.pdf", 380),
        doc("d2", "GST Certificate", "gst.pdf", 205),
        doc("d3", "PAN Card", "pan.jpg", 74),
        doc("d4", "Cancelled Cheque", "cheque.jpg", 90),
      ],
      participation: [],
    },
    {
      id: "V-0904",
      companyName: "Novus Alloys Pvt Ltd",
      location: "Faridabad, HR",
      contactName: "Ankit Bansal",
      email: "ankit@novusalloys.com",
      phone: "+91 98111 33445",
      gstNumber: "06AAECN7788M1Z6",
      materialInterest: ["Ferrous", "Non-Ferrous"],
      licenseNumber: "HSPCB/FBD/2024/1102",
      status: "Approved",
      createdAt: "2026-05-14T11:20:00Z",
      documents: [
        doc("d1", "License", "hspcb-license.pdf", 466),
        doc("d2", "GST Certificate", "gst.pdf", 219),
        doc("d3", "PAN Card", "pan.jpg", 82),
        doc("d4", "Cancelled Cheque", "cheque.jpg", 91),
      ],
      participation: [
        { id: "p1", auction: "AUC-2026-0021 — Populated PCBs", date: "2026-07-14", bids: 8, won: true, amountInr: 1_820_000 },
        { id: "p2", auction: "AUC-2026-0018 — HMS Bundles", date: "2026-07-02", bids: 12, won: false, amountInr: 0 },
        { id: "p3", auction: "AUC-2026-0015 — Copper Wire Scrap", date: "2026-06-24", bids: 5, won: true, amountInr: 940_000 },
      ],
    },
    {
      id: "V-0987",
      companyName: "Vaayu Recyclers",
      location: "Bengaluru, KA",
      contactName: "Priya Menon",
      email: "priya@vaayurecyclers.in",
      phone: "+91 99000 22334",
      gstNumber: "29AAECV6543P1Z1",
      materialInterest: ["Paper", "Plastic", "Rubber"],
      licenseNumber: "KSPCB/BLR/2025/0234",
      status: "Approved",
      createdAt: "2026-06-02T08:00:00Z",
      documents: [
        doc("d1", "License", "kspcb-license.pdf", 402),
        doc("d2", "GST Certificate", "gst.pdf", 231),
        doc("d3", "PAN Card", "pan.jpg", 76),
        doc("d4", "Cancelled Cheque", "cheque.jpg", 88),
      ],
      participation: [
        { id: "p1", auction: "AUC-2026-0025 — HMS Bundles", date: "2026-07-20", bids: 6, won: false, amountInr: 0 },
      ],
    },
    {
      id: "V-0788",
      companyName: "Everblue Traders",
      location: "Vizag, AP",
      contactName: "M. Sudhakar",
      email: "sudhakar@everbluetraders.in",
      phone: "+91 90101 44556",
      gstNumber: "37AAECE1234K1ZA",
      materialInterest: ["Ferrous"],
      licenseNumber: "APPCB/VZG/2024/0765",
      status: "Rejected",
      createdAt: "2026-07-10T09:00:00Z",
      rejectionReason: "Incomplete KYC — PAN card copy illegible; license expired 2024-12.",
      documents: [
        doc("d1", "License", "appcb-license.pdf", 344),
        doc("d2", "GST Certificate", "gst.pdf", 198),
        doc("d3", "PAN Card", "pan.jpg", 60),
        doc("d4", "Cancelled Cheque", "cheque.jpg", 82),
      ],
      participation: [],
    },
    {
      id: "V-0655",
      companyName: "Prime Scrap Co.",
      location: "Ludhiana, PB",
      contactName: "Harpreet Singh",
      email: "harpreet@primescrap.co",
      phone: "+91 98150 88221",
      gstNumber: "03AAKCP4321H1Z7",
      materialInterest: ["Ferrous", "Non-Ferrous"],
      licenseNumber: "PPCB/LDH/2024/0088",
      status: "Suspended",
      createdAt: "2026-04-18T09:00:00Z",
      suspensionReason: "Compliance flag — repeated payment defaults on AUC-2026-0011.",
      documents: [
        doc("d1", "License", "ppcb-license.pdf", 360),
        doc("d2", "GST Certificate", "gst.pdf", 214),
        doc("d3", "PAN Card", "pan.jpg", 79),
        doc("d4", "Cancelled Cheque", "cheque.jpg", 84),
      ],
      participation: [
        { id: "p1", auction: "AUC-2026-0011 — Aluminium UBC", date: "2026-05-10", bids: 4, won: true, amountInr: 620_000 },
      ],
    },
  ];
}

function read(): Vendor[] {
  if (typeof window === "undefined") return seed();
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) {
      const s = seed();
      window.localStorage.setItem(KEY, JSON.stringify(s));
      return s;
    }
    return JSON.parse(raw) as Vendor[];
  } catch {
    return seed();
  }
}

function write(v: Vendor[]) {
  window.localStorage.setItem(KEY, JSON.stringify(v));
  window.dispatchEvent(new CustomEvent(EVT));
}

export function listVendors(): Vendor[] {
  return read();
}

export function getVendor(id: string): Vendor | undefined {
  return read().find((v) => v.id === id);
}

export function updateVendor(id: string, patch: Partial<Vendor>) {
  const all = read();
  const idx = all.findIndex((v) => v.id === id);
  if (idx < 0) return;
  all[idx] = { ...all[idx], ...patch };
  write(all);
}

export function useVendors(): Vendor[] {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  useEffect(() => {
    setVendors(read());
    const onChange = () => setVendors(read());
    window.addEventListener(EVT, onChange);
    return () => window.removeEventListener(EVT, onChange);
  }, []);
  return vendors;
}

export function vendorStatusTone(s: VendorStatus): { bg: string; text: string; ring: string; dot: string } {
  switch (s) {
    case "Approved":
      return { bg: "bg-emerald-50", text: "text-emerald-700", ring: "ring-emerald-200", dot: "bg-emerald-500" };
    case "Rejected":
      return { bg: "bg-red-50", text: "text-red-700", ring: "ring-red-200", dot: "bg-red-500" };
    case "Suspended":
      return { bg: "bg-amber-50", text: "text-amber-700", ring: "ring-amber-200", dot: "bg-amber-500" };
    default:
      return { bg: "bg-accent/10", text: "text-accent", ring: "ring-accent/30", dot: "bg-accent" };
  }
}

export function vendorsToCSV(vendors: Vendor[]): string {
  const headers = [
    "ID",
    "Company Name",
    "Location",
    "Contact Name",
    "Email",
    "Phone",
    "GST Number",
    "License Number",
    "Material Interest",
    "Status",
    "Created",
  ];
  const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const rows = vendors.map((v) =>
    [
      v.id,
      v.companyName,
      v.location,
      v.contactName,
      v.email,
      v.phone,
      v.gstNumber,
      v.licenseNumber,
      v.materialInterest.join(" | "),
      v.status,
      new Date(v.createdAt).toISOString(),
    ]
      .map(escape)
      .join(","),
  );
  return [headers.map(escape).join(","), ...rows].join("\n");
}