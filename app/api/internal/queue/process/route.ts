import { NextRequest, NextResponse } from "next/server";
import { config } from "@/lib/config";
import { claimPendingDiagnosisJob, completeJob, failJob } from "@/lib/services/queue";
import { processDiagnosisCase } from "@/lib/services/processor";

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
    await failJob(job.id, error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ ok: false, processed: false, jobId: job.id }, { status: 500 });
  }
}
