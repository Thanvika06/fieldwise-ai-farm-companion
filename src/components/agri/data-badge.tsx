import { Bot, FlaskConical, Radio, SlidersHorizontal, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";

const VARIANTS = {
  sample: { label: "Sample data", icon: FlaskConical, cls: "bg-wheat/25 text-wheat-foreground border-wheat/60 dark:text-wheat" },
  demo: { label: "Demo data", icon: TriangleAlert, cls: "bg-wheat/25 text-wheat-foreground border-wheat/60 dark:text-wheat" },
  live: { label: "Live", icon: Radio, cls: "bg-success/15 text-success border-success/40" },
  ai: { label: "AI-generated", icon: Bot, cls: "bg-water/15 text-water border-water/40" },
  simulated: { label: "Simulated", icon: SlidersHorizontal, cls: "bg-earth/15 text-earth border-earth/40" },
} as const;

export type DataKind = keyof typeof VARIANTS;

export function DataBadge({ kind, label, className }: { kind: DataKind; label?: string; className?: string }) {
  const v = VARIANTS[kind];
  const Icon = v.icon;
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold tracking-wide whitespace-nowrap", v.cls, className)}>
      <Icon className="size-3" aria-hidden />
      {label ?? v.label}
    </span>
  );
}
