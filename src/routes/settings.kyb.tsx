import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ShieldCheck, Save, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { adminApi } from "@/lib/api-client";

export const Route = createFileRoute("/settings/kyb")({
  component: KybSettingsPage,
});

function KybSettingsPage() {
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const [kybGstVerification, setKybGstVerification] = useState(true);
  const [kybPanVerification, setKybPanVerification] = useState(true);
  const [kybBankVerification, setKybBankVerification] = useState(true);
  const [kybIdentityVerification, setKybIdentityVerification] = useState(false);
  const [kybDocumentUpload, setKybDocumentUpload] = useState(true);
  const [kybNameMatchThreshold, setKybNameMatchThreshold] = useState("70");
  const [kybAutoApprove, setKybAutoApprove] = useState(false);

  useEffect(() => {
    adminApi
      .getPlatformConfig()
      .then((response) => {
        const config = response?.data ?? response;
        if (config?.kyb_gst_verification !== undefined) setKybGstVerification(Boolean(config.kyb_gst_verification));
        if (config?.kyb_pan_verification !== undefined) setKybPanVerification(Boolean(config.kyb_pan_verification));
        if (config?.kyb_bank_verification !== undefined) setKybBankVerification(Boolean(config.kyb_bank_verification));
        if (config?.kyb_identity_verification !== undefined) setKybIdentityVerification(Boolean(config.kyb_identity_verification));
        if (config?.kyb_document_upload !== undefined) setKybDocumentUpload(Boolean(config.kyb_document_upload));
        if (config?.kyb_name_match_threshold !== undefined) setKybNameMatchThreshold(String(config.kyb_name_match_threshold));
        if (config?.kyb_auto_approve !== undefined) setKybAutoApprove(Boolean(config.kyb_auto_approve));
      })
      .catch(() => toast.error("Could not load business verification settings."))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    const threshold = Number(kybNameMatchThreshold);
    if (!Number.isFinite(threshold) || threshold < 0 || threshold > 100) {
      toast.error("Name-match threshold must be between 0 and 100.");
      return;
    }
    setSaving(true);
    try {
      await adminApi.updatePlatformConfig({
        kyb_gst_verification: kybGstVerification,
        kyb_pan_verification: kybPanVerification,
        kyb_bank_verification: kybBankVerification,
        kyb_identity_verification: kybIdentityVerification,
        kyb_document_upload: kybDocumentUpload,
        kyb_name_match_threshold: threshold,
        kyb_auto_approve: kybAutoApprove,
      });
      setSaved(true);
      toast.success("Business verification settings saved.");
      setTimeout(() => setSaved(false), 2500);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save settings.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="overflow-hidden rounded-2xl border-2 border-t-4 border-t-emerald-500 border-border/70 bg-card shadow-[0_4px_14px_rgba(15,23,42,0.08)]">
      <CardHeader className="bg-emerald-50/80 pb-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-emerald-600" />
          <CardTitle className="text-base">Business Verification (KYB) Gates</CardTitle>
        </div>
        <CardDescription>Control which verification steps are required before a vendor account is approved.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : (
          <>
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div><Label>GST Verification</Label><p className="text-xs text-muted-foreground">Require live GSTIN verification via Sandbox provider.</p></div>
                <Switch checked={kybGstVerification} onCheckedChange={setKybGstVerification} />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div><Label>PAN Verification</Label><p className="text-xs text-muted-foreground">Require PAN identity check (name, DOB match).</p></div>
                <Switch checked={kybPanVerification} onCheckedChange={setKybPanVerification} />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div><Label>Bank Account Verification</Label><p className="text-xs text-muted-foreground">Require penny-drop or IFSC verification.</p></div>
                <Switch checked={kybBankVerification} onCheckedChange={setKybBankVerification} />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div><Label>Identity Verification (DigiLocker)</Label><p className="text-xs text-muted-foreground">Require Aadhaar-linked identity verification via DigiLocker.</p></div>
                <Switch checked={kybIdentityVerification} onCheckedChange={setKybIdentityVerification} />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div><Label>Document Upload Required</Label><p className="text-xs text-muted-foreground">Require supporting document uploads (GST certificate, PAN card, etc.).</p></div>
                <Switch checked={kybDocumentUpload} onCheckedChange={setKybDocumentUpload} />
              </div>
            </div>
            <div className="space-y-3 border-t pt-4">
              <div className="space-y-1.5">
                <Label>Name-Match Threshold (%)</Label>
                <Input type="number" min={0} max={100} value={kybNameMatchThreshold} onChange={(e) => setKybNameMatchThreshold(e.target.value)} />
                <p className="text-xs text-muted-foreground">Minimum similarity score (0–100) for cross-document name matching (PAN vs GST vs bank). Lower values are more lenient.</p>
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div><Label>Auto-Approve on All Gates Passed</Label><p className="text-xs text-muted-foreground">Automatically approve vendor accounts when all enabled verification gates pass. Disable to always require manual admin review.</p></div>
                <Switch checked={kybAutoApprove} onCheckedChange={setKybAutoApprove} />
              </div>
            </div>
            <div className="flex justify-end border-t pt-4">
              <Button onClick={handleSave} disabled={saving || loading} className="gap-2 bg-emerald-600 text-white hover:bg-emerald-700">
                {saved ? <CheckCircle2 className="h-4 w-4" /> : <Save className="h-4 w-4" />}
                {saved ? "Saved" : "Save KYB Settings"}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
