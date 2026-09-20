import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Globe, Save, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { adminApi } from "@/lib/api-client";

export const Route = createFileRoute("/settings/platform")({
  component: PlatformSettingsPage,
});

function PlatformSettingsPage() {
  const [saved, setSaved] = useState(false);
  const [apiUrl, setApiUrl] = useState("https://api.scrapifyauctions.com/api/v1");
  const [wsUrl, setWsUrl] = useState("wss://api.scrapifyauctions.com/app");
  const [vendorRegistrationFee, setVendorRegistrationFee] = useState("5000");
  const [webRegistrationFeeRequired, setWebRegistrationFeeRequired] = useState(true);
  const [mobileRegistrationFeeRequired, setMobileRegistrationFeeRequired] = useState(false);
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
  const [mobileMinVersion, setMobileMinVersion] = useState("1.0.0");
  const [mobileLatestVersion, setMobileLatestVersion] = useState("1.0.0");
  const [mobileForceUpdate, setMobileForceUpdate] = useState(false);
  const [mobileUpdateUrl, setMobileUpdateUrl] = useState("");
  const [mobileUpdateNotes, setMobileUpdateNotes] = useState("");
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [savingConfig, setSavingConfig] = useState(false);

  useEffect(() => {
    adminApi
      .getPlatformConfig()
      .then((response) => {
        const config = response?.data ?? response;
        if (config?.vendor_registration_fee !== undefined) setVendorRegistrationFee(String(config.vendor_registration_fee));
        if (config?.web_registration_fee_required !== undefined) setWebRegistrationFeeRequired(Boolean(config.web_registration_fee_required));
        if (config?.mobile_registration_fee_required !== undefined) setMobileRegistrationFeeRequired(Boolean(config.mobile_registration_fee_required));
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
        if (config?.mobile_min_version) setMobileMinVersion(String(config.mobile_min_version));
        if (config?.mobile_latest_version) setMobileLatestVersion(String(config.mobile_latest_version));
        if (config?.mobile_force_update !== undefined) setMobileForceUpdate(Boolean(config.mobile_force_update));
        if (config?.mobile_update_url) setMobileUpdateUrl(String(config.mobile_update_url));
        if (config?.mobile_update_notes) setMobileUpdateNotes(String(config.mobile_update_notes));
      })
      .catch(() => toast.error("Could not load platform settings from the API."))
      .finally(() => setLoadingConfig(false));
  }, []);

  const handleSave = async () => {
    const registrationFee = Number(vendorRegistrationFee);
    const values = [
      registrationFee,
      Number(emdPercentage),
      Number(minimumParticipants),
      Number(initialSlotMinutes),
      Number(continuationSlotMinutes),
      Number(bidCutoffMs),
      Number(maximumAuctionDurationMinutes),
    ];
    if (values.some((value) => !Number.isFinite(value) || value < 0)) {
      toast.error("All numeric values must be non-negative numbers.");
      return;
    }
    setSavingConfig(true);
    try {
      await adminApi.updatePlatformConfig({
        vendor_registration_fee: registrationFee,
        web_registration_fee_required: webRegistrationFeeRequired,
        mobile_registration_fee_required: mobileRegistrationFeeRequired,
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
        mobile_min_version: mobileMinVersion,
        mobile_latest_version: mobileLatestVersion,
        mobile_force_update: mobileForceUpdate,
        mobile_update_url: mobileUpdateUrl,
        mobile_update_notes: mobileUpdateNotes,
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
    <Card className="overflow-hidden rounded-2xl border-2 border-t-4 border-t-[color:var(--navy)] border-border/70 bg-card shadow-[0_4px_14px_rgba(15,23,42,0.08)]">
      <CardHeader className="bg-[color:var(--navy)] pb-3 text-white">
        <div className="flex items-center gap-2">
          <Globe className="h-5 w-5 text-orange-300" />
          <CardTitle className="text-base">Backend API & Reverb Cluster</CardTitle>
        </div>
        <CardDescription className="text-white/70">
          Configure Laravel REST and WebSocket cluster endpoints.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 pt-4">
        <div className="space-y-1.5">
          <Label htmlFor="api-url" className="text-xs font-medium">REST API Base URL</Label>
          <Input id="api-url" value={apiUrl} onChange={(e) => setApiUrl(e.target.value)} placeholder="https://api.scrapifyauctions.com/api/v1" className="font-mono text-sm" />
        </div>
        <div className="space-y-1.5 border-t pt-4">
          <Label htmlFor="vendor-registration-fee" className="text-xs font-medium">Vendor Registration Fee (INR)</Label>
          <Input id="vendor-registration-fee" type="number" min={0} step="0.01" value={vendorRegistrationFee} onChange={(e) => setVendorRegistrationFee(e.target.value)} disabled={loadingConfig} className="text-sm font-mono" />
          <p className="text-xs text-muted-foreground">Server-authoritative one-time fee. The value in .env is only the initial fallback.</p>
        </div>
        <div className="grid gap-3 border-t pt-4 md:grid-cols-2">
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <Label>Require web registration fee</Label>
              <p className="text-xs text-muted-foreground">Keep Razorpay payment required on the website.</p>
            </div>
            <Switch checked={webRegistrationFeeRequired} onCheckedChange={setWebRegistrationFeeRequired} disabled={loadingConfig} />
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <Label>Require mobile registration fee</Label>
              <p className="text-xs text-muted-foreground">Enable this when the mobile app is ready for paid registration.</p>
            </div>
            <Switch checked={mobileRegistrationFeeRequired} onCheckedChange={setMobileRegistrationFeeRequired} disabled={loadingConfig} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="emd-percentage" className="text-xs font-medium">EMD (%)</Label>
            <Input id="emd-percentage" type="number" min={0} max={100} step={0.1} value={emdPercentage} onChange={(e) => setEmdPercentage(e.target.value)} disabled={loadingConfig} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="minimum-participants" className="text-xs font-medium">Minimum Participants</Label>
            <Input id="minimum-participants" type="number" min={1} value={minimumParticipants} onChange={(e) => setMinimumParticipants(e.target.value)} disabled={loadingConfig} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="initial-slot" className="text-xs font-medium">Initial Slot (minutes)</Label>
            <Input id="initial-slot" type="number" min={1} value={initialSlotMinutes} onChange={(e) => setInitialSlotMinutes(e.target.value)} disabled={loadingConfig} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="continuation-slot" className="text-xs font-medium">Continuation Slot (minutes)</Label>
            <Input id="continuation-slot" type="number" min={1} value={continuationSlotMinutes} onChange={(e) => setContinuationSlotMinutes(e.target.value)} disabled={loadingConfig} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bid-cutoff" className="text-xs font-medium">Bid Cutoff (ms)</Label>
            <Input id="bid-cutoff" type="number" min={0} value={bidCutoffMs} onChange={(e) => setBidCutoffMs(e.target.value)} disabled={loadingConfig} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="max-duration" className="text-xs font-medium">Maximum Duration (minutes)</Label>
            <Input id="max-duration" type="number" min={1} value={maximumAuctionDurationMinutes} onChange={(e) => setMaximumAuctionDurationMinutes(e.target.value)} disabled={loadingConfig} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 border-t pt-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">RFQ Mode</Label>
            <select value={rfqMode} onChange={(e) => setRfqMode(e.target.value)} disabled={loadingConfig} className="h-10 w-full rounded-md border bg-background px-3 text-sm">
              <option value="DOCUMENT">Document</option>
              <option value="DISCOVERY_ROUND">Discovery Round</option>
              <option value="HYBRID">Hybrid</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">RFQ Benchmark</Label>
            <select value={rfqBenchmarkStrategy} onChange={(e) => setRfqBenchmarkStrategy(e.target.value)} disabled={loadingConfig} className="h-10 w-full rounded-md border bg-background px-3 text-sm">
              <option value="HIGHEST_VALID">Highest Valid</option>
              <option value="LOWEST_VALID">Lowest Valid</option>
              <option value="AVERAGE">Average</option>
              <option value="MEDIAN">Median</option>
              <option value="ADMIN_APPROVED">Admin Approved</option>
            </select>
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-xs font-medium">RFQ Required</Label>
            <Switch checked={rfqRequired} onCheckedChange={setRfqRequired} />
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-xs font-medium">EMD Required</Label>
            <Switch checked={emdRequired} onCheckedChange={setEmdRequired} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">EMD Type</Label>
            <select value={emdType} onChange={(e) => setEmdType(e.target.value)} disabled={loadingConfig} className="h-10 w-full rounded-md border bg-background px-3 text-sm">
              <option value="PERCENTAGE">Percentage</option>
              <option value="FIXED">Fixed Amount</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Fixed EMD (₹)</Label>
            <Input type="number" min={0} value={emdFixedAmount} onChange={(e) => setEmdFixedAmount(e.target.value)} disabled={loadingConfig} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ws-url" className="text-xs font-medium">WebSocket / Reverb Cluster URL</Label>
          <Input id="ws-url" value={wsUrl} onChange={(e) => setWsUrl(e.target.value)} placeholder="wss://api.scrapifyauctions.com/app" className="font-mono text-sm" />
        </div>
        <div className="space-y-3 border-t pt-4">
          <div>
            <h3 className="text-sm font-semibold">Mobile App Updates</h3>
            <p className="text-xs text-muted-foreground">Control the minimum supported version and update link returned to the mobile app.</p>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="space-y-1.5"><Label>Minimum supported version</Label><Input value={mobileMinVersion} onChange={(e) => setMobileMinVersion(e.target.value)} placeholder="1.0.0" /></div>
            <div className="space-y-1.5"><Label>Latest version</Label><Input value={mobileLatestVersion} onChange={(e) => setMobileLatestVersion(e.target.value)} placeholder="1.0.0" /></div>
            <div className="space-y-1.5 md:col-span-2"><Label>Update URL</Label><Input value={mobileUpdateUrl} onChange={(e) => setMobileUpdateUrl(e.target.value)} placeholder="https://play.google.com/store/apps/details?id=..." /></div>
            <div className="space-y-1.5 md:col-span-2"><Label>Release notes</Label><Input value={mobileUpdateNotes} onChange={(e) => setMobileUpdateNotes(e.target.value)} placeholder="What's new" /></div>
            <div className="flex items-center justify-between rounded-lg border p-3 md:col-span-2"><Label>Force update below minimum version</Label><Switch checked={mobileForceUpdate} onCheckedChange={setMobileForceUpdate} /></div>
          </div>
        </div>
        <div className="flex justify-end border-t pt-4">
          <Button onClick={handleSave} disabled={savingConfig || loadingConfig} className="gap-2 bg-[color:var(--navy)] text-white hover:brightness-110">
            {saved ? <CheckCircle2 className="h-4 w-4" /> : <Save className="h-4 w-4" />}
            {saved ? "Saved" : "Save Backend Settings"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
