import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { DataBadge, type DataKind } from "@/components/agri/data-badge";

export function ChartCard({ title, subtitle, kind = "sample", action, children, className }: { title: string; subtitle?: string; kind?: DataKind | null; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-2xl border bg-card p-5 shadow-soft", className)}>
      <header className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="font-sans text-base font-semibold text-card-foreground">{title}</h2>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-2">
          {action}
          {kind && <DataBadge kind={kind} />}
        </div>
      </header>
      {children}
    </section>
  );
}
