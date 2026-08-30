import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { Auction } from "./auctions-store";

const NAVY: [number, number, number] = [31, 50, 81];
const ORANGE: [number, number, number] = [230, 81, 0];
const GST_PCT = 18;
const TCS_PCT = 1;
const STA_PCT = 3;
const EMD_PCT = 10;

const n = (v: number) => Math.round(v).toLocaleString("en-IN");
const dt = (s?: string) =>
  s ? new Date(s).toLocaleString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }).replace(",", "") : "—";

export function generateH1Report(auction: Auction) {
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();

  doc.setFillColor(...NAVY);
  doc.rect(0, 0, W, 58, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text(auction.company, 32, 26);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("H1 Summary Report", 32, 44);
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
      ["Company Name :", auction.company, "Auction ID/Reference", auction.id],
      ["Material Description", `${auction.title} / ${auction.location}`, "Department/ Unit", `${auction.plant} — ${auction.warehouse}`],
      ["Start Date and Time :", dt(auction.scheduleStart), "End Date And Time :", dt(auction.scheduleEnd)],
    ],
  });

  const lots = auction.subLots.length
    ? auction.subLots
    : [{ id: "L-1", name: auction.title, quantity: "1 Lot", reservePriceInr: auction.reservePriceInr, currentBidInr: auction.currentHighestInr }];

  const rows = lots.map((l, i) => {
    const h1Bid = l.currentBidInr ?? auction.finalPriceInr ?? auction.currentHighestInr ?? 0;
    const topBid = [...auction.bids].filter((b) => !b.subLotId || b.subLotId === l.id).sort((a, b) => b.amountInr - a.amountInr)[0];
    const closing = h1Bid;
    const emd = (auction.reservePriceInr * EMD_PCT) / 100;
    const gst = (closing * GST_PCT) / 100;
    const tcs = (closing * TCS_PCT) / 100;
    const total = closing + gst + tcs;
    const sold = closing >= l.reservePriceInr && closing > 0;
    return [
      String(i + 1), String(i + 1), l.name, auction.location, l.quantity,
      n(auction.startingPriceInr), n(l.reservePriceInr), `${STA_PCT}`,
      n(h1Bid), topBid?.vendorName ?? auction.winner ?? "—",
      topBid ? `${topBid.vendorName.toLowerCase().replace(/[^a-z]+/g, ".")}@vendor.in` : "—",
      sold ? "Sold" : "Unsold", n(closing), n(emd), `${GST_PCT}`, n(gst), `${TCS_PCT}`, n(tcs), n(total), n(total - emd),
    ];
  });

  autoTable(doc, {
    startY: (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 16,
    theme: "grid",
    head: [[
      "Sr. No.", "Lot No.", "Item Name", "Location", "Qty/UOM", "Starting Price", "Reserve Price", "STA (%)",
      "H1 Bid", "H1 Bidder Name", "H1 Bidder email ID", "Status", "Total Closing Price", "Hold EMD amount of H1 bidder",
      "GST (%)", "GST Amount", "TCS (%)", "TCS Amount", "Total amount along with the applicable GST & TCS",
      "Balance amount after deducting the EMD",
    ]],
    body: rows,
    styles: { fontSize: 6.5, cellPadding: 3, lineColor: [222, 218, 208], overflow: "linebreak" },
    headStyles: { fillColor: NAVY, textColor: [255, 255, 255], fontSize: 6.5, fontStyle: "bold", halign: "center", valign: "middle" },
    bodyStyles: { textColor: [30, 30, 30] },
    alternateRowStyles: { fillColor: [250, 249, 245] },
    columnStyles: Object.fromEntries([5, 6, 8, 12, 13, 15, 17, 18, 19].map((i) => [i, { halign: "right" as const }])),
    didParseCell: (d) => {
      if (d.section === "body" && d.column.index === 11) {
        d.cell.styles.textColor = d.cell.raw === "Sold" ? [46, 125, 50] : ORANGE;
        d.cell.styles.fontStyle = "bold";
      }
    },
  });

  doc.setFontSize(7.5);
  doc.setTextColor(120, 120, 120);
  doc.text("Developed and designed by Devzign Technology · devzign.com", 32, doc.internal.pageSize.getHeight() - 18);

  doc.save(`H1-Summary-Report-${auction.id}.pdf`);
}