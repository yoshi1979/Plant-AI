import type { DiagnosisResult } from "@/lib/types";

export function scoreFinalConfidence(result: DiagnosisResult): number {
  const plant = result.plant_identification.confidence;
  const health = result.health_assessment.confidence;
  const issue = result.likely_issues[0]?.confidence ?? 0;
  const imagePenalty = result.image_quality.usable ? 0 : 2;
  const validationBonus = {
    strong: 2,
    partial: 1,
    weak: 0,
    conflicting: -2,
    unavailable: -2
  }[result.expert_validation.validation_strength];

  const raw = Math.round((plant + health + issue) / 3 + validationBonus - imagePenalty);
  return Math.max(1, Math.min(10, raw));
}
