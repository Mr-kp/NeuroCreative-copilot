import {
  AlertTriangle,
  Activity,
  Pause,
  TrendingUp,
  Smartphone,
  ChevronRight,
  Tag,
  Globe,
  Type,
  Languages,
  Clock,
  Eye,
  DollarSign,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import type { Creative, CreativeStatus, RecommendedAction } from "@/data/smadexData";

interface SelectedCreativeDetailProps {
  creative: Creative;
}

const statusBadgeClass: Record<CreativeStatus, string> = {
  "Top Performer": "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/25",
  Stable: "bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/25",
  Fatigued: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/25",
  Underperformer: "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/25",
};

const statusIcon: Record<CreativeStatus, LucideIcon> = {
  "Top Performer": TrendingUp,
  Stable: Activity,
  Fatigued: AlertTriangle,
  Underperformer: Pause,
};

// Restrained color tokens for the recommendation block. Tinted text only —
// no saturated chips, no gradient washes, no decorative orbs.
const actionTheme: Record<RecommendedAction, { text: string; verb: string }> = {
  Scale: { text: "text-emerald-600 dark:text-emerald-400", verb: "Scale it." },
  Monitor: { text: "text-sky-600 dark:text-sky-400", verb: "Watch closely." },
  Pivot: { text: "text-amber-600 dark:text-amber-400", verb: "Pivot the angle." },
  Pause: { text: "text-rose-600 dark:text-rose-400", verb: "Pause it now." },
};

function formatCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return `${n}`;
}

function MetaRow({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5">
      <div className="flex items-center gap-2 text-xs text-muted-foreground min-w-0">
        <Icon className="h-3.5 w-3.5 flex-shrink-0" />
        <span className="truncate">{label}</span>
      </div>
      <span className="text-xs font-semibold tabular-nums text-foreground truncate max-w-[55%] text-right">{value}</span>
    </div>
  );
}

export function SelectedCreativeDetail({ creative }: SelectedCreativeDetailProps) {
  const StatusIcon = statusIcon[creative.status];
  const theme = actionTheme[creative.action];
  const healthColor =
    creative.healthScore >= 75
      ? "text-emerald-500"
      : creative.healthScore >= 50
      ? "text-sky-500"
      : creative.healthScore >= 35
      ? "text-amber-500"
      : "text-rose-500";

  const healthLabel =
    creative.healthScore >= 75
      ? "Excellent"
      : creative.healthScore >= 50
      ? "Healthy"
      : creative.healthScore >= 35
      ? "At Risk"
      : "Critical";

  return (
    <Card
      className="border-border/50 bg-card/40 p-6"
      data-testid="selected-creative-detail"
    >
      <div className="flex items-end justify-between mb-5 flex-wrap gap-3">
        <div className="flex items-center gap-2.5">
          <Smartphone className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-lg font-semibold tracking-tight">
            What to do <span className="font-display italic font-normal">next</span>
          </h2>
        </div>
        <Badge variant="outline" className="font-mono-tight text-[10px] bg-background/60 px-2.5 py-1">
          {creative.id} · {creative.advertiserName}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr_1.2fr] gap-6 items-start">
        {/* Phone frame preview */}
        <div className="flex justify-center lg:justify-start">
          <div className="relative" style={{ width: 220 }}>
            <div className="relative rounded-[2.25rem] border-[10px] border-foreground/90 dark:border-foreground/70 bg-foreground/95 dark:bg-foreground/80 shadow-2xl shadow-primary/25 overflow-hidden">
              <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10 h-4 w-16 rounded-b-2xl bg-foreground/95 dark:bg-foreground/80" />
              <div className="relative aspect-[9/16] overflow-hidden bg-muted">
                <img
                  src={creative.assetUrl}
                  alt={`Creative ${creative.id}`}
                  className="absolute inset-0 h-full w-full object-cover"
                />
              </div>
            </div>
            <div className="mt-3 text-center">
              <Badge variant="outline" className={`text-[10px] font-semibold border ${statusBadgeClass[creative.status]}`}>
                <StatusIcon className="h-3 w-3 mr-1" />
                {creative.status}
              </Badge>
            </div>
          </div>
        </div>

        {/* Health + KPIs */}
        <div className="space-y-4">
          <div className="rounded-xl border border-border/60 bg-background/50 p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="eyebrow">Health Score</div>
              <div className={`text-[11px] font-semibold ${healthColor}`}>{healthLabel}</div>
            </div>
            <div className="flex items-end gap-2 mb-3">
              <span className={`font-display text-5xl leading-none tabular-nums ${healthColor}`}>
                {creative.healthScore}
              </span>
              <span className="text-sm text-muted-foreground mb-1">/ 100</span>
            </div>
            <Progress value={creative.healthScore} className="h-1.5" />
            <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
              <span>Fatigue risk: <span className="font-mono-tight font-semibold text-foreground">{creative.fatigueRisk}%</span></span>
              {creative.fatigueDay !== null && (
                <span>Fatigue day: <span className="font-mono-tight font-semibold text-foreground">D{creative.fatigueDay}</span></span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "CTR", value: `${creative.ctr.toFixed(2)}%` },
              { label: "CVR", value: `${creative.cvr.toFixed(2)}%` },
              { label: "ROAS", value: `${creative.roas.toFixed(2)}x` },
              { label: "IPM", value: creative.ipm.toFixed(2) },
            ].map((m) => (
              <div key={m.label} className="rounded-lg border border-border/40 bg-background/40 p-3">
                <div className="eyebrow">{m.label}</div>
                <div className="font-display text-xl tabular-nums mt-1">{m.value}</div>
              </div>
            ))}
          </div>

          <div className="rounded-lg border border-border/40 bg-background/40 p-3 space-y-1">
            <MetaRow icon={Eye} label="Impressions" value={formatCompact(creative.impressions)} />
            <MetaRow icon={DollarSign} label="Spend" value={`$${formatCompact(creative.spend)}`} />
            <MetaRow icon={Tag} label="Conversions" value={formatCompact(creative.conversions)} />
            <MetaRow icon={Clock} label="Days Active" value={`${creative.daysActive}`} />
          </div>
        </div>

        {/* Recommendation */}
        <div className="space-y-4">
          <div className="rounded-xl border border-border/50 bg-background/50 p-5">
            <div className="font-mono-tight text-[10px] uppercase tracking-[0.2em] font-semibold text-muted-foreground mb-3">
              Copilot recommendation
            </div>
            <div className="flex items-baseline gap-2 mb-3 flex-wrap">
              <span className={`font-mono-tight text-[12px] uppercase tracking-[0.18em] font-semibold ${theme.text}`}>
                {creative.action}
              </span>
              <span className="text-muted-foreground/40">·</span>
              <span className={`font-display italic text-xl leading-tight ${theme.text}`}>
                {theme.verb}
              </span>
            </div>
            <p className="font-display text-[19px] leading-[1.3] text-foreground/95">
              {creative.recommendation.headline}
            </p>
          </div>

          {/* Reasons */}
          <div className="space-y-2">
            {creative.recommendation.reasons.map((r, i) => (
              <div key={i} className="rounded-lg border border-border/40 bg-background/40 p-3 transition-colors hover:border-border">
                <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground mb-1">
                  <ChevronRight className="h-3 w-3" />
                  {r.label}
                </div>
                <p className="text-xs text-foreground/85 leading-relaxed">{r.text}</p>
              </div>
            ))}
          </div>

          {/* Next best test */}
          <div className="rounded-xl border border-border/50 bg-background/50 p-4">
            <div className="font-mono-tight text-[10px] uppercase tracking-[0.2em] font-semibold text-muted-foreground mb-2">
              Next best test
            </div>
            <p className="font-display italic text-[15px] leading-snug text-foreground/95 mb-3">
              {creative.recommendation.nextBestTest}
            </p>
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs gap-1.5 rounded-full px-3 border-primary/40 text-primary hover:bg-primary/8 hover:text-primary"
              data-testid="generate-variant-button"
            >
              Generate variant brief
              <ArrowRight className="h-3 w-3" />
            </Button>
          </div>

          {/* Creative metadata */}
          <div className="rounded-lg border border-border/40 bg-background/40 p-3 space-y-1">
            <div className="eyebrow mb-1.5">Creative metadata</div>
            <MetaRow icon={Type} label="CTA" value={creative.metadata.ctaText} />
            <MetaRow icon={Tag} label="Hook" value={creative.metadata.hookType} />
            <MetaRow icon={Languages} label="Language" value={creative.metadata.language.toUpperCase()} />
            <MetaRow icon={Globe} label="Vertical" value={creative.verticalDisplay} />
            <MetaRow icon={Activity} label="Tone" value={creative.metadata.tone} />
          </div>
        </div>
      </div>
    </Card>
  );
}
