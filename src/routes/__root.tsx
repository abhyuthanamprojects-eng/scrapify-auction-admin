import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { AdminSidebar } from "@/components/admin/sidebar";
import { AdminTopbar } from "@/components/admin/topbar";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/hooks/use-auth";
import { ApiUnauthorizedError, ApiForbiddenError } from "@/lib/api-client";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();

  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  // If it's an auth error, redirect to login instead of showing error page
  if (error instanceof ApiUnauthorizedError) {
    if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
      window.location.href = "/login";
    }
    return null;
  }

  const isForbidden = error instanceof ApiForbiddenError;
  const isNetworkError = error.message?.includes("Network error") || error.message?.includes("Failed to fetch");

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        {isForbidden ? (
          <>
            <h1 className="text-xl font-semibold tracking-tight text-foreground">Access denied</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              You don't have permission to access this page. Contact your administrator if you believe this is an error.
            </p>
          </>
        ) : isNetworkError ? (
          <>
            <h1 className="text-xl font-semibold tracking-tight text-foreground">Connection problem</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Unable to reach the server. Please check your internet connection and try again.
            </p>
          </>
        ) : (
          <>
            <h1 className="text-xl font-semibold tracking-tight text-foreground">Something went wrong</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              An unexpected error occurred. You can try refreshing or head back home.
            </p>
            {import.meta.env.DEV && error.message && (
              <pre className="mt-3 max-h-32 overflow-auto rounded bg-muted p-2 text-left text-xs text-destructive">
                {error.message}
              </pre>
            )}
          </>
        )}
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Scrapify Auctions — Super Admin & Operations Console" },
      {
        name: "description",
        content: "Enterprise Operations Console for Scrapify Auctions — Live Control Room, Multi-Category Auctions, RFx, Approvals, Finance & Audit.",
      },
      { name: "author", content: "Scrapify Auctions" },
      { property: "og:title", content: "Scrapify Auctions Operations Console" },
      {
        property: "og:description",
        content: "Enterprise Operations Console for Scrapify Auctions — Live Control Room, Multi-Category Auctions, RFx, Approvals, Finance & Audit.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:site", content: "@Lovable" },
      { name: "robots", content: "noindex, nofollow" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", href: "/scrapify-auction-app-icon.png", type: "image/png" },
      { rel: "apple-touch-icon", href: "/scrapify-auction-app-icon.png" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Outfit:wght@500;600;700;800;900&family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400;1,600&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const routerState = useRouterState();
  const isLoginPage = routerState.location.pathname === "/login";
  const { isAuthenticated, isChecking } = useAuth();

  const [collapsed, setCollapsed] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    try {
      return window.localStorage.getItem("admin.sidebar.collapsed") === "1";
    } catch {
      return false;
    }
  });
  const [mobileOpen, setMobileOpen] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    try {
      window.localStorage.setItem("admin.sidebar.collapsed", collapsed ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, [collapsed]);

  // Login page: always accessible, redirect to dashboard if already authenticated
  if (isLoginPage) {
    if (isAuthenticated && typeof window !== "undefined") {
      window.location.href = "/";
      return null;
    }
    return (
      <QueryClientProvider client={queryClient}>
        <div className="min-h-screen w-full bg-background">
          <Outlet />
        </div>
      </QueryClientProvider>
    );
  }

  // Auth is being validated — show a clean loading state, NOT the dashboard
  if (isChecking) {
    return (
      <QueryClientProvider client={queryClient}>
        <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background p-4 text-center space-y-3">
          <div className="h-8 w-8 rounded-full border-2 border-accent border-t-transparent animate-spin" />
          <p className="text-sm font-medium text-muted-foreground">Verifying session…</p>
        </div>
      </QueryClientProvider>
    );
  }

  // Not authenticated — redirect to login. Do NOT render any protected UI.
  if (!isAuthenticated) {
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
    return (
      <QueryClientProvider client={queryClient}>
        <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background p-4 text-center space-y-3">
          <div className="h-8 w-8 rounded-full border-2 border-accent border-t-transparent animate-spin" />
          <p className="text-sm font-medium text-muted-foreground">Redirecting to login…</p>
        </div>
      </QueryClientProvider>
    );
  }

  // Authenticated — render the admin shell
  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex h-dvh w-full overflow-hidden bg-background">
        {!isMobile && (
          <AdminSidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
        )}
        {isMobile && (
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetContent side="left" className="p-0 w-[260px] gradient-navy border-r border-sidebar-border">
              <VisuallyHidden>
                <SheetTitle>Navigation</SheetTitle>
              </VisuallyHidden>
              <AdminSidebar collapsed={false} onToggle={() => {}} variant="mobile" />
            </SheetContent>
          </Sheet>
        )}
        <div className="flex-1 flex flex-col min-w-0 h-dvh overflow-y-auto">
          <AdminTopbar onOpenMobileNav={() => setMobileOpen(true)} showMobileTrigger={isMobile} />
          <main className="flex-1 p-6">
            {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
            <Outlet />
          </main>
          <footer className="border-t border-border/60 bg-background/60 backdrop-blur px-6 py-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
              <p>© {new Date().getFullYear()} Scrapify Auctions Operations Console. All rights reserved.</p>
              <p>
                Developed &amp; designed by{" "}
                <a
                  href="https://devzign.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-foreground hover:text-accent transition-colors"
                >
                  Devzign Technology
                </a>{" "}
                ·{" "}
                <a
                  href="https://devzign.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-accent transition-colors"
                >
                  devzign.com
                </a>
              </p>
            </div>
          </footer>
        </div>
      </div>
    </QueryClientProvider>
  );
}
