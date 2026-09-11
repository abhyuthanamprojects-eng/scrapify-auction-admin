import { useEffect, useState } from "react";
import { adminApi } from "./api-client";

export interface AuctionEvent {
  id: string;
  name: string;
  kind: string;
  template: string;
  customerName: string;
  category: string;
  direction: "Forward" | "Reverse";
  status: string;
  currentPrice: number;
  participants: Array<{ name: string }>;
  bidCount: number;
  risk: "low" | "medium" | "high";
  startAt: string;
  endAt: string;
  createdAt: string;
  owner: string;
  value: number;
}

export function useAuctionEvents(): AuctionEvent[] {
  const [events, setEvents] = useState<AuctionEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await adminApi.getAuctions();
        const auctions = response?.data ?? response;
        const mapped = (auctions as any[]).map((a: any) => ({
          id: a.code,
          name: a.title,
          kind: a.kind ?? "",
          template: a.template ?? "",
          customerName: a.customer?.company_name ?? "",
          category: a.category ?? "",
          direction: normalizeDirection(a.direction),
          status: normalizeStatus(a.status),
          currentPrice: a.current_highest_inr || a.reserve_price_inr || 0,
          participants: Array.from({ length: Number(a.bidders ?? a.bidders_count ?? 0) }, (_, index) => ({ name: `Bidder ${index + 1}` })),
          bidCount: a.bids_count || 0,
          risk: calculateRisk(a),
          startAt: a.published_at ?? a.schedule_start ?? a.created_at ?? "",
          endAt: a.schedule_end ?? a.closed_at ?? "",
          createdAt: a.created_at ?? "",
          owner: a.owner?.name ?? a.owner_name ?? "",
          value: a.final_price_inr || a.current_highest_inr || a.reserve_price_inr || 0,
        }));
        setEvents(mapped);
      } catch (error) {
        console.error("Failed to fetch auction events:", error);
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  return events;
}

function normalizeDirection(direction: unknown): "Forward" | "Reverse" {
  return String(direction ?? "").toLowerCase() === "reverse" ? "Reverse" : "Forward";
}

function normalizeStatus(status: unknown): string {
  const value = String(status ?? "").toLowerCase();
  const labels: Record<string, string> = {
    pending_approval: "Pending Approval",
    sent_back: "Sent Back",
    approved: "Approved",
    published: "Scheduled",
    scheduled: "Scheduled",
    live: "Live",
    closed: "Closed",
    cancelled: "Cancelled",
    draft: "Draft",
  };
  return labels[value] ?? value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function calculateRisk(auction: any): "low" | "medium" | "high" {
  if (!auction.bids_count || auction.bids_count < 2) return "high";
  if (auction.current_price < auction.reserve_price * 0.8) return "high";
  if (auction.current_price < auction.reserve_price * 0.95) return "medium";
  return "low";
}
