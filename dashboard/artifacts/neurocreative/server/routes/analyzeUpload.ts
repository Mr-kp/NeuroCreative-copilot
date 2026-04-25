import { Router, type Request, type Response } from "express";
import multer from "multer";
import { parseCsv } from "../lib/parseCsv.js";
import { matchAssets } from "../lib/matchAssets.js";
import { analyzeWithOpenAI } from "../lib/analyzeWithOpenAI.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50 MB per file
    files: 30, // max 30 files
  },
});

const router = Router();

router.post(
  "/",
  upload.fields([
    { name: "csvFile", maxCount: 1 },
    { name: "creativeAssets", maxCount: 25 },
  ]),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const files = req.files as {
        csvFile?: Express.Multer.File[];
        creativeAssets?: Express.Multer.File[];
      };

      // Validate CSV
      const csvFile = files?.csvFile?.[0];
      if (!csvFile) {
        res.status(400).json({ error: "CSV file is required." });
        return;
      }

      if (
        !csvFile.originalname.toLowerCase().endsWith(".csv") &&
        csvFile.mimetype !== "text/csv"
      ) {
        res.status(400).json({ error: "Only .csv files are accepted." });
        return;
      }

      console.log(
        `[analyze-upload] Received CSV: ${csvFile.originalname} (${csvFile.size} bytes)`
      );

      // Parse CSV
      const csvRows = parseCsv(csvFile.buffer);
      console.log(`[analyze-upload] Parsed ${csvRows.length} creative rows from CSV`);

      // Match assets
      const creativeAssets = files?.creativeAssets || [];
      console.log(
        `[analyze-upload] Received ${creativeAssets.length} creative asset files`
      );

      const matchedAssets = matchAssets(creativeAssets, csvRows);
      const matchedCount = matchedAssets.filter(
        (a) => a.matchType !== "unmatched"
      ).length;
      console.log(
        `[analyze-upload] Matched ${matchedCount}/${creativeAssets.length} assets to CSV rows`
      );

      // Call OpenAI
      console.log("[analyze-upload] Calling OpenAI for analysis...");
      const dashboard = await analyzeWithOpenAI(csvRows, matchedAssets);
      console.log(
        `[analyze-upload] OpenAI returned ${dashboard.creatives.length} analyzed creatives`
      );

      res.json(dashboard);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Unknown error occurred";
      console.error(`[analyze-upload] Error: ${message}`);

      if (message.includes("API key")) {
        res.status(500).json({
          error: "OpenAI API key is not configured. Check your .env file.",
        });
        return;
      }

      res.status(500).json({
        error: `Analysis failed: ${message}`,
      });
    }
  }
);

export default router;
