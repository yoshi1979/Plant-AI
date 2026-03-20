import type { DiagnosisResult } from "@/lib/types";

export function fallbackDiagnosis(caption?: string): DiagnosisResult {
  const symptomHints = caption?.toLowerCase().includes("yellow")
    ? ["yellowing leaves", "mild droop", "moist soil visible"]
    : ["leaf discoloration", "localized browning", "possible stress pattern"];

  return {
    plant_identification: { name: "Unknown plant", confidence: 4 },
    health_assessment: { status: "unclear", confidence: 4 },
    observed_symptoms: symptomHints,
    likely_issues: [
      { name: "Possible overwatering", confidence: 5, reasoning: "Leaf yellowing plus droop can align with excess moisture." },
      { name: "Possible insufficient light", confidence: 4, reasoning: "Color loss may also reflect suboptimal light conditions." }
    ],
    expert_validation: {
      performed: false,
      validation_strength: "unavailable",
      source_types_used: [],
      summary: "Validation has not run yet."
    },
    recommended_actions: [],
    prevention_tips: [],
    follow_up_questions: [
      "Is this plant indoors or outdoors?",
      "How often do you water it?",
      "Can you send one photo of the whole plant and one close-up of the damaged area?"
    ],
    escalation_needed: false,
    escalation_reason: "",
    image_quality: { usable: true, issues: [] },
    final_confidence_score_1_to_10: 4
  };
}
