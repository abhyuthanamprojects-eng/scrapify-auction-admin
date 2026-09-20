import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { KeyRound } from "lucide-react";
import { toast } from "sonner";
import { adminApi } from "@/lib/api-client";

export const Route = createFileRoute("/settings/integrations")({
  component: IntegrationsSettingsPage,
});

function IntegrationsSettingsPage() {
  const [integrationSettings, setIntegrationSettings] = useState<any>(null);
  const [integrationSecrets, setIntegrationSecrets] = useState<Record<string, string>>({});
  const [integrationSaving, setIntegrationSaving] = useState(false);
  const [verificationTestGstin, setVerificationTestGstin] = useState("");
  const [verificationTestPan, setVerificationTestPan] = useState("");
  const [verificationTestName, setVerificationTestName] = useState("");
  const [verificationTestDob, setVerificationTestDob] = useState("");
  const [verificationTestBankAccount, setVerificationTestBankAccount] = useState("");
  const [verificationTestIfsc, setVerificationTestIfsc] = useState("");
  const [verificationTesting, setVerificationTesting] = useState<string | null>(null);

  useEffect(() => {
    adminApi.getIntegrationSettings()
      .then((response) => setIntegrationSettings(response?.data ?? response))
      .catch(() => toast.error("Could not load third-party integration settings from the API."));
  }, []);

  const updateIntegration = (key: string, value: unknown) => {
    setIntegrationSettings((current: any) => ({ ...current, [key]: value }));
  };

  const secretInput = (key: string, label: string, description?: string) => (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input
        type="password"
        placeholder={integrationSettings?.[key] || "Not configured"}
        value={integrationSecrets[key] ?? ""}
        onChange={(e) => setIntegrationSecrets((current) => ({ ...current, [key]: e.target.value }))}
      />
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
    </div>
  );

  const testVerification = async (type: "GSTIN" | "KYC" | "BANK") => {
    if (type === "GSTIN" && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(verificationTestGstin.trim().toUpperCase())) {
      toast.error("Enter a valid 15-character GSTIN for the provider test.");
      return;
    }
    if (type === "KYC" && (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(verificationTestPan.trim().toUpperCase()) || !verificationTestName.trim() || !verificationTestDob)) {
      toast.error("Enter PAN, name, and date of birth for the provider test.");
      return;
    }
    if (type === "BANK" && (!/^\d{6,40}$/.test(verificationTestBankAccount.trim()) || !/^[A-Z]{4}0[A-Z0-9]{6}$/i.test(verificationTestIfsc.trim()))) {
      toast.error("Enter a valid bank account number and IFSC for the provider test.");
      return;
    }
    setVerificationTesting(type);
    try {
      const response = await adminApi.testVerificationProvider(
        type === "GSTIN"
          ? { verification_type: type, gstin: verificationTestGstin.trim().toUpperCase() }
          : type === "KYC"
            ? { verification_type: type, pan: verificationTestPan.trim().toUpperCase(), name: verificationTestName.trim(), date_of_birth: verificationTestDob }
            : { verification_type: type, bank_account: verificationTestBankAccount.trim(), ifsc: verificationTestIfsc.trim().toUpperCase(), name: verificationTestName.trim() || undefined },
      );
      toast.success(`${type === "GSTIN" ? "GST" : type === "KYC" ? "KYC" : "Bank"} provider test completed: ${response?.data?.status ?? "received"}.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Provider test failed.");
    } finally {
      setVerificationTesting(null);
    }
  };

  const saveIntegrationSettings = async () => {
    if (!integrationSettings) return;
    setIntegrationSaving(true);
    try {
      const secretKeys = new Set(["razorpay_key_id", "razorpay_key_secret", "sandbox_verification_api_key", "sandbox_verification_api_secret", "digilocker_client_id", "digilocker_client_secret", "mail_username", "mail_password", "pusher_app_key", "pusher_app_secret", "aws_access_key_id", "aws_secret_access_key"]);
      const publicIntegrationSettings = Object.fromEntries(Object.entries(integrationSettings).filter(([key]) => !secretKeys.has(key)));
      const response = await adminApi.updateIntegrationSettings({
        ...publicIntegrationSettings,
        razorpay_enabled: Boolean(integrationSettings.razorpay_enabled),
        razorpay_timeout: Number(integrationSettings.razorpay_timeout ?? 30),
        digilocker_enabled: Boolean(integrationSettings.digilocker_enabled),
        digilocker_timeout: Number(integrationSettings.digilocker_timeout ?? 30),
        mail_port: Number(integrationSettings.mail_port),
        pusher_port: Number(integrationSettings.pusher_port),
        ...Object.fromEntries(Object.entries(integrationSecrets).filter(([, value]) => value.trim())),
      });
      setIntegrationSettings(response?.data ?? response);
      setIntegrationSecrets({});
      toast.success("Third-party integration settings saved securely.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save integration settings.");
    } finally {
      setIntegrationSaving(false);
    }
  };

  return (
    <Card className="overflow-hidden rounded-2xl border-2 border-t-4 border-t-violet-500 border-border/70 bg-card shadow-[0_4px_14px_rgba(15,23,42,0.08)]">
      <CardHeader className="bg-violet-50/80 pb-3">
        <div className="flex items-center gap-2">
          <KeyRound className="h-5 w-5 text-violet-600" />
          <CardTitle className="text-base">Third-Party Integrations</CardTitle>
        </div>
        <CardDescription>Configure provider keys from the admin panel. Secret values are encrypted by Laravel and only masked values are returned.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5 pt-4">
        {!integrationSettings ? (
          <p className="text-sm text-muted-foreground">Loading integration settings…</p>
        ) : (
          <>
            <section className="space-y-3">
              <h3 className="text-sm font-semibold">Firebase / Google Sign-In</h3>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Firebase Web API Key</Label>
                  <Input value={integrationSettings.firebase_api_key ?? ""} onChange={(e) => updateIntegration("firebase_api_key", e.target.value)} />
                  <p className="text-xs text-muted-foreground">Firebase web keys are public identifiers; security comes from Firebase rules and authorized domains.</p>
                </div>
                <div className="space-y-1.5"><Label>Firebase Auth Domain</Label><Input value={integrationSettings.firebase_auth_domain ?? ""} onChange={(e) => updateIntegration("firebase_auth_domain", e.target.value)} /></div>
                <div className="space-y-1.5"><Label>Firebase Project ID</Label><Input value={integrationSettings.firebase_project_id ?? ""} onChange={(e) => updateIntegration("firebase_project_id", e.target.value)} /></div>
                <div className="space-y-1.5"><Label>Firebase Storage Bucket</Label><Input value={integrationSettings.firebase_storage_bucket ?? ""} onChange={(e) => updateIntegration("firebase_storage_bucket", e.target.value)} /></div>
                <div className="space-y-1.5"><Label>Messaging Sender ID</Label><Input value={integrationSettings.firebase_messaging_sender_id ?? ""} onChange={(e) => updateIntegration("firebase_messaging_sender_id", e.target.value)} /></div>
                <div className="space-y-1.5"><Label>Firebase App ID</Label><Input value={integrationSettings.firebase_app_id ?? ""} onChange={(e) => updateIntegration("firebase_app_id", e.target.value)} /></div>
                <div className="space-y-1.5"><Label>Google OAuth Client ID</Label><Input value={integrationSettings.google_client_id ?? ""} onChange={(e) => updateIntegration("google_client_id", e.target.value)} placeholder="Optional" /></div>
              </div>
            </section>
            <section className="space-y-4 border-t pt-5">
              <div>
                <h3 className="text-sm font-semibold">Verification Provider</h3>
                <p className="text-xs text-muted-foreground">Sandbox is the active verification provider for GST, KYC, and bank verification. Credentials stay encrypted on Laravel.</p>
              </div>
              <div className="rounded-xl border border-sky-200 bg-sky-50/60 p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-semibold text-sky-950">Sandbox.co.in</h4>
                    <p className="text-xs text-sky-900/70">Current default for GST, KYC, and bank verification. Credentials stay encrypted on Laravel.</p>
                  </div>
                  <Switch checked={Boolean(integrationSettings.sandbox_verification_enabled)} onCheckedChange={(value) => updateIntegration("sandbox_verification_enabled", value)} />
                </div>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>Environment</Label>
                    <select value={integrationSettings.sandbox_verification_environment ?? "test"} onChange={(e) => updateIntegration("sandbox_verification_environment", e.target.value)} className="h-10 w-full rounded-md border bg-background px-3 text-sm">
                      <option value="test">Test</option>
                      <option value="live">Live</option>
                    </select>
                  </div>
                  {secretInput("sandbox_verification_api_key", "API Key")}
                  {secretInput("sandbox_verification_api_secret", "API Secret")}
                  <div className="space-y-1.5"><Label>API base URL (optional)</Label><Input value={integrationSettings.sandbox_verification_base_url ?? ""} onChange={(e) => updateIntegration("sandbox_verification_base_url", e.target.value)} placeholder="Uses the selected Sandbox environment" /></div>
                  <div className="space-y-1.5"><Label>Timeout (seconds)</Label><Input type="number" min={5} max={120} value={integrationSettings.sandbox_verification_timeout ?? 30} onChange={(e) => updateIntegration("sandbox_verification_timeout", e.target.value)} /></div>
                </div>
                <div className="mt-4 grid grid-cols-1 gap-2 md:grid-cols-[1fr_auto]">
                  <Input aria-label="Sandbox GSTIN test value" placeholder="GSTIN for configuration test" value={verificationTestGstin} onChange={(e) => setVerificationTestGstin(e.target.value)} />
                  <Button variant="outline" onClick={() => testVerification("GSTIN")} disabled={verificationTesting !== null}>{verificationTesting === "GSTIN" ? "Testing…" : "Test GST Configuration"}</Button>
                </div>
                <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-[1fr_1fr_1fr_auto]">
                  <Input aria-label="KYC PAN test value" placeholder="PAN" value={verificationTestPan} onChange={(e) => setVerificationTestPan(e.target.value)} />
                  <Input aria-label="KYC name test value" placeholder="Name as per PAN" value={verificationTestName} onChange={(e) => setVerificationTestName(e.target.value)} />
                  <Input aria-label="KYC date of birth test value" type="date" value={verificationTestDob} onChange={(e) => setVerificationTestDob(e.target.value)} />
                  <Button variant="outline" onClick={() => testVerification("KYC")} disabled={verificationTesting !== null}>{verificationTesting === "KYC" ? "Testing…" : "Test KYC Configuration"}</Button>
                </div>
                <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-[1fr_1fr_1fr_auto]">
                  <Input aria-label="Bank account test value" placeholder="Bank account number" value={verificationTestBankAccount} onChange={(e) => setVerificationTestBankAccount(e.target.value)} />
                  <Input aria-label="Bank IFSC test value" placeholder="IFSC" value={verificationTestIfsc} onChange={(e) => setVerificationTestIfsc(e.target.value)} />
                  <Input aria-label="Bank account holder test value" placeholder="Account holder name (optional)" value={verificationTestName} onChange={(e) => setVerificationTestName(e.target.value)} />
                  <Button variant="outline" onClick={() => testVerification("BANK")} disabled={verificationTesting !== null}>{verificationTesting === "BANK" ? "Testing…" : "Test Bank Configuration"}</Button>
                </div>
              </div>
            </section>
            <section className="space-y-3 border-t pt-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold">Razorpay Payment Gateway</h3>
                  <p className="text-xs text-muted-foreground">Standard Web Checkout for wallet top-ups and order payments. Credentials stay encrypted on Laravel.</p>
                </div>
                <Switch checked={Boolean(integrationSettings.razorpay_enabled)} onCheckedChange={(value) => updateIntegration("razorpay_enabled", value)} />
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Environment</Label>
                  <select value={integrationSettings.razorpay_environment ?? "test"} onChange={(e) => updateIntegration("razorpay_environment", e.target.value)} className="h-10 w-full rounded-md border bg-background px-3 text-sm">
                    <option value="test">Test</option>
                    <option value="live">Live</option>
                  </select>
                </div>
                {secretInput("razorpay_key_id", "Key ID", "Publishable key (rzp_test_... or rzp_live_...). Safe for frontend.")}
                {secretInput("razorpay_key_secret", "Key Secret", "Backend-only secret. Never exposed to clients.")}
                <div className="space-y-1.5"><Label>Timeout (seconds)</Label><Input type="number" min={5} max={120} value={integrationSettings.razorpay_timeout ?? 30} onChange={(e) => updateIntegration("razorpay_timeout", e.target.value)} /></div>
              </div>
            </section>
            <section className="space-y-3 border-t pt-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold">DigiLocker — Identity Verification</h3>
                  <p className="text-xs text-muted-foreground">Aadhaar/identity verification via official DigiLocker partner API. Requires partner registration and approval.</p>
                </div>
                <Switch checked={Boolean(integrationSettings.digilocker_enabled)} onCheckedChange={(value) => updateIntegration("digilocker_enabled", value)} />
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Environment</Label>
                  <select value={integrationSettings.digilocker_environment ?? "sandbox"} onChange={(e) => updateIntegration("digilocker_environment", e.target.value)} className="h-10 w-full rounded-md border bg-background px-3 text-sm">
                    <option value="sandbox">Sandbox</option>
                    <option value="production">Production</option>
                  </select>
                </div>
                {secretInput("digilocker_client_id", "Client ID")}
                {secretInput("digilocker_client_secret", "Client Secret")}
                <div className="space-y-1.5"><Label>Redirect URI</Label><Input value={integrationSettings.digilocker_redirect_uri ?? ""} onChange={(e) => updateIntegration("digilocker_redirect_uri", e.target.value)} placeholder="https://scrapifyauctions.com/business-verification" /></div>
                <div className="space-y-1.5"><Label>Scopes</Label><Input value={integrationSettings.digilocker_scopes ?? "openid"} onChange={(e) => updateIntegration("digilocker_scopes", e.target.value)} /></div>
                <div className="space-y-1.5"><Label>Timeout (seconds)</Label><Input type="number" min={5} max={120} value={integrationSettings.digilocker_timeout ?? 30} onChange={(e) => updateIntegration("digilocker_timeout", e.target.value)} /></div>
              </div>
              <p className="text-xs text-muted-foreground">DigiLocker secrets are encrypted on the backend and never exposed to clients. Partner credentials must be obtained from the DigiLocker partner portal.</p>
            </section>
            <section className="space-y-3 border-t pt-5">
              <h3 className="text-sm font-semibold">Pusher / WebSocket</h3>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="space-y-1.5"><Label>App ID</Label><Input value={integrationSettings.pusher_app_id ?? ""} onChange={(e) => updateIntegration("pusher_app_id", e.target.value)} /></div>
                {secretInput("pusher_app_key", "App Key")}
                {secretInput("pusher_app_secret", "App Secret")}
                <div className="space-y-1.5"><Label>Cluster</Label><Input value={integrationSettings.pusher_cluster ?? ""} onChange={(e) => updateIntegration("pusher_cluster", e.target.value)} /></div>
                <div className="space-y-1.5"><Label>Host</Label><Input value={integrationSettings.pusher_host ?? ""} onChange={(e) => updateIntegration("pusher_host", e.target.value)} placeholder="Optional" /></div>
                <div className="space-y-1.5"><Label>Port</Label><Input type="number" min={1} max={65535} value={integrationSettings.pusher_port ?? 443} onChange={(e) => updateIntegration("pusher_port", e.target.value)} /></div>
              </div>
            </section>
            <section className="space-y-3 border-t pt-5">
              <h3 className="text-sm font-semibold">AWS / S3 Storage</h3>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Storage Disk</Label>
                  <select value={integrationSettings.filesystem_disk ?? "local"} onChange={(e) => updateIntegration("filesystem_disk", e.target.value)} className="h-10 w-full rounded-md border bg-background px-3 text-sm">
                    <option value="local">Local</option>
                    <option value="public">Public</option>
                    <option value="s3">Amazon S3</option>
                  </select>
                </div>
                {secretInput("aws_access_key_id", "AWS Access Key ID")}
                {secretInput("aws_secret_access_key", "AWS Secret Access Key")}
                <div className="space-y-1.5"><Label>AWS Region</Label><Input value={integrationSettings.aws_region ?? ""} onChange={(e) => updateIntegration("aws_region", e.target.value)} /></div>
                <div className="space-y-1.5"><Label>S3 Bucket</Label><Input value={integrationSettings.aws_bucket ?? ""} onChange={(e) => updateIntegration("aws_bucket", e.target.value)} /></div>
                <div className="space-y-1.5"><Label>S3 Endpoint</Label><Input value={integrationSettings.aws_endpoint ?? ""} onChange={(e) => updateIntegration("aws_endpoint", e.target.value)} placeholder="Optional" /></div>
                <div className="flex items-center justify-between rounded-lg border p-3"><Label>Use path-style endpoints</Label><Switch checked={Boolean(integrationSettings.aws_use_path_style_endpoints)} onCheckedChange={(value) => updateIntegration("aws_use_path_style_endpoints", value)} /></div>
              </div>
            </section>
            <div className="flex justify-end border-t pt-4">
              <Button onClick={saveIntegrationSettings} disabled={integrationSaving} className="bg-violet-600 text-white hover:bg-violet-700">
                {integrationSaving ? "Saving…" : "Save Integration Settings"}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
