export type HealthStatus = "healthy" | "mild_stress" | "moderate_issue" | "severe_issue" | "unclear";
export type ValidationStrength = "strong" | "partial" | "weak" | "conflicting" | "unavailable";

export type PlantSecondOpinion = {
  provider: string;
  checked_at: string;
  plant_name?: string;
  plant_confidence?: number;
  issue_candidates: { name: string; confidence: number }[];
  health_status?: HealthStatus;
  agreement_with_primary?: "high" | "medium" | "low";
  summary: string;
};

export type PlantEnsembleOpinion = {
  providers: PlantSecondOpinion[];
  agreement_with_primary: "high" | "medium" | "low";
  consensus_plant_name?: string;
  consensus_issue_candidates: { name: string; confidence: number }[];
  summary: string;
};

export type DiagnosisResult = {
  plant_identification: { name: string; confidence: number };
  health_assessment: { status: HealthStatus; confidence: number };
  observed_symptoms: string[];
  likely_issues: { name: string; confidence: number; reasoning: string }[];
  expert_validation: {
    performed: boolean;
    validation_strength: ValidationStrength;
    source_types_used: string[];
    summary: string;
    checked_at?: string;
    freshness?: "live" | "cached" | "unknown";
    winning_issue?: string;
    sources?: { title: string; url: string; sourceType: string; snippet: string }[];
  };
  recommended_actions: { priority: number; action: string; why: string }[];
  prevention_tips: string[];
  follow_up_questions: string[];
  escalation_needed: boolean;
  escalation_reason: string;
  image_quality: { usable: boolean; issues: string[] };
  second_opinion?: PlantSecondOpinion;
  ensemble_opinion?: PlantEnsembleOpinion;
  final_confidence_score_1_to_10: number;
};

export type InboundPlantCase = {
  userId: string;
  conversationId: string;
  messageId: string;
  imageUrl: string;
  whatsappNumber: string;
  provider: "meta" | "twilio";
  caption?: string;
  imageMimeType?: string;
  providerMediaId?: string;
  imageStoragePath?: string;
};
