import { NextRequest, NextResponse } from "next/server";
import { config } from "@/lib/config";
import { listRecentCases } from "@/lib/repositories/cases";

export async function GET(request: NextRequest) {
  const auth = request.headers.get("x-admin-api-key");
  if (auth !== config.adminApiKey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const search = request.nextUrl.searchParams.get("search") ?? undefined;
  const unresolvedOnly = request.nextUrl.searchParams.get("unresolved") === "1";
  const maxConfidence = request.nextUrl.searchParams.get("maxConfidence");

  return NextResponse.json({
    items: await listRecentCases({
      search,
      unresolvedOnly,
      maxConfidence: maxConfidence ? Number(maxConfidence) : undefined
    })
  });
}
