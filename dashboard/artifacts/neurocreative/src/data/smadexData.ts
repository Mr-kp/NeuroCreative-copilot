// AUTO-GENERATED FROM Smadex Creative Intelligence Dataset
// Run: node scripts/smadex/build-data.mjs
// Source files in attached_assets/smadex_dataset/
// DO NOT EDIT BY HAND — regenerate via the script above.

export type CreativeStatus = 'Top Performer' | 'Stable' | 'Fatigued' | 'Underperformer';
export type RecommendedAction = 'Scale' | 'Monitor' | 'Pivot' | 'Pause';

export interface BrainScores {
  attention: number;
  recall: number;
  cognitiveLoad: number;
  engagement: number;
  noveltyResponse: number;
  messageClarity: number;
}

export interface CreativeMetadata {
  ctaText: string;
  headline: string;
  subhead: string;
  dominantColor: string;
  dominantColorHex: string;
  tone: string;
  textDensity: 'Low' | 'Medium' | 'High';
  hookType: string;
  theme: string;
  language: string;
  durationSec: number;
  hasGameplay: boolean;
  hasUgcStyle: boolean;
  hasPrice: boolean;
  hasDiscountBadge: boolean;
  facesCount: number;
  productCount: number;
  brandVisibility: number;
  novelty: number;
  motion: number;
  readability: number;
  clutter: number;
}

export interface TimeSeriesPoint {
  date: string;
  day: number;
  impressions: number;
  clicks: number;
  conversions: number;
  spend: number;
  revenue: number;
  ctr: number;
  cvr: number;
}

export interface RecommendationReason {
  label: string;
  text: string;
}

export interface Creative {
  id: string;
  rawId: number;
  campaignId: number;
  advertiserName: string;
  appName: string;
  vertical: string;
  verticalDisplay: string;
  format: string;
  formatDisplay: string;
  campaignCountries: string[];
  campaignOs: string;
  supportedOs: string[];
  status: CreativeStatus;
  rawStatus: 'top_performer' | 'stable' | 'fatigued' | 'underperformer';
  action: RecommendedAction;
  ctr: number;
  cvr: number;
  roas: number;
  ipm: number;
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  revenue: number;
  daysActive: number;
  launchDate: string;
  fatigueDay: number | null;
  fatigueRisk: number;
  healthScore: number;
  metadata: CreativeMetadata;
  brainScores: BrainScores;
  timeSeries: TimeSeriesPoint[];
  recommendation: { headline: string; reasons: RecommendationReason[]; nextBestTest: string };
  assetUrl: string;
}

export interface KpiCard {
  value: number;
  trend: { direction: 'up' | 'down' | 'flat'; deltaPct: number; label: string };
}

export interface Kpis {
  totalSpend: KpiCard;
  impressions: KpiCard;
  ctr: KpiCard;
  cvr: KpiCard;
  roas: KpiCard;
  fatiguedCount: KpiCard;
  topPerformerCount: KpiCard;
  totalCreatives: KpiCard;
}

export interface FilterOptions {
  verticals: { value: string; label: string }[];
  formats: { value: string; label: string }[];
  apps: string[];
  advertisers: { value: string; label: string }[];
  campaigns: { value: string; label: string; advertiserName: string }[];
  countries: string[];
  oses: string[];
  statuses: { value: string; label: string }[];
  kpiFocusOptions: { value: string; label: string }[];
  dateRangeOptions: { value: string; label: string; days: number }[];
}

export interface DashboardFilters {
  vertical: string;
  format: string;
  app: string;
  advertiser: string;
  campaign: string;
  country: string;
  os: string;
  status: string;
  kpiFocus: string;
  dateRange: string;
}

export const CREATIVES: Creative[] = [
  {
    "id": "CR-500686",
    "rawId": 500686,
    "campaignId": 20114,
    "advertiserName": "NeonArena",
    "appName": "NeonArena Quest",
    "vertical": "gaming",
    "verticalDisplay": "Gaming",
    "format": "playable",
    "formatDisplay": "Playable",
    "campaignCountries": [
      "MX",
      "BR"
    ],
    "campaignOs": "Both",
    "supportedOs": [
      "Android",
      "iOS"
    ],
    "status": "Fatigued",
    "rawStatus": "fatigued",
    "action": "Pivot",
    "ctr": 0.96,
    "cvr": 20.68,
    "roas": 2.86,
    "ipm": 2,
    "spend": 19927,
    "impressions": 5136004,
    "clicks": 49549,
    "conversions": 10247,
    "revenue": 57027,
    "daysActive": 52,
    "launchDate": "2026-01-16",
    "fatigueDay": 13,
    "fatigueRisk": 97,
    "healthScore": 63,
    "metadata": {
      "ctaText": "Shop now",
      "headline": "Unlock rare gear",
      "subhead": "No ads in first week",
      "dominantColor": "purple",
      "dominantColorHex": "#7C3AED",
      "tone": "urgent",
      "textDensity": "Medium",
      "hookType": "last-minute deal",
      "theme": "reward",
      "language": "es",
      "durationSec": 15,
      "hasGameplay": true,
      "hasUgcStyle": false,
      "hasPrice": false,
      "hasDiscountBadge": false,
      "facesCount": 0,
      "productCount": 1,
      "brandVisibility": 68,
      "novelty": 67,
      "motion": 86,
      "readability": 90,
      "clutter": 7
    },
    "brainScores": {
      "attention": 67,
      "recall": 76,
      "cognitiveLoad": 15,
      "engagement": 68,
      "noveltyResponse": 73,
      "messageClarity": 81
    },
    "timeSeries": [
      {
        "date": "2026-01-16",
        "day": 0,
        "impressions": 266025,
        "clicks": 4331,
        "conversions": 890,
        "spend": 1065.53,
        "revenue": 4904.26,
        "ctr": 1.628,
        "cvr": 20.5495
      },
      {
        "date": "2026-01-17",
        "day": 1,
        "impressions": 308602,
        "clicks": 5187,
        "conversions": 1049,
        "spend": 1200.97,
        "revenue": 5354.05,
        "ctr": 1.6808,
        "cvr": 20.2236
      },
      {
        "date": "2026-01-18",
        "day": 2,
        "impressions": 171961,
        "clicks": 3202,
        "conversions": 762,
        "spend": 699.46,
        "revenue": 4350.96,
        "ctr": 1.8621,
        "cvr": 23.7976
      },
      {
        "date": "2026-01-19",
        "day": 3,
        "impressions": 151558,
        "clicks": 2852,
        "conversions": 602,
        "spend": 565.86,
        "revenue": 3576.59,
        "ctr": 1.8818,
        "cvr": 21.108
      },
      {
        "date": "2026-01-20",
        "day": 4,
        "impressions": 170568,
        "clicks": 3156,
        "conversions": 698,
        "spend": 638.7,
        "revenue": 3959.31,
        "ctr": 1.8503,
        "cvr": 22.1166
      },
      {
        "date": "2026-01-21",
        "day": 5,
        "impressions": 145162,
        "clicks": 2545,
        "conversions": 570,
        "spend": 567.61,
        "revenue": 3172.53,
        "ctr": 1.7532,
        "cvr": 22.3969
      },
      {
        "date": "2026-01-22",
        "day": 6,
        "impressions": 172670,
        "clicks": 2698,
        "conversions": 536,
        "spend": 663.45,
        "revenue": 2829.68,
        "ctr": 1.5625,
        "cvr": 19.8666
      },
      {
        "date": "2026-01-23",
        "day": 7,
        "impressions": 148982,
        "clicks": 2375,
        "conversions": 492,
        "spend": 577.59,
        "revenue": 2823.11,
        "ctr": 1.5942,
        "cvr": 20.7158
      },
      {
        "date": "2026-01-24",
        "day": 8,
        "impressions": 120032,
        "clicks": 1754,
        "conversions": 375,
        "spend": 455.85,
        "revenue": 2247.44,
        "ctr": 1.4613,
        "cvr": 21.3797
      },
      {
        "date": "2026-01-25",
        "day": 9,
        "impressions": 75181,
        "clicks": 1041,
        "conversions": 205,
        "spend": 303.67,
        "revenue": 1242.36,
        "ctr": 1.3847,
        "cvr": 19.6926
      },
      {
        "date": "2026-01-26",
        "day": 10,
        "impressions": 79704,
        "clicks": 999,
        "conversions": 203,
        "spend": 300.06,
        "revenue": 1105.84,
        "ctr": 1.2534,
        "cvr": 20.3203
      },
      {
        "date": "2026-01-27",
        "day": 11,
        "impressions": 65895,
        "clicks": 860,
        "conversions": 191,
        "spend": 249.77,
        "revenue": 1052.61,
        "ctr": 1.3051,
        "cvr": 22.2093
      },
      {
        "date": "2026-01-28",
        "day": 12,
        "impressions": 83347,
        "clicks": 948,
        "conversions": 205,
        "spend": 319.55,
        "revenue": 1037.83,
        "ctr": 1.1374,
        "cvr": 21.6245
      },
      {
        "date": "2026-01-29",
        "day": 13,
        "impressions": 71604,
        "clicks": 839,
        "conversions": 156,
        "spend": 279.94,
        "revenue": 912.44,
        "ctr": 1.1717,
        "cvr": 18.5936
      },
      {
        "date": "2026-01-30",
        "day": 14,
        "impressions": 80190,
        "clicks": 852,
        "conversions": 152,
        "spend": 304.81,
        "revenue": 830.88,
        "ctr": 1.0625,
        "cvr": 17.8404
      },
      {
        "date": "2026-01-31",
        "day": 15,
        "impressions": 81761,
        "clicks": 876,
        "conversions": 195,
        "spend": 307.82,
        "revenue": 1091.84,
        "ctr": 1.0714,
        "cvr": 22.2603
      },
      {
        "date": "2026-02-01",
        "day": 16,
        "impressions": 82510,
        "clicks": 874,
        "conversions": 181,
        "spend": 337.29,
        "revenue": 969.4,
        "ctr": 1.0593,
        "cvr": 20.7094
      },
      {
        "date": "2026-02-02",
        "day": 17,
        "impressions": 80686,
        "clicks": 824,
        "conversions": 159,
        "spend": 313.02,
        "revenue": 909.28,
        "ctr": 1.0212,
        "cvr": 19.2961
      },
      {
        "date": "2026-02-03",
        "day": 18,
        "impressions": 72120,
        "clicks": 655,
        "conversions": 120,
        "spend": 269.92,
        "revenue": 765.52,
        "ctr": 0.9082,
        "cvr": 18.3206
      },
      {
        "date": "2026-02-04",
        "day": 19,
        "impressions": 72597,
        "clicks": 540,
        "conversions": 106,
        "spend": 275.53,
        "revenue": 551.33,
        "ctr": 0.7438,
        "cvr": 19.6296
      },
      {
        "date": "2026-02-05",
        "day": 20,
        "impressions": 83118,
        "clicks": 718,
        "conversions": 150,
        "spend": 313.99,
        "revenue": 791.75,
        "ctr": 0.8638,
        "cvr": 20.8914
      },
      {
        "date": "2026-02-06",
        "day": 21,
        "impressions": 78358,
        "clicks": 564,
        "conversions": 93,
        "spend": 325.49,
        "revenue": 550.39,
        "ctr": 0.7198,
        "cvr": 16.4894
      },
      {
        "date": "2026-02-07",
        "day": 22,
        "impressions": 86809,
        "clicks": 708,
        "conversions": 133,
        "spend": 332.81,
        "revenue": 724.05,
        "ctr": 0.8156,
        "cvr": 18.7853
      },
      {
        "date": "2026-02-08",
        "day": 23,
        "impressions": 57865,
        "clicks": 442,
        "conversions": 86,
        "spend": 224.83,
        "revenue": 502.58,
        "ctr": 0.7638,
        "cvr": 19.457
      },
      {
        "date": "2026-02-09",
        "day": 24,
        "impressions": 72999,
        "clicks": 502,
        "conversions": 121,
        "spend": 283.17,
        "revenue": 660.9,
        "ctr": 0.6877,
        "cvr": 24.1036
      },
      {
        "date": "2026-02-10",
        "day": 25,
        "impressions": 68630,
        "clicks": 447,
        "conversions": 87,
        "spend": 263.9,
        "revenue": 444.8,
        "ctr": 0.6513,
        "cvr": 19.4631
      },
      {
        "date": "2026-02-11",
        "day": 26,
        "impressions": 74309,
        "clicks": 466,
        "conversions": 100,
        "spend": 287.81,
        "revenue": 576.67,
        "ctr": 0.6271,
        "cvr": 21.4592
      },
      {
        "date": "2026-02-12",
        "day": 27,
        "impressions": 75150,
        "clicks": 453,
        "conversions": 88,
        "spend": 283.71,
        "revenue": 470.82,
        "ctr": 0.6028,
        "cvr": 19.426
      },
      {
        "date": "2026-02-13",
        "day": 28,
        "impressions": 80968,
        "clicks": 472,
        "conversions": 83,
        "spend": 298.82,
        "revenue": 463.38,
        "ctr": 0.5829,
        "cvr": 17.5847
      },
      {
        "date": "2026-02-14",
        "day": 29,
        "impressions": 92416,
        "clicks": 527,
        "conversions": 101,
        "spend": 359.64,
        "revenue": 588.61,
        "ctr": 0.5702,
        "cvr": 19.1651
      },
      {
        "date": "2026-02-15",
        "day": 30,
        "impressions": 81507,
        "clicks": 481,
        "conversions": 91,
        "spend": 297.19,
        "revenue": 547.92,
        "ctr": 0.5901,
        "cvr": 18.9189
      },
      {
        "date": "2026-02-16",
        "day": 31,
        "impressions": 77817,
        "clicks": 401,
        "conversions": 83,
        "spend": 295.47,
        "revenue": 515.23,
        "ctr": 0.5153,
        "cvr": 20.6983
      },
      {
        "date": "2026-02-17",
        "day": 32,
        "impressions": 80831,
        "clicks": 463,
        "conversions": 101,
        "spend": 312.21,
        "revenue": 568.75,
        "ctr": 0.5728,
        "cvr": 21.8143
      },
      {
        "date": "2026-02-18",
        "day": 33,
        "impressions": 89949,
        "clicks": 466,
        "conversions": 90,
        "spend": 343.56,
        "revenue": 500.74,
        "ctr": 0.5181,
        "cvr": 19.3133
      },
      {
        "date": "2026-02-19",
        "day": 34,
        "impressions": 67312,
        "clicks": 310,
        "conversions": 58,
        "spend": 265.45,
        "revenue": 292.88,
        "ctr": 0.4605,
        "cvr": 18.7097
      },
      {
        "date": "2026-02-20",
        "day": 35,
        "impressions": 71182,
        "clicks": 346,
        "conversions": 70,
        "spend": 278.76,
        "revenue": 361.92,
        "ctr": 0.4861,
        "cvr": 20.2312
      },
      {
        "date": "2026-02-21",
        "day": 36,
        "impressions": 99541,
        "clicks": 477,
        "conversions": 95,
        "spend": 406.01,
        "revenue": 527.78,
        "ctr": 0.4792,
        "cvr": 19.9161
      },
      {
        "date": "2026-02-22",
        "day": 37,
        "impressions": 84250,
        "clicks": 258,
        "conversions": 45,
        "spend": 326.38,
        "revenue": 234.62,
        "ctr": 0.3062,
        "cvr": 17.4419
      },
      {
        "date": "2026-02-23",
        "day": 38,
        "impressions": 94069,
        "clicks": 381,
        "conversions": 74,
        "spend": 341.77,
        "revenue": 406.21,
        "ctr": 0.405,
        "cvr": 19.4226
      },
      {
        "date": "2026-02-24",
        "day": 39,
        "impressions": 77159,
        "clicks": 300,
        "conversions": 49,
        "spend": 298.91,
        "revenue": 270.21,
        "ctr": 0.3888,
        "cvr": 16.3333
      },
      {
        "date": "2026-02-25",
        "day": 40,
        "impressions": 79651,
        "clicks": 285,
        "conversions": 56,
        "spend": 301.51,
        "revenue": 288.94,
        "ctr": 0.3578,
        "cvr": 19.6491
      },
      {
        "date": "2026-02-26",
        "day": 41,
        "impressions": 81888,
        "clicks": 293,
        "conversions": 49,
        "spend": 326.51,
        "revenue": 257.91,
        "ctr": 0.3578,
        "cvr": 16.7235
      },
      {
        "date": "2026-02-27",
        "day": 42,
        "impressions": 85062,
        "clicks": 298,
        "conversions": 62,
        "spend": 334.82,
        "revenue": 342.97,
        "ctr": 0.3503,
        "cvr": 20.8054
      },
      {
        "date": "2026-02-28",
        "day": 43,
        "impressions": 85667,
        "clicks": 258,
        "conversions": 52,
        "spend": 343.14,
        "revenue": 302.37,
        "ctr": 0.3012,
        "cvr": 20.155
      },
      {
        "date": "2026-03-01",
        "day": 44,
        "impressions": 92626,
        "clicks": 305,
        "conversions": 63,
        "spend": 366.36,
        "revenue": 351.38,
        "ctr": 0.3293,
        "cvr": 20.6557
      },
      {
        "date": "2026-03-02",
        "day": 45,
        "impressions": 87068,
        "clicks": 267,
        "conversions": 48,
        "spend": 355.48,
        "revenue": 280.45,
        "ctr": 0.3067,
        "cvr": 17.9775
      },
      {
        "date": "2026-03-03",
        "day": 46,
        "impressions": 74498,
        "clicks": 202,
        "conversions": 45,
        "spend": 285.48,
        "revenue": 261.59,
        "ctr": 0.2711,
        "cvr": 22.2772
      },
      {
        "date": "2026-03-04",
        "day": 47,
        "impressions": 74541,
        "clicks": 182,
        "conversions": 40,
        "spend": 304.8,
        "revenue": 232.39,
        "ctr": 0.2442,
        "cvr": 21.978
      },
      {
        "date": "2026-03-05",
        "day": 48,
        "impressions": 82924,
        "clicks": 208,
        "conversions": 43,
        "spend": 334.47,
        "revenue": 228.92,
        "ctr": 0.2508,
        "cvr": 20.6731
      },
      {
        "date": "2026-03-06",
        "day": 49,
        "impressions": 87848,
        "clicks": 192,
        "conversions": 36,
        "spend": 330.93,
        "revenue": 199.95,
        "ctr": 0.2186,
        "cvr": 18.75
      },
      {
        "date": "2026-03-07",
        "day": 50,
        "impressions": 86222,
        "clicks": 204,
        "conversions": 50,
        "spend": 348.17,
        "revenue": 259.63,
        "ctr": 0.2366,
        "cvr": 24.5098
      },
      {
        "date": "2026-03-08",
        "day": 51,
        "impressions": 122615,
        "clicks": 265,
        "conversions": 58,
        "spend": 458.9,
        "revenue": 333.42,
        "ctr": 0.2161,
        "cvr": 21.8868
      }
    ],
    "recommendation": {
      "headline": "CTR dropped 86% by day 13 — audience saturation detected.",
      "reasons": [
        {
          "label": "Performance trend",
          "text": "CTR fell from 1.73% in week 1 to 0.25% in the last 7 days."
        },
        {
          "label": "Visual factor",
          "text": "Medium text density combined with urgent tone is losing novelty."
        },
        {
          "label": "Brain-inspired signal",
          "text": "Predicted novelty response is 73 — viewers are no longer surprised."
        }
      ],
      "nextBestTest": "Refresh the first 3 seconds with a new gameplay hook; keep the Shop now CTA which still converts."
    },
    "assetUrl": "/creatives/creative_500686.png"
  },
  {
    "id": "CR-500489",
    "rawId": 500489,
    "campaignId": 20081,
    "advertiserName": "DriftPass",
    "appName": "DriftPass Travel",
    "vertical": "travel",
    "verticalDisplay": "Travel",
    "format": "rewarded_video",
    "formatDisplay": "Rewarded Video",
    "campaignCountries": [
      "JP",
      "DE",
      "CA"
    ],
    "campaignOs": "Both",
    "supportedOs": [
      "Android",
      "iOS"
    ],
    "status": "Fatigued",
    "rawStatus": "fatigued",
    "action": "Pivot",
    "ctr": 0.76,
    "cvr": 7.18,
    "roas": 7.66,
    "ipm": 0.54,
    "spend": 32851,
    "impressions": 3241628,
    "clicks": 24532,
    "conversions": 1762,
    "revenue": 251635,
    "daysActive": 44,
    "launchDate": "2026-01-22",
    "fatigueDay": 13,
    "fatigueRisk": 96,
    "healthScore": 73,
    "metadata": {
      "ctaText": "Start now",
      "headline": "Escape this weekend",
      "subhead": "Hotels + flights in one tap",
      "dominantColor": "teal",
      "dominantColorHex": "#0D9488",
      "tone": "Playful",
      "textDensity": "Medium",
      "hookType": "new collection",
      "theme": "wanderlust",
      "language": "de",
      "durationSec": 10,
      "hasGameplay": false,
      "hasUgcStyle": false,
      "hasPrice": true,
      "hasDiscountBadge": true,
      "facesCount": 1,
      "productCount": 1,
      "brandVisibility": 71,
      "novelty": 63,
      "motion": 50,
      "readability": 83,
      "clutter": 24
    },
    "brainScores": {
      "attention": 54,
      "recall": 73,
      "cognitiveLoad": 26,
      "engagement": 73,
      "noveltyResponse": 59,
      "messageClarity": 75
    },
    "timeSeries": [
      {
        "date": "2026-01-22",
        "day": 0,
        "impressions": 87519,
        "clicks": 1069,
        "conversions": 68,
        "spend": 883.55,
        "revenue": 9836.09,
        "ctr": 1.2214,
        "cvr": 6.3611
      },
      {
        "date": "2026-01-23",
        "day": 1,
        "impressions": 104859,
        "clicks": 1500,
        "conversions": 119,
        "spend": 1062.02,
        "revenue": 16805.8,
        "ctr": 1.4305,
        "cvr": 7.9333
      },
      {
        "date": "2026-01-24",
        "day": 2,
        "impressions": 126178,
        "clicks": 1877,
        "conversions": 140,
        "spend": 1251.39,
        "revenue": 20240.17,
        "ctr": 1.4876,
        "cvr": 7.4587
      },
      {
        "date": "2026-01-25",
        "day": 3,
        "impressions": 109609,
        "clicks": 1569,
        "conversions": 119,
        "spend": 1161.13,
        "revenue": 16838.32,
        "ctr": 1.4315,
        "cvr": 7.5844
      },
      {
        "date": "2026-01-26",
        "day": 4,
        "impressions": 81718,
        "clicks": 1226,
        "conversions": 97,
        "spend": 837.47,
        "revenue": 15573.08,
        "ctr": 1.5003,
        "cvr": 7.9119
      },
      {
        "date": "2026-01-27",
        "day": 5,
        "impressions": 79097,
        "clicks": 1044,
        "conversions": 76,
        "spend": 771.56,
        "revenue": 12138.76,
        "ctr": 1.3199,
        "cvr": 7.2797
      },
      {
        "date": "2026-01-28",
        "day": 6,
        "impressions": 58808,
        "clicks": 717,
        "conversions": 50,
        "spend": 606.36,
        "revenue": 6355.78,
        "ctr": 1.2192,
        "cvr": 6.9735
      },
      {
        "date": "2026-01-29",
        "day": 7,
        "impressions": 68299,
        "clicks": 866,
        "conversions": 70,
        "spend": 666.56,
        "revenue": 9179.72,
        "ctr": 1.268,
        "cvr": 8.0831
      },
      {
        "date": "2026-01-30",
        "day": 8,
        "impressions": 61764,
        "clicks": 796,
        "conversions": 56,
        "spend": 642.09,
        "revenue": 8416.78,
        "ctr": 1.2888,
        "cvr": 7.0352
      },
      {
        "date": "2026-01-31",
        "day": 9,
        "impressions": 68813,
        "clicks": 764,
        "conversions": 46,
        "spend": 698.29,
        "revenue": 5994.34,
        "ctr": 1.1103,
        "cvr": 6.0209
      },
      {
        "date": "2026-02-01",
        "day": 10,
        "impressions": 102847,
        "clicks": 1058,
        "conversions": 92,
        "spend": 1037.92,
        "revenue": 11725.41,
        "ctr": 1.0287,
        "cvr": 8.6957
      },
      {
        "date": "2026-02-02",
        "day": 11,
        "impressions": 72749,
        "clicks": 754,
        "conversions": 71,
        "spend": 714.53,
        "revenue": 10043.7,
        "ctr": 1.0364,
        "cvr": 9.4164
      },
      {
        "date": "2026-02-03",
        "day": 12,
        "impressions": 60328,
        "clicks": 631,
        "conversions": 52,
        "spend": 609.89,
        "revenue": 6965.31,
        "ctr": 1.0459,
        "cvr": 8.2409
      },
      {
        "date": "2026-02-04",
        "day": 13,
        "impressions": 66346,
        "clicks": 637,
        "conversions": 44,
        "spend": 649.98,
        "revenue": 6311.14,
        "ctr": 0.9601,
        "cvr": 6.9074
      },
      {
        "date": "2026-02-05",
        "day": 14,
        "impressions": 69207,
        "clicks": 649,
        "conversions": 37,
        "spend": 688.94,
        "revenue": 6201.04,
        "ctr": 0.9378,
        "cvr": 5.7011
      },
      {
        "date": "2026-02-06",
        "day": 15,
        "impressions": 60977,
        "clicks": 519,
        "conversions": 26,
        "spend": 644.3,
        "revenue": 4207.31,
        "ctr": 0.8511,
        "cvr": 5.0096
      },
      {
        "date": "2026-02-07",
        "day": 16,
        "impressions": 58552,
        "clicks": 463,
        "conversions": 40,
        "spend": 622.98,
        "revenue": 6115.07,
        "ctr": 0.7908,
        "cvr": 8.6393
      },
      {
        "date": "2026-02-08",
        "day": 17,
        "impressions": 67922,
        "clicks": 533,
        "conversions": 39,
        "spend": 705.42,
        "revenue": 5372.54,
        "ctr": 0.7847,
        "cvr": 7.3171
      },
      {
        "date": "2026-02-09",
        "day": 18,
        "impressions": 57383,
        "clicks": 398,
        "conversions": 31,
        "spend": 571.33,
        "revenue": 5237.52,
        "ctr": 0.6936,
        "cvr": 7.7889
      },
      {
        "date": "2026-02-10",
        "day": 19,
        "impressions": 66966,
        "clicks": 502,
        "conversions": 24,
        "spend": 670.37,
        "revenue": 3433.94,
        "ctr": 0.7496,
        "cvr": 4.7809
      },
      {
        "date": "2026-02-11",
        "day": 20,
        "impressions": 58111,
        "clicks": 349,
        "conversions": 20,
        "spend": 581.69,
        "revenue": 2540.06,
        "ctr": 0.6006,
        "cvr": 5.7307
      },
      {
        "date": "2026-02-12",
        "day": 21,
        "impressions": 74506,
        "clicks": 490,
        "conversions": 32,
        "spend": 790.14,
        "revenue": 4616.57,
        "ctr": 0.6577,
        "cvr": 6.5306
      },
      {
        "date": "2026-02-13",
        "day": 22,
        "impressions": 60176,
        "clicks": 357,
        "conversions": 20,
        "spend": 606.73,
        "revenue": 2516.39,
        "ctr": 0.5933,
        "cvr": 5.6022
      },
      {
        "date": "2026-02-14",
        "day": 23,
        "impressions": 71618,
        "clicks": 464,
        "conversions": 47,
        "spend": 821.95,
        "revenue": 6974.63,
        "ctr": 0.6479,
        "cvr": 10.1293
      },
      {
        "date": "2026-02-15",
        "day": 24,
        "impressions": 72079,
        "clicks": 383,
        "conversions": 25,
        "spend": 709.07,
        "revenue": 3372.78,
        "ctr": 0.5314,
        "cvr": 6.5274
      },
      {
        "date": "2026-02-16",
        "day": 25,
        "impressions": 65245,
        "clicks": 373,
        "conversions": 21,
        "spend": 682.35,
        "revenue": 3077.41,
        "ctr": 0.5717,
        "cvr": 5.63
      },
      {
        "date": "2026-02-17",
        "day": 26,
        "impressions": 77881,
        "clicks": 414,
        "conversions": 27,
        "spend": 824.78,
        "revenue": 3779.84,
        "ctr": 0.5316,
        "cvr": 6.5217
      },
      {
        "date": "2026-02-18",
        "day": 27,
        "impressions": 61614,
        "clicks": 281,
        "conversions": 14,
        "spend": 623.04,
        "revenue": 1991.18,
        "ctr": 0.4561,
        "cvr": 4.9822
      },
      {
        "date": "2026-02-19",
        "day": 28,
        "impressions": 55476,
        "clicks": 260,
        "conversions": 18,
        "spend": 572.42,
        "revenue": 2558.65,
        "ctr": 0.4687,
        "cvr": 6.9231
      },
      {
        "date": "2026-02-20",
        "day": 29,
        "impressions": 88649,
        "clicks": 364,
        "conversions": 28,
        "spend": 891.57,
        "revenue": 3462.84,
        "ctr": 0.4106,
        "cvr": 7.6923
      },
      {
        "date": "2026-02-21",
        "day": 30,
        "impressions": 83192,
        "clicks": 359,
        "conversions": 30,
        "spend": 827.41,
        "revenue": 4329.2,
        "ctr": 0.4315,
        "cvr": 8.3565
      },
      {
        "date": "2026-02-22",
        "day": 31,
        "impressions": 81202,
        "clicks": 339,
        "conversions": 26,
        "spend": 804.87,
        "revenue": 3737.18,
        "ctr": 0.4175,
        "cvr": 7.6696
      },
      {
        "date": "2026-02-23",
        "day": 32,
        "impressions": 68184,
        "clicks": 282,
        "conversions": 19,
        "spend": 638.72,
        "revenue": 2260.47,
        "ctr": 0.4136,
        "cvr": 6.7376
      },
      {
        "date": "2026-02-24",
        "day": 33,
        "impressions": 56228,
        "clicks": 225,
        "conversions": 21,
        "spend": 591.2,
        "revenue": 2842.55,
        "ctr": 0.4002,
        "cvr": 9.3333
      },
      {
        "date": "2026-02-25",
        "day": 34,
        "impressions": 70707,
        "clicks": 228,
        "conversions": 10,
        "spend": 673.81,
        "revenue": 1487.42,
        "ctr": 0.3225,
        "cvr": 4.386
      },
      {
        "date": "2026-02-26",
        "day": 35,
        "impressions": 66195,
        "clicks": 231,
        "conversions": 10,
        "spend": 650.92,
        "revenue": 1253.68,
        "ctr": 0.349,
        "cvr": 4.329
      },
      {
        "date": "2026-02-27",
        "day": 36,
        "impressions": 69753,
        "clicks": 222,
        "conversions": 18,
        "spend": 741.11,
        "revenue": 2565.41,
        "ctr": 0.3183,
        "cvr": 8.1081
      },
      {
        "date": "2026-02-28",
        "day": 37,
        "impressions": 78809,
        "clicks": 253,
        "conversions": 14,
        "spend": 785.87,
        "revenue": 1858.06,
        "ctr": 0.321,
        "cvr": 5.5336
      },
      {
        "date": "2026-03-01",
        "day": 38,
        "impressions": 70180,
        "clicks": 160,
        "conversions": 6,
        "spend": 762.95,
        "revenue": 824.91,
        "ctr": 0.228,
        "cvr": 3.75
      },
      {
        "date": "2026-03-02",
        "day": 39,
        "impressions": 82150,
        "clicks": 248,
        "conversions": 18,
        "spend": 826.07,
        "revenue": 2483.48,
        "ctr": 0.3019,
        "cvr": 7.2581
      },
      {
        "date": "2026-03-03",
        "day": 40,
        "impressions": 69524,
        "clicks": 159,
        "conversions": 10,
        "spend": 666.43,
        "revenue": 1496.43,
        "ctr": 0.2287,
        "cvr": 6.2893
      },
      {
        "date": "2026-03-04",
        "day": 41,
        "impressions": 75568,
        "clicks": 168,
        "conversions": 10,
        "spend": 699.22,
        "revenue": 1511.08,
        "ctr": 0.2223,
        "cvr": 5.9524
      },
      {
        "date": "2026-03-05",
        "day": 42,
        "impressions": 89923,
        "clicks": 210,
        "conversions": 11,
        "spend": 924.94,
        "revenue": 1688.77,
        "ctr": 0.2335,
        "cvr": 5.2381
      },
      {
        "date": "2026-03-06",
        "day": 43,
        "impressions": 64717,
        "clicks": 141,
        "conversions": 10,
        "spend": 657.59,
        "revenue": 1413.97,
        "ctr": 0.2179,
        "cvr": 7.0922
      }
    ],
    "recommendation": {
      "headline": "CTR dropped 82% by day 13 — audience saturation detected.",
      "reasons": [
        {
          "label": "Performance trend",
          "text": "CTR fell from 1.39% in week 1 to 0.25% in the last 7 days."
        },
        {
          "label": "Visual factor",
          "text": "Medium text density combined with Playful tone is losing novelty."
        },
        {
          "label": "Brain-inspired signal",
          "text": "Predicted novelty response is 59 — viewers are no longer surprised."
        }
      ],
      "nextBestTest": "Refresh the first 3 seconds with a new gameplay hook; keep the Start now CTA which still converts."
    },
    "assetUrl": "/creatives/creative_500489.png"
  },
  {
    "id": "CR-500632",
    "rawId": 500632,
    "campaignId": 20105,
    "advertiserName": "NomadLayer",
    "appName": "NomadLayer Flights",
    "vertical": "travel",
    "verticalDisplay": "Travel",
    "format": "rewarded_video",
    "formatDisplay": "Rewarded Video",
    "campaignCountries": [
      "FR",
      "BR",
      "ES",
      "UK"
    ],
    "campaignOs": "iOS",
    "supportedOs": [
      "iOS"
    ],
    "status": "Fatigued",
    "rawStatus": "fatigued",
    "action": "Pivot",
    "ctr": 0.82,
    "cvr": 5.83,
    "roas": 8.9,
    "ipm": 0.48,
    "spend": 35498,
    "impressions": 4585648,
    "clicks": 37626,
    "conversions": 2195,
    "revenue": 315791,
    "daysActive": 46,
    "launchDate": "2026-01-17",
    "fatigueDay": 10,
    "fatigueRisk": 97,
    "healthScore": 75,
    "metadata": {
      "ctaText": "Get offer",
      "headline": "Fly smarter",
      "subhead": "Special fares today",
      "dominantColor": "blue",
      "dominantColorHex": "#2563EB",
      "tone": "trustworthy",
      "textDensity": "High",
      "hookType": "escape",
      "theme": "drama",
      "language": "fr",
      "durationSec": 15,
      "hasGameplay": false,
      "hasUgcStyle": false,
      "hasPrice": false,
      "hasDiscountBadge": true,
      "facesCount": 1,
      "productCount": 0,
      "brandVisibility": 57,
      "novelty": 77,
      "motion": 67,
      "readability": 79,
      "clutter": 17
    },
    "brainScores": {
      "attention": 68,
      "recall": 66,
      "cognitiveLoad": 41,
      "engagement": 69,
      "noveltyResponse": 74,
      "messageClarity": 48
    },
    "timeSeries": [
      {
        "date": "2026-01-17",
        "day": 0,
        "impressions": 426380,
        "clicks": 5976,
        "conversions": 397,
        "spend": 3331.32,
        "revenue": 50435.01,
        "ctr": 1.4016,
        "cvr": 6.6432
      },
      {
        "date": "2026-01-18",
        "day": 1,
        "impressions": 421641,
        "clicks": 5439,
        "conversions": 315,
        "spend": 3106.51,
        "revenue": 48414.65,
        "ctr": 1.29,
        "cvr": 5.7915
      },
      {
        "date": "2026-01-19",
        "day": 2,
        "impressions": 322172,
        "clicks": 4330,
        "conversions": 276,
        "spend": 2543.71,
        "revenue": 39100.61,
        "ctr": 1.344,
        "cvr": 6.3741
      },
      {
        "date": "2026-01-20",
        "day": 3,
        "impressions": 329203,
        "clicks": 4010,
        "conversions": 235,
        "spend": 2586.32,
        "revenue": 38166.19,
        "ctr": 1.2181,
        "cvr": 5.8603
      },
      {
        "date": "2026-01-21",
        "day": 4,
        "impressions": 277479,
        "clicks": 2989,
        "conversions": 174,
        "spend": 2207.14,
        "revenue": 24091.21,
        "ctr": 1.0772,
        "cvr": 5.8213
      },
      {
        "date": "2026-01-22",
        "day": 5,
        "impressions": 317617,
        "clicks": 3136,
        "conversions": 165,
        "spend": 2533.11,
        "revenue": 24875.76,
        "ctr": 0.9874,
        "cvr": 5.2615
      },
      {
        "date": "2026-01-23",
        "day": 6,
        "impressions": 136255,
        "clicks": 1132,
        "conversions": 63,
        "spend": 1036,
        "revenue": 8289.09,
        "ctr": 0.8308,
        "cvr": 5.5654
      },
      {
        "date": "2026-01-24",
        "day": 7,
        "impressions": 180231,
        "clicks": 1522,
        "conversions": 81,
        "spend": 1382.73,
        "revenue": 11917.44,
        "ctr": 0.8445,
        "cvr": 5.3219
      },
      {
        "date": "2026-01-25",
        "day": 8,
        "impressions": 214605,
        "clicks": 1684,
        "conversions": 95,
        "spend": 1648.54,
        "revenue": 14090.4,
        "ctr": 0.7847,
        "cvr": 5.6413
      },
      {
        "date": "2026-01-26",
        "day": 9,
        "impressions": 100238,
        "clicks": 714,
        "conversions": 43,
        "spend": 784.88,
        "revenue": 6273.86,
        "ctr": 0.7123,
        "cvr": 6.0224
      },
      {
        "date": "2026-01-27",
        "day": 10,
        "impressions": 90924,
        "clicks": 615,
        "conversions": 33,
        "spend": 699.63,
        "revenue": 4858.47,
        "ctr": 0.6764,
        "cvr": 5.3659
      },
      {
        "date": "2026-01-28",
        "day": 11,
        "impressions": 64245,
        "clicks": 437,
        "conversions": 22,
        "spend": 483.73,
        "revenue": 3042.49,
        "ctr": 0.6802,
        "cvr": 5.0343
      },
      {
        "date": "2026-01-29",
        "day": 12,
        "impressions": 53736,
        "clicks": 375,
        "conversions": 20,
        "spend": 403.98,
        "revenue": 2560.13,
        "ctr": 0.6979,
        "cvr": 5.3333
      },
      {
        "date": "2026-01-30",
        "day": 13,
        "impressions": 47852,
        "clicks": 274,
        "conversions": 13,
        "spend": 362.84,
        "revenue": 1904.21,
        "ctr": 0.5726,
        "cvr": 4.7445
      },
      {
        "date": "2026-01-31",
        "day": 14,
        "impressions": 52074,
        "clicks": 282,
        "conversions": 9,
        "spend": 390.52,
        "revenue": 1285.22,
        "ctr": 0.5415,
        "cvr": 3.1915
      },
      {
        "date": "2026-02-01",
        "day": 15,
        "impressions": 57849,
        "clicks": 310,
        "conversions": 11,
        "spend": 450.5,
        "revenue": 1591.91,
        "ctr": 0.5359,
        "cvr": 3.5484
      },
      {
        "date": "2026-02-02",
        "day": 16,
        "impressions": 38147,
        "clicks": 201,
        "conversions": 8,
        "spend": 280.6,
        "revenue": 1200.36,
        "ctr": 0.5269,
        "cvr": 3.9801
      },
      {
        "date": "2026-02-03",
        "day": 17,
        "impressions": 48254,
        "clicks": 241,
        "conversions": 10,
        "spend": 392.92,
        "revenue": 1318.95,
        "ctr": 0.4994,
        "cvr": 4.1494
      },
      {
        "date": "2026-02-04",
        "day": 18,
        "impressions": 44957,
        "clicks": 206,
        "conversions": 9,
        "spend": 329.31,
        "revenue": 1418.27,
        "ctr": 0.4582,
        "cvr": 4.3689
      },
      {
        "date": "2026-02-05",
        "day": 19,
        "impressions": 46238,
        "clicks": 211,
        "conversions": 11,
        "spend": 368.62,
        "revenue": 1562.32,
        "ctr": 0.4563,
        "cvr": 5.2133
      },
      {
        "date": "2026-02-06",
        "day": 20,
        "impressions": 53310,
        "clicks": 246,
        "conversions": 11,
        "spend": 430.56,
        "revenue": 1747.25,
        "ctr": 0.4615,
        "cvr": 4.4715
      },
      {
        "date": "2026-02-07",
        "day": 21,
        "impressions": 36616,
        "clicks": 178,
        "conversions": 9,
        "spend": 301.09,
        "revenue": 1152.15,
        "ctr": 0.4861,
        "cvr": 5.0562
      },
      {
        "date": "2026-02-08",
        "day": 22,
        "impressions": 48292,
        "clicks": 211,
        "conversions": 10,
        "spend": 378.07,
        "revenue": 1437.9,
        "ctr": 0.4369,
        "cvr": 4.7393
      },
      {
        "date": "2026-02-09",
        "day": 23,
        "impressions": 48548,
        "clicks": 191,
        "conversions": 7,
        "spend": 379.71,
        "revenue": 999.03,
        "ctr": 0.3934,
        "cvr": 3.6649
      },
      {
        "date": "2026-02-10",
        "day": 24,
        "impressions": 44024,
        "clicks": 141,
        "conversions": 9,
        "spend": 342.18,
        "revenue": 1380.82,
        "ctr": 0.3203,
        "cvr": 6.383
      },
      {
        "date": "2026-02-11",
        "day": 25,
        "impressions": 43963,
        "clicks": 156,
        "conversions": 7,
        "spend": 337.41,
        "revenue": 1091.96,
        "ctr": 0.3548,
        "cvr": 4.4872
      },
      {
        "date": "2026-02-12",
        "day": 26,
        "impressions": 46183,
        "clicks": 140,
        "conversions": 6,
        "spend": 359.27,
        "revenue": 846.53,
        "ctr": 0.3031,
        "cvr": 4.2857
      },
      {
        "date": "2026-02-13",
        "day": 27,
        "impressions": 48688,
        "clicks": 139,
        "conversions": 9,
        "spend": 380.48,
        "revenue": 1194.86,
        "ctr": 0.2855,
        "cvr": 6.4748
      },
      {
        "date": "2026-02-14",
        "day": 28,
        "impressions": 51502,
        "clicks": 177,
        "conversions": 10,
        "spend": 394.85,
        "revenue": 1376.62,
        "ctr": 0.3437,
        "cvr": 5.6497
      },
      {
        "date": "2026-02-15",
        "day": 29,
        "impressions": 53973,
        "clicks": 164,
        "conversions": 7,
        "spend": 418.25,
        "revenue": 947.96,
        "ctr": 0.3039,
        "cvr": 4.2683
      },
      {
        "date": "2026-02-16",
        "day": 30,
        "impressions": 39455,
        "clicks": 120,
        "conversions": 8,
        "spend": 324.24,
        "revenue": 1085.55,
        "ctr": 0.3041,
        "cvr": 6.6667
      },
      {
        "date": "2026-02-17",
        "day": 31,
        "impressions": 47174,
        "clicks": 115,
        "conversions": 7,
        "spend": 368.39,
        "revenue": 908.9,
        "ctr": 0.2438,
        "cvr": 6.087
      },
      {
        "date": "2026-02-18",
        "day": 32,
        "impressions": 55725,
        "clicks": 127,
        "conversions": 13,
        "spend": 423.87,
        "revenue": 1977.89,
        "ctr": 0.2279,
        "cvr": 10.2362
      },
      {
        "date": "2026-02-19",
        "day": 33,
        "impressions": 44871,
        "clicks": 125,
        "conversions": 7,
        "spend": 347.78,
        "revenue": 1024.14,
        "ctr": 0.2786,
        "cvr": 5.6
      },
      {
        "date": "2026-02-20",
        "day": 34,
        "impressions": 50384,
        "clicks": 119,
        "conversions": 11,
        "spend": 362.15,
        "revenue": 1464.36,
        "ctr": 0.2362,
        "cvr": 9.2437
      },
      {
        "date": "2026-02-21",
        "day": 35,
        "impressions": 50555,
        "clicks": 126,
        "conversions": 7,
        "spend": 368.49,
        "revenue": 964.26,
        "ctr": 0.2492,
        "cvr": 5.5556
      },
      {
        "date": "2026-02-22",
        "day": 36,
        "impressions": 61369,
        "clicks": 142,
        "conversions": 7,
        "spend": 454.19,
        "revenue": 1084.88,
        "ctr": 0.2314,
        "cvr": 4.9296
      },
      {
        "date": "2026-02-23",
        "day": 37,
        "impressions": 42441,
        "clicks": 87,
        "conversions": 4,
        "spend": 351.22,
        "revenue": 581.58,
        "ctr": 0.205,
        "cvr": 4.5977
      },
      {
        "date": "2026-02-24",
        "day": 38,
        "impressions": 56214,
        "clicks": 108,
        "conversions": 9,
        "spend": 425.05,
        "revenue": 1309.67,
        "ctr": 0.1921,
        "cvr": 8.3333
      },
      {
        "date": "2026-02-25",
        "day": 39,
        "impressions": 50407,
        "clicks": 94,
        "conversions": 6,
        "spend": 397.29,
        "revenue": 808.21,
        "ctr": 0.1865,
        "cvr": 6.383
      },
      {
        "date": "2026-02-26",
        "day": 40,
        "impressions": 60234,
        "clicks": 121,
        "conversions": 8,
        "spend": 464.33,
        "revenue": 1115.59,
        "ctr": 0.2009,
        "cvr": 6.6116
      },
      {
        "date": "2026-02-27",
        "day": 41,
        "impressions": 61460,
        "clicks": 112,
        "conversions": 7,
        "spend": 452.85,
        "revenue": 1090.46,
        "ctr": 0.1822,
        "cvr": 6.25
      },
      {
        "date": "2026-02-28",
        "day": 42,
        "impressions": 48858,
        "clicks": 108,
        "conversions": 5,
        "spend": 380.17,
        "revenue": 746.09,
        "ctr": 0.221,
        "cvr": 4.6296
      },
      {
        "date": "2026-03-01",
        "day": 43,
        "impressions": 54989,
        "clicks": 96,
        "conversions": 6,
        "spend": 434.06,
        "revenue": 790.87,
        "ctr": 0.1746,
        "cvr": 6.25
      },
      {
        "date": "2026-03-02",
        "day": 44,
        "impressions": 55808,
        "clicks": 99,
        "conversions": 7,
        "spend": 413.25,
        "revenue": 938.59,
        "ctr": 0.1774,
        "cvr": 7.0707
      },
      {
        "date": "2026-03-03",
        "day": 45,
        "impressions": 60508,
        "clicks": 100,
        "conversions": 8,
        "spend": 485.75,
        "revenue": 1327.89,
        "ctr": 0.1653,
        "cvr": 8
      }
    ],
    "recommendation": {
      "headline": "CTR dropped 85% by day 10 — audience saturation detected.",
      "reasons": [
        {
          "label": "Performance trend",
          "text": "CTR fell from 1.21% in week 1 to 0.19% in the last 7 days."
        },
        {
          "label": "Visual factor",
          "text": "High text density combined with trustworthy tone is losing novelty."
        },
        {
          "label": "Brain-inspired signal",
          "text": "Predicted novelty response is 74 — viewers are no longer surprised."
        }
      ],
      "nextBestTest": "Refresh the first 3 seconds with a new gameplay hook; keep the Get offer CTA which still converts."
    },
    "assetUrl": "/creatives/creative_500632.png"
  },
  {
    "id": "CR-500849",
    "rawId": 500849,
    "campaignId": 20141,
    "advertiserName": "NomadLayer",
    "appName": "NomadLayer Travel",
    "vertical": "travel",
    "verticalDisplay": "Travel",
    "format": "rewarded_video",
    "formatDisplay": "Rewarded Video",
    "campaignCountries": [
      "CA",
      "DE",
      "US",
      "UK"
    ],
    "campaignOs": "iOS",
    "supportedOs": [
      "iOS"
    ],
    "status": "Top Performer",
    "rawStatus": "top_performer",
    "action": "Scale",
    "ctr": 1.11,
    "cvr": 7.23,
    "roas": 10.27,
    "ipm": 0.8,
    "spend": 18570,
    "impressions": 1656554,
    "clicks": 18413,
    "conversions": 1332,
    "revenue": 190724,
    "daysActive": 31,
    "launchDate": "2026-01-17",
    "fatigueDay": null,
    "fatigueRisk": 30,
    "healthScore": 94,
    "metadata": {
      "ctaText": "Learn more",
      "headline": "Dream destinations await",
      "subhead": "Flexible booking options",
      "dominantColor": "purple",
      "dominantColorHex": "#7C3AED",
      "tone": "adventurous",
      "textDensity": "Medium",
      "hookType": "book now",
      "theme": "discount",
      "language": "en",
      "durationSec": 10,
      "hasGameplay": false,
      "hasUgcStyle": true,
      "hasPrice": true,
      "hasDiscountBadge": true,
      "facesCount": 1,
      "productCount": 0,
      "brandVisibility": 62,
      "novelty": 68,
      "motion": 84,
      "readability": 87,
      "clutter": 33
    },
    "brainScores": {
      "attention": 75,
      "recall": 66,
      "cognitiveLoad": 33,
      "engagement": 71,
      "noveltyResponse": 73,
      "messageClarity": 72
    },
    "timeSeries": [
      {
        "date": "2026-01-17",
        "day": 0,
        "impressions": 60420,
        "clicks": 845,
        "conversions": 68,
        "spend": 714.39,
        "revenue": 9980.31,
        "ctr": 1.3985,
        "cvr": 8.0473
      },
      {
        "date": "2026-01-18",
        "day": 1,
        "impressions": 69920,
        "clicks": 1069,
        "conversions": 77,
        "spend": 784,
        "revenue": 11030.34,
        "ctr": 1.5289,
        "cvr": 7.203
      },
      {
        "date": "2026-01-19",
        "day": 2,
        "impressions": 60178,
        "clicks": 910,
        "conversions": 73,
        "spend": 664.92,
        "revenue": 10658.86,
        "ctr": 1.5122,
        "cvr": 8.022
      },
      {
        "date": "2026-01-20",
        "day": 3,
        "impressions": 61065,
        "clicks": 1055,
        "conversions": 70,
        "spend": 681.17,
        "revenue": 10816.44,
        "ctr": 1.7277,
        "cvr": 6.6351
      },
      {
        "date": "2026-01-21",
        "day": 4,
        "impressions": 60525,
        "clicks": 1023,
        "conversions": 74,
        "spend": 665.84,
        "revenue": 10568.03,
        "ctr": 1.6902,
        "cvr": 7.2336
      },
      {
        "date": "2026-01-22",
        "day": 5,
        "impressions": 59888,
        "clicks": 911,
        "conversions": 74,
        "spend": 667.49,
        "revenue": 10258.16,
        "ctr": 1.5212,
        "cvr": 8.1229
      },
      {
        "date": "2026-01-23",
        "day": 6,
        "impressions": 52890,
        "clicks": 812,
        "conversions": 57,
        "spend": 625.38,
        "revenue": 8249.84,
        "ctr": 1.5353,
        "cvr": 7.0197
      },
      {
        "date": "2026-01-24",
        "day": 7,
        "impressions": 53875,
        "clicks": 726,
        "conversions": 60,
        "spend": 598.67,
        "revenue": 9481,
        "ctr": 1.3476,
        "cvr": 8.2645
      },
      {
        "date": "2026-01-25",
        "day": 8,
        "impressions": 59219,
        "clicks": 796,
        "conversions": 51,
        "spend": 698.57,
        "revenue": 7795.74,
        "ctr": 1.3442,
        "cvr": 6.407
      },
      {
        "date": "2026-01-26",
        "day": 9,
        "impressions": 56981,
        "clicks": 756,
        "conversions": 46,
        "spend": 631.98,
        "revenue": 6468.02,
        "ctr": 1.3268,
        "cvr": 6.0847
      },
      {
        "date": "2026-01-27",
        "day": 10,
        "impressions": 52543,
        "clicks": 687,
        "conversions": 52,
        "spend": 595.5,
        "revenue": 6961.98,
        "ctr": 1.3075,
        "cvr": 7.5691
      },
      {
        "date": "2026-01-28",
        "day": 11,
        "impressions": 55452,
        "clicks": 693,
        "conversions": 63,
        "spend": 594.71,
        "revenue": 8423.77,
        "ctr": 1.2497,
        "cvr": 9.0909
      },
      {
        "date": "2026-01-29",
        "day": 12,
        "impressions": 58025,
        "clicks": 694,
        "conversions": 43,
        "spend": 689.38,
        "revenue": 6717.43,
        "ctr": 1.196,
        "cvr": 6.196
      },
      {
        "date": "2026-01-30",
        "day": 13,
        "impressions": 54904,
        "clicks": 684,
        "conversions": 49,
        "spend": 611.95,
        "revenue": 6391.12,
        "ctr": 1.2458,
        "cvr": 7.1637
      },
      {
        "date": "2026-01-31",
        "day": 14,
        "impressions": 53682,
        "clicks": 629,
        "conversions": 50,
        "spend": 591.42,
        "revenue": 6695.64,
        "ctr": 1.1717,
        "cvr": 7.9491
      },
      {
        "date": "2026-02-01",
        "day": 15,
        "impressions": 49054,
        "clicks": 458,
        "conversions": 18,
        "spend": 546.08,
        "revenue": 2547.59,
        "ctr": 0.9337,
        "cvr": 3.9301
      },
      {
        "date": "2026-02-02",
        "day": 16,
        "impressions": 42383,
        "clicks": 436,
        "conversions": 27,
        "spend": 482.73,
        "revenue": 3914.98,
        "ctr": 1.0287,
        "cvr": 6.1927
      },
      {
        "date": "2026-02-03",
        "day": 17,
        "impressions": 44530,
        "clicks": 442,
        "conversions": 32,
        "spend": 496.75,
        "revenue": 4824.03,
        "ctr": 0.9926,
        "cvr": 7.2398
      },
      {
        "date": "2026-02-04",
        "day": 18,
        "impressions": 47332,
        "clicks": 452,
        "conversions": 27,
        "spend": 514.78,
        "revenue": 3623.19,
        "ctr": 0.955,
        "cvr": 5.9735
      },
      {
        "date": "2026-02-05",
        "day": 19,
        "impressions": 46616,
        "clicks": 402,
        "conversions": 25,
        "spend": 530.98,
        "revenue": 3778.61,
        "ctr": 0.8624,
        "cvr": 6.2189
      },
      {
        "date": "2026-02-06",
        "day": 20,
        "impressions": 58402,
        "clicks": 501,
        "conversions": 37,
        "spend": 620.38,
        "revenue": 4826.28,
        "ctr": 0.8578,
        "cvr": 7.3852
      },
      {
        "date": "2026-02-07",
        "day": 21,
        "impressions": 50047,
        "clicks": 391,
        "conversions": 29,
        "spend": 560.22,
        "revenue": 4350.84,
        "ctr": 0.7813,
        "cvr": 7.4169
      },
      {
        "date": "2026-02-08",
        "day": 22,
        "impressions": 49273,
        "clicks": 379,
        "conversions": 28,
        "spend": 554.45,
        "revenue": 3555.68,
        "ctr": 0.7692,
        "cvr": 7.3879
      },
      {
        "date": "2026-02-09",
        "day": 23,
        "impressions": 44371,
        "clicks": 339,
        "conversions": 27,
        "spend": 479.29,
        "revenue": 4026.34,
        "ctr": 0.764,
        "cvr": 7.9646
      },
      {
        "date": "2026-02-10",
        "day": 24,
        "impressions": 53293,
        "clicks": 423,
        "conversions": 36,
        "spend": 599,
        "revenue": 4905.8,
        "ctr": 0.7937,
        "cvr": 8.5106
      },
      {
        "date": "2026-02-11",
        "day": 25,
        "impressions": 49100,
        "clicks": 313,
        "conversions": 14,
        "spend": 541.45,
        "revenue": 2050.54,
        "ctr": 0.6375,
        "cvr": 4.4728
      },
      {
        "date": "2026-02-12",
        "day": 26,
        "impressions": 44429,
        "clicks": 296,
        "conversions": 28,
        "spend": 497.96,
        "revenue": 3869.7,
        "ctr": 0.6662,
        "cvr": 9.4595
      },
      {
        "date": "2026-02-13",
        "day": 27,
        "impressions": 50120,
        "clicks": 349,
        "conversions": 29,
        "spend": 569.48,
        "revenue": 3813.3,
        "ctr": 0.6963,
        "cvr": 8.3095
      },
      {
        "date": "2026-02-14",
        "day": 28,
        "impressions": 63249,
        "clicks": 359,
        "conversions": 25,
        "spend": 723.32,
        "revenue": 3975.43,
        "ctr": 0.5676,
        "cvr": 6.9638
      },
      {
        "date": "2026-02-15",
        "day": 29,
        "impressions": 50216,
        "clicks": 311,
        "conversions": 19,
        "spend": 546.2,
        "revenue": 2774.49,
        "ctr": 0.6193,
        "cvr": 6.1093
      },
      {
        "date": "2026-02-16",
        "day": 30,
        "impressions": 44572,
        "clicks": 272,
        "conversions": 24,
        "spend": 491.26,
        "revenue": 3390.74,
        "ctr": 0.6102,
        "cvr": 8.8235
      }
    ],
    "recommendation": {
      "headline": "Sustained 1.11% CTR with 10.27x ROAS — strong scaling candidate.",
      "reasons": [
        {
          "label": "Performance trend",
          "text": "ROAS holds at 10.27x across 31 active days."
        },
        {
          "label": "Visual factor",
          "text": "Rewarded Video format with medium text density and adventurous tone."
        },
        {
          "label": "Brain-inspired signal",
          "text": "Predicted attention 75 and engagement 71 — top quartile in this vertical."
        }
      ],
      "nextBestTest": "Increase daily spend by 30% on this creative; clone the book now hook into a 6s rewarded video for cross-format coverage."
    },
    "assetUrl": "/creatives/creative_500849.png"
  },
  {
    "id": "CR-500828",
    "rawId": 500828,
    "campaignId": 20138,
    "advertiserName": "IronQuest",
    "appName": "IronQuest Rush",
    "vertical": "gaming",
    "verticalDisplay": "Gaming",
    "format": "rewarded_video",
    "formatDisplay": "Rewarded Video",
    "campaignCountries": [
      "IT",
      "JP",
      "BR"
    ],
    "campaignOs": "Android",
    "supportedOs": [
      "Android"
    ],
    "status": "Top Performer",
    "rawStatus": "top_performer",
    "action": "Scale",
    "ctr": 1.23,
    "cvr": 18.74,
    "roas": 3.23,
    "ipm": 2.3,
    "spend": 11378,
    "impressions": 2889654,
    "clicks": 35519,
    "conversions": 6657,
    "revenue": 36794,
    "daysActive": 39,
    "launchDate": "2026-02-06",
    "fatigueDay": null,
    "fatigueRisk": 32,
    "healthScore": 86,
    "metadata": {
      "ctaText": "Get offer",
      "headline": "Beat your rivals",
      "subhead": "No ads in first week",
      "dominantColor": "blue",
      "dominantColorHex": "#2563EB",
      "tone": "urgent",
      "textDensity": "Low",
      "hookType": "free rewards",
      "theme": "gameplay",
      "language": "ja",
      "durationSec": 30,
      "hasGameplay": true,
      "hasUgcStyle": false,
      "hasPrice": false,
      "hasDiscountBadge": false,
      "facesCount": 1,
      "productCount": 1,
      "brandVisibility": 45,
      "novelty": 99,
      "motion": 97,
      "readability": 78,
      "clutter": 53
    },
    "brainScores": {
      "attention": 91,
      "recall": 49,
      "cognitiveLoad": 38,
      "engagement": 60,
      "noveltyResponse": 98,
      "messageClarity": 76
    },
    "timeSeries": [
      {
        "date": "2026-02-06",
        "day": 0,
        "impressions": 71931,
        "clicks": 1334,
        "conversions": 282,
        "spend": 280.71,
        "revenue": 1777.77,
        "ctr": 1.8546,
        "cvr": 21.1394
      },
      {
        "date": "2026-02-07",
        "day": 1,
        "impressions": 86567,
        "clicks": 1692,
        "conversions": 322,
        "spend": 327.24,
        "revenue": 1547.3,
        "ctr": 1.9546,
        "cvr": 19.0307
      },
      {
        "date": "2026-02-08",
        "day": 2,
        "impressions": 72346,
        "clicks": 1464,
        "conversions": 320,
        "spend": 279.28,
        "revenue": 1857.66,
        "ctr": 2.0236,
        "cvr": 21.8579
      },
      {
        "date": "2026-02-09",
        "day": 3,
        "impressions": 84022,
        "clicks": 1653,
        "conversions": 302,
        "spend": 323.93,
        "revenue": 1425.99,
        "ctr": 1.9673,
        "cvr": 18.2698
      },
      {
        "date": "2026-02-10",
        "day": 4,
        "impressions": 64117,
        "clicks": 1436,
        "conversions": 256,
        "spend": 252.32,
        "revenue": 1612.47,
        "ctr": 2.2397,
        "cvr": 17.8273
      },
      {
        "date": "2026-02-11",
        "day": 5,
        "impressions": 77142,
        "clicks": 1520,
        "conversions": 297,
        "spend": 307.21,
        "revenue": 1688.41,
        "ctr": 1.9704,
        "cvr": 19.5395
      },
      {
        "date": "2026-02-12",
        "day": 6,
        "impressions": 66440,
        "clicks": 1410,
        "conversions": 294,
        "spend": 243.09,
        "revenue": 1464.92,
        "ctr": 2.1222,
        "cvr": 20.8511
      },
      {
        "date": "2026-02-13",
        "day": 7,
        "impressions": 82629,
        "clicks": 1490,
        "conversions": 280,
        "spend": 325.98,
        "revenue": 1645.35,
        "ctr": 1.8032,
        "cvr": 18.7919
      },
      {
        "date": "2026-02-14",
        "day": 8,
        "impressions": 86309,
        "clicks": 1588,
        "conversions": 302,
        "spend": 352.82,
        "revenue": 1470.99,
        "ctr": 1.8399,
        "cvr": 19.0176
      },
      {
        "date": "2026-02-15",
        "day": 9,
        "impressions": 68804,
        "clicks": 1093,
        "conversions": 223,
        "spend": 301.37,
        "revenue": 1158.83,
        "ctr": 1.5886,
        "cvr": 20.4026
      },
      {
        "date": "2026-02-16",
        "day": 10,
        "impressions": 72514,
        "clicks": 1142,
        "conversions": 180,
        "spend": 278.25,
        "revenue": 1014.19,
        "ctr": 1.5749,
        "cvr": 15.7618
      },
      {
        "date": "2026-02-17",
        "day": 11,
        "impressions": 72716,
        "clicks": 1177,
        "conversions": 226,
        "spend": 279.1,
        "revenue": 1152.46,
        "ctr": 1.6186,
        "cvr": 19.2014
      },
      {
        "date": "2026-02-18",
        "day": 12,
        "impressions": 73127,
        "clicks": 1172,
        "conversions": 217,
        "spend": 289.8,
        "revenue": 1354.82,
        "ctr": 1.6027,
        "cvr": 18.5154
      },
      {
        "date": "2026-02-19",
        "day": 13,
        "impressions": 64723,
        "clicks": 977,
        "conversions": 179,
        "spend": 256.4,
        "revenue": 1044.01,
        "ctr": 1.5095,
        "cvr": 18.3214
      },
      {
        "date": "2026-02-20",
        "day": 14,
        "impressions": 66006,
        "clicks": 881,
        "conversions": 157,
        "spend": 273.82,
        "revenue": 854.92,
        "ctr": 1.3347,
        "cvr": 17.8207
      },
      {
        "date": "2026-02-21",
        "day": 15,
        "impressions": 65364,
        "clicks": 907,
        "conversions": 166,
        "spend": 258.84,
        "revenue": 813.91,
        "ctr": 1.3876,
        "cvr": 18.3021
      },
      {
        "date": "2026-02-22",
        "day": 16,
        "impressions": 73263,
        "clicks": 927,
        "conversions": 150,
        "spend": 276.13,
        "revenue": 939.96,
        "ctr": 1.2653,
        "cvr": 16.1812
      },
      {
        "date": "2026-02-23",
        "day": 17,
        "impressions": 90673,
        "clicks": 1081,
        "conversions": 183,
        "spend": 336.65,
        "revenue": 972.74,
        "ctr": 1.1922,
        "cvr": 16.9288
      },
      {
        "date": "2026-02-24",
        "day": 18,
        "impressions": 65295,
        "clicks": 835,
        "conversions": 154,
        "spend": 254.4,
        "revenue": 813.44,
        "ctr": 1.2788,
        "cvr": 18.4431
      },
      {
        "date": "2026-02-25",
        "day": 19,
        "impressions": 77062,
        "clicks": 849,
        "conversions": 188,
        "spend": 296.54,
        "revenue": 1044.08,
        "ctr": 1.1017,
        "cvr": 22.1437
      },
      {
        "date": "2026-02-26",
        "day": 20,
        "impressions": 56634,
        "clicks": 537,
        "conversions": 94,
        "spend": 226.55,
        "revenue": 478.57,
        "ctr": 0.9482,
        "cvr": 17.5047
      },
      {
        "date": "2026-02-27",
        "day": 21,
        "impressions": 61356,
        "clicks": 649,
        "conversions": 128,
        "spend": 250.02,
        "revenue": 766.03,
        "ctr": 1.0578,
        "cvr": 19.7227
      },
      {
        "date": "2026-02-28",
        "day": 22,
        "impressions": 91177,
        "clicks": 966,
        "conversions": 175,
        "spend": 348.64,
        "revenue": 841.36,
        "ctr": 1.0595,
        "cvr": 18.1159
      },
      {
        "date": "2026-03-01",
        "day": 23,
        "impressions": 83690,
        "clicks": 835,
        "conversions": 135,
        "spend": 338.57,
        "revenue": 699.04,
        "ctr": 0.9977,
        "cvr": 16.1677
      },
      {
        "date": "2026-03-02",
        "day": 24,
        "impressions": 78783,
        "clicks": 753,
        "conversions": 140,
        "spend": 296.01,
        "revenue": 821.06,
        "ctr": 0.9558,
        "cvr": 18.5923
      },
      {
        "date": "2026-03-03",
        "day": 25,
        "impressions": 63329,
        "clicks": 596,
        "conversions": 112,
        "spend": 247.39,
        "revenue": 574.77,
        "ctr": 0.9411,
        "cvr": 18.7919
      },
      {
        "date": "2026-03-04",
        "day": 26,
        "impressions": 59857,
        "clicks": 504,
        "conversions": 93,
        "spend": 238.52,
        "revenue": 566.98,
        "ctr": 0.842,
        "cvr": 18.4524
      },
      {
        "date": "2026-03-05",
        "day": 27,
        "impressions": 63987,
        "clicks": 512,
        "conversions": 103,
        "spend": 261.5,
        "revenue": 588.39,
        "ctr": 0.8002,
        "cvr": 20.1172
      },
      {
        "date": "2026-03-06",
        "day": 28,
        "impressions": 82728,
        "clicks": 583,
        "conversions": 109,
        "spend": 317.51,
        "revenue": 569.17,
        "ctr": 0.7047,
        "cvr": 18.6964
      },
      {
        "date": "2026-03-07",
        "day": 29,
        "impressions": 94218,
        "clicks": 702,
        "conversions": 108,
        "spend": 361.49,
        "revenue": 658.35,
        "ctr": 0.7451,
        "cvr": 15.3846
      },
      {
        "date": "2026-03-08",
        "day": 30,
        "impressions": 78430,
        "clicks": 600,
        "conversions": 103,
        "spend": 328.78,
        "revenue": 669.9,
        "ctr": 0.765,
        "cvr": 17.1667
      },
      {
        "date": "2026-03-09",
        "day": 31,
        "impressions": 74144,
        "clicks": 520,
        "conversions": 93,
        "spend": 296.48,
        "revenue": 450.94,
        "ctr": 0.7013,
        "cvr": 17.8846
      },
      {
        "date": "2026-03-10",
        "day": 32,
        "impressions": 73988,
        "clicks": 505,
        "conversions": 83,
        "spend": 303.03,
        "revenue": 470.06,
        "ctr": 0.6825,
        "cvr": 16.4356
      },
      {
        "date": "2026-03-11",
        "day": 33,
        "impressions": 86770,
        "clicks": 606,
        "conversions": 122,
        "spend": 337.88,
        "revenue": 773.32,
        "ctr": 0.6984,
        "cvr": 20.132
      },
      {
        "date": "2026-03-12",
        "day": 34,
        "impressions": 77903,
        "clicks": 447,
        "conversions": 100,
        "spend": 299.76,
        "revenue": 575.03,
        "ctr": 0.5738,
        "cvr": 22.3714
      },
      {
        "date": "2026-03-13",
        "day": 35,
        "impressions": 75108,
        "clicks": 450,
        "conversions": 76,
        "spend": 300.35,
        "revenue": 406.2,
        "ctr": 0.5991,
        "cvr": 16.8889
      },
      {
        "date": "2026-03-14",
        "day": 36,
        "impressions": 61002,
        "clicks": 358,
        "conversions": 67,
        "spend": 253.4,
        "revenue": 396.85,
        "ctr": 0.5869,
        "cvr": 18.7151
      },
      {
        "date": "2026-03-15",
        "day": 37,
        "impressions": 73037,
        "clicks": 408,
        "conversions": 74,
        "spend": 303.83,
        "revenue": 431.81,
        "ctr": 0.5586,
        "cvr": 18.1373
      },
      {
        "date": "2026-03-16",
        "day": 38,
        "impressions": 72463,
        "clicks": 360,
        "conversions": 64,
        "spend": 274.77,
        "revenue": 401.64,
        "ctr": 0.4968,
        "cvr": 17.7778
      }
    ],
    "recommendation": {
      "headline": "Sustained 1.23% CTR with 3.23x ROAS — strong scaling candidate.",
      "reasons": [
        {
          "label": "Performance trend",
          "text": "ROAS holds at 3.23x across 39 active days."
        },
        {
          "label": "Visual factor",
          "text": "Rewarded Video format with low text density and urgent tone."
        },
        {
          "label": "Brain-inspired signal",
          "text": "Predicted attention 91 and engagement 60 — top quartile in this vertical."
        }
      ],
      "nextBestTest": "Increase daily spend by 30% on this creative; clone the free rewards hook into a 6s rewarded video for cross-format coverage."
    },
    "assetUrl": "/creatives/creative_500828.png"
  },
  {
    "id": "CR-500812",
    "rawId": 500812,
    "campaignId": 20135,
    "advertiserName": "WayPoint",
    "appName": "WayPoint Trips",
    "vertical": "travel",
    "verticalDisplay": "Travel",
    "format": "rewarded_video",
    "formatDisplay": "Rewarded Video",
    "campaignCountries": [
      "FR",
      "ES"
    ],
    "campaignOs": "iOS",
    "supportedOs": [
      "iOS"
    ],
    "status": "Top Performer",
    "rawStatus": "top_performer",
    "action": "Scale",
    "ctr": 0.9,
    "cvr": 5.86,
    "roas": 9.63,
    "ipm": 0.53,
    "spend": 13329,
    "impressions": 1704284,
    "clicks": 15300,
    "conversions": 896,
    "revenue": 128395,
    "daysActive": 47,
    "launchDate": "2026-01-29",
    "fatigueDay": null,
    "fatigueRisk": 31,
    "healthScore": 92,
    "metadata": {
      "ctaText": "Claim reward",
      "headline": "Last-minute savings",
      "subhead": "Hotels + flights in one tap",
      "dominantColor": "teal",
      "dominantColorHex": "#0D9488",
      "tone": "Excited",
      "textDensity": "Low",
      "hookType": "book now",
      "theme": "destination",
      "language": "es",
      "durationSec": 10,
      "hasGameplay": false,
      "hasUgcStyle": false,
      "hasPrice": false,
      "hasDiscountBadge": false,
      "facesCount": 2,
      "productCount": 1,
      "brandVisibility": 68,
      "novelty": 78,
      "motion": 67,
      "readability": 87,
      "clutter": 36
    },
    "brainScores": {
      "attention": 77,
      "recall": 69,
      "cognitiveLoad": 27,
      "engagement": 82,
      "noveltyResponse": 75,
      "messageClarity": 83
    },
    "timeSeries": [
      {
        "date": "2026-01-29",
        "day": 0,
        "impressions": 37701,
        "clicks": 442,
        "conversions": 18,
        "spend": 282.72,
        "revenue": 2248.16,
        "ctr": 1.1724,
        "cvr": 4.0724
      },
      {
        "date": "2026-01-30",
        "day": 1,
        "impressions": 42590,
        "clicks": 603,
        "conversions": 37,
        "spend": 345.55,
        "revenue": 5913.63,
        "ctr": 1.4158,
        "cvr": 6.136
      },
      {
        "date": "2026-01-31",
        "day": 2,
        "impressions": 43249,
        "clicks": 628,
        "conversions": 34,
        "spend": 311.35,
        "revenue": 4005.42,
        "ctr": 1.4521,
        "cvr": 5.414
      },
      {
        "date": "2026-02-01",
        "day": 3,
        "impressions": 44035,
        "clicks": 781,
        "conversions": 55,
        "spend": 341.35,
        "revenue": 6407.53,
        "ctr": 1.7736,
        "cvr": 7.0423
      },
      {
        "date": "2026-02-02",
        "day": 4,
        "impressions": 22076,
        "clicks": 356,
        "conversions": 22,
        "spend": 198.46,
        "revenue": 2736.97,
        "ctr": 1.6126,
        "cvr": 6.1798
      },
      {
        "date": "2026-02-03",
        "day": 5,
        "impressions": 32750,
        "clicks": 469,
        "conversions": 18,
        "spend": 252.46,
        "revenue": 2447.22,
        "ctr": 1.4321,
        "cvr": 3.838
      },
      {
        "date": "2026-02-04",
        "day": 6,
        "impressions": 41660,
        "clicks": 553,
        "conversions": 35,
        "spend": 310.85,
        "revenue": 5787.05,
        "ctr": 1.3274,
        "cvr": 6.3291
      },
      {
        "date": "2026-02-05",
        "day": 7,
        "impressions": 33664,
        "clicks": 525,
        "conversions": 36,
        "spend": 263.35,
        "revenue": 4179.73,
        "ctr": 1.5595,
        "cvr": 6.8571
      },
      {
        "date": "2026-02-06",
        "day": 8,
        "impressions": 37945,
        "clicks": 520,
        "conversions": 28,
        "spend": 304.16,
        "revenue": 3996.54,
        "ctr": 1.3704,
        "cvr": 5.3846
      },
      {
        "date": "2026-02-07",
        "day": 9,
        "impressions": 33269,
        "clicks": 442,
        "conversions": 26,
        "spend": 239.29,
        "revenue": 3943.77,
        "ctr": 1.3286,
        "cvr": 5.8824
      },
      {
        "date": "2026-02-08",
        "day": 10,
        "impressions": 40210,
        "clicks": 503,
        "conversions": 33,
        "spend": 343.69,
        "revenue": 5578.72,
        "ctr": 1.2509,
        "cvr": 6.5606
      },
      {
        "date": "2026-02-09",
        "day": 11,
        "impressions": 24619,
        "clicks": 309,
        "conversions": 22,
        "spend": 199.03,
        "revenue": 3517.32,
        "ctr": 1.2551,
        "cvr": 7.1197
      },
      {
        "date": "2026-02-10",
        "day": 12,
        "impressions": 27557,
        "clicks": 335,
        "conversions": 16,
        "spend": 201.45,
        "revenue": 2019.76,
        "ctr": 1.2157,
        "cvr": 4.7761
      },
      {
        "date": "2026-02-11",
        "day": 13,
        "impressions": 25398,
        "clicks": 237,
        "conversions": 18,
        "spend": 198.14,
        "revenue": 2317.09,
        "ctr": 0.9331,
        "cvr": 7.5949
      },
      {
        "date": "2026-02-12",
        "day": 14,
        "impressions": 30693,
        "clicks": 329,
        "conversions": 20,
        "spend": 250.14,
        "revenue": 3320.25,
        "ctr": 1.0719,
        "cvr": 6.079
      },
      {
        "date": "2026-02-13",
        "day": 15,
        "impressions": 34695,
        "clicks": 395,
        "conversions": 22,
        "spend": 249.1,
        "revenue": 2659.44,
        "ctr": 1.1385,
        "cvr": 5.5696
      },
      {
        "date": "2026-02-14",
        "day": 16,
        "impressions": 35984,
        "clicks": 355,
        "conversions": 15,
        "spend": 291.17,
        "revenue": 2510.95,
        "ctr": 0.9865,
        "cvr": 4.2254
      },
      {
        "date": "2026-02-15",
        "day": 17,
        "impressions": 44808,
        "clicks": 460,
        "conversions": 34,
        "spend": 352.75,
        "revenue": 5378.25,
        "ctr": 1.0266,
        "cvr": 7.3913
      },
      {
        "date": "2026-02-16",
        "day": 18,
        "impressions": 34205,
        "clicks": 350,
        "conversions": 26,
        "spend": 256.07,
        "revenue": 4169.89,
        "ctr": 1.0232,
        "cvr": 7.4286
      },
      {
        "date": "2026-02-17",
        "day": 19,
        "impressions": 27603,
        "clicks": 263,
        "conversions": 12,
        "spend": 217,
        "revenue": 1695.85,
        "ctr": 0.9528,
        "cvr": 4.5627
      },
      {
        "date": "2026-02-18",
        "day": 20,
        "impressions": 37263,
        "clicks": 328,
        "conversions": 21,
        "spend": 284.8,
        "revenue": 2688.17,
        "ctr": 0.8802,
        "cvr": 6.4024
      },
      {
        "date": "2026-02-19",
        "day": 21,
        "impressions": 30308,
        "clicks": 246,
        "conversions": 18,
        "spend": 234.38,
        "revenue": 2856.15,
        "ctr": 0.8117,
        "cvr": 7.3171
      },
      {
        "date": "2026-02-20",
        "day": 22,
        "impressions": 29892,
        "clicks": 260,
        "conversions": 14,
        "spend": 248.12,
        "revenue": 1892.39,
        "ctr": 0.8698,
        "cvr": 5.3846
      },
      {
        "date": "2026-02-21",
        "day": 23,
        "impressions": 37432,
        "clicks": 277,
        "conversions": 14,
        "spend": 290.54,
        "revenue": 2322.35,
        "ctr": 0.74,
        "cvr": 5.0542
      },
      {
        "date": "2026-02-22",
        "day": 24,
        "impressions": 48712,
        "clicks": 401,
        "conversions": 25,
        "spend": 356.96,
        "revenue": 3656.14,
        "ctr": 0.8232,
        "cvr": 6.2344
      },
      {
        "date": "2026-02-23",
        "day": 25,
        "impressions": 33556,
        "clicks": 253,
        "conversions": 14,
        "spend": 255.43,
        "revenue": 1823.61,
        "ctr": 0.754,
        "cvr": 5.5336
      },
      {
        "date": "2026-02-24",
        "day": 26,
        "impressions": 31844,
        "clicks": 252,
        "conversions": 14,
        "spend": 247.65,
        "revenue": 1889.48,
        "ctr": 0.7914,
        "cvr": 5.5556
      },
      {
        "date": "2026-02-25",
        "day": 27,
        "impressions": 40766,
        "clicks": 344,
        "conversions": 19,
        "spend": 309.7,
        "revenue": 3028.75,
        "ctr": 0.8438,
        "cvr": 5.5233
      },
      {
        "date": "2026-02-26",
        "day": 28,
        "impressions": 36624,
        "clicks": 282,
        "conversions": 15,
        "spend": 283.67,
        "revenue": 1924.59,
        "ctr": 0.77,
        "cvr": 5.3191
      },
      {
        "date": "2026-02-27",
        "day": 29,
        "impressions": 33879,
        "clicks": 218,
        "conversions": 7,
        "spend": 292.11,
        "revenue": 1136.91,
        "ctr": 0.6435,
        "cvr": 3.211
      },
      {
        "date": "2026-02-28",
        "day": 30,
        "impressions": 42460,
        "clicks": 261,
        "conversions": 17,
        "spend": 320.18,
        "revenue": 2536.69,
        "ctr": 0.6147,
        "cvr": 6.5134
      },
      {
        "date": "2026-03-01",
        "day": 31,
        "impressions": 48959,
        "clicks": 341,
        "conversions": 13,
        "spend": 357.2,
        "revenue": 2073.5,
        "ctr": 0.6965,
        "cvr": 3.8123
      },
      {
        "date": "2026-03-02",
        "day": 32,
        "impressions": 36712,
        "clicks": 240,
        "conversions": 14,
        "spend": 297.21,
        "revenue": 1872.44,
        "ctr": 0.6537,
        "cvr": 5.8333
      },
      {
        "date": "2026-03-03",
        "day": 33,
        "impressions": 31652,
        "clicks": 223,
        "conversions": 15,
        "spend": 263.46,
        "revenue": 2477.28,
        "ctr": 0.7045,
        "cvr": 6.7265
      },
      {
        "date": "2026-03-04",
        "day": 34,
        "impressions": 38901,
        "clicks": 264,
        "conversions": 14,
        "spend": 293.39,
        "revenue": 1974.75,
        "ctr": 0.6786,
        "cvr": 5.303
      },
      {
        "date": "2026-03-05",
        "day": 35,
        "impressions": 49943,
        "clicks": 270,
        "conversions": 11,
        "spend": 383.56,
        "revenue": 1690.68,
        "ctr": 0.5406,
        "cvr": 4.0741
      },
      {
        "date": "2026-03-06",
        "day": 36,
        "impressions": 38284,
        "clicks": 232,
        "conversions": 17,
        "spend": 303.55,
        "revenue": 2520.53,
        "ctr": 0.606,
        "cvr": 7.3276
      },
      {
        "date": "2026-03-07",
        "day": 37,
        "impressions": 36447,
        "clicks": 177,
        "conversions": 9,
        "spend": 307.11,
        "revenue": 1296.87,
        "ctr": 0.4856,
        "cvr": 5.0847
      },
      {
        "date": "2026-03-08",
        "day": 38,
        "impressions": 32700,
        "clicks": 170,
        "conversions": 15,
        "spend": 266.1,
        "revenue": 2031.3,
        "ctr": 0.5199,
        "cvr": 8.8235
      },
      {
        "date": "2026-03-09",
        "day": 39,
        "impressions": 37883,
        "clicks": 189,
        "conversions": 8,
        "spend": 303.22,
        "revenue": 1068.64,
        "ctr": 0.4989,
        "cvr": 4.2328
      },
      {
        "date": "2026-03-10",
        "day": 40,
        "impressions": 35460,
        "clicks": 160,
        "conversions": 6,
        "spend": 266.45,
        "revenue": 771.42,
        "ctr": 0.4512,
        "cvr": 3.75
      },
      {
        "date": "2026-03-11",
        "day": 41,
        "impressions": 40088,
        "clicks": 178,
        "conversions": 10,
        "spend": 319.51,
        "revenue": 1315.73,
        "ctr": 0.444,
        "cvr": 5.618
      },
      {
        "date": "2026-03-12",
        "day": 42,
        "impressions": 46508,
        "clicks": 240,
        "conversions": 18,
        "spend": 374.14,
        "revenue": 3004.35,
        "ctr": 0.516,
        "cvr": 7.5
      },
      {
        "date": "2026-03-13",
        "day": 43,
        "impressions": 43257,
        "clicks": 218,
        "conversions": 15,
        "spend": 335.13,
        "revenue": 1790.46,
        "ctr": 0.504,
        "cvr": 6.8807
      },
      {
        "date": "2026-03-14",
        "day": 44,
        "impressions": 29002,
        "clicks": 123,
        "conversions": 12,
        "spend": 248.1,
        "revenue": 1821.57,
        "ctr": 0.4241,
        "cvr": 9.7561
      },
      {
        "date": "2026-03-15",
        "day": 45,
        "impressions": 30578,
        "clicks": 151,
        "conversions": 9,
        "spend": 223.55,
        "revenue": 1423.23,
        "ctr": 0.4938,
        "cvr": 5.9603
      },
      {
        "date": "2026-03-16",
        "day": 46,
        "impressions": 30463,
        "clicks": 147,
        "conversions": 5,
        "spend": 255.39,
        "revenue": 673.08,
        "ctr": 0.4826,
        "cvr": 3.4014
      }
    ],
    "recommendation": {
      "headline": "Sustained 0.90% CTR with 9.63x ROAS — strong scaling candidate.",
      "reasons": [
        {
          "label": "Performance trend",
          "text": "ROAS holds at 9.63x across 47 active days."
        },
        {
          "label": "Visual factor",
          "text": "Rewarded Video format with low text density and Excited tone."
        },
        {
          "label": "Brain-inspired signal",
          "text": "Predicted attention 77 and engagement 82 — top quartile in this vertical."
        }
      ],
      "nextBestTest": "Increase daily spend by 30% on this creative; clone the book now hook into a 6s rewarded video for cross-format coverage."
    },
    "assetUrl": "/creatives/creative_500812.png"
  },
  {
    "id": "CR-500936",
    "rawId": 500936,
    "campaignId": 20156,
    "advertiserName": "VoxelRealm",
    "appName": "VoxelRealm Quest",
    "vertical": "gaming",
    "verticalDisplay": "Gaming",
    "format": "playable",
    "formatDisplay": "Playable",
    "campaignCountries": [
      "DE",
      "ES"
    ],
    "campaignOs": "iOS",
    "supportedOs": [
      "iOS"
    ],
    "status": "Stable",
    "rawStatus": "stable",
    "action": "Monitor",
    "ctr": 1.17,
    "cvr": 21.05,
    "roas": 1.9,
    "ipm": 2.46,
    "spend": 12523,
    "impressions": 1740532,
    "clicks": 20367,
    "conversions": 4287,
    "revenue": 23805,
    "daysActive": 39,
    "launchDate": "2026-01-20",
    "fatigueDay": null,
    "fatigueRisk": 47,
    "healthScore": 70,
    "metadata": {
      "ctaText": "Watch now",
      "headline": "Join the arena",
      "subhead": "Free rewards for new players",
      "dominantColor": "lime",
      "dominantColorHex": "#7C3AED",
      "tone": "Excited",
      "textDensity": "Medium",
      "hookType": "challenge",
      "theme": "gameplay",
      "language": "es",
      "durationSec": 30,
      "hasGameplay": true,
      "hasUgcStyle": false,
      "hasPrice": false,
      "hasDiscountBadge": false,
      "facesCount": 2,
      "productCount": 0,
      "brandVisibility": 19,
      "novelty": 65,
      "motion": 100,
      "readability": 59,
      "clutter": 48
    },
    "brainScores": {
      "attention": 90,
      "recall": 31,
      "cognitiveLoad": 44,
      "engagement": 57,
      "noveltyResponse": 75,
      "messageClarity": 60
    },
    "timeSeries": [
      {
        "date": "2026-01-20",
        "day": 0,
        "impressions": 55540,
        "clicks": 845,
        "conversions": 177,
        "spend": 393.84,
        "revenue": 960.24,
        "ctr": 1.5214,
        "cvr": 20.9467
      },
      {
        "date": "2026-01-21",
        "day": 1,
        "impressions": 54630,
        "clicks": 871,
        "conversions": 185,
        "spend": 392.14,
        "revenue": 1152.89,
        "ctr": 1.5944,
        "cvr": 21.24
      },
      {
        "date": "2026-01-22",
        "day": 2,
        "impressions": 51282,
        "clicks": 939,
        "conversions": 223,
        "spend": 371.56,
        "revenue": 1297.52,
        "ctr": 1.8311,
        "cvr": 23.7487
      },
      {
        "date": "2026-01-23",
        "day": 3,
        "impressions": 49100,
        "clicks": 912,
        "conversions": 209,
        "spend": 354.06,
        "revenue": 1068.43,
        "ctr": 1.8574,
        "cvr": 22.9167
      },
      {
        "date": "2026-01-24",
        "day": 4,
        "impressions": 45915,
        "clicks": 896,
        "conversions": 192,
        "spend": 339.87,
        "revenue": 1025.27,
        "ctr": 1.9514,
        "cvr": 21.4286
      },
      {
        "date": "2026-01-25",
        "day": 5,
        "impressions": 50927,
        "clicks": 765,
        "conversions": 145,
        "spend": 373.55,
        "revenue": 903.01,
        "ctr": 1.5022,
        "cvr": 18.9542
      },
      {
        "date": "2026-01-26",
        "day": 6,
        "impressions": 39274,
        "clicks": 611,
        "conversions": 116,
        "spend": 274.3,
        "revenue": 570.67,
        "ctr": 1.5557,
        "cvr": 18.9853
      },
      {
        "date": "2026-01-27",
        "day": 7,
        "impressions": 43194,
        "clicks": 677,
        "conversions": 160,
        "spend": 312.45,
        "revenue": 986.41,
        "ctr": 1.5673,
        "cvr": 23.6337
      },
      {
        "date": "2026-01-28",
        "day": 8,
        "impressions": 40687,
        "clicks": 709,
        "conversions": 164,
        "spend": 295.03,
        "revenue": 945.2,
        "ctr": 1.7426,
        "cvr": 23.1312
      },
      {
        "date": "2026-01-29",
        "day": 9,
        "impressions": 41808,
        "clicks": 700,
        "conversions": 127,
        "spend": 308.89,
        "revenue": 680.86,
        "ctr": 1.6743,
        "cvr": 18.1429
      },
      {
        "date": "2026-01-30",
        "day": 10,
        "impressions": 50735,
        "clicks": 790,
        "conversions": 164,
        "spend": 406.48,
        "revenue": 943.38,
        "ctr": 1.5571,
        "cvr": 20.7595
      },
      {
        "date": "2026-01-31",
        "day": 11,
        "impressions": 50874,
        "clicks": 669,
        "conversions": 125,
        "spend": 370.42,
        "revenue": 708.46,
        "ctr": 1.315,
        "cvr": 18.6846
      },
      {
        "date": "2026-02-01",
        "day": 12,
        "impressions": 47021,
        "clicks": 659,
        "conversions": 148,
        "spend": 323.27,
        "revenue": 924.68,
        "ctr": 1.4015,
        "cvr": 22.4583
      },
      {
        "date": "2026-02-02",
        "day": 13,
        "impressions": 46066,
        "clicks": 582,
        "conversions": 103,
        "spend": 324.3,
        "revenue": 605.75,
        "ctr": 1.2634,
        "cvr": 17.6976
      },
      {
        "date": "2026-02-03",
        "day": 14,
        "impressions": 44252,
        "clicks": 614,
        "conversions": 142,
        "spend": 309.09,
        "revenue": 812.91,
        "ctr": 1.3875,
        "cvr": 23.127
      },
      {
        "date": "2026-02-04",
        "day": 15,
        "impressions": 33017,
        "clicks": 380,
        "conversions": 74,
        "spend": 220.22,
        "revenue": 412.88,
        "ctr": 1.1509,
        "cvr": 19.4737
      },
      {
        "date": "2026-02-05",
        "day": 16,
        "impressions": 37944,
        "clicks": 453,
        "conversions": 85,
        "spend": 287.63,
        "revenue": 475.66,
        "ctr": 1.1939,
        "cvr": 18.7638
      },
      {
        "date": "2026-02-06",
        "day": 17,
        "impressions": 39864,
        "clicks": 484,
        "conversions": 108,
        "spend": 275.7,
        "revenue": 630.29,
        "ctr": 1.2141,
        "cvr": 22.314
      },
      {
        "date": "2026-02-07",
        "day": 18,
        "impressions": 48291,
        "clicks": 535,
        "conversions": 112,
        "spend": 335.9,
        "revenue": 570.34,
        "ctr": 1.1079,
        "cvr": 20.9346
      },
      {
        "date": "2026-02-08",
        "day": 19,
        "impressions": 50780,
        "clicks": 594,
        "conversions": 150,
        "spend": 364.83,
        "revenue": 770.73,
        "ctr": 1.1698,
        "cvr": 25.2525
      },
      {
        "date": "2026-02-09",
        "day": 20,
        "impressions": 48428,
        "clicks": 533,
        "conversions": 120,
        "spend": 332.12,
        "revenue": 671.78,
        "ctr": 1.1006,
        "cvr": 22.5141
      },
      {
        "date": "2026-02-10",
        "day": 21,
        "impressions": 39278,
        "clicks": 430,
        "conversions": 93,
        "spend": 283.35,
        "revenue": 443.66,
        "ctr": 1.0948,
        "cvr": 21.6279
      },
      {
        "date": "2026-02-11",
        "day": 22,
        "impressions": 41359,
        "clicks": 363,
        "conversions": 63,
        "spend": 305.47,
        "revenue": 316.9,
        "ctr": 0.8777,
        "cvr": 17.3554
      },
      {
        "date": "2026-02-12",
        "day": 23,
        "impressions": 46814,
        "clicks": 439,
        "conversions": 88,
        "spend": 331.27,
        "revenue": 519.97,
        "ctr": 0.9378,
        "cvr": 20.0456
      },
      {
        "date": "2026-02-13",
        "day": 24,
        "impressions": 43568,
        "clicks": 383,
        "conversions": 86,
        "spend": 299.97,
        "revenue": 433.06,
        "ctr": 0.8791,
        "cvr": 22.4543
      },
      {
        "date": "2026-02-14",
        "day": 25,
        "impressions": 48472,
        "clicks": 450,
        "conversions": 103,
        "spend": 344.73,
        "revenue": 578.21,
        "ctr": 0.9284,
        "cvr": 22.8889
      },
      {
        "date": "2026-02-15",
        "day": 26,
        "impressions": 43677,
        "clicks": 404,
        "conversions": 80,
        "spend": 326.58,
        "revenue": 482.39,
        "ctr": 0.925,
        "cvr": 19.802
      },
      {
        "date": "2026-02-16",
        "day": 27,
        "impressions": 37511,
        "clicks": 320,
        "conversions": 67,
        "spend": 263.93,
        "revenue": 374.8,
        "ctr": 0.8531,
        "cvr": 20.9375
      },
      {
        "date": "2026-02-17",
        "day": 28,
        "impressions": 52538,
        "clicks": 424,
        "conversions": 107,
        "spend": 369.57,
        "revenue": 564.86,
        "ctr": 0.807,
        "cvr": 25.2358
      },
      {
        "date": "2026-02-18",
        "day": 29,
        "impressions": 41561,
        "clicks": 342,
        "conversions": 70,
        "spend": 289.83,
        "revenue": 373.61,
        "ctr": 0.8229,
        "cvr": 20.4678
      },
      {
        "date": "2026-02-19",
        "day": 30,
        "impressions": 38983,
        "clicks": 329,
        "conversions": 65,
        "spend": 263.99,
        "revenue": 320.2,
        "ctr": 0.844,
        "cvr": 19.7568
      },
      {
        "date": "2026-02-20",
        "day": 31,
        "impressions": 36814,
        "clicks": 279,
        "conversions": 67,
        "spend": 269.9,
        "revenue": 335.21,
        "ctr": 0.7579,
        "cvr": 24.0143
      },
      {
        "date": "2026-02-21",
        "day": 32,
        "impressions": 50080,
        "clicks": 361,
        "conversions": 60,
        "spend": 376.86,
        "revenue": 311.47,
        "ctr": 0.7208,
        "cvr": 16.6205
      },
      {
        "date": "2026-02-22",
        "day": 33,
        "impressions": 40788,
        "clicks": 279,
        "conversions": 43,
        "spend": 305.68,
        "revenue": 226.76,
        "ctr": 0.684,
        "cvr": 15.4122
      },
      {
        "date": "2026-02-23",
        "day": 34,
        "impressions": 42291,
        "clicks": 289,
        "conversions": 49,
        "spend": 308.24,
        "revenue": 277.8,
        "ctr": 0.6834,
        "cvr": 16.955
      },
      {
        "date": "2026-02-24",
        "day": 35,
        "impressions": 38886,
        "clicks": 255,
        "conversions": 50,
        "spend": 281.61,
        "revenue": 264.83,
        "ctr": 0.6558,
        "cvr": 19.6078
      },
      {
        "date": "2026-02-25",
        "day": 36,
        "impressions": 34606,
        "clicks": 223,
        "conversions": 43,
        "spend": 259.98,
        "revenue": 204.59,
        "ctr": 0.6444,
        "cvr": 19.2825
      },
      {
        "date": "2026-02-26",
        "day": 37,
        "impressions": 46047,
        "clicks": 296,
        "conversions": 60,
        "spend": 334.17,
        "revenue": 303.35,
        "ctr": 0.6428,
        "cvr": 20.2703
      },
      {
        "date": "2026-02-27",
        "day": 38,
        "impressions": 47630,
        "clicks": 283,
        "conversions": 64,
        "spend": 342.38,
        "revenue": 356.44,
        "ctr": 0.5942,
        "cvr": 22.6148
      }
    ],
    "recommendation": {
      "headline": "Consistent 1.17% CTR — keep in rotation, watch for slow decline.",
      "reasons": [
        {
          "label": "Performance trend",
          "text": "Metrics flat across 39 days; ROAS 1.90x."
        },
        {
          "label": "Visual factor",
          "text": "Balanced Playable with brand visibility 19/100."
        },
        {
          "label": "Brain-inspired signal",
          "text": "Cognitive load 44 is moderate — safe but unexciting."
        }
      ],
      "nextBestTest": "Animate the static elements into a 6s motion variant; A/B test against the current version."
    },
    "assetUrl": "/creatives/creative_500936.png"
  },
  {
    "id": "CR-500248",
    "rawId": 500248,
    "campaignId": 20041,
    "advertiserName": "MoonScreen",
    "appName": "MoonScreen Stream",
    "vertical": "entertainment",
    "verticalDisplay": "Entertainment",
    "format": "rewarded_video",
    "formatDisplay": "Rewarded Video",
    "campaignCountries": [
      "US",
      "FR"
    ],
    "campaignOs": "Android",
    "supportedOs": [
      "Android"
    ],
    "status": "Stable",
    "rawStatus": "stable",
    "action": "Monitor",
    "ctr": 0.72,
    "cvr": 11.75,
    "roas": 2.99,
    "ipm": 0.85,
    "spend": 19784,
    "impressions": 3059693,
    "clicks": 22100,
    "conversions": 2597,
    "revenue": 59152,
    "daysActive": 39,
    "launchDate": "2026-01-29",
    "fatigueDay": null,
    "fatigueRisk": 49,
    "healthScore": 80,
    "metadata": {
      "ctaText": "Watch now",
      "headline": "Watch what’s trending",
      "subhead": "Cancel anytime",
      "dominantColor": "black",
      "dominantColorHex": "#0F172A",
      "tone": "Excited",
      "textDensity": "Medium",
      "hookType": "new season",
      "theme": "drama",
      "language": "fr",
      "durationSec": 10,
      "hasGameplay": false,
      "hasUgcStyle": true,
      "hasPrice": false,
      "hasDiscountBadge": false,
      "facesCount": 3,
      "productCount": 2,
      "brandVisibility": 76,
      "novelty": 60,
      "motion": 86,
      "readability": 72,
      "clutter": 36
    },
    "brainScores": {
      "attention": 89,
      "recall": 73,
      "cognitiveLoad": 37,
      "engagement": 86,
      "noveltyResponse": 68,
      "messageClarity": 65
    },
    "timeSeries": [
      {
        "date": "2026-01-29",
        "day": 0,
        "impressions": 71383,
        "clicks": 707,
        "conversions": 79,
        "spend": 421.48,
        "revenue": 1892.35,
        "ctr": 0.9904,
        "cvr": 11.174
      },
      {
        "date": "2026-01-30",
        "day": 1,
        "impressions": 57991,
        "clicks": 636,
        "conversions": 72,
        "spend": 390.49,
        "revenue": 1695.48,
        "ctr": 1.0967,
        "cvr": 11.3208
      },
      {
        "date": "2026-01-31",
        "day": 2,
        "impressions": 73768,
        "clicks": 850,
        "conversions": 107,
        "spend": 488.48,
        "revenue": 2701.95,
        "ctr": 1.1523,
        "cvr": 12.5882
      },
      {
        "date": "2026-02-01",
        "day": 3,
        "impressions": 115430,
        "clicks": 1533,
        "conversions": 179,
        "spend": 747.63,
        "revenue": 4764.95,
        "ctr": 1.3281,
        "cvr": 11.6765
      },
      {
        "date": "2026-02-02",
        "day": 4,
        "impressions": 66287,
        "clicks": 937,
        "conversions": 111,
        "spend": 426.14,
        "revenue": 2151.54,
        "ctr": 1.4136,
        "cvr": 11.8463
      },
      {
        "date": "2026-02-03",
        "day": 5,
        "impressions": 66771,
        "clicks": 867,
        "conversions": 102,
        "spend": 430.28,
        "revenue": 1949.73,
        "ctr": 1.2985,
        "cvr": 11.7647
      },
      {
        "date": "2026-02-04",
        "day": 6,
        "impressions": 80065,
        "clicks": 856,
        "conversions": 113,
        "spend": 503.62,
        "revenue": 2354.92,
        "ctr": 1.0691,
        "cvr": 13.2009
      },
      {
        "date": "2026-02-05",
        "day": 7,
        "impressions": 83081,
        "clicks": 821,
        "conversions": 98,
        "spend": 561.58,
        "revenue": 2380.7,
        "ctr": 0.9882,
        "cvr": 11.9367
      },
      {
        "date": "2026-02-06",
        "day": 8,
        "impressions": 82514,
        "clicks": 975,
        "conversions": 106,
        "spend": 555.87,
        "revenue": 1947.07,
        "ctr": 1.1816,
        "cvr": 10.8718
      },
      {
        "date": "2026-02-07",
        "day": 9,
        "impressions": 83554,
        "clicks": 851,
        "conversions": 94,
        "spend": 505.31,
        "revenue": 2128.56,
        "ctr": 1.0185,
        "cvr": 11.0458
      },
      {
        "date": "2026-02-08",
        "day": 10,
        "impressions": 97226,
        "clicks": 837,
        "conversions": 89,
        "spend": 606.85,
        "revenue": 1805.5,
        "ctr": 0.8609,
        "cvr": 10.6332
      },
      {
        "date": "2026-02-09",
        "day": 11,
        "impressions": 75100,
        "clicks": 692,
        "conversions": 91,
        "spend": 486.88,
        "revenue": 2105.03,
        "ctr": 0.9214,
        "cvr": 13.1503
      },
      {
        "date": "2026-02-10",
        "day": 12,
        "impressions": 66044,
        "clicks": 585,
        "conversions": 72,
        "spend": 458.74,
        "revenue": 1894.2,
        "ctr": 0.8858,
        "cvr": 12.3077
      },
      {
        "date": "2026-02-11",
        "day": 13,
        "impressions": 77101,
        "clicks": 693,
        "conversions": 75,
        "spend": 479,
        "revenue": 1804.71,
        "ctr": 0.8988,
        "cvr": 10.8225
      },
      {
        "date": "2026-02-12",
        "day": 14,
        "impressions": 61914,
        "clicks": 481,
        "conversions": 50,
        "spend": 401.76,
        "revenue": 1010.09,
        "ctr": 0.7769,
        "cvr": 10.395
      },
      {
        "date": "2026-02-13",
        "day": 15,
        "impressions": 72353,
        "clicks": 555,
        "conversions": 62,
        "spend": 482.52,
        "revenue": 1506.72,
        "ctr": 0.7671,
        "cvr": 11.1712
      },
      {
        "date": "2026-02-14",
        "day": 16,
        "impressions": 104693,
        "clicks": 825,
        "conversions": 100,
        "spend": 670.95,
        "revenue": 1905.17,
        "ctr": 0.788,
        "cvr": 12.1212
      },
      {
        "date": "2026-02-15",
        "day": 17,
        "impressions": 91715,
        "clicks": 699,
        "conversions": 102,
        "spend": 577.27,
        "revenue": 2623.77,
        "ctr": 0.7621,
        "cvr": 14.5923
      },
      {
        "date": "2026-02-16",
        "day": 18,
        "impressions": 58614,
        "clicks": 354,
        "conversions": 35,
        "spend": 391.26,
        "revenue": 881.95,
        "ctr": 0.604,
        "cvr": 9.887
      },
      {
        "date": "2026-02-17",
        "day": 19,
        "impressions": 70127,
        "clicks": 428,
        "conversions": 50,
        "spend": 450.27,
        "revenue": 1204.93,
        "ctr": 0.6103,
        "cvr": 11.6822
      },
      {
        "date": "2026-02-18",
        "day": 20,
        "impressions": 67792,
        "clicks": 475,
        "conversions": 52,
        "spend": 447.02,
        "revenue": 1091.23,
        "ctr": 0.7007,
        "cvr": 10.9474
      },
      {
        "date": "2026-02-19",
        "day": 21,
        "impressions": 72573,
        "clicks": 411,
        "conversions": 54,
        "spend": 503.24,
        "revenue": 1168.14,
        "ctr": 0.5663,
        "cvr": 13.1387
      },
      {
        "date": "2026-02-20",
        "day": 22,
        "impressions": 92622,
        "clicks": 458,
        "conversions": 48,
        "spend": 586.01,
        "revenue": 1136.71,
        "ctr": 0.4945,
        "cvr": 10.4803
      },
      {
        "date": "2026-02-21",
        "day": 23,
        "impressions": 83589,
        "clicks": 401,
        "conversions": 61,
        "spend": 554.52,
        "revenue": 1488.07,
        "ctr": 0.4797,
        "cvr": 15.212
      },
      {
        "date": "2026-02-22",
        "day": 24,
        "impressions": 91101,
        "clicks": 594,
        "conversions": 79,
        "spend": 590.91,
        "revenue": 2031.75,
        "ctr": 0.652,
        "cvr": 13.2997
      },
      {
        "date": "2026-02-23",
        "day": 25,
        "impressions": 55192,
        "clicks": 283,
        "conversions": 32,
        "spend": 347.45,
        "revenue": 790.31,
        "ctr": 0.5128,
        "cvr": 11.3074
      },
      {
        "date": "2026-02-24",
        "day": 26,
        "impressions": 65375,
        "clicks": 280,
        "conversions": 27,
        "spend": 429.14,
        "revenue": 684.52,
        "ctr": 0.4283,
        "cvr": 9.6429
      },
      {
        "date": "2026-02-25",
        "day": 27,
        "impressions": 74740,
        "clicks": 364,
        "conversions": 37,
        "spend": 476.15,
        "revenue": 776.97,
        "ctr": 0.487,
        "cvr": 10.1648
      },
      {
        "date": "2026-02-26",
        "day": 28,
        "impressions": 87259,
        "clicks": 420,
        "conversions": 44,
        "spend": 538.9,
        "revenue": 973.62,
        "ctr": 0.4813,
        "cvr": 10.4762
      },
      {
        "date": "2026-02-27",
        "day": 29,
        "impressions": 83964,
        "clicks": 404,
        "conversions": 40,
        "spend": 526.06,
        "revenue": 880.5,
        "ctr": 0.4812,
        "cvr": 9.901
      },
      {
        "date": "2026-02-28",
        "day": 30,
        "impressions": 104364,
        "clicks": 480,
        "conversions": 56,
        "spend": 641.57,
        "revenue": 1457.25,
        "ctr": 0.4599,
        "cvr": 11.6667
      },
      {
        "date": "2026-03-01",
        "day": 31,
        "impressions": 103939,
        "clicks": 508,
        "conversions": 70,
        "spend": 678.91,
        "revenue": 1518.76,
        "ctr": 0.4887,
        "cvr": 13.7795
      },
      {
        "date": "2026-03-02",
        "day": 32,
        "impressions": 67689,
        "clicks": 260,
        "conversions": 36,
        "spend": 458.94,
        "revenue": 712.28,
        "ctr": 0.3841,
        "cvr": 13.8462
      },
      {
        "date": "2026-03-03",
        "day": 33,
        "impressions": 49806,
        "clicks": 210,
        "conversions": 23,
        "spend": 351.13,
        "revenue": 428.6,
        "ctr": 0.4216,
        "cvr": 10.9524
      },
      {
        "date": "2026-03-04",
        "day": 34,
        "impressions": 61241,
        "clicks": 203,
        "conversions": 27,
        "spend": 398.3,
        "revenue": 615.6,
        "ctr": 0.3315,
        "cvr": 13.3005
      },
      {
        "date": "2026-03-05",
        "day": 35,
        "impressions": 77368,
        "clicks": 303,
        "conversions": 33,
        "spend": 509.71,
        "revenue": 841.23,
        "ctr": 0.3916,
        "cvr": 10.8911
      },
      {
        "date": "2026-03-06",
        "day": 36,
        "impressions": 72722,
        "clicks": 233,
        "conversions": 20,
        "spend": 468.11,
        "revenue": 376.91,
        "ctr": 0.3204,
        "cvr": 8.5837
      },
      {
        "date": "2026-03-07",
        "day": 37,
        "impressions": 90913,
        "clicks": 315,
        "conversions": 41,
        "spend": 580.46,
        "revenue": 846.58,
        "ctr": 0.3465,
        "cvr": 13.0159
      },
      {
        "date": "2026-03-08",
        "day": 38,
        "impressions": 101713,
        "clicks": 316,
        "conversions": 30,
        "spend": 661.46,
        "revenue": 624.06,
        "ctr": 0.3107,
        "cvr": 9.4937
      }
    ],
    "recommendation": {
      "headline": "Consistent 0.72% CTR — keep in rotation, watch for slow decline.",
      "reasons": [
        {
          "label": "Performance trend",
          "text": "Metrics flat across 39 days; ROAS 2.99x."
        },
        {
          "label": "Visual factor",
          "text": "Balanced Rewarded Video with brand visibility 76/100."
        },
        {
          "label": "Brain-inspired signal",
          "text": "Cognitive load 37 is moderate — safe but unexciting."
        }
      ],
      "nextBestTest": "Animate the static elements into a 6s motion variant; A/B test against the current version."
    },
    "assetUrl": "/creatives/creative_500248.png"
  },
  {
    "id": "CR-500460",
    "rawId": 500460,
    "campaignId": 20076,
    "advertiserName": "SnapMeal",
    "appName": "SnapMeal Go",
    "vertical": "food_delivery",
    "verticalDisplay": "Food Delivery",
    "format": "native",
    "formatDisplay": "Native",
    "campaignCountries": [
      "DE",
      "FR",
      "IT"
    ],
    "campaignOs": "Android",
    "supportedOs": [
      "Android"
    ],
    "status": "Underperformer",
    "rawStatus": "underperformer",
    "action": "Pause",
    "ctr": 0.37,
    "cvr": 8.68,
    "roas": 1.6,
    "ipm": 0.32,
    "spend": 27677,
    "impressions": 7581952,
    "clicks": 28110,
    "conversions": 2439,
    "revenue": 44174,
    "daysActive": 45,
    "launchDate": "2026-01-18",
    "fatigueDay": null,
    "fatigueRisk": 51,
    "healthScore": 32,
    "metadata": {
      "ctaText": "Order now",
      "headline": "Your cravings, delivered",
      "subhead": "Fresh favorites nearby",
      "dominantColor": "yellow",
      "dominantColorHex": "#FACC15",
      "tone": "calm",
      "textDensity": "Low",
      "hookType": "free delivery",
      "theme": "food-closeup",
      "language": "fr",
      "durationSec": 0,
      "hasGameplay": false,
      "hasUgcStyle": false,
      "hasPrice": false,
      "hasDiscountBadge": true,
      "facesCount": 2,
      "productCount": 3,
      "brandVisibility": 52,
      "novelty": 6,
      "motion": 21,
      "readability": 79,
      "clutter": 44
    },
    "brainScores": {
      "attention": 29,
      "recall": 56,
      "cognitiveLoad": 35,
      "engagement": 73,
      "noveltyResponse": 10,
      "messageClarity": 75
    },
    "timeSeries": [
      {
        "date": "2026-01-18",
        "day": 0,
        "impressions": 282150,
        "clicks": 2647,
        "conversions": 219,
        "spend": 1052.43,
        "revenue": 3799.07,
        "ctr": 0.9382,
        "cvr": 8.2735
      },
      {
        "date": "2026-01-19",
        "day": 1,
        "impressions": 250019,
        "clicks": 2341,
        "conversions": 210,
        "spend": 888.13,
        "revenue": 3972.64,
        "ctr": 0.9363,
        "cvr": 8.9705
      },
      {
        "date": "2026-01-20",
        "day": 2,
        "impressions": 313341,
        "clicks": 2711,
        "conversions": 238,
        "spend": 1101.92,
        "revenue": 3635.97,
        "ctr": 0.8652,
        "cvr": 8.779
      },
      {
        "date": "2026-01-21",
        "day": 3,
        "impressions": 235384,
        "clicks": 2096,
        "conversions": 198,
        "spend": 856.61,
        "revenue": 3257.84,
        "ctr": 0.8905,
        "cvr": 9.4466
      },
      {
        "date": "2026-01-22",
        "day": 4,
        "impressions": 200022,
        "clicks": 1540,
        "conversions": 138,
        "spend": 704.69,
        "revenue": 2680.84,
        "ctr": 0.7699,
        "cvr": 8.961
      },
      {
        "date": "2026-01-23",
        "day": 5,
        "impressions": 216598,
        "clicks": 1534,
        "conversions": 138,
        "spend": 779.66,
        "revenue": 2317.8,
        "ctr": 0.7082,
        "cvr": 8.9961
      },
      {
        "date": "2026-01-24",
        "day": 6,
        "impressions": 208639,
        "clicks": 1390,
        "conversions": 133,
        "spend": 779.01,
        "revenue": 2717.27,
        "ctr": 0.6662,
        "cvr": 9.5683
      },
      {
        "date": "2026-01-25",
        "day": 7,
        "impressions": 153781,
        "clicks": 924,
        "conversions": 81,
        "spend": 585.32,
        "revenue": 1553.32,
        "ctr": 0.6009,
        "cvr": 8.7662
      },
      {
        "date": "2026-01-26",
        "day": 8,
        "impressions": 141121,
        "clicks": 719,
        "conversions": 53,
        "spend": 540.66,
        "revenue": 921.8,
        "ctr": 0.5095,
        "cvr": 7.3713
      },
      {
        "date": "2026-01-27",
        "day": 9,
        "impressions": 158381,
        "clicks": 725,
        "conversions": 58,
        "spend": 573.99,
        "revenue": 1058.67,
        "ctr": 0.4578,
        "cvr": 8
      },
      {
        "date": "2026-01-28",
        "day": 10,
        "impressions": 162293,
        "clicks": 681,
        "conversions": 53,
        "spend": 596.46,
        "revenue": 945.85,
        "ctr": 0.4196,
        "cvr": 7.7827
      },
      {
        "date": "2026-01-29",
        "day": 11,
        "impressions": 140263,
        "clicks": 537,
        "conversions": 36,
        "spend": 544.87,
        "revenue": 576.31,
        "ctr": 0.3829,
        "cvr": 6.7039
      },
      {
        "date": "2026-01-30",
        "day": 12,
        "impressions": 168652,
        "clicks": 617,
        "conversions": 56,
        "spend": 578.95,
        "revenue": 1180.26,
        "ctr": 0.3658,
        "cvr": 9.0762
      },
      {
        "date": "2026-01-31",
        "day": 13,
        "impressions": 139869,
        "clicks": 440,
        "conversions": 48,
        "spend": 502.03,
        "revenue": 965.79,
        "ctr": 0.3146,
        "cvr": 10.9091
      },
      {
        "date": "2026-02-01",
        "day": 14,
        "impressions": 187351,
        "clicks": 588,
        "conversions": 51,
        "spend": 655.93,
        "revenue": 882.48,
        "ctr": 0.3138,
        "cvr": 8.6735
      },
      {
        "date": "2026-02-02",
        "day": 15,
        "impressions": 156218,
        "clicks": 365,
        "conversions": 25,
        "spend": 567.12,
        "revenue": 512.16,
        "ctr": 0.2336,
        "cvr": 6.8493
      },
      {
        "date": "2026-02-03",
        "day": 16,
        "impressions": 136691,
        "clicks": 328,
        "conversions": 29,
        "spend": 493.79,
        "revenue": 601.94,
        "ctr": 0.24,
        "cvr": 8.8415
      },
      {
        "date": "2026-02-04",
        "day": 17,
        "impressions": 113983,
        "clicks": 284,
        "conversions": 23,
        "spend": 436.42,
        "revenue": 462.12,
        "ctr": 0.2492,
        "cvr": 8.0986
      },
      {
        "date": "2026-02-05",
        "day": 18,
        "impressions": 162177,
        "clicks": 334,
        "conversions": 30,
        "spend": 583.9,
        "revenue": 610.53,
        "ctr": 0.2059,
        "cvr": 8.982
      },
      {
        "date": "2026-02-06",
        "day": 19,
        "impressions": 159201,
        "clicks": 285,
        "conversions": 23,
        "spend": 594.62,
        "revenue": 438.39,
        "ctr": 0.179,
        "cvr": 8.0702
      },
      {
        "date": "2026-02-07",
        "day": 20,
        "impressions": 161619,
        "clicks": 322,
        "conversions": 17,
        "spend": 570.42,
        "revenue": 303.05,
        "ctr": 0.1992,
        "cvr": 5.2795
      },
      {
        "date": "2026-02-08",
        "day": 21,
        "impressions": 152032,
        "clicks": 274,
        "conversions": 26,
        "spend": 549.39,
        "revenue": 529.16,
        "ctr": 0.1802,
        "cvr": 9.4891
      },
      {
        "date": "2026-02-09",
        "day": 22,
        "impressions": 165292,
        "clicks": 293,
        "conversions": 42,
        "spend": 574.29,
        "revenue": 832.76,
        "ctr": 0.1773,
        "cvr": 14.3345
      },
      {
        "date": "2026-02-10",
        "day": 23,
        "impressions": 122898,
        "clicks": 224,
        "conversions": 19,
        "spend": 434.23,
        "revenue": 329,
        "ctr": 0.1823,
        "cvr": 8.4821
      },
      {
        "date": "2026-02-11",
        "day": 24,
        "impressions": 174380,
        "clicks": 329,
        "conversions": 26,
        "spend": 595.42,
        "revenue": 527.77,
        "ctr": 0.1887,
        "cvr": 7.9027
      },
      {
        "date": "2026-02-12",
        "day": 25,
        "impressions": 120365,
        "clicks": 197,
        "conversions": 13,
        "spend": 464.46,
        "revenue": 200.08,
        "ctr": 0.1637,
        "cvr": 6.599
      },
      {
        "date": "2026-02-13",
        "day": 26,
        "impressions": 172217,
        "clicks": 294,
        "conversions": 28,
        "spend": 648.13,
        "revenue": 528.29,
        "ctr": 0.1707,
        "cvr": 9.5238
      },
      {
        "date": "2026-02-14",
        "day": 27,
        "impressions": 144877,
        "clicks": 265,
        "conversions": 27,
        "spend": 536.35,
        "revenue": 501.72,
        "ctr": 0.1829,
        "cvr": 10.1887
      },
      {
        "date": "2026-02-15",
        "day": 28,
        "impressions": 153741,
        "clicks": 291,
        "conversions": 27,
        "spend": 580.83,
        "revenue": 434.15,
        "ctr": 0.1893,
        "cvr": 9.2784
      },
      {
        "date": "2026-02-16",
        "day": 29,
        "impressions": 142086,
        "clicks": 249,
        "conversions": 26,
        "spend": 561.7,
        "revenue": 513.01,
        "ctr": 0.1752,
        "cvr": 10.4418
      },
      {
        "date": "2026-02-17",
        "day": 30,
        "impressions": 124493,
        "clicks": 225,
        "conversions": 17,
        "spend": 453.2,
        "revenue": 305.21,
        "ctr": 0.1807,
        "cvr": 7.5556
      },
      {
        "date": "2026-02-18",
        "day": 31,
        "impressions": 157025,
        "clicks": 291,
        "conversions": 21,
        "spend": 578.24,
        "revenue": 432.86,
        "ctr": 0.1853,
        "cvr": 7.2165
      },
      {
        "date": "2026-02-19",
        "day": 32,
        "impressions": 139757,
        "clicks": 240,
        "conversions": 23,
        "spend": 505.28,
        "revenue": 431.19,
        "ctr": 0.1717,
        "cvr": 9.5833
      },
      {
        "date": "2026-02-20",
        "day": 33,
        "impressions": 152890,
        "clicks": 272,
        "conversions": 28,
        "spend": 545.18,
        "revenue": 493.38,
        "ctr": 0.1779,
        "cvr": 10.2941
      },
      {
        "date": "2026-02-21",
        "day": 34,
        "impressions": 184371,
        "clicks": 348,
        "conversions": 25,
        "spend": 659.98,
        "revenue": 445,
        "ctr": 0.1887,
        "cvr": 7.1839
      },
      {
        "date": "2026-02-22",
        "day": 35,
        "impressions": 184630,
        "clicks": 330,
        "conversions": 34,
        "spend": 662.98,
        "revenue": 548.55,
        "ctr": 0.1787,
        "cvr": 10.303
      },
      {
        "date": "2026-02-23",
        "day": 36,
        "impressions": 153814,
        "clicks": 268,
        "conversions": 28,
        "spend": 565.38,
        "revenue": 503.35,
        "ctr": 0.1742,
        "cvr": 10.4478
      },
      {
        "date": "2026-02-24",
        "day": 37,
        "impressions": 141227,
        "clicks": 235,
        "conversions": 8,
        "spend": 533.11,
        "revenue": 143.08,
        "ctr": 0.1664,
        "cvr": 3.4043
      },
      {
        "date": "2026-02-25",
        "day": 38,
        "impressions": 122908,
        "clicks": 209,
        "conversions": 15,
        "spend": 447.55,
        "revenue": 299.75,
        "ctr": 0.17,
        "cvr": 7.177
      },
      {
        "date": "2026-02-26",
        "day": 39,
        "impressions": 165802,
        "clicks": 300,
        "conversions": 21,
        "spend": 599.91,
        "revenue": 395.82,
        "ctr": 0.1809,
        "cvr": 7
      },
      {
        "date": "2026-02-27",
        "day": 40,
        "impressions": 165529,
        "clicks": 325,
        "conversions": 27,
        "spend": 619.41,
        "revenue": 514.07,
        "ctr": 0.1963,
        "cvr": 8.3077
      },
      {
        "date": "2026-02-28",
        "day": 41,
        "impressions": 166836,
        "clicks": 302,
        "conversions": 26,
        "spend": 636.44,
        "revenue": 437.47,
        "ctr": 0.181,
        "cvr": 8.6093
      },
      {
        "date": "2026-03-01",
        "day": 42,
        "impressions": 208629,
        "clicks": 363,
        "conversions": 28,
        "spend": 767.01,
        "revenue": 490.1,
        "ctr": 0.174,
        "cvr": 7.7135
      },
      {
        "date": "2026-03-02",
        "day": 43,
        "impressions": 140348,
        "clicks": 264,
        "conversions": 21,
        "spend": 523.21,
        "revenue": 426.01,
        "ctr": 0.1881,
        "cvr": 7.9545
      },
      {
        "date": "2026-03-03",
        "day": 44,
        "impressions": 178052,
        "clicks": 314,
        "conversions": 26,
        "spend": 648.24,
        "revenue": 518.24,
        "ctr": 0.1764,
        "cvr": 8.2803
      }
    ],
    "recommendation": {
      "headline": "Failed to find traction — only 0.37% CTR and 1.60x ROAS.",
      "reasons": [
        {
          "label": "Performance trend",
          "text": "Never crossed 1% CTR despite 7,581,952 impressions."
        },
        {
          "label": "Visual factor",
          "text": "Low text density and clutter score 44/100 hurt scannability."
        },
        {
          "label": "Brain-inspired signal",
          "text": "Predicted message clarity is only 75 — viewers don't grasp the offer."
        }
      ],
      "nextBestTest": "Pause this creative. Pivot to a low-text, high-novelty variant in the same vertical."
    },
    "assetUrl": "/creatives/creative_500460.png"
  }
] as Creative[];

export const KPIS: Kpis = {
  "totalSpend": {
    "value": 31998872,
    "trend": {
      "direction": "up",
      "deltaPct": 12.4,
      "label": "vs prior 14 days"
    }
  },
  "impressions": {
    "value": 6367495106,
    "trend": {
      "direction": "up",
      "deltaPct": 8.2,
      "label": "vs prior 14 days"
    }
  },
  "ctr": {
    "value": 0.481,
    "trend": {
      "direction": "down",
      "deltaPct": -2.1,
      "label": "fatigue dragging avg"
    }
  },
  "cvr": {
    "value": 10.31,
    "trend": {
      "direction": "up",
      "deltaPct": 4.5,
      "label": "top performers pulling weight"
    }
  },
  "roas": {
    "value": 3.38,
    "trend": {
      "direction": "up",
      "deltaPct": 1.2,
      "label": "stable profitability"
    }
  },
  "fatiguedCount": {
    "value": 199,
    "trend": {
      "direction": "up",
      "deltaPct": 100,
      "label": "199 creatives flagged this period"
    }
  },
  "topPerformerCount": {
    "value": 46,
    "trend": {
      "direction": "up",
      "deltaPct": 5,
      "label": "high ROAS, low decay"
    }
  },
  "totalCreatives": {
    "value": 1080,
    "trend": {
      "direction": "flat",
      "deltaPct": 0,
      "label": "across all advertisers"
    }
  }
} as Kpis;

export const FILTER_OPTIONS: FilterOptions = {
  verticals: [
  {
    "value": "ecommerce",
    "label": "E-commerce"
  },
  {
    "value": "entertainment",
    "label": "Entertainment"
  },
  {
    "value": "fintech",
    "label": "Fintech"
  },
  {
    "value": "food_delivery",
    "label": "Food Delivery"
  },
  {
    "value": "gaming",
    "label": "Gaming"
  },
  {
    "value": "travel",
    "label": "Travel"
  }
],
  formats: [
  {
    "value": "banner",
    "label": "Banner"
  },
  {
    "value": "interstitial",
    "label": "Interstitial"
  },
  {
    "value": "native",
    "label": "Native"
  },
  {
    "value": "playable",
    "label": "Playable"
  },
  {
    "value": "rewarded_video",
    "label": "Rewarded Video"
  }
],
  apps: [
  "BingeLayer Now",
  "BingeLayer Play",
  "BingeLayer Plus",
  "BiteRush Bites",
  "BiteRush Delivery",
  "BiteRush Eats",
  "BiteRush Go",
  "BoltCart Club",
  "BoltCart Drops",
  "BoltCart Market",
  "ClearLedger Cash",
  "ClearLedger Invest",
  "ClearLedger Pay",
  "ClearLedger Wallet",
  "CloudRoute Getaway",
  "CloudRoute Travel",
  "CloudRoute Trips",
  "CoinBridge Cash",
  "CoinBridge Invest",
  "CoinBridge Pay",
  "CoinBridge Wallet",
  "CraveLoop Bites",
  "CraveLoop Express",
  "CraveLoop Go",
  "CraveLoop Kitchen",
  "CrispBox Club",
  "CrispBox Outlet",
  "CrispBox Shop",
  "DriftPass Getaway",
  "DriftPass Travel",
  "DriftPass Trips",
  "EarnPath Bank",
  "EarnPath Invest",
  "EarnPath Saver",
  "FluxStream Box",
  "FluxStream Now",
  "FluxStream Play",
  "FluxStream Stream",
  "FreshDash Bites",
  "FreshDash Delivery",
  "FreshDash Eats",
  "FreshDash Go",
  "GlitchWave Legends",
  "GlitchWave Quest",
  "GlitchWave Rush",
  "GlitchWave Saga",
  "HorizonHop Escapes",
  "HorizonHop Flights",
  "HorizonHop Trips",
  "IronQuest Arena",
  "IronQuest Battle",
  "IronQuest Legends",
  "IronQuest Rush",
  "IronQuest Saga",
  "LuxShelf Market",
  "LuxShelf Outlet",
  "LuxShelf Shop",
  "MoonScreen Box",
  "MoonScreen Play",
  "MoonScreen Stream",
  "MoonScreen TV",
  "NeonArena Arena",
  "NeonArena Quest",
  "NeonArena Rush",
  "NeonArena Saga",
  "NeonCast Now",
  "NeonCast Stream",
  "NomadLayer Flights",
  "NomadLayer Getaway",
  "NomadLayer Travel",
  "NomadLayer Trips",
  "NovaPay Bank",
  "NovaPay Pay",
  "NovaPay Wallet",
  "PixelForge Battle",
  "PixelForge Legends",
  "PixelForge Rush",
  "PlateSprint Delivery",
  "PlateSprint Go",
  "PulsePlay Box",
  "PulsePlay Now",
  "PulsePlay Play",
  "PulsePlay Stream",
  "QuickFork Eats",
  "QuickFork Express",
  "QuickFork Kitchen",
  "RouteBloom Deals",
  "RouteBloom Getaway",
  "RouteBloom Travel",
  "SnapMeal Bites",
  "SnapMeal Express",
  "SnapMeal Go",
  "SnapMeal Kitchen",
  "StarVault Now",
  "StarVault Play",
  "StarVault Plus",
  "StormByte Arena",
  "StormByte Saga",
  "SwiftStack Invest",
  "SwiftStack Wallet",
  "ThreadMark Club",
  "ThreadMark Market",
  "ThreadMark Shop",
  "ThreadMark Store",
  "VantaStyle Club",
  "VantaStyle Drops",
  "VantaStyle Market",
  "VantaStyle Outlet",
  "VantaStyle Shop",
  "VaultRun Cash",
  "VaultRun Pay",
  "VaultRun Wallet",
  "VoxelRealm Arena",
  "VoxelRealm Battle",
  "VoxelRealm Legends",
  "VoxelRealm Quest",
  "WayPoint Escapes",
  "WayPoint Travel",
  "WayPoint Trips",
  "ZenDrop Club",
  "ZenDrop Market",
  "ZenDrop Shop",
  "ZenDrop Store"
],
  advertisers: [
  {
    "value": "DriftPass",
    "label": "DriftPass"
  },
  {
    "value": "IronQuest",
    "label": "IronQuest"
  },
  {
    "value": "MoonScreen",
    "label": "MoonScreen"
  },
  {
    "value": "NeonArena",
    "label": "NeonArena"
  },
  {
    "value": "NomadLayer",
    "label": "NomadLayer"
  },
  {
    "value": "SnapMeal",
    "label": "SnapMeal"
  },
  {
    "value": "VoxelRealm",
    "label": "VoxelRealm"
  },
  {
    "value": "WayPoint",
    "label": "WayPoint"
  }
],
  campaigns: [
  {
    "value": "20041",
    "label": "Campaign #20041",
    "advertiserName": "MoonScreen"
  },
  {
    "value": "20076",
    "label": "Campaign #20076",
    "advertiserName": "SnapMeal"
  },
  {
    "value": "20081",
    "label": "Campaign #20081",
    "advertiserName": "DriftPass"
  },
  {
    "value": "20105",
    "label": "Campaign #20105",
    "advertiserName": "NomadLayer"
  },
  {
    "value": "20114",
    "label": "Campaign #20114",
    "advertiserName": "NeonArena"
  },
  {
    "value": "20135",
    "label": "Campaign #20135",
    "advertiserName": "WayPoint"
  },
  {
    "value": "20138",
    "label": "Campaign #20138",
    "advertiserName": "IronQuest"
  },
  {
    "value": "20141",
    "label": "Campaign #20141",
    "advertiserName": "NomadLayer"
  },
  {
    "value": "20156",
    "label": "Campaign #20156",
    "advertiserName": "VoxelRealm"
  }
],
  countries: [
  "BR",
  "CA",
  "DE",
  "ES",
  "FR",
  "IT",
  "JP",
  "MX",
  "UK",
  "US"
],
  oses: [
  "Android",
  "iOS"
],
  statuses: [
  {
    "value": "top_performer",
    "label": "Top Performer"
  },
  {
    "value": "stable",
    "label": "Stable"
  },
  {
    "value": "fatigued",
    "label": "Fatigued"
  },
  {
    "value": "underperformer",
    "label": "Underperformer"
  }
],
  kpiFocusOptions: [
    { value: 'overall',     label: 'Overall' },
    { value: 'ctr',         label: 'CTR' },
    { value: 'cvr',         label: 'CVR' },
    { value: 'roas',        label: 'ROAS' },
    { value: 'spend',       label: 'Spend' },
    { value: 'fatigue',     label: 'Fatigue risk' },
  ],
  dateRangeOptions: [
    { value: '7d',  label: 'Last 7 days',   days: 7 },
    { value: '14d', label: 'Last 14 days',  days: 14 },
    { value: '30d', label: 'Last 30 days',  days: 30 },
    { value: '90d', label: 'Last 90 days',  days: 90 },
    { value: 'all', label: 'Full campaign', days: 365 },
  ],
};

export const DEFAULT_FILTERS: DashboardFilters = {
  vertical: 'all',
  format: 'all',
  app: 'all',
  advertiser: 'all',
  campaign: 'all',
  country: 'all',
  os: 'all',
  status: 'all',
  kpiFocus: 'overall',
  dateRange: '90d',
};

export const ADVERTISERS = [
  {
    "advertiserId": 1000,
    "advertiserName": "PixelForge",
    "vertical": "gaming",
    "hqRegion": "LATAM"
  },
  {
    "advertiserId": 1001,
    "advertiserName": "VantaStyle",
    "vertical": "ecommerce",
    "hqRegion": "North America"
  },
  {
    "advertiserId": 1002,
    "advertiserName": "EarnPath",
    "vertical": "fintech",
    "hqRegion": "APAC"
  },
  {
    "advertiserId": 1003,
    "advertiserName": "CloudRoute",
    "vertical": "travel",
    "hqRegion": "Europe"
  },
  {
    "advertiserId": 1004,
    "advertiserName": "SnapMeal",
    "vertical": "food_delivery",
    "hqRegion": "Europe"
  },
  {
    "advertiserId": 1005,
    "advertiserName": "MoonScreen",
    "vertical": "entertainment",
    "hqRegion": "Europe"
  },
  {
    "advertiserId": 1006,
    "advertiserName": "NeonArena",
    "vertical": "gaming",
    "hqRegion": "LATAM"
  },
  {
    "advertiserId": 1007,
    "advertiserName": "ThreadMark",
    "vertical": "ecommerce",
    "hqRegion": "Europe"
  },
  {
    "advertiserId": 1008,
    "advertiserName": "CoinBridge",
    "vertical": "fintech",
    "hqRegion": "North America"
  },
  {
    "advertiserId": 1009,
    "advertiserName": "DriftPass",
    "vertical": "travel",
    "hqRegion": "Europe"
  },
  {
    "advertiserId": 1010,
    "advertiserName": "BiteRush",
    "vertical": "food_delivery",
    "hqRegion": "Europe"
  },
  {
    "advertiserId": 1011,
    "advertiserName": "FluxStream",
    "vertical": "entertainment",
    "hqRegion": "APAC"
  },
  {
    "advertiserId": 1012,
    "advertiserName": "VoxelRealm",
    "vertical": "gaming",
    "hqRegion": "APAC"
  },
  {
    "advertiserId": 1013,
    "advertiserName": "BoltCart",
    "vertical": "ecommerce",
    "hqRegion": "Europe"
  },
  {
    "advertiserId": 1014,
    "advertiserName": "VaultRun",
    "vertical": "fintech",
    "hqRegion": "North America"
  },
  {
    "advertiserId": 1015,
    "advertiserName": "HorizonHop",
    "vertical": "travel",
    "hqRegion": "Europe"
  },
  {
    "advertiserId": 1016,
    "advertiserName": "FreshDash",
    "vertical": "food_delivery",
    "hqRegion": "APAC"
  },
  {
    "advertiserId": 1017,
    "advertiserName": "PulsePlay",
    "vertical": "entertainment",
    "hqRegion": "Europe"
  },
  {
    "advertiserId": 1018,
    "advertiserName": "StormByte",
    "vertical": "gaming",
    "hqRegion": "Europe"
  },
  {
    "advertiserId": 1019,
    "advertiserName": "ZenDrop",
    "vertical": "ecommerce",
    "hqRegion": "North America"
  },
  {
    "advertiserId": 1020,
    "advertiserName": "NovaPay",
    "vertical": "fintech",
    "hqRegion": "Europe"
  },
  {
    "advertiserId": 1021,
    "advertiserName": "RouteBloom",
    "vertical": "travel",
    "hqRegion": "APAC"
  },
  {
    "advertiserId": 1022,
    "advertiserName": "CraveLoop",
    "vertical": "food_delivery",
    "hqRegion": "Europe"
  },
  {
    "advertiserId": 1023,
    "advertiserName": "NeonCast",
    "vertical": "entertainment",
    "hqRegion": "North America"
  },
  {
    "advertiserId": 1024,
    "advertiserName": "GlitchWave",
    "vertical": "gaming",
    "hqRegion": "Europe"
  },
  {
    "advertiserId": 1025,
    "advertiserName": "LuxShelf",
    "vertical": "ecommerce",
    "hqRegion": "North America"
  },
  {
    "advertiserId": 1026,
    "advertiserName": "ClearLedger",
    "vertical": "fintech",
    "hqRegion": "LATAM"
  },
  {
    "advertiserId": 1027,
    "advertiserName": "WayPoint",
    "vertical": "travel",
    "hqRegion": "APAC"
  },
  {
    "advertiserId": 1028,
    "advertiserName": "QuickFork",
    "vertical": "food_delivery",
    "hqRegion": "North America"
  },
  {
    "advertiserId": 1029,
    "advertiserName": "BingeLayer",
    "vertical": "entertainment",
    "hqRegion": "Europe"
  },
  {
    "advertiserId": 1030,
    "advertiserName": "IronQuest",
    "vertical": "gaming",
    "hqRegion": "LATAM"
  },
  {
    "advertiserId": 1031,
    "advertiserName": "CrispBox",
    "vertical": "ecommerce",
    "hqRegion": "North America"
  },
  {
    "advertiserId": 1032,
    "advertiserName": "SwiftStack",
    "vertical": "fintech",
    "hqRegion": "Europe"
  },
  {
    "advertiserId": 1033,
    "advertiserName": "NomadLayer",
    "vertical": "travel",
    "hqRegion": "North America"
  },
  {
    "advertiserId": 1034,
    "advertiserName": "PlateSprint",
    "vertical": "food_delivery",
    "hqRegion": "LATAM"
  },
  {
    "advertiserId": 1035,
    "advertiserName": "StarVault",
    "vertical": "entertainment",
    "hqRegion": "Europe"
  }
];
export const CAMPAIGNS = [
  {
    "campaignId": 20000,
    "appName": "PixelForge Legends",
    "vertical": "gaming",
    "objective": "install",
    "countries": [
      "CA",
      "US",
      "ES",
      "JP"
    ],
    "startDate": "2026-01-19",
    "endDate": "2026-04-02",
    "dailyBudgetUsd": 5386
  },
  {
    "campaignId": 20001,
    "appName": "VantaStyle Drops",
    "vertical": "ecommerce",
    "objective": "purchase",
    "countries": [
      "ES",
      "UK",
      "MX"
    ],
    "startDate": "2026-01-11",
    "endDate": "2026-03-19",
    "dailyBudgetUsd": 2532
  },
  {
    "campaignId": 20002,
    "appName": "EarnPath Invest",
    "vertical": "fintech",
    "objective": "signup",
    "countries": [
      "CA",
      "MX",
      "IT",
      "BR"
    ],
    "startDate": "2026-01-02",
    "endDate": "2026-03-17",
    "dailyBudgetUsd": 3015
  },
  {
    "campaignId": 20003,
    "appName": "CloudRoute Getaway",
    "vertical": "travel",
    "objective": "booking",
    "countries": [
      "DE",
      "JP",
      "BR"
    ],
    "startDate": "2026-01-03",
    "endDate": "2026-02-17",
    "dailyBudgetUsd": 3437
  },
  {
    "campaignId": 20004,
    "appName": "SnapMeal Bites",
    "vertical": "food_delivery",
    "objective": "order",
    "countries": [
      "IT",
      "DE",
      "US"
    ],
    "startDate": "2026-01-16",
    "endDate": "2026-03-02",
    "dailyBudgetUsd": 2261
  },
  {
    "campaignId": 20005,
    "appName": "MoonScreen TV",
    "vertical": "entertainment",
    "objective": "signup",
    "countries": [
      "ES",
      "IT"
    ],
    "startDate": "2026-01-15",
    "endDate": "2026-03-12",
    "dailyBudgetUsd": 2983
  },
  {
    "campaignId": 20006,
    "appName": "NeonArena Quest",
    "vertical": "gaming",
    "objective": "install",
    "countries": [
      "BR",
      "FR",
      "IT"
    ],
    "startDate": "2026-01-03",
    "endDate": "2026-02-21",
    "dailyBudgetUsd": 2980
  },
  {
    "campaignId": 20007,
    "appName": "ThreadMark Shop",
    "vertical": "ecommerce",
    "objective": "purchase",
    "countries": [
      "US",
      "JP"
    ],
    "startDate": "2026-01-01",
    "endDate": "2026-02-18",
    "dailyBudgetUsd": 1612
  },
  {
    "campaignId": 20008,
    "appName": "CoinBridge Invest",
    "vertical": "fintech",
    "objective": "signup",
    "countries": [
      "MX",
      "DE",
      "UK",
      "BR"
    ],
    "startDate": "2026-01-13",
    "endDate": "2026-03-10",
    "dailyBudgetUsd": 4256
  },
  {
    "campaignId": 20009,
    "appName": "DriftPass Travel",
    "vertical": "travel",
    "objective": "booking",
    "countries": [
      "IT",
      "US",
      "ES"
    ],
    "startDate": "2026-01-04",
    "endDate": "2026-02-27",
    "dailyBudgetUsd": 3678
  },
  {
    "campaignId": 20010,
    "appName": "BiteRush Delivery",
    "vertical": "food_delivery",
    "objective": "order",
    "countries": [
      "MX",
      "UK"
    ],
    "startDate": "2026-01-03",
    "endDate": "2026-03-15",
    "dailyBudgetUsd": 2394
  },
  {
    "campaignId": 20011,
    "appName": "FluxStream Play",
    "vertical": "entertainment",
    "objective": "signup",
    "countries": [
      "FR",
      "DE"
    ],
    "startDate": "2026-01-04",
    "endDate": "2026-03-16",
    "dailyBudgetUsd": 2807
  },
  {
    "campaignId": 20012,
    "appName": "VoxelRealm Battle",
    "vertical": "gaming",
    "objective": "install",
    "countries": [
      "JP",
      "FR",
      "CA"
    ],
    "startDate": "2026-01-09",
    "endDate": "2026-03-09",
    "dailyBudgetUsd": 3557
  },
  {
    "campaignId": 20013,
    "appName": "BoltCart Drops",
    "vertical": "ecommerce",
    "objective": "purchase",
    "countries": [
      "BR",
      "DE"
    ],
    "startDate": "2026-01-21",
    "endDate": "2026-04-02",
    "dailyBudgetUsd": 2720
  },
  {
    "campaignId": 20014,
    "appName": "VaultRun Pay",
    "vertical": "fintech",
    "objective": "signup",
    "countries": [
      "DE",
      "UK",
      "MX",
      "IT"
    ],
    "startDate": "2026-01-20",
    "endDate": "2026-03-30",
    "dailyBudgetUsd": 2738
  },
  {
    "campaignId": 20015,
    "appName": "HorizonHop Trips",
    "vertical": "travel",
    "objective": "booking",
    "countries": [
      "ES",
      "MX",
      "JP"
    ],
    "startDate": "2026-01-16",
    "endDate": "2026-03-09",
    "dailyBudgetUsd": 1792
  },
  {
    "campaignId": 20016,
    "appName": "FreshDash Bites",
    "vertical": "food_delivery",
    "objective": "order",
    "countries": [
      "DE",
      "MX",
      "CA"
    ],
    "startDate": "2026-01-07",
    "endDate": "2026-03-02",
    "dailyBudgetUsd": 3619
  },
  {
    "campaignId": 20017,
    "appName": "PulsePlay Box",
    "vertical": "entertainment",
    "objective": "install",
    "countries": [
      "MX",
      "US",
      "JP",
      "DE"
    ],
    "startDate": "2026-01-13",
    "endDate": "2026-03-23",
    "dailyBudgetUsd": 3113
  },
  {
    "campaignId": 20018,
    "appName": "StormByte Saga",
    "vertical": "gaming",
    "objective": "install",
    "countries": [
      "IT",
      "DE"
    ],
    "startDate": "2026-01-03",
    "endDate": "2026-03-11",
    "dailyBudgetUsd": 3281
  },
  {
    "campaignId": 20019,
    "appName": "ZenDrop Market",
    "vertical": "ecommerce",
    "objective": "purchase",
    "countries": [
      "US",
      "UK"
    ],
    "startDate": "2026-01-20",
    "endDate": "2026-03-31",
    "dailyBudgetUsd": 1747
  },
  {
    "campaignId": 20020,
    "appName": "NovaPay Wallet",
    "vertical": "fintech",
    "objective": "signup",
    "countries": [
      "BR",
      "MX"
    ],
    "startDate": "2026-01-17",
    "endDate": "2026-03-25",
    "dailyBudgetUsd": 5312
  },
  {
    "campaignId": 20021,
    "appName": "RouteBloom Getaway",
    "vertical": "travel",
    "objective": "booking",
    "countries": [
      "ES",
      "US"
    ],
    "startDate": "2026-01-19",
    "endDate": "2026-03-14",
    "dailyBudgetUsd": 3146
  },
  {
    "campaignId": 20022,
    "appName": "CraveLoop Express",
    "vertical": "food_delivery",
    "objective": "order",
    "countries": [
      "US",
      "DE"
    ],
    "startDate": "2026-01-18",
    "endDate": "2026-03-07",
    "dailyBudgetUsd": 2603
  },
  {
    "campaignId": 20023,
    "appName": "NeonCast Stream",
    "vertical": "entertainment",
    "objective": "install",
    "countries": [
      "MX",
      "US"
    ],
    "startDate": "2026-01-20",
    "endDate": "2026-03-28",
    "dailyBudgetUsd": 6064
  },
  {
    "campaignId": 20024,
    "appName": "GlitchWave Quest",
    "vertical": "gaming",
    "objective": "install",
    "countries": [
      "BR",
      "MX",
      "JP"
    ],
    "startDate": "2026-01-09",
    "endDate": "2026-02-23",
    "dailyBudgetUsd": 2933
  },
  {
    "campaignId": 20025,
    "appName": "LuxShelf Market",
    "vertical": "ecommerce",
    "objective": "purchase",
    "countries": [
      "US",
      "CA",
      "JP",
      "UK"
    ],
    "startDate": "2026-01-15",
    "endDate": "2026-03-16",
    "dailyBudgetUsd": 1794
  },
  {
    "campaignId": 20026,
    "appName": "ClearLedger Invest",
    "vertical": "fintech",
    "objective": "signup",
    "countries": [
      "FR",
      "BR",
      "ES",
      "IT"
    ],
    "startDate": "2026-01-13",
    "endDate": "2026-03-12",
    "dailyBudgetUsd": 2586
  },
  {
    "campaignId": 20027,
    "appName": "WayPoint Trips",
    "vertical": "travel",
    "objective": "booking",
    "countries": [
      "IT",
      "CA"
    ],
    "startDate": "2026-01-21",
    "endDate": "2026-03-27",
    "dailyBudgetUsd": 1338
  },
  {
    "campaignId": 20028,
    "appName": "QuickFork Kitchen",
    "vertical": "food_delivery",
    "objective": "order",
    "countries": [
      "UK",
      "JP",
      "ES"
    ],
    "startDate": "2026-01-06",
    "endDate": "2026-03-12",
    "dailyBudgetUsd": 4303
  },
  {
    "campaignId": 20029,
    "appName": "BingeLayer Plus",
    "vertical": "entertainment",
    "objective": "install",
    "countries": [
      "BR",
      "IT",
      "DE"
    ],
    "startDate": "2026-01-03",
    "endDate": "2026-03-11",
    "dailyBudgetUsd": 2576
  },
  {
    "campaignId": 20030,
    "appName": "IronQuest Saga",
    "vertical": "gaming",
    "objective": "install",
    "countries": [
      "BR",
      "JP",
      "MX"
    ],
    "startDate": "2026-01-17",
    "endDate": "2026-03-21",
    "dailyBudgetUsd": 2298
  },
  {
    "campaignId": 20031,
    "appName": "CrispBox Shop",
    "vertical": "ecommerce",
    "objective": "purchase",
    "countries": [
      "ES",
      "CA"
    ],
    "startDate": "2026-01-06",
    "endDate": "2026-02-27",
    "dailyBudgetUsd": 4338
  },
  {
    "campaignId": 20032,
    "appName": "SwiftStack Wallet",
    "vertical": "fintech",
    "objective": "signup",
    "countries": [
      "IT",
      "UK",
      "JP"
    ],
    "startDate": "2026-01-02",
    "endDate": "2026-03-12",
    "dailyBudgetUsd": 1672
  },
  {
    "campaignId": 20033,
    "appName": "NomadLayer Getaway",
    "vertical": "travel",
    "objective": "booking",
    "countries": [
      "FR",
      "US"
    ],
    "startDate": "2026-01-20",
    "endDate": "2026-04-01",
    "dailyBudgetUsd": 3595
  },
  {
    "campaignId": 20034,
    "appName": "PlateSprint Delivery",
    "vertical": "food_delivery",
    "objective": "order",
    "countries": [
      "CA",
      "JP",
      "US"
    ],
    "startDate": "2026-01-02",
    "endDate": "2026-03-03",
    "dailyBudgetUsd": 1447
  },
  {
    "campaignId": 20035,
    "appName": "StarVault Plus",
    "vertical": "entertainment",
    "objective": "install",
    "countries": [
      "FR",
      "US"
    ],
    "startDate": "2026-01-17",
    "endDate": "2026-03-26",
    "dailyBudgetUsd": 2364
  },
  {
    "campaignId": 20036,
    "appName": "PixelForge Legends",
    "vertical": "gaming",
    "objective": "install",
    "countries": [
      "BR",
      "UK",
      "FR"
    ],
    "startDate": "2026-01-01",
    "endDate": "2026-02-14",
    "dailyBudgetUsd": 1955
  },
  {
    "campaignId": 20037,
    "appName": "VantaStyle Market",
    "vertical": "ecommerce",
    "objective": "purchase",
    "countries": [
      "JP",
      "CA"
    ],
    "startDate": "2026-01-18",
    "endDate": "2026-03-29",
    "dailyBudgetUsd": 4972
  },
  {
    "campaignId": 20038,
    "appName": "EarnPath Invest",
    "vertical": "fintech",
    "objective": "signup",
    "countries": [
      "ES",
      "DE"
    ],
    "startDate": "2026-01-02",
    "endDate": "2026-03-13",
    "dailyBudgetUsd": 5531
  },
  {
    "campaignId": 20039,
    "appName": "CloudRoute Trips",
    "vertical": "travel",
    "objective": "booking",
    "countries": [
      "FR",
      "IT"
    ],
    "startDate": "2026-01-17",
    "endDate": "2026-03-23",
    "dailyBudgetUsd": 2656
  },
  {
    "campaignId": 20040,
    "appName": "SnapMeal Kitchen",
    "vertical": "food_delivery",
    "objective": "order",
    "countries": [
      "US",
      "JP",
      "UK"
    ],
    "startDate": "2026-01-09",
    "endDate": "2026-03-05",
    "dailyBudgetUsd": 4000
  },
  {
    "campaignId": 20041,
    "appName": "MoonScreen Stream",
    "vertical": "entertainment",
    "objective": "signup",
    "countries": [
      "US",
      "FR"
    ],
    "startDate": "2026-01-11",
    "endDate": "2026-03-08",
    "dailyBudgetUsd": 2798
  },
  {
    "campaignId": 20042,
    "appName": "NeonArena Arena",
    "vertical": "gaming",
    "objective": "install",
    "countries": [
      "BR",
      "ES",
      "MX"
    ],
    "startDate": "2026-01-03",
    "endDate": "2026-02-20",
    "dailyBudgetUsd": 3636
  },
  {
    "campaignId": 20043,
    "appName": "ThreadMark Store",
    "vertical": "ecommerce",
    "objective": "purchase",
    "countries": [
      "US",
      "FR",
      "BR"
    ],
    "startDate": "2026-01-20",
    "endDate": "2026-03-17",
    "dailyBudgetUsd": 2290
  },
  {
    "campaignId": 20044,
    "appName": "CoinBridge Pay",
    "vertical": "fintech",
    "objective": "signup",
    "countries": [
      "FR",
      "UK"
    ],
    "startDate": "2026-01-17",
    "endDate": "2026-03-26",
    "dailyBudgetUsd": 1639
  },
  {
    "campaignId": 20045,
    "appName": "DriftPass Trips",
    "vertical": "travel",
    "objective": "booking",
    "countries": [
      "US",
      "MX"
    ],
    "startDate": "2026-01-15",
    "endDate": "2026-03-17",
    "dailyBudgetUsd": 1585
  },
  {
    "campaignId": 20046,
    "appName": "BiteRush Go",
    "vertical": "food_delivery",
    "objective": "order",
    "countries": [
      "ES",
      "JP",
      "FR",
      "US"
    ],
    "startDate": "2026-01-17",
    "endDate": "2026-03-04",
    "dailyBudgetUsd": 3408
  },
  {
    "campaignId": 20047,
    "appName": "FluxStream Stream",
    "vertical": "entertainment",
    "objective": "install",
    "countries": [
      "FR",
      "ES"
    ],
    "startDate": "2026-01-16",
    "endDate": "2026-03-28",
    "dailyBudgetUsd": 6546
  },
  {
    "campaignId": 20048,
    "appName": "VoxelRealm Legends",
    "vertical": "gaming",
    "objective": "install",
    "countries": [
      "FR",
      "US",
      "ES"
    ],
    "startDate": "2026-01-21",
    "endDate": "2026-03-29",
    "dailyBudgetUsd": 3275
  },
  {
    "campaignId": 20049,
    "appName": "BoltCart Market",
    "vertical": "ecommerce",
    "objective": "purchase",
    "countries": [
      "JP",
      "US"
    ],
    "startDate": "2026-01-07",
    "endDate": "2026-03-13",
    "dailyBudgetUsd": 2480
  },
  {
    "campaignId": 20050,
    "appName": "VaultRun Cash",
    "vertical": "fintech",
    "objective": "signup",
    "countries": [
      "FR",
      "JP",
      "BR",
      "ES"
    ],
    "startDate": "2026-01-16",
    "endDate": "2026-03-01",
    "dailyBudgetUsd": 5820
  },
  {
    "campaignId": 20051,
    "appName": "HorizonHop Flights",
    "vertical": "travel",
    "objective": "booking",
    "countries": [
      "BR",
      "JP"
    ],
    "startDate": "2026-01-03",
    "endDate": "2026-03-06",
    "dailyBudgetUsd": 3239
  },
  {
    "campaignId": 20052,
    "appName": "FreshDash Eats",
    "vertical": "food_delivery",
    "objective": "order",
    "countries": [
      "FR",
      "DE",
      "UK",
      "MX"
    ],
    "startDate": "2026-01-08",
    "endDate": "2026-03-08",
    "dailyBudgetUsd": 3088
  },
  {
    "campaignId": 20053,
    "appName": "PulsePlay Play",
    "vertical": "entertainment",
    "objective": "signup",
    "countries": [
      "UK",
      "US"
    ],
    "startDate": "2026-01-05",
    "endDate": "2026-03-03",
    "dailyBudgetUsd": 3256
  },
  {
    "campaignId": 20054,
    "appName": "StormByte Saga",
    "vertical": "gaming",
    "objective": "install",
    "countries": [
      "CA",
      "DE",
      "US"
    ],
    "startDate": "2026-01-07",
    "endDate": "2026-03-14",
    "dailyBudgetUsd": 2845
  },
  {
    "campaignId": 20055,
    "appName": "ZenDrop Shop",
    "vertical": "ecommerce",
    "objective": "purchase",
    "countries": [
      "DE",
      "CA",
      "IT"
    ],
    "startDate": "2026-01-09",
    "endDate": "2026-03-21",
    "dailyBudgetUsd": 2674
  },
  {
    "campaignId": 20056,
    "appName": "NovaPay Bank",
    "vertical": "fintech",
    "objective": "signup",
    "countries": [
      "US",
      "FR"
    ],
    "startDate": "2026-01-14",
    "endDate": "2026-03-15",
    "dailyBudgetUsd": 1804
  },
  {
    "campaignId": 20057,
    "appName": "RouteBloom Deals",
    "vertical": "travel",
    "objective": "booking",
    "countries": [
      "IT",
      "US",
      "MX"
    ],
    "startDate": "2026-01-02",
    "endDate": "2026-03-16",
    "dailyBudgetUsd": 3553
  },
  {
    "campaignId": 20058,
    "appName": "CraveLoop Bites",
    "vertical": "food_delivery",
    "objective": "order",
    "countries": [
      "UK",
      "FR",
      "JP",
      "US"
    ],
    "startDate": "2026-01-14",
    "endDate": "2026-03-09",
    "dailyBudgetUsd": 2883
  },
  {
    "campaignId": 20059,
    "appName": "NeonCast Now",
    "vertical": "entertainment",
    "objective": "signup",
    "countries": [
      "FR",
      "IT",
      "ES"
    ],
    "startDate": "2026-01-04",
    "endDate": "2026-02-22",
    "dailyBudgetUsd": 4525
  },
  {
    "campaignId": 20060,
    "appName": "GlitchWave Saga",
    "vertical": "gaming",
    "objective": "install",
    "countries": [
      "BR",
      "JP"
    ],
    "startDate": "2026-01-15",
    "endDate": "2026-03-13",
    "dailyBudgetUsd": 2619
  },
  {
    "campaignId": 20061,
    "appName": "LuxShelf Shop",
    "vertical": "ecommerce",
    "objective": "purchase",
    "countries": [
      "CA",
      "UK"
    ],
    "startDate": "2026-01-12",
    "endDate": "2026-03-05",
    "dailyBudgetUsd": 1529
  },
  {
    "campaignId": 20062,
    "appName": "ClearLedger Cash",
    "vertical": "fintech",
    "objective": "signup",
    "countries": [
      "IT",
      "MX",
      "ES"
    ],
    "startDate": "2026-01-16",
    "endDate": "2026-03-09",
    "dailyBudgetUsd": 2878
  },
  {
    "campaignId": 20063,
    "appName": "WayPoint Travel",
    "vertical": "travel",
    "objective": "booking",
    "countries": [
      "BR",
      "ES",
      "CA",
      "UK"
    ],
    "startDate": "2026-01-14",
    "endDate": "2026-03-29",
    "dailyBudgetUsd": 5403
  },
  {
    "campaignId": 20064,
    "appName": "QuickFork Express",
    "vertical": "food_delivery",
    "objective": "order",
    "countries": [
      "US",
      "IT"
    ],
    "startDate": "2026-01-01",
    "endDate": "2026-02-16",
    "dailyBudgetUsd": 2606
  },
  {
    "campaignId": 20065,
    "appName": "BingeLayer Now",
    "vertical": "entertainment",
    "objective": "install",
    "countries": [
      "ES",
      "CA",
      "MX"
    ],
    "startDate": "2026-01-21",
    "endDate": "2026-04-02",
    "dailyBudgetUsd": 2183
  },
  {
    "campaignId": 20066,
    "appName": "IronQuest Battle",
    "vertical": "gaming",
    "objective": "install",
    "countries": [
      "US",
      "MX",
      "UK",
      "CA"
    ],
    "startDate": "2026-01-05",
    "endDate": "2026-03-10",
    "dailyBudgetUsd": 1963
  },
  {
    "campaignId": 20067,
    "appName": "CrispBox Club",
    "vertical": "ecommerce",
    "objective": "purchase",
    "countries": [
      "CA",
      "MX"
    ],
    "startDate": "2026-01-08",
    "endDate": "2026-03-18",
    "dailyBudgetUsd": 2064
  },
  {
    "campaignId": 20068,
    "appName": "SwiftStack Invest",
    "vertical": "fintech",
    "objective": "signup",
    "countries": [
      "FR",
      "JP",
      "MX",
      "UK"
    ],
    "startDate": "2026-01-18",
    "endDate": "2026-03-10",
    "dailyBudgetUsd": 2683
  },
  {
    "campaignId": 20069,
    "appName": "NomadLayer Trips",
    "vertical": "travel",
    "objective": "booking",
    "countries": [
      "US",
      "MX",
      "ES"
    ],
    "startDate": "2026-01-08",
    "endDate": "2026-03-14",
    "dailyBudgetUsd": 1972
  },
  {
    "campaignId": 20070,
    "appName": "PlateSprint Go",
    "vertical": "food_delivery",
    "objective": "order",
    "countries": [
      "JP",
      "US"
    ],
    "startDate": "2026-01-12",
    "endDate": "2026-03-18",
    "dailyBudgetUsd": 5035
  },
  {
    "campaignId": 20071,
    "appName": "StarVault Play",
    "vertical": "entertainment",
    "objective": "install",
    "countries": [
      "FR",
      "BR"
    ],
    "startDate": "2026-01-10",
    "endDate": "2026-03-19",
    "dailyBudgetUsd": 2700
  },
  {
    "campaignId": 20072,
    "appName": "PixelForge Rush",
    "vertical": "gaming",
    "objective": "install",
    "countries": [
      "ES",
      "FR",
      "BR"
    ],
    "startDate": "2026-01-08",
    "endDate": "2026-03-08",
    "dailyBudgetUsd": 3096
  },
  {
    "campaignId": 20073,
    "appName": "VantaStyle Club",
    "vertical": "ecommerce",
    "objective": "purchase",
    "countries": [
      "UK",
      "IT",
      "US",
      "CA"
    ],
    "startDate": "2026-01-02",
    "endDate": "2026-02-20",
    "dailyBudgetUsd": 4931
  },
  {
    "campaignId": 20074,
    "appName": "EarnPath Bank",
    "vertical": "fintech",
    "objective": "signup",
    "countries": [
      "CA",
      "MX",
      "UK"
    ],
    "startDate": "2026-01-02",
    "endDate": "2026-02-24",
    "dailyBudgetUsd": 5045
  },
  {
    "campaignId": 20075,
    "appName": "CloudRoute Getaway",
    "vertical": "travel",
    "objective": "booking",
    "countries": [
      "JP",
      "UK",
      "CA"
    ],
    "startDate": "2026-01-12",
    "endDate": "2026-03-10",
    "dailyBudgetUsd": 2767
  },
  {
    "campaignId": 20076,
    "appName": "SnapMeal Go",
    "vertical": "food_delivery",
    "objective": "order",
    "countries": [
      "DE",
      "FR",
      "IT"
    ],
    "startDate": "2026-01-07",
    "endDate": "2026-03-03",
    "dailyBudgetUsd": 3348
  },
  {
    "campaignId": 20077,
    "appName": "MoonScreen Stream",
    "vertical": "entertainment",
    "objective": "signup",
    "countries": [
      "DE",
      "JP",
      "US"
    ],
    "startDate": "2026-01-02",
    "endDate": "2026-02-27",
    "dailyBudgetUsd": 3855
  },
  {
    "campaignId": 20078,
    "appName": "NeonArena Rush",
    "vertical": "gaming",
    "objective": "install",
    "countries": [
      "US",
      "FR"
    ],
    "startDate": "2026-01-12",
    "endDate": "2026-03-05",
    "dailyBudgetUsd": 2786
  },
  {
    "campaignId": 20079,
    "appName": "ThreadMark Store",
    "vertical": "ecommerce",
    "objective": "purchase",
    "countries": [
      "DE",
      "FR",
      "BR"
    ],
    "startDate": "2026-01-04",
    "endDate": "2026-03-04",
    "dailyBudgetUsd": 1599
  },
  {
    "campaignId": 20080,
    "appName": "CoinBridge Wallet",
    "vertical": "fintech",
    "objective": "signup",
    "countries": [
      "IT",
      "JP",
      "UK"
    ],
    "startDate": "2026-01-05",
    "endDate": "2026-03-09",
    "dailyBudgetUsd": 3748
  },
  {
    "campaignId": 20081,
    "appName": "DriftPass Travel",
    "vertical": "travel",
    "objective": "booking",
    "countries": [
      "JP",
      "DE",
      "CA"
    ],
    "startDate": "2026-01-08",
    "endDate": "2026-03-06",
    "dailyBudgetUsd": 4076
  },
  {
    "campaignId": 20082,
    "appName": "BiteRush Eats",
    "vertical": "food_delivery",
    "objective": "order",
    "countries": [
      "BR",
      "MX",
      "DE"
    ],
    "startDate": "2026-01-09",
    "endDate": "2026-03-13",
    "dailyBudgetUsd": 3447
  },
  {
    "campaignId": 20083,
    "appName": "FluxStream Stream",
    "vertical": "entertainment",
    "objective": "signup",
    "countries": [
      "IT",
      "JP"
    ],
    "startDate": "2026-01-05",
    "endDate": "2026-03-03",
    "dailyBudgetUsd": 2157
  },
  {
    "campaignId": 20084,
    "appName": "VoxelRealm Legends",
    "vertical": "gaming",
    "objective": "install",
    "countries": [
      "CA",
      "FR",
      "BR",
      "UK"
    ],
    "startDate": "2026-01-09",
    "endDate": "2026-02-28",
    "dailyBudgetUsd": 2783
  },
  {
    "campaignId": 20085,
    "appName": "BoltCart Drops",
    "vertical": "ecommerce",
    "objective": "purchase",
    "countries": [
      "ES",
      "MX"
    ],
    "startDate": "2026-01-11",
    "endDate": "2026-02-26",
    "dailyBudgetUsd": 2424
  },
  {
    "campaignId": 20086,
    "appName": "VaultRun Pay",
    "vertical": "fintech",
    "objective": "signup",
    "countries": [
      "BR",
      "MX"
    ],
    "startDate": "2026-01-02",
    "endDate": "2026-02-18",
    "dailyBudgetUsd": 2684
  },
  {
    "campaignId": 20087,
    "appName": "HorizonHop Flights",
    "vertical": "travel",
    "objective": "booking",
    "countries": [
      "JP",
      "DE"
    ],
    "startDate": "2026-01-02",
    "endDate": "2026-02-21",
    "dailyBudgetUsd": 4693
  },
  {
    "campaignId": 20088,
    "appName": "FreshDash Go",
    "vertical": "food_delivery",
    "objective": "order",
    "countries": [
      "BR",
      "UK",
      "JP"
    ],
    "startDate": "2026-01-04",
    "endDate": "2026-03-09",
    "dailyBudgetUsd": 5091
  },
  {
    "campaignId": 20089,
    "appName": "PulsePlay Stream",
    "vertical": "entertainment",
    "objective": "install",
    "countries": [
      "DE",
      "MX"
    ],
    "startDate": "2026-01-02",
    "endDate": "2026-03-06",
    "dailyBudgetUsd": 3767
  },
  {
    "campaignId": 20090,
    "appName": "StormByte Arena",
    "vertical": "gaming",
    "objective": "install",
    "countries": [
      "IT",
      "DE",
      "UK"
    ],
    "startDate": "2026-01-02",
    "endDate": "2026-03-12",
    "dailyBudgetUsd": 3612
  },
  {
    "campaignId": 20091,
    "appName": "ZenDrop Market",
    "vertical": "ecommerce",
    "objective": "purchase",
    "countries": [
      "IT",
      "CA"
    ],
    "startDate": "2026-01-21",
    "endDate": "2026-03-11",
    "dailyBudgetUsd": 3777
  },
  {
    "campaignId": 20092,
    "appName": "NovaPay Pay",
    "vertical": "fintech",
    "objective": "signup",
    "countries": [
      "FR",
      "MX",
      "IT"
    ],
    "startDate": "2026-01-14",
    "endDate": "2026-03-12",
    "dailyBudgetUsd": 2968
  },
  {
    "campaignId": 20093,
    "appName": "RouteBloom Travel",
    "vertical": "travel",
    "objective": "booking",
    "countries": [
      "IT",
      "MX"
    ],
    "startDate": "2026-01-14",
    "endDate": "2026-03-02",
    "dailyBudgetUsd": 2903
  },
  {
    "campaignId": 20094,
    "appName": "CraveLoop Express",
    "vertical": "food_delivery",
    "objective": "order",
    "countries": [
      "DE",
      "JP",
      "UK",
      "CA"
    ],
    "startDate": "2026-01-21",
    "endDate": "2026-03-31",
    "dailyBudgetUsd": 2354
  },
  {
    "campaignId": 20095,
    "appName": "NeonCast Stream",
    "vertical": "entertainment",
    "objective": "signup",
    "countries": [
      "MX",
      "DE",
      "UK",
      "CA"
    ],
    "startDate": "2026-01-03",
    "endDate": "2026-02-19",
    "dailyBudgetUsd": 2923
  },
  {
    "campaignId": 20096,
    "appName": "GlitchWave Legends",
    "vertical": "gaming",
    "objective": "install",
    "countries": [
      "FR",
      "UK"
    ],
    "startDate": "2026-01-20",
    "endDate": "2026-04-03",
    "dailyBudgetUsd": 6574
  },
  {
    "campaignId": 20097,
    "appName": "LuxShelf Outlet",
    "vertical": "ecommerce",
    "objective": "purchase",
    "countries": [
      "UK",
      "ES",
      "IT",
      "FR"
    ],
    "startDate": "2026-01-02",
    "endDate": "2026-02-27",
    "dailyBudgetUsd": 4040
  },
  {
    "campaignId": 20098,
    "appName": "ClearLedger Wallet",
    "vertical": "fintech",
    "objective": "signup",
    "countries": [
      "CA",
      "UK",
      "ES"
    ],
    "startDate": "2026-01-11",
    "endDate": "2026-02-27",
    "dailyBudgetUsd": 2644
  },
  {
    "campaignId": 20099,
    "appName": "WayPoint Travel",
    "vertical": "travel",
    "objective": "booking",
    "countries": [
      "FR",
      "IT",
      "MX",
      "JP"
    ],
    "startDate": "2026-01-15",
    "endDate": "2026-03-16",
    "dailyBudgetUsd": 2527
  },
  {
    "campaignId": 20100,
    "appName": "QuickFork Kitchen",
    "vertical": "food_delivery",
    "objective": "order",
    "countries": [
      "US",
      "JP"
    ],
    "startDate": "2026-01-06",
    "endDate": "2026-03-16",
    "dailyBudgetUsd": 2202
  },
  {
    "campaignId": 20101,
    "appName": "BingeLayer Plus",
    "vertical": "entertainment",
    "objective": "signup",
    "countries": [
      "CA",
      "UK"
    ],
    "startDate": "2026-01-15",
    "endDate": "2026-03-16",
    "dailyBudgetUsd": 3398
  },
  {
    "campaignId": 20102,
    "appName": "IronQuest Arena",
    "vertical": "gaming",
    "objective": "install",
    "countries": [
      "CA",
      "DE"
    ],
    "startDate": "2026-01-21",
    "endDate": "2026-04-05",
    "dailyBudgetUsd": 3418
  },
  {
    "campaignId": 20103,
    "appName": "CrispBox Club",
    "vertical": "ecommerce",
    "objective": "purchase",
    "countries": [
      "MX",
      "CA"
    ],
    "startDate": "2026-01-06",
    "endDate": "2026-03-12",
    "dailyBudgetUsd": 1798
  },
  {
    "campaignId": 20104,
    "appName": "SwiftStack Invest",
    "vertical": "fintech",
    "objective": "signup",
    "countries": [
      "MX",
      "FR",
      "UK"
    ],
    "startDate": "2026-01-09",
    "endDate": "2026-03-10",
    "dailyBudgetUsd": 3534
  },
  {
    "campaignId": 20105,
    "appName": "NomadLayer Flights",
    "vertical": "travel",
    "objective": "booking",
    "countries": [
      "FR",
      "BR",
      "ES",
      "UK"
    ],
    "startDate": "2026-01-13",
    "endDate": "2026-03-03",
    "dailyBudgetUsd": 2442
  },
  {
    "campaignId": 20106,
    "appName": "PlateSprint Go",
    "vertical": "food_delivery",
    "objective": "order",
    "countries": [
      "UK",
      "FR",
      "CA"
    ],
    "startDate": "2026-01-15",
    "endDate": "2026-03-17",
    "dailyBudgetUsd": 4911
  },
  {
    "campaignId": 20107,
    "appName": "StarVault Plus",
    "vertical": "entertainment",
    "objective": "install",
    "countries": [
      "IT",
      "DE",
      "FR",
      "ES"
    ],
    "startDate": "2026-01-03",
    "endDate": "2026-03-02",
    "dailyBudgetUsd": 3149
  },
  {
    "campaignId": 20108,
    "appName": "PixelForge Battle",
    "vertical": "gaming",
    "objective": "install",
    "countries": [
      "US",
      "FR",
      "BR",
      "UK"
    ],
    "startDate": "2026-01-02",
    "endDate": "2026-02-22",
    "dailyBudgetUsd": 5438
  },
  {
    "campaignId": 20109,
    "appName": "VantaStyle Outlet",
    "vertical": "ecommerce",
    "objective": "purchase",
    "countries": [
      "IT",
      "MX",
      "DE",
      "US"
    ],
    "startDate": "2026-01-01",
    "endDate": "2026-02-15",
    "dailyBudgetUsd": 2539
  },
  {
    "campaignId": 20110,
    "appName": "EarnPath Invest",
    "vertical": "fintech",
    "objective": "signup",
    "countries": [
      "CA",
      "BR",
      "DE"
    ],
    "startDate": "2026-01-19",
    "endDate": "2026-03-08",
    "dailyBudgetUsd": 2695
  },
  {
    "campaignId": 20111,
    "appName": "CloudRoute Travel",
    "vertical": "travel",
    "objective": "booking",
    "countries": [
      "JP",
      "UK",
      "BR",
      "US"
    ],
    "startDate": "2026-01-03",
    "endDate": "2026-03-08",
    "dailyBudgetUsd": 3310
  },
  {
    "campaignId": 20112,
    "appName": "SnapMeal Express",
    "vertical": "food_delivery",
    "objective": "order",
    "countries": [
      "FR",
      "US",
      "BR"
    ],
    "startDate": "2026-01-20",
    "endDate": "2026-04-03",
    "dailyBudgetUsd": 4313
  },
  {
    "campaignId": 20113,
    "appName": "MoonScreen Play",
    "vertical": "entertainment",
    "objective": "install",
    "countries": [
      "US",
      "MX"
    ],
    "startDate": "2026-01-08",
    "endDate": "2026-02-26",
    "dailyBudgetUsd": 3633
  },
  {
    "campaignId": 20114,
    "appName": "NeonArena Quest",
    "vertical": "gaming",
    "objective": "install",
    "countries": [
      "MX",
      "BR"
    ],
    "startDate": "2026-01-07",
    "endDate": "2026-03-08",
    "dailyBudgetUsd": 1935
  },
  {
    "campaignId": 20115,
    "appName": "ThreadMark Market",
    "vertical": "ecommerce",
    "objective": "purchase",
    "countries": [
      "FR",
      "CA",
      "MX",
      "DE"
    ],
    "startDate": "2026-01-13",
    "endDate": "2026-03-25",
    "dailyBudgetUsd": 3178
  },
  {
    "campaignId": 20116,
    "appName": "CoinBridge Cash",
    "vertical": "fintech",
    "objective": "signup",
    "countries": [
      "JP",
      "UK"
    ],
    "startDate": "2026-01-21",
    "endDate": "2026-03-07",
    "dailyBudgetUsd": 3004
  },
  {
    "campaignId": 20117,
    "appName": "DriftPass Getaway",
    "vertical": "travel",
    "objective": "booking",
    "countries": [
      "US",
      "FR",
      "IT"
    ],
    "startDate": "2026-01-03",
    "endDate": "2026-03-16",
    "dailyBudgetUsd": 2565
  },
  {
    "campaignId": 20118,
    "appName": "BiteRush Bites",
    "vertical": "food_delivery",
    "objective": "order",
    "countries": [
      "ES",
      "MX",
      "UK"
    ],
    "startDate": "2026-01-11",
    "endDate": "2026-03-15",
    "dailyBudgetUsd": 2375
  },
  {
    "campaignId": 20119,
    "appName": "FluxStream Box",
    "vertical": "entertainment",
    "objective": "signup",
    "countries": [
      "JP",
      "MX",
      "US",
      "IT"
    ],
    "startDate": "2026-01-19",
    "endDate": "2026-04-01",
    "dailyBudgetUsd": 5495
  },
  {
    "campaignId": 20120,
    "appName": "VoxelRealm Arena",
    "vertical": "gaming",
    "objective": "install",
    "countries": [
      "MX",
      "CA",
      "UK"
    ],
    "startDate": "2026-01-04",
    "endDate": "2026-03-08",
    "dailyBudgetUsd": 2600
  },
  {
    "campaignId": 20121,
    "appName": "BoltCart Market",
    "vertical": "ecommerce",
    "objective": "purchase",
    "countries": [
      "US",
      "MX"
    ],
    "startDate": "2026-01-03",
    "endDate": "2026-03-11",
    "dailyBudgetUsd": 2217
  },
  {
    "campaignId": 20122,
    "appName": "VaultRun Wallet",
    "vertical": "fintech",
    "objective": "signup",
    "countries": [
      "DE",
      "ES",
      "CA",
      "IT"
    ],
    "startDate": "2026-01-07",
    "endDate": "2026-02-26",
    "dailyBudgetUsd": 3725
  },
  {
    "campaignId": 20123,
    "appName": "HorizonHop Flights",
    "vertical": "travel",
    "objective": "booking",
    "countries": [
      "CA",
      "FR"
    ],
    "startDate": "2026-01-21",
    "endDate": "2026-03-12",
    "dailyBudgetUsd": 3120
  },
  {
    "campaignId": 20124,
    "appName": "FreshDash Delivery",
    "vertical": "food_delivery",
    "objective": "order",
    "countries": [
      "IT",
      "FR",
      "US"
    ],
    "startDate": "2026-01-12",
    "endDate": "2026-03-26",
    "dailyBudgetUsd": 2902
  },
  {
    "campaignId": 20125,
    "appName": "PulsePlay Now",
    "vertical": "entertainment",
    "objective": "signup",
    "countries": [
      "MX",
      "US",
      "IT"
    ],
    "startDate": "2026-01-12",
    "endDate": "2026-03-12",
    "dailyBudgetUsd": 3918
  },
  {
    "campaignId": 20126,
    "appName": "StormByte Arena",
    "vertical": "gaming",
    "objective": "install",
    "countries": [
      "MX",
      "FR"
    ],
    "startDate": "2026-01-10",
    "endDate": "2026-03-19",
    "dailyBudgetUsd": 3536
  },
  {
    "campaignId": 20127,
    "appName": "ZenDrop Club",
    "vertical": "ecommerce",
    "objective": "purchase",
    "countries": [
      "JP",
      "CA",
      "MX"
    ],
    "startDate": "2026-01-17",
    "endDate": "2026-03-10",
    "dailyBudgetUsd": 3383
  },
  {
    "campaignId": 20128,
    "appName": "NovaPay Pay",
    "vertical": "fintech",
    "objective": "signup",
    "countries": [
      "ES",
      "JP"
    ],
    "startDate": "2026-01-16",
    "endDate": "2026-03-26",
    "dailyBudgetUsd": 4177
  },
  {
    "campaignId": 20129,
    "appName": "RouteBloom Travel",
    "vertical": "travel",
    "objective": "booking",
    "countries": [
      "CA",
      "IT",
      "BR"
    ],
    "startDate": "2026-01-12",
    "endDate": "2026-03-03",
    "dailyBudgetUsd": 3292
  },
  {
    "campaignId": 20130,
    "appName": "CraveLoop Kitchen",
    "vertical": "food_delivery",
    "objective": "order",
    "countries": [
      "BR",
      "MX",
      "UK"
    ],
    "startDate": "2026-01-18",
    "endDate": "2026-03-22",
    "dailyBudgetUsd": 2402
  },
  {
    "campaignId": 20131,
    "appName": "NeonCast Stream",
    "vertical": "entertainment",
    "objective": "signup",
    "countries": [
      "DE",
      "BR",
      "UK",
      "IT"
    ],
    "startDate": "2026-01-15",
    "endDate": "2026-03-22",
    "dailyBudgetUsd": 2625
  },
  {
    "campaignId": 20132,
    "appName": "GlitchWave Rush",
    "vertical": "gaming",
    "objective": "install",
    "countries": [
      "DE",
      "JP"
    ],
    "startDate": "2026-01-09",
    "endDate": "2026-03-03",
    "dailyBudgetUsd": 2484
  },
  {
    "campaignId": 20133,
    "appName": "LuxShelf Outlet",
    "vertical": "ecommerce",
    "objective": "purchase",
    "countries": [
      "DE",
      "BR"
    ],
    "startDate": "2026-01-07",
    "endDate": "2026-02-28",
    "dailyBudgetUsd": 3207
  },
  {
    "campaignId": 20134,
    "appName": "ClearLedger Cash",
    "vertical": "fintech",
    "objective": "signup",
    "countries": [
      "ES",
      "IT"
    ],
    "startDate": "2026-01-14",
    "endDate": "2026-03-07",
    "dailyBudgetUsd": 2044
  },
  {
    "campaignId": 20135,
    "appName": "WayPoint Trips",
    "vertical": "travel",
    "objective": "booking",
    "countries": [
      "FR",
      "ES"
    ],
    "startDate": "2026-01-13",
    "endDate": "2026-03-25",
    "dailyBudgetUsd": 1569
  },
  {
    "campaignId": 20136,
    "appName": "QuickFork Eats",
    "vertical": "food_delivery",
    "objective": "order",
    "countries": [
      "FR",
      "JP",
      "US",
      "CA"
    ],
    "startDate": "2026-01-14",
    "endDate": "2026-03-21",
    "dailyBudgetUsd": 3074
  },
  {
    "campaignId": 20137,
    "appName": "BingeLayer Plus",
    "vertical": "entertainment",
    "objective": "signup",
    "countries": [
      "ES",
      "UK",
      "CA",
      "MX"
    ],
    "startDate": "2026-01-14",
    "endDate": "2026-03-06",
    "dailyBudgetUsd": 1867
  },
  {
    "campaignId": 20138,
    "appName": "IronQuest Rush",
    "vertical": "gaming",
    "objective": "install",
    "countries": [
      "IT",
      "JP",
      "BR"
    ],
    "startDate": "2026-01-21",
    "endDate": "2026-03-16",
    "dailyBudgetUsd": 1505
  },
  {
    "campaignId": 20139,
    "appName": "CrispBox Outlet",
    "vertical": "ecommerce",
    "objective": "purchase",
    "countries": [
      "CA",
      "US",
      "FR"
    ],
    "startDate": "2026-01-17",
    "endDate": "2026-03-13",
    "dailyBudgetUsd": 3397
  },
  {
    "campaignId": 20140,
    "appName": "SwiftStack Invest",
    "vertical": "fintech",
    "objective": "signup",
    "countries": [
      "ES",
      "JP",
      "US",
      "DE"
    ],
    "startDate": "2026-01-07",
    "endDate": "2026-03-13",
    "dailyBudgetUsd": 2324
  },
  {
    "campaignId": 20141,
    "appName": "NomadLayer Travel",
    "vertical": "travel",
    "objective": "booking",
    "countries": [
      "CA",
      "DE",
      "US",
      "UK"
    ],
    "startDate": "2026-01-01",
    "endDate": "2026-02-16",
    "dailyBudgetUsd": 3546
  },
  {
    "campaignId": 20142,
    "appName": "PlateSprint Go",
    "vertical": "food_delivery",
    "objective": "order",
    "countries": [
      "MX",
      "FR",
      "CA"
    ],
    "startDate": "2026-01-17",
    "endDate": "2026-03-09",
    "dailyBudgetUsd": 2475
  },
  {
    "campaignId": 20143,
    "appName": "StarVault Play",
    "vertical": "entertainment",
    "objective": "install",
    "countries": [
      "UK",
      "MX"
    ],
    "startDate": "2026-01-05",
    "endDate": "2026-03-01",
    "dailyBudgetUsd": 2012
  },
  {
    "campaignId": 20144,
    "appName": "PixelForge Legends",
    "vertical": "gaming",
    "objective": "install",
    "countries": [
      "BR",
      "UK",
      "JP"
    ],
    "startDate": "2026-01-09",
    "endDate": "2026-03-07",
    "dailyBudgetUsd": 1929
  },
  {
    "campaignId": 20145,
    "appName": "VantaStyle Shop",
    "vertical": "ecommerce",
    "objective": "purchase",
    "countries": [
      "FR",
      "DE"
    ],
    "startDate": "2026-01-16",
    "endDate": "2026-03-14",
    "dailyBudgetUsd": 2489
  },
  {
    "campaignId": 20146,
    "appName": "EarnPath Saver",
    "vertical": "fintech",
    "objective": "signup",
    "countries": [
      "FR",
      "IT"
    ],
    "startDate": "2026-01-05",
    "endDate": "2026-03-06",
    "dailyBudgetUsd": 2708
  },
  {
    "campaignId": 20147,
    "appName": "CloudRoute Getaway",
    "vertical": "travel",
    "objective": "booking",
    "countries": [
      "ES",
      "CA"
    ],
    "startDate": "2026-01-19",
    "endDate": "2026-03-08",
    "dailyBudgetUsd": 2234
  },
  {
    "campaignId": 20148,
    "appName": "SnapMeal Express",
    "vertical": "food_delivery",
    "objective": "order",
    "countries": [
      "DE",
      "UK",
      "ES"
    ],
    "startDate": "2026-01-18",
    "endDate": "2026-03-28",
    "dailyBudgetUsd": 2701
  },
  {
    "campaignId": 20149,
    "appName": "MoonScreen Box",
    "vertical": "entertainment",
    "objective": "signup",
    "countries": [
      "ES",
      "BR",
      "CA"
    ],
    "startDate": "2026-01-18",
    "endDate": "2026-03-06",
    "dailyBudgetUsd": 1741
  },
  {
    "campaignId": 20150,
    "appName": "NeonArena Saga",
    "vertical": "gaming",
    "objective": "install",
    "countries": [
      "UK",
      "JP"
    ],
    "startDate": "2026-01-05",
    "endDate": "2026-03-12",
    "dailyBudgetUsd": 2996
  },
  {
    "campaignId": 20151,
    "appName": "ThreadMark Club",
    "vertical": "ecommerce",
    "objective": "purchase",
    "countries": [
      "UK",
      "BR",
      "US"
    ],
    "startDate": "2026-01-10",
    "endDate": "2026-03-21",
    "dailyBudgetUsd": 1591
  },
  {
    "campaignId": 20152,
    "appName": "CoinBridge Pay",
    "vertical": "fintech",
    "objective": "signup",
    "countries": [
      "IT",
      "CA",
      "UK"
    ],
    "startDate": "2026-01-01",
    "endDate": "2026-03-05",
    "dailyBudgetUsd": 2785
  },
  {
    "campaignId": 20153,
    "appName": "DriftPass Trips",
    "vertical": "travel",
    "objective": "booking",
    "countries": [
      "BR",
      "JP"
    ],
    "startDate": "2026-01-14",
    "endDate": "2026-03-19",
    "dailyBudgetUsd": 3804
  },
  {
    "campaignId": 20154,
    "appName": "BiteRush Delivery",
    "vertical": "food_delivery",
    "objective": "order",
    "countries": [
      "DE",
      "MX"
    ],
    "startDate": "2026-01-11",
    "endDate": "2026-03-09",
    "dailyBudgetUsd": 4368
  },
  {
    "campaignId": 20155,
    "appName": "FluxStream Now",
    "vertical": "entertainment",
    "objective": "signup",
    "countries": [
      "FR",
      "DE",
      "JP"
    ],
    "startDate": "2026-01-17",
    "endDate": "2026-03-13",
    "dailyBudgetUsd": 5431
  },
  {
    "campaignId": 20156,
    "appName": "VoxelRealm Quest",
    "vertical": "gaming",
    "objective": "install",
    "countries": [
      "DE",
      "ES"
    ],
    "startDate": "2026-01-02",
    "endDate": "2026-02-27",
    "dailyBudgetUsd": 1729
  },
  {
    "campaignId": 20157,
    "appName": "BoltCart Club",
    "vertical": "ecommerce",
    "objective": "purchase",
    "countries": [
      "FR",
      "CA",
      "US"
    ],
    "startDate": "2026-01-17",
    "endDate": "2026-03-31",
    "dailyBudgetUsd": 3887
  },
  {
    "campaignId": 20158,
    "appName": "VaultRun Pay",
    "vertical": "fintech",
    "objective": "signup",
    "countries": [
      "CA",
      "ES",
      "US",
      "DE"
    ],
    "startDate": "2026-01-04",
    "endDate": "2026-03-10",
    "dailyBudgetUsd": 4546
  },
  {
    "campaignId": 20159,
    "appName": "HorizonHop Escapes",
    "vertical": "travel",
    "objective": "booking",
    "countries": [
      "CA",
      "US",
      "DE"
    ],
    "startDate": "2026-01-10",
    "endDate": "2026-02-28",
    "dailyBudgetUsd": 4201
  },
  {
    "campaignId": 20160,
    "appName": "FreshDash Eats",
    "vertical": "food_delivery",
    "objective": "order",
    "countries": [
      "US",
      "IT",
      "MX"
    ],
    "startDate": "2026-01-19",
    "endDate": "2026-03-26",
    "dailyBudgetUsd": 2153
  },
  {
    "campaignId": 20161,
    "appName": "PulsePlay Play",
    "vertical": "entertainment",
    "objective": "install",
    "countries": [
      "US",
      "IT"
    ],
    "startDate": "2026-01-18",
    "endDate": "2026-03-06",
    "dailyBudgetUsd": 3443
  },
  {
    "campaignId": 20162,
    "appName": "StormByte Arena",
    "vertical": "gaming",
    "objective": "install",
    "countries": [
      "UK",
      "US"
    ],
    "startDate": "2026-01-03",
    "endDate": "2026-02-22",
    "dailyBudgetUsd": 5715
  },
  {
    "campaignId": 20163,
    "appName": "ZenDrop Store",
    "vertical": "ecommerce",
    "objective": "purchase",
    "countries": [
      "US",
      "FR",
      "ES"
    ],
    "startDate": "2026-01-05",
    "endDate": "2026-03-13",
    "dailyBudgetUsd": 1765
  },
  {
    "campaignId": 20164,
    "appName": "NovaPay Wallet",
    "vertical": "fintech",
    "objective": "signup",
    "countries": [
      "JP",
      "MX",
      "FR",
      "US"
    ],
    "startDate": "2026-01-01",
    "endDate": "2026-03-14",
    "dailyBudgetUsd": 3521
  },
  {
    "campaignId": 20165,
    "appName": "RouteBloom Getaway",
    "vertical": "travel",
    "objective": "booking",
    "countries": [
      "FR",
      "UK",
      "JP"
    ],
    "startDate": "2026-01-19",
    "endDate": "2026-03-27",
    "dailyBudgetUsd": 4399
  },
  {
    "campaignId": 20166,
    "appName": "CraveLoop Go",
    "vertical": "food_delivery",
    "objective": "order",
    "countries": [
      "UK",
      "CA"
    ],
    "startDate": "2026-01-16",
    "endDate": "2026-03-13",
    "dailyBudgetUsd": 2335
  },
  {
    "campaignId": 20167,
    "appName": "NeonCast Now",
    "vertical": "entertainment",
    "objective": "signup",
    "countries": [
      "DE",
      "FR",
      "BR",
      "US"
    ],
    "startDate": "2026-01-05",
    "endDate": "2026-03-09",
    "dailyBudgetUsd": 3655
  },
  {
    "campaignId": 20168,
    "appName": "GlitchWave Rush",
    "vertical": "gaming",
    "objective": "install",
    "countries": [
      "IT",
      "MX"
    ],
    "startDate": "2026-01-15",
    "endDate": "2026-03-09",
    "dailyBudgetUsd": 2049
  },
  {
    "campaignId": 20169,
    "appName": "LuxShelf Shop",
    "vertical": "ecommerce",
    "objective": "purchase",
    "countries": [
      "FR",
      "IT",
      "UK"
    ],
    "startDate": "2026-01-19",
    "endDate": "2026-03-08",
    "dailyBudgetUsd": 2243
  },
  {
    "campaignId": 20170,
    "appName": "ClearLedger Pay",
    "vertical": "fintech",
    "objective": "signup",
    "countries": [
      "BR",
      "CA",
      "JP"
    ],
    "startDate": "2026-01-10",
    "endDate": "2026-03-14",
    "dailyBudgetUsd": 2239
  },
  {
    "campaignId": 20171,
    "appName": "WayPoint Escapes",
    "vertical": "travel",
    "objective": "booking",
    "countries": [
      "ES",
      "FR",
      "US"
    ],
    "startDate": "2026-01-18",
    "endDate": "2026-03-28",
    "dailyBudgetUsd": 3188
  },
  {
    "campaignId": 20172,
    "appName": "QuickFork Kitchen",
    "vertical": "food_delivery",
    "objective": "order",
    "countries": [
      "IT",
      "BR"
    ],
    "startDate": "2026-01-07",
    "endDate": "2026-02-26",
    "dailyBudgetUsd": 2887
  },
  {
    "campaignId": 20173,
    "appName": "BingeLayer Play",
    "vertical": "entertainment",
    "objective": "signup",
    "countries": [
      "FR",
      "DE"
    ],
    "startDate": "2026-01-08",
    "endDate": "2026-02-22",
    "dailyBudgetUsd": 4162
  },
  {
    "campaignId": 20174,
    "appName": "IronQuest Legends",
    "vertical": "gaming",
    "objective": "install",
    "countries": [
      "DE",
      "JP"
    ],
    "startDate": "2026-01-12",
    "endDate": "2026-03-05",
    "dailyBudgetUsd": 2145
  },
  {
    "campaignId": 20175,
    "appName": "CrispBox Shop",
    "vertical": "ecommerce",
    "objective": "purchase",
    "countries": [
      "ES",
      "JP"
    ],
    "startDate": "2026-01-14",
    "endDate": "2026-03-02",
    "dailyBudgetUsd": 2847
  },
  {
    "campaignId": 20176,
    "appName": "SwiftStack Wallet",
    "vertical": "fintech",
    "objective": "signup",
    "countries": [
      "US",
      "DE",
      "ES"
    ],
    "startDate": "2026-01-02",
    "endDate": "2026-02-16",
    "dailyBudgetUsd": 4172
  },
  {
    "campaignId": 20177,
    "appName": "NomadLayer Getaway",
    "vertical": "travel",
    "objective": "booking",
    "countries": [
      "CA",
      "IT",
      "MX"
    ],
    "startDate": "2026-01-19",
    "endDate": "2026-03-11",
    "dailyBudgetUsd": 3627
  },
  {
    "campaignId": 20178,
    "appName": "PlateSprint Go",
    "vertical": "food_delivery",
    "objective": "order",
    "countries": [
      "JP",
      "UK"
    ],
    "startDate": "2026-01-06",
    "endDate": "2026-02-20",
    "dailyBudgetUsd": 1875
  },
  {
    "campaignId": 20179,
    "appName": "StarVault Now",
    "vertical": "entertainment",
    "objective": "signup",
    "countries": [
      "BR",
      "US"
    ],
    "startDate": "2026-01-02",
    "endDate": "2026-02-18",
    "dailyBudgetUsd": 3762
  }
];

export const DATASET_META = {
  totalAdvertisers: 36,
  totalCampaigns: 180,
  totalCreatives: 1080,
  totalDailyRows: 192315,
  source: 'Smadex Creative Intelligence Challenge — synthetic dataset',
};
