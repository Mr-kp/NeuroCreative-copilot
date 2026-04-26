import { SlidersHorizontal, RotateCcw } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  FILTER_OPTIONS,
  DEFAULT_FILTERS,
  type DashboardFilters,
} from "@/data/smadexData";

interface FiltersBarProps {
  filters: DashboardFilters;
  onChange: (next: DashboardFilters) => void;
  matchedCount: number;
  totalCount: number;
}

const ALL_OPTION = { value: "all", label: "All" };

interface FilterFieldProps {
  label: string;
  testId: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}

function FilterField({ label, testId, value, options, onChange }: FilterFieldProps) {
  const active = value !== "all";
  return (
    <div className="flex flex-col gap-1.5 min-w-0">
      <label className="eyebrow">
        {label}
      </label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger
          className={`h-9 bg-background/60 text-sm transition-colors ${
            active
              ? "border-primary/40 text-foreground ring-1 ring-primary/15"
              : "border-border/60 text-foreground hover:border-foreground/30"
          }`}
          data-testid={testId}
          aria-label={label}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export function FiltersBar({
  filters,
  onChange,
  matchedCount,
  totalCount,
}: FiltersBarProps) {
  const set = <K extends keyof DashboardFilters>(key: K, value: DashboardFilters[K]) =>
    onChange({ ...filters, [key]: value });

  const reset = () => onChange(DEFAULT_FILTERS);

  // Required filters per spec: Advertiser, Campaign, Country, OS, KPI Focus, Date Range
  const advertisers = [ALL_OPTION, ...FILTER_OPTIONS.advertisers];
  // Cascade: when an advertiser is selected, only show that advertiser's campaigns
  const campaigns = [
    ALL_OPTION,
    ...FILTER_OPTIONS.campaigns
      .filter((c) => filters.advertiser === "all" || c.advertiserName === filters.advertiser)
      .map((c) => ({ value: c.value, label: c.label })),
  ];
  const countries = [ALL_OPTION, ...FILTER_OPTIONS.countries.map((c) => ({ value: c, label: c }))];
  const oses = [ALL_OPTION, ...FILTER_OPTIONS.oses.map((o) => ({ value: o, label: o }))];
  const kpiFocus = FILTER_OPTIONS.kpiFocusOptions;
  const dateRanges = FILTER_OPTIONS.dateRangeOptions.map((d) => ({ value: d.value, label: d.label }));

  // Extra (non-required) filters retained for richer demo
  const verticals = [ALL_OPTION, ...FILTER_OPTIONS.verticals];
  const formats = [ALL_OPTION, ...FILTER_OPTIONS.formats];
  const statuses = [ALL_OPTION, ...FILTER_OPTIONS.statuses];

  return (
    <section className="rounded-xl border border-border/50 bg-card/40 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
          <h2 className="text-xs font-semibold tracking-wide uppercase text-muted-foreground">
            Filters
          </h2>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[11px] text-muted-foreground">
            <span className="font-mono-tight tabular-nums text-foreground font-semibold">{matchedCount}</span>
            <span className="mx-1 text-muted-foreground/50">/</span>
            <span className="font-mono-tight tabular-nums">{totalCount}</span>
            <span className="ml-1.5">creatives</span>
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs h-7 gap-1.5 text-muted-foreground hover:text-foreground"
            onClick={reset}
            data-testid="filters-reset"
          >
            <RotateCcw className="h-3 w-3" />
            Reset
          </Button>
        </div>
      </div>

      {/* Required filters */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <FilterField
          label="Advertiser"
          testId="filter-advertiser"
          value={filters.advertiser}
          options={advertisers}
          onChange={(v) => onChange({ ...filters, advertiser: v, campaign: "all" })}
        />
        <FilterField
          label="Campaign"
          testId="filter-campaign"
          value={filters.campaign}
          options={campaigns}
          onChange={(v) => set("campaign", v)}
        />
        <FilterField
          label="Country"
          testId="filter-country"
          value={filters.country}
          options={countries}
          onChange={(v) => set("country", v)}
        />
        <FilterField
          label="OS"
          testId="filter-os"
          value={filters.os}
          options={oses}
          onChange={(v) => set("os", v)}
        />
        <FilterField
          label="KPI Focus"
          testId="filter-kpi-focus"
          value={filters.kpiFocus}
          options={kpiFocus}
          onChange={(v) => set("kpiFocus", v)}
        />
        <FilterField
          label="Date Range"
          testId="filter-date-range"
          value={filters.dateRange}
          options={dateRanges}
          onChange={(v) => set("dateRange", v)}
        />
      </div>

      {/* Refinements */}
      <div className="mt-4 pt-4 border-t border-dashed border-border/50 grid grid-cols-2 sm:grid-cols-3 gap-3">
        <FilterField
          label="Vertical"
          testId="filter-vertical"
          value={filters.vertical}
          options={verticals}
          onChange={(v) => set("vertical", v)}
        />
        <FilterField
          label="Format"
          testId="filter-format"
          value={filters.format}
          options={formats}
          onChange={(v) => set("format", v)}
        />
        <FilterField
          label="Status"
          testId="filter-status"
          value={filters.status}
          options={statuses}
          onChange={(v) => set("status", v)}
        />
      </div>
    </section>
  );
}
