import type { DiagnosisResult } from "@/lib/types";

export function formatWhatsAppReply(result: DiagnosisResult): string {
  const primary = result.likely_issues[0]?.name ?? "Unclear from this image";
  const secondary = result.likely_issues[1]?.name;
  const validation = result.expert_validation.validation_strength;
  const lowConfidence = result.final_confidence_score_1_to_10 < 7;

  return [
    `Plant: ${result.plant_identification.name || "Unknown plant"}`,
    `Overall status: ${result.health_assessment.status.replaceAll("_", " ")}`,
    `Confidence score: ${result.final_confidence_score_1_to_10}/10`,
    "",
    "What I see:",
    ...result.observed_symptoms.map((item) => `- ${item}`),
    "",
    "Likely issue:",
    `- ${primary}`,
    ...(secondary ? [`- Secondary possibility: ${secondary}`] : []),
    "",
    "Validated against expert guidance:",
    `- Cross-checked against trusted plant expert sources`,
    `- Freshness: ${result.expert_validation.freshness ?? "unknown"}${result.expert_validation.checked_at ? ` (${result.expert_validation.checked_at})` : ""}`,
    ...(result.expert_validation.winning_issue ? [`- Best-supported issue after live validation: ${result.expert_validation.winning_issue}`] : []),
    `- Validation strength: ${validation}`,
    `- ${result.expert_validation.summary}`,
    "",
    "What to do now:",
    ...result.recommended_actions.map((item) => `${item.priority}. ${item.action}`),
    "",
    "Prevention:",
    ...result.prevention_tips.map((item) => `- ${item}`),
    "",
    `Urgency: ${result.health_assessment.status === "severe_issue" ? "High" : result.health_assessment.status === "moderate_issue" ? "Medium" : "Low"}`,
    ...(lowConfidence
      ? [
          "",
          "Need more info?",
          ...result.follow_up_questions.slice(0, 4).map((item) => `- ${item}`),
          "",
          "To help me diagnose better, please send:",
          "1. one clear photo of the whole plant,",
          "2. one close-up of the damaged area,",
          "3. one photo of the soil and pot,",
          "in natural light if possible."
        ]
      : [])
  ].join("\n");
}
