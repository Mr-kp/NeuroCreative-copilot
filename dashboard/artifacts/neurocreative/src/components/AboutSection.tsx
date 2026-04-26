import { useState } from "react";
import {
  Brain,
  Layers,
  Cpu,
  Database,
  Users,
  Calendar,
  TrendingDown,
  Activity,
  BarChart3,
  Target,
  ChevronDown,
} from "lucide-react";
import { Reveal, Bold } from "@/components/ScrollReveal";

const DATASET_STATS = [
  { label: "Creatives", value: "1,080", icon: Layers },
  { label: "Campaigns", value: "180", icon: Calendar },
  { label: "Advertisers", value: "36", icon: Users },
  { label: "Daily rows", value: "52,349", icon: Database },
  { label: "Features (leak-free)", value: "77", icon: Cpu },
  { label: "TRIBE V2 scores", value: "75 real + 1,005 imputed", icon: Brain },
];

const TRIBE_SCORES = [
  { name: "Attention", what: "Alpha desynchronization, frontal theta, P300 ERP", finding: "Top performers ~36/100, underperformers ~50/100", sig: "p=0.017" },
  { name: "Reward", what: "Ventral striatum, NAcc, vmPFC, dopaminergic midbrain", finding: "Lower reward activation = more fluent processing", sig: "p=0.030" },
  { name: "Memory", what: "Hippocampal theta-gamma coupling, Late Positive Potential", finding: "Less activation needed for memorable ads", sig: "p=0.015" },
  { name: "Emotion", what: "Frontal alpha asymmetry, amygdala BOLD", finding: "Strongest discriminator (lowest p-value)", sig: "p=0.009" },
  { name: "Visual Load", what: "Overall cortical activation, frontal theta increase", finding: "High visual load correlates with worse performance", sig: "p=0.019" },
];

const DECAY_STATS = [
  { label: "Creatives with declining CTR", value: "86.5%", detail: "Fatigue is the rule, not the exception" },
  { label: "Average CTR half-life", value: "~16 days", detail: "Half the click-through rate gone in two weeks" },
  { label: "Prophet fits", value: "1,080/1,080", detail: "Every creative got a decay model, zero fallbacks" },
  { label: "Parametric best-fit", value: "Exponential", detail: "Most creatives follow exp decay, minority power-law" },
];

const HAZARD_ROWS = [
  { feature: "motion_score", hr: "5.51", p: "0.004", note: "Strongest fatigue signal in the dataset", dir: "risk" },
  { feature: "has_discount_badge", hr: "1.96", p: "0.009", note: "Discount messaging burns out fast", dir: "risk" },
  { feature: "duration_sec", hr: "1.01", p: "0.037", note: "Per-second increase in fatigue risk", dir: "risk" },
  { feature: "faces_count", hr: "0.85", p: "0.043", note: "Each face extends lifespan ~15%", dir: "protect" },
  { feature: "novelty_score", hr: "0.98", p: "0.890", note: "Not significant in Cox (but high in LightGBM)", dir: "neutral" },
];

const FEAT_IMP = [
  { r: 1, n: "daily_budget_usd", v: 346 },
  { r: 2, n: "vertical", v: 213 },
  { r: 3, n: "novelty_score", v: 197 },
  { r: 4, n: "format", v: 172 },
  { r: 5, n: "motion_score", v: 144 },
  { r: 6, n: "novelty x saturation", v: 142 },
  { r: 7, n: "clutter_score", v: 123 },
  { r: 8, n: "emotion_score (TRIBE V2)", v: 121 },
  { r: 9, n: "saturation_std (PIL)", v: 118 },
  { r: 10, n: "objective", v: 112 },
  { r: 11, n: "readability_score", v: 112 },
  { r: 12, n: "target_os", v: 111 },
  { r: 13, n: "clutter x edge_density", v: 105 },
  { r: 14, n: "emotional_tone", v: 102 },
  { r: 15, n: "symmetry_h / symmetry_v", v: 100 },
];

const REC_LOGIC = [
  { cond: "fatigue_prob > 0.7 AND ctr_decay < -70%", action: "Pivot Creative", style: "text-rose-500 bg-rose-500/10 border-rose-500/20" },
  { cond: "fatigue_prob > 0.5 AND ctr_decay < -50%", action: "Refresh Soon", style: "text-amber-500 bg-amber-500/10 border-amber-500/20" },
  { cond: "top_performer AND roas > 2.0 AND fatigue_prob < 0.3", action: "Scale", style: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20" },
  { cond: "underperformer AND roas < 1.0 AND fatigue_prob > 0.4", action: "Pause", style: "text-rose-600 bg-rose-600/10 border-rose-600/20" },
  { cond: "otherwise (73% of creatives)", action: "Monitor", style: "text-sky-500 bg-sky-500/10 border-sky-500/20" },
];

const maxImp = FEAT_IMP[0].v;

const ACCORDION_ITEMS = [
  {
    id: "tribe",
    icon: Brain,
    iconColor: "text-purple-500",
    title: "TRIBE V2 brain encoding",
    content: (
      <div className="space-y-4">
        <div className="text-sm text-muted-foreground leading-relaxed space-y-2">
          <p>
            TRIBE V2 is a foundation model from <Bold>Meta FAIR</Bold> that predicts how the human brain
            responds to images, video, audio, and text. Trained on <Bold>500+ hours of fMRI recordings from
            700+ volunteers</Bold>, it outputs predicted activity across <Bold>20,484 cortical vertices</Bold>.
          </p>
          <p>
            75 creatives scored on a T4 GPU. The vertex predictions were averaged into 5 scalar scores:
            attention, reward, memory, emotion, and visual load. A LightGBM regressor imputed the remaining
            1,005.
          </p>
        </div>

        <div className="rounded-xl border border-purple-500/20 bg-purple-500/3 p-4 text-sm text-muted-foreground leading-relaxed">
          <span className="font-semibold text-foreground">Neural efficiency — confirmed.</span>{" "}
          Top performers score <Bold>12-15 points lower</Bold> across all 5 dimensions (r ~ -0.24 to -0.27, all p {"<"} 0.05).
        </div>

        <div className="space-y-1.5">
          {TRIBE_SCORES.map((s) => (
            <div key={s.name} className="rounded-lg border border-border/60 bg-card/30 p-2.5 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
              <span className="font-mono-tight text-xs font-semibold text-foreground w-24 flex-shrink-0">{s.name}</span>
              <span className="text-[11px] text-muted-foreground flex-1">{s.what}</span>
              <span className="text-[11px] text-muted-foreground/80 max-w-[200px]">{s.finding}</span>
              <span className="font-mono-tight text-[11px] text-purple-500/80 flex-shrink-0">{s.sig}</span>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: "decay",
    icon: TrendingDown,
    iconColor: "text-amber-500",
    title: "CTR decay forecasting",
    content: (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground leading-relaxed">
          <Bold>Prophet</Bold> (Meta's time-series library) fit to each creative's daily CTR. Scipy fits
          exponential and power-law parametric models in parallel. From each: decay rate, half-life,
          14-day forward forecast.
        </p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {DECAY_STATS.map((d) => (
            <div key={d.label} className="rounded-xl border border-border/60 bg-card/40 p-3.5 text-center">
              <div className="font-mono-tight text-base font-bold text-foreground">{d.value}</div>
              <div className="text-[11px] font-medium text-foreground/80 mt-0.5">{d.label}</div>
              <div className="text-[10px] text-muted-foreground mt-1">{d.detail}</div>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: "survival",
    icon: Activity,
    iconColor: "text-sky-500",
    title: "Survival analysis & creative health",
    content: (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground leading-relaxed">
          Creative fatigue modeled as a survival problem. <Bold>Cox PH (concordance = 0.82)</Bold> quantifies
          which features accelerate or delay fatigue. Combined with LightGBM fatigue probability into the
          creative health monitor.
        </p>
        <div className="rounded-xl border border-border/60 overflow-hidden">
          <div className="grid grid-cols-[1fr_50px_45px_1fr] gap-2 px-3 py-2 text-[10px] font-mono-tight uppercase tracking-wider text-muted-foreground/60 border-b border-border/40 bg-muted/20">
            <span>feature</span><span className="text-right">HR</span><span className="text-right">p</span><span>note</span>
          </div>
          {HAZARD_ROWS.map((r) => (
            <div key={r.feature} className="grid grid-cols-[1fr_50px_45px_1fr] gap-2 px-3 py-2 border-b border-border/20 last:border-0 text-xs items-center">
              <span className="font-mono-tight text-foreground/90">{r.feature}</span>
              <span className={`font-mono-tight font-semibold text-right ${r.dir === "risk" ? "text-rose-500" : r.dir === "protect" ? "text-emerald-500" : "text-muted-foreground"}`}>{r.hr}</span>
              <span className="font-mono-tight text-right text-muted-foreground">{r.p}</span>
              <span className="text-muted-foreground text-[11px]">{r.note}</span>
            </div>
          ))}
        </div>

        <div className="space-y-2">
          <div className="text-xs font-semibold">Recommendation matrix</div>
          {REC_LOGIC.map((r) => (
            <div key={r.action} className="flex items-start gap-3 rounded-lg border border-border/60 bg-card/30 p-2.5">
              <span className={`text-[10px] font-mono-tight font-semibold px-2 py-0.5 rounded border ${r.style} flex-shrink-0`}>{r.action}</span>
              <code className="text-[11px] text-muted-foreground leading-relaxed">{r.cond}</code>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: "features",
    icon: BarChart3,
    iconColor: "text-primary",
    title: "Feature importance (77 features, leak-free)",
    content: (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground leading-relaxed">
          Only pre-launch information — no future KPIs, no target leakage. GroupShuffleSplit by campaign.
          TRIBE V2's <Bold>emotion score ranks #8</Bold> overall. Accuracy: 76.4%.
        </p>
        <div className="space-y-1.5">
          {FEAT_IMP.map((f) => (
            <div key={f.r} className="flex items-center gap-3">
              <span className="font-mono-tight text-[10px] text-muted-foreground/60 w-5 text-right">{f.r}</span>
              <div className="flex-1 min-w-0">
                <span className={`font-mono-tight text-xs ${f.n.includes("TRIBE") ? "text-purple-500 font-semibold" : "text-foreground/90"} truncate block`}>{f.n}</span>
                <div className="mt-0.5 h-1.5 rounded-full bg-muted/50 overflow-hidden">
                  <div className={`h-full rounded-full ${f.n.includes("TRIBE") ? "bg-purple-500/70" : "bg-primary/50"}`} style={{ width: `${(f.v / maxImp) * 100}%` }} />
                </div>
              </div>
              <span className="font-mono-tight text-[10px] text-muted-foreground w-10 text-right">{f.v}</span>
            </div>
          ))}
        </div>
      </div>
    ),
  },
];

export function AboutSection() {
  const [openItems, setOpenItems] = useState<string[]>([]);

  const toggle = (id: string) => {
    setOpenItems((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  return (
    <div className="flex flex-col items-center">
      <div className="w-full max-w-3xl space-y-16">

        {/* ── Hero ─────────────────────────────────────────────────── */}
        <Reveal>
          <section className="text-center">
            <h2 className="font-display text-4xl sm:text-5xl leading-[1.1] tracking-tight">
              About the <span className="italic text-primary">approach</span>
            </h2>
            <p className="mt-4 text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              We used <Bold>Meta's TRIBE V2</Bold> — an open-source brain encoding model that predicts
              fMRI responses to visual stimuli — to score how each ad creative stimulates
              attention, reward, memory, emotion, and visual processing in the brain. Then we
              combined those scores with <Bold>CTR decay forecasting</Bold> and <Bold>survival analysis</Bold> to build
              a creative health monitor that tells you which ads are fatiguing, why, and what
              to do about it.
            </p>
          </section>
        </Reveal>

        {/* ── Dataset ─────────────────────────────────────────────── */}
        <Reveal>
          <section className="text-center">
            <h3 className="text-lg font-semibold mb-5">What we started with</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {DATASET_STATS.map((s) => {
                const Icon = s.icon;
                return (
                  <div key={s.label} className="rounded-xl border border-border/60 bg-card/40 p-4 text-center space-y-2">
                    <Icon className="h-4 w-4 text-primary mx-auto" />
                    <div className="font-mono-tight text-base font-bold text-foreground">{s.value}</div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground leading-tight">{s.label}</div>
                  </div>
                );
              })}
            </div>
          </section>
        </Reveal>

        {/* ── Technical Details Accordion ──────────────────────────── */}
        <Reveal>
          <section>
            <h3 className="text-lg font-semibold mb-5 text-center">Technical deep dive</h3>
            <div className="space-y-2">
              {ACCORDION_ITEMS.map((item) => {
                const Icon = item.icon;
                const isOpen = openItems.includes(item.id);
                return (
                  <div
                    key={item.id}
                    className={`rounded-xl border transition-colors ${
                      isOpen ? "border-border bg-card/40" : "border-border/40 bg-transparent"
                    }`}
                  >
                    <button
                      onClick={() => toggle(item.id)}
                      className="flex items-center justify-between w-full px-4 py-3.5 text-left"
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className={`h-4 w-4 ${item.iconColor}`} />
                        <span className="text-sm font-semibold">{item.title}</span>
                      </div>
                      <ChevronDown
                        className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${
                          isOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                    <div
                      className="overflow-hidden transition-all duration-300"
                      style={{
                        maxHeight: isOpen ? "2000px" : "0px",
                        opacity: isOpen ? 1 : 0,
                      }}
                    >
                      <div className="px-4 pb-4">{item.content}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </Reveal>

        {/* ── Why this approach ────────────────────────────────────── */}
        <Reveal>
          <section className="text-center">
            <h3 className="text-lg font-semibold mb-3">Why this approach</h3>
            <div className="text-base text-muted-foreground leading-relaxed max-w-2xl mx-auto space-y-3">
              <p>
                The core idea: ad performance data (CTR, ROAS, CVR) tells you <em>what</em> happened.
                Brain response predictions tell you <em>why</em>. A creative with high attention but low
                memory score gets seen but not remembered. One with high reward but fast decay generates
                initial excitement that fades quickly. The combination surfaces <Bold>patterns that KPIs alone
                miss</Bold>.
              </p>
              <p>
                The survival analysis layer adds timing: not just "is this ad fatiguing?" but "when will
                it drop below threshold?" and "which features should I change to extend its lifespan?" The
                copilot advisor then makes all of this interpretable — it receives the full pipeline output
                plus a knowledge base of neuroscience and advertising research, and <Bold>answers questions in
                natural language</Bold> about any creative.
              </p>
            </div>
          </section>
        </Reveal>

        {/* ── Limitations ──────────────────────────────────────────── */}
        <Reveal>
          <section className="text-center">
            <h3 className="text-lg font-semibold mb-3">Limitations</h3>
            <div className="text-sm text-muted-foreground leading-relaxed max-w-2xl mx-auto space-y-2">
              <p>
                Brain scores are model predictions, not measurements of real brain activity. We predict
                brain-inspired response patterns and test whether they correlate with KPI outcomes — the
                75 real TRIBE V2 scores support this connection, but the sample is small. The remaining
                1,005 scores are imputed, which adds approximation error.
              </p>
              <p>
                The 76.4% accuracy is on a synthetic dataset with clean class boundaries. Real-world
                creative performance is noisier. This is a decision-support prototype, not a production
                prediction engine.
              </p>
            </div>
          </section>
        </Reveal>

        {/* ── Stack ────────────────────────────────────────────────── */}
        <Reveal>
          <section className="text-center">
            <h3 className="text-lg font-semibold mb-3">Stack</h3>
            <div className="font-mono-tight text-xs leading-loose text-muted-foreground bg-muted/30 rounded-lg p-5 overflow-x-auto text-left max-w-xl mx-auto">
              <pre>{`Brain encoding   TRIBE V2 (V-JEPA2 + LLaMA 3.2 + Wav2Vec-BERT)
Decay curves     Prophet + scipy (exponential / power-law)
Survival         Cox PH (concordance 0.82) + Kaplan-Meier
ML pipeline      LightGBM, 77 features, SMOTE, Optuna
Image features   PIL: brightness, saturation, edges, symmetry
Backend          FastAPI + SSE streaming
Frontend         React 19 + Vite 6 + Tailwind 4 + Recharts
Copilot          GPT-4o-mini / Gemini 2.0 Flash / rules`}</pre>
            </div>
          </section>
        </Reveal>

      </div>
    </div>
  );
}
