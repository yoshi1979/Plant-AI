import { NextRequest, NextResponse } from "next/server";
import { config } from "@/lib/config";
import { runDiagnosisPipeline } from "@/lib/services/orchestrator";
import { sendWhatsAppText } from "@/lib/providers/whatsapp";

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
  const body = await request.json();
  const inbound = extractInboundImage(body);

  if (!inbound) {
    return NextResponse.json({ ok: true, ignored: true, reason: "No supported image message" });
  }

  const { diagnosis, replyText } = await runDiagnosisPipeline(inbound);
  await sendWhatsAppText(inbound.whatsappNumber, replyText);

  return NextResponse.json({ ok: true, diagnosis });
}

function extractInboundImage(body: any) {
  const message = body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
  const contact = body?.entry?.[0]?.changes?.[0]?.value?.contacts?.[0];
  if (!message || message.type !== "image") return null;

  return {
    userId: contact?.wa_id ?? message.from,
    conversationId: body?.entry?.[0]?.id ?? message.from,
    messageId: message.id,
    imageUrl: `https://lookaside.whatsapp.com/placeholder/${message.image?.id ?? "missing"}`,
    whatsappNumber: message.from,
    provider: "meta" as const,
    caption: message.image?.caption
  };
}
