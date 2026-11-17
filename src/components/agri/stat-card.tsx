import { Link } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

type Tone = "primary" | "leaf" | "earth" | "water" | "wheat" | "danger";
const TONES: Record<Tone, string> = {
  primary: "bg-primary/10 text-primary",
  leaf: "bg-leaf/20 text-leaf-foreground dark:text-leaf",
  earth: "bg-earth/15 text-earth",
  water: "bg-water/15 text-water",
  wheat: "bg-wheat/30 text-wheat-foreground dark:text-wheat",
  danger: "bg-danger/15 text-danger",
};

export function StatCard({ to, icon: Icon, label, value, sub, tone = "primary", footer }: {
  to: "/dashboard" | "/digital-twin" | "/disease-detection" | "/weather" | "/analytics" | "/recommendations";
  icon: LucideIcon;
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  tone?: Tone;
  footer?: ReactNode;
}) {
  return (
    <Link
      to={to}
      className="group relative flex flex-col gap-3 rounded-2xl border bg-card p-4 shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="flex items-center justify-between">
        <span className={cn("grid size-9 place-items-center rounded-xl", TONES[tone])}>
          <Icon className="size-[18px]" aria-hidden />
        </span>
        <ArrowUpRight className="size-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" aria-hidden />
      </div>
      <div>
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="mt-0.5 font-display text-2xl font-semibold text-card-foreground">{value}</p>
        {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
      </div>
      {footer}
    </Link>
  );
}
