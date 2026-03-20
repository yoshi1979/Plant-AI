import { NextRequest, NextResponse } from "next/server";
import { addOperatorNote } from "@/lib/repositories/cases";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const form = await request.formData();
  await addOperatorNote(params.id, String(form.get("note") ?? ""));
  return NextResponse.redirect(new URL(`/admin/cases/${params.id}`, request.url), { status: 302 });
}
