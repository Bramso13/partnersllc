/**
 * Integration tests: POST /api/hub/signup/step1
 * Story 14.5 - Session créée, email trouvé/non trouvé, TTL 24h
 *
 * Prérequis: migration 046 (hub_signup_sessions + get_profile_by_email) appliquée.
 * Les tests qui utilisent la DB sont skippés si SUPABASE_SERVICE_ROLE_KEY est absent.
 */
import { describe, it, expect, afterEach } from "vitest";
import { POST } from "@/app/api/hub/signup/step1/route";
import { createAdminClient } from "@/lib/supabase/server";

const hasSupabaseEnv =
  !!process.env.SUPABASE_SERVICE_ROLE_KEY &&
  !!process.env.NEXT_PUBLIC_SUPABASE_URL;

const createdSessionIds: string[] = [];

async function cleanupSessions() {
  if (createdSessionIds.length === 0 || !hasSupabaseEnv) return;
  const admin = createAdminClient();
  await admin
    .from("hub_signup_sessions")
    .delete()
    .in("id", createdSessionIds);
  createdSessionIds.length = 0;
}

function createRequest(body: object): Request {
  return new Request("http://localhost/api/hub/signup/step1", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/hub/signup/step1", () => {
  afterEach(async () => {
    await cleanupSessions();
  });

  it("retourne 400 si accountType manquant", async () => {
    const res = await POST(createRequest({}));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBeDefined();
  });

  it("retourne 400 si existing_llc sans email", async () => {
    const res = await POST(
      createRequest({ accountType: "existing_llc" })
    );
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBeDefined();
  });

  it.skipIf(!hasSupabaseEnv)(
    "avec accountType=new crée une session et retourne 200, next_step=step2, is_llc_client=false",
    async () => {
    const res = await POST(createRequest({ accountType: "new" }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.signup_session_id).toBeDefined();
    expect(json.next_step).toBe("step2");
    expect(json.is_llc_client).toBe(false);
    createdSessionIds.push(json.signup_session_id);

    const admin = createAdminClient();
    const { data: row } = await admin
      .from("hub_signup_sessions")
      .select("id, account_type, is_llc_client, created_at, expires_at")
      .eq("id", json.signup_session_id)
      .single();
    expect(row).toBeDefined();
    expect(row?.account_type).toBe("new");
    expect(row?.is_llc_client).toBe(false);
    const expiresAt = new Date(row!.expires_at);
    const now = new Date();
    const hoursDiff = (expiresAt.getTime() - now.getTime()) / (60 * 60 * 1000);
    expect(hoursDiff).toBeGreaterThanOrEqual(23);
    expect(hoursDiff).toBeLessThanOrEqual(25);
  }
  );

  it.skipIf(!hasSupabaseEnv)(
    "avec accountType=existing_llc et email inconnu retourne 404",
    async () => {
    const res = await POST(
      createRequest({
        accountType: "existing_llc",
        email: "inconnu-nexiste-pas@example.com",
      })
    );
    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.error).toContain("non trouvé");
  }
  );
});
