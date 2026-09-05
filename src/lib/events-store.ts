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
          kind: a.kind || "Forward Auction",
          template: a.template || "Auction",
          customerName: a.customer?.company_name || "Unknown",
          category: a.category || "General",
          direction: (a.direction || "Forward") as "Forward" | "Reverse",
          status: a.status || "Draft",
          currentPrice: a.current_price || a.reserve_price || 0,
          participants: (a.participants || []).map((p: any) => ({ name: p.vendor_name })),
          bidCount: a.bids_count || 0,
          risk: calculateRisk(a),
          startAt: a.published_at || a.created_at,
          endAt: a.closed_at || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          createdAt: a.created_at,
          owner: a.customer?.company_name || "System",
          value: a.final_price || a.current_price || a.reserve_price || 0,
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

function calculateRisk(auction: any): "low" | "medium" | "high" {
  if (!auction.bids_count || auction.bids_count < 2) return "high";
  if (auction.current_price < auction.reserve_price * 0.8) return "high";
  if (auction.current_price < auction.reserve_price * 0.95) return "medium";
  return "low";
}
