import { config } from "@/lib/config";

export type SetupCheck = {
  name: string;
  ok: boolean;
  value?: string;
  note?: string;
};

export function getSetupStatus() {
  const checks: SetupCheck[] = [
    { name: "APP_BASE_URL", ok: Boolean(config.baseUrl && config.baseUrl.startsWith("http")), value: config.baseUrl },
    { name: "ADMIN_API_KEY", ok: config.adminApiKey !== "dev-admin-key", note: "Set a non-default admin key." },
    { name: "Supabase URL", ok: Boolean(config.supabaseUrl), value: masked(config.supabaseUrl) },
    { name: "Supabase service role key", ok: Boolean(config.supabaseServiceRoleKey), note: "Required for DB writes and storage signing." },
    { name: "Supabase bucket", ok: Boolean(config.supabaseBucket), value: config.supabaseBucket },
    { name: "WhatsApp verify token", ok: config.verifyToken !== "verify-token", note: "Must match Meta webhook config." },
    { name: "WhatsApp access token", ok: Boolean(config.whatsappAccessToken) },
    { name: "WhatsApp phone number id", ok: Boolean(config.whatsappPhoneNumberId) },
    { name: "WhatsApp app secret", ok: Boolean(config.whatsappAppSecret) },
    { name: "AI API key", ok: Boolean(config.aiApiKey) },
    { name: "Search API key", ok: Boolean(config.searchApiKey), note: "Needed for live trusted-source validation." },
    { name: "Queue mode", ok: true, value: config.processAsync ? "async" : "inline" },
    { name: "Queue secret", ok: Boolean(config.queueSecret && config.queueSecret !== "queue-secret"), note: "Needed for manual/worker queue processing." },
    { name: "Plant model #1", ok: config.plantModelProvider === "none" || Boolean(config.plantModelApiKey), value: config.plantModelProvider },
    { name: "Plant model #2", ok: config.plantModelProvider2 === "none" || Boolean(config.plantModelApiKey2), value: config.plantModelProvider2 }
  ];

  const passed = checks.filter((x) => x.ok).length;
  return {
    passed,
    total: checks.length,
    ready: checks.every((x) => x.ok || x.name === "Plant model #1" || x.name === "Plant model #2"),
    checks
  };
}

function masked(value: string) {
  try {
    const url = new URL(value);
    return `${url.protocol}//${url.hostname}`;
  } catch {
    return value;
  }
}
