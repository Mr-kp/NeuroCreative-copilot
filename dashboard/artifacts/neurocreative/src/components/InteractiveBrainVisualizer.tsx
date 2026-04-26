import { useState, useRef, useEffect, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, Play, Pause, RotateCcw, Activity } from "lucide-react";

type RegionKey = "attention" | "reward" | "memory" | "visualLoad" | "emotion";

interface RegionDef {
  key: RegionKey;
  label: string;
  metricLabel: string;
  color: string;
  colorMid: string;
  colorSoft: string;
}

const REGIONS: RegionDef[] = [
  { key: "attention", label: "Attention", metricLabel: "Attention Score", color: "#C026D3", colorMid: "#D946EF", colorSoft: "#E879F9" },
  { key: "reward", label: "Reward", metricLabel: "Reward Signal", color: "#EC4899", colorMid: "#F472B6", colorSoft: "#F9A8D4" },
  { key: "memory", label: "Memory", metricLabel: "Memory Potential", color: "#A78BFA", colorMid: "#C4B5FD", colorSoft: "#DDD6FE" },
  { key: "visualLoad", label: "Visual Load", metricLabel: "Visual Load", color: "#6366F1", colorMid: "#818CF8", colorSoft: "#A5B4FC" },
  { key: "emotion", label: "Emotion", metricLabel: "Emotional Intensity", color: "#F43F5E", colorMid: "#FB7185", colorSoft: "#FDA4AF" },
];

function calculateScoresForTime(time: number): Record<RegionKey, number> {
  const t = time;
  // A deterministic pseudo-random generator based on time
  const noise = (offset: number) => (Math.sin(t * 15 + offset) * 0.5 + 0.5) * 8;
  
  // Specific narrative logic for "Boring to Boom" Burger Commercial
  // At t=0: low activity
  // At t=3: suddenly spikes
  const phase = t < 3 ? 0 : 1;
  
  if (phase === 0) {
    return {
      attention: Math.round(30 + noise(1)),
      reward: Math.round(20 + noise(2)),
      memory: Math.round(40 + noise(3)),
      visualLoad: Math.round(30 + noise(4)),
      emotion: Math.round(25 + noise(5)),
    };
  } else {
    // Boom phase! Higher values and more dynamics
    return {
      attention: Math.round(Math.min(100, Math.max(0, 70 + 20 * Math.sin((t-3) * 2) + noise(1)))),
      reward: Math.round(Math.min(100, Math.max(0, 80 + 15 * Math.sin((t-3) * 1.5 + 1) + noise(2)))),
      memory: Math.round(Math.min(100, Math.max(0, 65 + 15 * Math.sin((t-3) * 1.1 + 2) + noise(3)))),
      visualLoad: Math.round(Math.min(100, Math.max(0, 60 + 20 * Math.sin((t-3) * 3 + 3) + noise(4)))),
      emotion: Math.round(Math.min(100, Math.max(0, 85 + 10 * Math.sin((t-3) * 1.8 + 4) + noise(5)))),
    };
  }
}

// ────────────────────────────── Brain SVG ──────────────────────────────
interface BrainSVGProps {
  scores: Record<RegionKey, number>;
  hovered: RegionKey | null;
  onHover: (k: RegionKey | null) => void;
  isDark: boolean;
}

function BrainSVG({ scores, hovered, onHover, isDark }: BrainSVGProps) {
  const bg = isDark ? "#020617" : "#F8FAFC";
  const brainFill = isDark ? "#111827" : "#E2E8F0";
  const strokeColor = isDark ? "#A78BFA" : "#7C3AED";

  const regionOpacity = (score: number) => 0.15 + (score / 100) * 0.8;
  const regionScale = (score: number) => 0.9 + score / 200;

  const svgRegions: { key: RegionKey; id: string; cx: number; cy: number; rx: number; ry: number; gradientId: string }[] = [
    { key: "attention", id: "attention-region", cx: 360, cy: 150, rx: 110, ry: 60, gradientId: "attentionGlow" },
    { key: "reward", id: "reward-region", cx: 360, cy: 230, rx: 80, ry: 50, gradientId: "rewardGlow" },
    { key: "memory", id: "memory-left", cx: 260, cy: 250, rx: 70, ry: 50, gradientId: "memoryGlow" },
    { key: "memory", id: "memory-right", cx: 460, cy: 250, rx: 70, ry: 50, gradientId: "memoryGlow" },
    { key: "visualLoad", id: "visual-region", cx: 520, cy: 220, rx: 70, ry: 80, gradientId: "visualGlow" },
    { key: "emotion", id: "emotion-region", cx: 320, cy: 310, rx: 90, ry: 50, gradientId: "emotionGlow" },
  ];

  return (
    <svg width="100%" height="100%" viewBox="0 0 720 460" xmlns="http://www.w3.org/2000/svg" className="select-none" style={{ display: "block" }}>
      <defs>
        {REGIONS.map((r) => (
          <radialGradient key={r.key} id={`${r.key}Glow`}>
            <stop offset="0%" stopColor={r.color} stopOpacity="0.95" />
            <stop offset="60%" stopColor={r.colorMid} stopOpacity="0.4" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
        ))}
        <filter id="mri-blur">
          <feGaussianBlur stdDeviation="12" />
        </filter>
      </defs>

      <rect width="720" height="460" rx="16" fill={bg} />

      <g opacity="0.04">
        {Array.from({ length: 23 }, (_, i) => (
          <line key={`h-${i}`} x1="0" y1={i * 20} x2="720" y2={i * 20} stroke={isDark ? "#fff" : "#000"} strokeWidth="0.5" />
        ))}
      </g>

      <path d="M187 229C176 188 197 145 234 126C243 91 283 73 319 89C346 63 394 63 421 89C456 74 497 92 506 127C544 147 565 190 553 230C568 267 552 311 516 333C509 374 466 396 428 380C400 409 348 408 320 380C282 396 239 374 232 333C197 310 181 266 187 229Z" fill={brainFill} stroke={strokeColor} strokeOpacity="0.4" strokeWidth="2" />

      <g opacity={isDark ? 0.12 : 0.08} stroke={strokeColor} strokeWidth="1" fill="none">
        <path d="M280 160 Q320 140 370 155 Q400 165 420 150" />
        <path d="M250 200 Q310 185 360 195 Q420 210 480 190" />
        <path d="M240 260 Q300 240 350 255 Q400 250 470 265" />
        <path d="M260 310 Q320 290 380 300 Q430 310 490 295" />
        <path d="M310 130 Q340 170 360 200" />
        <path d="M400 130 Q380 170 370 210" />
      </g>

      {svgRegions.map((region) => {
        const score = scores[region.key];
        const opacity = regionOpacity(score);
        const scale = regionScale(score);
        const isHovered = hovered === region.key;

        return (
          <ellipse
            key={region.id} cx={region.cx} cy={region.cy} rx={region.rx} ry={region.ry}
            fill={`url(#${region.gradientId})`} filter="url(#mri-blur)"
            opacity={isHovered ? Math.min(opacity * 1.3, 1) : opacity}
            style={{
              transform: `scale(${isHovered ? scale * 1.05 : scale})`,
              transformOrigin: `${region.cx}px ${region.cy}px`,
              transition: "all 0.15s linear",
            }}
            onMouseEnter={() => onHover(region.key)}
            onMouseLeave={() => onHover(null)}
            className="cursor-pointer"
          />
        );
      })}

      <g opacity="0.15">
        <ellipse cx="360" cy="230" rx="200" ry="130" fill="none" stroke={strokeColor} strokeWidth="0.5" strokeOpacity="0.3">
          <animate attributeName="rx" values="195;205;195" dur="4s" repeatCount="indefinite" />
          <animate attributeName="ry" values="125;135;125" dur="4s" repeatCount="indefinite" />
          <animate attributeName="stroke-opacity" values="0.15;0.35;0.15" dur="4s" repeatCount="indefinite" />
        </ellipse>
      </g>
    </svg>
  );
}

function ScoreRow({ region, score, active, onHover }: { region: RegionDef; score: number; active: boolean; onHover: (k: RegionKey | null) => void }) {
  return (
    <div
      className="group flex items-center gap-3 rounded-md px-2 py-1.5 -mx-2 transition-colors hover:bg-muted/30"
      onMouseEnter={() => onHover(region.key)}
      onMouseLeave={() => onHover(null)}
    >
      <span
        className="h-2 w-2 flex-shrink-0 rounded-full"
        style={{ background: region.color, boxShadow: active ? `0 0 8px ${region.color}` : "none", transition: "box-shadow 180ms" }}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-xs font-medium text-foreground truncate">{region.metricLabel}</span>
          <span className="font-mono-tight text-xs font-semibold tabular-nums text-foreground">{score}</span>
        </div>
        <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full"
            style={{ width: `${score}%`, background: `linear-gradient(90deg, ${region.color}, ${region.colorMid})`, opacity: 0.85, transition: "width 0.15s linear" }}
          />
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────── Main Component ──────────────────────────────
export function InteractiveBrainVisualizer() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [hovered, setHovered] = useState<RegionKey | null>(null);

  const isDark = typeof document !== "undefined" && document.documentElement.classList.contains("dark");
  const scores = useMemo(() => calculateScoresForTime(currentTime), [currentTime]);

  const handlePlayPause = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleRestart = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  return (
    <Card className="border-border/50 bg-card/40 p-5 mt-8 w-full shadow-2xl">
      <div className="flex items-end justify-between mb-6 flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <Activity className="h-5 w-5 text-primary" />
          <div className="leading-tight">
            <h2 className="text-base font-semibold">
              Live <span className="font-display italic font-normal text-primary">Neural Synchronization</span>
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              Synchronized TRIBE-V2 neural response simulation reacting to visual stimuli frame-by-frame.
            </p>
          </div>
        </div>
        <Badge variant="default" className="font-mono-tight text-[10px] bg-primary text-primary-foreground px-2 py-0.5">
          Real-time Inference Simulation
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Video Player */}
        <div className="flex flex-col gap-3">
          <div className="relative rounded-xl overflow-hidden border border-border/50 shadow-inner bg-black aspect-video group">
            <video
              ref={videoRef}
              src="/creatives/Boring_to_Boom_Burger_Commercial.mp4"
              className="w-full h-full object-contain"
              onTimeUpdate={handleTimeUpdate}
              onEnded={() => setIsPlaying(false)}
              onClick={handlePlayPause}
            />
            
            {/* Custom Controls Overlay */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <button
                onClick={handlePlayPause}
                className="w-16 h-16 rounded-full bg-primary/90 text-primary-foreground flex items-center justify-center hover:scale-110 transition-transform shadow-xl backdrop-blur-md"
              >
                {isPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 ml-1" />}
              </button>
            </div>
            
            <div className="absolute bottom-4 right-4 flex gap-2">
              <button
                onClick={handleRestart}
                className="w-8 h-8 rounded-full bg-background/80 text-foreground flex items-center justify-center hover:bg-background transition-colors shadow-sm backdrop-blur-md"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
            
            <div className="absolute top-4 left-4 bg-black/60 text-white text-xs font-mono-tight px-2 py-1 rounded backdrop-blur-md">
              T+{currentTime.toFixed(2)}s
            </div>
          </div>
          
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Video Input: <span className="font-mono-tight text-foreground">Boring_to_Boom_Burger_Commercial.mp4</span></span>
            <span>Status: <span className={isPlaying ? "text-primary font-medium" : ""}>{isPlaying ? "Processing..." : "Paused"}</span></span>
          </div>
        </div>

        {/* Right: Brain Visualization & Metrics */}
        <div className="flex flex-col gap-5">
          <div className="relative w-full overflow-hidden rounded-xl border border-border/50 bg-card/60 aspect-[1.5/1]">
            <BrainSVG scores={scores} hovered={hovered} onHover={setHovered} isDark={isDark} />
          </div>

          <div>
            <div className="font-mono-tight text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground mb-3 flex items-center gap-2">
              <Brain className="w-3 h-3" />
              Dynamic Neural Activity Metrics
            </div>
            <div className="space-y-1.5 bg-muted/20 p-3 rounded-lg border border-border/30">
              {REGIONS.map((r) => (
                <ScoreRow key={r.key} region={r} score={scores[r.key]} active={hovered === r.key} onHover={setHovered} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
