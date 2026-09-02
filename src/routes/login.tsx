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
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { type AdminRole } from "@/lib/ops/roles";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Staff Login — Scrapify Auctions Operations Console" },
      {
        name: "description",
        content: "Sign in with your authorized credentials to access the Scrapify Auctions Operations Console.",
      },
      { property: "og:title", content: "Staff Login | Scrapify Auctions" },
      { property: "og:description", content: "Sign in to the Scrapify Auctions Operations Console." },
    ],
  }),
  component: AdminLoginPage,
});

const QUICK_ROLES: Array<{
  role: AdminRole;
  name: string;
  email: string;
  desc: string;
  badgeColor: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  {
    role: "Super Admin",
    name: "R. Iyer",
    email: "admin@scrapifyauctions.com",
    desc: "Unrestricted Master Control & Governance",
    badgeColor: "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
    icon: ShieldCheck,
  },
  {
    role: "Operations",
    name: "Karan Johar",
    email: "ops@scrapifyauctions.com",
    desc: "Live Floor, Auctions & Floor Control",
    badgeColor: "bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30",
    icon: Gavel,
  },
  {
    role: "Compliance",
    name: "Ananya Sharma",
    email: "compliance@scrapifyauctions.com",
    desc: "Vendor KYB, OCR & Document Auditing",
    badgeColor: "bg-purple-500/20 text-purple-600 dark:text-purple-400 border-purple-500/30",
    icon: ShieldAlert,
  },
  {
    role: "Finance",
    name: "Vikram Malhotra",
    email: "finance@scrapifyauctions.com",
    desc: "EMD Escrow, Settlements & Ledger",
    badgeColor: "bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30",
    icon: Wallet,
  },
];

function AdminLoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState("admin@scrapifyauctions.com");
  const [password, setPassword] = useState("••••••••••••");
  const [selectedRole, setSelectedRole] = useState<AdminRole>("Super Admin");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(identifier, selectedRole);
      navigate({ to: "/" });
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (item: (typeof QUICK_ROLES)[number]) => {
    setIdentifier(item.email);
    setSelectedRole(item.role);
    setLoading(true);
    try {
      await login(item.email, item.role, item.name);
      navigate({ to: "/" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-center items-center p-4 sm:p-6 bg-gradient-to-br from-background via-muted/30 to-background relative overflow-hidden">
      {/* Decorative ambient background */}
      <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] rounded-full bg-accent/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] rounded-full bg-emerald-500/10 blur-[140px] pointer-events-none" />

      <div className="w-full max-w-xl space-y-6 relative z-10">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-accent font-semibold text-xs mb-1 shadow-sm">
            <span className="h-2 w-2 rounded-full bg-accent animate-pulse" />
            Scrapify Auctions Enterprise Suite
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight font-display">
            Operations Console
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto">
            Authorized access for platform administrators, auctioneers, compliance officers, and treasury controllers.
          </p>
        </div>

        {/* Main Login Card */}
        <Card className="border-border shadow-2xl backdrop-blur-xl bg-card/95 rounded-2xl overflow-hidden">
          <div className="h-1.5 w-full gradient-gold" />
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-bold text-foreground">Sign In to Admin Portal</CardTitle>
            <CardDescription className="text-xs">
              Enter your official staff email or select a pre-authorized demo role below.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-5">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-semibold text-foreground">
                  Official Email / Staff Identifier
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="staff@scrapifyauctions.com"
                    className="pl-10 h-10 text-sm bg-muted/40 border-border focus-visible:ring-accent"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-xs font-semibold text-foreground">
                    Password
                  </Label>
                  <span className="text-[11px] text-accent hover:underline cursor-pointer">
                    Forgot password?
                  </span>
                </div>
                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="pl-10 h-10 text-sm bg-muted/40 border-border focus-visible:ring-accent"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-muted-foreground">
                  <input type="checkbox" defaultChecked className="rounded border-border accent-accent h-3.5 w-3.5" />
                  <span>Remember this secure workstation</span>
                </label>
                <span className="text-muted-foreground flex items-center gap-1 font-mono text-[11px]">
                  <Lock className="h-3 w-3 text-emerald-600" /> TLS 1.3 / 256-bit
                </span>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 gradient-gold text-primary font-bold text-sm rounded-xl gap-2 shadow-lg hover:opacity-95 transition-all"
              >
                {loading ? "Authenticating…" : "Sign In to Operations Console"}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </form>

            {/* Quick 1-Click Role Login */}
            <div className="pt-3 border-t border-border">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Quick Access Demo Accounts (1-Click)
                </span>
                <Badge variant="outline" className="text-[10px]">
                  Instant Session
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
                      className="flex items-start gap-2.5 p-2.5 rounded-xl border border-border/80 bg-muted/20 hover:bg-muted/60 hover:border-accent/40 text-left transition-all group"
                    >
                      <div className="p-2 rounded-lg bg-background border border-border/60 group-hover:border-accent/40 transition-colors shrink-0 mt-0.5">
                        <Icon className="h-4 w-4 text-accent" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-bold text-xs text-foreground truncate">{item.role}</span>
                          <span className="text-[10px] text-muted-foreground truncate">{item.name}</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">
                          {item.desc}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </CardContent>

          <CardFooter className="bg-muted/30 p-3.5 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-600" /> SOC-2 Type II Certified Platform
            </span>
            <span>v2.4.0-prod</span>
          </CardFooter>
        </Card>

        {/* Footer info */}
        <p className="text-center text-[11px] text-muted-foreground">
          © {new Date().getFullYear()} Scrapify Auctions Ltd. Unauthorized access is monitored and logged in the immutable SOC-2 audit ledger.
        </p>
      </div>
    </div>
  );
}
