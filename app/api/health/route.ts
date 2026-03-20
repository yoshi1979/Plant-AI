import { NextResponse } from "next/server";
import { config } from "@/lib/config";

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "plant-health-assistant",
    environment: config.appEnv,
    asyncProcessing: config.processAsync,
    queueMaxAttempts: config.queueMaxAttempts,
    rateLimitWindowMs: config.rateLimitWindowMs,
    rateLimitMaxRequests: config.rateLimitMaxRequests
  });
}
