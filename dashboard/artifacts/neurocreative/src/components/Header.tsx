import { Brain, Sun, Moon, Download, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  theme: "light" | "dark";
  toggleTheme: () => void;
  onAskCopilot: () => void;
}

export function Header({ theme, toggleTheme, onAskCopilot }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/50 bg-background/80 backdrop-blur-xl">
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

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground"
            aria-label="Toggle theme"
          >
            {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="hidden md:flex h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <Download className="h-3.5 w-3.5" />
            Export
          </Button>

          <Button
            size="sm"
            onClick={onAskCopilot}
            data-testid="open-copilot"
            className="h-8 gap-1.5 rounded-full px-3.5 text-xs font-semibold"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Ask Copilot
          </Button>
        </div>
      </div>
    </header>
  );
}
