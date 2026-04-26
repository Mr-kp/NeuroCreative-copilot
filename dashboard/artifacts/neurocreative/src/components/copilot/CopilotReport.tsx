import { motion } from "framer-motion";
import {
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Target,
  Zap,
  Eye,
  Heart,
  Brain,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import {
  LineChart,
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
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { Progress } from "../ui/progress";
import type { CopilotAnalysis } from "../../types/copilot";

interface Props {
  analysis: CopilotAnalysis;
}

const gradeBg = (grade: string) => {
  if (grade.startsWith("A")) return "from-emerald-500/20 to-emerald-500/5 border-emerald-500/20";
  if (grade.startsWith("B")) return "from-sky-500/20 to-sky-500/5 border-sky-500/20";
  if (grade.startsWith("C")) return "from-amber-500/20 to-amber-500/5 border-amber-500/20";
  if (grade.startsWith("D")) return "from-orange-500/20 to-orange-500/5 border-orange-500/20";
  return "from-red-500/20 to-red-500/5 border-red-500/20";
};

const gradeText = (grade: string) => {
  if (grade.startsWith("A")) return "text-emerald-400";
  if (grade.startsWith("B")) return "text-sky-400";
  if (grade.startsWith("C")) return "text-amber-400";
  if (grade.startsWith("D")) return "text-orange-400";
  return "text-red-400";
};

const scoreIcon = (dim: string) => {
  const map: Record<string, any> = {
    attention: Eye,
    reward: Target,
    memory: Brain,
    emotion: Heart,
    visualLoad: Layers,
  };
  return map[dim] || Zap;
};

const scoreColor = (dim: string) => {
  const map: Record<string, string> = {
    attention: "#f472b6",
    reward: "#2dd4bf",
    memory: "#818cf8",
    emotion: "#fb923c",
    visualLoad: "#a78bfa",
  };
  return map[dim] || "#94a3b8";
};

export function CopilotReport({ analysis }: Props) {
  const { brain_scores, executive_summary, decay_forecast, improvements, attention_heatmap, ml_prediction, recommendation } = analysis;

  const forecastData = decay_forecast.projected.map((p) => ({
    ...p,
    ctr_pct: +(p.ctr * 100).toFixed(3),
  }));

  const maxImprovements = 5;
  const shownImprovements = improvements.slice(0, maxImprovements);

  return (
    <div className="space-y-4">
      {/* Executive Summary */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
        <Card className={`overflow-hidden border bg-gradient-to-br ${gradeBg(executive_summary.grade)}`}>
          <div className="flex items-start gap-6 p-6">
            <div className="text-center">
              <div className={`text-5xl font-black font-display ${gradeText(executive_summary.grade)}`}>
                {executive_summary.grade}
              </div>
              <div className="text-xs text-muted-foreground mt-1">{executive_summary.overall_score}/100</div>
            </div>
            <div className="flex-1 space-y-3">
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Top Actions</h3>
                <ul className="mt-1 space-y-1">
                  {executive_summary.top_actions.map((a, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <ArrowUpRight className="mt-0.5 h-3 w-3 shrink-0 text-primary" />
                      <span>{a}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-xs font-semibold text-emerald-400 uppercase">Strengths</h4>
                  {executive_summary.strengths.slice(0, 2).map((s, i) => (
                    <p key={i} className="text-xs text-muted-foreground mt-0.5 flex items-start gap-1">
                      <CheckCircle className="h-3 w-3 shrink-0 mt-0.5 text-emerald-400" />
                      {s}
                    </p>
                  ))}
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-amber-400 uppercase">Weaknesses</h4>
                  {executive_summary.weaknesses.slice(0, 2).map((w, i) => (
                    <p key={i} className="text-xs text-muted-foreground mt-0.5 flex items-start gap-1">
                      <AlertTriangle className="h-3 w-3 shrink-0 mt-0.5 text-amber-400" />
                      {w}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Brain Scores + Decay Chart row */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Brain Scores */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="p-5">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold">
              <Brain className="h-4 w-4 text-primary" /> Brain Score Breakdown
            </h3>
            <div className="space-y-3">
              {(["attention", "reward", "memory", "emotion", "visualLoad"] as const).map((dim) => {
                const val = brain_scores[dim];
                const Icon = scoreIcon(dim === "visualLoad" ? "visualLoad" : dim);
                const color = scoreColor(dim);
                const label = dim === "visualLoad" ? "Visual Load" : dim.charAt(0).toUpperCase() + dim.slice(1);
                return (
                  <div key={dim}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5 font-medium">
                        <Icon className="h-3 w-3" style={{ color }} />
                        {label}
                      </span>
                      <span className="font-mono font-semibold" style={{ color }}>
                        {val.toFixed(1)}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ backgroundColor: color }}
                        initial={{ width: 0 }}
                        animate={{ width: `${val}%` }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
              <Badge variant="outline" className="text-[10px]">
                {analysis.brain_score_source}
              </Badge>
              <span>Source: {ml_prediction.model_source}</span>
            </div>
          </Card>
        </motion.div>

        {/* Decay Forecast */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="p-5">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold">
              <TrendingDown className="h-4 w-4 text-primary" /> Decay Forecast
            </h3>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={forecastData} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                  <defs>
                    <linearGradient id="ctrGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f472b6" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#f472b6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                  <XAxis dataKey="day" tick={{ fontSize: 10 }} label={{ value: "Days", position: "bottom", fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={(v: number) => `${v}%`} width={40} />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 8,
                      fontSize: 11,
                    }}
                    formatter={(v: number) => [`${v.toFixed(3)}%`, "CTR"]}
                  />
                  <Area type="monotone" dataKey="ctr_pct" fill="url(#ctrGrad)" stroke="none" />
                  <Line type="monotone" dataKey="ctr_pct" stroke="#f472b6" strokeWidth={2} dot={false} />
                  {decay_forecast.fatigue_onset_day && (
                    <ReferenceLine
                      x={decay_forecast.fatigue_onset_day}
                      stroke="#fb923c"
                      strokeDasharray="4 4"
                      label={{ value: "Fatigue", fontSize: 9, fill: "#fb923c" }}
                    />
                  )}
                  {decay_forecast.critical_day && (
                    <ReferenceLine
                      x={decay_forecast.critical_day}
                      stroke="#ef4444"
                      strokeDasharray="4 4"
                      label={{ value: "Critical", fontSize: 9, fill: "#ef4444" }}
                    />
                  )}
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 grid grid-cols-3 gap-2 text-center text-xs">
              <div>
                <div className="font-mono text-sm font-semibold">{decay_forecast.half_life_days}d</div>
                <div className="text-muted-foreground">Half-life</div>
              </div>
              <div>
                <div className="font-mono text-sm font-semibold text-amber-400">
                  {decay_forecast.fatigue_onset_day ?? ">30"}d
                </div>
                <div className="text-muted-foreground">Fatigue onset</div>
              </div>
              <div>
                <div className="font-mono text-sm font-semibold">
                  {Math.round(ml_prediction.fatigue_probability * 100)}%
                </div>
                <div className="text-muted-foreground">Fatigue risk</div>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Attention Heatmap + Improvements row */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Attention Heatmap */}
        {attention_heatmap.grid.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card className="p-5">
              <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold">
                <Eye className="h-4 w-4 text-primary" /> Attention Heatmap
              </h3>
              <div className="relative aspect-square w-full max-w-[240px] mx-auto">
                <div
                  className="grid h-full w-full gap-[2px] rounded-lg overflow-hidden"
                  style={{ gridTemplateColumns: `repeat(8, 1fr)` }}
                >
                  {attention_heatmap.grid.flat().map((val, i) => {
                    const r = Math.round(244 * val);
                    const g = Math.round(114 * val + 40 * (1 - val));
                    const b = Math.round(182 * val);
                    return (
                      <motion.div
                        key={i}
                        className="rounded-sm"
                        style={{ backgroundColor: `rgb(${r}, ${g}, ${b})` }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.6 + val * 0.4 }}
                        transition={{ delay: i * 0.005 }}
                      />
                    );
                  })}
                </div>
                {attention_heatmap.hotspots.map((hs, i) => (
                  <motion.div
                    key={i}
                    className="absolute h-3 w-3 rounded-full border-2 border-white"
                    style={{
                      left: `${hs.x * 100}%`,
                      top: `${hs.y * 100}%`,
                      transform: "translate(-50%, -50%)",
                      boxShadow: `0 0 ${hs.intensity * 12}px rgba(244, 114, 182, ${hs.intensity})`,
                    }}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.5 + i * 0.1 }}
                  />
                ))}
              </div>
              <p className="mt-3 text-xs text-muted-foreground text-center">
                Synthetic saliency from visual features (edges, contrast, center bias)
              </p>
            </Card>
          </motion.div>
        )}

        {/* Improvements */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
          <Card className="p-5">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold">
              <Zap className="h-4 w-4 text-primary" /> Improvement Suggestions
            </h3>
            <div className="space-y-3">
              {shownImprovements.map((imp, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + i * 0.05 }}
                  className="flex gap-3 rounded-lg border border-border/50 p-3"
                >
                  <Badge
                    variant={imp.priority === "high" ? "destructive" : "secondary"}
                    className="shrink-0 text-[10px] h-fit"
                  >
                    {imp.priority.toUpperCase()}
                  </Badge>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold">{imp.area}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {imp.current_score} → {imp.target_score}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{imp.action}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </Card>
        </motion.div>
      </div>

      {/* ML Prediction Summary */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                  recommendation.action === "Scale"
                    ? "bg-emerald-500/10 text-emerald-400"
                    : recommendation.action === "Pause"
                      ? "bg-red-500/10 text-red-400"
                      : recommendation.action === "Pivot"
                        ? "bg-amber-500/10 text-amber-400"
                        : "bg-sky-500/10 text-sky-400"
                }`}
              >
                {recommendation.action === "Scale" ? (
                  <TrendingUp className="h-5 w-5" />
                ) : recommendation.action === "Pause" ? (
                  <AlertTriangle className="h-5 w-5" />
                ) : (
                  <Target className="h-5 w-5" />
                )}
              </div>
              <div>
                <div className="text-lg font-bold">{recommendation.action}</div>
                <div className="text-xs text-muted-foreground">{recommendation.explanation}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-muted-foreground">Confidence</div>
              <div className="text-lg font-mono font-bold">{Math.round(recommendation.confidence * 100)}%</div>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
