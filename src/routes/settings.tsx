import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/admin/page-header";
import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Globe,
  Lock,
  Mail,
  CreditCard,
  Bell,
  ShieldCheck,
  Save,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { adminApi } from "@/lib/api-client";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Platform Settings — Scrapify Auctions Admin" },
      { name: "description", content: "Platform configuration, security policies, payment gateways, and notification settings." },
      { property: "og:title", content: "Platform Settings — Scrapify Auctions Admin" },
      { property: "og:description", content: "Platform configuration, security policies, payment gateways, and notification settings." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const [saved, setSaved] = useState(false);
  const [apiUrl, setApiUrl] = useState("https://api.scrapifyauctions.com/api/v1");
  const [wsUrl, setWsUrl] = useState("wss://api.scrapifyauctions.com/app");
  const [antiSnipeWindow, setAntiSnipeWindow] = useState("180");
  const [antiSnipeExtension, setAntiSnipeExtension] = useState("180");
  const [mfaMandatory, setMfaMandatory] = useState(true);
  const [autoForfeitEmd, setAutoForfeitEmd] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(true);
  const [whatsappAlerts, setWhatsappAlerts] = useState(true);
  const [auctionEditLockHours, setAuctionEditLockHours] = useState("3");
  const [emdPercentage, setEmdPercentage] = useState("10");
  const [minimumParticipants, setMinimumParticipants] = useState("3");
  const [initialSlotMinutes, setInitialSlotMinutes] = useState("30");
  const [continuationSlotMinutes, setContinuationSlotMinutes] = useState("2");
  const [bidCutoffMs, setBidCutoffMs] = useState("500");
  const [maximumAuctionDurationMinutes, setMaximumAuctionDurationMinutes] = useState("120");
  const [rfqRequired, setRfqRequired] = useState(false);
  const [rfqMode, setRfqMode] = useState("DOCUMENT");
  const [rfqBenchmarkStrategy, setRfqBenchmarkStrategy] = useState("HIGHEST_VALID");
  const [emdRequired, setEmdRequired] = useState(true);
  const [emdType, setEmdType] = useState("PERCENTAGE");
  const [emdFixedAmount, setEmdFixedAmount] = useState("0");
  const [sellerKybRequired, setSellerKybRequired] = useState(true);
  const [participantKybRequired, setParticipantKybRequired] = useState(true);
  const [kybAutoMatch, setKybAutoMatch] = useState("85");
  const [kybReviewMatch, setKybReviewMatch] = useState("60");
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [savingConfig, setSavingConfig] = useState(false);

  useEffect(() => {
    adminApi.getPlatformConfig()
      .then((response) => {
        const config = response?.data ?? response;
        if (config?.auction_edit_lock_hours !== undefined) {
          setAuctionEditLockHours(String(config.auction_edit_lock_hours));
        }
        if (config?.emd_percentage !== undefined) setEmdPercentage(String(config.emd_percentage));
        if (config?.minimum_participants !== undefined) setMinimumParticipants(String(config.minimum_participants));
        if (config?.initial_slot_minutes !== undefined) setInitialSlotMinutes(String(config.initial_slot_minutes));
        if (config?.continuation_slot_minutes !== undefined) setContinuationSlotMinutes(String(config.continuation_slot_minutes));
        if (config?.bid_cutoff_ms !== undefined) setBidCutoffMs(String(config.bid_cutoff_ms));
        if (config?.maximum_auction_duration_minutes !== undefined) setMaximumAuctionDurationMinutes(String(config.maximum_auction_duration_minutes));
        if (config?.rfq_required !== undefined) setRfqRequired(Boolean(config.rfq_required));
        if (config?.rfq_mode) setRfqMode(config.rfq_mode);
        if (config?.rfq_benchmark_strategy) setRfqBenchmarkStrategy(config.rfq_benchmark_strategy);
        if (config?.emd_required !== undefined) setEmdRequired(Boolean(config.emd_required));
        if (config?.emd_type) setEmdType(config.emd_type);
        if (config?.emd_fixed_amount !== undefined) setEmdFixedAmount(String(config.emd_fixed_amount));
        if (config?.seller_kyb_required !== undefined) setSellerKybRequired(Boolean(config.seller_kyb_required));
        if (config?.participant_kyb_required !== undefined) setParticipantKybRequired(Boolean(config.participant_kyb_required));
        if (config?.kyb_auto_approve_match_score !== undefined) setKybAutoMatch(String(config.kyb_auto_approve_match_score));
        if (config?.kyb_review_match_score !== undefined) setKybReviewMatch(String(config.kyb_review_match_score));
      })
      .catch(() => toast.error("Could not load platform settings from the API."))
      .finally(() => setLoadingConfig(false));
  }, []);

  const handleSave = async () => {
    const hours = Number(auctionEditLockHours);
    const values = [Number(emdPercentage), Number(minimumParticipants), Number(initialSlotMinutes), Number(continuationSlotMinutes), Number(bidCutoffMs), Number(maximumAuctionDurationMinutes)];
    if (!Number.isInteger(hours) || hours < 0 || hours > 168 || values.some((value) => !Number.isFinite(value) || value < 0)) {
      toast.error("Auction edit lock must be a whole number between 0 and 168 hours.");
      return;
    }

    setSavingConfig(true);
    try {
      await adminApi.updatePlatformConfig({
        auction_edit_lock_hours: hours,
        emd_percentage: Number(emdPercentage),
        minimum_participants: Number(minimumParticipants),
        initial_slot_minutes: Number(initialSlotMinutes),
        continuation_slot_minutes: Number(continuationSlotMinutes),
        bid_cutoff_ms: Number(bidCutoffMs),
        maximum_auction_duration_minutes: Number(maximumAuctionDurationMinutes),
        rfq_required: rfqRequired,
        rfq_mode: rfqMode,
        rfq_benchmark_strategy: rfqBenchmarkStrategy,
        emd_required: emdRequired,
        emd_type: emdType,
        emd_fixed_amount: Number(emdFixedAmount),
        seller_kyb_required: sellerKybRequired,
        participant_kyb_required: participantKybRequired,
        kyb_auto_approve_match_score: Number(kybAutoMatch),
        kyb_review_match_score: Number(kybReviewMatch),
      });
      setSaved(true);
      toast.success("Platform settings saved and synchronized with Laravel backend.");
      setTimeout(() => setSaved(false), 2500);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save platform settings.");
    } finally {
      setSavingConfig(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Platform Settings & Governance"
          description="Configure global API connectivity, anti-sniping timers, payment escrow parameters, and security policies."
        />
        <Button onClick={handleSave} disabled={savingConfig || loadingConfig} className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
          {saved ? <CheckCircle2 className="h-4 w-4" /> : <Save className="h-4 w-4" />}
          {saved ? "Saved" : "Save Changes"}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Backend & API Connectivity */}
        <Card className="border-border">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-emerald-600" />
              <CardTitle className="text-base">Backend API & Reverb Cluster</CardTitle>
            </div>
            <CardDescription>Configure Laravel REST and WebSocket cluster endpoints.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="api-url" className="text-xs font-medium">REST API Base URL</Label>
              <Input
                id="api-url"
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                placeholder="https://api.scrapifyauctions.com/api/v1"
                className="font-mono text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label htmlFor="emd-percentage" className="text-xs font-medium">EMD (%)</Label><Input id="emd-percentage" type="number" min={0} max={100} step={0.1} value={emdPercentage} onChange={(e) => setEmdPercentage(e.target.value)} disabled={loadingConfig} /></div>
              <div className="space-y-1.5"><Label htmlFor="minimum-participants" className="text-xs font-medium">Minimum Participants</Label><Input id="minimum-participants" type="number" min={1} value={minimumParticipants} onChange={(e) => setMinimumParticipants(e.target.value)} disabled={loadingConfig} /></div>
              <div className="space-y-1.5"><Label htmlFor="initial-slot" className="text-xs font-medium">Initial Slot (minutes)</Label><Input id="initial-slot" type="number" min={1} value={initialSlotMinutes} onChange={(e) => setInitialSlotMinutes(e.target.value)} disabled={loadingConfig} /></div>
              <div className="space-y-1.5"><Label htmlFor="continuation-slot" className="text-xs font-medium">Continuation Slot (minutes)</Label><Input id="continuation-slot" type="number" min={1} value={continuationSlotMinutes} onChange={(e) => setContinuationSlotMinutes(e.target.value)} disabled={loadingConfig} /></div>
              <div className="space-y-1.5"><Label htmlFor="bid-cutoff" className="text-xs font-medium">Bid Cutoff (ms)</Label><Input id="bid-cutoff" type="number" min={0} value={bidCutoffMs} onChange={(e) => setBidCutoffMs(e.target.value)} disabled={loadingConfig} /></div>
              <div className="space-y-1.5"><Label htmlFor="max-duration" className="text-xs font-medium">Maximum Duration (minutes)</Label><Input id="max-duration" type="number" min={1} value={maximumAuctionDurationMinutes} onChange={(e) => setMaximumAuctionDurationMinutes(e.target.value)} disabled={loadingConfig} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3 border-t pt-3">
              <div className="space-y-1.5"><Label className="text-xs font-medium">RFQ Mode</Label><select value={rfqMode} onChange={(e) => setRfqMode(e.target.value)} disabled={loadingConfig} className="h-10 w-full rounded-md border bg-background px-3 text-sm"><option value="DOCUMENT">Document</option><option value="DISCOVERY_ROUND">Discovery Round</option><option value="HYBRID">Hybrid</option></select></div>
              <div className="space-y-1.5"><Label className="text-xs font-medium">RFQ Benchmark</Label><select value={rfqBenchmarkStrategy} onChange={(e) => setRfqBenchmarkStrategy(e.target.value)} disabled={loadingConfig} className="h-10 w-full rounded-md border bg-background px-3 text-sm"><option value="HIGHEST_VALID">Highest Valid</option><option value="LOWEST_VALID">Lowest Valid</option><option value="AVERAGE">Average</option><option value="MEDIAN">Median</option><option value="ADMIN_APPROVED">Admin Approved</option></select></div>
              <div className="flex items-center justify-between"><Label className="text-xs font-medium">RFQ Required</Label><Switch checked={rfqRequired} onCheckedChange={setRfqRequired} /></div>
              <div className="flex items-center justify-between"><Label className="text-xs font-medium">EMD Required</Label><Switch checked={emdRequired} onCheckedChange={setEmdRequired} /></div>
              <div className="space-y-1.5"><Label className="text-xs font-medium">EMD Type</Label><select value={emdType} onChange={(e) => setEmdType(e.target.value)} disabled={loadingConfig} className="h-10 w-full rounded-md border bg-background px-3 text-sm"><option value="PERCENTAGE">Percentage</option><option value="FIXED">Fixed Amount</option></select></div>
              <div className="space-y-1.5"><Label className="text-xs font-medium">Fixed EMD (₹)</Label><Input type="number" min={0} value={emdFixedAmount} onChange={(e) => setEmdFixedAmount(e.target.value)} disabled={loadingConfig} /></div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ws-url" className="text-xs font-medium">WebSocket / Reverb Cluster URL</Label>
              <Input
                id="ws-url"
                value={wsUrl}
                onChange={(e) => setWsUrl(e.target.value)}
                placeholder="wss://api.scrapifyauctions.com/app"
                className="font-mono text-sm"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader><div className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-emerald-600" /><CardTitle className="text-base">Business Verification (KYB)</CardTitle></div><CardDescription>Global gates and name-match thresholds used by the Laravel auction eligibility service.</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between"><Label className="text-sm">Require KYB for sellers</Label><Switch checked={sellerKybRequired} onCheckedChange={setSellerKybRequired} /></div>
            <div className="flex items-center justify-between"><Label className="text-sm">Require KYB for participants</Label><Switch checked={participantKybRequired} onCheckedChange={setParticipantKybRequired} /></div>
            <div className="grid grid-cols-2 gap-3"><div className="space-y-1.5"><Label className="text-xs">Auto-approve name score</Label><Input type="number" min={0} max={100} value={kybAutoMatch} onChange={(e) => setKybAutoMatch(e.target.value)} /></div><div className="space-y-1.5"><Label className="text-xs">Review name score</Label><Input type="number" min={0} max={100} value={kybReviewMatch} onChange={(e) => setKybReviewMatch(e.target.value)} /></div></div>
          </CardContent>
        </Card>

        {/* Live Auction Engine Rules */}
        <Card className="border-border">
          <CardHeader>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
              <CardTitle className="text-base">Live Auction & Anti-Sniping</CardTitle>
            </div>
            <CardDescription>Timing thresholds enforced by backend transaction locks.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="auction-edit-lock" className="text-xs font-medium">Auction Edit Lock (hours)</Label>
              <Input
                id="auction-edit-lock"
                type="number"
                min={0}
                max={168}
                step={1}
                value={auctionEditLockHours}
                onChange={(e) => setAuctionEditLockHours(e.target.value)}
                disabled={loadingConfig}
                className="text-sm font-mono"
              />
              <p className="text-xs text-muted-foreground">Sellers can edit an auction until this many hours before it starts. Maximum: 168 hours.</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="anti-snipe-win" className="text-xs font-medium">Trigger Window (seconds)</Label>
                <Input
                  id="anti-snipe-win"
                  type="number"
                  value={antiSnipeWindow}
                  onChange={(e) => setAntiSnipeWindow(e.target.value)}
                  className="text-sm font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="anti-snipe-ext" className="text-xs font-medium">Extension Duration (seconds)</Label>
                <Input
                  id="anti-snipe-ext"
                  type="number"
                  value={antiSnipeExtension}
                  onChange={(e) => setAntiSnipeExtension(e.target.value)}
                  className="text-sm font-mono"
                />
              </div>
            </div>
            <div className="flex items-center justify-between pt-2 border-t">
              <div>
                <p className="text-sm font-medium">Auto-Forfeit EMD on Winner Default</p>
                <p className="text-xs text-muted-foreground">Trigger escrow forfeiture when acceptance window expires</p>
              </div>
              <Switch checked={autoForfeitEmd} onCheckedChange={setAutoForfeitEmd} />
            </div>
          </CardContent>
        </Card>

        {/* Security & Access Policies */}
        <Card className="border-border">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-emerald-600" />
              <CardTitle className="text-base">Security & Authentication</CardTitle>
            </div>
            <CardDescription>Platform-wide session and MFA enforcement policies.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Mandatory MFA for Staff & Admin</p>
                <p className="text-xs text-muted-foreground">Require OTP / Authenticator app on every staff login</p>
              </div>
              <Switch checked={mfaMandatory} onCheckedChange={setMfaMandatory} />
            </div>
            <div className="space-y-1.5 pt-2 border-t">
              <Label className="text-xs font-medium">Admin Session Inactivity Timeout</Label>
              <Input defaultValue="30 minutes" className="text-sm" />
            </div>
          </CardContent>
        </Card>

        {/* Notification Gateways */}
        <Card className="border-border">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-emerald-600" />
              <CardTitle className="text-base">Broadcast & Notification Channels</CardTitle>
            </div>
            <CardDescription>Real-time outbid and auction status delivery options.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Transactional Email (SES / SendGrid)</span>
              </div>
              <Switch checked={emailAlerts} onCheckedChange={setEmailAlerts} />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">SMS Outbid Alerts (Twilio / Gupshup)</span>
              </div>
              <Switch checked={smsAlerts} onCheckedChange={setSmsAlerts} />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">WhatsApp Business Notifications</span>
              </div>
              <Switch checked={whatsappAlerts} onCheckedChange={setWhatsappAlerts} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
