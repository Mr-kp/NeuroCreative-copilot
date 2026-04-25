import { Brain, Database } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DATASET_META } from "@/data/smadexData";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-border/60 bg-card/30 backdrop-blur-xl">
      <div className="container mx-auto px-4 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/12 text-primary">
              <Brain className="h-4 w-4" />
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold">
                NeuroCreative <span className="font-display italic font-normal text-primary">Copilot</span>
              </div>
              <div className="text-[11px] text-muted-foreground">
                Built for the Smadex Creative Intelligence Challenge
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Database className="h-3.5 w-3.5" />
              <span className="font-mono-tight">
                {DATASET_META.totalCreatives.toLocaleString()} creatives ·{" "}
                {DATASET_META.totalCampaigns.toLocaleString()} campaigns ·{" "}
                {DATASET_META.totalDailyRows.toLocaleString()} rows
              </span>
            </div>
            <Badge variant="outline" className="font-mono-tight text-[10px] bg-background/60">
              Synthetic dataset
            </Badge>
          </div>

          <div className="text-[11px] text-muted-foreground italic font-display">
            Decisions, not dashboards.
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-dashed border-border/40 text-[10px] text-muted-foreground/80 text-center leading-relaxed">
          Brain-inspired scores are model predictions, not measurements of real brain activity. All advertiser, campaign and creative data shown is fully synthetic.
        </div>
      </div>
    </footer>
  );
}
