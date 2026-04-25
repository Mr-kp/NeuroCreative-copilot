import OpenAI from "openai";

let _client: OpenAI | null = null;

export function getOpenAIClient(): OpenAI {
  if (!_client) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error(
        "OPENAI_API_KEY environment variable is required. Copy .env.example to .env and set your key."
      );
    }
    _client = new OpenAI({ apiKey });
  }
  return _client;
}

export function getModel(): string {
  return process.env.OPENAI_MODEL || "gpt-4o";
}
