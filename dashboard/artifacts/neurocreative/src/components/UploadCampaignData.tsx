import { useCallback, useRef, useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Upload,
  FileSpreadsheet,
  ImageIcon,
  X,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Info,
  Brain,
  Zap,
  Activity,
  Eye,
} from "lucide-react";
import { analyzeCreatives } from "@/lib/apiClient";
import type { DashboardResponse } from "@/types/dashboard";

interface UploadCampaignDataProps {
  onAnalysisComplete: (data: DashboardResponse) => void;
  onAnalysisError: (error: string) => void;
  isUploading: boolean;
  setIsUploading: (v: boolean) => void;
}

const IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);

const SMADEX_TABLE_HINTS = [
  { name: "creative_summary.csv", desc: "KPIs per creative (required)" },
  { name: "creatives.csv", desc: "Visual features per creative" },
  { name: "creative_daily_country_os_stats.csv", desc: "Daily time-series" },
];

const PROGRESS_ICONS = [Brain, Activity, Eye, Zap, Sparkles];

export function UploadCampaignData({
  onAnalysisComplete,
  onAnalysisError,
  isUploading,
  setIsUploading,
}: UploadCampaignDataProps) {
  const [csvFiles, setCsvFiles] = useState<File[]>([]);
  const [creativeFiles, setCreativeFiles] = useState<File[]>([]);
  const [csvError, setCsvError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [showHints, setShowHints] = useState(false);
  const [progressMessage, setProgressMessage] = useState<string | null>(null);
  const [isCached, setIsCached] = useState(false);
  const csvInputRef = useRef<HTMLInputElement>(null);
  const assetsInputRef = useRef<HTMLInputElement>(null);

  // ── CSV handling (multi-file) ────────────────────────────────────────

  const handleCsvSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      if (!files.length) return;

      const csvOnly = files.filter((f) =>
        f.name.toLowerCase().endsWith(".csv")
      );
      if (csvOnly.length === 0) {
        setCsvError("Only .csv files are accepted.");
        return;
      }
      if (csvOnly.length < files.length) {
        setCsvError(
          `Skipped ${files.length - csvOnly.length} non-CSV file(s).`
        );
      } else {
        setCsvError(null);
      }
      setCsvFiles((prev) => {
        const existing = new Set(prev.map((f) => f.name));
        const newFiles = csvOnly.filter((f) => !existing.has(f.name));
        return [...prev, ...newFiles];
      });
      setUploadSuccess(false);
    },
    []
  );

  const removeCsv = (index: number) => {
    setCsvFiles((prev) => prev.filter((_, i) => i !== index));
    setCsvError(null);
    setUploadSuccess(false);
    if (csvInputRef.current) csvInputRef.current.value = "";
  };

  const clearAllCsvs = () => {
    setCsvFiles([]);
    setCsvError(null);
    setUploadSuccess(false);
    if (csvInputRef.current) csvInputRef.current.value = "";
  };

  // ── Asset handling ────────────────────────────────────────────────────

  const handleAssetsSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      setCreativeFiles((prev) => [...prev, ...files]);
      setUploadSuccess(false);
    },
    []
  );

  const removeAsset = (index: number) => {
    setCreativeFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // ── SSE progress for image analysis ──────────────────────────────────

  const analyzeImageWithProgress = useCallback(
    async (file: File) => {
      setIsUploading(true);
      setProgressMessage("Uploading creative to neural analysis engine...");
      setIsCached(false);

      try {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/analyze-creative-image", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({ error: "Unknown error" }));
          throw new Error(body.error || `Server returned ${res.status}`);
        }

        const reader = res.body?.getReader();
        if (!reader) throw new Error("No response stream");

        const decoder = new TextDecoder();
        let buffer = "";
        let finalResult: DashboardResponse | null = null;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.startsWith("event: progress")) continue;
            if (line.startsWith("data: ") && !line.includes("suggested_action")) {
              try {
                const parsed = JSON.parse(line.slice(6));
                if (parsed.message) {
                  setProgressMessage(parsed.message);
                  setIsCached(parsed.cached || false);
                }
              } catch {}
            }
            if (line.startsWith("event: done")) continue;
            if (line.startsWith("data: ") && line.includes("creatives")) {
              try {
                finalResult = JSON.parse(line.slice(6));
              } catch {}
            }
          }
        }

        if (finalResult) {
          setUploadSuccess(true);
          setProgressMessage(null);
          onAnalysisComplete(finalResult);
        } else {
          throw new Error("No final response received");
        }
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Analysis failed unexpectedly.";
        setProgressMessage(null);
        onAnalysisError(message);
      } finally {
        setIsUploading(false);
      }
    },
    [onAnalysisComplete, onAnalysisError, setIsUploading]
  );

  // ── CSV analysis ─────────────────────────────────────────────────────

  const handleAnalyze = async () => {
    if (csvFiles.length === 0 && creativeFiles.length === 0) return;

    // If user uploaded images but no CSVs, analyze first image with TRIBE
    if (csvFiles.length === 0 && creativeFiles.length > 0) {
      await analyzeImageWithProgress(creativeFiles[0]);
      return;
    }

    setIsUploading(true);
    setUploadSuccess(false);
    setProgressMessage(null);

    try {
      const formData = new FormData();
      for (const file of csvFiles) {
        formData.append("files", file);
      }
      for (const file of creativeFiles) {
        formData.append("creativeAssets", file);
      }

      const result = await analyzeCreatives(formData);
      setUploadSuccess(true);
      onAnalysisComplete(result);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Analysis failed unexpectedly.";
      onAnalysisError(message);
    } finally {
      setIsUploading(false);
    }
  };

  // ── Drag and drop ────────────────────────────────────────────────────

  const [csvDragOver, setCsvDragOver] = useState(false);
  const [assetsDragOver, setAssetsDragOver] = useState(false);

  const handleCsvDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setCsvDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    const csvOnly = files.filter((f) => f.name.toLowerCase().endsWith(".csv"));
    if (csvOnly.length === 0) {
      setCsvError("Only .csv files are accepted.");
      return;
    }
    setCsvError(null);
    setCsvFiles((prev) => {
      const existing = new Set(prev.map((f) => f.name));
      return [...prev, ...csvOnly.filter((f) => !existing.has(f.name))];
    });
    setUploadSuccess(false);
  }, []);

  const handleAssetsDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setAssetsDragOver(false);
    setCreativeFiles((prev) => [...prev, ...Array.from(e.dataTransfer.files)]);
    setUploadSuccess(false);
  }, []);

  const hasContent = csvFiles.length > 0 || creativeFiles.length > 0;

  // ── Animated progress icon ───────────────────────────────────────────
  const [iconIdx, setIconIdx] = useState(0);
  useEffect(() => {
    if (!progressMessage) return;
    const t = setInterval(() => setIconIdx((i) => (i + 1) % PROGRESS_ICONS.length), 600);
    return () => clearInterval(t);
  }, [progressMessage]);

  const ProgressIcon = PROGRESS_ICONS[iconIdx];

  return (
    <Card
      className="border-border/50 bg-card/40 p-5"
      data-testid="upload-campaign-data"
    >
      {/* ── Progress Banner ──────────────────────────────────────────── */}
      {progressMessage && (
        <div className={`mb-4 rounded-xl border-2 p-4 flex items-center gap-3 ${
          isCached
            ? "border-blue-500/40 bg-blue-500/5"
            : "border-primary/40 bg-primary/5"
        }`}>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
            <ProgressIcon className="h-4 w-4 animate-pulse" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold mb-0.5">
              {isCached ? "Loading cached analysis" : "Neural analysis in progress"}
            </div>
            <div className="text-[11px] text-muted-foreground truncate">
              {progressMessage}
            </div>
          </div>
          <div className="flex gap-0.5 shrink-0">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse"
                style={{ animationDelay: `${i * 0.2}s` }}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2.5 mb-1">
        <Upload className="h-4 w-4 text-muted-foreground" />
        <h2 className="text-sm font-semibold">
          Upload{" "}
          <span className="font-display italic font-normal">campaign data</span>
        </h2>
      </div>
      <p className="text-[11px] text-muted-foreground mb-5 max-w-lg">
        Upload Smadex CSV files for pipeline analysis, or drag a creative image
        for instant neural brain analysis.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* ── CSV Upload ─────────────────────────────────────────────── */}
        <div
          className={`relative rounded-xl border-2 border-dashed transition-colors p-5 ${
            csvDragOver
              ? "border-primary/60 bg-primary/5"
              : csvFiles.length > 0
              ? "border-emerald-500/40 bg-emerald-500/5"
              : csvError
              ? "border-rose-500/40 bg-rose-500/5"
              : "border-border/60 bg-background/40 hover:border-border"
          }`}
          onDragOver={(e) => { e.preventDefault(); setCsvDragOver(true); }}
          onDragLeave={() => setCsvDragOver(false)}
          onDrop={handleCsvDrop}
        >
          <div className="text-center">
            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <FileSpreadsheet className="h-4.5 w-4.5" />
            </div>
            <div className="text-xs font-semibold mb-1">Upload CSV files</div>
            <p className="text-[10px] text-muted-foreground leading-relaxed mb-2 max-w-xs mx-auto">
              Drag & drop or select multiple Smadex CSVs for live pipeline analysis.
            </p>

            <button
              onClick={() => setShowHints(!showHints)}
              className="inline-flex items-center gap-1 text-[10px] text-primary/70 hover:text-primary mb-3 transition"
            >
              <Info className="h-3 w-3" />
              {showHints ? "Hide" : "Show"} supported files
            </button>

            {showHints && (
              <div className="text-left text-[9px] text-muted-foreground bg-muted/30 rounded-lg p-2 mb-3 max-w-xs mx-auto space-y-1">
                {SMADEX_TABLE_HINTS.map((h) => (
                  <div key={h.name} className="flex gap-1">
                    <span className="font-mono text-foreground/70">{h.name}</span>
                    <span>— {h.desc}</span>
                  </div>
                ))}
              </div>
            )}

            {csvFiles.length > 0 && (
              <div className="space-y-1 mb-3 max-h-32 overflow-y-auto">
                {csvFiles.map((file, i) => (
                  <div
                    key={`${file.name}-${i}`}
                    className="inline-flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs w-full"
                  >
                    <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" />
                    <span className="font-mono-tight text-foreground truncate flex-1">
                      {file.name}
                    </span>
                    <span className="text-[9px] text-muted-foreground shrink-0">
                      {(file.size / 1024).toFixed(0)}KB
                    </span>
                    <button
                      type="button"
                      onClick={() => removeCsv(i)}
                      className="text-muted-foreground hover:text-foreground transition shrink-0"
                      aria-label={`Remove ${file.name}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center gap-2 justify-center">
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs gap-1.5 rounded-full px-4"
                onClick={() => csvInputRef.current?.click()}
              >
                <Upload className="h-3 w-3" />
                {csvFiles.length > 0 ? "Add more" : "Choose .csv files"}
              </Button>
              {csvFiles.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs rounded-full px-3 text-muted-foreground"
                  onClick={clearAllCsvs}
                >
                  Clear all
                </Button>
              )}
            </div>

            <input
              ref={csvInputRef}
              type="file"
              accept=".csv"
              multiple
              className="hidden"
              onChange={handleCsvSelect}
            />

            {csvError && (
              <div className="mt-2 flex items-center gap-1.5 text-[11px] text-rose-500 justify-center">
                <AlertCircle className="h-3 w-3" />
                {csvError}
              </div>
            )}

            {csvFiles.length > 0 && (
              <div className="mt-2 text-[10px] text-muted-foreground">
                <Badge variant="outline" className="text-[9px] px-1.5 py-0 font-normal">
                  {csvFiles.length} file{csvFiles.length !== 1 ? "s" : ""}
                </Badge>
              </div>
            )}
          </div>
        </div>

        {/* ── Creative Assets / Image Upload ─────────────────────────── */}
        <div
          className={`relative rounded-xl border-2 border-dashed transition-colors p-5 ${
            assetsDragOver
              ? "border-primary/60 bg-primary/5"
              : creativeFiles.length > 0
              ? "border-emerald-500/40 bg-emerald-500/5"
              : "border-border/60 bg-background/40 hover:border-border"
          }`}
          onDragOver={(e) => { e.preventDefault(); setAssetsDragOver(true); }}
          onDragLeave={() => setAssetsDragOver(false)}
          onDrop={handleAssetsDrop}
        >
          <div className="text-center">
            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent dark:text-[hsl(var(--accent))]">
              <Brain className="h-4.5 w-4.5" />
            </div>
            <div className="text-xs font-semibold mb-1">
              Upload ad creative for brain analysis
              <Badge
                variant="outline"
                className="ml-1.5 text-[9px] px-1.5 py-0 font-normal text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
              >
                Live
              </Badge>
            </div>
            <p className="text-[10px] text-muted-foreground leading-relaxed mb-3">
              Drop an image or video. The TRIBE v2 brain model will analyze
              attention, reward, memory, emotion, and visual load in real time.
            </p>

            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs gap-1.5 rounded-full px-4"
              onClick={() => assetsInputRef.current?.click()}
            >
              <ImageIcon className="h-3 w-3" />
              {creativeFiles.length > 0 ? "Add more" : "Choose files"}
            </Button>

            <input
              ref={assetsInputRef}
              type="file"
              accept=".png,.jpg,.jpeg,.webp,.gif,.mp4,.mov,.webm"
              multiple
              className="hidden"
              onChange={handleAssetsSelect}
            />
          </div>

          {creativeFiles.length > 0 && (
            <div className="mt-4 grid grid-cols-4 sm:grid-cols-5 gap-2">
              {creativeFiles.map((file, i) => (
                <div
                  key={`${file.name}-${i}`}
                  className="relative group rounded-lg border border-border/40 overflow-hidden bg-muted/30 aspect-square"
                >
                  {IMAGE_TYPES.has(file.type) ? (
                    <img
                      src={URL.createObjectURL(file)}
                      alt={file.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex flex-col items-center justify-center p-1">
                      <ImageIcon className="h-4 w-4 text-muted-foreground mb-1" />
                      <span className="text-[8px] text-muted-foreground truncate w-full text-center">
                        {file.name}
                      </span>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => removeAsset(i)}
                    className="absolute top-0.5 right-0.5 h-4 w-4 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label={`Remove ${file.name}`}
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Analyze button ──────────────────────────────────────────── */}
      <div className="mt-5 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          {creativeFiles.length > 0 && csvFiles.length === 0 && (
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400">
              <Brain className="inline h-3 w-3 mr-1" />
              {creativeFiles.length} creative{creativeFiles.length !== 1 ? "s" : ""} queued for brain analysis
            </span>
          )}
          {creativeFiles.length > 0 && csvFiles.length > 0 && (
            <span className="text-[11px] text-muted-foreground">
              <span className="font-mono-tight font-semibold text-foreground">
                {creativeFiles.length}
              </span>{" "}
              asset{creativeFiles.length === 1 ? "" : "s"} +{" "}
              <span className="font-mono-tight font-semibold text-foreground">
                {csvFiles.length}
              </span>{" "}
              CSV{csvFiles.length === 1 ? "" : "s"}
            </span>
          )}
          {uploadSuccess && !progressMessage && (
            <span className="inline-flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-3 w-3" />
              Analysis complete
            </span>
          )}
        </div>

        <Button
          onClick={handleAnalyze}
          disabled={(!csvFiles.length && !creativeFiles.length) || isUploading}
          className="h-9 gap-2 rounded-full px-5 text-xs font-semibold"
          data-testid="analyze-button"
        >
          {isUploading ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              {progressMessage ? "Analyzing..." : "Running pipeline..."}
            </>
          ) : (
            <>
              {creativeFiles.length > 0 && csvFiles.length === 0 ? (
                <>
                  <Brain className="h-3.5 w-3.5" />
                  Analyze with brain model
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" />
                  Analyze creatives
                </>
              )}
            </>
          )}
        </Button>
      </div>
    </Card>
  );
}
