import { getSupabaseAdmin } from "@/lib/db";
import { getSignedImageUrl } from "@/lib/services/storage";
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

export type CaseDetail = {
  id: string;
  whatsappNumber: string;
  detectedPlantName: string | null;
  healthStatus: string;
  observedSymptoms: string[];
  primaryIssue: string | null;
  alternativeIssues: any[];
  confidenceScore: number;
  validationStrength: string;
  validationSummary: string | null;
  preventionTips: string[];
  escalationAdvice: string | null;
  updatedAt: string;
  expertValidations: { sourceType: string; sourceTitle: string; sourceUrl: string; sourceSnippet: string | null }[];
  treatmentRecommendations: { priority: number; action: string; why: string | null }[];
  followUpQuestions: { question: string; answered: boolean }[];
  messages: { direction: string; messageType: string; body: string | null; createdAt: string }[];
  uploadedImages: { storagePath: string; mimeType: string | null; createdAt: string; signedUrl?: string | null }[];
  operatorNotes: { note: string; eventType: string; createdAt: string }[];
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

const demoDetail: CaseDetail = {
  id: "demo-case-1",
  whatsappNumber: "+15551230000",
  detectedPlantName: "Monstera deliciosa",
  healthStatus: "mild_stress",
  observedSymptoms: ["yellowing lower leaves", "mild droop"],
  primaryIssue: "Likely overwatering with early fungal leaf spotting",
  alternativeIssues: [{ name: "Low light stress", confidence: 4 }],
  confidenceScore: 8,
  validationStrength: "strong",
  validationSummary: "Cross-checked against trusted expert sources with good alignment.",
  preventionTips: ["Use drainage", "Let top soil partly dry"],
  escalationAdvice: null,
  updatedAt: new Date().toISOString(),
  expertValidations: [
    {
      sourceType: "university extension",
      sourceTitle: "Managing houseplant watering",
      sourceUrl: "https://example.edu",
      sourceSnippet: "Yellowing with persistently wet soil can indicate excess water."
    }
  ],
  treatmentRecommendations: [
    { priority: 1, action: "Reduce watering frequency.", why: "Wet soil suggests excess moisture." }
  ],
  followUpQuestions: [
    { question: "Can you share a photo of the soil and pot?", answered: false }
  ],
  messages: [
    { direction: "inbound", messageType: "image", body: "Why is it yellow?", createdAt: new Date().toISOString() },
    { direction: "outbound", messageType: "text", body: "Plant: Monstera deliciosa...", createdAt: new Date().toISOString() }
  ],
  uploadedImages: [
    { storagePath: "inbound/demo.jpg", mimeType: "image/jpeg", createdAt: new Date().toISOString(), signedUrl: null }
  ],
  operatorNotes: []
};

export async function listRecentCases(filters?: { search?: string; maxConfidence?: number; unresolvedOnly?: boolean }): Promise<CaseItem[]> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return demoCases;

  let query = supabase
    .from("diagnoses")
    .select("id, detected_plant_name, health_status, primary_issue, confidence_score_1_to_10, validation_strength, updated_at, conversations!inner(users!inner(whatsapp_number))")
    .order("updated_at", { ascending: false })
    .limit(50);

  if (typeof filters?.maxConfidence === "number") query = query.lte("confidence_score_1_to_10", filters.maxConfidence);
  if (filters?.unresolvedOnly) query = query.in("validation_strength", ["weak", "conflicting", "unavailable", "partial"]);
  if (filters?.search) query = query.or(`detected_plant_name.ilike.%${filters.search}%,primary_issue.ilike.%${filters.search}%`);

  const { data, error } = await query;
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

export async function getCaseDetail(caseId: string): Promise<CaseDetail | null> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return demoDetail.id === caseId ? demoDetail : null;

  const { data: diagnosis } = await supabase
    .from("diagnoses")
    .select("*, conversations!inner(id, users!inner(whatsapp_number))")
    .eq("id", caseId)
    .maybeSingle();

  if (!diagnosis) return null;

  const conversationId = diagnosis.conversation_id;
  const [{ data: validations }, { data: treatments }, { data: followUps }, { data: messages }, { data: images }, { data: notes }] = await Promise.all([
    supabase.from("expert_validations").select("source_type, source_title, source_url, source_snippet").eq("diagnosis_id", caseId),
    supabase.from("treatment_recommendations").select("priority, action, why").eq("diagnosis_id", caseId).order("priority"),
    supabase.from("follow_up_questions").select("question, answered").eq("diagnosis_id", caseId),
    supabase.from("messages").select("direction, message_type, body, created_at").eq("conversation_id", conversationId).order("created_at"),
    supabase.from("uploaded_images").select("storage_path, mime_type, created_at, messages!inner(conversation_id)").eq("messages.conversation_id", conversationId),
    supabase.from("care_history").select("note, event_type, created_at").eq("diagnosis_id", caseId).order("created_at", { ascending: false })
  ]);

  const uploadedImages = await Promise.all((images ?? []).map(async (x: any) => ({
    storagePath: x.storage_path,
    mimeType: x.mime_type,
    createdAt: x.created_at,
    signedUrl: await getSignedImageUrl(x.storage_path)
  })));

  return {
    id: diagnosis.id,
    whatsappNumber: diagnosis.conversations?.users?.whatsapp_number ?? "unknown",
    detectedPlantName: diagnosis.detected_plant_name,
    healthStatus: diagnosis.health_status,
    observedSymptoms: diagnosis.observed_symptoms ?? [],
    primaryIssue: diagnosis.primary_issue,
    alternativeIssues: diagnosis.alternative_issues ?? [],
    confidenceScore: diagnosis.confidence_score_1_to_10,
    validationStrength: diagnosis.validation_strength,
    validationSummary: diagnosis.expert_validation_summary,
    preventionTips: diagnosis.prevention_tips ?? [],
    escalationAdvice: diagnosis.escalation_advice,
    updatedAt: diagnosis.updated_at,
    expertValidations: (validations ?? []).map((x: any) => ({ sourceType: x.source_type, sourceTitle: x.source_title, sourceUrl: x.source_url, sourceSnippet: x.source_snippet })),
    treatmentRecommendations: (treatments ?? []).map((x: any) => ({ priority: x.priority, action: x.action, why: x.why })),
    followUpQuestions: (followUps ?? []).map((x: any) => ({ question: x.question, answered: x.answered })),
    messages: (messages ?? []).map((x: any) => ({ direction: x.direction, messageType: x.message_type, body: x.body, createdAt: x.created_at })),
    uploadedImages,
    operatorNotes: (notes ?? []).map((x: any) => ({ note: x.note, eventType: x.event_type, createdAt: x.created_at }))
  };
}

export async function addOperatorNote(caseId: string, note: string) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return { ok: true };

  const { data: diagnosis } = await supabase.from("diagnoses").select("plant_id").eq("id", caseId).maybeSingle();
  const { error } = await supabase.from("care_history").insert({
    diagnosis_id: caseId,
    plant_id: diagnosis?.plant_id,
    note,
    event_type: "operator_note"
  });
  if (error) throw new Error(error.message);
  return { ok: true };
}

export async function overrideDiagnosis(caseId: string, patch: { primaryIssue?: string; healthStatus?: string; confidenceScore?: number; validationSummary?: string }) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return { ok: true };

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (patch.primaryIssue !== undefined) update.primary_issue = patch.primaryIssue;
  if (patch.healthStatus !== undefined) update.health_status = patch.healthStatus;
  if (patch.confidenceScore !== undefined) update.confidence_score_1_to_10 = patch.confidenceScore;
  if (patch.validationSummary !== undefined) update.expert_validation_summary = patch.validationSummary;

  const { error } = await supabase.from("diagnoses").update(update).eq("id", caseId);
  if (error) throw new Error(error.message);

  await addOperatorNote(caseId, `Diagnosis overridden by operator. Primary issue: ${patch.primaryIssue ?? "unchanged"}. Confidence: ${patch.confidenceScore ?? "unchanged"}.`);
  return { ok: true };
}

export async function findMessageByProviderId(providerMessageId: string) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;
  const { data } = await supabase.from("messages").select("id, provider_message_id").eq("provider_message_id", providerMessageId).maybeSingle();
  return data;
}

export async function ensureUserAndConversation(whatsappNumber: string, conversationKey: string, displayName?: string) {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return { userId: `demo-user-${whatsappNumber}`, conversationId: `demo-conversation-${conversationKey}` };
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

export async function createInboundMessage(params: { conversationId: string; providerMessageId: string; body?: string; metadata?: Record<string, unknown> }) {
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

export async function createUploadedImage(params: { messageId: string; storagePath: string; mimeType?: string; sha256?: string }) {
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

export async function archiveWebhookEvent(params: { provider: string; eventType: string; payload: unknown }) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return { ok: true };
  const { error } = await supabase.from("webhook_events").insert({
    provider: params.provider,
    event_type: params.eventType,
    payload: params.payload
  });
  if (error) throw new Error(error.message);
  return { ok: true };
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
      diagnosis.follow_up_questions.map((question) => ({ diagnosis_id: diagnosisRow.id, question }))
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
