import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BarChart3, CloudSun, FileText, Map, MessageCircle, ScanLine, ShieldCheck, Sprout } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroImg from "@/assets/agrismart-fields.jpg";
import logo from "@/assets/agrismart-logo.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AgriSmart AI – Smart Farming Starts with AI" },
      { name: "description", content: "Farm dashboard, digital twin, crop disease photo screening, AI recommendations and a multilingual farming chatbot for Indian farmers." },
      { property: "og:title", content: "AgriSmart AI – Smart Farming Starts with AI" },
      { property: "og:description", content: "Farm dashboard, digital twin, crop disease photo screening, AI recommendations and a multilingual farming chatbot for Indian farmers." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const FEATURES = [
  { icon: BarChart3, title: "Farm dashboard", text: "Crop health, soil, irrigation, disease and growth at a glance.", to: "/dashboard" },
  { icon: Map, title: "Digital twin", text: "A living map of every plot. Run what-if moisture and heat scenarios.", to: "/digital-twin" },
  { icon: ScanLine, title: "Disease screening", text: "Snap or upload a leaf photo for an AI-assisted health check.", to: "/disease-detection" },
  { icon: Sprout, title: "AI recommendations", text: "Personalised advice on irrigation, fertilizer, soil and seasons.", to: "/recommendations" },
  { icon: MessageCircle, title: "AgriBot assistant", text: "Ask farming questions in English, Hindi, Marathi, Tamil and more.", to: "/assistant" },
  { icon: CloudSun, title: "Weather & irrigation", text: "Live forecasts turned into plot-by-plot watering advice.", to: "/weather" },
] as const;

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <section className="relative isolate min-h-[92vh] overflow-hidden">
        <img src={heroImg} alt="Green paddy fields at sunrise" width={1536} height={1024} className="absolute inset-0 -z-20 size-full object-cover" />
        <div className="absolute inset-0 -z-10 bg-hero-overlay" />
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 md:px-8">
          <Link to="/" className="flex items-center gap-2.5">
            <img src={logo} alt="" width={40} height={40} className="size-10 rounded-xl bg-card/95 p-1" />
            <span className="font-display text-xl font-semibold text-hero-foreground">AgriSmart AI</span>
          </Link>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" className="hidden text-hero-foreground hover:bg-hero-foreground/10 hover:text-hero-foreground sm:inline-flex">
              <Link to="/analytics">Analytics</Link>
            </Button>
            <Button asChild className="bg-card text-foreground hover:bg-card/90">
              <Link to="/dashboard">Open app</Link>
            </Button>
          </div>
        </nav>

        <div className="mx-auto flex max-w-7xl flex-col justify-center px-5 pb-24 pt-16 md:px-8 md:pt-28">
          <div className="max-w-2xl animate-rise">
            <p className="glass mb-6 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold text-foreground">
              <span className="size-1.5 rounded-full bg-leaf" /> AgriSmart AI · Intelligent Farming Assistant
            </p>
            <h1 className="text-5xl font-semibold leading-[1.04] text-hero-foreground md:text-7xl">Smart Farming Starts with AI</h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-hero-foreground/90">
              Watch every plot on a digital twin, screen leaf photos for disease, plan irrigation from live weather and get clear answers in your
              own language — built for Indian farms.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Button asChild size="lg" className="h-12 rounded-xl bg-leaf px-6 text-base font-semibold text-leaf-foreground hover:bg-leaf/90">
                <Link to="/dashboard">
                  Explore Dashboard <ArrowRight />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="glass h-12 rounded-xl px-6 text-base font-semibold text-foreground hover:bg-card">
                <Link to="/assistant">
                  <MessageCircle /> Try AI Assistant
                </Link>
              </Button>
            </div>
          </div>

          <div className="mt-16 grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              ["8", "crops on the demo farm"],
              ["9", "languages for AI answers"],
              ["7-day", "live weather forecast"],
              ["24.5 ac", "sample farm mapped"],
            ].map(([v, l]) => (
              <div key={l} className="glass rounded-2xl px-4 py-3">
                <p className="font-display text-2xl font-semibold text-foreground">{v}</p>
                <p className="text-xs text-muted-foreground">{l}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-20 md:px-8">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">One platform</p>
          <h2 className="mt-2 text-3xl font-semibold md:text-4xl">Everything a farm decision needs, in one place</h2>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <Link key={f.title} to={f.to} className="group rounded-2xl border bg-card p-6 shadow-soft transition-all hover:-translate-y-1 hover:shadow-lift">
              <span className="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary">
                <f.icon className="size-5" />
              </span>
              <h3 className="mt-4 font-sans text-lg font-semibold">{f.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{f.text}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary">
                Open <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="border-y bg-secondary/50">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-16 md:grid-cols-[1.2fr_1fr] md:px-8">
          <div>
            <ShieldCheck className="size-8 text-primary" />
            <h2 className="mt-3 text-3xl font-semibold">Honest by design</h2>
            <p className="mt-3 max-w-xl text-muted-foreground">
              Every number is labelled: <strong className="text-foreground">Sample</strong> for demonstration farm data,{" "}
              <strong className="text-foreground">Live</strong> for real weather, and <strong className="text-foreground">AI-generated</strong> for model
              output. Photo screening shows uncertainty and always recommends expert confirmation before major treatment.
            </p>
          </div>
          <div className="flex flex-col justify-center gap-3">
            <Button asChild size="lg" className="h-12 rounded-xl">
              <Link to="/disease-detection">
                <ScanLine /> Scan a leaf photo
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-12 rounded-xl">
              <Link to="/reports">
                <FileText /> Download a sample farm report
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <footer className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-5 py-8 text-sm text-muted-foreground md:flex-row md:px-8">
        <p>© 2026 AgriSmart AI. Guidance only — confirm major decisions with your local KVK or agronomist.</p>
        <div className="flex gap-4">
          <Link to="/dashboard" className="hover:text-foreground">Dashboard</Link>
          <Link to="/assistant" className="hover:text-foreground">AgriBot</Link>
          <Link to="/settings" className="hover:text-foreground">Settings</Link>
        </div>
      </footer>
    </div>
  );
}
