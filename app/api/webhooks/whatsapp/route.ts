import { NextRequest, NextResponse } from "next/server";
import { config } from "@/lib/config";
import { downloadMetaMedia, getMetaMediaUrl, verifyMetaSignature } from "@/lib/providers/meta-whatsapp";
import { archiveWebhookEvent, findMessageByProviderId } from "@/lib/repositories/cases";
import { storeInboundImage } from "@/lib/services/storage";
import type { InboundPlantCase } from "@/lib/types";
import { checkRateLimit } from "@/lib/services/rate-limit";
import { enqueueDiagnosisJob } from "@/lib/services/queue";
import { processDiagnosisCase } from "@/lib/services/processor";
import { log } from "@/lib/logger";

export async function GET(request: NextRequest) {
  const search = request.nextUrl.searchParams;
  const mode = search.get("hub.mode");
  const token = search.get("hub.verify_token");
  const challenge = search.get("hub.challenge");

  if (mode === "subscribe" && token === config.verifyToken) {
    return new NextResponse(challenge, { status: 200 });
  }

  return new NextResponse("Forbidden", { status: 403 });
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signatureHeader = request.headers.get("x-hub-signature-256");

  if (!verifyMetaSignature(rawBody, signatureHeader)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const body = JSON.parse(rawBody);
  try {
    await archiveWebhookEvent({ provider: "meta", eventType: "webhook", payload: body });
  } catch (error) {
    log("warn", "Webhook archive failed", { errorMessage: error instanceof Error ? error.message : "Unknown error" });
  }

  const inbound = extractInboundImage(body);
  if (!inbound) {
    return NextResponse.json({ ok: true, ignored: true, reason: "No supported image message" });
  }

  const rate = checkRateLimit(inbound.whatsappNumber, config.rateLimitWindowMs, config.rateLimitMaxRequests);
  if (!rate.allowed) {
    return NextResponse.json({ error: "Rate limited" }, { status: 429, headers: { "Retry-After": String(Math.ceil((rate.resetAt - Date.now()) / 1000)) } });
  }

  const existing = await findMessageByProviderId(inbound.messageId);
  if (existing) {
    return NextResponse.json({ ok: true, duplicate: true });
  }

  const hydrated = await hydrateMetaImage(inbound);

  if (config.processAsync) {
    const job = await enqueueDiagnosisJob({ inbound: hydrated });
    return NextResponse.json({ ok: true, queued: job.queued, jobId: job.id });
  }

  const { diagnosis } = await processDiagnosisCase(hydrated);
  return NextResponse.json({ ok: true, diagnosis });
}

function extractInboundImage(body: any): InboundPlantCase | null {
  const value = body?.entry?.[0]?.changes?.[0]?.value;
  const message = value?.messages?.[0];
  const contact = value?.contacts?.[0];
  if (!message || message.type !== "image") return null;

  return {
    userId: contact?.wa_id ?? message.from,
    conversationId: value?.metadata?.phone_number_id ?? message.from,
    messageId: message.id,
    imageUrl: "",
    whatsappNumber: message.from,
    provider: "meta",
    caption: message.image?.caption,
    imageMimeType: message.image?.mime_type,
    providerMediaId: message.image?.id
  };
}

async function hydrateMetaImage(inbound: InboundPlantCase): Promise<InboundPlantCase> {
  if (!inbound.providerMediaId) {
    throw new Error("Inbound WhatsApp image is missing media id");
  }

  const media = await getMetaMediaUrl(inbound.providerMediaId);
  const bytes = await downloadMetaMedia(media.url);

  try {
    const stored = await storeInboundImage({
      messageId: inbound.messageId,
      mimeType: media.mime_type ?? inbound.imageMimeType,
      bytes
    });

    return {
      ...inbound,
      imageUrl: media.url,
      imageMimeType: media.mime_type ?? inbound.imageMimeType,
      imageStoragePath: stored.path
    };
  } catch (error) {
    log("warn", "Image storage failed; continuing without persistence", {
      messageId: inbound.messageId,
      errorMessage: error instanceof Error ? error.message : "Unknown error"
    });

    return {
      ...inbound,
      imageUrl: media.url,
      imageMimeType: media.mime_type ?? inbound.imageMimeType
    };
  }
}
