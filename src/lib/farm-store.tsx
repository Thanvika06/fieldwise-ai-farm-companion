import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { SAMPLE_ALERTS, SAMPLE_FARM, SAMPLE_PLOTS, type Plot } from "@/lib/farm-data";
import { computePlotHealth, healthStatus, type HealthStatus } from "@/lib/farm-logic";

export const AI_LANGUAGES = [
  { code: "en", label: "English" },
  { code: "hi", label: "हिन्दी (Hindi)" },
  { code: "mr", label: "मराठी (Marathi)" },
  { code: "ta", label: "தமிழ் (Tamil)" },
  { code: "te", label: "తెలుగు (Telugu)" },
  { code: "kn", label: "ಕನ್ನಡ (Kannada)" },
  { code: "bn", label: "বাংলা (Bengali)" },
  { code: "pa", label: "ਪੰਜਾਬੀ (Punjabi)" },
  { code: "gu", label: "ગુજરાતી (Gujarati)" },
] as const;

export type LanguageCode = (typeof AI_LANGUAGES)[number]["code"];

export function languageName(code: string): string {
  const found = AI_LANGUAGES.find((l) => l.code === code);
  return found ? found.label.replace(/ \(.+\)$/, "") : "English";
}

export interface Settings {
  farmName: string;
  ownerName: string;
  location: string;
  totalAreaAcres: number;
  language: LanguageCode;
  theme: "light" | "dark";
  alertsCritical: boolean;
  alertsWeather: boolean;
  weatherLocationId: string;
}

const DEFAULT_SETTINGS: Settings = {
  farmName: SAMPLE_FARM.name,
  ownerName: SAMPLE_FARM.owner,
  location: SAMPLE_FARM.location,
  totalAreaAcres: SAMPLE_FARM.totalAreaAcres,
  language: "en",
  theme: "light",
  alertsCritical: true,
  alertsWeather: true,
  weatherLocationId: "nashik",
};

export interface Simulation {
  enabled: boolean;
  moistureDelta: number;
  tempDelta: number;
  overrides: Record<string, { moisture?: number; temperature?: number }>;
}

const DEFAULT_SIM: Simulation = { enabled: false, moistureDelta: 0, tempDelta: 0, overrides: {} };

export interface LivePlot extends Plot {
  health: number;
  status: HealthStatus;
  simulated: boolean;
}

interface FarmContextValue {
  plots: LivePlot[];
  simulation: Simulation;
  setSimulation: (updater: (s: Simulation) => Simulation) => void;
  resetSimulation: () => void;
  settings: Settings;
  updateSettings: (patch: Partial<Settings>) => void;
  readAlertIds: Set<string>;
  markAlertRead: (id: string) => void;
  markAllAlertsRead: () => void;
  unreadCount: number;
  scansThisSession: number;
  recordScan: () => void;
}

const FarmContext = createContext<FarmContextValue | null>(null);
const SETTINGS_KEY = "agrismart.settings.v1";
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export function applySimulation(plots: Plot[], sim: Simulation): LivePlot[] {
  return plots.map((p) => {
    const o = sim.enabled ? sim.overrides[p.id] : undefined;
    const moisture = sim.enabled ? clamp(o?.moisture ?? p.moisture + sim.moistureDelta, 0, 100) : p.moisture;
    const temperature = sim.enabled ? clamp(o?.temperature ?? p.temperature + sim.tempDelta, -5, 50) : p.temperature;
    const health = computePlotHealth({ crop: p.crop, moisture, temperature, diseaseRisk: p.diseaseRisk });
    const simulated = sim.enabled && (moisture !== p.moisture || temperature !== p.temperature);
    return { ...p, moisture, temperature, health, status: healthStatus(health), simulated };
  });
}

export function FarmProvider({ children }: { children: ReactNode }) {
  const [simulation, setSim] = useState<Simulation>(DEFAULT_SIM);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [readAlertIds, setRead] = useState<Set<string>>(new Set());
  const [scansThisSession, setScans] = useState(0);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(SETTINGS_KEY);
      if (raw) setSettings({ ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<Settings>) });
    } catch {
      /* ignore corrupt settings */
    }
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", settings.theme === "dark");
  }, [settings.theme]);

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      try {
        window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
      } catch {
        /* storage unavailable */
      }
      return next;
    });
  }, []);

  const plots = useMemo(() => applySimulation(SAMPLE_PLOTS, simulation), [simulation]);

  const value = useMemo<FarmContextValue>(
    () => ({
      plots,
      simulation,
      setSimulation: (u) => setSim((s) => u(s)),
      resetSimulation: () => setSim(DEFAULT_SIM),
      settings,
      updateSettings,
      readAlertIds,
      markAlertRead: (id) => setRead((s) => new Set(s).add(id)),
      markAllAlertsRead: () => setRead(new Set(SAMPLE_ALERTS.map((a) => a.id))),
      unreadCount: SAMPLE_ALERTS.filter((a) => !readAlertIds.has(a.id)).length,
      scansThisSession,
      recordScan: () => setScans((n) => n + 1),
    }),
    [plots, simulation, settings, updateSettings, readAlertIds, scansThisSession],
  );

  return <FarmContext.Provider value={value}>{children}</FarmContext.Provider>;
}

export function useFarm() {
  const ctx = useContext(FarmContext);
  if (!ctx) throw new Error("useFarm must be used inside FarmProvider");
  return ctx;
}

export function farmSummary(plots: LivePlot[]) {
  const totalArea = plots.reduce((s, p) => s + p.areaAcres, 0);
  const avgHealth = Math.round(plots.reduce((s, p) => s + p.health * p.areaAcres, 0) / totalArea);
  const avgMoisture = Math.round(plots.reduce((s, p) => s + p.moisture, 0) / plots.length);
  const counts = { healthy: 0, watch: 0, critical: 0 } as Record<HealthStatus, number>;
  plots.forEach((p) => counts[p.status]++);
  return { totalArea, avgHealth, avgMoisture, counts, status: healthStatus(avgHealth) };
}
