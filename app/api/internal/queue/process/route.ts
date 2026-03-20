import { NextRequest, NextResponse } from "next/server";
import { config } from "@/lib/config";
import { claimPendingDiagnosisJob, completeJob, failJob } from "@/lib/services/queue";
import { processDiagnosisCase } from "@/lib/services/processor";
import { log } from "@/lib/logger";

export async function POST(request: NextRequest) {
  const auth = request.headers.get("x-queue-secret");
  if (auth !== config.queueSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const job = await claimPendingDiagnosisJob();
  if (!job) return NextResponse.json({ ok: true, processed: false });

  try {
    await processDiagnosisCase(job.payload.inbound);
    await completeJob(job.id);
    return NextResponse.json({ ok: true, processed: true, jobId: job.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    log("error", "Queue job processing failed", { jobId: job.id, errorMessage: message, attempts: job.attempts });
    await failJob(job.id, message, job.attempts);
    return NextResponse.json({ ok: false, processed: false, jobId: job.id }, { status: 500 });
  }
}
