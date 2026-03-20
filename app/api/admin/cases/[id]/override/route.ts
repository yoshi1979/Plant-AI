import { NextRequest, NextResponse } from "next/server";
import { overrideDiagnosis } from "@/lib/repositories/cases";
import { config } from "@/lib/config";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = request.headers.get("x-admin-api-key");
  if (auth !== config.adminApiKey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  await overrideDiagnosis(params.id, {
    primaryIssue: body.primaryIssue,
    healthStatus: body.healthStatus,
    confidenceScore: body.confidenceScore,
    validationSummary: body.validationSummary
  });
  return NextResponse.json({ ok: true });
}
