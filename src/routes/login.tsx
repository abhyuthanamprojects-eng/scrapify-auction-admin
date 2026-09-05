import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Mail,
  KeyRound,
  ArrowRight,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Staff Login — Scrapify Auctions" },
      {
        name: "description",
        content: "Sign in to the Scrapify Auctions admin console.",
      },
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
    <div className="min-h-screen w-full flex bg-white">
      {/* Left: Illustration Panel */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 items-center justify-center overflow-hidden">
        {/* Decorative shapes */}
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-10 left-10 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-400/5 rounded-full blur-2xl" />
        </div>

        <div className="relative z-10 px-12 xl:px-16 max-w-lg text-center">
          <div className="mx-auto mb-8 h-20 w-20 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center shadow-2xl">
            <img
              src="/scrapify-auction-app-icon.png"
              alt="Scrapify"
              className="h-14 w-14 object-contain"
            />
          </div>

          <h1 className="text-3xl xl:text-4xl font-bold text-white tracking-tight leading-tight">
            Scrapify Auctions
          </h1>
          <p className="mt-2 text-lg text-amber-400 font-semibold">
            Operations Console
          </p>
          <p className="mt-4 text-sm text-slate-400 leading-relaxed">
            Manage auctions, vendors, compliance, and settlements — all from one unified admin dashboard.
          </p>

          {/* Feature highlights */}
          <div className="mt-10 grid grid-cols-2 gap-4 text-left">
            {[
              { label: "Live Auctions", desc: "Real-time bidding control" },
              { label: "Vendor Management", desc: "KYB verification & approval" },
              { label: "Finance", desc: "Settlements & reconciliation" },
              { label: "Compliance", desc: "Audit logs & governance" },
            ].map((item) => (
              <div key={item.label} className="rounded-xl bg-white/5 border border-white/10 p-3">
                <p className="text-sm font-semibold text-white">{item.label}</p>
                <p className="text-xs text-slate-400 mt-0.5">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom copyright */}
        <p className="absolute bottom-6 left-0 right-0 text-center text-[11px] text-slate-500">
          © {new Date().getFullYear()} Scrapify Auctions Ltd.
        </p>
      </div>

      {/* Right: Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 sm:px-10 py-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="h-10 w-10 rounded-xl overflow-hidden bg-slate-100 flex items-center justify-center">
              <img
                src="/scrapify-auction-app-icon.png"
                alt="Scrapify"
                className="h-8 w-8 object-contain"
              />
            </div>
            <div>
              <p className="text-base font-bold text-slate-900">Scrapify Auctions</p>
              <p className="text-xs text-slate-500">Operations Console</p>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              Welcome back
            </h2>
            <p className="mt-1.5 text-sm text-slate-500">
              Sign in to your admin account to continue.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
                <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium text-slate-700">
                Email Address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={identifier}
                  onChange={(e) => { setIdentifier(e.target.value); setError(null); }}
                  placeholder="you@scrapifyauctions.com"
                  className="pl-10 h-11 text-sm bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus-visible:border-amber-500 focus-visible:ring-amber-500/20 rounded-lg"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm font-medium text-slate-700">
                Password
              </Label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(null); }}
                  placeholder="Enter your password"
                  className="pl-10 pr-10 h-11 text-sm bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus-visible:border-amber-500 focus-visible:ring-amber-500/20 rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading || !identifier.trim() || !password.trim()}
              className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm rounded-lg gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Signing in…
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          <p className="mt-8 text-center text-xs text-slate-400">
            Protected by enterprise-grade security. Contact your administrator if you need access.
          </p>
        </div>
      </div>
    </div>
  );
}
