import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/admin/page-header";
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  MessageSquare,
  KeyRound,
  ChevronDown,
} from "lucide-react";
import { toast } from "sonner";
import { adminApi } from "@/lib/api-client";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Platform Settings — Scrapify Auctions Admin" },
      {
        name: "description",
        content:
          "Platform configuration, security policies, payment gateways, and notification settings.",
      },
      { property: "og:title", content: "Platform Settings — Scrapify Auctions Admin" },
      {
        property: "og:description",
        content:
          "Platform configuration, security policies, payment gateways, and notification settings.",
      },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const [expandedSection, setExpandedSection] = useState("otp");
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
  const [mobileMinVersion, setMobileMinVersion] = useState("1.0.0");
  const [mobileLatestVersion, setMobileLatestVersion] = useState("1.0.0");
  const [mobileForceUpdate, setMobileForceUpdate] = useState(false);
  const [mobileUpdateUrl, setMobileUpdateUrl] = useState("");
  const [mobileUpdateNotes, setMobileUpdateNotes] = useState("");
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [savingConfig, setSavingConfig] = useState(false);
  const [otpSettings, setOtpSettings] = useState<any>(null);
  const [otpAuthKey, setOtpAuthKey] = useState("");
  const [otpTestPhone, setOtpTestPhone] = useState("");
  const [otpTestEmail, setOtpTestEmail] = useState("");
  const [otpSaving, setOtpSaving] = useState(false);
  const [otpTesting, setOtpTesting] = useState(false);
  const [otpEmailTesting, setOtpEmailTesting] = useState(false);
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
  const [cashfreePaymentTesting, setCashfreePaymentTesting] = useState(false);

  const toggleSection = (section: string) => {
    setExpandedSection((current) => (current === section ? "" : section));
  };

  const sectionToggle = (section: string, label: string) => (
    <button
      type="button"
      aria-label={`${expandedSection === section ? "Collapse" : "Expand"} ${label}`}
      aria-expanded={expandedSection === section}
      onClick={(event) => {
        event.stopPropagation();
        toggleSection(section);
      }}
      className="absolute right-4 top-1/2 -translate-y-1/2 rounded-lg border border-current/15 p-2 text-current/75 transition hover:bg-black/5 hover:text-current focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--auction)]"
    >
      <ChevronDown
        strokeWidth={2.75}
        className={`h-5 w-5 transition-transform ${expandedSection === section ? "rotate-180" : ""}`}
      />
    </button>
  );

  useEffect(() => {
    adminApi
      .getPlatformConfig()
      .then((response) => {
        const config = response?.data ?? response;
        if (config?.auction_edit_lock_hours !== undefined) {
          setAuctionEditLockHours(String(config.auction_edit_lock_hours));
        }
        if (config?.emd_percentage !== undefined) setEmdPercentage(String(config.emd_percentage));
        if (config?.minimum_participants !== undefined)
          setMinimumParticipants(String(config.minimum_participants));
        if (config?.initial_slot_minutes !== undefined)
          setInitialSlotMinutes(String(config.initial_slot_minutes));
        if (config?.continuation_slot_minutes !== undefined)
          setContinuationSlotMinutes(String(config.continuation_slot_minutes));
        if (config?.bid_cutoff_ms !== undefined) setBidCutoffMs(String(config.bid_cutoff_ms));
        if (config?.maximum_auction_duration_minutes !== undefined)
          setMaximumAuctionDurationMinutes(String(config.maximum_auction_duration_minutes));
        if (config?.rfq_required !== undefined) setRfqRequired(Boolean(config.rfq_required));
        if (config?.rfq_mode) setRfqMode(config.rfq_mode);
        if (config?.rfq_benchmark_strategy) setRfqBenchmarkStrategy(config.rfq_benchmark_strategy);
        if (config?.emd_required !== undefined) setEmdRequired(Boolean(config.emd_required));
        if (config?.emd_type) setEmdType(config.emd_type);
        if (config?.emd_fixed_amount !== undefined)
          setEmdFixedAmount(String(config.emd_fixed_amount));
        if (config?.seller_kyb_required !== undefined)
          setSellerKybRequired(Boolean(config.seller_kyb_required));
        if (config?.participant_kyb_required !== undefined)
          setParticipantKybRequired(Boolean(config.participant_kyb_required));
        if (config?.kyb_auto_approve_match_score !== undefined)
          setKybAutoMatch(String(config.kyb_auto_approve_match_score));
        if (config?.kyb_review_match_score !== undefined)
          setKybReviewMatch(String(config.kyb_review_match_score));
        if (config?.mobile_min_version) setMobileMinVersion(String(config.mobile_min_version));
        if (config?.mobile_latest_version) setMobileLatestVersion(String(config.mobile_latest_version));
        if (config?.mobile_force_update !== undefined) setMobileForceUpdate(Boolean(config.mobile_force_update));
        if (config?.mobile_update_url) setMobileUpdateUrl(String(config.mobile_update_url));
        if (config?.mobile_update_notes) setMobileUpdateNotes(String(config.mobile_update_notes));
      })
      .catch(() => toast.error("Could not load platform settings from the API."))
      .finally(() => setLoadingConfig(false));
  }, []);

  useEffect(() => {
    adminApi
      .getIntegrationSettings()
      .then((response) => setIntegrationSettings(response?.data ?? response))
      .catch(() => toast.error("Could not load third-party integration settings from the API."));
  }, []);

  useEffect(() => {
    adminApi
      .getOtpSettings()
      .then((response) => setOtpSettings(response?.data ?? response))
      .catch(() => toast.error("Could not load OTP settings from the API."));
  }, []);

  const saveOtpSettings = async () => {
    if (!otpSettings) return;
    setOtpSaving(true);
    try {
      const response = await adminApi.updateOtpSettings({
        ...otpSettings,
        ...(otpAuthKey.trim() ? { msg91_auth_key: otpAuthKey.trim() } : {}),
        msg91_enabled: Boolean(otpSettings.msg91_enabled),
        msg91_otp_length: 4,
        email_otp_length: 4,
        otp_expiry_minutes: Number(otpSettings.otp_expiry_minutes),
        otp_resend_cooldown_seconds: Number(otpSettings.otp_resend_cooldown_seconds),
        otp_max_resend_attempts: Number(otpSettings.otp_max_resend_attempts),
        otp_max_verification_attempts: Number(otpSettings.otp_max_verification_attempts),
        otp_rate_limit_per_hour: Number(otpSettings.otp_rate_limit_per_hour),
      });
      setOtpSettings(response?.data ?? response);
      setOtpAuthKey("");
      toast.success("OTP settings saved securely.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save OTP settings.");
    } finally {
      setOtpSaving(false);
    }
  };

  const sendOtpTest = async () => {
    if (!/^[6-9]\d{9}$/.test(otpTestPhone)) {
      toast.error("Enter a valid 10-digit Indian mobile number.");
      return;
    }
    setOtpTesting(true);
    try {
      const response = await adminApi.sendOtpTest(otpTestPhone);
      const providerMessage = response?.provider_message;
      const requestId = response?.provider_request_id;
      toast.success(
        [
          response?.message || "Test OTP request accepted by MSG91.",
          providerMessage,
          requestId ? `Request ID: ${requestId}` : null,
        ]
          .filter(Boolean)
          .join(" "),
      );
      setOtpTestPhone("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not send test OTP.");
    } finally {
      setOtpTesting(false);
    }
  };

  const sendEmailOtpTest = async () => {
    const email = otpTestEmail.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Enter a valid email address.");
      return;
    }
    setOtpEmailTesting(true);
    try {
      const response = await adminApi.sendEmailOtpTest(email);
      toast.success(response?.message || "Test email OTP sent successfully.");
      setOtpTestEmail("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not send test email OTP.");
    } finally {
      setOtpEmailTesting(false);
    }
  };

  const saveMailSettings = async () => {
    if (!integrationSettings) return;
    setIntegrationSaving(true);
    try {
      const mailSecrets = Object.fromEntries(
        Object.entries(integrationSecrets).filter(
          ([key, value]) => ["mail_username", "mail_password"].includes(key) && value.trim(),
        ),
      );
      const response = await adminApi.updateIntegrationSettings({
        mail_mailer: integrationSettings.mail_mailer ?? "smtp",
        mail_host: integrationSettings.mail_host ?? "smtp-relay.brevo.com",
        mail_port: Number(integrationSettings.mail_port ?? 587),
        mail_encryption: integrationSettings.mail_encryption ?? "tls",
        mail_from_address:
          otpSettings?.email_from_address || integrationSettings.mail_from_address || "",
        mail_from_name:
          otpSettings?.email_from_name || integrationSettings.mail_from_name || "Scrapify Auctions",
        ...mailSecrets,
      });
      setIntegrationSettings(response?.data ?? response);
      setIntegrationSecrets((current) => {
        const next = { ...current };
        delete next.mail_username;
        delete next.mail_password;
        return next;
      });
      toast.success("Brevo SMTP settings saved securely.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save SMTP settings.");
    } finally {
      setIntegrationSaving(false);
    }
  };

  const saveIntegrationSettings = async () => {
    if (!integrationSettings) return;
    setIntegrationSaving(true);
    try {
      const secretKeys = new Set([
        "cashfree_secure_id_client_id",
        "cashfree_secure_id_client_secret",
        "cashfree_pg_client_id",
        "cashfree_pg_client_secret",
        "sandbox_verification_api_key",
        "sandbox_verification_api_secret",
        "mail_username",
        "mail_password",
        "pusher_app_key",
        "pusher_app_secret",
        "aws_access_key_id",
        "aws_secret_access_key",
      ]);
      const publicIntegrationSettings = Object.fromEntries(
        Object.entries(integrationSettings).filter(([key]) => !secretKeys.has(key)),
      );
      const response = await adminApi.updateIntegrationSettings({
        ...publicIntegrationSettings,
        cashfree_secure_id_enabled: Boolean(integrationSettings.cashfree_secure_id_enabled),
        cashfree_secure_id_timeout: Number(integrationSettings.cashfree_secure_id_timeout),
        cashfree_pg_enabled: Boolean(integrationSettings.cashfree_pg_enabled),
        cashfree_pg_timeout: Number(integrationSettings.cashfree_pg_timeout ?? 30),
        mail_port: Number(integrationSettings.mail_port),
        pusher_port: Number(integrationSettings.pusher_port),
        ...Object.fromEntries(
          Object.entries(integrationSecrets).filter(([, value]) => value.trim()),
        ),
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

  const testCashfreePayment = async () => {
    setCashfreePaymentTesting(true);
    try {
      const response = await adminApi.testCashfreePayment({ amount: 10 });
      const result = response?.data ?? response;
      toast.success(`Cashfree ${String(result.environment ?? "test").toUpperCase()} order created: ${result.order_id}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Cashfree payment test failed.");
    } finally {
      setCashfreePaymentTesting(false);
    }
  };

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
        onChange={(e) =>
          setIntegrationSecrets((current) => ({ ...current, [key]: e.target.value }))
        }
      />
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
    </div>
  );

  const testVerification = async (type: "GSTIN" | "KYC" | "BANK") => {
    if (
      type === "GSTIN" &&
      !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(
        verificationTestGstin.trim().toUpperCase(),
      )
    ) {
      toast.error("Enter a valid 15-character GSTIN for the provider test.");
      return;
    }
    if (
      type === "KYC" &&
      (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(verificationTestPan.trim().toUpperCase()) ||
        !verificationTestName.trim() ||
        !verificationTestDob)
    ) {
      toast.error("Enter PAN, name, and date of birth for the provider test.");
      return;
    }
    if (
      type === "BANK" &&
      (!/^\d{6,40}$/.test(verificationTestBankAccount.trim()) ||
        !/^[A-Z]{4}0[A-Z0-9]{6}$/i.test(verificationTestIfsc.trim()))
    ) {
      toast.error("Enter a valid bank account number and IFSC for the provider test.");
      return;
    }
    setVerificationTesting(type);
    try {
      const response = await adminApi.testVerificationProvider(
        type === "GSTIN"
          ? { verification_type: type, gstin: verificationTestGstin.trim().toUpperCase() }
          : type === "KYC"
            ? {
                verification_type: type,
                pan: verificationTestPan.trim().toUpperCase(),
                name: verificationTestName.trim(),
                date_of_birth: verificationTestDob,
              }
            : {
                verification_type: type,
                bank_account: verificationTestBankAccount.trim(),
                ifsc: verificationTestIfsc.trim().toUpperCase(),
                name: verificationTestName.trim() || undefined,
              },
      );
      toast.success(
        `${type === "GSTIN" ? "GST" : type === "KYC" ? "KYC" : "Bank"} provider test completed: ${response?.data?.status ?? "received"}.`,
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Provider test failed.");
    } finally {
      setVerificationTesting(null);
    }
  };

  const handleSave = async () => {
    const hours = Number(auctionEditLockHours);
    const values = [
      Number(emdPercentage),
      Number(minimumParticipants),
      Number(initialSlotMinutes),
      Number(continuationSlotMinutes),
      Number(bidCutoffMs),
      Number(maximumAuctionDurationMinutes),
    ];
    if (
      !Number.isInteger(hours) ||
      hours < 0 ||
      hours > 168 ||
      values.some((value) => !Number.isFinite(value) || value < 0)
    ) {
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
    <div className="min-h-full space-y-5 bg-background p-4 sm:p-6 lg:p-8">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border/70 pb-4">
        <PageHeader
          title="Platform Settings & Governance"
          description="Configure global API connectivity, anti-sniping timers, payment escrow parameters, and security policies."
        />
        <Button
          onClick={handleSave}
          disabled={savingConfig || loadingConfig}
          className="gap-2 bg-[color:var(--auction)] text-white hover:brightness-110"
        >
          {saved ? <CheckCircle2 className="h-4 w-4" /> : <Save className="h-4 w-4" />}
          {saved ? "Saved" : "Save Changes"}
        </Button>
      </div>

      <nav aria-label="Settings sections" className="flex flex-wrap gap-2 rounded-2xl border border-border/70 bg-card p-3 shadow-sm">
        {[
          ["backend", "Platform & API"],
          ["otp", "OTP & Email"],
          ["integrations", "Integrations"],
          ["kyb", "Business Verification"],
          ["auction", "Auctions & EMD"],
          ["security", "Security"],
          ["notifications", "Notifications"],
        ].map(([id, label]) => (
          <a
            key={id}
            href={`#settings-${id}`}
            className="rounded-lg border border-border/70 px-3 py-2 text-xs font-semibold text-muted-foreground transition hover:border-[color:var(--auction)] hover:bg-orange-50 hover:text-[color:var(--auction)]"
          >
            {label}
          </a>
        ))}
      </nav>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Backend & API Connectivity */}
        <Card id="settings-backend" className="scroll-mt-6 overflow-hidden rounded-2xl border-2 border-t-4 border-t-[color:var(--navy)] border-border/70 bg-card shadow-[0_4px_14px_rgba(15,23,42,0.08)] transition-shadow duration-200 hover:shadow-[0_8px_22px_rgba(15,23,42,0.12)] md:col-span-2">
          <CardHeader
            className="relative cursor-pointer bg-[color:var(--navy)] pb-3 pr-12 text-white"
            onClick={() => toggleSection("backend")}
          >
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-orange-300" />
              <CardTitle className="text-base">Backend API & Reverb Cluster</CardTitle>
            </div>
            <CardDescription className="text-white/70">
              Configure Laravel REST and WebSocket cluster endpoints.
            </CardDescription>
            {sectionToggle("backend", "Backend API & Reverb Cluster")}
          </CardHeader>
          <CardContent
            className={`space-y-3 pt-0 ${expandedSection === "backend" ? "" : "hidden"}`}
          >
            <div className="space-y-1.5">
              <Label htmlFor="api-url" className="text-xs font-medium">
                REST API Base URL
              </Label>
              <Input
                id="api-url"
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                placeholder="https://api.scrapifyauctions.com/api/v1"
                className="font-mono text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="emd-percentage" className="text-xs font-medium">
                  EMD (%)
                </Label>
                <Input
                  id="emd-percentage"
                  type="number"
                  min={0}
                  max={100}
                  step={0.1}
                  value={emdPercentage}
                  onChange={(e) => setEmdPercentage(e.target.value)}
                  disabled={loadingConfig}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="minimum-participants" className="text-xs font-medium">
                  Minimum Participants
                </Label>
                <Input
                  id="minimum-participants"
                  type="number"
                  min={1}
                  value={minimumParticipants}
                  onChange={(e) => setMinimumParticipants(e.target.value)}
                  disabled={loadingConfig}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="initial-slot" className="text-xs font-medium">
                  Initial Slot (minutes)
                </Label>
                <Input
                  id="initial-slot"
                  type="number"
                  min={1}
                  value={initialSlotMinutes}
                  onChange={(e) => setInitialSlotMinutes(e.target.value)}
                  disabled={loadingConfig}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="continuation-slot" className="text-xs font-medium">
                  Continuation Slot (minutes)
                </Label>
                <Input
                  id="continuation-slot"
                  type="number"
                  min={1}
                  value={continuationSlotMinutes}
                  onChange={(e) => setContinuationSlotMinutes(e.target.value)}
                  disabled={loadingConfig}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="bid-cutoff" className="text-xs font-medium">
                  Bid Cutoff (ms)
                </Label>
                <Input
                  id="bid-cutoff"
                  type="number"
                  min={0}
                  value={bidCutoffMs}
                  onChange={(e) => setBidCutoffMs(e.target.value)}
                  disabled={loadingConfig}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="max-duration" className="text-xs font-medium">
                  Maximum Duration (minutes)
                </Label>
                <Input
                  id="max-duration"
                  type="number"
                  min={1}
                  value={maximumAuctionDurationMinutes}
                  onChange={(e) => setMaximumAuctionDurationMinutes(e.target.value)}
                  disabled={loadingConfig}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 border-t pt-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">RFQ Mode</Label>
                <select
                  value={rfqMode}
                  onChange={(e) => setRfqMode(e.target.value)}
                  disabled={loadingConfig}
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                >
                  <option value="DOCUMENT">Document</option>
                  <option value="DISCOVERY_ROUND">Discovery Round</option>
                  <option value="HYBRID">Hybrid</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">RFQ Benchmark</Label>
                <select
                  value={rfqBenchmarkStrategy}
                  onChange={(e) => setRfqBenchmarkStrategy(e.target.value)}
                  disabled={loadingConfig}
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                >
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
                <select
                  value={emdType}
                  onChange={(e) => setEmdType(e.target.value)}
                  disabled={loadingConfig}
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                >
                  <option value="PERCENTAGE">Percentage</option>
                  <option value="FIXED">Fixed Amount</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Fixed EMD (₹)</Label>
                <Input
                  type="number"
                  min={0}
                  value={emdFixedAmount}
                  onChange={(e) => setEmdFixedAmount(e.target.value)}
                  disabled={loadingConfig}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ws-url" className="text-xs font-medium">
                WebSocket / Reverb Cluster URL
              </Label>
              <Input
                id="ws-url"
                value={wsUrl}
                onChange={(e) => setWsUrl(e.target.value)}
                placeholder="wss://api.scrapifyauctions.com/app"
                className="font-mono text-sm"
              />
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
              <Button
                onClick={handleSave}
                disabled={savingConfig || loadingConfig}
                className="gap-2 bg-[color:var(--navy)] text-white hover:brightness-110"
              >
                {saved ? <CheckCircle2 className="h-4 w-4" /> : <Save className="h-4 w-4" />}
                {saved ? "Saved" : "Save Backend Settings"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card id="settings-otp" className="scroll-mt-6 overflow-hidden rounded-2xl border-2 border-t-4 border-t-[color:var(--auction)] border-border/70 bg-card shadow-[0_4px_14px_rgba(15,23,42,0.08)] transition-shadow duration-200 hover:shadow-[0_8px_22px_rgba(15,23,42,0.12)] md:col-span-2">
          <CardHeader
            className="relative cursor-pointer bg-orange-50/80 pb-3 pr-12"
            onClick={() => toggleSection("otp")}
          >
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-[color:var(--auction)]" />
              <CardTitle className="text-base">OTP / MSG91 Integration</CardTitle>
            </div>
            <CardDescription>
              Provider credentials stay on Laravel. The auth key is masked on read and encrypted
              when stored.
            </CardDescription>
            {sectionToggle("otp", "OTP / MSG91 Integration")}
          </CardHeader>
          <CardContent className={`space-y-4 pt-0 ${expandedSection === "otp" ? "" : "hidden"}`}>
            {!otpSettings ? (
              <p className="text-sm text-muted-foreground">Loading OTP settings…</p>
            ) : (
              <>
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <Label className="text-sm">MSG91 OTP enabled</Label>
                    <p className="text-xs text-muted-foreground">
                      Registration and login OTP requests use the backend provider.
                    </p>
                  </div>
                  <Switch
                    checked={Boolean(otpSettings.msg91_enabled)}
                    onCheckedChange={(value) =>
                      setOtpSettings({ ...otpSettings, msg91_enabled: value })
                    }
                  />
                </div>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div className="flex items-center justify-between rounded-lg border bg-muted/20 p-3 md:col-span-2">
                    <div>
                      <Label className="text-sm">Email OTP enabled</Label>
                      <p className="text-xs text-muted-foreground">
                        Allow users to receive one-time passwords by email.
                      </p>
                    </div>
                    <Switch
                      checked={Boolean(otpSettings.email_enabled)}
                      onCheckedChange={(value) =>
                        setOtpSettings({ ...otpSettings, email_enabled: value })
                      }
                      aria-label="Enable email OTP"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Email From Name</Label>
                    <Input
                      value={otpSettings.email_from_name ?? ""}
                      onChange={(e) =>
                        setOtpSettings({ ...otpSettings, email_from_name: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Email From Address</Label>
                    <Input
                      type="email"
                      value={otpSettings.email_from_address ?? ""}
                      onChange={(e) =>
                        setOtpSettings({ ...otpSettings, email_from_address: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <Label>Email OTP Template</Label>
                    <Textarea
                      rows={4}
                      placeholder="Your Scrapify Auctions verification code is :code. It expires in :minutes minutes."
                      value={otpSettings.email_otp_template ?? ""}
                      onChange={(e) =>
                        setOtpSettings({ ...otpSettings, email_otp_template: e.target.value })
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      Use only <code>:code</code> and <code>:minutes</code>. Laravel replaces these
                      placeholders before sending.
                    </p>
                    <div className="space-y-2 rounded-lg border bg-muted/20 p-3">
                      <p className="text-xs font-medium text-muted-foreground">Email preview</p>
                      <p className="whitespace-pre-line text-sm text-foreground">
                        {(
                          otpSettings.email_otp_template ||
                          "Your Scrapify Auctions verification code is :code. It expires in :minutes minutes."
                        )
                          .replace(/:code/g, "1234")
                          .replace(/:minutes/g, String(otpSettings.otp_expiry_minutes || 5))}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-3 rounded-xl border border-violet-200 bg-violet-50/60 p-4 md:col-span-2">
                    <div className="flex items-start gap-3">
                      <Mail className="mt-0.5 h-5 w-5 text-violet-600" />
                      <div>
                        <h3 className="text-sm font-semibold text-violet-950">
                          Brevo SMTP delivery
                        </h3>
                        <p className="text-xs text-violet-900/70">
                          Add the SMTP login and key here. Laravel encrypts the credentials and
                          returns only masked values.
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label>Mailer</Label>
                        <select
                          value={integrationSettings?.mail_mailer ?? "smtp"}
                          onChange={(e) => updateIntegration("mail_mailer", e.target.value)}
                          className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                        >
                          <option value="smtp">SMTP</option>
                          <option value="sendmail">Sendmail</option>
                          <option value="log">Log</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <Label>SMTP Host</Label>
                        <Input
                          value={integrationSettings?.mail_host ?? "smtp-relay.brevo.com"}
                          onChange={(e) => updateIntegration("mail_host", e.target.value)}
                          placeholder="smtp-relay.brevo.com"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>SMTP Port</Label>
                        <Input
                          type="number"
                          min={1}
                          max={65535}
                          value={integrationSettings?.mail_port ?? 587}
                          onChange={(e) => updateIntegration("mail_port", e.target.value)}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Encryption</Label>
                        <select
                          value={integrationSettings?.mail_encryption ?? "tls"}
                          onChange={(e) => updateIntegration("mail_encryption", e.target.value)}
                          className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                        >
                          <option value="tls">TLS</option>
                          <option value="ssl">SSL</option>
                          <option value="null">None</option>
                        </select>
                      </div>
                      {secretInput(
                        "mail_username",
                        "SMTP Username",
                        "Copy the SMTP login from Brevo SMTP & API.",
                      )}
                      {secretInput(
                        "mail_password",
                        "SMTP Key",
                        "Use the Brevo SMTP key, not the Brevo API key.",
                      )}
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-violet-200 pt-3">
                      <p className="text-xs text-violet-900/70">
                        The email sender is configured in the Email From Name and Email From Address
                        fields above.
                      </p>
                      <Button
                        onClick={saveMailSettings}
                        disabled={integrationSaving || !integrationSettings}
                        variant="outline"
                        className="border-violet-300 bg-white text-violet-800 hover:bg-violet-100"
                      >
                        {integrationSaving ? "Saving…" : "Save SMTP Settings"}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Auth Key</Label>
                    <Input
                      type="password"
                      placeholder={otpSettings.msg91_auth_key || "Not configured"}
                      value={otpAuthKey}
                      onChange={(e) => setOtpAuthKey(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Leave blank to keep the current key.
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <Label>OTP Template ID</Label>
                    <Input
                      value={otpSettings.msg91_otp_template_id ?? ""}
                      onChange={(e) =>
                        setOtpSettings({ ...otpSettings, msg91_otp_template_id: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>SMS Template ID (optional)</Label>
                    <Input
                      value={otpSettings.msg91_sms_template_id ?? ""}
                      onChange={(e) =>
                        setOtpSettings({ ...otpSettings, msg91_sms_template_id: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Sender ID</Label>
                    <Input
                      value={otpSettings.msg91_sender_id ?? ""}
                      onChange={(e) =>
                        setOtpSettings({ ...otpSettings, msg91_sender_id: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Country Code</Label>
                    <Input
                      value={otpSettings.msg91_country_code ?? ""}
                      onChange={(e) =>
                        setOtpSettings({ ...otpSettings, msg91_country_code: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>SMS OTP Length</Label>
                    <Input type="number" value={4} readOnly />
                    <p className="text-xs text-muted-foreground">
                      Fixed at 4 digits. This must match the MSG91 OTP template.
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Email OTP Length</Label>
                    <Input type="number" value={4} readOnly />
                    <p className="text-xs text-muted-foreground">Fixed at 4 digits.</p>
                  </div>
                  <div className="space-y-1.5">
                    <Label>OTP Expiry (minutes)</Label>
                    <Input
                      type="number"
                      min={1}
                      max={30}
                      value={otpSettings.otp_expiry_minutes ?? 5}
                      onChange={(e) =>
                        setOtpSettings({ ...otpSettings, otp_expiry_minutes: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Resend Cooldown (seconds)</Label>
                    <Input
                      type="number"
                      min={10}
                      max={3600}
                      value={otpSettings.otp_resend_cooldown_seconds ?? 30}
                      onChange={(e) =>
                        setOtpSettings({
                          ...otpSettings,
                          otp_resend_cooldown_seconds: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Maximum Resends per Hour</Label>
                    <Input
                      type="number"
                      min={1}
                      max={20}
                      value={otpSettings.otp_max_resend_attempts ?? 3}
                      onChange={(e) =>
                        setOtpSettings({ ...otpSettings, otp_max_resend_attempts: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Maximum Verification Attempts</Label>
                    <Input
                      type="number"
                      min={1}
                      max={10}
                      value={otpSettings.otp_max_verification_attempts ?? 5}
                      onChange={(e) =>
                        setOtpSettings({
                          ...otpSettings,
                          otp_max_verification_attempts: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>OTP Requests per Hour</Label>
                    <Input
                      type="number"
                      min={1}
                      max={100}
                      value={otpSettings.otp_rate_limit_per_hour ?? 10}
                      onChange={(e) =>
                        setOtpSettings({ ...otpSettings, otp_rate_limit_per_hour: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button
                    onClick={saveOtpSettings}
                    disabled={otpSaving}
                    className="bg-[color:var(--auction)] text-white hover:brightness-110"
                  >
                    {otpSaving ? "Saving…" : "Save OTP Configuration"}
                  </Button>
                  <div className="flex min-w-[280px] flex-1 gap-2">
                    <Input
                      aria-label="Test OTP mobile number"
                      placeholder="Test mobile number"
                      value={otpTestPhone}
                      onChange={(e) => setOtpTestPhone(e.target.value)}
                    />
                    <Button variant="outline" onClick={sendOtpTest} disabled={otpTesting}>
                      {otpTesting ? "Sending…" : "Send Test OTP"}
                    </Button>
                  </div>
                  <div className="flex min-w-[280px] flex-1 gap-2">
                    <Input
                      aria-label="Test OTP email address"
                      type="email"
                      placeholder="Test email address"
                      value={otpTestEmail}
                      onChange={(e) => setOtpTestEmail(e.target.value)}
                    />
                    <Button variant="outline" onClick={sendEmailOtpTest} disabled={otpEmailTesting}>
                      {otpEmailTesting ? "Sending…" : "Send Test Email OTP"}
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card id="settings-integrations" className="scroll-mt-6 overflow-hidden rounded-2xl border-2 border-t-4 border-t-violet-500 border-border/70 bg-card shadow-[0_4px_14px_rgba(15,23,42,0.08)] transition-shadow duration-200 hover:shadow-[0_8px_22px_rgba(15,23,42,0.12)] md:col-span-2">
          <CardHeader
            className="relative cursor-pointer bg-violet-50/80 pb-3 pr-12"
            onClick={() => toggleSection("integrations")}
          >
            <div className="flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-violet-600" />
              <CardTitle className="text-base">Third-Party Integrations</CardTitle>
            </div>
            <CardDescription>
              Configure provider keys from the admin panel. Secret values are encrypted by Laravel
              and only masked values are returned.
            </CardDescription>
            {sectionToggle("integrations", "Third-Party Integrations")}
          </CardHeader>
          <CardContent
            className={`space-y-5 pt-0 ${expandedSection === "integrations" ? "" : "hidden"}`}
          >
            {!integrationSettings ? (
              <p className="text-sm text-muted-foreground">Loading integration settings…</p>
            ) : (
              <>
                <section className="space-y-3">
                  <h3 className="text-sm font-semibold">Firebase / Google Sign-In</h3>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label>Firebase Web API Key</Label>
                      <Input
                        value={integrationSettings.firebase_api_key ?? ""}
                        onChange={(e) => updateIntegration("firebase_api_key", e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        Firebase web keys are public identifiers; security comes from Firebase rules
                        and authorized domains.
                      </p>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Firebase Auth Domain</Label>
                      <Input
                        value={integrationSettings.firebase_auth_domain ?? ""}
                        onChange={(e) => updateIntegration("firebase_auth_domain", e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Firebase Project ID</Label>
                      <Input
                        value={integrationSettings.firebase_project_id ?? ""}
                        onChange={(e) => updateIntegration("firebase_project_id", e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Firebase Storage Bucket</Label>
                      <Input
                        value={integrationSettings.firebase_storage_bucket ?? ""}
                        onChange={(e) =>
                          updateIntegration("firebase_storage_bucket", e.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Messaging Sender ID</Label>
                      <Input
                        value={integrationSettings.firebase_messaging_sender_id ?? ""}
                        onChange={(e) =>
                          updateIntegration("firebase_messaging_sender_id", e.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Firebase App ID</Label>
                      <Input
                        value={integrationSettings.firebase_app_id ?? ""}
                        onChange={(e) => updateIntegration("firebase_app_id", e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Google OAuth Client ID</Label>
                      <Input
                        value={integrationSettings.google_client_id ?? ""}
                        onChange={(e) => updateIntegration("google_client_id", e.target.value)}
                        placeholder="Optional"
                      />
                    </div>
                  </div>
                </section>
                <section className="space-y-4 border-t pt-5">
                  <div>
                    <h3 className="text-sm font-semibold">Verification Providers</h3>
                    <p className="text-xs text-muted-foreground">
                      The Laravel API resolves the active provider. Website and Flutter never call a
                      provider directly, and there is no automatic fallback.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label>GST verification provider</Label>
                      <select
                        value={integrationSettings.gst_verification_provider ?? "SANDBOX"}
                        onChange={(e) =>
                          updateIntegration("gst_verification_provider", e.target.value)
                        }
                        className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                      >
                        <option value="SANDBOX">Sandbox</option>
                        <option value="CASHFREE">Cashfree</option>
                      </select>
                      <p className="text-xs text-muted-foreground">
                        Active:{" "}
                        {integrationSettings.verification_providers?.gst?.active_provider ??
                          "SANDBOX"}
                      </p>
                    </div>
                    <div className="space-y-1.5">
                      <Label>KYC verification provider</Label>
                      <select
                        value={integrationSettings.kyc_verification_provider ?? "SANDBOX"}
                        onChange={(e) =>
                          updateIntegration("kyc_verification_provider", e.target.value)
                        }
                        className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                      >
                        <option value="SANDBOX">Sandbox</option>
                        <option value="CASHFREE">Cashfree</option>
                      </select>
                      <p className="text-xs text-muted-foreground">
                        Active:{" "}
                        {integrationSettings.verification_providers?.kyc?.active_provider ??
                          "SANDBOX"}
                      </p>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Bank verification provider</Label>
                      <select
                        value={integrationSettings.bank_verification_provider ?? "SANDBOX"}
                        onChange={(e) =>
                          updateIntegration("bank_verification_provider", e.target.value)
                        }
                        className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                      >
                        <option value="SANDBOX">Sandbox</option>
                        <option value="CASHFREE">Cashfree</option>
                      </select>
                      <p className="text-xs text-muted-foreground">
                        Active:{" "}
                        {integrationSettings.verification_providers?.bank?.active_provider ??
                          "SANDBOX"}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                    {(["gst", "kyc", "bank"] as const).map((type) => (
                      <div key={type} className="rounded-lg border bg-muted/20 p-3 text-xs">
                        <p className="font-medium">
                          {type === "gst" ? "GST" : type === "kyc" ? "KYC" : "Bank"} provider
                          readiness
                        </p>
                        <div className="mt-2 grid grid-cols-2 gap-2">
                          {(["sandbox", "cashfree"] as const).map((provider) => {
                            const status =
                              integrationSettings.verification_providers?.[type]?.providers?.[
                                provider
                              ];
                            return (
                              <span key={provider} className="rounded-md border px-2 py-1">
                                {provider === "sandbox" ? "Sandbox" : "Cashfree"}:{" "}
                                {status?.status ?? "UNKNOWN"}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="rounded-xl border border-sky-200 bg-sky-50/60 p-4">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div>
                        <h4 className="text-sm font-semibold text-sky-950">Sandbox.co.in</h4>
                        <p className="text-xs text-sky-900/70">
                          Current default for GST, KYC, and bank verification. Credentials stay
                          encrypted on Laravel.
                        </p>
                      </div>
                      <Switch
                        checked={Boolean(integrationSettings.sandbox_verification_enabled)}
                        onCheckedChange={(value) =>
                          updateIntegration("sandbox_verification_enabled", value)
                        }
                      />
                    </div>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label>Environment</Label>
                        <select
                          value={integrationSettings.sandbox_verification_environment ?? "test"}
                          onChange={(e) =>
                            updateIntegration("sandbox_verification_environment", e.target.value)
                          }
                          className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                        >
                          <option value="test">Test</option>
                          <option value="live">Live</option>
                        </select>
                      </div>
                      {secretInput("sandbox_verification_api_key", "API Key")}
                      {secretInput("sandbox_verification_api_secret", "API Secret")}
                      <div className="space-y-1.5">
                        <Label>API base URL (optional)</Label>
                        <Input
                          value={integrationSettings.sandbox_verification_base_url ?? ""}
                          onChange={(e) =>
                            updateIntegration("sandbox_verification_base_url", e.target.value)
                          }
                          placeholder="Uses the selected Sandbox environment"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Timeout (seconds)</Label>
                        <Input
                          type="number"
                          min={5}
                          max={120}
                          value={integrationSettings.sandbox_verification_timeout ?? 30}
                          onChange={(e) =>
                            updateIntegration("sandbox_verification_timeout", e.target.value)
                          }
                        />
                      </div>
                    </div>
                    <div className="mt-4 grid grid-cols-1 gap-2 md:grid-cols-[1fr_auto]">
                      <Input
                        aria-label="Sandbox GSTIN test value"
                        placeholder="GSTIN for configuration test"
                        value={verificationTestGstin}
                        onChange={(e) => setVerificationTestGstin(e.target.value)}
                      />
                      <Button
                        variant="outline"
                        onClick={() => testVerification("GSTIN")}
                        disabled={verificationTesting !== null}
                      >
                        {verificationTesting === "GSTIN" ? "Testing…" : "Test GST Configuration"}
                      </Button>
                    </div>
                    <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-[1fr_1fr_1fr_auto]">
                      <Input
                        aria-label="KYC PAN test value"
                        placeholder="PAN"
                        value={verificationTestPan}
                        onChange={(e) => setVerificationTestPan(e.target.value)}
                      />
                      <Input
                        aria-label="KYC name test value"
                        placeholder="Name as per PAN"
                        value={verificationTestName}
                        onChange={(e) => setVerificationTestName(e.target.value)}
                      />
                      <Input
                        aria-label="KYC date of birth test value"
                        type="date"
                        value={verificationTestDob}
                        onChange={(e) => setVerificationTestDob(e.target.value)}
                      />
                      <Button
                        variant="outline"
                        onClick={() => testVerification("KYC")}
                        disabled={verificationTesting !== null}
                      >
                        {verificationTesting === "KYC" ? "Testing…" : "Test KYC Configuration"}
                      </Button>
                    </div>
                    <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-[1fr_1fr_1fr_auto]">
                      <Input
                        aria-label="Bank account test value"
                        placeholder="Bank account number"
                        value={verificationTestBankAccount}
                        onChange={(e) => setVerificationTestBankAccount(e.target.value)}
                      />
                      <Input
                        aria-label="Bank IFSC test value"
                        placeholder="IFSC"
                        value={verificationTestIfsc}
                        onChange={(e) => setVerificationTestIfsc(e.target.value)}
                      />
                      <Input
                        aria-label="Bank account holder test value"
                        placeholder="Account holder name (optional)"
                        value={verificationTestName}
                        onChange={(e) => setVerificationTestName(e.target.value)}
                      />
                      <Button
                        variant="outline"
                        onClick={() => testVerification("BANK")}
                        disabled={verificationTesting !== null}
                      >
                        {verificationTesting === "BANK" ? "Testing…" : "Test Bank Configuration"}
                      </Button>
                    </div>
                  </div>
                </section>
                <section className="space-y-3 border-t pt-5">
                  <h3 className="text-sm font-semibold">Cashfree Secure ID (alternative)</h3>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div className="flex items-center justify-between rounded-lg border p-3">
                      <Label>Provider enabled</Label>
                      <Switch
                        checked={Boolean(integrationSettings.cashfree_secure_id_enabled)}
                        onCheckedChange={(value) =>
                          updateIntegration("cashfree_secure_id_enabled", value)
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Environment</Label>
                      <select
                        value={integrationSettings.cashfree_secure_id_environment ?? "sandbox"}
                        onChange={(e) =>
                          updateIntegration("cashfree_secure_id_environment", e.target.value)
                        }
                        className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                      >
                        <option value="sandbox">Sandbox</option>
                        <option value="production">Production</option>
                      </select>
                    </div>
                    {secretInput("cashfree_secure_id_client_id", "Client ID")}
                    {secretInput("cashfree_secure_id_client_secret", "Client Secret")}
                    <div className="space-y-1.5">
                      <Label>Base URL</Label>
                      <Input
                        value={integrationSettings.cashfree_secure_id_base_url ?? ""}
                        onChange={(e) =>
                          updateIntegration("cashfree_secure_id_base_url", e.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Timeout (seconds)</Label>
                      <Input
                        type="number"
                        min={5}
                        max={120}
                        value={integrationSettings.cashfree_secure_id_timeout ?? 30}
                        onChange={(e) =>
                          updateIntegration("cashfree_secure_id_timeout", e.target.value)
                        }
                      />
                    </div>
                  </div>
                </section>
                <section className="space-y-3 border-t pt-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold">Cashfree Payment Gateway</h3>
                      <p className="text-xs text-muted-foreground">Credentials stay encrypted on Laravel. Test mode is selected by default.</p>
                    </div>
                    <Switch
                      checked={Boolean(integrationSettings.cashfree_pg_enabled)}
                      onCheckedChange={(value) => updateIntegration("cashfree_pg_enabled", value)}
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label>Environment</Label>
                      <select
                        value={integrationSettings.cashfree_pg_environment ?? "test"}
                        onChange={(e) => updateIntegration("cashfree_pg_environment", e.target.value)}
                        className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                      >
                        <option value="test">Test / Sandbox</option>
                        <option value="production">Production</option>
                      </select>
                    </div>
                    {secretInput("cashfree_pg_client_id", "Client ID / App ID")}
                    {secretInput("cashfree_pg_client_secret", "Client Secret")}
                    <div className="space-y-1.5">
                      <Label>API version</Label>
                      <Input value={integrationSettings.cashfree_pg_api_version ?? "2025-01-01"} onChange={(e) => updateIntegration("cashfree_pg_api_version", e.target.value)} />
                    </div>
                  </div>
                  <div className="flex flex-wrap justify-end gap-2">
                    <Button variant="outline" onClick={testCashfreePayment} disabled={cashfreePaymentTesting || integrationSaving}>
                      {cashfreePaymentTesting ? "Testing…" : "Test Cashfree Payment (₹10)"}
                    </Button>
                  </div>
                  <p className="text-xs text-amber-700">The test creates an order only. Complete checkout only in Test/Sandbox; Production orders can create real payment obligations.</p>
                </section>
                <section className="space-y-3 border-t pt-5">
                  <h3 className="text-sm font-semibold">Pusher / WebSocket</h3>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label>App ID</Label>
                      <Input
                        value={integrationSettings.pusher_app_id ?? ""}
                        onChange={(e) => updateIntegration("pusher_app_id", e.target.value)}
                      />
                    </div>
                    {secretInput("pusher_app_key", "App Key")}
                    {secretInput("pusher_app_secret", "App Secret")}
                    <div className="space-y-1.5">
                      <Label>Cluster</Label>
                      <Input
                        value={integrationSettings.pusher_cluster ?? ""}
                        onChange={(e) => updateIntegration("pusher_cluster", e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Host</Label>
                      <Input
                        value={integrationSettings.pusher_host ?? ""}
                        onChange={(e) => updateIntegration("pusher_host", e.target.value)}
                        placeholder="Optional"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Port</Label>
                      <Input
                        type="number"
                        min={1}
                        max={65535}
                        value={integrationSettings.pusher_port ?? 443}
                        onChange={(e) => updateIntegration("pusher_port", e.target.value)}
                      />
                    </div>
                  </div>
                </section>
                <section className="space-y-3 border-t pt-5">
                  <h3 className="text-sm font-semibold">AWS / S3 Storage</h3>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label>Storage Disk</Label>
                      <select
                        value={integrationSettings.filesystem_disk ?? "local"}
                        onChange={(e) => updateIntegration("filesystem_disk", e.target.value)}
                        className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                      >
                        <option value="local">Local</option>
                        <option value="public">Public</option>
                        <option value="s3">Amazon S3</option>
                      </select>
                    </div>
                    {secretInput("aws_access_key_id", "AWS Access Key ID")}
                    {secretInput("aws_secret_access_key", "AWS Secret Access Key")}
                    <div className="space-y-1.5">
                      <Label>AWS Region</Label>
                      <Input
                        value={integrationSettings.aws_region ?? ""}
                        onChange={(e) => updateIntegration("aws_region", e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>S3 Bucket</Label>
                      <Input
                        value={integrationSettings.aws_bucket ?? ""}
                        onChange={(e) => updateIntegration("aws_bucket", e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>S3 Endpoint</Label>
                      <Input
                        value={integrationSettings.aws_endpoint ?? ""}
                        onChange={(e) => updateIntegration("aws_endpoint", e.target.value)}
                        placeholder="Optional"
                      />
                    </div>
                    <div className="flex items-center justify-between rounded-lg border p-3">
                      <Label>Use path-style endpoints</Label>
                      <Switch
                        checked={Boolean(integrationSettings.aws_use_path_style_endpoints)}
                        onCheckedChange={(value) =>
                          updateIntegration("aws_use_path_style_endpoints", value)
                        }
                      />
                    </div>
                  </div>
                </section>
                <div className="flex justify-end border-t pt-4">
                  <Button
                    onClick={saveIntegrationSettings}
                    disabled={integrationSaving}
                    className="bg-violet-600 text-white hover:bg-violet-700"
                  >
                    {integrationSaving ? "Saving…" : "Save Integration Settings"}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card id="settings-kyb" className="scroll-mt-6 overflow-hidden rounded-2xl border-2 border-t-4 border-t-sky-500 border-border/70 bg-card shadow-[0_4px_14px_rgba(15,23,42,0.08)] transition-shadow duration-200 hover:shadow-[0_8px_22px_rgba(15,23,42,0.12)]">
          <CardHeader
            className="relative cursor-pointer bg-sky-50/80 pb-3 pr-12"
            onClick={() => toggleSection("kyb")}
          >
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-sky-600" />
              <CardTitle className="text-base">Business Verification (KYB)</CardTitle>
            </div>
            <CardDescription>
              Global gates and name-match thresholds used by the Laravel auction eligibility
              service.
            </CardDescription>
            {sectionToggle("kyb", "Business Verification")}
          </CardHeader>
          <CardContent className={`space-y-3 pt-0 ${expandedSection === "kyb" ? "" : "hidden"}`}>
            <div className="flex items-center justify-between">
              <Label className="text-sm">Require KYB for sellers</Label>
              <Switch checked={sellerKybRequired} onCheckedChange={setSellerKybRequired} />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-sm">Require KYB for participants</Label>
              <Switch
                checked={participantKybRequired}
                onCheckedChange={setParticipantKybRequired}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Auto-approve name score</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={kybAutoMatch}
                  onChange={(e) => setKybAutoMatch(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Review name score</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={kybReviewMatch}
                  onChange={(e) => setKybReviewMatch(e.target.value)}
                />
              </div>
            </div>
            <div className="flex justify-end border-t pt-4">
              <Button
                onClick={handleSave}
                disabled={savingConfig || loadingConfig}
                className="bg-sky-600 text-white hover:bg-sky-700"
              >
                Save KYB Settings
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Live Auction Engine Rules */}
        <Card id="settings-auction" className="scroll-mt-6 overflow-hidden rounded-2xl border-2 border-t-4 border-t-amber-500 border-border/70 bg-card shadow-[0_4px_14px_rgba(15,23,42,0.08)] transition-shadow duration-200 hover:shadow-[0_8px_22px_rgba(15,23,42,0.12)]">
          <CardHeader
            className="relative cursor-pointer bg-amber-50/80 pb-3 pr-12"
            onClick={() => toggleSection("auction")}
          >
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-amber-600" />
              <CardTitle className="text-base">Live Auction & Anti-Sniping</CardTitle>
            </div>
            <CardDescription>
              Timing thresholds enforced by backend transaction locks.
            </CardDescription>
            {sectionToggle("auction", "Live Auction & Anti-Sniping")}
          </CardHeader>
          <CardContent
            className={`space-y-3 pt-0 ${expandedSection === "auction" ? "" : "hidden"}`}
          >
            <div className="space-y-1.5">
              <Label htmlFor="auction-edit-lock" className="text-xs font-medium">
                Auction Edit Lock (hours)
              </Label>
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
              <p className="text-xs text-muted-foreground">
                Sellers can edit an auction until this many hours before it starts. Maximum: 168
                hours.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="anti-snipe-win" className="text-xs font-medium">
                  Trigger Window (seconds)
                </Label>
                <Input
                  id="anti-snipe-win"
                  type="number"
                  value={antiSnipeWindow}
                  onChange={(e) => setAntiSnipeWindow(e.target.value)}
                  className="text-sm font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="anti-snipe-ext" className="text-xs font-medium">
                  Extension Duration (seconds)
                </Label>
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
                <p className="text-xs text-muted-foreground">
                  Trigger escrow forfeiture when acceptance window expires
                </p>
              </div>
              <Switch checked={autoForfeitEmd} onCheckedChange={setAutoForfeitEmd} />
            </div>
            <div className="flex justify-end border-t pt-4">
              <Button
                onClick={handleSave}
                disabled={savingConfig || loadingConfig}
                className="bg-amber-600 text-white hover:bg-amber-700"
              >
                Save Auction Settings
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Security & Access Policies */}
        <Card id="settings-security" className="scroll-mt-6 overflow-hidden rounded-2xl border-2 border-t-4 border-t-rose-500 border-border/70 bg-card shadow-[0_4px_14px_rgba(15,23,42,0.08)] transition-shadow duration-200 hover:shadow-[0_8px_22px_rgba(15,23,42,0.12)]">
          <CardHeader
            className="relative cursor-pointer bg-rose-50/80 pb-3 pr-12"
            onClick={() => toggleSection("security")}
          >
            <div className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-rose-600" />
              <CardTitle className="text-base">Security & Authentication</CardTitle>
            </div>
            <CardDescription>Platform-wide session and MFA enforcement policies.</CardDescription>
            {sectionToggle("security", "Security & Authentication")}
          </CardHeader>
          <CardContent
            className={`space-y-3 pt-0 ${expandedSection === "security" ? "" : "hidden"}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Mandatory MFA for Staff & Admin</p>
                <p className="text-xs text-muted-foreground">
                  Require OTP / Authenticator app on every staff login
                </p>
              </div>
              <Switch checked={mfaMandatory} onCheckedChange={setMfaMandatory} />
            </div>
            <div className="space-y-1.5 pt-2 border-t">
              <Label className="text-xs font-medium">Admin Session Inactivity Timeout</Label>
              <Input value="" placeholder="Not configured by API" readOnly className="text-sm" />
            </div>
            <div className="flex justify-end border-t pt-4">
              <Button
                onClick={handleSave}
                disabled={savingConfig || loadingConfig}
                className="bg-rose-600 text-white hover:bg-rose-700"
              >
                Save Security Settings
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Notification Gateways */}
        <Card id="settings-notifications" className="scroll-mt-6 overflow-hidden rounded-2xl border-2 border-t-4 border-t-cyan-500 border-border/70 bg-card shadow-[0_4px_14px_rgba(15,23,42,0.08)] transition-shadow duration-200 hover:shadow-[0_8px_22px_rgba(15,23,42,0.12)]">
          <CardHeader
            className="relative cursor-pointer bg-cyan-50/80 pb-3 pr-12"
            onClick={() => toggleSection("notifications")}
          >
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-cyan-600" />
              <CardTitle className="text-base">Broadcast & Notification Channels</CardTitle>
            </div>
            <CardDescription>Real-time outbid and auction status delivery options.</CardDescription>
            {sectionToggle("notifications", "Broadcast & Notification Channels")}
          </CardHeader>
          <CardContent
            className={`space-y-3 pt-0 ${expandedSection === "notifications" ? "" : "hidden"}`}
          >
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
            <div className="flex justify-end border-t pt-4">
              <Button
                onClick={handleSave}
                disabled={savingConfig || loadingConfig}
                className="bg-cyan-600 text-white hover:bg-cyan-700"
              >
                Save Notification Settings
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
