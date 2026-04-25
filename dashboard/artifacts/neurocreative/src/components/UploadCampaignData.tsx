import { useCallback, useRef, useState } from "react";
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
} from "lucide-react";
import { analyzeCreatives } from "@/lib/apiClient";
import type { DashboardResponse } from "@/types/dashboard";

interface UploadCampaignDataProps {
  onAnalysisComplete: (data: DashboardResponse) => void;
  onAnalysisError: (error: string) => void;
  isUploading: boolean;
  setIsUploading: (v: boolean) => void;
}

const ACCEPTED_ASSETS = ".png,.jpg,.jpeg,.webp,.gif,.mp4,.mov,.webm";
const IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);

export function UploadCampaignData({
  onAnalysisComplete,
  onAnalysisError,
  isUploading,
  setIsUploading,
}: UploadCampaignDataProps) {
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [creativeFiles, setCreativeFiles] = useState<File[]>([]);
  const [csvError, setCsvError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const csvInputRef = useRef<HTMLInputElement>(null);
  const assetsInputRef = useRef<HTMLInputElement>(null);

  // ── CSV handling ──────────────────────────────────────────────────────

  const handleCsvSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (!file.name.toLowerCase().endsWith(".csv")) {
        setCsvError("Only .csv files are accepted.");
        setCsvFile(null);
        return;
      }
      setCsvError(null);
      setCsvFile(file);
      setUploadSuccess(false);
    },
    []
  );

  const removeCsv = () => {
    setCsvFile(null);
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

  // ── Submit ────────────────────────────────────────────────────────────

  const handleAnalyze = async () => {
    if (!csvFile || isUploading) return;
    setIsUploading(true);
    setUploadSuccess(false);

    try {
      const formData = new FormData();
      formData.append("csvFile", csvFile);
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

  // ── CSV drag and drop ─────────────────────────────────────────────────

  const [csvDragOver, setCsvDragOver] = useState(false);
  const [assetsDragOver, setAssetsDragOver] = useState(false);

  const handleCsvDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setCsvDragOver(false);
    const file = e.dataTransfer.files[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".csv")) {
      setCsvError("Only .csv files are accepted.");
      return;
    }
    setCsvError(null);
    setCsvFile(file);
    setUploadSuccess(false);
  }, []);

  const handleAssetsDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setAssetsDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    setCreativeFiles((prev) => [...prev, ...files]);
    setUploadSuccess(false);
  }, []);

  // ── Render ────────────────────────────────────────────────────────────

  return (
    <Card
      className="border-border/50 bg-card/40 p-5"
      data-testid="upload-campaign-data"
    >
      <div className="flex items-center gap-2.5 mb-1">
        <Upload className="h-4 w-4 text-muted-foreground" />
        <h2 className="text-sm font-semibold">
          Upload{" "}
          <span className="font-display italic font-normal">campaign data</span>
        </h2>
      </div>
      <p className="text-[11px] text-muted-foreground mb-5 max-w-lg">
        Upload CSV performance data and matching ad creatives to generate
        AI-powered creative intelligence.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* ── CSV Upload ─────────────────────────────────────────────── */}
        <div
          className={`relative rounded-xl border-2 border-dashed transition-colors p-5 ${
            csvDragOver
              ? "border-primary/60 bg-primary/5"
              : csvFile
              ? "border-emerald-500/40 bg-emerald-500/5"
              : csvError
              ? "border-rose-500/40 bg-rose-500/5"
              : "border-border/60 bg-background/40 hover:border-border"
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            setCsvDragOver(true);
          }}
          onDragLeave={() => setCsvDragOver(false)}
          onDrop={handleCsvDrop}
        >
          <div className="text-center">
            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <FileSpreadsheet className="h-4.5 w-4.5" />
            </div>
            <div className="text-xs font-semibold mb-1">
              Upload performance CSV
            </div>
            <p className="text-[10px] text-muted-foreground leading-relaxed mb-3 max-w-xs mx-auto">
              Include creative_id, impressions, clicks, spend, revenue, CTR,
              CVR, ROAS, and asset_path if available.
            </p>

            {csvFile ? (
              <div className="inline-flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                <span className="font-mono-tight text-foreground truncate max-w-[200px]">
                  {csvFile.name}
                </span>
                <button
                  type="button"
                  onClick={removeCsv}
                  className="text-muted-foreground hover:text-foreground transition"
                  aria-label="Remove CSV"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs gap-1.5 rounded-full px-4"
                onClick={() => csvInputRef.current?.click()}
              >
                <Upload className="h-3 w-3" />
                Choose .csv file
              </Button>
            )}

            <input
              ref={csvInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleCsvSelect}
            />

            {csvError && (
              <div className="mt-2 flex items-center gap-1.5 text-[11px] text-rose-500 justify-center">
                <AlertCircle className="h-3 w-3" />
                {csvError}
              </div>
            )}
          </div>
        </div>

        {/* ── Creative Assets Upload ─────────────────────────────────── */}
        <div
          className={`relative rounded-xl border-2 border-dashed transition-colors p-5 ${
            assetsDragOver
              ? "border-primary/60 bg-primary/5"
              : creativeFiles.length > 0
              ? "border-border/60 bg-background/30"
              : "border-border/60 bg-background/40 hover:border-border"
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            setAssetsDragOver(true);
          }}
          onDragLeave={() => setAssetsDragOver(false)}
          onDrop={handleAssetsDrop}
        >
          <div className="text-center">
            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent dark:text-[hsl(var(--accent))]">
              <ImageIcon className="h-4.5 w-4.5" />
            </div>
            <div className="text-xs font-semibold mb-1">
              Upload ad creatives
              <Badge
                variant="outline"
                className="ml-1.5 text-[9px] px-1.5 py-0 font-normal text-muted-foreground"
              >
                Optional
              </Badge>
            </div>
            <p className="text-[10px] text-muted-foreground leading-relaxed mb-3">
              .png .jpg .webp .gif .mp4 .mov .webm
            </p>

            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs gap-1.5 rounded-full px-4"
              onClick={() => assetsInputRef.current?.click()}
            >
              <ImageIcon className="h-3 w-3" />
              Choose files
            </Button>

            <input
              ref={assetsInputRef}
              type="file"
              accept={ACCEPTED_ASSETS}
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
          {creativeFiles.length > 0 && (
            <span className="text-[11px] text-muted-foreground">
              <span className="font-mono-tight font-semibold text-foreground">
                {creativeFiles.length}
              </span>{" "}
              asset{creativeFiles.length === 1 ? "" : "s"} selected
            </span>
          )}
          {uploadSuccess && (
            <span className="inline-flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-3 w-3" />
              Analysis complete
            </span>
          )}
        </div>

        <Button
          onClick={handleAnalyze}
          disabled={!csvFile || isUploading}
          className="h-9 gap-2 rounded-full px-5 text-xs font-semibold"
          data-testid="analyze-button"
        >
          {isUploading ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Analyzing with OpenAI…
            </>
          ) : (
            <>
              <Sparkles className="h-3.5 w-3.5" />
              Analyze with OpenAI
            </>
          )}
        </Button>
      </div>
    </Card>
  );
}
