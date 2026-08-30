import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { Auction } from "./auctions-store";

const NAVY: [number, number, number] = [31, 50, 81];

const n = (v: number) => Math.round(v).toLocaleString("en-IN");
const dt = (s?: string) =>
  s
    ? new Date(s)
        .toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false })
        .replace(",", "")
    : "—";
const dOnly = (s: string) => new Date(s).toLocaleDateString("en-GB");
const tOnly = (s: string) => new Date(s).toLocaleTimeString("en-GB", { hour12: false });

function alias(seed: string) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  let out = "";
  for (let i = 0; i < 8; i++) {
    h = (h * 1103515245 + 12345) >>> 0;
    out += chars[h % chars.length];
  }
  return out;
}

const email = (name: string) => `${name.toLowerCase().replace(/[^a-z]+/g, ".").replace(/^\.|\.$/g, "")}@vendor.in`;
const phone = (seed: string) => {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 33 + seed.charCodeAt(i)) >>> 0;
  return `9${String(h).padStart(9, "0").slice(0, 9)}`;
};
const gstNo = (seed: string) => `27${alias(seed).slice(0, 5)}1Z${alias(seed).slice(5, 6)}`;

function header(doc: jsPDF, auction: Auction, title: string) {
  const W = doc.internal.pageSize.getWidth();
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, W, 58, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text(auction.company, 32, 26);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(title, 32, 44);
  doc.text(`Report Generated on : ${dt(new Date().toISOString())}`, W - 32, 44, { align: "right" });

  autoTable(doc, {
    startY: 74,
    theme: "grid",
    styles: { fontSize: 8.5, cellPadding: 5, lineColor: [222, 218, 208], textColor: [30, 30, 30] },
    columnStyles: {
      0: { fontStyle: "bold", fillColor: [246, 244, 239], cellWidth: 140 },
      2: { fontStyle: "bold", fillColor: [246, 244, 239], cellWidth: 140 },
    },
    body: [
      ["Company Name :", auction.company, "Auction ID :", auction.id],
      ["Auction Ref. No. :", auction.title, "Department :", `${auction.plant} — ${auction.warehouse}`],
      ["Start Date and Time :", dt(auction.scheduleStart), "End Date And Time :", dt(auction.scheduleEnd)],
    ],
  });
}

function footer(doc: jsPDF) {
  doc.setFontSize(7.5);
  doc.setTextColor(120, 120, 120);
  doc.text("Developed and designed by Devzign Technology · devzign.com", 32, doc.internal.pageSize.getHeight() - 18);
}

const tableOpts = {
  theme: "grid" as const,
  styles: { fontSize: 7.5, cellPadding: 4, lineColor: [222, 218, 208] as [number, number, number], overflow: "linebreak" as const },
  headStyles: { fillColor: NAVY, textColor: [255, 255, 255] as [number, number, number], fontSize: 7.5, fontStyle: "bold" as const, halign: "center" as const, valign: "middle" as const },
  bodyStyles: { textColor: [30, 30, 30] as [number, number, number] },
  alternateRowStyles: { fillColor: [250, 249, 245] as [number, number, number] },
};

const nextY = (doc: jsPDF) => (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 16;

export function generateAllBidReport(auction: Auction) {
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  header(doc, auction, "All Bid Report");

  const bids = [...auction.bids].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
  const body = bids.map((b, i) => [
    String(i + 1),
    b.vendorName,
    alias(b.vendorId),
    phone(b.vendorId),
    email(b.vendorName),
    dOnly(b.at),
    tOnly(b.at),
    n(b.amountInr),
    `103.${(i * 7) % 255}.${(i * 13) % 255}.${(i * 29) % 255} / ${auction.location}`,
  ]);

  autoTable(doc, {
    ...tableOpts,
    startY: nextY(doc),
    head: [["Sr.No.", "Company Name", "Alias Name / Unique I'd", "Mobile No.", "Email ID", "Bid Date", "Bid Time", "Bid Price", "IP / Location"]],
    body: body.length ? body : [["—", "No bids recorded", "—", "—", "—", "—", "—", "—", "—"]],
    columnStyles: { 0: { halign: "center", cellWidth: 38 }, 7: { halign: "right" } },
  });

  footer(doc);
  doc.save(`All-Bid-Report-${auction.id}.pdf`);
}

export function generateAllBidderReport(auction: Auction) {
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  header(doc, auction, "All Bidder Report");

  const seen = new Map<string, string>();
  auction.bids.forEach((b) => { if (!seen.has(b.vendorId)) seen.set(b.vendorId, b.vendorName); });
  const [city, state] = auction.location.split(",").map((s) => s.trim());

  const body = [...seen.entries()].map(([id, name], i) => [
    String(i + 1),
    name,
    alias(id),
    phone(id),
    email(name),
    gstNo(id),
    `${name}, ${auction.location}`,
    state ?? "—",
    city ?? "—",
    `4${String(10000 + (i * 137) % 89999).slice(0, 5)}`,
  ]);

  autoTable(doc, {
    ...tableOpts,
    startY: nextY(doc),
    head: [["Sr.No.", "Company Name", "Alias Name / Unique I'd", "Mobile No.", "Email ID", "GST No.", "GST Address", "State", "City", "Pin Code"]],
    body: body.length ? body : [["—", "No bidders registered", "—", "—", "—", "—", "—", "—", "—", "—"]],
    columnStyles: { 0: { halign: "center", cellWidth: 38 } },
  });

  footer(doc);
  doc.save(`All-Bidder-Report-${auction.id}.pdf`);
}
