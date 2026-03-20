import { NextResponse } from "next/server";
import { getSetupStatus } from "@/lib/setup-status";

export async function GET() {
  return NextResponse.json(getSetupStatus());
}
