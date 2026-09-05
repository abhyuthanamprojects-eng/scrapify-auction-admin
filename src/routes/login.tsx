import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ShieldCheck,
  Lock,
  Mail,
  KeyRound,
  ArrowRight,
  Eye,
  EyeOff,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Staff Login — Scrapify Auctions Operations Console" },
      {
        name: "description",
        content: "Sign in with your authorized staff credentials to access the Scrapify Auctions Operations Console.",
      },
      { property: "og:title", content: "Staff Login | Scrapify Auctions Operations Console" },
      { property: "og:description", content: "Authorized access for platform administrators, auctioneers, compliance officers, and treasury controllers." },
    ],
  }),
  component: AdminLoginPage,
});

function AdminLoginPage() {
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password.trim()) {
      setError("Please enter your email and password.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await login(identifier.trim(), password);
      if (typeof window !== "undefined") {
        window.location.href = "/";
      }
    } catch (err: any) {
      const message = err?.message || "Login failed. Please check your credentials and try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 md:p-10 bg-[#0B132B] text-slate-100 relative overflow-hidden font-sans selection:bg-amber-500 selection:text-slate-900">
      {/* Ambient background glows */}
      <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-gradient-to-br from-amber-500/15 via-orange-600/10 to-transparent rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-[600px] h-[600px] bg-gradient-to-tl from-emerald-500/10 via-cyan-600/10 to-transparent rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293d0f_1px,transparent_1px),linear-gradient(to_bottom,#1f293d0f_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
        {/* Left Column: Brand & Security Guarantee */}
        <div className="lg:col-span-5 space-y-6 text-left hidden lg:block">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-400 font-semibold text-xs tracking-wide">
              <span className="h-2 w-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)] animate-pulse" />
              SCRAPIFY AUCTIONS ENTERPRISE
            </div>

            <h1 className="text-3xl xl:text-4xl font-black text-white tracking-tight font-display leading-[1.15]">
              Operations <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-300 to-orange-400">
                Command Console
              </span>
            </h1>

            <p className="text-sm text-slate-400 leading-relaxed font-normal">
              High-throughput B2B industrial scrap asset liquidation, forward/reverse live floor control, automated OCR KYB verification, and escrow settlement governance.
            </p>
          </div>

          {/* Compliance Badges */}
          <div className="space-y-2 pt-1 border-t border-slate-800/80 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>NABL &amp; GSTN Compliant Automated OCR Pipeline</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>SOC-2 Type II Immutable Audit Ledger</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>Dual-Factor Hardware &amp; TOTP Authentication</span>
            </div>
          </div>
        </div>

        {/* Right Column: Sign In Card */}
        <div className="lg:col-span-7">
          <Card className="border border-slate-800/90 bg-slate-900/90 backdrop-blur-2xl shadow-2xl rounded-2xl overflow-hidden text-slate-100 relative">
            {/* Top Accent Gold Bar */}
            <div className="h-1.5 w-full bg-gradient-to-r from-amber-400 via-orange-500 to-amber-500" />

            <CardHeader className="pb-4 pt-6 px-6 sm:px-8">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl sm:text-2xl font-black text-white tracking-tight font-display">
                    Authorized Staff Access
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-400 mt-1">
                    Sign in with your enterprise credentials.
                  </CardDescription>
                </div>
                <div className="h-10 w-10 overflow-hidden rounded-xl bg-white border border-amber-500/25 flex items-center justify-center shrink-0">
                  <img src="/scrapify-auction-app-icon.png" alt="Scrapify Auctions" className="h-full w-full object-contain" />
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-5 px-6 sm:px-8">
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2.5">
                    <AlertCircle className="h-4 w-4 text-red-400 mt-0.5 shrink-0" />
                    <p className="text-xs text-red-300 leading-relaxed">{error}</p>
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs font-semibold text-slate-200">
                    Email Address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      id="email"
                      type="email"
                      required
                      autoComplete="email"
                      value={identifier}
                      onChange={(e) => { setIdentifier(e.target.value); setError(null); }}
                      placeholder="you@scrapifyauctions.com"
                      className="pl-10 h-10 text-sm bg-slate-950/60 border-slate-800 text-white placeholder:text-slate-500 focus-visible:border-amber-500 focus-visible:ring-amber-500/20 rounded-xl"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-xs font-semibold text-slate-200">
                      Password
                    </Label>
                  </div>
                  <div className="relative">
                    <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      required
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setError(null); }}
                      placeholder="••••••••••••"
                      className="pl-10 pr-10 h-10 text-sm bg-slate-950/60 border-slate-800 text-white placeholder:text-slate-500 focus-visible:border-amber-500 focus-visible:ring-amber-500/20 rounded-xl font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-end text-xs pt-1">
                  <span className="text-slate-400 flex items-center gap-1 font-mono text-[11px]">
                    <Lock className="h-3 w-3 text-emerald-400" /> TLS 1.3 / 256-bit
                  </span>
                </div>

                <Button
                  type="submit"
                  disabled={loading || !identifier.trim() || !password.trim()}
                  className="w-full h-11 bg-gradient-to-r from-amber-500 via-amber-400 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-sm rounded-xl gap-2 shadow-lg shadow-amber-500/20 transition-all font-sans disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <div className="h-4 w-4 rounded-full border-2 border-slate-950 border-t-transparent animate-spin" />
                      Authenticating…
                    </>
                  ) : (
                    <>
                      Sign In
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>
            </CardContent>

            <CardFooter className="bg-slate-950/60 px-6 sm:px-8 py-3.5 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5 text-[11px]">
                <ShieldCheck className="h-4 w-4 text-emerald-400" /> SOC-2 Type II · ISO 27001 Certified
              </span>
              <span className="font-mono text-[11px] text-slate-500">v2.4.0-enterprise</span>
            </CardFooter>
          </Card>

          <p className="text-center text-[11px] text-slate-500 mt-4">
            © {new Date().getFullYear()} Scrapify Auctions Ltd. All operations are cryptographically signed &amp; audited.
          </p>
        </div>
      </div>
    </div>
  );
}
