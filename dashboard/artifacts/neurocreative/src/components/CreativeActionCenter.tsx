import { useMemo } from "react";
import { Activity, AlertTriangle, Pause, TrendingUp, Search, type LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { Creative, CreativeStatus, RecommendedAction } from "@/data/smadexData";

interface CreativeActionCenterProps {
  creatives: Creative[];
  selectedId: string;
  onSelect: (id: string) => void;
}

const statusStyle: Record<CreativeStatus, { badgeClass: string; Icon: LucideIcon }> = {
  "Top Performer": {
    badgeClass: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/25",
    Icon: TrendingUp,
  },
  Stable: {
    badgeClass: "bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/25",
    Icon: Activity,
  },
  Fatigued: {
    badgeClass: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/25",
    Icon: AlertTriangle,
  },
  Underperformer: {
    badgeClass: "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/25",
    Icon: Pause,
  },
};

// Restrained action label colors — tinted text on a neutral chip, no saturated backgrounds.
const actionTextStyle: Record<RecommendedAction, string> = {
  Scale: "text-emerald-600 dark:text-emerald-400",
  Monitor: "text-sky-600 dark:text-sky-400",
  Pivot: "text-amber-600 dark:text-amber-400",
  Pause: "text-rose-600 dark:text-rose-400",
};

// Sort priority: most urgent decisions first.
// Pivot (needs creative refresh) > Pause (stop bleeding) > Scale (capitalize) > Monitor (stable)
const ACTION_PRIORITY: Record<RecommendedAction, number> = {
  Pivot: 0,
  Pause: 1,
  Scale: 2,
  Monitor: 3,
};

function formatCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return `${n}`;
}

function CreativeCard({
  creative,
  selected,
  onSelect,
}: {
  creative: Creative;
  selected: boolean;
  onSelect: () => void;
}) {
  const sStyle = statusStyle[creative.status];
  const SIcon = sStyle.Icon;

  return (
    <button
      type="button"
      onClick={onSelect}
      data-testid={`creative-card-${creative.id}`}
      className={`group relative text-left w-full overflow-hidden rounded-xl border bg-card/40 transition-colors ${
        selected
          ? "border-primary/50"
          : "border-border/50 hover:border-border"
      }`}
    >
      <div className="relative aspect-[16/9] overflow-hidden bg-muted">
        <img
          src={creative.assetUrl}
          alt={`Creative ${creative.id}`}
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />

        <div className="absolute top-2 left-2">
          <Badge variant="outline" className={`text-[10px] font-semibold border px-1.5 py-0 ${sStyle.badgeClass}`}>
            <SIcon className="h-2.5 w-2.5 mr-1" />
            {creative.status}
          </Badge>
        </div>

        <div className="absolute bottom-2 left-2.5 right-2.5 flex items-end justify-between text-white">
          <div className="min-w-0">
            <div className="font-mono-tight text-[10px] uppercase tracking-[0.18em] opacity-75">{creative.id}</div>
            <div className="text-sm font-semibold truncate leading-tight">{creative.appName}</div>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className={`font-mono-tight text-[11px] uppercase tracking-[0.18em] font-semibold ${actionTextStyle[creative.action]}`}>
            {creative.action}
          </span>
          <span className="font-mono-tight text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            {creative.formatDisplay}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <div className="eyebrow">CTR</div>
            <div className="font-display text-base font-normal tabular-nums mt-1">{creative.ctr.toFixed(2)}%</div>
          </div>
          <div className="border-x border-border/40">
            <div className="eyebrow">CVR</div>
            <div className="font-display text-base font-normal tabular-nums mt-1">{creative.cvr.toFixed(2)}%</div>
          </div>
          <div>
            <div className="eyebrow">ROAS</div>
            <div className="font-display text-base font-normal tabular-nums mt-1">{creative.roas.toFixed(2)}x</div>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between text-[10px] mb-1">
            <span className="eyebrow">Health</span>
            <span className="font-mono-tight tabular-nums font-semibold text-foreground">{creative.healthScore}<span className="text-muted-foreground">/100</span></span>
          </div>
          <Progress value={creative.healthScore} className="h-1.5" />
        </div>

        <div className="flex items-center justify-between font-mono-tight text-[10px] text-muted-foreground pt-2 border-t border-border/40">
          <span>{formatCompact(creative.impressions)} imp</span>
          <span>${formatCompact(creative.spend)}</span>
          <span>{creative.daysActive}d</span>
        </div>
      </div>
    </button>
  );
}

export function CreativeActionCenter({ creatives, selectedId, onSelect }: CreativeActionCenterProps) {
  const sortedCreatives = useMemo(() => {
    return [...creatives].sort((a, b) => {
      const ap = ACTION_PRIORITY[a.action];
      const bp = ACTION_PRIORITY[b.action];
      if (ap !== bp) return ap - bp;
      // Within same action, lower health first (more urgent)
      return a.healthScore - b.healthScore;
    });
  }, [creatives]);

  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between gap-3 px-1">
        <div className="leading-tight">
          <h2 className="text-lg font-semibold tracking-tight">
            Action <span className="font-display italic font-normal">Center</span>
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {creatives.length} creative{creatives.length === 1 ? "" : "s"} ranked by urgency
          </p>
        </div>
      </div>

      {creatives.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/60 bg-card/30 text-center py-14">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-muted/60 text-muted-foreground">
            <Search className="h-4 w-4" />
          </div>
          <h3 className="text-sm font-semibold mb-1">Nothing to decide on</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            No creatives match your filters. Reset to see decisions for this campaign.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedCreatives.map((c) => (
            <CreativeCard
              key={c.id}
              creative={c}
              selected={c.id === selectedId}
              onSelect={() => onSelect(c.id)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
