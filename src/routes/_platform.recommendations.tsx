import { useState, type FormEvent } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, BadgeCheck, CalendarRange, Droplets, FlaskConical, Leaf, Loader2, Recycle, RotateCcw, Shield, Sprout, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/agri/page-header";
import { DataBadge } from "@/components/agri/data-badge";
import { generateRecommendations } from "@/lib/ai.functions";
import { GROWTH_STAGES, IRRIGATION_METHODS, recommendationInput, SEASONS, SOIL_TYPES, type RecommendationOutput } from "@/lib/ai-schemas";
import { languageName, useFarm } from "@/lib/farm-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_platform/recommendations")({
  head: () => ({
    meta: [
      { title: "AI Recommendations · AgriSmart AI" },
      { name: "description", content: "Personalised AI advice on crop choice, irrigation, fertilizer, disease prevention, soil and seasonal practice." },
      { property: "og:title", content: "AI Recommendations · AgriSmart AI" },
      { property: "og:description", content: "Personalised AI advice on crop choice, irrigation, fertilizer, disease prevention, soil and seasonal practice." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Recommendations,
});

const SECTION_ICON = {
  crop_selection: Sprout,
  irrigation: Droplets,
  fertilizer: FlaskConical,
  disease_prevention: Shield,
  soil_improvement: Leaf,
  seasonal: CalendarRange,
  resource_optimization: Recycle,
} as const;

type FormState = {
  cropName: string;
  soilType: string;
  location: string;
  landArea: string;
  areaUnit: string;
  growthStage: string;
  irrigationMethod: string;
  season: string;
  soilInfo: string;
};

const EMPTY: FormState = { cropName: "", soilType: "", location: "", landArea: "", areaUnit: "acres", growthStage: "", irrigationMethod: "", season: "", soilInfo: "" };
const EXAMPLE: FormState = {
  cropName: "Tomato",
  soilType: "Black (Regur)",
  location: "Nashik, Maharashtra",
  landArea: "2",
  areaUnit: "acres",
  growthStage: "Fruiting / Grain filling",
  irrigationMethod: "Drip",
  season: "Rabi (winter)",
  soilInfo: "Soil Health Card from June: pH 7.4, organic carbon 0.52%, nitrogen low, phosphorus medium, potassium high.",
};

function Recommendations() {
  const { settings } = useFarm();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [loading, setLoading] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const [result, setResult] = useState<{ data: RecommendationOutput; for: string } | null>(null);

  const set = (k: keyof FormState) => (v: string) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const parsed = recommendationInput.safeParse({ ...form, language: settings.language });
    if (!parsed.success) {
      const next: Partial<Record<keyof FormState, string>> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof FormState;
        if (!next[key]) next[key] = issue.code === "invalid_enum_value" ? "Please choose an option" : issue.message;
      }
      setErrors(next);
      return;
    }
    setLoading(true);
    setFailure(null);
    try {
      const res = await generateRecommendations({ data: parsed.data });
      if (res.ok) setResult({ data: res.result, for: `${parsed.data.cropName} · ${parsed.data.landArea} ${parsed.data.areaUnit} · ${parsed.data.location}` });
      else setFailure(res.message);
    } catch (err) {
      console.error(err);
      setFailure("Could not reach the recommendation service. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Generative AI"
        title="AI farming recommendations"
        description={`Tell us about your field and get personalised guidance in ${languageName(settings.language)}. Advice is based only on what you enter — no invented soil readings or yield promises.`}
        actions={<DataBadge kind="ai" />}
      />

      <div className="grid gap-5 xl:grid-cols-[420px_1fr]">
        <form onSubmit={submit} noValidate className="space-y-4 rounded-2xl border bg-card p-5 shadow-soft xl:sticky xl:top-20 xl:self-start">
          <div className="flex items-center justify-between">
            <h2 className="font-sans text-base font-semibold">Your field</h2>
            <Button type="button" variant="ghost" size="sm" onClick={() => { setForm(EXAMPLE); setErrors({}); }}>Fill example</Button>
          </div>
          <Field label="Crop name" error={errors.cropName} htmlFor="crop">
            <Input id="crop" value={form.cropName} onChange={(e) => set("cropName")(e.target.value)} placeholder="e.g. Cotton, Wheat, Onion" maxLength={60} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Soil type" error={errors.soilType}>
              <Choice value={form.soilType} onChange={set("soilType")} options={SOIL_TYPES} placeholder="Choose" />
            </Field>
            <Field label="Season" error={errors.season}>
              <Choice value={form.season} onChange={set("season")} options={SEASONS} placeholder="Choose" />
            </Field>
          </div>
          <Field label="Location" error={errors.location} htmlFor="loc">
            <Input id="loc" value={form.location} onChange={(e) => set("location")(e.target.value)} placeholder="Village / district, state" maxLength={80} />
          </Field>
          <div className="grid grid-cols-[1fr_120px] gap-3">
            <Field label="Land area" error={errors.landArea} htmlFor="area">
              <Input id="area" type="number" inputMode="decimal" min={0} step="0.1" value={form.landArea} onChange={(e) => set("landArea")(e.target.value)} placeholder="e.g. 2.5" />
            </Field>
            <Field label="Unit">
              <Choice value={form.areaUnit} onChange={set("areaUnit")} options={["acres", "hectares"]} />
            </Field>
          </div>
          <Field label="Current growth stage" error={errors.growthStage}>
            <Choice value={form.growthStage} onChange={set("growthStage")} options={GROWTH_STAGES} placeholder="Choose stage" />
          </Field>
          <Field label="Irrigation method" error={errors.irrigationMethod}>
            <Choice value={form.irrigationMethod} onChange={set("irrigationMethod")} options={IRRIGATION_METHODS} placeholder="Choose method" />
          </Field>
          <Field label="Available soil information (optional)" error={errors.soilInfo} htmlFor="soil">
            <Textarea id="soil" rows={3} value={form.soilInfo} onChange={(e) => set("soilInfo")(e.target.value)} placeholder="Soil Health Card values, past problems, manure used…" maxLength={600} />
            <p className="text-right text-[11px] text-muted-foreground">{form.soilInfo.length}/600</p>
          </Field>
          <div className="flex gap-2">
            <Button type="submit" size="lg" className="h-11 flex-1 rounded-xl" disabled={loading}>
              {loading ? <><Loader2 className="animate-spin" /> Generating…</> : <><Wand2 /> Get AI recommendations</>}
            </Button>
            <Button type="button" size="lg" variant="outline" className="h-11 rounded-xl" onClick={() => { setForm(EMPTY); setErrors({}); }} aria-label="Clear form"><RotateCcw /></Button>
          </div>
        </form>

        <section className="space-y-4">
          {loading && (
            <div className="grid gap-4 md:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-40 animate-pulse rounded-2xl bg-muted" />)}
            </div>
          )}
          {!loading && failure && (
            <div className="rounded-2xl border border-danger/40 bg-danger/10 p-5">
              <p className="flex items-center gap-2 font-semibold text-danger"><AlertTriangle className="size-5" /> Recommendations not generated</p>
              <p className="mt-1 text-sm">{failure}</p>
              <p className="mt-2 text-xs text-muted-foreground">Your inputs are kept — fix the issue and press the button again.</p>
            </div>
          )}
          {!loading && !failure && !result && (
            <div className="flex min-h-96 flex-col items-center justify-center rounded-2xl border border-dashed bg-card/60 p-8 text-center">
              <Sprout className="size-10 text-primary" />
              <p className="mt-3 font-semibold">Fill in your field details</p>
              <p className="max-w-md text-sm text-muted-foreground">You'll get advice on crop selection, irrigation scheduling, fertilizer, disease prevention, soil improvement, seasonal practice and saving resources.</p>
            </div>
          )}
          {!loading && result && (
            <div className="space-y-4 animate-rise">
              <div className="rounded-2xl border bg-gradient-primary p-5 text-primary-foreground shadow-lift">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-semibold uppercase tracking-wide opacity-85">{result.for}</p>
                  <DataBadge kind="ai" className="border-primary-foreground/40 bg-primary-foreground/15 text-primary-foreground" />
                </div>
                <p className="mt-2 text-lg leading-relaxed">{result.data.summary}</p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {result.data.sections.map((s) => {
                  const Icon = SECTION_ICON[s.key];
                  return (
                    <article key={s.key + s.title} className="rounded-2xl border bg-card p-5 shadow-soft">
                      <h3 className="flex items-center gap-2 font-sans text-base font-semibold"><span className="grid size-8 place-items-center rounded-lg bg-primary/10 text-primary"><Icon className="size-4" /></span>{s.title}</h3>
                      <ul className="mt-3 space-y-2 text-sm">
                        {s.points.map((p, i) => <li key={i} className="flex gap-2"><span className="mt-2 size-1.5 shrink-0 rounded-full bg-leaf" />{p}</li>)}
                      </ul>
                    </article>
                  );
                })}
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <InfoList title="Assumptions made" items={result.data.assumptions} />
                <InfoList title="Information that would help" items={result.data.missingInfo} />
                <InfoList title="Verify with" items={result.data.verifyWith} icon />
              </div>
              <p className="text-xs text-muted-foreground">
                AI guidance can be wrong. Confirm fertilizer doses and pesticide use with your KVK or agronomist. Have a follow-up question?{" "}
                <Link to="/assistant" className="font-semibold text-primary underline-offset-2 hover:underline">Ask AgriBot</Link>
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function Field({ label, error, htmlFor, children }: { label: string; error?: string | undefined; htmlFor?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error && <p className="text-xs font-medium text-danger" role="alert">{error}</p>}
    </div>
  );
}

function Choice({ value, onChange, options, placeholder }: { value: string; onChange: (v: string) => void; options: readonly string[]; placeholder?: string }) {
  return (
    <Select {...(value ? { value } : {})} onValueChange={onChange}>
      <SelectTrigger className="w-full"><SelectValue placeholder={placeholder} /></SelectTrigger>
      <SelectContent>
        {options.map((o) => <SelectItem key={o} value={o} className="capitalize">{o}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}

function InfoList({ title, items, icon }: { title: string; items: string[]; icon?: boolean }) {
  return (
    <div className="rounded-2xl border bg-secondary/60 p-4">
      <p className="text-sm font-semibold">{title}</p>
      {items.length === 0 ? <p className="mt-1 text-xs text-muted-foreground">None listed.</p> : (
        <ul className="mt-2 space-y-1.5 text-xs">
          {items.map((it, i) => <li key={i} className={cn("flex gap-1.5")}>{icon ? <BadgeCheck className="size-3.5 shrink-0 text-primary" /> : <span>•</span>}{it}</li>)}
        </ul>
      )}
    </div>
  );
}
