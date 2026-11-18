import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Bot, CloudSun, Cpu, Database, RotateCcw, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/agri/page-header";
import { DataBadge } from "@/components/agri/data-badge";
import { AI_LANGUAGES, useFarm, type LanguageCode, type Settings } from "@/lib/farm-store";
import { SAMPLE_FARM } from "@/lib/farm-data";
import { WEATHER_LOCATIONS } from "@/lib/weather";

export const Route = createFileRoute("/_platform/settings")({
  head: () => ({
    meta: [
      { title: "Settings · AgriSmart AI" },
      { name: "description", content: "Farm profile, AI language, appearance, alerts and integration status for AgriSmart AI." },
      { property: "og:title", content: "Settings · AgriSmart AI" },
      { property: "og:description", content: "Farm profile, AI language, appearance, alerts and integration status for AgriSmart AI." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SettingsPage,
});

const INTEGRATIONS = [
  { icon: Bot, name: "AI analysis & AgriBot", detail: "Gemini via secure server — keys never reach the browser", kind: "live" as const, label: "Connected" },
  { icon: CloudSun, name: "Weather", detail: "Open-Meteo live forecast, demo fallback if unreachable", kind: "live" as const, label: "Connected" },
  { icon: Cpu, name: "Field sensors & valves", detail: "Soil moisture probes and irrigation controllers", kind: "sample" as const, label: "Not connected — sample data" },
  { icon: Database, name: "Farm records database", detail: "Ready for saving plots, scans and reports per account", kind: "demo" as const, label: "Not in use yet" },
];

function SettingsPage() {
  const { settings, updateSettings, resetSimulation } = useFarm();
  const [draft, setDraft] = useState<Settings>(settings);
  const [errors, setErrors] = useState<Partial<Record<"farmName" | "ownerName" | "location" | "totalAreaAcres", string>>>({});
  useEffect(() => setDraft(settings), [settings]);
  const set = <K extends keyof Settings>(k: K, v: Settings[K]) => setDraft((d) => ({ ...d, [k]: v }));

  const save = () => {
    const e: Partial<Record<"farmName" | "ownerName" | "location" | "totalAreaAcres", string>> = {};
    if (draft.farmName.trim().length < 2) e.farmName = "Enter a farm name";
    if (draft.ownerName.trim().length < 2) e.ownerName = "Enter your name";
    if (draft.location.trim().length < 2) e.location = "Enter a location";
    if (!(draft.totalAreaAcres > 0 && draft.totalAreaAcres <= 100000)) e.totalAreaAcres = "Enter an area greater than 0";
    setErrors(e);
    if (Object.keys(e).length) return;
    updateSettings({ ...draft, farmName: draft.farmName.trim(), ownerName: draft.ownerName.trim(), location: draft.location.trim() });
    toast.success("Settings saved on this device");
  };

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Settings" title="Farm & app settings" description="Preferences are saved in this browser. Sign-in and cloud sync can be added later." />
      <div className="grid gap-5 lg:grid-cols-2">
        <section className="space-y-4 rounded-2xl border bg-card p-5 shadow-soft">
          <h2 className="font-sans text-base font-semibold">Farm profile</h2>
          <F label="Farm name" error={errors.farmName}><Input value={draft.farmName} maxLength={60} onChange={(e) => set("farmName", e.target.value)} /></F>
          <F label="Owner name" error={errors.ownerName}><Input value={draft.ownerName} maxLength={60} onChange={(e) => set("ownerName", e.target.value)} /></F>
          <F label="Location" error={errors.location}><Input value={draft.location} maxLength={80} onChange={(e) => set("location", e.target.value)} /></F>
          <F label="Total farm area (acres)" error={errors.totalAreaAcres}><Input type="number" min={0} step="0.1" value={Number.isFinite(draft.totalAreaAcres) ? draft.totalAreaAcres : ""} onChange={(e) => set("totalAreaAcres", e.target.valueAsNumber)} /></F>
          <F label="Weather location">
            <Select value={draft.weatherLocationId} onValueChange={(v) => set("weatherLocationId", v)}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>{WEATHER_LOCATIONS.map((l) => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}</SelectContent>
            </Select>
          </F>
        </section>

        <section className="space-y-4 rounded-2xl border bg-card p-5 shadow-soft">
          <h2 className="font-sans text-base font-semibold">Preferences</h2>
          <F label="AI answers & recommendations language">
            <Select value={draft.language} onValueChange={(v) => set("language", v as LanguageCode)}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>{AI_LANGUAGES.map((l) => <SelectItem key={l.code} value={l.code}>{l.label}</SelectItem>)}</SelectContent>
            </Select>
          </F>
          <Toggle label="Dark appearance" desc="Easier on the eyes at night" checked={draft.theme === "dark"} onChange={(v) => set("theme", v ? "dark" : "light")} />
          <Toggle label="Critical crop alerts" desc="Show alerts for critical plots" checked={draft.alertsCritical} onChange={(v) => set("alertsCritical", v)} />
          <Toggle label="Weather alerts" desc="Heavy rain and heat warnings" checked={draft.alertsWeather} onChange={(v) => set("alertsWeather", v)} />
          <div className="flex flex-wrap gap-2 pt-2">
            <Button onClick={save}><Save /> Save settings</Button>
            <Button
              variant="outline"
              onClick={() => {
                updateSettings({ farmName: SAMPLE_FARM.name, ownerName: SAMPLE_FARM.owner, location: SAMPLE_FARM.location, totalAreaAcres: SAMPLE_FARM.totalAreaAcres });
                resetSimulation();
                toast.success("Demo farm restored");
              }}
            >
              <RotateCcw /> Restore demo farm
            </Button>
          </div>
        </section>
      </div>

      <section className="rounded-2xl border bg-card p-5 shadow-soft">
        <h2 className="font-sans text-base font-semibold">Data sources & integrations</h2>
        <ul className="mt-3 grid gap-3 md:grid-cols-2">
          {INTEGRATIONS.map((i) => (
            <li key={i.name} className="flex items-start gap-3 rounded-xl border bg-background p-4">
              <span className="grid size-9 place-items-center rounded-lg bg-primary/10 text-primary"><i.icon className="size-4" /></span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{i.name}</p>
                <p className="text-xs text-muted-foreground">{i.detail}</p>
              </div>
              <DataBadge kind={i.kind} label={i.label} />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function F({ label, error, children }: { label: string; error?: string | undefined; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {error && <p className="text-xs font-medium text-danger">{error}</p>}
    </div>
  );
}

function Toggle({ label, desc, checked, onChange }: { label: string; desc: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border bg-background p-3">
      <div><p className="text-sm font-medium">{label}</p><p className="text-xs text-muted-foreground">{desc}</p></div>
      <Switch checked={checked} onCheckedChange={onChange} aria-label={label} />
    </div>
  );
}
