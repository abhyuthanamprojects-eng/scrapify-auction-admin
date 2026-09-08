import { useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/control-room")({
  head: () => ({
    meta: [
      { title: "Live Control Room — Scrapify Operations Console" },
      { name: "description", content: "Authoritative live-auction supervision." },
    ],
  }),
  component: ControlRoomRedirect,
});

function ControlRoomRedirect() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate({ to: "/auctions/live", replace: true });
  }, [navigate]);

  return <div className="card-premium p-12 text-center text-muted-foreground">Opening authoritative Live Control…</div>;
}
