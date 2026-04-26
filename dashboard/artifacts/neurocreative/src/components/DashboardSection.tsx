import { useEffect, useMemo, useState, useCallback } from "react";
import { FiltersBar } from "@/components/FiltersBar";
import { KPICards } from "@/components/KPICards";
import { UploadCampaignData } from "@/components/UploadCampaignData";
import { CreativeActionCenter } from "@/components/CreativeActionCenter";
import { SelectedCreativeDetail } from "@/components/SelectedCreativeDetail";
import { PerformanceChart } from "@/components/PerformanceChart";
import { BrainIntelligencePanel } from "@/components/BrainIntelligencePanel";
import { BrainActivityMRI } from "@/components/BrainActivityMRI";
import { Search, RotateCcw, Sparkles, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  CREATIVES,
  DEFAULT_FILTERS,
  FILTER_OPTIONS,
  type Creative,
  type DashboardFilters,
} from "@/data/smadexData";
import type { DashboardResponse, AnalyzedCreative, DashboardSummary } from "@/types/dashboard";

function toCreative(ac: AnalyzedCreative, index: number): Creative {
  const generatedTimeSeries = [];
  const days = 30;
  const baseCtr = ac.ctr || 0.01;
  const baseCvr = ac.cvr || 0.05;
  const baseImps = (ac.impressions || 100000) / days;

  const today = new Date();
  for (let i = 0; i < days; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - (days - 1 - i));

    let trendMultiplier = 1;
    if (ac.status === "Fatigued") {
      trendMultiplier = 1 - (i / days) * 0.6;
    } else if (ac.status === "Top Performer") {
      trendMultiplier = 1 + (i / days) * 0.2;
    } else if (ac.status === "Underperformer") {
      trendMultiplier = 0.5;
    }

    const noise = 0.8 + Math.random() * 0.4;

    const dayCtr = baseCtr * trendMultiplier * noise;
    const dayCvr = baseCvr * trendMultiplier * noise;
    const dayImps = baseImps * noise;
    const dayClicks = dayImps * dayCtr;

    generatedTimeSeries.push({
      date: d.toISOString().split('T')[0],
      day: i,
      impressions: Math.round(dayImps),
      clicks: Math.round(dayClicks),
      conversions: Math.round(dayClicks * dayCvr),
      spend: Math.round((ac.spend || 1000) / days * noise),
      revenue: Math.round((ac.roas || 1.5) * ((ac.spend || 1000) / days * noise)),
      ctr: dayCtr * 100,
      cvr: dayCvr * 100,
    });
  }

  return {
    id: ac.creative_id,
    rawId: index,
    campaignId: typeof ac.campaign_id === "number" ? ac.campaign_id : 0,
    advertiserName: ac.advertiser_id ? String(ac.advertiser_id) : "Uploaded",
    appName: ac.asset_filename || ac.creative_id,
    vertical: "uploaded",
    verticalDisplay: "Uploaded",
    format: ac.asset_type || "unknown",
    formatDisplay: ac.asset_type ? ac.asset_type.charAt(0).toUpperCase() + ac.asset_type.slice(1) : "Unknown",
    campaignCountries: [],
    campaignOs: "Both",
    supportedOs: ["Android", "iOS"],
    status: ac.status,
    rawStatus: ac.status.toLowerCase().replace(/ /g, "_") as Creative["rawStatus"],
    action: ac.recommended_action,
    ctr: ac.ctr,
    cvr: ac.cvr,
    roas: ac.roas,
    ipm: 0,
    spend: ac.spend,
    impressions: ac.impressions,
    clicks: 0,
    conversions: 0,
    revenue: 0,
    daysActive: 0,
    launchDate: "",
    fatigueDay: ac.fatigue_risk > 70 ? Math.round(ac.fatigue_risk / 10) : null,
    fatigueRisk: ac.fatigue_risk,
    healthScore: ac.creative_health_score,
    metadata: {
      ctaText: "",
      headline: ac.explanation.slice(0, 60),
      subhead: "",
      dominantColor: "",
      dominantColorHex: "#7C3AED",
      tone: "",
      textDensity: ac.cognitive_summary.cognitive_load === "High" ? "High" : ac.cognitive_summary.cognitive_load === "Medium" ? "Medium" : "Low",
      hookType: "",
      theme: "",
      language: "en",
      durationSec: 0,
      hasGameplay: false,
      hasUgcStyle: false,
      hasPrice: false,
      hasDiscountBadge: false,
      facesCount: 0,
      productCount: 0,
      brandVisibility: ac.brain_scores.memory,
      novelty: ac.brain_scores.attention,
      motion: 0,
      readability: 100 - ac.brain_scores.visualLoad,
      clutter: ac.brain_scores.visualLoad,
    },
    brainScores: {
      attention: ac.brain_scores.attention,
      recall: ac.brain_scores.memory,
      cognitiveLoad: ac.brain_scores.visualLoad,
      engagement: ac.brain_scores.reward,
      noveltyResponse: ac.brain_scores.emotion,
      messageClarity: 100 - ac.brain_scores.visualLoad,
    },
    timeSeries: generatedTimeSeries,
    recommendation: {
      headline: ac.explanation,
      reasons: ac.key_reasons.map((r, i) => ({
        label: `Reason ${i + 1}`,
        text: r,
      })),
      nextBestTest: ac.next_best_test,
    },
    assetUrl: `/creatives/${ac.asset_filename || "placeholder.png"}`,
  };
}

export function DashboardSection({ onAskCopilot }: { onAskCopilot: () => void }) {
  const [filters, setFilters] = useState<DashboardFilters>(DEFAULT_FILTERS);
  const [selectedId, setSelectedId] = useState<string>(CREATIVES[0]?.id ?? "");

  const [uploadedAnalysis, setUploadedAnalysis] = useState<DashboardResponse | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const isUsingUploadedAnalysis = uploadedAnalysis !== null;

  const uploadedCreatives = useMemo(() => {
    if (!uploadedAnalysis) return [];
    return uploadedAnalysis.creatives.map(toCreative);
  }, [uploadedAnalysis]);

  const activeCreatives = isUsingUploadedAnalysis ? uploadedCreatives : CREATIVES;

  const filteredCreatives = useMemo(() => {
    if (isUsingUploadedAnalysis) return uploadedCreatives;
    return CREATIVES.filter((c) => {
      if (filters.vertical !== "all" && c.vertical !== filters.vertical) return false;
      if (filters.format !== "all" && c.format !== filters.format) return false;
      if (filters.status !== "all" && c.rawStatus !== filters.status) return false;
      if (filters.advertiser !== "all" && c.advertiserName !== filters.advertiser) return false;
      if (filters.campaign !== "all" && String(c.campaignId) !== filters.campaign) return false;
      if (filters.country !== "all" && !c.campaignCountries.includes(filters.country)) return false;
      if (filters.os !== "all" && !c.supportedOs.includes(filters.os)) return false;
      return true;
    });
  }, [filters, isUsingUploadedAnalysis, uploadedCreatives]);

  const dateRangeDays = useMemo(() => {
    const opt = FILTER_OPTIONS.dateRangeOptions.find((d) => d.value === filters.dateRange);
    return opt?.days ?? 90;
  }, [filters.dateRange]);

  const trimToDateRange = (creative: Creative): Creative => {
    if (filters.dateRange === "all") return creative;
    if (creative.timeSeries.length <= dateRangeDays) return creative;
    return {
      ...creative,
      timeSeries: creative.timeSeries.slice(-dateRangeDays),
    };
  };

  const hasResults = filteredCreatives.length > 0;

  useEffect(() => {
    if (!hasResults) return;
    if (!filteredCreatives.find((c) => c.id === selectedId)) {
      setSelectedId(filteredCreatives[0].id);
    }
  }, [filteredCreatives, selectedId, hasResults]);

  const baseSelected = hasResults
    ? filteredCreatives.find((c) => c.id === selectedId) ?? filteredCreatives[0]
    : null;
  const selectedCreative = baseSelected ? trimToDateRange(baseSelected) : null;

  const handleAnalysisComplete = useCallback((data: DashboardResponse) => {
    setUploadedAnalysis(data);
    setUploadError(null);
    if (data.creatives.length > 0) {
      setSelectedId(data.creatives[0].creative_id);
    }
  }, []);

  const handleAnalysisError = useCallback((error: string) => {
    setUploadError(error);
  }, []);

  const handleResetToDemo = useCallback(() => {
    setUploadedAnalysis(null);
    setUploadError(null);
    setSelectedId(CREATIVES[0]?.id ?? "");
    setFilters(DEFAULT_FILTERS);
  }, []);

  return (
    <>
      <section className="max-w-2xl">
        <h2 className="font-display text-3xl sm:text-[34px] leading-[1.1] tracking-tight">
          The next ad to{" "}
          <span className="italic text-primary">scale</span>,{" "}
          <span className="italic text-primary">pivot</span> or{" "}
          <span className="italic text-primary">pause</span>
          <span className="text-muted-foreground/80"> — already chosen for you.</span>
        </h2>
        <p className="mt-3 text-sm text-muted-foreground max-w-xl leading-relaxed">
          A brain-inspired copilot that reads creative fatigue, ranks every active asset by urgency, and tells you exactly what to do next.
        </p>
      </section>

      <UploadCampaignData
        onAnalysisComplete={handleAnalysisComplete}
        onAnalysisError={handleAnalysisError}
        isUploading={isUploading}
        setIsUploading={setIsUploading}
      />

      {uploadError && (
        <div className="flex items-center gap-2.5 rounded-xl border border-rose-500/30 bg-rose-500/5 p-4">
          <AlertCircle className="h-4 w-4 text-rose-500 flex-shrink-0" />
          <div className="min-w-0">
            <div className="text-xs font-semibold text-rose-600 dark:text-rose-400">
              Analysis failed
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {uploadError}. Showing fallback demo data.
            </p>
          </div>
        </div>
      )}

      {isUsingUploadedAnalysis ? (
        <div className="flex items-center justify-between flex-wrap gap-3 rounded-xl border border-primary/30 bg-primary/5 p-4">
          <div className="flex items-center gap-2.5">
            <Sparkles className="h-4 w-4 text-primary" />
            <div>
              <div className="text-xs font-semibold">
                Using{" "}
                <span className="text-primary">uploaded analysis</span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Showing {uploadedAnalysis!.creatives.length} creatives analyzed by pipeline
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleResetToDemo}
            className="h-8 text-xs gap-1.5 rounded-full px-4"
          >
            <RotateCcw className="h-3 w-3" />
            Reset to demo data
          </Button>
        </div>
      ) : (
        <FiltersBar
          filters={filters}
          onChange={setFilters}
          matchedCount={filteredCreatives.length}
          totalCount={CREATIVES.length}
        />
      )}

      <KPICards
        dashboardSummary={
          isUsingUploadedAnalysis ? uploadedAnalysis!.dashboard_summary : undefined
        }
      />

      {selectedCreative ? (
        <>
          <CreativeActionCenter
            creatives={filteredCreatives}
            selectedId={selectedCreative.id}
            onSelect={setSelectedId}
          />

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
            <div className="lg:col-span-3">
              <PerformanceChart
                creative={selectedCreative}
                kpiFocus={filters.kpiFocus}
              />
            </div>
            <div className="lg:col-span-2">
              <BrainIntelligencePanel creative={selectedCreative} />
            </div>
          </div>

          <BrainActivityMRI creative={selectedCreative} />

          <SelectedCreativeDetail creative={selectedCreative} />
        </>
      ) : (
        <div
          data-testid="empty-state"
          className="rounded-2xl border border-dashed border-border/60 bg-card/30 p-14 text-center"
        >
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Search className="h-5 w-5" />
          </div>
          <h3 className="font-display text-2xl tracking-tight mb-2">
            Nothing to <span className="italic text-primary">decide on</span> yet
          </h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
            No creatives match this slice. Reset the filters or broaden your selection — there are{" "}
            <span className="font-mono-tight font-semibold text-foreground">{activeCreatives.length}</span>{" "}
            curated assets waiting in the queue.
          </p>
          <button
            onClick={() => {
              if (isUsingUploadedAnalysis) {
                handleResetToDemo();
              } else {
                setFilters(DEFAULT_FILTERS);
              }
            }}
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-4 py-2 text-xs font-semibold hover:bg-primary/90 transition"
            data-testid="empty-state-reset"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset filters
          </button>
        </div>
      )}
    </>
  );
}
