import { describe, expect, it } from "vitest";
import { scoreFinalConfidence } from "@/lib/services/confidence";

describe("scoreFinalConfidence", () => {
  it("rewards strong validation", () => {
    const score = scoreFinalConfidence({
      plant_identification: { name: "Rose", confidence: 8 },
      health_assessment: { status: "moderate_issue", confidence: 7 },
      observed_symptoms: [],
      likely_issues: [{ name: "Fungal leaf spot", confidence: 8, reasoning: "spots" }],
      expert_validation: { performed: true, validation_strength: "strong", source_types_used: [], summary: "good" },
      recommended_actions: [],
      prevention_tips: [],
      follow_up_questions: [],
      escalation_needed: false,
      escalation_reason: "",
      image_quality: { usable: true, issues: [] },
      final_confidence_score_1_to_10: 0
    });

    expect(score).toBeGreaterThanOrEqual(8);
  });
});
