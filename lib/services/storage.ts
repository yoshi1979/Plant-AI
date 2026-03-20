import { getSupabaseAdmin } from "@/lib/db";
import { config } from "@/lib/config";
import { sha256Hex } from "@/lib/utils/crypto";

export async function storeInboundImage(params: {
  messageId: string;
  mimeType?: string;
  bytes: Buffer;
}) {
  const supabase = getSupabaseAdmin();
  const extension = extensionForMime(params.mimeType);
  const hash = sha256Hex(params.bytes);
  const path = `inbound/${new Date().toISOString().slice(0, 10)}/${params.messageId}-${hash.slice(0, 12)}.${extension}`;

  if (!supabase) {
    return { path, sha256: hash, stored: false };
  }

  const { error } = await supabase.storage
    .from(config.supabaseBucket)
    .upload(path, params.bytes, {
      contentType: params.mimeType ?? "application/octet-stream",
      upsert: false
    });

  if (error) {
    throw new Error(`Failed to upload image: ${error.message}`);
  }

  return { path, sha256: hash, stored: true };
}

function extensionForMime(mimeType?: string) {
  switch (mimeType) {
    case "image/png": return "png";
    case "image/webp": return "webp";
    case "image/gif": return "gif";
    default: return "jpg";
  }
}
