import { useState, useRef, useEffect, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, Play, Pause, RotateCcw, Video, BrainCircuit, SplitSquareHorizontal, AlertTriangle } from "lucide-react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, ReferenceLine, ReferenceArea } from "recharts";

// ────────────────────────────── Three.js Brain Component ──────────────────────────────
function BrainMesh({ time, isDark, videoKey, colormap }: { time: number; isDark: boolean; videoKey: string; colormap: 'default' | 'purd' }) {
  const [geometry, setGeometry] = useState<THREE.BufferGeometry | null>(null);
  const [predData, setPredData] = useState<Float32Array | null>(null);
  
  // Precompute Color LUTs
  const colorLUTs = useMemo(() => {
    // 1. Default Heatmap (Blue -> Red -> Gold -> White)
    const defaultTable = new Float32Array(256 * 3);
    const darkBase = new THREE.Color(isDark ? 0x222233 : 0xdddddd);
    const blue = new THREE.Color(0x3b82f6);
    const red = new THREE.Color(0xef4444);
    const gold = new THREE.Color(0xffd700);
    const white = new THREE.Color(0xffffff);
    const temp = new THREE.Color();

    for (let i = 0; i < 256; i++) {
      const norm = i / 255;
      if (norm < 0.1) temp.copy(darkBase);
      else if (norm < 0.4) temp.lerpColors(darkBase, blue, (norm - 0.1) / 0.3);
      else if (norm < 0.7) temp.lerpColors(blue, red, (norm - 0.4) / 0.3);
      else if (norm < 0.9) temp.lerpColors(red, gold, (norm - 0.7) / 0.2);
      else temp.lerpColors(gold, white, (norm - 0.9) / 0.1);
      
      defaultTable[i * 3] = temp.r;
      defaultTable[i * 3 + 1] = temp.g;
      defaultTable[i * 3 + 2] = temp.b;
    }

    // 2. PuRd Heatmap (Pink -> Purple/Red) for Delta Aesthetic
    const purdTable = new Float32Array(256 * 3);
    const pdBase = new THREE.Color(isDark ? 0x1a1525 : 0xf7f4f9);
    const lightPink = new THREE.Color(0xe7e1ef);
    const pink = new THREE.Color(0xdf65b0);
    const deepPurple = new THREE.Color(0xce1256);
    const blackRed = new THREE.Color(0x67001f);

    for (let i = 0; i < 256; i++) {
      const norm = i / 255;
      if (norm < 0.1) temp.copy(pdBase);
      else if (norm < 0.3) temp.lerpColors(pdBase, lightPink, (norm - 0.1) / 0.2);
      else if (norm < 0.6) temp.lerpColors(lightPink, pink, (norm - 0.3) / 0.3);
      else if (norm < 0.8) temp.lerpColors(pink, deepPurple, (norm - 0.6) / 0.2);
      else temp.lerpColors(deepPurple, blackRed, (norm - 0.8) / 0.2);
      
      purdTable[i * 3] = temp.r;
      purdTable[i * 3 + 1] = temp.g;
      purdTable[i * 3 + 2] = temp.b;
    }

    return { default: defaultTable, purd: purdTable };
  }, [isDark]);

  useEffect(() => {
    let active = true;
    async function loadGeometry() {
      const [vertRes, faceRes] = await Promise.all([
        fetch("/fsaverage5_vertices.bin"),
        fetch("/fsaverage5_faces.bin")
      ]);
      const vertBuffer = await vertRes.arrayBuffer();
      const faceBuffer = await faceRes.arrayBuffer();
      const vertices = new Float32Array(vertBuffer);
      const indices = new Uint32Array(faceBuffer);
      
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
      geo.setIndex(new THREE.BufferAttribute(indices, 1));
      
      const colors = new Float32Array(vertices.length);
      for (let i = 0; i < vertices.length; i+=3) {
        colors[i] = 0.5; colors[i+1] = 0.5; colors[i+2] = 0.5;
      }
      geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      geo.computeVertexNormals();
      if (active) setGeometry(geo);
    }
    loadGeometry();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    async function loadPreds() {
      // Dynamic loading for standard vids OR delta array
      const fetchUrl = videoKey === 'delta' ? '/engagement_delta.bin' : `/${videoKey}_preds.bin`;
      const predRes = await fetch(fetchUrl);
      const predBuffer = await predRes.arrayBuffer();
      if (active) setPredData(new Float32Array(predBuffer));
    }
    loadPreds();
    return () => { active = false; };
  }, [videoKey]);

  useFrame(() => {
    if (!geometry || !predData) return;
    
    const maxFrame = Math.max(0, (predData.length / 20484) - 1);
    const frameIndex = Math.min(maxFrame, Math.floor(time));
    const offset = frameIndex * 20484;
    
    const colors = geometry.attributes.color.array as Float32Array;
    const lut = colorLUTs[colormap];
    
    for (let i = 0; i < 20484; i++) {
      const val = predData[offset + i];
      
      // Delta data typically has smaller variance (0 to 0.1 as per the snippet)
      // Standard data ranges up to 1.0 or so
      let norm = 0;
      if (colormap === 'purd') {
        // vmin=0, vmax=0.1
        norm = Math.max(0, Math.min(1, val / 0.1));
      } else {
        // vmin=0.6, vmax=1.0
        norm = Math.max(0, Math.min(1, (val - 0.6) / 0.4));
      }

      const lutIndex = Math.floor(norm * 255) * 3;
      
      colors[i * 3] = lut[lutIndex];
      colors[i * 3 + 1] = lut[lutIndex + 1];
      colors[i * 3 + 2] = lut[lutIndex + 2];
    }
    geometry.attributes.color.needsUpdate = true;
  });

  if (!geometry) return null;

  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial 
        vertexColors 
        roughness={0.7} 
        metalness={0.2}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

// ────────────────────────────── Custom Diagnostic Tooltip ──────────────────────────────
const CustomTooltip = ({ active, payload, label, isDark }: any) => {
  if (active && payload && payload.length) {
    // Diagnostic Overlay Logic
    // If Attention drops below 0 (for normalized delta) or below baseline, trigger a warning!
    const attentionScore = payload.find((p: any) => p.dataKey === 'attention')?.value || 0;
    const isEngagementGap = attentionScore < 0.01;

    return (
      <div className={`p-3 rounded-xl border shadow-2xl backdrop-blur-md ${isDark ? 'bg-black/90 border-border/50 text-white' : 'bg-white/90 border-border text-black'}`}>
        <p className="font-mono-tight text-xs mb-2">Time: {label}s</p>
        {payload.map((p: any, idx: number) => (
          <div key={idx} className="flex justify-between gap-4 text-xs font-semibold my-1">
            <span style={{ color: p.color }}>{p.name}</span>
            <span>{p.value.toFixed(4)}</span>
          </div>
        ))}
        {isEngagementGap && (
          <div className="mt-3 pt-2 border-t border-red-500/30 flex gap-2 text-red-400 bg-red-500/10 p-2 rounded-lg items-start">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] uppercase font-bold tracking-wider">Engagement Gap Detected</span>
              <span className="text-xs">Attention dropping! Missing visual hooks or speech overlay.</span>
            </div>
          </div>
        )}
      </div>
    );
  }
  return null;
};


// ────────────────────────────── Main Component ──────────────────────────────
export function AccurateBrainVisualizer() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [activeMode, setActiveMode] = useState<'video_1' | 'video_2' | 'delta'>('video_1');
  
  // Hold master data mapped from marketing_performance.json
  const [allChartData, setAllChartData] = useState<any>(null);
  const [chartData, setChartData] = useState<any[]>([]);

  const isDark = typeof document !== "undefined" && document.documentElement.classList.contains("dark");

  useEffect(() => {
    fetch('/marketing_performance.json')
      .then(r => r.json())
      .then(data => {
        if (data) {
          setAllChartData(data);
          setChartData(data['video_1']); // default
        }
      })
      .catch(console.error);
  }, []);

  // Update chart data whenever mode changes
  useEffect(() => {
    if (!allChartData) return;
    
    if (activeMode === 'delta') {
      // Calculate delta mathematically on the fly for the chart (video_2 - video_1)
      const v1 = allChartData['video_1'];
      const v2 = allChartData['video_2'];
      if (v1 && v2) {
        const deltaChart = v1.map((p1: any, i: number) => {
          const p2 = v2[i] || p1;
          return {
            time: p1.time,
            attention: p2.attention - p1.attention,
            emotion: p2.emotion - p1.emotion,
            memory: p2.memory - p1.memory,
            reward: p2.reward - p1.reward,
          };
        });
        setChartData(deltaChart);
      }
    } else {
      setChartData(allChartData[activeMode]);
    }
  }, [activeMode, allChartData]);

  const handlePlayPause = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play().then(() => setIsPlaying(true)).catch(console.error);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleRestart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().then(() => setIsPlaying(true)).catch(console.error);
    }
  };

  const handleModeSwitch = (mode: 'video_1' | 'video_2' | 'delta') => {
    setActiveMode(mode);
    setIsPlaying(false);
    setCurrentTime(0);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  };

  const handleChartClick = (state: any) => {
    if (state && state.activeLabel !== undefined && videoRef.current) {
      const targetTime = Number(state.activeLabel);
      videoRef.current.currentTime = targetTime;
      setCurrentTime(targetTime);
    }
  };

  // When in Delta mode, we might play the Transformation video as the reference video
  const videoSrc = activeMode === 'video_1' ? '/burger_1.mp4' : (activeMode === 'video_2' ? '/Mac1.mp4' : '/Mac1.mp4');
  const maxTime = Math.max(1, chartData.length - 1);

  return (
    <div className="flex flex-col gap-8 w-full max-w-6xl mx-auto">
      
      {/* View Mode Selector Toggles */}
      <div className="flex justify-center gap-3 flex-wrap">
        <button
          onClick={() => handleModeSwitch('video_1')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all border border-border/50 ${
            activeMode === 'video_1' ? 'bg-primary text-primary-foreground shadow-lg scale-105 border-primary/50' : 'bg-card text-muted-foreground hover:bg-muted'
          }`}
        >
          <Video className="w-4 h-4" />
          Boring to Boom (Original)
        </button>
        <button
          onClick={() => handleModeSwitch('video_2')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all border border-border/50 ${
            activeMode === 'video_2' ? 'bg-primary text-primary-foreground shadow-lg scale-105 border-primary/50' : 'bg-card text-muted-foreground hover:bg-muted'
          }`}
        >
          <BrainCircuit className="w-4 h-4" />
          Exciting to Boring (Mac)
        </button>
        <button
          onClick={() => handleModeSwitch('delta')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all border border-[#df65b0]/50 ${
            activeMode === 'delta' ? 'bg-gradient-to-r from-[#df65b0] to-[#ce1256] text-white shadow-xl scale-105 border-transparent' : 'bg-card text-[#df65b0] hover:bg-[#df65b0]/10'
          }`}
        >
          <SplitSquareHorizontal className="w-4 h-4" />
          Engagement Delta (V2 - V1)
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Video */}
        <Card className="border-border/50 bg-card/40 p-1 w-full shadow-2xl rounded-2xl overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-border/50 flex justify-between items-center bg-card/50">
             <div className="flex items-center gap-2">
                <Video className="w-4 h-4 text-primary" />
                <span className="font-semibold text-sm">
                  {activeMode === 'delta' ? 'Creative Reference (V2)' : 'Creative Asset'}
                </span>
             </div>
             <Badge variant="outline" className="text-[10px] font-mono-tight">T={currentTime.toFixed(2)}s</Badge>
          </div>
          
          <div 
            className="relative bg-black w-full aspect-video group flex flex-col cursor-pointer"
            onClick={handlePlayPause}
          >
            <video
              ref={videoRef}
              src={videoSrc}
              className="w-full h-full object-contain"
              onTimeUpdate={handleTimeUpdate}
              onEnded={() => setIsPlaying(false)}
              controls={false}
              playsInline
            />
            
            <div className={`absolute inset-0 bg-black/40 transition-opacity flex items-center justify-center pointer-events-none ${isPlaying ? 'opacity-0' : 'opacity-100 group-hover:bg-black/50'}`}>
              <button
                onClick={handlePlayPause}
                className={`pointer-events-auto w-16 h-16 rounded-full flex items-center justify-center hover:scale-110 transition-transform shadow-xl backdrop-blur-md ${activeMode === 'delta' ? 'bg-[#df65b0]/90 text-white' : 'bg-primary/90 text-primary-foreground'}`}
              >
                {isPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 ml-1" />}
              </button>
            </div>
            
            <div className="absolute bottom-4 right-4 flex gap-2 z-10">
              <button
                onClick={handleRestart}
                className="w-8 h-8 rounded-full bg-background/80 text-foreground flex items-center justify-center hover:bg-background transition-colors shadow-sm backdrop-blur-md"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </Card>

        {/* Right Column: 3D Brain */}
        <Card className="border-border/50 bg-card/40 p-1 w-full shadow-2xl rounded-2xl overflow-hidden flex flex-col h-[300px] lg:h-auto relative">
          {/* Aesthetic PuRd Glow behind brain for Delta Mode */}
          {activeMode === 'delta' && (
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-[#df65b0]/20 blur-[100px] rounded-full pointer-events-none -z-10" />
          )}

          <div className="px-4 py-3 border-b border-border/50 flex justify-between items-center bg-card/50 z-10">
             <div className="flex items-center gap-2">
                <Activity className={`w-4 h-4 ${activeMode === 'delta' ? 'text-[#df65b0]' : 'text-primary'}`} />
                <span className="font-semibold text-sm">
                  {activeMode === 'delta' ? 'Delta Cortical Surface' : 'Cortical Surface Activation'}
                </span>
             </div>
             <Badge className={`text-[10px] font-mono-tight ${activeMode === 'delta' ? 'bg-[#df65b0] hover:bg-[#df65b0]/80 text-white' : 'bg-primary text-primary-foreground'}`}>
               {activeMode === 'delta' ? 'PuRd COLORMAP' : '.NPY SYNCED'}
             </Badge>
          </div>

          <div className="relative w-full h-full bg-transparent cursor-move flex-1 z-0">
            <Canvas camera={{ position: [-120, 0, 0], fov: 45 }}>
              <ambientLight intensity={Math.PI / 2} />
              <directionalLight position={[100, 100, 100]} intensity={Math.PI} />
              <directionalLight position={[-100, -100, -100]} intensity={Math.PI * 0.5} />
              <BrainMesh 
                time={currentTime} 
                isDark={isDark} 
                videoKey={activeMode} 
                colormap={activeMode === 'delta' ? 'purd' : 'default'}
              />
              <OrbitControls enablePan={true} enableZoom={true} autoRotate={false} />
            </Canvas>
          </div>
        </Card>
      </div>

      {/* Bottom Row: Full-width Interactive Line Chart */}
      {chartData.length > 0 && (
        <Card className="border-border/50 bg-card/40 p-5 w-full shadow-xl rounded-2xl">
          <div className="mb-4 text-center">
            <h3 className="text-base font-bold">
              {activeMode === 'delta' ? 'Engagement Delta: Pink & Purple Aesthetic (V2 > V1)' : 'TRIBE v2: Marketing KPI Performance Trends Over Time'}
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              {activeMode === 'delta' 
                ? 'Hover over dips to view AI Diagnostic Overlays. Click to scrub.' 
                : 'Click anywhere on the chart to scrub the video and brain visualization to that exact second.'}
            </p>
          </div>

          <div className="w-full h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart 
                data={chartData} 
                margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
                onClick={handleChartClick}
                className="cursor-pointer"
              >
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#333" : "#eee"} vertical={false} />
                <XAxis 
                  dataKey="time" 
                  type="number" 
                  domain={[0, maxTime]} 
                  stroke={isDark ? "#888" : "#888"} 
                  tick={{fontSize: 12}} 
                  tickFormatter={(val) => `t=${val}s`}
                />
                <YAxis 
                  stroke={isDark ? "#888" : "#888"} 
                  tick={{fontSize: 12}} 
                  domain={activeMode === 'delta' ? [-0.05, 0.05] : [-0.05, 0.05]} 
                />
                <RechartsTooltip content={<CustomTooltip isDark={isDark} />} cursor={{ stroke: 'rgba(255, 255, 255, 0.1)', strokeWidth: 20 }} />
                <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} />
                
                {/* Highlight areas where delta is extremely low */}
                {activeMode === 'delta' && (
                   <ReferenceArea y1={-0.05} y2={0.01} fill="#ef4444" fillOpacity={0.05} />
                )}

                <ReferenceLine x={Math.min(maxTime, Math.round(currentTime))} stroke={activeMode === 'delta' ? '#df65b0' : '#ef4444'} strokeWidth={2} strokeDasharray="3 3" />

                <Line type="monotone" dataKey="attention" name="Attention/Visual Load" stroke={activeMode === 'delta' ? '#df65b0' : '#3b82f6'} strokeWidth={3} dot={{r: 4}} activeDot={{ r: 8 }} />
                <Line type="monotone" dataKey="emotion" name="Emotion" stroke={activeMode === 'delta' ? '#ce1256' : '#f97316'} strokeWidth={3} dot={{r: 4}} activeDot={{ r: 8 }} />
                <Line type="monotone" dataKey="memory" name="Memory/Cognitive Load" stroke={activeMode === 'delta' ? '#980043' : '#22c55e'} strokeWidth={3} dot={{r: 4}} activeDot={{ r: 8 }} />
                <Line type="monotone" dataKey="reward" name="Reward/Engagement" stroke={activeMode === 'delta' ? '#67001f' : '#ef4444'} strokeWidth={3} dot={{r: 4}} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}
    </div>
  );
}
