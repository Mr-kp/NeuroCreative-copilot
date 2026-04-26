import type { CsvRow } from "./parseCsv.js";

export interface MatchedAsset {
  filename: string;
  mimetype: string;
  /** The creative_id this asset was matched to */
  creative_id: string;
  /** Original buffer for sending to OpenAI vision */
  buffer: Buffer;
  /** File extension */
  ext: string;
  /** Whether the match was an exact match or a fuzzy fallback */
  matchType: "exact" | "filename_contains" | "asset_path" | "unmatched";
}

/**
 * Match uploaded asset files to CSV rows by:
 * 1. creative_id in filename (e.g., "creative_500686.png" → "CR-500686" or "500686")
 * 2. asset_path column in CSV
 * 3. Exact filename match
 * 4. Creative ID substring match
 */
export function matchAssets(
  files: Express.Multer.File[],
  csvRows: CsvRow[]
): MatchedAsset[] {
  const creativeIds = csvRows.map((r) => r.creative_id);

  // Build a lookup: normalized creative_id → original creative_id
  const idLookup = new Map<string, string>();
  for (const id of creativeIds) {
    idLookup.set(id.toLowerCase(), id);
    // Also add just the numeric part if it has a prefix like "CR-"
    const numMatch = id.match(/(\d+)/);
    if (numMatch) {
      idLookup.set(numMatch[1], id);
    }
  }

  // Build asset_path → creative_id lookup from CSV
  const assetPathLookup = new Map<string, string>();
  for (const row of csvRows) {
    const assetPath = row.asset_path;
    if (assetPath && typeof assetPath === "string") {
      const basename = assetPath.split("/").pop() || assetPath;
      assetPathLookup.set(basename.toLowerCase(), row.creative_id);
    }
  }

  return files.map((file) => {
    const filename = file.originalname;
    const ext = filename.split(".").pop()?.toLowerCase() || "";
    const filenameLower = filename.toLowerCase();
    const basenameNoExt = filename.replace(/\.[^.]+$/, "").toLowerCase();

    let matchedId: string | null = null;
    let matchType: MatchedAsset["matchType"] = "unmatched";

    // 1. Check asset_path column match
    const pathMatch = assetPathLookup.get(filenameLower);
    if (pathMatch) {
      matchedId = pathMatch;
      matchType = "asset_path";
    }

    // 2. Check if filename exactly matches a creative_id
    if (!matchedId) {
      const exactMatch = idLookup.get(basenameNoExt);
      if (exactMatch) {
        matchedId = exactMatch;
        matchType = "exact";
      }
    }

    // 3. Check if filename contains a creative_id number
    if (!matchedId) {
      const numbers = filename.match(/\d+/g);
      if (numbers) {
        for (const num of numbers) {
          const found = idLookup.get(num);
          if (found) {
            matchedId = found;
            matchType = "filename_contains";
            break;
          }
        }
      }
    }

    // 4. Fallback: assign to first unmatched creative
    if (!matchedId) {
      matchedId = creativeIds[0] || "unknown";
      matchType = "unmatched";
    }

    return {
      filename,
      mimetype: file.mimetype,
      creative_id: matchedId,
      buffer: file.buffer,
      ext,
      matchType,
    };
  });
}
