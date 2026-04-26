import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  Brain,
  Sparkles,
  Image as ImageIcon,
  Video,
  X,
  Loader2,
  FileImage,
  RotateCcw,
  FileDown,
  AlertTriangle,
  Clock,
} from "lucide-react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { CopilotReport } from "./CopilotReport";
import { CopilotChat } from "./CopilotChat";
import { copilotAnalyze, copilotReset } from "../../lib/copilotApi";
import type { CopilotAnalysis } from "../../types/copilot";

export function CopilotPage() {
  const [analyses, setAnalyses] = useState<CopilotAnalysis[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progressSteps, setProgressSteps] = useState<{ msg: string; done: boolean }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const activeAnalysis = analyses.find((a) => a.id === activeId) || null;

  const handleFile = useCallback(async (file: File) => {
    setIsAnalyzing(true);
    setProgressSteps([]);
    setError(null);

    try {
      const analysis = await copilotAnalyze(file, (msg) => {
        const done = msg.includes("(") && msg.includes("s)");
        setProgressSteps((prev) => [...prev, { msg, done }]);
      });
      setAnalyses((prev) => {
        if (prev.find((a) => a.id === analysis.id)) return prev;
        return [...prev, analysis];
      });
      setActiveId(analysis.id);
    } catch (e: any) {
      setError(e.message || "Analysis failed");
    } finally {
      setIsAnalyzing(false);
      setProgressSteps([]);
    }
  }, []);

  const handleReset = useCallback(async () => {
    try {
      await copilotReset();
    } catch {}
    setActiveId(null);
    setAnalyses([]);
    setError(null);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file && (file.type.startsWith("image/") || file.type.startsWith("video/"))) {
        handleFile(file);
      }
    },
    [handleFile],
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
      e.target.value = "";
    },
    [handleFile],
  );

  const handlePrintReport = useCallback(() => {
    window.print();
  }, []);

  const gradeColor = (grade: string) => {
    if (grade.startsWith("A")) return "text-emerald-400";
    if (grade.startsWith("B")) return "text-sky-400";
    if (grade.startsWith("C")) return "text-amber-400";
    if (grade.startsWith("D")) return "text-orange-400";
    return "text-red-400";
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-[1600px] px-4 py-6">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight font-display">
                Creative Intelligence Copilot
              </h1>
              <p className="text-sm text-muted-foreground">
                Upload a creative for full neuroscience + ML analysis
              </p>
            </div>
          </div>
          {analyses.length > 0 && (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handlePrintReport} className="gap-1.5 print:hidden">
                <FileDown className="h-3.5 w-3.5" /> Export PDF
              </Button>
              <Button variant="ghost" size="sm" onClick={handleReset} className="gap-1.5 text-muted-foreground print:hidden">
                <RotateCcw className="h-3.5 w-3.5" /> Reset
              </Button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_420px]">
          <div className="space-y-4">
            <AnimatePresence mode="wait">
              {!activeAnalysis && !isAnalyzing ? (
                <motion.div key="dropzone" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                  <Card
                    className={`relative flex min-h-[400px] cursor-pointer flex-col items-center justify-center border-2 border-dashed p-8 transition-colors ${
                      isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/20 hover:border-primary/50"
                    }`}
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    onClick={() => document.getElementById("copilot-file-input")?.click()}
                  >
                    <input id="copilot-file-input" type="file" accept="image/*,video/*" className="hidden" onChange={handleInputChange} />
                    <motion.div animate={{ y: isDragging ? -5 : 0 }} className="flex flex-col items-center gap-4">
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                        <Upload className="h-8 w-8 text-primary" />
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-semibold">Drop your creative here</p>
                        <p className="text-sm text-muted-foreground">PNG, JPG, MP4 or MOV — we'll handle the rest</p>
                      </div>
                      <div className="flex gap-3">
                        <Badge variant="secondary" className="gap-1"><ImageIcon className="h-3 w-3" /> Images</Badge>
                        <Badge variant="secondary" className="gap-1"><Video className="h-3 w-3" /> Videos</Badge>
                      </div>
                    </motion.div>
                  </Card>
                </motion.div>
              ) : isAnalyzing ? (
                <motion.div key="analyzing" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                  className="flex min-h-[400px] flex-col items-center justify-center">
                  <div className="w-full max-w-lg space-y-3">
                    <div className="flex items-center justify-center gap-3 mb-4">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      <span className="text-sm font-medium text-primary">Running analysis pipeline...</span>
                    </div>
                    {progressSteps.map((step, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs ${
                          step.done ? "border-emerald-500/20 bg-emerald-500/5" : "border-primary/20 bg-primary/5"
                        }`}
                      >
                        {step.done ? (
                          <span className="text-emerald-400 font-bold">✓</span>
                        ) : (
                          <Loader2 className="h-3 w-3 animate-spin text-primary" />
                        )}
                        <span className={step.done ? "text-emerald-300" : "text-foreground"}>
                          {step.msg}
                        </span>
                      </motion.div>
                    ))}
                    {progressSteps.length === 0 && (
                      <p className="text-center text-xs text-muted-foreground animate-pulse">Connecting to analysis engine...</p>
                    )}
                  </div>
                </motion.div>
              ) : activeAnalysis ? (
                <motion.div key="report" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileImage className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{activeAnalysis.filename}</span>
                      <Badge variant="outline" className={gradeColor(activeAnalysis.executive_summary.grade)}>
                        {activeAnalysis.executive_summary.grade}
                      </Badge>
                      <Badge variant={activeAnalysis.is_mock_data ? "destructive" : "secondary"}>
                        {activeAnalysis.brain_score_source}
                        {activeAnalysis.is_mock_data && " (est.)"}
                      </Badge>
                      {activeAnalysis.total_processing_time && (
                        <Badge variant="outline" className="gap-1">
                          <Clock className="h-3 w-3" />
                          {activeAnalysis.total_processing_time}s
                        </Badge>
                      )}
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setActiveId(null)}>
                      <X className="mr-1 h-3 w-3" /> Close
                    </Button>
                  </div>
                  {activeAnalysis.is_mock_data && (
                    <div className="mb-3 flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-2.5 text-xs text-amber-400">
                      <AlertTriangle className="h-4 w-4 shrink-0" />
                      <span>
                        <strong>TRIBE V2 endpoint is offline.</strong> Brain scores are estimated using the LightGBM model.
                        Connect the Kaggle TRIBE notebook for real neural inference scores.
                      </span>
                    </div>
                  )}
                  <CopilotReport analysis={activeAnalysis} />
                </motion.div>
              ) : null}
            </AnimatePresence>

            {analyses.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {analyses.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => setActiveId(a.id)}
                    className={`shrink-0 rounded-lg border px-3 py-2 text-left text-xs transition-colors ${
                      a.id === activeId ? "border-primary bg-primary/10" : "border-muted hover:border-muted-foreground/30"
                    }`}
                  >
                    <span className="font-medium">{a.filename.slice(0, 20)}</span>
                    <span className={`ml-2 font-bold ${gradeColor(a.executive_summary.grade)}`}>
                      {a.executive_summary.grade}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {error && (
              <Card className="border-red-500/30 bg-red-500/5 p-4 text-sm text-red-400">{error}</Card>
            )}
          </div>

          <div className="lg:sticky lg:top-20 lg:h-[calc(100vh-6rem)] print:hidden">
            <CopilotChat analyses={analyses} activeAnalysis={activeAnalysis} onUploadMore={handleFile} />
          </div>
        </div>
      </div>
    </div>
  );
}
