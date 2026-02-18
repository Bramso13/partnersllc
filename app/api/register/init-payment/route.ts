import { NextRequest, NextResponse } from "next/server";
import { createPaymentSession } from "@/app/actions/create-payment-session";
import { PENDING_REGISTRATION_COOKIE } from "../constants";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

function buildCookieOptions(sessionId: string) {
  const isSecure =
    process.env.NODE_ENV === "production" || BASE_URL.startsWith("https://");
  return {
    httpOnly: true,
    secure: isSecure,
    sameSite: "lax" as const,
    path: "/",
    maxAge: 86400, // 24 hours, aligned with Stripe Checkout Session expiry
  };
}

/**
 * GET /api/register/init-payment?token=...
 * Validates token, creates Stripe Checkout Session, sets pending_registration_session cookie, redirects to Stripe.
 */
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");

  if (!token || typeof token !== "string" || token.trim() === "") {
    return NextResponse.json({ error: "Token manquant" }, { status: 400 });
  }

  const result = await createPaymentSession(token.trim());

  if (result.error) {
    if (result.error === "INVALID_LINK") {
      return NextResponse.redirect(
        new URL(
          `/register/${encodeURIComponent(token)}?error=INVALID_LINK`,
          BASE_URL
        ),
        { status: 302 }
      );
    }
    return NextResponse.redirect(
      new URL(
        `/register/${encodeURIComponent(token)}?error=${encodeURIComponent(result.error)}`,
        BASE_URL
      ),
      { status: 302 }
    );
  }

  if (!result.redirectUrl || !result.sessionId) {
    return NextResponse.redirect(
      new URL(
        `/register/${encodeURIComponent(token)}?error=FAILED_TO_CREATE_CHECKOUT_SESSION`,
        BASE_URL
      ),
      { status: 302 }
    );
  }

  const response = NextResponse.redirect(result.redirectUrl, { status: 302 });
  // response.cookies.set(PENDING_REGISTRATION_COOKIE, result.sessionId, buildCookieOptions(result.sessionId));
  return response;
}
