import { getSupabaseAdmin } from "@/lib/db";

export async function enqueueDiagnosisJob(payload: Record<string, unknown>) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return { queued: false, id: null };

  const { data, error } = await supabase
    .from("job_queue")
    .insert({ job_type: "diagnosis", payload, status: "pending" })
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  return { queued: true, id: data.id };
}

export async function claimPendingDiagnosisJob() {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;

  const { data } = await supabase
    .from("job_queue")
    .select("id, payload")
    .eq("job_type", "diagnosis")
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!data) return null;

  const { error } = await supabase
    .from("job_queue")
    .update({ status: "processing", attempts: 1, updated_at: new Date().toISOString() })
    .eq("id", data.id)
    .eq("status", "pending");

  if (error) return null;
  return data;
}

export async function completeJob(id: string) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return;
  await supabase.from("job_queue").update({ status: "completed", updated_at: new Date().toISOString() }).eq("id", id);
}

export async function failJob(id: string, errorMessage: string) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return;
  await supabase.from("job_queue").update({ status: "failed", last_error: errorMessage, updated_at: new Date().toISOString() }).eq("id", id);
}
