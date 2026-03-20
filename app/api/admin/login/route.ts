import { NextRequest, NextResponse } from "next/server";
import { config } from "@/lib/config";
import { adminCookieName, createAdminSessionValue } from "@/lib/admin-auth";

export async function POST(request: NextRequest) {
  const form = await request.formData();
  const key = String(form.get("key") ?? "");

  if (key !== config.adminApiKey) {
    return NextResponse.redirect(new URL("/admin/login?error=1", request.url), { status: 302 });
  }

  const response = NextResponse.redirect(new URL("/admin", request.url), { status: 302 });
  response.cookies.set(adminCookieName, createAdminSessionValue(), {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    path: "/",
    maxAge: 60 * 60 * 12
  });
  return response;
}
