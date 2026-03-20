import { z } from "zod";

export const diagnosisSchema = z.object({
  plant_identification: z.object({
    name: z.string(),
    confidence: z.number().min(0).max(10)
  }),
  health_assessment: z.object({
    status: z.enum(["healthy", "mild_stress", "moderate_issue", "severe_issue", "unclear"]),
    confidence: z.number().min(0).max(10)
  }),
  observed_symptoms: z.array(z.string()).default([]),
  likely_issues: z.array(z.object({
    name: z.string(),
    confidence: z.number().min(0).max(10),
    reasoning: z.string()
  })).default([]),
  expert_validation: z.object({
    performed: z.boolean(),
    validation_strength: z.enum(["strong", "partial", "weak", "conflicting", "unavailable"]),
    source_types_used: z.array(z.string()).default([]),
    summary: z.string(),
    sources: z.array(z.object({
      title: z.string(),
      url: z.string(),
      sourceType: z.string(),
      snippet: z.string()
    })).optional()
  }),
  recommended_actions: z.array(z.object({
    priority: z.number().int(),
    action: z.string(),
    why: z.string()
  })).default([]),
  prevention_tips: z.array(z.string()).default([]),
  follow_up_questions: z.array(z.string()).default([]),
  escalation_needed: z.boolean(),
  escalation_reason: z.string(),
  image_quality: z.object({
    usable: z.boolean(),
    issues: z.array(z.string()).default([])
  }),
  second_opinion: z.object({
    provider: z.string(),
    checked_at: z.string(),
    plant_name: z.string().optional(),
    plant_confidence: z.number().min(0).max(10).optional(),
    issue_candidates: z.array(z.object({ name: z.string(), confidence: z.number().min(0).max(10) })).default([]),
    health_status: z.enum(["healthy", "mild_stress", "moderate_issue", "severe_issue", "unclear"]).optional(),
    agreement_with_primary: z.enum(["high", "medium", "low"]).optional(),
    summary: z.string()
  }).optional(),
  final_confidence_score_1_to_10: z.number().int().min(0).max(10)
});

export type DiagnosisSchema = z.infer<typeof diagnosisSchema>;
