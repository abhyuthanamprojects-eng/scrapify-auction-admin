import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Smartphone, Save, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { adminApi } from "@/lib/api-client";

export const Route = createFileRoute("/settings/mobile")({
  component: MobileConfigPage,
});

function MobileConfigPage() {
  const [saved, setSaved] = useState(false);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [savingConfig, setSavingConfig] = useState(false);

  const [iosMinVersion, setIosMinVersion] = useState("1.0.0");
  const [iosLatestVersion, setIosLatestVersion] = useState("1.0.0");
  const [iosForceUpdate, setIosForceUpdate] = useState(false);
  const [androidMinVersion, setAndroidMinVersion] = useState("1.0.0");
  const [androidLatestVersion, setAndroidLatestVersion] = useState("1.0.0");
  const [androidForceUpdate, setAndroidForceUpdate] = useState(false);
  const [mobileUpdateNotes, setMobileUpdateNotes] = useState("");

  const [appStoreUrl, setAppStoreUrl] = useState("");
  const [playStoreUrl, setPlayStoreUrl] = useState("");
  const [appTagline, setAppTagline] = useState("Bid on the go — anytime, anywhere");
  const [appDescription, setAppDescription] = useState("Browse live auctions, place bids in real-time, track orders, and manage your auction portfolio — all from your mobile device.");

  useEffect(() => {
    adminApi
      .getPlatformConfig()
      .then((response) => {
        const config = response?.data ?? response;
        if (config?.ios_min_version) setIosMinVersion(String(config.ios_min_version));
        if (config?.ios_latest_version) setIosLatestVersion(String(config.ios_latest_version));
        if (config?.ios_force_update !== undefined) setIosForceUpdate(Boolean(config.ios_force_update));
        if (config?.android_min_version) setAndroidMinVersion(String(config.android_min_version));
        if (config?.android_latest_version) setAndroidLatestVersion(String(config.android_latest_version));
        if (config?.android_force_update !== undefined) setAndroidForceUpdate(Boolean(config.android_force_update));
        if (config?.mobile_update_notes) setMobileUpdateNotes(String(config.mobile_update_notes));
        const ma = config?.mobile_app;
        if (ma) {
          if (ma.app_store_url) setAppStoreUrl(String(ma.app_store_url));
          if (ma.play_store_url) setPlayStoreUrl(String(ma.play_store_url));
          if (ma.app_tagline) setAppTagline(String(ma.app_tagline));
          if (ma.app_description) setAppDescription(String(ma.app_description));
        }
      })
      .catch(() => toast.error("Could not load mobile configuration."))
      .finally(() => setLoadingConfig(false));
  }, []);

  const handleSave = async () => {
    const versionRegex = /^\d+\.\d+\.\d+$/;
    if (!versionRegex.test(iosMinVersion) || !versionRegex.test(iosLatestVersion)) {
      toast.error("iOS versions must be in x.y.z format.");
      return;
    }
    if (!versionRegex.test(androidMinVersion) || !versionRegex.test(androidLatestVersion)) {
      toast.error("Android versions must be in x.y.z format.");
      return;
    }

    setSavingConfig(true);
    try {
      await adminApi.updatePlatformConfig({
        ios_min_version: iosMinVersion,
        ios_latest_version: iosLatestVersion,
        ios_force_update: iosForceUpdate,
        android_min_version: androidMinVersion,
        android_latest_version: androidLatestVersion,
        android_force_update: androidForceUpdate,
        mobile_update_notes: mobileUpdateNotes,
        app_store_url: appStoreUrl || null,
        play_store_url: playStoreUrl || null,
        app_tagline: appTagline || null,
        app_description: appDescription || null,
      });
      setSaved(true);
      toast.success("Mobile configuration saved.");
      setTimeout(() => setSaved(false), 2500);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save mobile configuration.");
    } finally {
      setSavingConfig(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Version Control Card */}
      <Card className="overflow-hidden rounded-2xl border-2 border-t-4 border-t-[color:var(--navy)] border-border/70 bg-card shadow-[0_4px_14px_rgba(15,23,42,0.08)]">
        <CardHeader className="bg-[color:var(--navy)] pb-3 text-white">
          <div className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-orange-300" />
            <CardTitle className="text-base">Mobile App Version Control</CardTitle>
          </div>
          <CardDescription className="text-white/70">
            Manage minimum supported versions and force update settings for iOS and Android.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5 pt-5">
          {/* iOS Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
              </svg>
              <h3 className="text-sm font-semibold">iOS (App Store)</h3>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Minimum supported version</Label>
                <Input value={iosMinVersion} onChange={(e) => setIosMinVersion(e.target.value)} placeholder="1.0.0" disabled={loadingConfig} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Latest version</Label>
                <Input value={iosLatestVersion} onChange={(e) => setIosLatestVersion(e.target.value)} placeholder="1.0.0" disabled={loadingConfig} />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3 md:col-span-2">
                <div>
                  <Label>Force update (iOS)</Label>
                  <p className="text-xs text-muted-foreground">Users below minimum version must update before using the app.</p>
                </div>
                <Switch checked={iosForceUpdate} onCheckedChange={setIosForceUpdate} disabled={loadingConfig} />
              </div>
            </div>
          </div>

          {/* Android Section */}
          <div className="space-y-3 border-t pt-4">
            <div className="flex items-center gap-2">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="#3DDC84">
                <path d="M17.523 2.277a.625.625 0 0 0-.855.217l-1.103 1.872a7.26 7.26 0 0 0-7.128 0L7.334 2.494a.626.626 0 1 0-1.073.638l1.065 1.808A7.017 7.017 0 0 0 4 11h16a7.017 7.017 0 0 0-3.326-5.96l1.065-1.808a.625.625 0 0 0-.216-.855zM8.5 8.5a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5zm7 0a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5zM4 12.5v6a1.5 1.5 0 0 0 1.5 1.5H7v2.5a1.25 1.25 0 1 0 2.5 0V20h5v2.5a1.25 1.25 0 1 0 2.5 0V20h1.5a1.5 1.5 0 0 0 1.5-1.5v-6H4zm-2.25 0a1.25 1.25 0 0 0-1.25 1.25v4.5a1.25 1.25 0 1 0 2.5 0v-4.5A1.25 1.25 0 0 0 1.75 12.5zm20.5 0a1.25 1.25 0 0 0-1.25 1.25v4.5a1.25 1.25 0 1 0 2.5 0v-4.5a1.25 1.25 0 0 0-1.25-1.25z"/>
              </svg>
              <h3 className="text-sm font-semibold">Android (Google Play)</h3>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Minimum supported version</Label>
                <Input value={androidMinVersion} onChange={(e) => setAndroidMinVersion(e.target.value)} placeholder="1.0.0" disabled={loadingConfig} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Latest version</Label>
                <Input value={androidLatestVersion} onChange={(e) => setAndroidLatestVersion(e.target.value)} placeholder="1.0.0" disabled={loadingConfig} />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3 md:col-span-2">
                <div>
                  <Label>Force update (Android)</Label>
                  <p className="text-xs text-muted-foreground">Users below minimum version must update before using the app.</p>
                </div>
                <Switch checked={androidForceUpdate} onCheckedChange={setAndroidForceUpdate} disabled={loadingConfig} />
              </div>
            </div>
          </div>

          {/* Release Notes */}
          <div className="space-y-1.5 border-t pt-4">
            <Label className="text-xs font-medium">Release Notes (shown to users)</Label>
            <Input value={mobileUpdateNotes} onChange={(e) => setMobileUpdateNotes(e.target.value)} placeholder="What's new in this version" disabled={loadingConfig} />
          </div>
        </CardContent>
      </Card>

      {/* Store Links Card */}
      <Card className="overflow-hidden rounded-2xl border-2 border-t-4 border-t-[color:var(--auction)] border-border/70 bg-card shadow-[0_4px_14px_rgba(15,23,42,0.08)]">
        <CardHeader className="bg-[color:var(--auction)] pb-3 text-white">
          <div className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-white" />
            <CardTitle className="text-base">App Store Links & Website Content</CardTitle>
          </div>
          <CardDescription className="text-white/80">
            Store URLs displayed on the public website. Leave empty to show "Coming soon".
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-5">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">App Store URL (iOS)</Label>
              <Input value={appStoreUrl} onChange={(e) => setAppStoreUrl(e.target.value)} placeholder="https://apps.apple.com/app/..." disabled={loadingConfig} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Play Store URL (Android)</Label>
              <Input value={playStoreUrl} onChange={(e) => setPlayStoreUrl(e.target.value)} placeholder="https://play.google.com/store/apps/details?id=..." disabled={loadingConfig} />
            </div>
          </div>
          <div className="space-y-1.5 border-t pt-4">
            <Label className="text-xs font-medium">App Tagline</Label>
            <Input value={appTagline} onChange={(e) => setAppTagline(e.target.value)} placeholder="Bid on the go — anytime, anywhere" disabled={loadingConfig} />
            <p className="text-xs text-muted-foreground">Heading text for the mobile app section on the website.</p>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">App Description</Label>
            <Input value={appDescription} onChange={(e) => setAppDescription(e.target.value)} placeholder="Short description for the mobile app section" disabled={loadingConfig} />
            <p className="text-xs text-muted-foreground">Description text shown below the tagline on the website.</p>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={savingConfig || loadingConfig} className="gap-2 bg-[color:var(--navy)] text-white hover:brightness-110">
          {saved ? <CheckCircle2 className="h-4 w-4" /> : <Save className="h-4 w-4" />}
          {saved ? "Saved" : "Save Mobile Settings"}
        </Button>
      </div>
    </div>
  );
}
