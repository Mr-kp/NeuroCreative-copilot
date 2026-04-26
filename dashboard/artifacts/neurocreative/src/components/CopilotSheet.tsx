import { useEffect, useMemo, useRef, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Send, MessageSquare, User, Sparkles, Loader2, AlertCircle } from "lucide-react";
import type { Creative } from "@/data/smadexData";
import type { AnalyzedCreative, DashboardSummary, CopilotApiResponse } from "@/types/dashboard";
import { askCopilotStream } from "@/lib/apiClient";

interface CopilotSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  creative: Creative | null;
  /** The raw OpenAI AnalyzedCreative (when using uploaded data) */
  analyzedCreative?: AnalyzedCreative;
  /** Dashboard-level context (when using uploaded data) */
  dashboardContext?: {
    dashboard_summary: DashboardSummary;
    portfolio_recommendations: string[];
  };
}

interface ChatMessage {
  role: "user" | "assistant";
  text: string;
  timestamp: number;
  // Structured response fields (for assistant messages from API)
  suggestedAction?: string;
  confidence?: number;
  supportingPoints?: string[];
  followUpQuestions?: string[];
  isError?: boolean;
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return `${n}`;
}

// ─── Local fallback answer generator (demo mode only) ──────────────────────

function generateLocalAnswer(question: string, c: Creative): string {
  const q = question.toLowerCase();
  const ctr = c.ctr.toFixed(2);
  const cvr = c.cvr.toFixed(2);
  const roas = c.roas.toFixed(2);
  const fatigue = c.fatigueRisk;
  const decay = (() => {
    if (c.timeSeries.length < 8) return 0;
    const first = c.timeSeries.slice(0, 7);
    const last = c.timeSeries.slice(-7);
    const f = first.reduce((s, p) => s + p.ctr, 0) / first.length;
    const l = last.reduce((s, p) => s + p.ctr, 0) / last.length;
    return f === 0 ? 0 : Math.round(((l - f) / f) * 100);
  })();

  if (q.includes("why") && (q.includes("dropping") || q.includes("falling") || q.includes("fatigu"))) {
    if (c.status === "Fatigued") {
      return `${c.id} is fatigued. CTR fell ${Math.abs(decay)}% from week 1 to the last 7 days, and the predicted novelty response sits at ${c.brainScores.noveltyResponse}/100 — viewers are no longer surprised. Combined with ${c.metadata.textDensity.toLowerCase()} text density and a ${c.metadata.tone.toLowerCase()} tone, the audience has saturated. Recommended action: ${c.action}.`;
    }
    return `${c.id} is currently labelled ${c.status}. CTR trend over the run is ${decay >= 0 ? "+" : ""}${decay}%, fatigue risk is ${fatigue}%. Predicted attention score is ${c.brainScores.attention}/100 — no critical drop yet. ${c.recommendation.headline}`;
  }

  if (q.includes("scale") || q.includes("budget") || q.includes("more spend") || q.includes("pause")) {
    if (c.status === "Top Performer") {
      return `Yes — ${c.id} is a clear scaling candidate. ROAS holds at ${roas}x with ${formatNumber(c.impressions)} impressions and a healthy ${c.healthScore}/100 health score. Predicted reward signal is ${c.brainScores.engagement}/100. Suggested move: increase daily spend by 30% over the next 3 days and watch first_7d_ctr decay closely.`;
    }
    if (c.status === "Fatigued") {
      return `Don't scale ${c.id} as-is — fatigue risk is ${fatigue}% and CTR has decayed ${Math.abs(decay)}%. Adding spend will accelerate decay. Pivot to a fresh hook (the existing ${c.metadata.hookType} angle is burning out) and only then consider scaling.`;
    }
    return `Be cautious with scaling ${c.id}. Health score is ${c.healthScore}/100, fatigue risk is ${fatigue}%. Hold spend flat for 3 more days and re-evaluate. Test a high-novelty variant in parallel to hedge.`;
  }

  if (q.includes("what") && (q.includes("change") || q.includes("improve"))) {
    return `Next best test for ${c.id}: ${c.recommendation.nextBestTest} The predicted weak spot is novelty (${c.brainScores.noveltyResponse}/100) and clarity (${c.brainScores.messageClarity}/100), so the variant should target both — fresh opening visual + cleaner CTA.`;
  }

  if (q.includes("mri") || q.includes("brain") || q.includes("cognit") || q.includes("activity")) {
    return `Brain-inspired scores for ${c.id}: Attention ${c.brainScores.attention}, Recall ${c.brainScores.recall}, Engagement ${c.brainScores.engagement}, Novelty ${c.brainScores.noveltyResponse}, Clarity ${c.brainScores.messageClarity}, Cognitive Load ${c.brainScores.cognitiveLoad}. These are model predictions derived from the creative's visual features — not real EEG data.`;
  }

  if (q.includes("compare") || q.includes("campaign") || q.includes("benchmark")) {
    return `${c.id} sits at ${ctr}% CTR / ${cvr}% CVR / ${roas}x ROAS. The dataset's overall CTR is ~0.48% and overall ROAS is ~3.4x — so this creative is ${Number(ctr) > 0.48 ? "above" : "below"} the global CTR baseline. Health score ${c.healthScore}/100 ranks it as ${c.status}.`;
  }

  return `${c.id} (${c.appName}, ${c.verticalDisplay}) is currently ${c.status} with a ${c.healthScore}/100 health score. ${c.recommendation.headline} Recommended action: ${c.action}. Ask me about fatigue, scaling, audience splits, or what to test next.`;
}

// ─── Suggestion chips ──────────────────────────────────────────────────────

const SUGGESTION_CHIPS = [
  "Why is this ad fatigued?",
  "Should we scale or pause it?",
  "What should we change?",
  "What does the MRI activity mean?",
  "How does this compare to the campaign?",
];

// ─── Action badge colors ───────────────────────────────────────────────────

const ACTION_BADGE_STYLE: Record<string, string> = {
  Scale: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/25",
  Monitor: "bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/25",
  Pivot: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/25",
  Pause: "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/25",
  None: "bg-muted text-muted-foreground border-border/40",
};

// ─── Component ─────────────────────────────────────────────────────────────

export function CopilotSheet({
  open,
  onOpenChange,
  creative,
  analyzedCreative,
  dashboardContext,
}: CopilotSheetProps) {
  const [messagesByCreative, setMessagesByCreative] = useState<Record<string, ChatMessage[]>>({});
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const creativeId = creative?.id ?? "";
  const messages = messagesByCreative[creativeId] || [];

  const isLiveMode = !!analyzedCreative;

  // Auto-scroll on new messages.
  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length, isThinking]);

  const addMessage = (msg: ChatMessage) => {
    setMessagesByCreative((prev) => ({
      ...prev,
      [creativeId]: [...(prev[creativeId] || []), msg],
    }));
  };

  const ask = async (question: string) => {
    if (!creative || !question.trim() || isThinking) return;

    const userMsg: ChatMessage = {
      role: "user",
      text: question.trim(),
      timestamp: Date.now(),
    };
    addMessage(userMsg);
    setInput("");

    setIsThinking(true);
    const thinkingMsg: ChatMessage = {
      role: "assistant",
      text: "",
      timestamp: Date.now(),
    };
    addMessage(thinkingMsg);

    const payload = isLiveMode && analyzedCreative
      ? {
          question: question.trim(),
          selectedCreative: analyzedCreative,
          dashboardContext: dashboardContext
            ? {
                dashboard_summary: dashboardContext.dashboard_summary,
                portfolio_recommendations: dashboardContext.portfolio_recommendations,
              }
            : undefined,
        }
      : {
          question: question.trim(),
          selectedCreative: {
            creative_id: creative.id,
            status: creative.status,
            recommended_action: creative.action,
            fatigue_risk: creative.fatigueRisk,
            creative_health_score: creative.healthScore,
            ctr: creative.ctr,
            cvr: creative.cvr,
            roas: creative.roas,
            spend: creative.spend,
            impressions: creative.impressions,
            brain_scores: {
              attention: creative.brainScores.attention,
              reward: creative.brainScores.engagement,
              memory: creative.brainScores.recall,
              visualLoad: creative.brainScores.cognitiveLoad,
              emotion: creative.brainScores.noveltyResponse,
            },
            explanation: creative.recommendation.headline,
            key_reasons: creative.recommendation.reasons.map((r) => r.text),
            next_best_test: creative.recommendation.nextBestTest,
            copilot_answers: {},
          },
        };

    try {
      await askCopilotStream(payload, {
        onToken: (text) => {
          setMessagesByCreative((prev) => {
            const msgs = [...(prev[creativeId] || [])];
            const last = msgs[msgs.length - 1];
            if (last && last.role === "assistant") {
              msgs[msgs.length - 1] = { ...last, text: last.text + text };
            }
            return { ...prev, [creativeId]: msgs };
          });
        },
        onDone: (response) => {
          setMessagesByCreative((prev) => {
            const msgs = [...(prev[creativeId] || [])];
            const last = msgs[msgs.length - 1];
            if (last && last.role === "assistant") {
              msgs[msgs.length - 1] = {
                ...last,
                text: response.answer || last.text,
                suggestedAction: response.suggested_action,
                confidence: response.confidence ? Math.round(response.confidence * 100) : undefined,
                supportingPoints: response.supporting_points,
                followUpQuestions: response.follow_up_questions,
              };
            }
            return { ...prev, [creativeId]: msgs };
          });
          setIsThinking(false);
        },
        onError: (err) => {
          console.warn("[CopilotSheet] API error, falling back to local answer:", err);
          const answer = generateLocalAnswer(question, creative);
          setMessagesByCreative((prev) => {
            const msgs = [...(prev[creativeId] || [])];
            const last = msgs[msgs.length - 1];
            if (last && last.role === "assistant") {
              msgs[msgs.length - 1] = { ...last, text: answer, isError: true };
            }
            return { ...prev, [creativeId]: msgs };
          });
          setIsThinking(false);
        },
      });
    } catch (err) {
      console.warn("[CopilotSheet] Exception, falling back to local answer:", err);
      const answer = generateLocalAnswer(question, creative);
      setMessagesByCreative((prev) => {
        const msgs = [...(prev[creativeId] || [])];
        const last = msgs[msgs.length - 1];
        if (last && last.role === "assistant") {
          msgs[msgs.length - 1] = { ...last, text: answer, isError: true };
        }
        return { ...prev, [creativeId]: msgs };
      });
      setIsThinking(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md p-0 flex flex-col gap-0 border-l border-border/60 bg-background"
        data-testid="copilot-sheet"
      >
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-border/60">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/12 text-primary ring-1 ring-primary/25">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="leading-tight text-left">
              <SheetTitle className="text-base font-semibold">
                Ask <span className="font-display italic font-normal text-primary">Copilot</span>
              </SheetTitle>
              <SheetDescription className="text-[11px] mt-0.5">
                {creative ? (
                  <>
                    {isLiveMode && (
                      <Badge variant="outline" className="mr-1.5 text-[8px] px-1.5 py-0 bg-primary/10 text-primary border-primary/25">
                        LIVE
                      </Badge>
                    )}
                    Now analyzing{" "}
                    <span className="font-mono-tight font-semibold text-foreground">
                      {creative.id}
                    </span>
                    {" · "}
                    {creative.appName}
                  </>
                ) : (
                  <>Pick a creative to start a conversation.</>
                )}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        {/* Messages — vertical, scrollable */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-5" data-testid="copilot-messages">
          {messages.length === 0 && !isThinking ? (
            <div className="space-y-5">
              <div
                className="rounded-xl border border-dashed border-border/60 bg-muted/20 p-5 text-center"
                data-testid="copilot-empty"
              >
                <MessageSquare className="h-5 w-5 text-muted-foreground/60 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {creative ? (
                    <>
                      Tap a question or type your own to start a conversation about{" "}
                      <span className="font-mono-tight font-semibold text-foreground">
                        {creative.id}
                      </span>
                      .
                    </>
                  ) : (
                    <>No creative is selected.</>
                  )}
                </p>
              </div>
              {creative && (
                <div className="space-y-2">
                  <div className="eyebrow text-muted-foreground/80 px-1">
                    Suggested
                  </div>
                  {SUGGESTION_CHIPS.map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => ask(q)}
                      data-testid="copilot-starter"
                      className="w-full text-left text-[13px] px-3.5 py-2.5 rounded-lg border border-border/60 bg-card/60 hover:bg-card hover:border-primary/35 text-foreground/90 transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((m, i) => (
                <div key={i} className="flex gap-2.5">
                  <div
                    className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full ${
                      m.role === "user"
                        ? "bg-muted text-muted-foreground"
                        : m.isError
                        ? "bg-rose-500/12 text-rose-500"
                        : "bg-primary/12 text-primary ring-1 ring-primary/25"
                    }`}
                  >
                    {m.role === "user" ? (
                      <User className="h-3.5 w-3.5" />
                    ) : m.isError ? (
                      <AlertCircle className="h-3.5 w-3.5" />
                    ) : (
                      <Sparkles className="h-3.5 w-3.5" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-mono-tight text-[10px] uppercase tracking-[0.18em] text-muted-foreground mb-1">
                      {m.role === "user" ? "You" : "Copilot"}
                    </div>
                    <p className="text-[13px] leading-relaxed text-foreground/90">
                      {m.text}
                    </p>

                    {m.isError && (
                      <p className="mt-1 text-[10px] text-muted-foreground/60 italic">
                        Offline fallback — API unavailable
                      </p>
                    )}

                    {/* Structured response extras */}
                    {m.role === "assistant" && !m.isError && m.suggestedAction && m.suggestedAction !== "None" && (
                      <div className="mt-2 flex items-center gap-2 flex-wrap">
                        <Badge
                          variant="outline"
                          className={`text-[10px] font-semibold border px-1.5 py-0 ${
                            ACTION_BADGE_STYLE[m.suggestedAction] || ACTION_BADGE_STYLE.None
                          }`}
                        >
                          {m.suggestedAction}
                        </Badge>
                        {m.confidence !== undefined && (
                          <span className="text-[10px] text-muted-foreground font-mono-tight">
                            {m.confidence}% confidence
                          </span>
                        )}
                      </div>
                    )}

                    {m.supportingPoints && m.supportingPoints.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {m.supportingPoints.map((sp, j) => (
                          <div
                            key={j}
                            className="text-[11px] text-muted-foreground leading-relaxed pl-3 border-l-2 border-primary/20"
                          >
                            {sp}
                          </div>
                        ))}
                      </div>
                    )}

                    {m.followUpQuestions && m.followUpQuestions.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {m.followUpQuestions.map((fq, j) => (
                          <button
                            key={j}
                            type="button"
                            onClick={() => ask(fq)}
                            className="text-[11px] px-2.5 py-1 rounded-full border border-border/60 bg-card/60 hover:bg-card hover:border-primary/35 text-foreground/80 transition-colors"
                          >
                            {fq}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Thinking indicator */}
              {isThinking && (
                <div className="flex gap-2.5">
                  <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-primary/12 text-primary ring-1 ring-primary/25">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  </div>
                  <div className="flex-1">
                    <div className="font-mono-tight text-[10px] uppercase tracking-[0.18em] text-muted-foreground mb-1">
                      Copilot
                    </div>
                    <p className="text-[13px] text-muted-foreground/70 italic">
                      Analyzing the selected creative…
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Input — pinned to bottom */}
        <form
          className="border-t border-border/60 px-4 py-3 flex items-center gap-2 bg-background"
          onSubmit={(e) => {
            e.preventDefault();
            ask(input);
          }}
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={creative ? `Ask about ${creative.id}...` : "Pick a creative first"}
            disabled={!creative || isThinking}
            data-testid="copilot-input"
            className="flex-1 h-10 rounded-lg border border-border/60 bg-background px-3.5 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary/40 transition disabled:opacity-50"
          />
          <Button
            type="submit"
            size="icon"
            disabled={!creative || !input.trim() || isThinking}
            className="h-10 w-10 rounded-lg"
            data-testid="copilot-send"
            aria-label="Send message"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}

export default CopilotSheet;
