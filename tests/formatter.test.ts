import { describe, expect, it } from "vitest";
import { formatWhatsAppReply } from "@/lib/services/formatter";

describe("formatWhatsAppReply", () => {
  it("includes confidence and actions", () => {
    const reply = formatWhatsAppReply({
      plant_identification: { name: "Pothos", confidence: 9 },
      health_assessment: { status: "mild_stress", confidence: 8 },
      observed_symptoms: ["yellow leaves"],
      likely_issues: [{ name: "Overwatering", confidence: 8, reasoning: "Visible yellowing" }],
      expert_validation: {
        performed: true,
        validation_strength: "strong",
        source_types_used: ["university extension"],
        summary: "Cross-check was strong.",
        freshness: "live",
        checked_at: "2026-03-20T11:00:00.000Z",
        winning_issue: "Overwatering"
      },
      recommended_actions: [{ priority: 1, action: "Let soil dry slightly.", why: "Excess moisture." }],
      prevention_tips: ["Use drainage holes."],
      follow_up_questions: [],
      escalation_needed: false,
      escalation_reason: "",
      image_quality: { usable: true, issues: [] },
      second_opinion: { provider: "plantid", checked_at: "2026-03-20T11:00:00.000Z", issue_candidates: [{ name: "Overwatering", confidence: 8 }], agreement_with_primary: "high", summary: "Plant model agrees." },
      ensemble_opinion: { providers: [{ provider: "plantid", checked_at: "2026-03-20T11:00:00.000Z", issue_candidates: [{ name: "Overwatering", confidence: 8 }], summary: "Plant model agrees." }], agreement_with_primary: "high", consensus_issue_candidates: [{ name: "Overwatering", confidence: 8 }], summary: "Ensemble agrees." },
      final_confidence_score_1_to_10: 8
    });

    expect(reply).toContain("Confidence score: 8/10");
    expect(reply).toContain("What to do now:");
  });
});
