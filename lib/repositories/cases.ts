import { getSupabaseAdmin } from "@/lib/db";
import type { DiagnosisResult, InboundPlantCase } from "@/lib/types";

export type CaseItem = {
  id: string;
  whatsappNumber: string;
  detectedPlantName: string | null;
  healthStatus: string;
  primaryIssue: string | null;
  confidenceScore: number;
  validationStrength: string;
  updatedAt: string;
};

const demoCases: CaseItem[] = [
  {
    id: "demo-case-1",
    whatsappNumber: "+15551230000",
    detectedPlantName: "Monstera deliciosa",
    healthStatus: "mild_stress",
    primaryIssue: "Likely overwatering with early fungal leaf spotting",
    confidenceScore: 8,
    validationStrength: "strong",
    updatedAt: new Date().toISOString()
  }
];

export async function listRecentCases(): Promise<CaseItem[]> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return demoCases;

  const { data, error } = await supabase
    .from("diagnoses")
    .select("id, detected_plant_name, health_status, primary_issue, confidence_score_1_to_10, validation_strength, updated_at, conversations(user_id, users(whatsapp_number))")
    .order("updated_at", { ascending: false })
    .limit(50);

  if (error || !data) return demoCases;

  return data.map((row: any) => ({
    id: row.id,
    whatsappNumber: row.conversations?.users?.whatsapp_number ?? "unknown",
    detectedPlantName: row.detected_plant_name,
    healthStatus: row.health_status,
    primaryIssue: row.primary_issue,
    confidenceScore: row.confidence_score_1_to_10,
    validationStrength: row.validation_strength,
    updatedAt: row.updated_at
  }));
}

export async function findMessageByProviderId(providerMessageId: string) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;

  const { data } = await supabase
    .from("messages")
    .select("id, provider_message_id")
    .eq("provider_message_id", providerMessageId)
    .maybeSingle();

  return data;
}

export async function ensureUserAndConversation(whatsappNumber: string, conversationKey: string, displayName?: string) {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return {
      userId: `demo-user-${whatsappNumber}`,
      conversationId: `demo-conversation-${conversationKey}`
    };
  }

  const { data: user, error: userError } = await supabase
    .from("users")
    .upsert({ whatsapp_number: whatsappNumber, display_name: displayName, updated_at: new Date().toISOString() }, { onConflict: "whatsapp_number" })
    .select("id")
    .single();

  if (userError || !user) throw new Error(userError?.message ?? "Unable to upsert user");

  const { data: conversation, error: conversationError } = await supabase
    .from("conversations")
    .upsert({ user_id: user.id, whatsapp_thread_key: conversationKey, last_message_at: new Date().toISOString(), updated_at: new Date().toISOString() }, { onConflict: "whatsapp_thread_key" })
    .select("id")
    .single();

  if (conversationError || !conversation) throw new Error(conversationError?.message ?? "Unable to upsert conversation");

  return { userId: user.id, conversationId: conversation.id };
}

export async function createInboundMessage(params: {
  conversationId: string;
  providerMessageId: string;
  body?: string;
  metadata?: Record<string, unknown>;
}) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return { id: `demo-message-${params.providerMessageId}` };

  const { data, error } = await supabase
    .from("messages")
    .insert({
      conversation_id: params.conversationId,
      provider_message_id: params.providerMessageId,
      direction: "inbound",
      message_type: "image",
      body: params.body,
      metadata: params.metadata ?? {}
    })
    .select("id")
    .single();

  if (error || !data) throw new Error(error?.message ?? "Unable to insert inbound message");
  return data;
}

export async function createUploadedImage(params: {
  messageId: string;
  storagePath: string;
  mimeType?: string;
  sha256?: string;
}) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return { id: `demo-image-${params.messageId}` };

  const { data, error } = await supabase
    .from("uploaded_images")
    .insert({
      message_id: params.messageId,
      storage_path: params.storagePath,
      mime_type: params.mimeType,
      sha256: params.sha256
    })
    .select("id")
    .single();

  if (error || !data) throw new Error(error?.message ?? "Unable to insert uploaded image");
  return data;
}

export async function persistDiagnosisCase(input: InboundPlantCase, diagnosis: DiagnosisResult, replyText: string) {
  const ids = await ensureUserAndConversation(input.whatsappNumber, input.conversationId);
  const inboundMessage = await createInboundMessage({
    conversationId: ids.conversationId,
    providerMessageId: input.messageId,
    body: input.caption,
    metadata: {
      provider: input.provider,
      imageUrl: input.imageUrl,
      providerMediaId: input.providerMediaId,
      mimeType: input.imageMimeType
    }
  });

  if (input.imageStoragePath) {
    await createUploadedImage({
      messageId: inboundMessage.id,
      storagePath: input.imageStoragePath,
      mimeType: input.imageMimeType
    });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return { conversationId: ids.conversationId, diagnosisId: `demo-diagnosis-${input.messageId}` };
  }

  const { data: diagnosisRow, error: diagnosisError } = await supabase
    .from("diagnoses")
    .insert({
      conversation_id: ids.conversationId,
      detected_plant_name: diagnosis.plant_identification.name,
      health_status: diagnosis.health_assessment.status,
      observed_symptoms: diagnosis.observed_symptoms,
      primary_issue: diagnosis.likely_issues[0]?.name ?? null,
      alternative_issues: diagnosis.likely_issues.slice(1),
      confidence_score_1_to_10: diagnosis.final_confidence_score_1_to_10,
      validation_strength: diagnosis.expert_validation.validation_strength,
      expert_source_types_used: diagnosis.expert_validation.source_types_used,
      expert_validation_summary: diagnosis.expert_validation.summary,
      recommended_actions: diagnosis.recommended_actions,
      prevention_tips: diagnosis.prevention_tips,
      escalation_advice: diagnosis.escalation_needed ? diagnosis.escalation_reason : null,
      raw_model_output: diagnosis,
      updated_at: new Date().toISOString()
    })
    .select("id")
    .single();

  if (diagnosisError || !diagnosisRow) throw new Error(diagnosisError?.message ?? "Unable to persist diagnosis");

  if (diagnosis.expert_validation.sources?.length) {
    await supabase.from("expert_validations").insert(
      diagnosis.expert_validation.sources.map((source) => ({
        diagnosis_id: diagnosisRow.id,
        source_type: source.sourceType,
        source_title: source.title,
        source_url: source.url,
        source_snippet: source.snippet
      }))
    );
  }

  if (diagnosis.recommended_actions.length) {
    await supabase.from("treatment_recommendations").insert(
      diagnosis.recommended_actions.map((action) => ({
        diagnosis_id: diagnosisRow.id,
        priority: action.priority,
        action: action.action,
        why: action.why
      }))
    );
  }

  if (diagnosis.follow_up_questions.length) {
    await supabase.from("follow_up_questions").insert(
      diagnosis.follow_up_questions.map((question) => ({
        diagnosis_id: diagnosisRow.id,
        question
      }))
    );
  }

  await supabase.from("messages").insert({
    conversation_id: ids.conversationId,
    provider_message_id: `outbound-${input.messageId}`,
    direction: "outbound",
    message_type: "text",
    body: replyText,
    metadata: { generatedBy: "diagnosis-pipeline", confidence: diagnosis.final_confidence_score_1_to_10 }
  });

  return { conversationId: ids.conversationId, diagnosisId: diagnosisRow.id };
}
