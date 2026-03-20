import { config } from "@/lib/config";

export async function sendWhatsAppText(to: string, body: string) {
  if (config.provider === "meta") {
    if (!config.whatsappPhoneNumberId || !config.whatsappAccessToken) {
      return { ok: false, skipped: true, reason: "Missing Meta WhatsApp credentials" };
    }

    const response = await fetch(`https://graph.facebook.com/v22.0/${config.whatsappPhoneNumberId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.whatsappAccessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body }
      })
    });

    return { ok: response.ok, skipped: false, status: response.status };
  }

  return { ok: false, skipped: true, reason: "Twilio sender implementation placeholder" };
}
