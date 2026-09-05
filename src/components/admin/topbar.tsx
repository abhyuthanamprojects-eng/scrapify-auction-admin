import { useState } from "react";
import { Bell, Search, LogOut, User as UserIcon, Menu, ShieldCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { AdminProfileDialog } from "@/components/admin/profile-dialog";

export function AdminTopbar({
  onOpenMobileNav,
  showMobileTrigger = false,
}: {
  onOpenMobileNav?: () => void;
  showMobileTrigger?: boolean;
} = {}) {
  const { user, role, logout, updateProfile } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "?";

  return (
    <>
      <header className="sticky top-0 z-30 shrink-0 h-14 sm:h-16 min-h-14 sm:min-h-16 bg-card/80 backdrop-blur-xl border-b border-border/70 flex items-center gap-1.5 sm:gap-3 px-2 sm:px-6 relative">
        <div className="absolute inset-x-0 bottom-0 hairline" />
        {showMobileTrigger && (
          <button
            type="button"
            onClick={onOpenMobileNav}
            className="h-10 w-10 shrink-0 inline-flex items-center justify-center rounded-full hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            aria-label="Open navigation menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}
        <div className="relative flex-1 min-w-0 max-w-xl hidden sm:block">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search vendors, auctions, organizations…"
            className="pl-10 pr-16 h-10 rounded-full bg-muted/60 border-transparent focus-visible:border-accent/40 focus-visible:ring-accent/20"
          />
          <kbd className="hidden md:inline-flex absolute right-3 top-1/2 -translate-y-1/2 items-center gap-1 rounded border border-border bg-background px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
            ⌘K
          </kbd>
        </div>
        <button
          type="button"
          aria-label="Search"
          className="sm:hidden h-10 w-10 shrink-0 inline-flex items-center justify-center rounded-full hover:bg-muted transition-colors"
        >
          <Search className="h-4 w-4" />
        </button>

        <div className="ml-auto flex items-center gap-2 sm:gap-3 min-w-0">
          {/* Static Non-Changeable Verified Role Badge */}
          <div
            title={`Authenticated Role: ${role} — Enforced by Scrapify RBAC`}
            className="inline-flex items-center gap-1.5 sm:gap-2 rounded-full border border-accent/25 bg-gradient-to-r from-accent/10 to-accent/5 px-2.5 sm:px-3.5 h-9 sm:h-10 text-xs sm:text-sm shrink-0 cursor-default select-none shadow-sm"
          >
            <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse" />
            <span className="hidden sm:inline text-muted-foreground text-[10px] uppercase font-bold tracking-wider">
              Role
            </span>
            <span className="font-semibold text-foreground text-xs sm:text-sm truncate max-w-[8rem] sm:max-w-[10rem]">
              {role ?? "—"}
            </span>
          </div>

          <button
            className="relative h-9 sm:h-10 w-9 sm:w-10 shrink-0 rounded-full hover:bg-muted inline-flex items-center justify-center transition-colors"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4 text-foreground/80" />
            <Badge className="absolute top-1.5 right-1.5 h-4 min-w-4 px-1 text-[10px] bg-accent text-accent-foreground border-0 shadow-md">
              4
            </Badge>
          </button>

          <div className="hidden sm:block h-7 w-px bg-border mx-0.5" />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label="Account menu"
                className="flex items-center gap-2.5 rounded-full hover:bg-muted/80 pl-1 pr-1 md:pr-3 h-10 transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <Avatar className="h-8 w-8 ring-2 ring-accent/30 ring-offset-2 ring-offset-card shadow-sm">
                  <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground text-xs font-bold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:block text-left leading-tight">
                  <div className="text-sm font-semibold text-foreground">{user?.name ?? "Admin"}</div>
                  <div className="text-[10px] text-muted-foreground truncate max-w-[8rem]">
                    {user?.department || user?.role || "—"}
                  </div>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-xl p-1.5 shadow-xl border-border">
              <DropdownMenuLabel className="px-2.5 py-2">
                <div className="font-bold text-sm text-foreground">{user?.name ?? "Admin"}</div>
                <div className="text-xs text-muted-foreground font-normal">{user?.email ?? "—"}</div>
                <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
                  ID: {user?.employeeId ?? "—"} · {user?.role ?? "—"}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setProfileOpen(true)}
                className="cursor-pointer py-2 px-2.5 rounded-lg focus:bg-accent/10"
              >
                <UserIcon className="h-4 w-4 mr-2.5 text-accent" />
                <span className="font-medium">My Profile &amp; Identity</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setProfileOpen(true)}
                className="cursor-pointer py-2 px-2.5 rounded-lg focus:bg-accent/10"
              >
                <ShieldCheck className="h-4 w-4 mr-2.5 text-emerald-600" />
                <span className="font-medium">Security &amp; 2FA</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={logout}
                className="cursor-pointer py-2 px-2.5 rounded-lg text-destructive focus:text-destructive focus:bg-destructive/10"
              >
                <LogOut className="h-4 w-4 mr-2.5" />
                <span className="font-semibold">Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Interactive Profile Dialog */}
      {user && (
        <AdminProfileDialog
          open={profileOpen}
          onOpenChange={setProfileOpen}
          user={user}
          onSave={updateProfile}
        />
      )}
    </>
  );
}