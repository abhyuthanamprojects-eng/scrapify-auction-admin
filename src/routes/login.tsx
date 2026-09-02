import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  ShieldCheck,
  Lock,
  Mail,
  KeyRound,
  ArrowRight,
  Gavel,
  ShieldAlert,
  Building2,
  Wallet,
  Activity,
  CheckCircle2,
  Cpu,
  Sparkles,
  Eye,
  EyeOff,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { type AdminRole } from "@/lib/ops/roles";

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

const QUICK_ROLES: Array<{
  role: AdminRole;
  name: string;
  email: string;
  dept: string;
  badgeColor: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  {
    role: "Super Admin",
    name: "R. Iyer",
    email: "admin@scrapify.com",
    dept: "Master Platform Governance",
    badgeColor: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
    icon: ShieldCheck,
  },
  {
    role: "Operations",
    name: "Karan Johar",
    email: "ops@scrapify.com",
    dept: "Live Floor & Dynamic Extension",
    badgeColor: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30",
    icon: Gavel,
  },
  {
    role: "Compliance",
    name: "Ananya Sharma",
    email: "compliance@scrapify.com",
    dept: "Vendor KYB & OCR Vision Audits",
    badgeColor: "bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30",
    icon: ShieldAlert,
  },
  {
    role: "Finance",
    name: "Vikram Malhotra",
    email: "finance@scrapify.com",
    dept: "EMD Escrow & Payout Approvals",
    badgeColor: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
    icon: Wallet,
  },
  {
    role: "Auditor",
    name: "Rajesh Koothrappali",
    email: "auditor@scrapify.com",
    dept: "SOC-2 Immutable Ledger Review",
    badgeColor: "bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border-cyan-500/30",
    icon: Activity,
  },
];

function AdminLoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState("admin@scrapify.com");
  const [password, setPassword] = useState("Password@1234");
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<AdminRole>("Super Admin");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(identifier, selectedRole);
      if (typeof window !== "undefined") {
        window.location.href = "/";
      } else {
        navigate({ to: "/" });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (item: (typeof QUICK_ROLES)[number]) => {
    setIdentifier(item.email);
    setSelectedRole(item.role);
    setPassword("Password@1234");
    setLoading(true);
    try {
      await login(item.email, item.role, item.name);
      if (typeof window !== "undefined") {
        window.location.href = "/";
      } else {
        navigate({ to: "/" });
      }
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

          {/* KPI Mini-Tiles */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800/90 shadow-sm backdrop-blur">
              <p className="text-[11px] text-slate-400 font-medium">Platform Realization</p>
              <p className="text-lg font-black text-white mt-0.5 font-display">₹4,200 Cr+</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800/90 shadow-sm backdrop-blur">
              <p className="text-[11px] text-slate-400 font-medium">Live Floor Latency</p>
              <p className="text-lg font-black text-emerald-400 mt-0.5 font-mono">&lt; 50ms</p>
            </div>
          </div>

          {/* Compliance Badges */}
          <div className="space-y-2 pt-1 border-t border-slate-800/80 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>NABL &amp; GSTN Compliant Automated OCR Pipeline</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>SOC-2 Type II Immutable Audit Ledger</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
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
                    Sign in with your enterprise credentials or choose a pre-authorized role.
                  </CardDescription>
                </div>
                <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400 shrink-0">
                  <Gavel className="h-5 w-5" />
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-5 px-6 sm:px-8">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs font-semibold text-slate-200">
                    Official Staff Identifier / Email
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      id="email"
                      type="email"
                      required
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="admin@scrapify.com"
                      className="pl-10 h-10 text-sm bg-slate-950/60 border-slate-800 text-white placeholder:text-slate-500 focus-visible:border-amber-500 focus-visible:ring-amber-500/20 rounded-xl"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-xs font-semibold text-slate-200">
                      Security Password
                    </Label>
                    <span className="text-[11px] text-amber-400 hover:text-amber-300 hover:underline cursor-pointer font-medium">
                      Reset Key?
                    </span>
                  </div>
                  <div className="relative">
                    <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
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

                <div className="flex items-center justify-between text-xs pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-400 hover:text-slate-300">
                    <input
                      type="checkbox"
                      defaultChecked
                      className="rounded border-slate-700 bg-slate-800 text-amber-500 focus:ring-amber-500 h-3.5 w-3.5"
                    />
                    <span>Remember this workstation</span>
                  </label>
                  <span className="text-slate-400 flex items-center gap-1 font-mono text-[11px]">
                    <Lock className="h-3 w-3 text-emerald-400" /> TLS 1.3 / 256-bit
                  </span>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 bg-gradient-to-r from-amber-500 via-amber-400 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-sm rounded-xl gap-2 shadow-lg shadow-amber-500/20 transition-all font-sans"
                >
                  {loading ? "Authenticating Session…" : "Sign In to Operations Console"}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </form>

              {/* 1-Click Role Access Demo Grid */}
              <div className="pt-3 border-t border-slate-800/80 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Instant Demo Accounts (1-Click)
                  </span>
                  <Badge variant="outline" className="text-[10px] text-amber-400 border-amber-500/30 bg-amber-500/5">
                    Live Session
                  </Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {QUICK_ROLES.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.role}
                        type="button"
                        onClick={() => handleQuickLogin(item)}
                        className="flex items-start gap-2.5 p-2.5 rounded-xl border border-slate-800 bg-slate-950/40 hover:bg-slate-800/60 hover:border-amber-500/40 text-left transition-all group cursor-pointer"
                      >
                        <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 group-hover:border-amber-500/40 transition-colors shrink-0 mt-0.5">
                          <Icon className="h-4 w-4 text-amber-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-bold text-xs text-white group-hover:text-amber-300 transition-colors truncate">
                              {item.role}
                            </span>
                            <span className="text-[10px] text-slate-400 truncate">{item.name}</span>
                          </div>
                          <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5 font-normal">
                            {item.dept}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
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
