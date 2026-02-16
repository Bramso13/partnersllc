import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";
import { checkRateLimit } from "@/lib/rate-limit";
import { PENDING_REGISTRATION_COOKIE } from "../constants";

const BASE_URL =
  process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export type ResolvePendingStatus =
  | "none"
  | "paid_incomplete"
  | "paid_complete"
  | "unpaid"
  | "expired"
  | "invalid";

export interface ResolvePendingResponse {
  status: ResolvePendingStatus;
  redirectUrl?: string;
  message?: string;
}

function clearCookieResponse(
  res: NextResponse,
  body: ResolvePendingResponse
): NextResponse {
  res.cookies.set(PENDING_REGISTRATION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return res;
}

/**
 * GET /api/register/resolve-pending
 * Reads pending_registration_session cookie, resolves Stripe session, returns status and optional redirectUrl.
 * Rate limited to 15 req/min per IP.
 */
export async function GET(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";
  const { allowed } = checkRateLimit(ip);
  if (!allowed) {
    return NextResponse.json(
      { status: "invalid" as const, message: "Trop de requêtes" },
      { status: 429 }
    );
  }

  const cookieStore = await cookies();
  const sessionId = cookieStore.get(PENDING_REGISTRATION_COOKIE)?.value?.trim();

  if (!sessionId) {
    return NextResponse.json({ status: "none" } satisfies ResolvePendingResponse);
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const token =
      session.metadata?.payment_link_token as string | undefined;

    if (!token) {
      const res = NextResponse.json({
        status: "invalid",
        message: "Session invalide",
      } satisfies ResolvePendingResponse);
      return clearCookieResponse(res, { status: "invalid" });
    }

    const supabase = await createClient();
    const { data: paymentLink, error: linkError } = await supabase
      .from("payment_links")
      .select("id, used_at, status")
      .eq("token", token)
      .single();

    if (linkError || !paymentLink) {
      const res = NextResponse.json({
        status: "invalid",
        message: "Lien de paiement introuvable",
      } satisfies ResolvePendingResponse);
      return clearCookieResponse(res, { status: "invalid" });
    }

    const paid = session.payment_status === "paid";
    const used = !!paymentLink.used_at;
    const expired =
      session.status === "expired" ||
      (session.expires_at && session.expires_at < Math.floor(Date.now() / 1000));

    if (paid && !used) {
      return NextResponse.json({
        status: "paid_incomplete",
        redirectUrl: `${BASE_URL}/register/${encodeURIComponent(token)}/complete`,
      } satisfies ResolvePendingResponse);
    }

    if (paid && used) {
      const res = NextResponse.json({
        status: "paid_complete",
        message: "Inscription déjà finalisée",
      } satisfies ResolvePendingResponse);
      return clearCookieResponse(res, { status: "paid_complete" });
    }

    if (expired) {
      const res = NextResponse.json({
        status: "expired",
        redirectUrl: `${BASE_URL}/register/${encodeURIComponent(token)}`,
        message: "Session de paiement expirée",
      } satisfies ResolvePendingResponse);
      return clearCookieResponse(res, { status: "expired" });
    }

    // unpaid or open session
    const res = NextResponse.json({
      status: "unpaid",
      redirectUrl: `${BASE_URL}/register/${encodeURIComponent(token)}`,
      message: "Finalisez votre paiement pour créer votre compte",
    } satisfies ResolvePendingResponse);
    return res;
  } catch (err) {
    console.error("[resolve-pending] Stripe or DB error:", err);
    const res = NextResponse.json({
      status: "invalid",
      message: "Session invalide ou expirée",
    } satisfies ResolvePendingResponse);
    return clearCookieResponse(res, { status: "invalid" });
  }
}
