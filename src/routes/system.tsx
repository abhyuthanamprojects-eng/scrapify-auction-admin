import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Activity,
  Server,
  Zap,
  Radio,
  Bell,
  Wallet,
  FileCheck2,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  ShieldCheck,
} from "lucide-react";
import { DataTable, Section, StatCard, StatusPill, type Column } from "@/components/ops/ops-ui";

export const Route = createFileRoute("/system")({
  head: () => ({
    meta: [
      { title: "System Health & Operational Status — Scrapify Auctions" },
      {
        name: "description",
        content:
          "Real-time operational monitoring of WebSocket bidding engine, OCR pipelines, notification workers, payment webhooks and background jobs.",
      },
      { property: "og:title", content: "System Health | Scrapify Auctions" },
      {
        property: "og:description",
        content: "Platform availability, background job queues and integration status.",
      },
    ],
  }),
  component: SystemHealthPage,
});

type ServiceHealth = {
  id: string;
  name: string;
  category: "Core Engine" | "Integrations" | "Async Workers";
  latencyMs: number;
  uptimePct: string;
  status: "Operational" | "Degraded" | "Outage";
  lastChecked: string;
};

type BackgroundJob = {
  id: string;
  jobName: string;
  queue: string;
  attempts: number;
  lastRun: string;
  status: "Completed" | "Retrying" | "Failed";
  errorDetails?: string;
};

const SERVICES: ServiceHealth[] = [
  { id: "svc-1", name: "Live Auction WebSocket Cluster", category: "Core Engine", latencyMs: 14, uptimePct: "99.99%", status: "Operational", lastChecked: "5s ago" },
  { id: "svc-2", name: "Anti-Sniping Clock & Timer Engine", category: "Core Engine", latencyMs: 8, uptimePct: "100.00%", status: "Operational", lastChecked: "2s ago" },
  { id: "svc-3", name: "PostgreSQL Primary & Read Replicas", category: "Core Engine", latencyMs: 12, uptimePct: "99.98%", status: "Operational", lastChecked: "10s ago" },
  { id: "svc-4", name: "Payment Gateway & Webhook Ingestion", category: "Integrations", latencyMs: 85, uptimePct: "99.95%", status: "Operational", lastChecked: "15s ago" },
  { id: "svc-5", name: "KYB Document OCR Extraction Pipeline", category: "Integrations", latencyMs: 240, uptimePct: "99.80%", status: "Operational", lastChecked: "30s ago" },
  { id: "svc-6", name: "Multi-Channel Notification Dispatcher", category: "Async Workers", latencyMs: 45, uptimePct: "99.92%", status: "Operational", lastChecked: "12s ago" },
  { id: "svc-7", name: "Post-Auction Decision Pack Generator", category: "Async Workers", latencyMs: 180, uptimePct: "99.90%", status: "Operational", lastChecked: "40s ago" },
];

const JOBS: BackgroundJob[] = [
  { id: "JOB-9941", jobName: "settlement.tax_computation", queue: "finance", attempts: 1, lastRun: "2 mins ago", status: "Completed" },
  { id: "JOB-9940", jobName: "kyb.ocr_pan_verification", queue: "compliance", attempts: 1, lastRun: "5 mins ago", status: "Completed" },
  { id: "JOB-9939", jobName: "auction.overtime_extension_sync", queue: "realtime", attempts: 1, lastRun: "8 mins ago", status: "Completed" },
  { id: "JOB-9938", jobName: "webhook.bank_penny_drop_callback", queue: "payments", attempts: 2, lastRun: "14 mins ago", status: "Completed" },
  { id: "JOB-9937", jobName: "notifications.sms_outbid_broadcast", queue: "notifications", attempts: 3, lastRun: "22 mins ago", status: "Retrying", errorDetails: "SMS gateway provider timeout on +9198200XXXXX" },
];

function SystemHealthPage() {
  const [services, setServices] = useState<ServiceHealth[]>(SERVICES);
  const [jobs, setJobs] = useState<BackgroundJob[]>(JOBS);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      toast.success("All service health checks verified. 0 critical outages.");
    }, 600);
  };

  const serviceColumns: Column<ServiceHealth>[] = [
    { key: "name", header: "Service Component", render: (s) => <span className="font-bold text-foreground">{s.name}</span>, sortValue: (s) => s.name },
    { key: "cat", header: "Tier", render: (s) => <span className="rounded bg-muted px-2 py-0.5 text-xs font-semibold">{s.category}</span> },
    {
      key: "lat",
      header: "Latency",
      render: (s) => (
        <span className={`font-mono text-xs font-bold ${s.latencyMs < 50 ? "text-success" : "text-accent"}`}>
          {s.latencyMs} ms
        </span>
      ),
      sortValue: (s) => s.latencyMs,
    },
    { key: "uptime", header: "30-Day Uptime", render: (s) => <span className="font-mono text-xs font-semibold">{s.uptimePct}</span> },
    {
      key: "status",
      header: "Health Status",
      render: (s) => (
        <span className="inline-flex items-center gap-1 text-xs font-bold text-success">
          <CheckCircle2 className="h-3.5 w-3.5" /> {s.status}
        </span>
      ),
    },
    { key: "check", header: "Last Heartbeat", render: (s) => <span className="text-xs text-muted-foreground">{s.lastChecked}</span> },
  ];

  const jobColumns: Column<BackgroundJob>[] = [
    { key: "id", header: "Job ID", render: (j) => <span className="font-mono text-xs text-muted-foreground">{j.id}</span> },
    { key: "name", header: "Handler", render: (j) => <span className="font-mono text-xs font-bold text-foreground">{j.jobName}</span>, sortValue: (j) => j.jobName },
    { key: "queue", header: "Queue", render: (j) => <span className="text-xs text-muted-foreground capitalize">{j.queue}</span> },
    { key: "attempts", header: "Attempts", render: (j) => <span className="font-mono text-xs">{j.attempts}</span> },
    { key: "last", header: "Last Executed", render: (j) => <span className="text-xs text-muted-foreground">{j.lastRun}</span> },
    { key: "status", header: "Outcome", render: (j) => <StatusPill value={j.status} /> },
    {
      key: "actions",
      header: "",
      render: (j) =>
        j.status === "Retrying" ? (
          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => toast.success(`Job ${j.id} queued for immediate retry.`)}>
            Retry Now
          </Button>
        ) : null,
    },
  ];

  return (
    <>
      <PageHeader
        title="System Health & Infrastructure Monitor"
        description="Real-time operational dashboard for WebSocket clusters, background workers, payment gateways, and OCR pipelines."
        actions={
          <Button size="sm" variant="outline" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-1.5 ${refreshing ? "animate-spin" : ""}`} /> Run Heartbeat Check
          </Button>
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Live Services" value="7 / 7 Online" tone="live" icon={Server} />
        <StatCard label="Avg Bidding Latency" value="14 ms" icon={Zap} />
        <StatCard label="Job Queue Throughput" value="1,840 / hr" icon={Activity} />
        <StatCard label="Security Node State" value="SOC2 Compliant" icon={ShieldCheck} />
      </div>

      <div className="space-y-6">
        <Section title="Operational Services & Cluster Health" description="Heartbeat metrics and response latencies across core microservices and external gateways.">
          <DataTable data={services} columns={serviceColumns} searchPlaceholder="Search service component or category..." />
        </Section>

        <Section title="Background Job Queues & Worker Activity" description="Asynchronous task processing for settlement computations, document OCR, and SMS outbid broadcasts.">
          <DataTable data={jobs} columns={jobColumns} searchPlaceholder="Search background jobs or queues..." />
        </Section>
      </div>
    </>
  );
}
