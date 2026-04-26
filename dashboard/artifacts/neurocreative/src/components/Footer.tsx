import { Brain } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-border/60 bg-card/30 backdrop-blur-xl">
      <div className="container mx-auto px-4 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src="/logo.jpg" alt="NeuroCreative" className="h-8 w-8 rounded-lg object-cover" />
            <div className="leading-tight">
              <div className="text-sm font-semibold">
                NeuroCreative <span className="font-display italic font-normal text-primary">Copilot</span>
              </div>
              <div className="text-[11px] text-muted-foreground">
                Built for the Smadex Creative Intelligence Challenge
              </div>
            </div>
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
