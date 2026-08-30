import { useRouterState, Link } from "@tanstack/react-router";
import { ChevronRight, Home } from "lucide-react";
import { NAV } from "./sidebar";

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const current = NAV.find((n) => n.to === pathname);

  return (
    <div className="mb-8 relative">
      <div className="absolute -top-6 -left-6 h-32 w-32 rounded-full bg-accent/5 blur-3xl pointer-events-none" />
      <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3 relative">
        <Link to="/" className="hover:text-accent transition-colors inline-flex items-center gap-1">
          <Home className="h-3 w-3" /> Admin
        </Link>
        {current && current.to !== "/" && (
          <>
            <ChevronRight className="h-3 w-3" />
            <span className="text-foreground font-medium">{current.label}</span>
          </>
        )}
      </nav>
      <div className="flex items-end justify-between gap-4 relative">
        <div>
          <h1 className="text-4xl font-display tracking-tight text-foreground">
            {title}
          </h1>
          {description && (
            <p className="text-sm text-muted-foreground mt-2 max-w-2xl">{description}</p>
          )}
          <div className="mt-4 h-px w-24 gradient-gold rounded-full" />
        </div>
        {actions}
      </div>
    </div>
  );
}