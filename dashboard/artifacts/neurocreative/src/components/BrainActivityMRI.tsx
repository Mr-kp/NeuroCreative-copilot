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

// ────────────────────────────── types ──────────────────────────────────────

interface BrainActivityMRIProps {
  creative: Creative;
}

type RegionKey = "attention" | "reward" | "memory" | "visualLoad" | "emotion";

interface RegionDef {
  key: RegionKey;
  label: string;
  metricLabel: string;
  color: string;
  colorMid: string;
  colorSoft: string;
  anatomy: string;
  description: string;
}

// ────────────────────────────── constants ──────────────────────────────────

const REGIONS: RegionDef[] = [
  {
    key: "attention",
    label: "Attention",
    metricLabel: "Attention Score",
    color: "#C026D3",     // fuchsia-600
    colorMid: "#D946EF",  // fuchsia-500
    colorSoft: "#E879F9",
    anatomy: "Frontal cortex",
    description:
      "Estimated likelihood the eye locks onto the asset in the first 2 seconds.",
  },
  {
    key: "reward",
    label: "Reward",
    metricLabel: "Reward Signal",
    color: "#EC4899",     // pink-500
    colorMid: "#F472B6",
    colorSoft: "#F9A8D4",
    anatomy: "Limbic / reward center",
    description: "Estimated dopaminergic response — desire and pull-to-act.",
  },
  {
    key: "memory",
    label: "Memory",
    metricLabel: "Memory Potential",
    color: "#A78BFA",     // violet-400
    colorMid: "#C4B5FD",
    colorSoft: "#DDD6FE",
    anatomy: "Temporal lobe",
    description: "Estimated brand and message recall after viewing.",
  },
  {
    key: "visualLoad",
    label: "Visual Load",
    metricLabel: "Visual Load",
    color: "#6366F1",     // indigo-500
    colorMid: "#818CF8",
    colorSoft: "#A5B4FC",
    anatomy: "Occipital cortex",
    description:
      "Estimated mental effort to decode the visuals — high values often hurt CTR.",
  },
  {
    key: "emotion",
    label: "Emotion",
    metricLabel: "Emotional Intensity",
    color: "#F43F5E",     // rose-500
    colorMid: "#FB7185",
    colorSoft: "#FDA4AF",
    anatomy: "Ventromedial / orbital area",
    description: "Estimated affective response — warmth, surprise, resonance.",
  },
];

// ────────────────────────────── derivation ─────────────────────────────────

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

// scoreLabel intentionally kept for potential tooltip expansion
function _scoreLabel(score: number): string {
  if (score >= 75) return "Strong";
  if (score >= 50) return "Moderate";
  if (score >= 30) return "Mild";
  return "Low";
}

function loadLabel(load: number): "Low" | "Medium" | "High" {
  if (load >= 60) return "High";
  if (load >= 35) return "Medium";
  return "Low";
}

function engagementLabel(score: number): "Weak" | "Moderate" | "Strong" {
  if (score >= 65) return "Strong";
  if (score >= 40) return "Moderate";
  return "Weak";
}

function fatigueLabel(risk: number): string {
  if (risk >= 70) return "High";
  if (risk >= 40) return "Medium";
  return "Low";
}

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
    return `This creative shows high attention activation but elevated visual load, which may explain strong initial CTR followed by faster fatigue.`;
  }
  if (dominant === "reward" && fatigue < 50) {
    return `This creative leans on reward signaling with a healthy fatigue trajectory — a good candidate to scale spend gradually.`;
  }
  if (dominant === "memory") {
    return `This creative is memory-heavy — strong recall potential, but it may need a faster hook to convert in the first 3 seconds.`;
  }
  if (dominant === "emotion") {
    return `This creative drives emotion above all other signals — pair it with a stronger CTA to convert that resonance into action.`;
  }
  return `This creative is led by ${dom.label.toLowerCase()} signaling (${scores[dominant]}%) with cognitive load at ${load}% and fatigue risk ${fatigue}%.`;
}

// ────────────────────────────── SVG brain ──────────────────────────────────

interface BrainSVGProps {
  scores: Record<RegionKey, number>;
  hovered: RegionKey | null;
  onHover: (k: RegionKey | null) => void;
  isDark: boolean;
}

function BrainSVG({ scores, hovered, onHover, isDark }: BrainSVGProps) {
  const bg = isDark ? "#020617" : "#F8FAFC";
  // panel color available if needed for sub-panels
  const brainFill = isDark ? "#111827" : "#E2E8F0";
  const strokeColor = isDark ? "#A78BFA" : "#7C3AED";

  // Map score → opacity (0.15 to 0.95) and scale (0.9 to 1.4)
  const regionOpacity = (score: number) => 0.15 + (score / 100) * 0.8;
  const regionScale = (score: number) => 0.9 + score / 200;

  // Region data for the SVG ellipses
  const svgRegions: {
    key: RegionKey;
    id: string;
    cx: number;
    cy: number;
    rx: number;
    ry: number;
    gradientId: string;
  }[] = [
    { key: "attention", id: "attention-region", cx: 360, cy: 150, rx: 110, ry: 60, gradientId: "attentionGlow" },
    { key: "reward", id: "reward-region", cx: 360, cy: 230, rx: 80, ry: 50, gradientId: "rewardGlow" },
    { key: "memory", id: "memory-left", cx: 260, cy: 250, rx: 70, ry: 50, gradientId: "memoryGlow" },
    { key: "memory", id: "memory-right", cx: 460, cy: 250, rx: 70, ry: 50, gradientId: "memoryGlow" },
    { key: "visualLoad", id: "visual-region", cx: 520, cy: 220, rx: 70, ry: 80, gradientId: "visualGlow" },
    { key: "emotion", id: "emotion-region", cx: 320, cy: 310, rx: 90, ry: 50, gradientId: "emotionGlow" },
  ];

  // Build gradient color stops from REGIONS data
  const attentionRegion = REGIONS.find((r) => r.key === "attention")!;
  const rewardRegion = REGIONS.find((r) => r.key === "reward")!;
  const memoryRegion = REGIONS.find((r) => r.key === "memory")!;
  const visualRegion = REGIONS.find((r) => r.key === "visualLoad")!;
  const emotionRegion = REGIONS.find((r) => r.key === "emotion")!;

  return (
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 720 460"
      xmlns="http://www.w3.org/2000/svg"
      className="select-none"
      style={{ display: "block" }}
    >
      <defs>
        <radialGradient id="attentionGlow">
          <stop offset="0%" stopColor={attentionRegion.color} stopOpacity="0.95" />
          <stop offset="60%" stopColor={attentionRegion.colorMid} stopOpacity="0.4" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>

        <radialGradient id="rewardGlow">
          <stop offset="0%" stopColor={rewardRegion.color} stopOpacity="0.9" />
          <stop offset="70%" stopColor={rewardRegion.colorSoft} stopOpacity="0.35" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>

        <radialGradient id="memoryGlow">
          <stop offset="0%" stopColor={memoryRegion.color} stopOpacity="0.85" />
          <stop offset="70%" stopColor={memoryRegion.colorSoft} stopOpacity="0.3" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>

        <radialGradient id="visualGlow">
          <stop offset="0%" stopColor={visualRegion.color} stopOpacity="0.85" />
          <stop offset="70%" stopColor={visualRegion.colorMid} stopOpacity="0.3" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>

        <radialGradient id="emotionGlow">
          <stop offset="0%" stopColor={emotionRegion.color} stopOpacity="0.85" />
          <stop offset="70%" stopColor={emotionRegion.colorMid} stopOpacity="0.3" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>

        <filter id="mri-blur">
          <feGaussianBlur stdDeviation="12" />
        </filter>
      </defs>

      {/* Background */}
      <rect width="720" height="460" rx="16" fill={bg} />

      {/* Subtle grid / scanline texture */}
      <g opacity="0.04">
        {Array.from({ length: 23 }, (_, i) => (
          <line
            key={`h-${i}`}
            x1="0"
            y1={i * 20}
            x2="720"
            y2={i * 20}
            stroke={isDark ? "#fff" : "#000"}
            strokeWidth="0.5"
          />
        ))}
      </g>

      {/* Brain shape */}
      <path
        d="M187 229C176 188 197 145 234 126C243 91 283 73 319 89C346 63 394 63 421 89C456 74 497 92 506 127C544 147 565 190 553 230C568 267 552 311 516 333C509 374 466 396 428 380C400 409 348 408 320 380C282 396 239 374 232 333C197 310 181 266 187 229Z"
        fill={brainFill}
        stroke={strokeColor}
        strokeOpacity="0.4"
        strokeWidth="2"
      />

      {/* Inner folds — subtle sulci detail */}
      <g opacity={isDark ? 0.12 : 0.08} stroke={strokeColor} strokeWidth="1" fill="none">
        <path d="M280 160 Q320 140 370 155 Q400 165 420 150" />
        <path d="M250 200 Q310 185 360 195 Q420 210 480 190" />
        <path d="M240 260 Q300 240 350 255 Q400 250 470 265" />
        <path d="M260 310 Q320 290 380 300 Q430 310 490 295" />
        <path d="M310 130 Q340 170 360 200" />
        <path d="M400 130 Q380 170 370 210" />
      </g>

      {/* Heatmap Regions */}
      {svgRegions.map((region) => {
        const score = scores[region.key];
        const opacity = regionOpacity(score);
        const scale = regionScale(score);
        const isHovered = hovered === region.key;

        return (
          <ellipse
            key={region.id}
            cx={region.cx}
            cy={region.cy}
            rx={region.rx}
            ry={region.ry}
            fill={`url(#${region.gradientId})`}
            filter="url(#mri-blur)"
            opacity={isHovered ? Math.min(opacity * 1.3, 1) : opacity}
            style={{
              transform: `scale(${isHovered ? scale * 1.05 : scale})`,
              transformOrigin: `${region.cx}px ${region.cy}px`,
              transition: "all 0.4s ease",
            }}
            onMouseEnter={() => onHover(region.key)}
            onMouseLeave={() => onHover(null)}
            className="cursor-pointer"
          />
        );
      })}

      {/* Subtle pulse animation overlay for the dominant region */}
      <g opacity="0.15">
        <ellipse cx="360" cy="230" rx="200" ry="130" fill="none" stroke={strokeColor} strokeWidth="0.5" strokeOpacity="0.3">
          <animate attributeName="rx" values="195;205;195" dur="4s" repeatCount="indefinite" />
          <animate attributeName="ry" values="125;135;125" dur="4s" repeatCount="indefinite" />
          <animate attributeName="stroke-opacity" values="0.15;0.35;0.15" dur="4s" repeatCount="indefinite" />
        </ellipse>
      </g>

      {/* Label hint */}
      <text
        x="30"
        y="440"
        fill={isDark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.2)"}
        fontSize="10"
        fontFamily="var(--app-font-mono)"
        letterSpacing="0.18em"
        textTransform="uppercase"
      >
        BRAIN-INSPIRED ACTIVITY MAP
      </text>
    </svg>
  );
}

// ────────────────────────────── sub-components ─────────────────────────────

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
      data-testid={`brain-mri-score-${region.key}`}
    >
      <span
        className="h-2 w-2 flex-shrink-0 rounded-full"
        style={{
          background: region.color,
          boxShadow: active ? `0 0 8px ${region.color}` : "none",
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
              background: `linear-gradient(90deg, ${region.color}, ${region.colorMid})`,
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

export function BrainActivityMRI({ creative }: BrainActivityMRIProps) {
  const scores = useMemo(() => deriveScores(creative), [creative]);
  const [hovered, setHovered] = useState<RegionKey | null>(null);

  // Detect dark mode from DOM
  const isDark =
    typeof document !== "undefined" &&
    document.documentElement.classList.contains("dark");

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
  const engagementScore = Math.round(
    (scores.attention + scores.reward + scores.emotion) / 3,
  );
  const engVerdict = engagementLabel(engagementScore);
  const fatVerdict = fatigueLabel(creative.fatigueRisk);

  return (
    <Card
      className="border-border/50 bg-card/40 p-5"
      data-testid="brain-activity-mri"
    >
      {/* ── Header ── */}
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
              TRIBE-inspired brain activity simulation based on creative features and performance data for{" "}
              <span className="font-mono-tight font-semibold text-foreground">
                {creative.id}
              </span>
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

      {/* ── Main grid: Brain SVG + Metrics ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_1fr] gap-5">
        {/* ─── Left: Brain MRI visualization ─── */}
        <div className="flex flex-col gap-3">
          <div className="relative w-full overflow-hidden rounded-xl border border-border/50 bg-card/60">
            <BrainSVG
              scores={scores}
              hovered={hovered}
              onHover={setHovered}
              isDark={isDark}
            />
          </div>

          {/* Legend */}
          <ul
            className="grid grid-cols-2 gap-x-4 gap-y-1.5 sm:grid-cols-3 lg:grid-cols-2"
            data-testid="brain-mri-legend"
          >
            {REGIONS.map((r) => (
              <li
                key={r.key}
                className="flex items-center gap-2 text-[11px] text-muted-foreground cursor-pointer"
                data-testid={`brain-mri-legend-${r.key}`}
                onMouseEnter={() => setHovered(r.key)}
                onMouseLeave={() => setHovered(null)}
              >
                <span
                  className="h-2 w-2 rounded-full"
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

        {/* ─── Right: Scores + Summary ─── */}
        <div className="flex flex-col gap-4">
          {/* Score bars */}
          <div>
            <div className="font-mono-tight text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground mb-2">
              Estimated neural activation
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
              testid="brain-mri-summary-dominant"
            />
            <SummaryRow
              label="Cognitive load"
              value={`${load} · ${loadVerdict}`}
              valueClass={
                loadVerdict === "High"
                  ? "text-amber-600 dark:text-amber-400"
                  : loadVerdict === "Medium"
                    ? "text-foreground"
                    : "text-emerald-600 dark:text-emerald-400"
              }
              testid="brain-mri-summary-load"
            />
            <SummaryRow
              label="Predicted engagement"
              value={`${engagementScore} · ${engVerdict}`}
              valueClass={
                engagementScore >= 60
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-foreground"
              }
              testid="brain-mri-summary-engagement"
            />
            <SummaryRow
              label="Fatigue sensitivity"
              value={`${creative.fatigueRisk} · ${fatVerdict}`}
              valueClass={
                creative.fatigueRisk >= 50
                  ? "text-rose-600 dark:text-rose-400"
                  : "text-foreground"
              }
              testid="brain-mri-summary-fatigue"
            />
          </div>

          {/* Insight card */}
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
              data-testid="brain-mri-insight"
            >
              {insight}
            </p>
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <p className="mt-4 text-[10px] text-muted-foreground/80 leading-snug border-t border-border/40 pt-2">
        Disclaimer: heatmap regions show <em>predicted cognitive response</em>{" "}
        derived from the creative's visual features (motion, novelty, brand
        visibility, clarity, text density). They are model approximations, not
        real EEG or fMRI measurements.
      </p>
    </Card>
  );
}
