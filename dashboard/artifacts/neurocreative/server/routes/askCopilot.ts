import { Router, type Request, type Response } from "express";
import { getOpenAIClient, getModel } from "../lib/openaiClient.js";
import { validateCopilotResponse } from "../lib/validateDashboardResponse.js";

const router = Router();

const COPILOT_SYSTEM_PROMPT = `You are NeuroCreative Copilot, an AI assistant for mobile ad creative performance analysis.

You answer questions about one selected ad creative using:
- CSV performance data
- creative metadata
- OpenAI-generated dashboard analysis
- brain-inspired cognitive scores
- MRI heatmap intensities
- recommendation output
- chart annotations
- uploaded asset filename/type if available

Rules:
- Answer only about the selected creative unless the user asks for portfolio comparison.
- Be direct, useful, and advertiser-facing.
- Do not claim real brain scanning.
- Use "brain-inspired," "predicted cognitive response," or "estimated neural activation."
- Do not say "real MRI."
- Do not invent raw metrics that are not provided.
- If data is missing, say what is missing and answer cautiously.
- Always end with a clear action when relevant: Scale, Monitor, Pivot, or Pause.
- Keep answers concise, usually 3–6 sentences.
- If the user asks what to change, give concrete creative recommendations.

Return only valid JSON in this exact shape:
{
  "answer": "",
  "suggested_action": "Scale | Monitor | Pivot | Pause | None",
  "confidence": 0,
  "supporting_points": ["", "", ""],
  "follow_up_questions": ["", "", ""]
}`;

interface AskCopilotBody {
  question: string;
  selectedCreative: Record<string, unknown>;
  dashboardContext?: {
    filters?: Record<string, unknown>;
    portfolio_recommendations?: string[];
    dashboard_summary?: Record<string, unknown>;
  };
}

router.post("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const body = req.body as AskCopilotBody;

    if (!body.question || typeof body.question !== "string") {
      res.status(400).json({ error: "Question is required." });
      return;
    }

    if (!body.selectedCreative) {
      res.status(400).json({ error: "selectedCreative is required." });
      return;
    }

    const client = getOpenAIClient();
    const model = getModel();

    const userMessage = `The user is asking about a specific creative. Here is the creative's full analysis data:

${JSON.stringify(body.selectedCreative, null, 2)}

${body.dashboardContext ? `Dashboard context:\n${JSON.stringify(body.dashboardContext, null, 2)}` : ""}

User question: ${body.question}`;

    const response = await client.chat.completions.create({
      model,
      messages: [
        { role: "system", content: COPILOT_SYSTEM_PROMPT },
        { role: "user", content: userMessage },
      ],
      response_format: { type: "json_object" },
      temperature: 0.5,
      max_tokens: 2000,
    });

    const rawContent = response.choices[0]?.message?.content;
    if (!rawContent) {
      throw new Error("OpenAI returned an empty response.");
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(rawContent);
    } catch {
      throw new Error("OpenAI returned invalid JSON for Copilot response.");
    }

    const validated = validateCopilotResponse(parsed);
    res.json(validated);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";
    console.error(`[ask-copilot] Error: ${message}`);
    res.status(500).json({ error: `Copilot failed: ${message}` });
  }
});

export default router;
