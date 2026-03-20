import { describe, expect, it } from "vitest";
import { formatWhatsAppReply } from "@/lib/services/formatter";
import { validateDiagnosisAgainstExpertSources } from "@/lib/services/validation";

describe("validateDiagnosisAgainstExpertSources", () => {
  it("falls back conservatively when search is unavailable", async () => {
    const result = await validateDiagnosisAgainstExpertSources({
      plant_identification: { name: "Pothos", confidence: 8 },
      health_assessment: { status: "mild_stress", confidence: 7 },
      observed_symptoms: ["yellow leaves"],
      likely_issues: [{ name: "Overwatering", confidence: 7, reasoning: "yellowing and droop" }],
      expert_validation: { performed: false, validation_strength: "unavailable", source_types_used: [], summary: "", freshness: "unknown" },
      recommended_actions: [],
      prevention_tips: [],
      follow_up_questions: [],
      escalation_needed: false,
      escalation_reason: "",
      image_quality: { usable: true, issues: [] },
      second_opinion: undefined,
      final_confidence_score_1_to_10: 0
    });

    expect(result.expert_validation.performed).toBe(true);
    expect(result.recommended_actions.length).toBeGreaterThan(0);
    expect(formatWhatsAppReply(result)).toContain("Validated against expert guidance:");
  });
});
