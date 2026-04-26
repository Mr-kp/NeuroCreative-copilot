import { useEffect, useState } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { NavBar, type Section } from "@/components/NavBar";
import { DashboardSection } from "@/components/DashboardSection";
import { ForecastingSection } from "@/components/ForecastingSection";
import { AboutSection } from "@/components/AboutSection";
import { CopilotSheet } from "@/components/CopilotSheet";
import { CopilotPage } from "@/components/copilot/CopilotPage";
import { Footer } from "@/components/Footer";
import { CREATIVES, type Creative } from "@/data/smadexData";

const THEME_KEY = "neurocreative-theme";

function useTheme() {
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window === "undefined") return "dark";
    const stored = window.localStorage.getItem(THEME_KEY);
    if (stored === "light" || stored === "dark") return stored;
    return "dark";
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
    window.localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"));
  return { theme, toggleTheme };
}

function App() {
  const { theme, toggleTheme } = useTheme();
  const [activeSection, setActiveSection] = useState<Section>("dashboard");
  const [copilotOpen, setCopilotOpen] = useState(false);

  const demoCreative: Creative | null = CREATIVES[0] ?? null;

  return (
    <TooltipProvider delayDuration={150}>
      <div className="relative min-h-screen w-full overflow-x-hidden bg-background text-foreground">
        <div className="pointer-events-none fixed inset-x-0 top-0 -z-10 h-[480px] overflow-hidden">
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-[480px] w-[820px] rounded-full bg-primary/8 blur-[140px]" />
        </div>

        <NavBar
          active={activeSection}
          onNavigate={setActiveSection}
          theme={theme}
          toggleTheme={toggleTheme}
          onAskCopilot={() => setCopilotOpen(true)}
        />

        <main className={activeSection === "copilot" ? "" : "container mx-auto px-4 lg:px-8 py-10 space-y-8"}>
          {activeSection === "dashboard" && (
            <DashboardSection onAskCopilot={() => setCopilotOpen(true)} />
          )}
          {activeSection === "copilot" && <CopilotPage />}
          {activeSection === "forecasting" && <ForecastingSection />}
          {activeSection === "about" && <AboutSection />}
        </main>

        {activeSection !== "copilot" && <Footer />}

        <CopilotSheet
          open={copilotOpen}
          onOpenChange={setCopilotOpen}
          creative={demoCreative}
        />

        <Toaster />
      </div>
    </TooltipProvider>
  );
}

export default App;
