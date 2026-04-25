import Papa from "papaparse";

export interface CsvRow {
  creative_id: string;
  [key: string]: string | number | null | undefined;
}

/**
 * Normalize a header string to snake_case lowercase.
 * "Creative ID" → "creative_id", "CTR (%)" → "ctr", "advertiser-id" → "advertiser_id"
 */
function normalizeHeader(h: string): string {
  return h
    .trim()
    .toLowerCase()
    .replace(/\s*\(.*?\)\s*/g, "") // remove parenthesized units
    .replace(/[\s\-]+/g, "_")      // spaces/hyphens → underscore
    .replace(/[^a-z0-9_]/g, "");   // strip special chars
}

/**
 * Parse a CSV buffer into an array of normalized row objects.
 * Infers CTR/CVR/ROAS from raw metrics when missing.
 */
export function parseCsv(buffer: Buffer): CsvRow[] {
  const text = buffer.toString("utf-8");

  const result = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: normalizeHeader,
  });

  if (result.errors.length > 0) {
    const firstError = result.errors[0];
    console.warn(`CSV parse warning: ${firstError.message} (row ${firstError.row})`);
  }

  const rows: CsvRow[] = result.data
    .filter((row) => row.creative_id && row.creative_id.trim() !== "")
    .map((row) => {
      const parsed: CsvRow = { creative_id: row.creative_id.trim() };

      // Copy all fields, converting numeric-looking values
      for (const [key, value] of Object.entries(row)) {
        if (key === "creative_id") continue;
        if (value === "" || value === undefined || value === null) {
          parsed[key] = null;
        } else {
          const num = Number(value);
          parsed[key] = isNaN(num) ? value : num;
        }
      }

      // Infer derived metrics if missing
      const impressions = toNum(parsed.impressions);
      const clicks = toNum(parsed.clicks);
      const conversions = toNum(parsed.conversions);
      const spend = toNum(parsed.spend);
      const revenue = toNum(parsed.revenue);

      if (parsed.ctr === null || parsed.ctr === undefined) {
        if (impressions && clicks) {
          parsed.ctr = Number(((clicks / impressions) * 100).toFixed(4));
        }
      }

      if (parsed.cvr === null || parsed.cvr === undefined) {
        if (clicks && conversions) {
          parsed.cvr = Number(((conversions / clicks) * 100).toFixed(4));
        }
      }

      if (parsed.roas === null || parsed.roas === undefined) {
        if (spend && revenue) {
          parsed.roas = Number((revenue / spend).toFixed(4));
        }
      }

      return parsed;
    });

  if (rows.length === 0) {
    throw new Error(
      "CSV must contain at least one row with a non-empty creative_id column."
    );
  }

  return rows;
}

function toNum(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  const n = Number(v);
  return isNaN(n) ? null : n;
}
