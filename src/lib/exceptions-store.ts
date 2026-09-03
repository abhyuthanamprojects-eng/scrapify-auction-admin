import { useEffect, useState } from "react";
import { adminApi } from "./api-client";

export interface Exception {
  id: string;
  kind: string;
  entity: string;
  eventId: string;
  severity: "low" | "medium" | "high" | "critical";
  raisedAt: string;
  owner: string;
  recommended: string;
  status: "Open" | "Resolved" | "Escalated";
}

export function useExceptions(): Exception[] {
  const [exceptions, setExceptions] = useState<Exception[]>([]);

  useEffect(() => {
    const fetchExceptions = async () => {
      try {
        // Fetch auctions to derive exceptions
        const auctions = await adminApi.listAuctions();
        const exc: Exception[] = [];

        (auctions as any[]).forEach((a: any) => {
          // Low bids exception
          if (!a.bids_count || a.bids_count < 2) {
            exc.push({
              id: `EXC-${a.code}-LOW-BIDS`,
              kind: "Low Competition",
              entity: a.code,
              eventId: a.code,
              severity: a.bids_count === 0 ? "critical" : "high",
              raisedAt: a.published_at || a.created_at,
              owner: "System",
              recommended: "Extend bidding window or reduce reserve price",
              status: "Open",
            });
          }

          // Below reserve exception
          if (a.current_price && a.reserve_price && a.current_price < a.reserve_price * 0.9) {
            exc.push({
              id: `EXC-${a.code}-BELOW-RESERVE`,
              kind: "Below Reserve",
              entity: a.code,
              eventId: a.code,
              severity: "high",
              raisedAt: a.published_at || a.created_at,
              owner: "System",
              recommended: "Consider accepting bid or rejecting auction",
              status: "Open",
            });
          }
        });

        setExceptions(exc);
      } catch (error) {
        console.error("Failed to fetch exceptions:", error);
        setExceptions([]);
      }
    };
    fetchExceptions();
  }, []);

  return exceptions;
}
