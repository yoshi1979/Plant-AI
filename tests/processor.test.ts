import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/services/orchestrator", () => ({
  runDiagnosisPipeline: vi.fn(async () => ({
    diagnosis: {
      plant_identification: { name: "Pothos", confidence: 8 },
      health_assessment: { status: "mild_stress", confidence: 7 },
      observed_symptoms: ["yellow leaves"],
      likely_issues: [{ name: "Overwatering", confidence: 7, reasoning: "test" }],
      expert_validation: { performed: true, validation_strength: "strong", source_types_used: [], summary: "ok", freshness: "live" },
      recommended_actions: [], prevention_tips: [], follow_up_questions: [], escalation_needed: false, escalation_reason: "",
      image_quality: { usable: true, issues: [] }, final_confidence_score_1_to_10: 8
    },
    replyText: "hello"
  }))
}));

const sendWhatsAppText = vi.fn(async () => ({ ok: true, skipped: false, status: 200 }));
vi.mock("@/lib/providers/whatsapp", () => ({ sendWhatsAppText }));
const persistDiagnosisCase = vi.fn(async () => { throw new Error("db failed"); });
vi.mock("@/lib/repositories/cases", () => ({ persistDiagnosisCase }));

describe("processDiagnosisCase", () => {
  it("still returns after sending reply even if persistence fails", async () => {
    const { processDiagnosisCase } = await import("@/lib/services/processor");
    const result = await processDiagnosisCase({
      userId: "u1",
      conversationId: "c1",
      messageId: "m1",
      imageUrl: "https://example.com/x.jpg",
      whatsappNumber: "123",
      provider: "meta"
    });

    expect(sendWhatsAppText).toHaveBeenCalled();
    expect(persistDiagnosisCase).toHaveBeenCalled();
    expect(result.replyText).toBe("hello");
  });
});
