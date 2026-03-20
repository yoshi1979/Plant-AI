import { getSupabaseAdmin } from "@/lib/db";
import { config } from "@/lib/config";
import { log } from "@/lib/logger";

export async function enqueueDiagnosisJob(payload: Record<string, unknown>) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return { queued: false, id: null };

  const { data, error } = await supabase
    .from("job_queue")
    .insert({
      job_type: "diagnosis",
      payload,
      status: "pending",
      run_after: new Date().toISOString()
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  log("info", "Queued diagnosis job", { jobId: data.id });
  return { queued: true, id: data.id };
}

export async function claimPendingDiagnosisJob() {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;

  const now = new Date().toISOString();
  const { data } = await supabase
    .from("job_queue")
    .select("id, payload, attempts")
    .eq("job_type", "diagnosis")
    .eq("status", "pending")
    .lte("run_after", now)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!data) return null;

  const nextAttempts = Number(data.attempts ?? 0) + 1;
  const { error } = await supabase
    .from("job_queue")
    .update({ status: "processing", attempts: nextAttempts, updated_at: now })
    .eq("id", data.id)
    .eq("status", "pending");

  if (error) return null;
  return { ...data, attempts: nextAttempts };
}

export async function completeJob(id: string) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return;
  await supabase.from("job_queue").update({ status: "completed", updated_at: new Date().toISOString() }).eq("id", id);
  log("info", "Completed diagnosis job", { jobId: id });
}

export async function failJob(id: string, errorMessage: string, attempts = 1) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return;

  const permanentFailure = attempts >= config.queueMaxAttempts;
  const backoffMs = config.queueRetryBaseMs * Math.max(1, attempts);
  const runAfter = new Date(Date.now() + backoffMs).toISOString();

  await supabase.from("job_queue").update({
    status: permanentFailure ? "failed" : "pending",
    last_error: errorMessage,
    run_after: runAfter,
    updated_at: new Date().toISOString()
  }).eq("id", id);

  log(permanentFailure ? "error" : "warn", permanentFailure ? "Job permanently failed" : "Job scheduled for retry", {
    jobId: id,
    attempts,
    backoffMs,
    errorMessage
  });
}
