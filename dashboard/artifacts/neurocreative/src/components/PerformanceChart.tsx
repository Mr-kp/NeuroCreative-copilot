import {
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  ComposedChart,
} from "recharts";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { LineChart as LineChartIcon, AlertTriangle } from "lucide-react";
import type { Creative, TimeSeriesPoint } from "@/data/smadexData";
import { useEffect, useMemo, useState } from "react";

interface PerformanceChartProps {
  creative: Creative;
  /**
   * KPI Focus from the global Filters bar. When this is one of the chart
   * metrics (ctr / cvr / spend / fatigue mapped to ctr) the chart opens on
   * that tab. "overall" leaves the user's last selection alone.
   */
  kpiFocus?: string;
}

type Metric = "ctr" | "cvr" | "spend" | "impressions";

const KPI_FOCUS_TO_METRIC: Record<string, Metric> = {
  ctr: "ctr",
  cvr: "cvr",
  spend: "spend",
  roas: "spend", // ROAS isn't a daily series; spend is the closest financial view
  fatigue: "ctr",
  overall: "ctr", // default view
};

type ChartPoint = TimeSeriesPoint & { displayDate: string };

const METRIC_LABEL: Record<Metric, string> = {
  ctr: "CTR (%)",
  cvr: "CVR (%)",
  spend: "Spend (USD)",
  impressions: "Impressions",
};

const getMetric = (p: ChartPoint, m: Metric): number => p[m];

interface TooltipPayloadEntry {
  payload: ChartPoint;
}

interface TooltipProps {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
}

function CustomTooltip({ active, payload }: TooltipProps) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="rounded-lg border border-border/60 bg-popover/95 backdrop-blur-xl px-3 py-2 shadow-xl text-xs">
      <div className="font-semibold text-foreground mb-1.5 font-mono-tight">Day {p.day} · {p.displayDate}</div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-muted-foreground">
        <span>CTR</span><span className="text-foreground tabular-nums text-right font-mono-tight">{p.ctr.toFixed(2)}%</span>
        <span>CVR</span><span className="text-foreground tabular-nums text-right font-mono-tight">{p.cvr.toFixed(2)}%</span>
        <span>Impressions</span><span className="text-foreground tabular-nums text-right font-mono-tight">{p.impressions.toLocaleString()}</span>
        <span>Spend</span><span className="text-foreground tabular-nums text-right font-mono-tight">${Math.round(p.spend).toLocaleString()}</span>
      </div>
    </div>
  );
}

function formatYAxis(value: number, metric: Metric): string {
  if (metric === "spend") {
    if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
    return `$${value}`;
  }
  if (metric === "impressions") {
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
    return `${value}`;
  }
  return `${value.toFixed(2)}%`;
}

export function PerformanceChart({ creative, kpiFocus = "overall" }: PerformanceChartProps) {
  const initialMetric: Metric = KPI_FOCUS_TO_METRIC[kpiFocus] ?? "ctr";
  const [metric, setMetric] = useState<Metric>(initialMetric);

  // When KPI Focus changes from the global filter, sync the chart tab so the
  // focused metric is shown. The user can still click another tab afterwards
  // to override; the override persists until KPI Focus changes again.
  // Defer the state change one frame so Radix Select can finish its close
  // animation and return focus to its trigger before the Tabs subtree
  // re-renders (otherwise Radix's focus-return sees a stale ref and crashes).
  useEffect(() => {
    const next = KPI_FOCUS_TO_METRIC[kpiFocus];
    if (!next) return;
    const raf = requestAnimationFrame(() => setMetric(next));
    return () => cancelAnimationFrame(raf);
  }, [kpiFocus]);

  const handleTabChange = (v: string) => {
    setMetric(v as Metric);
  };

  const data = useMemo(() => {
    return creative.timeSeries.map((p) => ({
      ...p,
      displayDate: p.date.slice(5), // MM-DD
    }));
  }, [creative]);

  const fatigueDay = creative.fatigueDay;
  const fatiguePoint = useMemo(() => {
    if (fatigueDay === null) return null;
    return data.find((d) => d.day === fatigueDay) ?? data[Math.min(fatigueDay, data.length - 1)] ?? null;
  }, [data, fatigueDay]);

  return (
    <Card className="border-border/50 bg-card/40 p-5 h-full" data-testid="performance-chart">
      <div className="flex items-end justify-between mb-4 flex-wrap gap-3">
        <div className="flex items-center gap-2.5">
          <LineChartIcon className="h-4 w-4 text-muted-foreground" />
          <div className="leading-tight">
            <h2 className="text-sm font-semibold">
              Performance over <span className="font-display italic font-normal">time</span>
            </h2>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Daily metrics for <span className="font-mono-tight font-semibold text-foreground">{creative.id}</span> · launched {creative.launchDate}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {fatigueDay !== null && (
            <Badge variant="outline" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 text-[10px] font-mono-tight">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Fatigue D{fatigueDay}
            </Badge>
          )}
        </div>
      </div>

      <Tabs value={metric} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-4 h-9 mb-4 bg-background/40 p-1">
          <TabsTrigger value="ctr" className="text-[11px] font-medium" data-testid="tab-ctr">CTR</TabsTrigger>
          <TabsTrigger value="cvr" className="text-[11px] font-medium" data-testid="tab-cvr">CVR</TabsTrigger>
          <TabsTrigger value="spend" className="text-[11px] font-medium" data-testid="tab-spend">Spend</TabsTrigger>
          <TabsTrigger value="impressions" className="text-[11px] font-medium" data-testid="tab-impressions">Impressions</TabsTrigger>
        </TabsList>

        <TabsContent value={metric} className="m-0">
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="metricGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.45} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="2 4" stroke="hsl(var(--border))" opacity={0.5} vertical={false} />
                <XAxis
                  dataKey="displayDate"
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))", fontFamily: "var(--app-font-mono)" }}
                  axisLine={{ stroke: "hsl(var(--border))" }}
                  tickLine={false}
                  interval="preserveStartEnd"
                  minTickGap={28}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))", fontFamily: "var(--app-font-mono)" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => formatYAxis(v, metric)}
                  width={56}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: "hsl(var(--primary))", strokeWidth: 1, strokeDasharray: "3 3" }} />
                {fatiguePoint && (
                  <ReferenceLine
                    x={fatiguePoint.displayDate}
                    stroke="hsl(var(--chart-4))"
                    strokeDasharray="4 4"
                    strokeWidth={1.5}
                    label={{
                      value: `Fatigue D${fatigueDay}`,
                      position: "insideTopRight",
                      fill: "hsl(var(--chart-4))",
                      fontSize: 10,
                      fontWeight: 600,
                      fontFamily: "var(--app-font-mono)",
                    }}
                  />
                )}
                <Area
                  type="monotone"
                  dataKey={metric}
                  stroke="none"
                  fill="url(#metricGradient)"
                  isAnimationActive={false}
                />
                <Line
                  type="monotone"
                  dataKey={metric}
                  stroke="hsl(var(--primary))"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 5, fill: "hsl(var(--primary))", stroke: "hsl(var(--background))", strokeWidth: 2 }}
                  name={METRIC_LABEL[metric]}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-3">
            <div className="rounded-lg border border-border/40 bg-background/40 p-3">
              <div className="eyebrow">First 7d avg</div>
              <div className="font-display text-lg tabular-nums mt-1">
                {(() => {
                  const first = data.slice(0, 7);
                  const avg = first.length ? first.reduce((s, d) => s + getMetric(d, metric), 0) / first.length : 0;
                  return formatYAxis(avg, metric);
                })()}
              </div>
            </div>
            <div className="rounded-lg border border-border/40 bg-background/40 p-3">
              <div className="eyebrow">Last 7d avg</div>
              <div className="font-display text-lg tabular-nums mt-1">
                {(() => {
                  const last = data.slice(-7);
                  const avg = last.length ? last.reduce((s, d) => s + getMetric(d, metric), 0) / last.length : 0;
                  return formatYAxis(avg, metric);
                })()}
              </div>
            </div>
            <div className="rounded-lg border border-border/40 bg-background/40 p-3">
              <div className="eyebrow">Trend</div>
              <div className="font-display text-lg tabular-nums mt-1">
                {(() => {
                  const first = data.slice(0, 7);
                  const last = data.slice(-7);
                  if (!first.length || !last.length) return "—";
                  const f = first.reduce((s, d) => s + getMetric(d, metric), 0) / first.length;
                  const l = last.reduce((s, d) => s + getMetric(d, metric), 0) / last.length;
                  if (f === 0) return "—";
                  const pct = ((l - f) / f) * 100;
                  const color = pct >= 0 ? "text-emerald-500" : "text-rose-500";
                  return <span className={color}>{pct >= 0 ? "+" : ""}{pct.toFixed(1)}%</span>;
                })()}
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
}
