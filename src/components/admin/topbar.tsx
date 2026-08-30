import { Bell, Search, LogOut, User as UserIcon, ChevronDown, Menu } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useRole, ADMIN_ROLES } from "@/hooks/use-role";

export function AdminTopbar({
  onOpenMobileNav,
  showMobileTrigger = false,
}: {
  onOpenMobileNav?: () => void;
  showMobileTrigger?: boolean;
} = {}) {
  const [role, setRole] = useRole();

  return (
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

      <div className="ml-auto flex items-center gap-1.5 sm:gap-2 min-w-0">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              aria-label={`Switch role, current role ${role}`}
              className="group inline-flex items-center gap-1.5 sm:gap-2 rounded-full border border-accent/20 bg-gradient-to-r from-accent/5 to-transparent px-2.5 sm:px-3.5 h-10 text-sm hover:border-accent/40 transition-colors shrink-0"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-accent shadow-[0_0_8px_hsl(35_50%_45%/0.8)]" />
              <span className="hidden sm:inline text-muted-foreground text-xs uppercase tracking-wider">Role</span>
              <span className="font-semibold text-xs sm:text-sm truncate max-w-[7rem]">{role}</span>
              <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground group-hover:text-accent" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Switch role (demo)</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuRadioGroup value={role} onValueChange={(v) => setRole(v as typeof role)}>
              {ADMIN_ROLES.map((r) => (
                <DropdownMenuRadioItem key={r} value={r}>
                  {r}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        <button
          className="relative h-10 w-10 shrink-0 rounded-full hover:bg-muted inline-flex items-center justify-center transition-colors"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
          <Badge className="absolute top-1.5 right-1.5 h-4 min-w-4 px-1 text-[10px] gradient-gold text-primary border-0 shadow-md">
            4
          </Badge>
        </button>

        <div className="hidden sm:block h-8 w-px bg-border mx-1" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              aria-label="Account menu"
              className="flex items-center gap-2.5 rounded-full hover:bg-muted pl-1 pr-1 md:pr-3 h-10 transition-colors shrink-0"
            >
              <Avatar className="h-8 w-8 ring-2 ring-accent/30 ring-offset-2 ring-offset-card">
                <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 text-primary-foreground text-xs font-semibold">
                  RI
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:block text-left leading-tight">
                <div className="text-sm font-semibold">R. Iyer</div>
                <div className="text-[10px] text-muted-foreground">Platform Ops</div>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>R. Iyer</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <UserIcon className="h-4 w-4 mr-2" /> Profile
            </DropdownMenuItem>
            <DropdownMenuItem className="text-destructive focus:text-destructive">
              <LogOut className="h-4 w-4 mr-2" /> Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}