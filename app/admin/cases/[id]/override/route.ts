import { NextRequest, NextResponse } from "next/server";
import { overrideDiagnosis } from "@/lib/repositories/cases";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const form = await request.formData();
  await overrideDiagnosis(params.id, {
    primaryIssue: String(form.get("primaryIssue") ?? ""),
    healthStatus: String(form.get("healthStatus") ?? ""),
    confidenceScore: Number(form.get("confidenceScore") ?? 0),
    validationSummary: String(form.get("validationSummary") ?? "")
  });
  return NextResponse.redirect(new URL(`/admin/cases/${params.id}`, request.url), { status: 302 });
}
