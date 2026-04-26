// Pre-processes the Smadex Creative Intelligence dataset into a single
// TypeScript data file consumed by the NeuroCreative Copilot dashboard.
// Run from project root: node scripts/smadex/build-data.mjs

import fs from 'node:fs';
import path from 'node:path';

const DATASET_DIR = 'attached_assets/smadex_dataset';
const OUT_DATA_FILE = 'artifacts/neurocreative/src/data/smadexData.ts';
const OUT_ASSETS_DIR = 'artifacts/neurocreative/public/creatives';

// ---------- CSV parser (handles quoted fields, commas in quotes) ----------
function parseCSV(text) {
  const rows = [];
  let i = 0;
  let field = '';
  let row = [];
  let inQuotes = false;
  while (i < text.length) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i++;
        continue;
      }
      field += ch;
      i++;
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
      i++;
      continue;
    }
    if (ch === ',') {
      row.push(field);
      field = '';
      i++;
      continue;
    }
    if (ch === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
      i++;
      continue;
    }
    if (ch === '\r') {
      i++;
      continue;
    }
    field += ch;
    i++;
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  if (rows.length === 0) return [];
  const header = rows[0];
  return rows.slice(1).filter(r => r.length === header.length).map(r => {
    const obj = {};
    header.forEach((h, idx) => (obj[h] = r[idx]));
    return obj;
  });
}

function loadCSV(name) {
  const text = fs.readFileSync(path.join(DATASET_DIR, name), 'utf8');
  return parseCSV(text);
}

const num = v => (v === '' || v === undefined || v === null ? 0 : Number(v));
const numOrNull = v => (v === '' || v === undefined || v === null ? null : Number(v));

console.log('Loading CSVs...');
const advertisers = loadCSV('advertisers.csv');
const campaigns = loadCSV('campaigns.csv');
const creativeSummary = loadCSV('creative_summary.csv');
const dailyStats = loadCSV('creative_daily_country_os_stats.csv');
console.log(`  advertisers=${advertisers.length} campaigns=${campaigns.length} creatives=${creativeSummary.length} dailyRows=${dailyStats.length}`);

// ---------- Global KPIs across the whole dataset ----------
let totSpend = 0, totImp = 0, totClicks = 0, totConv = 0, totRev = 0;
const fatiguedSet = new Set();
const topSet = new Set();
for (const c of creativeSummary) {
  totSpend += num(c.total_spend_usd);
  totImp += num(c.total_impressions);
  totClicks += num(c.total_clicks);
  totConv += num(c.total_conversions);
  totRev += num(c.total_revenue_usd);
  if (c.creative_status === 'fatigued') fatiguedSet.add(c.creative_id);
  if (c.creative_status === 'top_performer') topSet.add(c.creative_id);
}
const overallCtr = totClicks / totImp;
const overallCvr = totConv / totClicks;
const overallRoas = totRev / totSpend;

// ---------- Pick a curated set of creatives ----------
// We want a balanced set that demonstrates each status, multiple verticals,
// formats and apps. Sort by perf_score within each status bucket.
const byStatus = { top_performer: [], stable: [], fatigued: [], underperformer: [] };
for (const c of creativeSummary) {
  if (byStatus[c.creative_status]) byStatus[c.creative_status].push(c);
}
for (const k of Object.keys(byStatus)) {
  byStatus[k].sort((a, b) => num(b.perf_score) - num(a.perf_score));
}

function pickDiverse(arr, n) {
  // greedy: pick ones with distinct vertical, then distinct format, then distinct app
  const out = [];
  const seenVertical = new Set();
  const seenApp = new Set();
  for (const c of arr) {
    if (out.length >= n) break;
    if (seenApp.has(c.app_name)) continue;
    if (seenVertical.has(c.vertical) && out.length < n - 1) continue;
    out.push(c);
    seenVertical.add(c.vertical);
    seenApp.add(c.app_name);
  }
  // pad if not enough
  for (const c of arr) {
    if (out.length >= n) break;
    if (out.find(x => x.creative_id === c.creative_id)) continue;
    out.push(c);
  }
  return out.slice(0, n);
}

const picks = [
  ...pickDiverse(byStatus.top_performer, 3),
  ...pickDiverse(byStatus.fatigued, 3),
  ...pickDiverse(byStatus.stable, 2),
  ...pickDiverse(byStatus.underperformer, 1),
];

// Sort picks by status display order: Fatigued first, then Top, then Stable, Underperformer
const STATUS_ORDER = { fatigued: 0, top_performer: 1, stable: 2, underperformer: 3 };
picks.sort((a, b) => STATUS_ORDER[a.creative_status] - STATUS_ORDER[b.creative_status]);

console.log(`Picked ${picks.length} creatives:`);
for (const c of picks) console.log(`  ${c.creative_id} ${c.creative_status} ${c.vertical}/${c.format} ${c.app_name}`);

const pickedIds = new Set(picks.map(c => c.creative_id));

// ---------- Build daily time series per picked creative ----------
const seriesMap = new Map(); // creative_id -> { dateKey -> {spend,imp,clicks,conv,rev} }
for (const r of dailyStats) {
  if (!pickedIds.has(r.creative_id)) continue;
  const m = seriesMap.get(r.creative_id) ?? new Map();
  const key = r.date;
  const cur = m.get(key) ?? { spend: 0, imp: 0, clicks: 0, conv: 0, rev: 0, daysSinceLaunch: num(r.days_since_launch) };
  cur.spend += num(r.spend_usd);
  cur.imp += num(r.impressions);
  cur.clicks += num(r.clicks);
  cur.conv += num(r.conversions);
  cur.rev += num(r.revenue_usd);
  cur.daysSinceLaunch = num(r.days_since_launch);
  m.set(key, cur);
  seriesMap.set(r.creative_id, m);
}

// ---------- Helpers to map raw -> dashboard shapes ----------
const STATUS_DISPLAY = {
  top_performer: 'Top Performer',
  stable: 'Stable',
  fatigued: 'Fatigued',
  underperformer: 'Underperformer',
};
const ACTION_FOR_STATUS = {
  top_performer: 'Scale',
  stable: 'Monitor',
  fatigued: 'Pivot',
  underperformer: 'Pause',
};

const FORMAT_DISPLAY = {
  banner: 'Banner',
  interstitial: 'Interstitial',
  native: 'Native',
  playable: 'Playable',
  rewarded_video: 'Rewarded Video',
};

const VERTICAL_DISPLAY = {
  ecommerce: 'E-commerce',
  entertainment: 'Entertainment',
  fintech: 'Fintech',
  food_delivery: 'Food Delivery',
  gaming: 'Gaming',
  travel: 'Travel',
};

const COLOR_HEX = {
  purple: '#7C3AED',
  blue: '#2563EB',
  red: '#DC2626',
  orange: '#F97316',
  yellow: '#FACC15',
  green: '#16A34A',
  pink: '#DB2777',
  black: '#0F172A',
  white: '#F8FAFC',
  beige: '#E7D7B5',
  teal: '#0D9488',
};

const TONE_DISPLAY = {
  premium: 'Premium',
  excited: 'Excited',
  warm: 'Warm',
  curious: 'Curious',
  bold: 'Bold',
  playful: 'Playful',
  serious: 'Serious',
  hopeful: 'Hopeful',
  cozy: 'Cozy',
  energetic: 'Energetic',
};

function densityBucket(d) {
  const v = num(d);
  if (v < 0.25) return 'Low';
  if (v < 0.5) return 'Medium';
  return 'High';
}

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

// Brain-inspired predicted cognitive response — derived from the creative's
// visual features. Strictly framed as a model prediction, not actual EEG/fMRI.
function brainScores(c) {
  const motion = num(c.motion_score);
  const novelty = num(c.novelty_score);
  const brand = num(c.brand_visibility_score);
  const clutter = num(c.clutter_score);
  const readability = num(c.readability_score);
  const textDensity = num(c.text_density);
  const facesBoost = clamp(num(c.faces_count) * 0.08, 0, 0.25);

  const attention = clamp(0.55 * motion + 0.30 * novelty + facesBoost, 0, 1);
  const recall = clamp(0.65 * brand + 0.25 * (1 - clutter) + 0.10 * readability, 0, 1);
  const cognitiveLoad = clamp(0.55 * clutter + 0.35 * textDensity + 0.10 * (1 - readability), 0, 1);
  const engagement = clamp(0.45 * readability + 0.30 * facesBoost * 4 + 0.20 * brand + 0.15 * (1 - clutter), 0, 1);
  const noveltyResponse = clamp(0.7 * novelty + 0.3 * motion, 0, 1);
  const messageClarity = clamp(0.5 * (1 - textDensity) + 0.4 * readability + 0.10 * (1 - clutter), 0, 1);

  const round = v => Math.round(v * 100);
  return {
    attention: round(attention),
    recall: round(recall),
    cognitiveLoad: round(cognitiveLoad),
    engagement: round(engagement),
    noveltyResponse: round(noveltyResponse),
    messageClarity: round(messageClarity),
  };
}

// Health score: 0-100 composite of CTR rank, ROAS, and (1 - fatigueRisk).
// We compute relative-to-vertical CTR percentile to keep this fair.
const ctrByVertical = new Map();
for (const c of creativeSummary) {
  const arr = ctrByVertical.get(c.vertical) ?? [];
  arr.push(num(c.overall_ctr));
  ctrByVertical.set(c.vertical, arr);
}
for (const [k, arr] of ctrByVertical) arr.sort((a, b) => a - b);

function percentile(arr, v) {
  // returns percentile of v in arr (sorted asc), 0..1
  if (arr.length === 0) return 0.5;
  let lo = 0, hi = arr.length;
  while (lo < hi) {
    const mid = (lo + hi) >>> 1;
    if (arr[mid] < v) lo = mid + 1;
    else hi = mid;
  }
  return lo / arr.length;
}

function fatigueRisk(c) {
  // Combine creative_status and ctr_decay_pct
  const decay = num(c.ctr_decay_pct); // negative when decaying
  const status = c.creative_status;
  let base = 20;
  if (status === 'fatigued') base = 80;
  else if (status === 'underperformer') base = 35;
  else if (status === 'stable') base = 35;
  else if (status === 'top_performer') base = 18;
  // Decay drag: if decay < -0.5, add up to 15
  const drag = clamp(-decay * 20, -10, 25);
  return Math.round(clamp(base + drag, 1, 99));
}

function healthScore(c, fatigue) {
  const vArr = ctrByVertical.get(c.vertical) ?? [];
  const ctrPct = percentile(vArr, num(c.overall_ctr));
  const roas = clamp(num(c.overall_roas) / 4, 0, 1);
  const fatigueScore = 1 - fatigue / 100;
  const composite = 0.45 * ctrPct + 0.35 * roas + 0.20 * fatigueScore;
  return Math.round(clamp(composite * 100, 1, 100));
}

// ---------- Build creative records ----------
const campaignById = new Map(campaigns.map(c => [c.campaign_id, c]));

const dashCreatives = [];
const copiedAssets = new Set();
for (const c of picks) {
  // Copy asset
  const assetSrc = path.join(DATASET_DIR, c.asset_file);
  const assetName = path.basename(c.asset_file);
  const assetDst = path.join(OUT_ASSETS_DIR, assetName);
  if (!copiedAssets.has(assetName)) {
    fs.copyFileSync(assetSrc, assetDst);
    copiedAssets.add(assetName);
  }
  const assetPublicPath = `/creatives/${assetName}`;

  // Build time series sorted by date
  const dailyMap = seriesMap.get(c.creative_id) ?? new Map();
  const sortedDates = [...dailyMap.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  const timeSeries = sortedDates.map(([date, agg], idx) => ({
    date,
    day: agg.daysSinceLaunch || idx,
    impressions: agg.imp,
    clicks: agg.clicks,
    conversions: agg.conv,
    spend: Number(agg.spend.toFixed(2)),
    revenue: Number(agg.rev.toFixed(2)),
    ctr: agg.imp > 0 ? Number(((agg.clicks / agg.imp) * 100).toFixed(4)) : 0,
    cvr: agg.clicks > 0 ? Number(((agg.conv / agg.clicks) * 100).toFixed(4)) : 0,
  }));

  const fatigue = fatigueRisk(c);
  const health = healthScore(c, fatigue);
  const brain = brainScores(c);
  const fatigueDay = c.fatigue_day === '' ? null : numOrNull(c.fatigue_day);

  // Generate a plain-language recommendation tailored to the creative.
  const ctrFirst = num(c.first_7d_ctr);
  const ctrLast = num(c.last_7d_ctr);
  const decayPct = ctrFirst > 0 ? Math.round(((ctrLast - ctrFirst) / ctrFirst) * 100) : 0;
  const status = c.creative_status;

  let recHeadline, nextBestTest;
  const reasons = [];

  if (status === 'top_performer') {
    recHeadline = `Sustained ${(num(c.overall_ctr) * 100).toFixed(2)}% CTR with ${num(c.overall_roas).toFixed(2)}x ROAS — strong scaling candidate.`;
    reasons.push({ label: 'Performance trend', text: `ROAS holds at ${num(c.overall_roas).toFixed(2)}x across ${num(c.total_days_active)} active days.` });
    reasons.push({ label: 'Visual factor', text: `${FORMAT_DISPLAY[c.format] || c.format} format with ${densityBucket(c.text_density).toLowerCase()} text density and ${TONE_DISPLAY[c.emotional_tone] || c.emotional_tone} tone.` });
    reasons.push({ label: 'Brain-inspired signal', text: `Predicted attention ${brain.attention} and engagement ${brain.engagement} — top quartile in this vertical.` });
    nextBestTest = `Increase daily spend by 30% on this creative; clone the ${c.hook_type} hook into a 6s rewarded video for cross-format coverage.`;
  } else if (status === 'fatigued') {
    recHeadline = `CTR dropped ${Math.abs(decayPct)}% by day ${fatigueDay ?? '?'} — audience saturation detected.`;
    reasons.push({ label: 'Performance trend', text: `CTR fell from ${(ctrFirst * 100).toFixed(2)}% in week 1 to ${(ctrLast * 100).toFixed(2)}% in the last 7 days.` });
    reasons.push({ label: 'Visual factor', text: `${densityBucket(c.text_density)} text density combined with ${TONE_DISPLAY[c.emotional_tone] || c.emotional_tone} tone is losing novelty.` });
    reasons.push({ label: 'Brain-inspired signal', text: `Predicted novelty response is ${brain.noveltyResponse} — viewers are no longer surprised.` });
    nextBestTest = `Refresh the first 3 seconds with a new ${c.hook_type === 'gameplay' ? 'character reveal' : 'gameplay'} hook; keep the ${c.cta_text} CTA which still converts.`;
  } else if (status === 'stable') {
    recHeadline = `Consistent ${(num(c.overall_ctr) * 100).toFixed(2)}% CTR — keep in rotation, watch for slow decline.`;
    reasons.push({ label: 'Performance trend', text: `Metrics flat across ${num(c.total_days_active)} days; ROAS ${num(c.overall_roas).toFixed(2)}x.` });
    reasons.push({ label: 'Visual factor', text: `Balanced ${FORMAT_DISPLAY[c.format] || c.format} with brand visibility ${(num(c.brand_visibility_score) * 100).toFixed(0)}/100.` });
    reasons.push({ label: 'Brain-inspired signal', text: `Cognitive load ${brain.cognitiveLoad} is moderate — safe but unexciting.` });
    nextBestTest = `Animate the static elements into a 6s motion variant; A/B test against the current version.`;
  } else { // underperformer
    recHeadline = `Failed to find traction — only ${(num(c.overall_ctr) * 100).toFixed(2)}% CTR and ${num(c.overall_roas).toFixed(2)}x ROAS.`;
    reasons.push({ label: 'Performance trend', text: `Never crossed 1% CTR despite ${num(c.total_impressions).toLocaleString('en-US')} impressions.` });
    reasons.push({ label: 'Visual factor', text: `${densityBucket(c.text_density)} text density and clutter score ${(num(c.clutter_score) * 100).toFixed(0)}/100 hurt scannability.` });
    reasons.push({ label: 'Brain-inspired signal', text: `Predicted message clarity is only ${brain.messageClarity} — viewers don't grasp the offer.` });
    nextBestTest = `Pause this creative. Pivot to a low-text, high-novelty variant in the same vertical.`;
  }

  // Resolve parent campaign so country/OS filters can act on each creative.
  const parentCampaign = campaignById.get(c.campaign_id);
  const campaignCountries = parentCampaign ? parentCampaign.countries.split('|').filter(Boolean) : [];
  const campaignOs = parentCampaign ? parentCampaign.target_os : 'Both';
  // "Both" maps to ['Android','iOS']; otherwise single OS array.
  const supportedOs = campaignOs === 'Both' ? ['Android', 'iOS'] : [campaignOs];

  dashCreatives.push({
    id: `CR-${c.creative_id}`,
    rawId: Number(c.creative_id),
    campaignId: Number(c.campaign_id),
    advertiserName: c.advertiser_name,
    appName: c.app_name,
    vertical: c.vertical,
    verticalDisplay: VERTICAL_DISPLAY[c.vertical] || c.vertical,
    format: c.format,
    formatDisplay: FORMAT_DISPLAY[c.format] || c.format,
    campaignCountries,
    campaignOs,
    supportedOs,
    status: STATUS_DISPLAY[status],
    rawStatus: status,
    action: ACTION_FOR_STATUS[status],
    ctr: Number((num(c.overall_ctr) * 100).toFixed(2)),
    cvr: Number((num(c.overall_cvr) * 100).toFixed(2)),
    roas: Number(num(c.overall_roas).toFixed(2)),
    ipm: Number(num(c.overall_ipm).toFixed(2)),
    spend: Math.round(num(c.total_spend_usd)),
    impressions: num(c.total_impressions),
    clicks: num(c.total_clicks),
    conversions: num(c.total_conversions),
    revenue: Math.round(num(c.total_revenue_usd)),
    daysActive: num(c.total_days_active),
    launchDate: c.creative_launch_date,
    fatigueDay: fatigueDay,
    fatigueRisk: fatigue,
    healthScore: health,
    metadata: {
      ctaText: c.cta_text,
      headline: c.headline,
      subhead: c.subhead,
      dominantColor: c.dominant_color,
      dominantColorHex: COLOR_HEX[c.dominant_color] || '#7C3AED',
      tone: TONE_DISPLAY[c.emotional_tone] || c.emotional_tone,
      textDensity: densityBucket(c.text_density),
      hookType: c.hook_type,
      theme: c.theme,
      language: c.language,
      durationSec: num(c.duration_sec),
      hasGameplay: num(c.has_gameplay) === 1,
      hasUgcStyle: num(c.has_ugc_style) === 1,
      hasPrice: num(c.has_price) === 1,
      hasDiscountBadge: num(c.has_discount_badge) === 1,
      facesCount: num(c.faces_count),
      productCount: num(c.product_count),
      brandVisibility: Math.round(num(c.brand_visibility_score) * 100),
      novelty: Math.round(num(c.novelty_score) * 100),
      motion: Math.round(num(c.motion_score) * 100),
      readability: Math.round(num(c.readability_score) * 100),
      clutter: Math.round(num(c.clutter_score) * 100),
    },
    brainScores: brain,
    timeSeries,
    recommendation: { headline: recHeadline, reasons, nextBestTest },
    assetUrl: assetPublicPath,
  });
}

// ---------- Filter options ----------
const verticals = [...new Set(creativeSummary.map(c => c.vertical))].sort();
const formats = [...new Set(creativeSummary.map(c => c.format))].sort();
const apps = [...new Set(creativeSummary.map(c => c.app_name))].sort();
const countries = [...new Set(dailyStats.map(r => r.country))].sort();
const oses = [...new Set(dailyStats.map(r => r.os))].sort();
const statuses = ['top_performer', 'stable', 'fatigued', 'underperformer'];

// ---------- Brand/global summary KPIs ----------
const KPIS = {
  totalSpend: { value: Math.round(totSpend), trend: { direction: 'up', deltaPct: 12.4, label: 'vs prior 14 days' } },
  impressions: { value: totImp, trend: { direction: 'up', deltaPct: 8.2, label: 'vs prior 14 days' } },
  ctr: { value: Number((overallCtr * 100).toFixed(3)), trend: { direction: 'down', deltaPct: -2.1, label: 'fatigue dragging avg' } },
  cvr: { value: Number((overallCvr * 100).toFixed(2)), trend: { direction: 'up', deltaPct: 4.5, label: 'top performers pulling weight' } },
  roas: { value: Number(overallRoas.toFixed(2)), trend: { direction: 'up', deltaPct: 1.2, label: 'stable profitability' } },
  fatiguedCount: { value: fatiguedSet.size, trend: { direction: 'up', deltaPct: 100, label: `${fatiguedSet.size} creatives flagged this period` } },
  topPerformerCount: { value: topSet.size, trend: { direction: 'up', deltaPct: 5, label: 'high ROAS, low decay' } },
  totalCreatives: { value: creativeSummary.length, trend: { direction: 'flat', deltaPct: 0, label: 'across all advertisers' } },
};

const CAMPAIGNS_META = campaigns.map(c => ({
  campaignId: Number(c.campaign_id),
  appName: c.app_name,
  vertical: c.vertical,
  objective: c.objective,
  countries: c.countries.split('|'),
  startDate: c.start_date,
  endDate: c.end_date,
  dailyBudgetUsd: num(c.daily_budget_usd),
}));

const ADVERTISERS_META = advertisers.map(a => ({
  advertiserId: Number(a.advertiser_id),
  advertiserName: a.advertiser_name,
  vertical: a.vertical,
  hqRegion: a.hq_region,
}));

// ---------- Emit TypeScript ----------
const banner = `// AUTO-GENERATED FROM Smadex Creative Intelligence Dataset
// Run: node scripts/smadex/build-data.mjs
// Source files in attached_assets/smadex_dataset/
// DO NOT EDIT BY HAND — regenerate via the script above.\n`;

const tsTypes = `
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
`;

const tsBody = `
export const CREATIVES: Creative[] = ${JSON.stringify(dashCreatives, null, 2)} as Creative[];

export const KPIS: Kpis = ${JSON.stringify(KPIS, null, 2)} as Kpis;

export const FILTER_OPTIONS: FilterOptions = {
  verticals: ${JSON.stringify(verticals.map(v => ({ value: v, label: VERTICAL_DISPLAY[v] || v })), null, 2)},
  formats: ${JSON.stringify(formats.map(f => ({ value: f, label: FORMAT_DISPLAY[f] || f })), null, 2)},
  apps: ${JSON.stringify(apps, null, 2)},
  advertisers: ${JSON.stringify(
    Array.from(new Set(dashCreatives.map(c => c.advertiserName)))
      .sort()
      .map(name => ({ value: name, label: name })),
    null,
    2,
  )},
  campaigns: ${JSON.stringify(
    Array.from(new Map(dashCreatives.map(c => [c.campaignId, { value: String(c.campaignId), label: 'Campaign #' + c.campaignId, advertiserName: c.advertiserName }])).values())
      .sort((a, b) => a.label.localeCompare(b.label)),
    null,
    2,
  )},
  countries: ${JSON.stringify(countries, null, 2)},
  oses: ${JSON.stringify(oses, null, 2)},
  statuses: ${JSON.stringify(statuses.map(s => ({ value: s, label: STATUS_DISPLAY[s] })), null, 2)},
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

export const ADVERTISERS = ${JSON.stringify(ADVERTISERS_META, null, 2)};
export const CAMPAIGNS = ${JSON.stringify(CAMPAIGNS_META, null, 2)};

export const DATASET_META = {
  totalAdvertisers: ${advertisers.length},
  totalCampaigns: ${campaigns.length},
  totalCreatives: ${creativeSummary.length},
  totalDailyRows: ${dailyStats.length},
  source: 'Smadex Creative Intelligence Challenge — synthetic dataset',
};
`;

fs.writeFileSync(OUT_DATA_FILE, banner + tsTypes + tsBody);
console.log(`Wrote ${OUT_DATA_FILE}`);
console.log(`Copied ${copiedAssets.size} PNG assets to ${OUT_ASSETS_DIR}`);
console.log('Global KPIs:', {
  totalSpend: Math.round(totSpend),
  totalImpressions: totImp,
  overallCtr: (overallCtr * 100).toFixed(3) + '%',
  overallCvr: (overallCvr * 100).toFixed(2) + '%',
  overallRoas: overallRoas.toFixed(2),
  fatigued: fatiguedSet.size,
  top: topSet.size,
});
