import { Reveal } from "@/components/ScrollReveal";
import { AccurateBrainVisualizer } from "@/components/AccurateBrainVisualizer";

export function ForecastingSection() {
  return (
    <div className="flex flex-col items-center">
      <div className="w-full max-w-5xl space-y-16">

        <Reveal>
          <section className="text-center">
            <h2 className="font-display text-4xl sm:text-5xl leading-[1.1] tracking-tight">
              Ad <span className="italic text-primary">intelligence</span>
            </h2>
            <p className="mt-4 text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Upload a creative and get a full neural + performance analysis with
              actionable recommendations. See how neural activity changes synchronously with video frames.
            </p>
          </section>
        </Reveal>

        <Reveal delay={200}>
          <AccurateBrainVisualizer />
        </Reveal>

      </div>
    </div>
  );
}
