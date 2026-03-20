import crypto from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { config } from "@/lib/config";

const COOKIE_NAME = "plant_admin_session";

function sign(value: string) {
  return crypto.createHmac("sha256", config.adminApiKey).update(value).digest("hex");
}

export function createAdminSessionValue() {
  const payload = `admin:${new Date().toISOString().slice(0, 10)}`;
  return `${payload}.${sign(payload)}`;
}

export function isValidAdminSession(value?: string) {
  if (!value) return false;
  const [payload, signature] = value.split(".");
  if (!payload || !signature) return false;
  return sign(payload) === signature;
}

export async function requireAdminSession() {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!isValidAdminSession(token)) {
    redirect("/admin/login");
  }
}

export const adminCookieName = COOKIE_NAME;
