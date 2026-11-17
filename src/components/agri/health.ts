import type { HealthStatus } from "@/lib/farm-logic";

export const STATUS_BG: Record<HealthStatus, string> = {
  healthy: "bg-success",
  watch: "bg-warning",
  critical: "bg-danger",
};
export const STATUS_TEXT: Record<HealthStatus, string> = {
  healthy: "text-success",
  watch: "text-warning-foreground dark:text-warning",
  critical: "text-danger",
};
export const STATUS_SOFT: Record<HealthStatus, string> = {
  healthy: "bg-success/15 text-success border-success/30",
  watch: "bg-warning/20 text-warning-foreground border-warning/40 dark:text-warning",
  critical: "bg-danger/15 text-danger border-danger/30",
};
