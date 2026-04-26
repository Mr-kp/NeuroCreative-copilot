import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip as UiTooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Brain, Info, Sparkles } from "lucide-react";
import type { Creative } from "@/data/smadexData";
import brainImage from "@/assets/brain-activity.png";

interface BrainActivity3DProps {
  creative: Creative;
}

type RegionKey = "attention" | "reward" | "memory" | "visualLoad" | "emotion";

interface RegionDef {
  key: RegionKey;
  label: string;
  metricLabel: string;
  /** Hex color used for hotspot glow + accents */
  color: string;
  /** Position over the brain image as percentages (0–100) */
  pos: { x: number; y: number };
  anatomy: string;
  description: string;
}

/**
 * Hotspot positions are calibrated to the generated brain-activity.png.
 * The image shows a side view with the cerebellum (textured cauliflower
 * region) at the bottom-LEFT, which means the OCCIPITAL (back) lobe is on
 * the LEFT side and the FRONTAL lobe is on the RIGHT side of the image.
 * Coordinates are %-of-container.
 */
const REGIONS: RegionDef[] = [
  {
    key: "attention",
    label: "Attention",
    metricLabel: "Attention Score",
    color: "#60a5fa", // blue-400 — early gaze lock
    pos: { x: 62, y: 28 }, // top of frontal lobe (right side)
    anatomy: "Frontal cortex",
    description:
      "Estimated likelihood the eye locks onto the asset in the first 2 seconds.",
  },
  {
    key: "reward",
    label: "Reward",
    metricLabel: "Reward Signal",
    color: "#ec4899", // pink-500 — dopamine
    pos: { x: 50, y: 47 }, // center / limbic core
    anatomy: "Limbic / reward center",
    description: "Estimated dopaminergic response — desire and pull-to-act.",
  },
  {
    key: "memory",
    label: "Memory",
    metricLabel: "Memory Potential",
    color: "#a78bfa", // violet-400
    pos: { x: 58, y: 62 }, // temporal lobe (lower side)
    anatomy: "Temporal lobe",
    description: "Estimated brand and message recall after viewing.",
  },
  {
    key: "visualLoad",
    label: "Visual Load",
    metricLabel: "Visual Load",
    color: "#fbbf24", // amber-400 — caution signal
    pos: { x: 30, y: 42 }, // occipital lobe (back of head, left of image)
    anatomy: "Occipital cortex",
    description:
      "Estimated mental effort to decode the visuals — high values often hurt CTR.",
  },
  {
    key: "emotion",
    label: "Emotion",
    metricLabel: "Emotional Intensity",
    color: "#f472b6", // pink-400 — affective response
    pos: { x: 60, y: 72 }, // ventromedial / orbital (lower-front)
    anatomy: "Ventromedial / orbital area",
    description: "Estimated affective response — warmth, surprise, resonance.",
  },
];

// ────────────────────────────── derivation ────────────────────────────────

function deriveScores(c: Creative): Record<RegionKey, number> {
  const b = c.brainScores;
  const emotion = Math.round((b.noveltyResponse + (100 - b.cognitiveLoad)) / 2);
  return {
    attention: b.attention,
    reward: b.engagement,
    memory: b.recall,
    visualLoad: b.cognitiveLoad,
    emotion,
  };
}

function intensity(score: number): number {
  // 0..1 normalized opacity / scale driver
  return Math.max(0.18, Math.min(1, score / 100));
}

function scoreLabel(score: number): string {
  if (score >= 75) return "Strong";
  if (score >= 50) return "Moderate";
  if (score >= 30) return "Mild";
  return "Low";
}

function loadLabel(load: number): "Low" | "Moderate" | "High" {
  if (load >= 60) return "High";
  if (load >= 35) return "Moderate";
  return "Low";
}

function fatigueLabel(risk: number): string {
  if (risk >= 70) return "Severe";
  if (risk >= 40) return "Elevated";
  if (risk >= 20) return "Mild";
  return "Low";
}

// Dominance is computed across the four "positive" engagement signals only —
// visual load is shown separately on its own row because high values are a
// negative outcome, not a "dominant" good signal.
type PositiveRegionKey = Exclude<RegionKey, "visualLoad">;

function buildInsight(
  c: Creative,
  scores: Record<RegionKey, number>,
  dominant: PositiveRegionKey,
): string {
  const dom = REGIONS.find((r) => r.key === dominant)!;
  const load = scores.visualLoad;
  const fatigue = c.fatigueRisk;

  if (dominant === "attention" && load >= 50) {
    return `${c.id} shows high attention activation but elevated visual load, which may explain strong early CTR followed by faster fatigue.`;
  }
  if (dominant === "reward" && fatigue < 50) {
    return `${c.id} leans on reward signaling with a healthy fatigue trajectory — a good candidate to scale spend gradually.`;
  }
  if (dominant === "memory") {
    return `${c.id} is memory-heavy — strong recall potential, but it may need a faster hook to convert in the first 3 seconds.`;
  }
  if (dominant === "emotion") {
    return `${c.id} drives emotion above all other signals — pair it with a stronger CTA to convert that resonance into action.`;
  }
  return `${c.id} is led by ${dom.label.toLowerCase()} signaling (${scores[dominant]}%) with cognitive load at ${load}% and fatigue risk ${fatigue}%.`;
}

// ────────────────────────────── components ────────────────────────────────

interface HotspotProps {
  region: RegionDef;
  score: number;
  hovered: boolean;
  onHover: (k: RegionKey | null) => void;
}

function Hotspot({ region, score, hovered, onHover }: HotspotProps) {
  const i = intensity(score);
  // Restrained sizing — tuned to read as elegant, not neon.
  const haloSize = 38 + i * 34;
  const coreSize = 7 + i * 7;
  return (
    <div
      className="group absolute -translate-x-1/2 -translate-y-1/2"
      style={{ left: `${region.pos.x}%`, top: `${region.pos.y}%` }}
      onMouseEnter={() => onHover(region.key)}
      onMouseLeave={() => onHover(null)}
      data-testid={`brain-hotspot-${region.key}`}
    >
      {/* Soft pulsing halo — subtle, no neon overload */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          width: `${haloSize}px`,
          height: `${haloSize}px`,
          background: `radial-gradient(circle, ${region.color}${Math.round(i * 48).toString(16).padStart(2, "0")} 0%, ${region.color}00 70%)`,
          opacity: hovered ? 0.95 : 0.7,
          animation: `brainPulse ${3.2 + (1 - i) * 1.6}s ease-in-out infinite`,
          transition: "opacity 200ms",
        }}
      />
      {/* Core dot */}
      <div
        className="relative cursor-pointer rounded-full ring-1 ring-white/50"
        style={{
          width: `${coreSize}px`,
          height: `${coreSize}px`,
          background: `radial-gradient(circle at 30% 30%, #fff 0%, ${region.color} 60%, ${region.color} 100%)`,
          boxShadow: `0 0 ${coreSize * 0.9}px ${region.color}aa`,
          transform: hovered ? "scale(1.2)" : "scale(1)",
          transition: "transform 180ms ease-out",
        }}
      />
      {/* Hover tooltip */}
      {hovered && (
        <div
          className="pointer-events-none absolute left-1/2 z-10 -translate-x-1/2 -translate-y-[calc(100%+10px)] rounded-lg border border-border/60 bg-popover/95 px-3 py-2 text-xs shadow-xl backdrop-blur-xl whitespace-nowrap"
        >
          <div
            className="font-mono-tight text-[10px] font-semibold uppercase tracking-[0.18em] mb-0.5"
            style={{ color: region.color }}
          >
            {region.label} activation
          </div>
          <div className="font-semibold text-foreground tabular-nums">
            {score}% · {scoreLabel(score)}
          </div>
          <div className="text-[10px] text-muted-foreground mt-0.5">
            {region.anatomy}
          </div>
        </div>
      )}
    </div>
  );
}

interface ScoreRowProps {
  region: RegionDef;
  score: number;
  active: boolean;
  onHover: (k: RegionKey | null) => void;
}

function ScoreRow({ region, score, active, onHover }: ScoreRowProps) {
  return (
    <div
      className="group flex items-center gap-3 rounded-md px-2 py-1.5 -mx-2 transition-colors hover:bg-muted/30"
      onMouseEnter={() => onHover(region.key)}
      onMouseLeave={() => onHover(null)}
      data-testid={`brain-score-${region.key}`}
    >
      <span
        className="h-1.5 w-1.5 flex-shrink-0 rounded-full"
        style={{
          background: region.color,
          boxShadow: active ? `0 0 6px ${region.color}` : "none",
          transition: "box-shadow 180ms",
        }}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-xs font-medium text-foreground truncate">
            {region.metricLabel}
          </span>
          <span className="font-mono-tight text-xs font-semibold tabular-nums text-foreground">
            {score}
          </span>
        </div>
        <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full transition-[width] duration-500"
            style={{
              width: `${score}%`,
              background: region.color,
              opacity: 0.85,
            }}
          />
        </div>
      </div>
    </div>
  );
}

interface SummaryRowProps {
  label: string;
  value: string;
  valueClass?: string;
  testid: string;
}

function SummaryRow({ label, value, valueClass, testid }: SummaryRowProps) {
  return (
    <div
      className="flex items-center justify-between gap-3 py-1.5 border-b border-border/40 last:border-0"
      data-testid={testid}
    >
      <span className="text-[11px] uppercase tracking-[0.14em] font-mono-tight text-muted-foreground">
        {label}
      </span>
      <span
        className={`text-sm font-semibold tabular-nums ${valueClass ?? "text-foreground"}`}
      >
        {value}
      </span>
    </div>
  );
}

// ────────────────────────────── main component ────────────────────────────

export function BrainActivity3D({ creative }: BrainActivity3DProps) {
  const scores = useMemo(() => deriveScores(creative), [creative]);
  const [hovered, setHovered] = useState<RegionKey | null>(null);

  const dominant = useMemo<PositiveRegionKey>(() => {
    const candidates: PositiveRegionKey[] = [
      "attention",
      "reward",
      "memory",
      "emotion",
    ];
    return candidates.reduce<PositiveRegionKey>(
      (best, k) => (scores[k] > scores[best] ? k : best),
      candidates[0],
    );
  }, [scores]);

  const dominantRegion = REGIONS.find((r) => r.key === dominant)!;
  const insight = buildInsight(creative, scores, dominant);
  const load = scores.visualLoad;
  const loadVerdict = loadLabel(load);
  const engagementScore = Math.round((scores.attention + scores.reward + scores.emotion) / 3);
  const engagementVerdict = scoreLabel(engagementScore);
  const fatigueVerdict = fatigueLabel(creative.fatigueRisk);

  return (
    <Card
      className="border-border/50 bg-card/40 p-5"
      data-testid="brain-activity-3d"
    >
      {/* Pulse keyframes — scoped to this component via inline <style> */}
      <style>{`
        @keyframes brainPulse {
          0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: var(--pulse-min, 0.6); }
          50%      { transform: translate(-50%, -50%) scale(1.15); opacity: var(--pulse-max, 1); }
        }
      `}</style>

      {/* Header — matches BrainIntelligencePanel pattern */}
      <div className="flex items-end justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <Brain className="h-4 w-4 text-muted-foreground" />
          <div className="leading-tight">
            <div className="flex items-center gap-1.5">
              <h2 className="text-sm font-semibold">
                Predicted{" "}
                <span className="font-display italic font-normal">
                  cognitive response
                </span>
              </h2>
              <TooltipProvider delayDuration={150}>
                <UiTooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      className="text-muted-foreground hover:text-foreground transition"
                      aria-label="What is this?"
                    >
                      <Info className="h-3 w-3" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-[300px] text-xs">
                    These are <strong>brain-inspired model predictions</strong>{" "}
                    derived from the creative's visual features. They are{" "}
                    <em>not</em> measurements of real brain activity.
                  </TooltipContent>
                </UiTooltip>
              </TooltipProvider>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              TRIBE-inspired brain activity simulation for{" "}
              <span className="font-mono-tight font-semibold text-foreground">
                {creative.id}
              </span>{" "}
              · used as a cognitive feature layer alongside performance data.
            </p>
          </div>
        </div>
        <Badge
          variant="outline"
          className="font-mono-tight text-[10px] bg-primary/5 text-primary border-primary/25 px-2 py-0.5"
        >
          TRIBE-inspired feature layer
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_1fr] gap-5">
        {/* ─── Left: brain visual ─── */}
        <div className="flex flex-col gap-3">
          <div className="relative aspect-square w-full overflow-hidden rounded-xl border border-border/50 bg-card/60">
            {/* Brain image */}
            <img
              src={brainImage}
              alt="Brain-inspired activity visualization"
              className="absolute inset-0 h-full w-full object-contain select-none pointer-events-none"
              draggable={false}
            />

            {/* Hotspots */}
            <div className="absolute inset-0">
              {REGIONS.map((r) => (
                <Hotspot
                  key={r.key}
                  region={r}
                  score={scores[r.key]}
                  hovered={hovered === r.key}
                  onHover={setHovered}
                />
              ))}
            </div>

            {/* Footer hint */}
            <div className="pointer-events-none absolute bottom-2.5 left-3 font-mono-tight text-[10px] uppercase tracking-[0.18em] text-muted-foreground/60">
              Hover hotspots
            </div>
          </div>

          {/* Legend — compact, anatomically labeled */}
          <ul
            className="grid grid-cols-2 gap-x-4 gap-y-1.5 sm:grid-cols-3 lg:grid-cols-2"
            data-testid="brain-legend"
          >
            {REGIONS.map((r) => (
              <li
                key={r.key}
                className="flex items-center gap-2 text-[11px] text-muted-foreground"
                data-testid={`brain-legend-${r.key}`}
                onMouseEnter={() => setHovered(r.key)}
                onMouseLeave={() => setHovered(null)}
              >
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{
                    background: r.color,
                    boxShadow: `0 0 6px ${r.color}99`,
                  }}
                />
                <span className="font-medium text-foreground/85">
                  {r.label}
                </span>
                <span className="ml-auto font-mono-tight tabular-nums">
                  {scores[r.key]}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* ─── Right: scores + summary ─── */}
        <div className="flex flex-col gap-4">
          {/* Score bars */}
          <div>
            <div className="font-mono-tight text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground mb-2">
              Estimated attention / reward / memory activation
            </div>
            <div className="space-y-0.5">
              {REGIONS.map((r) => (
                <ScoreRow
                  key={r.key}
                  region={r}
                  score={scores[r.key]}
                  active={hovered === r.key}
                  onHover={setHovered}
                />
              ))}
            </div>
          </div>

          {/* Summary metrics */}
          <div className="rounded-lg border border-border/50 bg-muted/20 px-3 py-2">
            <SummaryRow
              label="Dominant signal"
              value={dominantRegion.label}
              valueClass=""
              testid="brain-summary-dominant"
            />
            <SummaryRow
              label="Cognitive load"
              value={`${load} · ${loadVerdict}`}
              valueClass={
                loadVerdict === "High"
                  ? "text-amber-600 dark:text-amber-400"
                  : loadVerdict === "Moderate"
                    ? "text-foreground"
                    : "text-emerald-600 dark:text-emerald-400"
              }
              testid="brain-summary-load"
            />
            <SummaryRow
              label="Predicted engagement"
              value={`${engagementScore} · ${engagementVerdict}`}
              valueClass={
                engagementScore >= 60
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-foreground"
              }
              testid="brain-summary-engagement"
            />
            <SummaryRow
              label="Fatigue sensitivity"
              value={`${creative.fatigueRisk} · ${fatigueVerdict}`}
              valueClass={
                creative.fatigueRisk >= 50
                  ? "text-rose-600 dark:text-rose-400"
                  : "text-foreground"
              }
              testid="brain-summary-fatigue"
            />
          </div>

          {/* Insight card — mirrors strongest/weakest pattern */}
          <div
            className="rounded-lg border p-3"
            style={{
              borderColor: `${dominantRegion.color}44`,
              background: `linear-gradient(135deg, ${dominantRegion.color}10, transparent 70%)`,
            }}
          >
            <div
              className="flex items-center gap-1.5 font-mono-tight text-[10px] font-semibold uppercase tracking-[0.18em] mb-1"
              style={{ color: dominantRegion.color }}
            >
              <Sparkles className="h-3 w-3" />
              Copilot insight
            </div>
            <p
              className="text-xs leading-relaxed text-foreground/85"
              data-testid="brain-insight"
            >
              {insight}
            </p>
          </div>
        </div>
      </div>

      {/* Disclaimer — exact pattern match with BrainIntelligencePanel */}
      <p className="mt-4 text-[10px] text-muted-foreground/80 leading-snug border-t border-border/40 pt-2">
        Disclaimer: hotspots show <em>predicted cognitive response</em> derived
        from the creative's visual features (motion, novelty, brand visibility,
        clarity, text density). They are model approximations, not real EEG or
        fMRI measurements.
      </p>
    </Card>
  );
}
