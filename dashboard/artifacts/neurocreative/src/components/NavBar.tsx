import { useState } from "react";
import { BarChart3, Brain, Info, Sun, Moon, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export type Section = "dashboard" | "forecasting" | "about" | "copilot";

interface NavBarProps {
  active: Section;
  onNavigate: (s: Section) => void;
  theme: "light" | "dark";
  toggleTheme: () => void;
  onAskCopilot?: () => void;
}

const NAV_ITEMS: { id: Section; label: string; icon: typeof BarChart3 }[] = [
  { id: "dashboard", label: "Dashboard", icon: BarChart3 },
  { id: "copilot", label: "Copilot", icon: Sparkles },
  { id: "forecasting", label: "Ad Intelligence", icon: Brain },
  { id: "about", label: "About", icon: Info },
];

export function NavBar({ active, onNavigate, theme, toggleTheme, onAskCopilot }: NavBarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-white/10 bg-background/60 backdrop-blur-2xl supports-[backdrop-filter]:bg-background/40">
      <div className="container mx-auto flex h-14 items-center justify-between px-4 lg:px-8">
        <div className="flex items-center gap-2.5">
          <img src="/logo.jpg" alt="NeuroCreative" className="h-8 w-8 rounded-lg object-cover" />
          <div className="flex items-baseline gap-2">
            <h1 className="text-sm font-semibold tracking-tight">
              NeuroCreative <span className="font-display italic font-normal text-primary">Copilot</span>
            </h1>
            <span className="font-mono-tight text-[9px] uppercase tracking-[0.2em] text-muted-foreground/70 hidden sm:inline">
              v0.9
            </span>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = active === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-primary/12 text-primary ring-1 ring-primary/25"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {item.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-1">
          {onAskCopilot && (
            <Button
              onClick={onAskCopilot}
              variant="outline"
              size="sm"
              className="hidden md:flex gap-1.5 rounded-full px-3.5 text-xs font-medium border-primary/25 text-primary hover:bg-primary/10 hover:text-primary"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Copilot
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground"
            aria-label="Toggle theme"
          >
            {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          </Button>

          <button
            className="md:hidden flex items-center justify-center h-8 w-8 rounded-full text-muted-foreground hover:text-foreground"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Menu"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <line x1="2" y1="4" x2="14" y2="4" />
              <line x1="2" y1="8" x2="14" y2="8" />
              <line x1="2" y1="12" x2="14" y2="12" />
            </svg>
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-white/10 bg-background/80 backdrop-blur-xl px-4 py-3 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = active === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onNavigate(item.id);
                  setMobileOpen(false);
                }}
                className={`flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive
                    ? "bg-primary/12 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </button>
            );
          })}
        </div>
      )}
    </nav>
  );
}
