import { diagnosisSchema } from "@/lib/schemas";
import { openaiResponses, extractTextFromResponse } from "@/lib/providers/openai";
import { PLANT_ANALYSIS_SYSTEM_PROMPT, plantAnalysisUserPrompt } from "@/lib/prompts";
import type { DiagnosisResult } from "@/lib/types";
import { fallbackDiagnosis } from "@/lib/services/fallback";
import { config } from "@/lib/config";

export async function analyzePlantImage(imageUrl: string, caption?: string): Promise<DiagnosisResult> {
  if (!config.aiApiKey) {
    return fallbackDiagnosis(caption);
  }

  try {
    const payload = await openaiResponses({
      model: config.aiVisionModel,
      input: [
        {
          role: "system",
          content: [{ type: "input_text", text: PLANT_ANALYSIS_SYSTEM_PROMPT }]
        },
        {
          role: "user",
          content: [
            { type: "input_text", text: `${plantAnalysisUserPrompt}\n\nUser caption: ${caption ?? ""}` },
            { type: "input_image", image_url: imageUrl }
          ]
        }
      ]
    });

    const text = extractTextFromResponse(payload).trim();
    const parsed = diagnosisSchema.parse(JSON.parse(stripCodeFences(text)));
    return parsed as DiagnosisResult;
  } catch {
    return fallbackDiagnosis(caption);
  }
}

function stripCodeFences(text: string) {
  return text.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/, "").trim();
}
