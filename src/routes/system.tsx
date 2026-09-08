import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/admin/page-header";
import { Section } from "@/components/ops/ops-ui";
import { AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/system")({
  head: () => ({ meta: [{ title: "System Health — Scrapify Auctions" }] }),
  component: SystemHealthPage,
});

function SystemHealthPage() {
  return (
    <>
      <PageHeader title="System Health & Infrastructure Monitor" description="System health is shown only when the monitoring API provides an authoritative response." />
      <Section title="Monitoring data unavailable" description="No local service health, uptime, latency, queue, or compliance metrics are embedded in the console.">
        <div className="flex items-start gap-3 p-6 text-sm text-muted-foreground">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
          <p>Connect the monitoring API to view live service and worker status. No demo metrics are displayed.</p>
        </div>
      </Section>
    </>
  );
}
