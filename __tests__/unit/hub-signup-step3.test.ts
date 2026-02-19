import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  hubSignupStep3BodySchema,
  HUB_SIGNUP_STEP3,
} from "@/lib/validation/hub-signup-schemas";
import { isValidIsoCountryCode } from "@/lib/data/iso-countries";

vi.mock("@/lib/hub/signup-session", () => ({
  getSignupSession: vi.fn(),
  updateSignupSessionStep3: vi.fn(),
}));

const VALID_SESSION_ID = "550e8400-e29b-41d4-a716-446655440000";

describe("hub-signup step3 validation", () => {
  describe("hubSignupStep3BodySchema", () => {
    it("accepte un body valide (country ISO, profession ≥2, bio ≤300)", () => {
      const result = hubSignupStep3BodySchema.safeParse({
        signup_session_id: VALID_SESSION_ID,
        country: "FR",
        profession: "Avocat",
        bio: "Ma courte bio.",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.country).toBe("FR");
        expect(result.data.profession).toBe("Avocat");
        expect(result.data.bio).toBe("Ma courte bio.");
      }
    });

    it("accepte bio vide / absente", () => {
      const result = hubSignupStep3BodySchema.safeParse({
        signup_session_id: VALID_SESSION_ID,
        country: "US",
        profession: "Consultant",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.bio).toBe("");
      }
    });

    it("rejette un code pays non ISO (validation ISO country)", () => {
      const result = hubSignupStep3BodySchema.safeParse({
        signup_session_id: VALID_SESSION_ID,
        country: "XX",
        profession: "Avocat",
        bio: "",
      });
      expect(result.success).toBe(false);
    });

    it("rejette un code pays invalide (3 lettres)", () => {
      const result = hubSignupStep3BodySchema.safeParse({
        signup_session_id: VALID_SESSION_ID,
        country: "FRA",
        profession: "Avocat",
        bio: "",
      });
      expect(result.success).toBe(false);
    });

    it("rejette bio > 300 caractères (bio max length)", () => {
      const longBio = "a".repeat(HUB_SIGNUP_STEP3.BIO_MAX_LENGTH + 1);
      const result = hubSignupStep3BodySchema.safeParse({
        signup_session_id: VALID_SESSION_ID,
        country: "FR",
        profession: "Avocat",
        bio: longBio,
      });
      expect(result.success).toBe(false);
    });

    it("accepte bio exactement 300 caractères", () => {
      const exactBio = "a".repeat(HUB_SIGNUP_STEP3.BIO_MAX_LENGTH);
      const result = hubSignupStep3BodySchema.safeParse({
        signup_session_id: VALID_SESSION_ID,
        country: "FR",
        profession: "Avocat",
        bio: exactBio,
      });
      expect(result.success).toBe(true);
    });

    it("rejette profession < 2 caractères", () => {
      const result = hubSignupStep3BodySchema.safeParse({
        signup_session_id: VALID_SESSION_ID,
        country: "FR",
        profession: "A",
        bio: "",
      });
      expect(result.success).toBe(false);
    });

    it("rejette profession vide", () => {
      const result = hubSignupStep3BodySchema.safeParse({
        signup_session_id: VALID_SESSION_ID,
        country: "FR",
        profession: "",
        bio: "",
      });
      expect(result.success).toBe(false);
    });

    it("rejette signup_session_id non UUID", () => {
      const result = hubSignupStep3BodySchema.safeParse({
        signup_session_id: "not-a-uuid",
        country: "FR",
        profession: "Avocat",
        bio: "",
      });
      expect(result.success).toBe(false);
    });

    it("normalise country en majuscules", () => {
      const result = hubSignupStep3BodySchema.safeParse({
        signup_session_id: VALID_SESSION_ID,
        country: "fr",
        profession: "Avocat",
        bio: "",
      });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.country).toBe("FR");
    });
  });

  describe("isValidIsoCountryCode", () => {
    it("retourne true pour des codes ISO valides", () => {
      expect(isValidIsoCountryCode("FR")).toBe(true);
      expect(isValidIsoCountryCode("US")).toBe(true);
      expect(isValidIsoCountryCode("DE")).toBe(true);
      expect(isValidIsoCountryCode("fr")).toBe(true);
    });

    it("retourne false pour des codes invalides", () => {
      expect(isValidIsoCountryCode("XX")).toBe(false);
      expect(isValidIsoCountryCode("FRA")).toBe(false);
      expect(isValidIsoCountryCode("")).toBe(false);
    });
  });
});

describe("POST /api/hub/signup/step3 - session mise à jour", () => {
  beforeEach(async () => {
    const signupSession = await import("@/lib/hub/signup-session");
    vi.mocked(signupSession.getSignupSession).mockReset();
    vi.mocked(signupSession.updateSignupSessionStep3).mockReset();
  });

  it("retourne 404 si session introuvable ou expirée", async () => {
    const { getSignupSession } = await import("@/lib/hub/signup-session");
    vi.mocked(getSignupSession).mockResolvedValueOnce(null);

    const { POST } = await import("@/app/api/hub/signup/step3/route");
    const req = new Request("http://localhost/api/hub/signup/step3", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        signup_session_id: VALID_SESSION_ID,
        country: "FR",
        profession: "Avocat",
        bio: "",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(404);
  });

  it("retourne 200 et next_step step4 quand session mise à jour", async () => {
    const { getSignupSession, updateSignupSessionStep3 } = await import(
      "@/lib/hub/signup-session"
    );
    vi.mocked(getSignupSession).mockResolvedValueOnce({
      id: VALID_SESSION_ID,
      account_type: "new",
      email: null,
      is_llc_client: false,
      existing_user_id: null,
      expires_at: new Date(Date.now() + 86400000).toISOString(),
      country: null,
      profession: null,
      bio: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    vi.mocked(updateSignupSessionStep3).mockResolvedValueOnce({ success: true });

    const { POST } = await import("@/app/api/hub/signup/step3/route");
    const req = new Request("http://localhost/api/hub/signup/step3", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        signup_session_id: VALID_SESSION_ID,
        country: "FR",
        profession: "Avocat",
        bio: "Ma bio.",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.next_step).toBe("step4");
    expect(json.signup_session_id).toBe(VALID_SESSION_ID);
  });
});
