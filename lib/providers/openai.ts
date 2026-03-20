import { config } from "@/lib/config";

const baseUrl = process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1";

export async function openaiResponses(requestBody: Record<string, unknown>) {
  if (!config.aiApiKey) {
    throw new Error("AI_API_KEY is not configured");
  }

  const response = await fetch(`${baseUrl}/responses`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.aiApiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(requestBody),
    cache: "no-store"
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`OpenAI error ${response.status}: ${text}`);
  }

  return response.json();
}

export function extractTextFromResponse(payload: any): string {
  if (typeof payload?.output_text === "string" && payload.output_text) return payload.output_text;
  const parts = payload?.output?.flatMap((item: any) => item?.content ?? []) ?? [];
  const text = parts
    .filter((part: any) => part?.type === "output_text" || part?.type === "text")
    .map((part: any) => part?.text ?? part?.content ?? "")
    .join("\n");
  return text;
}
