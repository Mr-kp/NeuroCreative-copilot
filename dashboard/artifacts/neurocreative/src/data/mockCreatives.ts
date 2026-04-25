/**
 * Compatibility shim for the original spec's `mockCreatives.ts`.
 *
 * The original task brief expected a hand-authored `mockCreatives.ts` with 6
 * fixed creative IDs (CR-1042, CR-2031, CR-1177, CR-0884, CR-3020, CR-4112).
 * Mid-task the user uploaded the real Smadex synthetic dataset and asked us
 * to drive the dashboard from that data instead. The dashboard now imports
 * from `./smadexData` (9 curated creatives selected from 1,080 real records).
 *
 * This file is kept so that any caller still wiring against `mockCreatives`
 * gets the same data, plus a small `LEGACY_CREATIVE_IDS` constant for tests
 * that referenced the original IDs.
 */
export {
  CREATIVES,
  KPIS,
  FILTER_OPTIONS,
  DEFAULT_FILTERS,
  CAMPAIGNS,
  ADVERTISERS,
  DATASET_META,
} from "./smadexData";
export type {
  Creative,
  CreativeStatus,
  RecommendedAction,
  BrainScores,
  TimeSeriesPoint,
  Kpis,
  KpiCard,
  FilterOptions,
  DashboardFilters,
} from "./smadexData";

import { CREATIVES } from "./smadexData";

export const LEGACY_CREATIVE_IDS = [
  "CR-1042",
  "CR-2031",
  "CR-1177",
  "CR-0884",
  "CR-3020",
  "CR-4112",
] as const;

export const mockCreatives = CREATIVES;
export default CREATIVES;
