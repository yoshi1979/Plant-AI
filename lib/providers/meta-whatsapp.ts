import { config } from "@/lib/config";
import { hmacSha256Hex, safeCompareHex } from "@/lib/utils/crypto";

function authHeaders() {
  return {
    Authorization: `Bearer ${config.whatsappAccessToken}`
  };
}

export function verifyMetaSignature(rawBody: string, signatureHeader: string | null) {
  if (!config.whatsappAppSecret) return true;
  if (!signatureHeader?.startsWith("sha256=")) return false;
  const provided = signatureHeader.slice("sha256=".length);
  const expected = hmacSha256Hex(config.whatsappAppSecret, rawBody);
  return safeCompareHex(provided, expected);
}

export async function getMetaMediaUrl(mediaId: string) {
  const response = await fetch(`https://graph.facebook.com/${config.whatsappApiVersion}/${mediaId}`, {
    headers: authHeaders(),
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`Failed to resolve media URL for ${mediaId}: ${response.status}`);
  }

  return response.json() as Promise<{ url: string; mime_type?: string; id: string }>;
}

export async function downloadMetaMedia(mediaUrl: string) {
  const response = await fetch(mediaUrl, {
    headers: authHeaders(),
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`Failed to download WhatsApp media: ${response.status}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
