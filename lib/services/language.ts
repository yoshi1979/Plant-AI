export type ReplyLanguage = "en" | "he";

export function detectReplyLanguage(text?: string): ReplyLanguage {
  if (!text) return "en";
  return /[\u0590-\u05FF]/.test(text) ? "he" : "en";
}
