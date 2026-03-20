import { describe, expect, it } from "vitest";
import { scoreFinalConfidence } from "@/lib/services/confidence";

describe("scoreFinalConfidence", () => {
  it("rewards strong validation and ensemble agreement", () => {
    const score = scoreFinalConfidence({
      plant_identification: { name: "Rose", confidence: 8 },
      health_assessment: { status: "moderate_issue", confidence: 7 },
      observed_symptoms: [],
      likely_issues: [{ name: "Fungal leaf spot", confidence: 8, reasoning: "spots" }],
      expert_validation: { performed: true, validation_strength: "strong", source_types_used: [], summary: "good", freshness: "live" },
      recommended_actions: [],
      prevention_tips: [],
      follow_up_questions: [],
      escalation_needed: false,
      escalation_reason: "",
      image_quality: { usable: true, issues: [] },
      second_opinion: { provider: "plantid", checked_at: "2026-03-20T11:00:00.000Z", issue_candidates: [{ name: "Fungal leaf spot", confidence: 8 }], agreement_with_primary: "high", summary: "Plant model agrees." },
      ensemble_opinion: { providers: [{ provider: "plantid", checked_at: "2026-03-20T11:00:00.000Z", issue_candidates: [{ name: "Fungal leaf spot", confidence: 8 }], summary: "Plant model agrees." }], agreement_with_primary: "high", consensus_issue_candidates: [{ name: "Fungal leaf spot", confidence: 8 }], summary: "Ensemble agrees." },
      final_confidence_score_1_to_10: 0
    });

    expect(score).toBeGreaterThanOrEqual(8);
  });
});
