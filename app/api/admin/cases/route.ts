import { NextRequest, NextResponse } from "next/server";
import { config } from "@/lib/config";
import { listRecentCases } from "@/lib/repositories/cases";

export async function GET(request: NextRequest) {
  const auth = request.headers.get("x-admin-api-key");
  if (auth !== config.adminApiKey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({ items: await listRecentCases() });
}
