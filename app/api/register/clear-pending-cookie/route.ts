import { NextRequest, NextResponse } from "next/server";
import { PENDING_REGISTRATION_COOKIE } from "../constants";

const BASE_URL =
  process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const DEFAULT_REDIRECT = "/dashboard";

/**
 * GET /api/register/clear-pending-cookie?then=/dashboard
 * Clears pending_registration_session cookie and redirects to "then" (default /dashboard).
 * Used after successful completeRegistration so the cookie is removed before entering the app.
 */
export async function GET(request: NextRequest) {
  const thenParam = request.nextUrl.searchParams.get("then");
  const redirectPath =
    thenParam && thenParam.startsWith("/")
      ? thenParam
      : DEFAULT_REDIRECT;
  const redirectUrl = new URL(redirectPath, BASE_URL);

  const response = NextResponse.redirect(redirectUrl.toString(), {
    status: 302,
  });
  response.cookies.set(PENDING_REGISTRATION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}
