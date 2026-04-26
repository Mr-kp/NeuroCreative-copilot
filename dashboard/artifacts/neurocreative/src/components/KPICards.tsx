import {
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  DollarSign,
  Eye,
  MousePointerClick,
  Target,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";
import { KPIS, type KpiCard } from "@/data/smadexData";
import type { DashboardSummary } from "@/types/dashboard";

interface KPICardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  unit?: string;
  trend: KpiCard["trend"];
  positiveIsUp?: boolean;
  testid?: string;
  accent?: "primary" | "accent" | "amber";
}

function formatCompact(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return `${n}`;
}

function KPICard({ icon, label, value, unit, trend, positiveIsUp = true, testid, accent = "primary" }: KPICardProps) {
  const isFlat = trend.direction === "flat";
  const isUp = trend.direction === "up";
  const isPositive = isFlat ? true : positiveIsUp ? isUp : !isUp;
  const deltaColor = isFlat
    ? "text-muted-foreground"
    : isPositive
    ? "text-emerald-500"
    : "text-rose-500";
  const Arrow = isFlat ? Minus : isUp ? ArrowUpRight : ArrowDownRight;

  const accentBg =
    accent === "accent"
      ? "bg-[hsl(var(--accent)/0.15)] text-[hsl(var(--accent-foreground))] dark:text-[hsl(var(--accent))]"
      : accent === "amber"
      ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
      : "bg-primary/12 text-primary";

  return (
    <div
      className="group card-lift relative overflow-hidden rounded-2xl border border-border/60 bg-card/60 backdrop-blur-xl p-5"
      data-testid={testid}
    >
      {/* Subtle gradient on hover */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/[0.05] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      {/* Top accent line on hover */}
      <div className="pointer-events-none absolute top-0 left-5 right-5 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

      <div className="relative flex flex-col gap-3 min-h-[112px]">
        <div className="flex items-center justify-between">
          <span className="eyebrow">{label}</span>
          <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${accentBg}`}>
            {icon}
          </div>
        </div>

        <div className="flex items-baseline gap-1.5">
          <span className="font-display text-[34px] leading-none tracking-tight tabular-nums text-foreground">
            {value}
          </span>
          {unit && <span className="text-sm text-muted-foreground tabular-nums">{unit}</span>}
        </div>

        <div className="flex items-center gap-1.5 text-[11px] mt-auto">
          <span className={`inline-flex items-center font-mono-tight font-semibold ${deltaColor}`}>
            <Arrow className="h-3 w-3" />
            {Math.abs(trend.deltaPct).toFixed(1)}%
          </span>
          <span className="text-muted-foreground/80 truncate">{trend.label}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Parse OpenAI trend string into direction/delta ────────────────────────

function parseTrend(trendStr: string): KpiCard["trend"] {
  // Try to extract a percentage from the trend string
  const pctMatch = trendStr.match(/([+-]?\d+\.?\d*)%/);
  const pct = pctMatch ? parseFloat(pctMatch[1]) : 0;
  const direction: "up" | "down" | "flat" =
    pct > 0 ? "up" : pct < 0 ? "down" : "flat";
  return {
    direction,
    deltaPct: pct,
    label: trendStr.replace(/[+-]?\d+\.?\d*%\s*/g, "").trim() || trendStr,
  };
}

interface KPICardsProps {
  /** When provided (from OpenAI upload), render from this data instead of fallback KPIS. */
  dashboardSummary?: DashboardSummary;
}

export function KPICards({ dashboardSummary }: KPICardsProps) {
  // ── Uploaded analysis mode ────────────────────────────────────────────
  if (dashboardSummary) {
    const ds = dashboardSummary;
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <KPICard
          icon={<DollarSign className="h-3.5 w-3.5" />}
          label="Total Spend"
          value={String(ds.total_spend.value)}
          trend={parseTrend(ds.total_spend.trend)}
          testid="kpi-total-spend"
        />
        <KPICard
          icon={<Eye className="h-3.5 w-3.5" />}
          label="Impressions"
          value={String(ds.impressions.value)}
          trend={parseTrend(ds.impressions.trend)}
          testid="kpi-impressions"
          accent="accent"
        />
        <KPICard
          icon={<MousePointerClick className="h-3.5 w-3.5" />}
          label="CTR"
          value={String(ds.ctr.value)}
          unit="%"
          trend={parseTrend(ds.ctr.trend)}
          testid="kpi-ctr"
        />
        <KPICard
          icon={<Target className="h-3.5 w-3.5" />}
          label="CVR"
          value={String(ds.cvr.value)}
          unit="%"
          trend={parseTrend(ds.cvr.trend)}
          testid="kpi-cvr"
          accent="accent"
        />
        <KPICard
          icon={<TrendingUp className="h-3.5 w-3.5" />}
          label="ROAS"
          value={String(ds.roas.value)}
          unit="x"
          trend={parseTrend(ds.roas.trend)}
          testid="kpi-roas"
        />
        <KPICard
          icon={<AlertTriangle className="h-3.5 w-3.5" />}
          label="Fatigued"
          value={String(ds.fatigued_creatives.value)}
          trend={parseTrend(ds.fatigued_creatives.trend)}
          positiveIsUp={false}
          testid="kpi-fatigued"
          accent="amber"
        />
      </div>
    );
  }

  // ── Fallback demo mode ────────────────────────────────────────────────
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      <KPICard
        icon={<DollarSign className="h-3.5 w-3.5" />}
        label="Total Spend"
        value={`$${formatCompact(KPIS.totalSpend.value)}`}
        trend={KPIS.totalSpend.trend}
        testid="kpi-total-spend"
      />
      <KPICard
        icon={<Eye className="h-3.5 w-3.5" />}
        label="Impressions"
        value={formatCompact(KPIS.impressions.value)}
        trend={KPIS.impressions.trend}
        testid="kpi-impressions"
        accent="accent"
      />
      <KPICard
        icon={<MousePointerClick className="h-3.5 w-3.5" />}
        label="CTR"
        value={KPIS.ctr.value.toFixed(2)}
        unit="%"
        trend={KPIS.ctr.trend}
        testid="kpi-ctr"
      />
      <KPICard
        icon={<Target className="h-3.5 w-3.5" />}
        label="CVR"
        value={KPIS.cvr.value.toFixed(2)}
        unit="%"
        trend={KPIS.cvr.trend}
        testid="kpi-cvr"
        accent="accent"
      />
      <KPICard
        icon={<TrendingUp className="h-3.5 w-3.5" />}
        label="ROAS"
        value={KPIS.roas.value.toFixed(2)}
        unit="x"
        trend={KPIS.roas.trend}
        testid="kpi-roas"
      />
      <KPICard
        icon={<AlertTriangle className="h-3.5 w-3.5" />}
        label="Fatigued"
        value={`${KPIS.fatiguedCount.value}`}
        trend={KPIS.fatiguedCount.trend}
        positiveIsUp={false}
        testid="kpi-fatigued"
        accent="amber"
      />
    </div>
  );
}
