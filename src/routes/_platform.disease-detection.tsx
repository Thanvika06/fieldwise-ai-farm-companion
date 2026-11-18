import { useCallback, useEffect, useRef, useState, type DragEvent } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, Camera, CameraOff, CheckCircle2, FlaskConical, ImagePlus, Info, Loader2, RefreshCw, ScanLine, ShieldCheck, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/agri/page-header";
import { DataBadge } from "@/components/agri/data-badge";
import { analyzeCropImage } from "@/lib/ai.functions";
import type { CropAnalysis } from "@/lib/ai-schemas";
import { toCompressedDataUrl, validateImageFile } from "@/lib/image-utils";
import { useFarm } from "@/lib/farm-store";
import { cn } from "@/lib/utils";
import sampleLeaf from "@/assets/demo-tomato-leaf.jpg";

export const Route = createFileRoute("/_platform/disease-detection")({
  head: () => ({
    meta: [
      { title: "Crop Disease Detection · AgriSmart AI" },
      { name: "description", content: "Capture or upload a leaf photo for AI-assisted crop disease screening with symptoms, causes and next steps." },
      { property: "og:title", content: "Crop Disease Detection · AgriSmart AI" },
      { property: "og:description", content: "Capture or upload a leaf photo for AI-assisted crop disease screening with symptoms, causes and next steps." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DiseaseDetection,
});

type Source = { url: string; label: string; kind: "upload" | "camera" | "sample" };
type Outcome = { mode: "ai"; result: CropAnalysis } | { mode: "demo"; result: CropAnalysis };

/** Clearly-labelled sample result shown ONLY when the user opts into demo mode. */
const DEMO_RESULT: CropAnalysis = {
  isPlant: true,
  imageQuality: "good",
  crop: "Tomato (sample)",
  cropConfidence: 0.9,
  condition: "disease_suspected",
  possibleDisease: "Early blight (Alternaria solani) — sample result",
  confidence: 0.62,
  severity: "moderate",
  symptoms: ["Yellowing between veins on older leaves", "Small brown spots, some with faint rings", "Symptoms concentrated on lower canopy"],
  causes: ["Fungal infection favoured by warm, humid nights", "Splash from infected soil onto lower leaves", "Stress from uneven watering or low nitrogen"],
  nextSteps: ["Remove and destroy badly affected lower leaves", "Avoid overhead watering; irrigate at the base in the morning", "Ask your KVK or agronomist to confirm before using any fungicide"],
  prevention: ["Rotate with non-solanaceous crops for 2–3 seasons", "Mulch to stop soil splash", "Keep good spacing for airflow"],
  alternatives: ["Septoria leaf spot", "Nutrient deficiency (magnesium)"],
  notes: "This is a fixed demonstration result, not an analysis of any image.",
};

const CONDITION_LABEL: Record<CropAnalysis["condition"], string> = {
  healthy: "Looks healthy",
  disease_suspected: "Possible disease",
  pest_suspected: "Possible pest damage",
  nutrient_deficiency_suspected: "Possible nutrient deficiency",
  abiotic_stress_suspected: "Possible environmental stress",
  uncertain: "Uncertain — needs a closer look",
};
const SEVERITY = { none: 0, low: 1, moderate: 2, high: 3, unknown: -1 } as const;

function DiseaseDetection() {
  const { settings, recordScan } = useFarm();
  const [tab, setTab] = useState("upload");
  const [source, setSource] = useState<Source | null>(null);
  const [cropHint, setCropHint] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [error, setError] = useState<{ message: string; unavailable: boolean } | null>(null);
  const [history, setHistory] = useState<{ url: string; title: string; at: string }[]>([]);

  const setNewSource = (s: Source | null) => {
    setSource(s);
    setOutcome(null);
    setError(null);
  };

  const analyze = async () => {
    if (!source) return;
    setAnalyzing(true);
    setError(null);
    setOutcome(null);
    try {
      const image = await toCompressedDataUrl(source.url);
      const res = await analyzeCropImage({ data: { image, cropHint, language: settings.language } });
      if (!res.ok) {
        setError({ message: res.message, unavailable: res.code === "unavailable" || res.code === "credits" });
        return;
      }
      setOutcome({ mode: "ai", result: res.result });
      recordScan();
      setHistory((h) => [{ url: image, title: res.result.possibleDisease ?? CONDITION_LABEL[res.result.condition], at: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) }, ...h].slice(0, 6));
    } catch (err) {
      console.error(err);
      setError({ message: err instanceof Error && err.message.includes("Only JPG") ? err.message : "Could not analyse this image. Check your connection and try again.", unavailable: false });
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Computer vision"
        title="Crop disease detection"
        description="Take a clear photo of one affected leaf in daylight, or upload one. AI screening suggests possible problems — it is not a confirmed diagnosis."
        actions={<DataBadge kind="ai" label="AI image analysis" />}
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <section className="space-y-4 rounded-2xl border bg-card p-5 shadow-soft">
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="upload"><Upload className="mr-1.5 size-4" />Upload</TabsTrigger>
              <TabsTrigger value="camera"><Camera className="mr-1.5 size-4" />Camera</TabsTrigger>
              <TabsTrigger value="sample"><FlaskConical className="mr-1.5 size-4" />Sample</TabsTrigger>
            </TabsList>
            <TabsContent value="upload" className="mt-4">
              <UploadPanel source={source?.kind === "upload" ? source : null} onSelect={setNewSource} />
            </TabsContent>
            <TabsContent value="camera" className="mt-4">
              <CameraPanel active={tab === "camera"} source={source?.kind === "camera" ? source : null} onCapture={setNewSource} />
            </TabsContent>
            <TabsContent value="sample" className="mt-4 space-y-3">
              <img src={sampleLeaf} alt="Sample tomato leaf with spots" width={900} height={900} loading="lazy" className="aspect-[4/3] w-full rounded-xl object-cover" />
              <p className="text-sm text-muted-foreground">A sample tomato leaf photo. "Analyse" sends it to the real AI model, so you can try the full flow without your own photo.</p>
              <Button variant="outline" className="w-full" onClick={() => setNewSource({ url: sampleLeaf, label: "Sample tomato leaf", kind: "sample" })}>
                <ImagePlus /> Use this sample photo
              </Button>
            </TabsContent>
          </Tabs>

          <div className="space-y-1.5">
            <Label htmlFor="crop-hint">Crop name (optional)</Label>
            <Input id="crop-hint" value={cropHint} maxLength={40} onChange={(e) => setCropHint(e.target.value)} placeholder="e.g. Tomato, Cotton, Rice" />
          </div>

          <div className="flex items-center gap-3 rounded-xl bg-muted p-3 text-sm">
            {source ? (
              <>
                <img src={source.url} alt="" className="size-12 rounded-lg object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{source.label}</p>
                  <p className="text-xs text-muted-foreground">Ready to analyse</p>
                </div>
              </>
            ) : (
              <p className="text-muted-foreground">No image selected yet. Upload, capture or pick the sample photo.</p>
            )}
          </div>

          <Button size="lg" className="h-12 w-full rounded-xl text-base" disabled={!source || analyzing} onClick={analyze}>
            {analyzing ? <><Loader2 className="animate-spin" /> Analysing image…</> : <><ScanLine /> Analyze Crop</>}
          </Button>
        </section>

        <section className="space-y-4">
          {analyzing && <AnalyzingState />}
          {!analyzing && error && (
            <div className="rounded-2xl border border-danger/40 bg-danger/10 p-5">
              <p className="flex items-center gap-2 font-semibold text-danger"><AlertTriangle className="size-5" /> Analysis not completed</p>
              <p className="mt-1 text-sm">{error.message}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button variant="outline" onClick={analyze} disabled={!source}><RefreshCw /> Try again</Button>
                <Button variant="ghost" onClick={() => { setOutcome({ mode: "demo", result: DEMO_RESULT }); setError(null); }}>
                  <FlaskConical /> View demo result instead
                </Button>
              </div>
            </div>
          )}
          {!analyzing && outcome && <ResultCard outcome={outcome} image={source?.url} />}
          {!analyzing && !outcome && !error && (
            <div className="flex h-full min-h-80 flex-col items-center justify-center rounded-2xl border border-dashed bg-card/60 p-8 text-center">
              <ScanLine className="size-10 text-primary" />
              <p className="mt-3 font-semibold">Results appear here</p>
              <p className="max-w-sm text-sm text-muted-foreground">You'll see the likely crop, possible problem, visible symptoms, causes, next steps and prevention tips.</p>
              <Button variant="link" onClick={() => setOutcome({ mode: "demo", result: DEMO_RESULT })}>Preview a demo result</Button>
            </div>
          )}

          {history.length > 0 && (
            <div className="rounded-2xl border bg-card p-4 shadow-soft">
              <p className="mb-3 text-sm font-semibold">Scans this session</p>
              <ul className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                {history.map((h, i) => (
                  <li key={i} className="text-center">
                    <img src={h.url} alt="" className="aspect-square w-full rounded-lg object-cover" />
                    <p className="mt-1 truncate text-[10px] text-muted-foreground" title={h.title}>{h.at}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function UploadPanel({ source, onSelect }: { source: Source | null; onSelect: (s: Source | null) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const urlRef = useRef<string | null>(null);

  useEffect(() => () => { if (urlRef.current) URL.revokeObjectURL(urlRef.current); }, []);

  const handleFile = (file?: File) => {
    if (!file) return;
    const err = validateImageFile(file);
    setFileError(err);
    if (err) return;
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    const url = URL.createObjectURL(file);
    urlRef.current = url;
    onSelect({ url, label: file.name, kind: "upload" });
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files?.[0]);
  };

  return (
    <div className="space-y-3">
      <input ref={inputRef} type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" className="sr-only" onChange={(e) => { handleFile(e.target.files?.[0]); e.target.value = ""; }} aria-label="Choose leaf image" />
      {source ? (
        <div className="space-y-3">
          <img src={source.url} alt="Uploaded leaf preview" className="aspect-[4/3] w-full rounded-xl object-cover" />
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" onClick={() => inputRef.current?.click()}><RefreshCw /> Replace</Button>
            <Button variant="outline" className="text-danger" onClick={() => onSelect(null)}><Trash2 /> Remove</Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={cn("flex aspect-[4/3] w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 text-center transition-colors", dragging ? "border-primary bg-primary/10" : "border-input bg-muted/50 hover:bg-muted")}
        >
          <Upload className="size-8 text-primary" />
          <span className="font-semibold">Drag & drop a leaf photo</span>
          <span className="text-sm text-muted-foreground">or click to browse · JPG, JPEG, PNG, WEBP up to 10 MB</span>
        </button>
      )}
      {fileError && <p className="text-sm font-medium text-danger" role="alert">{fileError}</p>}
    </div>
  );
}

function CameraPanel({ active, source, onCapture }: { active: boolean; source: Source | null; onCapture: (s: Source | null) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [state, setState] = useState<"idle" | "starting" | "live" | "error">("idle");
  const [camError, setCamError] = useState<string | null>(null);

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setState((s) => (s === "live" || s === "starting" ? "idle" : s));
  }, []);

  useEffect(() => { if (!active) stop(); }, [active, stop]);
  useEffect(() => () => stop(), [stop]);

  const open = async () => {
    setCamError(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setState("error");
      setCamError("This browser does not support camera access. Try Upload instead.");
      return;
    }
    setState("starting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 } }, audio: false });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setState("live");
    } catch (err) {
      const name = err instanceof DOMException ? err.name : "";
      setState("error");
      setCamError(
        name === "NotAllowedError" ? "Camera permission was denied. Allow camera access in your browser settings, then try again."
          : name === "NotFoundError" ? "No camera was found on this device."
          : name === "NotReadableError" ? "The camera is being used by another app."
          : "Could not start the camera. Try Upload instead.",
      );
    }
  };

  const capture = () => {
    const v = videoRef.current;
    if (!v || !v.videoWidth) return;
    const canvas = document.createElement("canvas");
    canvas.width = v.videoWidth;
    canvas.height = v.videoHeight;
    canvas.getContext("2d")?.drawImage(v, 0, 0);
    onCapture({ url: canvas.toDataURL("image/jpeg", 0.9), label: `Camera capture ${new Date().toLocaleTimeString("en-IN")}`, kind: "camera" });
    stop();
    toast.success("Photo captured");
  };

  if (source) {
    return (
      <div className="space-y-3">
        <img src={source.url} alt="Captured leaf" className="aspect-[4/3] w-full rounded-xl object-cover" />
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" onClick={() => { onCapture(null); void open(); }}><RefreshCw /> Retake</Button>
          <Button variant="outline" className="text-danger" onClick={() => onCapture(null)}><Trash2 /> Discard</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-foreground/90">
        <video ref={videoRef} playsInline muted className={cn("size-full object-cover", state !== "live" && "hidden")} />
        {state !== "live" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center text-background">
            {state === "starting" ? <Loader2 className="size-8 animate-spin" /> : state === "error" ? <CameraOff className="size-8" /> : <Camera className="size-8" />}
            <p className="text-sm">{state === "starting" ? "Waiting for camera permission…" : state === "error" ? camError : "Camera is off. Permission is requested only when you open it."}</p>
          </div>
        )}
        {state === "live" && <div className="pointer-events-none absolute inset-8 rounded-2xl border-2 border-dashed border-background/70" />}
      </div>
      {state === "live" ? (
        <div className="grid grid-cols-2 gap-2">
          <Button onClick={capture}><Camera /> Capture</Button>
          <Button variant="outline" onClick={stop}><CameraOff /> Close camera</Button>
        </div>
      ) : (
        <Button className="w-full" onClick={open} disabled={state === "starting"}><Camera /> Open Camera</Button>
      )}
    </div>
  );
}

function AnalyzingState() {
  const [progress, setProgress] = useState(8);
  useEffect(() => {
    const t = setInterval(() => setProgress((p) => Math.min(92, p + Math.random() * 9)), 600);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="rounded-2xl border bg-card p-6 shadow-soft">
      <p className="flex items-center gap-2 font-semibold"><Loader2 className="size-5 animate-spin text-primary" /> Analysing leaf image</p>
      <p className="mt-1 text-sm text-muted-foreground">Checking image quality, identifying the plant and looking for visible symptoms…</p>
      <Progress value={progress} className="mt-4 h-2" />
    </div>
  );
}

function ResultCard({ outcome, image }: { outcome: Outcome; image?: string }) {
  const r = outcome.result;
  const sev = SEVERITY[r.severity];
  const unusable = !r.isPlant || r.imageQuality === "poor";
  return (
    <article className="animate-rise space-y-4 rounded-2xl border bg-card p-5 shadow-lift">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <DataBadge kind={outcome.mode === "ai" ? "ai" : "demo"} label={outcome.mode === "ai" ? "AI screening result" : "DEMO result — not your image"} />
        <span className="text-xs text-muted-foreground">Image quality: {r.imageQuality}</span>
      </div>

      {unusable ? (
        <div className="rounded-xl border border-warning/50 bg-warning/15 p-4 text-sm">
          <p className="font-semibold">{!r.isPlant ? "No plant could be identified in this image." : "The image is too unclear to assess."}</p>
          <p className="mt-1 text-muted-foreground">{r.notes || "Retake the photo in daylight, close to one leaf, with the affected area in focus."}</p>
        </div>
      ) : (
        <>
          <div className="flex gap-4">
            {image && outcome.mode === "ai" && <img src={image} alt="" className="hidden size-24 shrink-0 rounded-xl object-cover sm:block" />}
            <div className="min-w-0 space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{r.crop ? `Detected crop: ${r.crop}` : "Crop not identified"}{r.cropConfidence != null && ` · ~${Math.round(r.cropConfidence * 100)}%`}</p>
              <h2 className="text-2xl font-semibold">{r.condition === "healthy" ? "No clear disease visible" : r.possibleDisease ?? CONDITION_LABEL[r.condition]}</h2>
              <p className={cn("inline-flex items-center gap-1.5 text-sm font-medium", r.condition === "healthy" ? "text-success" : "text-warning-foreground dark:text-warning")}>
                {r.condition === "healthy" ? <CheckCircle2 className="size-4" /> : <AlertTriangle className="size-4" />}{CONDITION_LABEL[r.condition]}
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border bg-background p-3">
              <p className="text-xs text-muted-foreground">Model-estimated confidence</p>
              {r.confidence != null ? (
                <>
                  <p className="font-display text-xl font-semibold">{Math.round(r.confidence * 100)}%</p>
                  <Progress value={r.confidence * 100} className="mt-1 h-1.5" />
                  <p className="mt-1 text-[11px] text-muted-foreground">The AI's own rough estimate — not a lab-verified probability.</p>
                </>
              ) : <p className="mt-1 text-sm">Not provided</p>}
            </div>
            <div className="rounded-xl border bg-background p-3">
              <p className="text-xs text-muted-foreground">Severity</p>
              <p className="font-display text-xl font-semibold capitalize">{r.severity}</p>
              <div className="mt-1 grid grid-cols-3 gap-1" aria-hidden>
                {[1, 2, 3].map((n) => (
                  <span key={n} className={cn("h-1.5 rounded-full", sev >= n ? (n === 3 ? "bg-danger" : n === 2 ? "bg-warning" : "bg-leaf") : "bg-muted")} />
                ))}
              </div>
            </div>
          </div>

          <ResultList title="Visible symptoms" items={r.symptoms} />
          <ResultList title="Possible causes" items={r.causes} />
          <ResultList title="Recommended next steps" items={r.nextSteps} highlight />
          <ResultList title="Preventive measures" items={r.prevention} />
          {r.alternatives.length > 0 && <ResultList title="Could also be" items={r.alternatives} />}
          {r.notes && <p className="flex gap-2 text-sm text-muted-foreground"><Info className="mt-0.5 size-4 shrink-0" />{r.notes}</p>}
        </>
      )}

      <div className="flex gap-3 rounded-xl bg-secondary p-4 text-sm text-secondary-foreground">
        <ShieldCheck className="size-5 shrink-0" />
        <p>
          This is an AI-assisted screening, not a confirmed diagnosis. Before spraying or any major treatment, confirm with an agronomist, your local KVK or the state agriculture department.{" "}
          <Link to="/assistant" className="font-semibold underline underline-offset-2">Ask AgriBot follow-up questions</Link>
        </p>
      </div>
    </article>
  );
}

function ResultList({ title, items, highlight }: { title: string; items: string[]; highlight?: boolean }) {
  if (items.length === 0) return null;
  return (
    <div>
      <h3 className="mb-1.5 font-sans text-sm font-semibold">{title}</h3>
      <ul className={cn("space-y-1.5 text-sm", highlight && "rounded-xl bg-primary/5 p-3")}>
        {items.map((it, i) => (
          <li key={i} className="flex gap-2"><span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />{it}</li>
        ))}
      </ul>
    </div>
  );
}
