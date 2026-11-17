import { BarChart3, CloudSun, FileText, LayoutDashboard, Map, MessageCircle, ScanLine, Settings, Sprout } from "lucide-react";

export const NAV_ITEMS = [
  { to: "/dashboard", label: "Overview Dashboard", icon: LayoutDashboard },
  { to: "/digital-twin", label: "Digital Twin Farm", icon: Map },
  { to: "/disease-detection", label: "Crop Disease Detection", icon: ScanLine },
  { to: "/recommendations", label: "AI Recommendations", icon: Sprout },
  { to: "/assistant", label: "AI Farming Assistant", icon: MessageCircle },
  { to: "/weather", label: "Weather & Irrigation", icon: CloudSun },
  { to: "/analytics", label: "Farm Analytics", icon: BarChart3 },
  { to: "/reports", label: "Reports", icon: FileText },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;
