import { config } from "@/lib/config";

type Level = "debug" | "info" | "warn" | "error";
const order: Record<Level, number> = { debug: 10, info: 20, warn: 30, error: 40 };

function shouldLog(level: Level) {
  const configured = (config.logLevel as Level) in order ? (config.logLevel as Level) : "info";
  return order[level] >= order[configured];
}

export function log(level: Level, message: string, meta?: Record<string, unknown>) {
  if (!shouldLog(level)) return;
  const payload = {
    ts: new Date().toISOString(),
    level,
    message,
    ...(meta ? { meta: sanitize(meta) } : {})
  };
  const line = JSON.stringify(payload);
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

function sanitize(meta: Record<string, unknown>) {
  const blocked = ["authorization", "token", "secret", "apiKey", "accessToken", "appSecret"];
  return Object.fromEntries(Object.entries(meta).map(([k, v]) => {
    if (blocked.some((x) => k.toLowerCase().includes(x.toLowerCase()))) return [k, "[redacted]"];
    return [k, v];
  }));
}
