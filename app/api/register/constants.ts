/**
 * Cookie name for pending Stripe Checkout Session ID.
 * Dev Notes: 24h TTL, HttpOnly, Secure in prod, SameSite=Lax, Path=/
 * @see docs/stories/1.11.reprise-inscription-session-stripe-cookie.md
 */
export const PENDING_REGISTRATION_COOKIE = "pending_registration_session";
