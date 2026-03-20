import { NextRequest, NextResponse } from "next/server";
import { config } from "@/lib/config";
import { sendWhatsAppText } from "@/lib/providers/whatsapp";
import { downloadMetaMedia, getMetaMediaUrl, verifyMetaSignature } from "@/lib/providers/meta-whatsapp";
import { findMessageByProviderId, persistDiagnosisCase } from "@/lib/repositories/cases";
import { runDiagnosisPipeline } from "@/lib/services/orchestrator";
import { storeInboundImage } from "@/lib/services/storage";
import type { InboundPlantCase } from "@/lib/types";

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
  const inbound = extractInboundImage(body);

  if (!inbound) {
    return NextResponse.json({ ok: true, ignored: true, reason: "No supported image message" });
  }

  const existing = await findMessageByProviderId(inbound.messageId);
  if (existing) {
    return NextResponse.json({ ok: true, duplicate: true });
  }

  const hydrated = await hydrateMetaImage(inbound);
  const { diagnosis, replyText } = await runDiagnosisPipeline(hydrated);
  await persistDiagnosisCase(hydrated, diagnosis, replyText);
  await sendWhatsAppText(hydrated.whatsappNumber, replyText);

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
}
