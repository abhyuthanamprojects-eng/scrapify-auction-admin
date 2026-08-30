import { Sparkles } from "lucide-react";

export function Placeholder({ title }: { title: string }) {
  return (
    <div className="card-premium p-12 text-center relative overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-px gradient-gold opacity-60" />
      <div className="absolute -top-24 left-1/2 -translate-x-1/2 h-48 w-48 rounded-full bg-accent/10 blur-3xl" />
      <div className="relative">
        <div className="mx-auto h-14 w-14 rounded-2xl gradient-gold flex items-center justify-center shadow-lg ring-1 ring-white/40 mb-4">
          <Sparkles className="h-6 w-6 text-primary" />
        </div>
        <h3 className="font-display text-2xl text-foreground">{title} suite</h3>
        <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
          A curated {title.toLowerCase()} experience is being crafted. Connect the backend to bring this module to life.
        </p>
        <div className="mt-6 inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-accent font-semibold">
          <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
          In development
        </div>
      </div>
    </div>
  );
}