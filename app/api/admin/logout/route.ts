import { NextResponse } from "next/server";
import { adminCookieName } from "@/lib/admin-auth";

export async function POST(request: Request) {
  const response = NextResponse.redirect(new URL("/admin/login", request.url), { status: 302 });
  response.cookies.set(adminCookieName, "", { path: "/", maxAge: 0 });
  return response;
}
