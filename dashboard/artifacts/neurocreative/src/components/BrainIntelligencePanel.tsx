import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, Info, Sparkles } from "lucide-react";
import { Tooltip as UiTooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { Creative } from "@/data/smadexData";

interface BrainIntelligencePanelProps {
  creative: Creative;
}

const AXES: { key: keyof Creative["brainScores"]; label: string; description: string }[] = [
  { key: "attention", label: "Attention", description: "Predicted likelihood the eye locks onto the asset in the first 2 seconds." },
  { key: "recall", label: "Recall", description: "Predicted brand/message memorability after viewing." },
  { key: "engagement", label: "Engagement", description: "Predicted depth of processing — emotional + informational pull." },
  { key: "noveltyResponse", label: "Novelty", description: "Predicted dopaminergic response to fresh visual elements." },
  { key: "messageClarity", label: "Clarity", description: "Predicted ease of decoding the offer in a single glance." },
  { key: "cognitiveLoad", label: "Cog. Load", description: "Predicted mental effort — high values often hurt CTR." },
];

interface RadarDatum {
  label: string;
  description: string;
  value: number;
}

interface RadarTooltipPayloadEntry {
  payload: RadarDatum;
  value: number;
}

interface RadarTooltipProps {
  active?: boolean;
  payload?: RadarTooltipPayloadEntry[];
}

function CustomTooltip({ active, payload }: RadarTooltipProps) {
  if (!active || !payload?.length) return null;
  const p = payload[0];
  return (
    <div className="rounded-lg border border-border/60 bg-popover/95 backdrop-blur-xl px-3 py-2 shadow-xl text-xs">
      <div className="font-semibold text-foreground">{p.payload.label}</div>
      <div className="text-muted-foreground">
        Score: <span className="text-primary font-mono-tight font-semibold tabular-nums">{p.value}</span> / 100
      </div>
    </div>
  );
}

export function BrainIntelligencePanel({ creative }: BrainIntelligencePanelProps) {
  const data = AXES.map((a) => ({
    label: a.label,
    description: a.description,
    value: creative.brainScores[a.key],
  }));

  // Find the strongest and weakest predicted signals
  const sorted = [...data].sort((a, b) => b.value - a.value);
  const strongest = sorted[0];
  const weakest = sorted[sorted.length - 1];

  return (
    <Card className="border-border/50 bg-card/40 p-5 h-full" data-testid="brain-intelligence-panel">
      <div className="flex items-end justify-between mb-3 flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <Brain className="h-4 w-4 text-muted-foreground" />
          <div className="leading-tight">
            <div className="flex items-center gap-1.5">
              <h2 className="text-sm font-semibold">
                Brain-inspired <span className="font-display italic font-normal">intelligence</span>
              </h2>
              <TooltipProvider delayDuration={150}>
                <UiTooltip>
                  <TooltipTrigger asChild>
                    <button type="button" className="text-muted-foreground hover:text-foreground transition" aria-label="What is this?">
                      <Info className="h-3 w-3" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-[280px] text-xs">
                    These are <strong>brain-inspired model predictions</strong> derived from the creative's visual features (motion, novelty, brand visibility, clutter, readability, text density). They are <em>not</em> measurements of real brain activity.
                  </TooltipContent>
                </UiTooltip>
              </TooltipProvider>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Predicted cognitive response for <span className="font-mono-tight font-semibold text-foreground">{creative.id}</span>
            </p>
          </div>
        </div>
        <Badge variant="outline" className="font-mono-tight text-[10px] bg-primary/5 text-primary border-primary/25 px-2 py-0.5">
          Model prediction
        </Badge>
      </div>

      <div className="h-[240px] w-full" data-testid="brain-radar-chart">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data} outerRadius="78%">
            <PolarGrid stroke="hsl(var(--border))" opacity={0.5} />
            <PolarAngleAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))", fontFamily: "var(--app-font-mono)" }}
            />
            <PolarRadiusAxis
              angle={90}
              domain={[0, 100]}
              tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
            />
            <Radar
              name="Predicted response"
              dataKey="value"
              stroke="hsl(var(--primary))"
              fill="hsl(var(--primary))"
              fillOpacity={0.3}
              strokeWidth={2}
            />
            <Tooltip content={<CustomTooltip />} />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-2 gap-2 mt-3">
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3">
          <div className="flex items-center gap-1.5 font-mono-tight text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-600 dark:text-emerald-400 mb-1">
            <Sparkles className="h-3 w-3" />
            Strongest
          </div>
          <div className="text-sm font-semibold tabular-nums">
            {strongest.label} <span className="text-muted-foreground font-mono-tight font-normal">· {strongest.value}/100</span>
          </div>
          <p className="text-[11px] text-muted-foreground leading-snug mt-1">{strongest.description}</p>
        </div>
        <div className="rounded-lg border border-rose-500/30 bg-rose-500/5 p-3">
          <div className="flex items-center gap-1.5 font-mono-tight text-[10px] font-semibold uppercase tracking-[0.18em] text-rose-600 dark:text-rose-400 mb-1">
            <Brain className="h-3 w-3" />
            Weakest
          </div>
          <div className="text-sm font-semibold tabular-nums">
            {weakest.label} <span className="text-muted-foreground font-mono-tight font-normal">· {weakest.value}/100</span>
          </div>
          <p className="text-[11px] text-muted-foreground leading-snug mt-1">{weakest.description}</p>
        </div>
      </div>

      <p className="mt-3 text-[10px] text-muted-foreground/80 leading-snug border-t border-border/40 pt-2">
        Disclaimer: scores are model-derived approximations of <em>predicted cognitive response</em>, not measurements of real brain activity.
      </p>
    </Card>
  );
}
