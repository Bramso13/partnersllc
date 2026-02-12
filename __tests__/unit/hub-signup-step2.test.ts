import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/hub/signup/step2/route";

vi.mock("@/lib/supabase/server", () => ({
  createAdminClient: vi.fn(),
}));

vi.mock("@/lib/auth/password-hash", () => ({
  hashPassword: vi.fn(() => Promise.resolve("$2b$10$mockedHash")),
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(() => Promise.resolve({ get: () => null })),
}));

import { createAdminClient } from "@/lib/supabase/server";
import { hashPassword } from "@/lib/auth/password-hash";
import {
  step2NewMemberSchema,
  step2LlcClientSchema,
} from "@/lib/validation/hub-signup-schemas";

const mockAuthListUsers = vi.fn();
const mockUpdateFn = vi.fn();
let mockSessionResult: { data: unknown; error: unknown } = {
  data: null,
  error: null,
};
let mockUpdateResult: { error: unknown } = { error: null };

function buildFromMock() {
  mockUpdateFn.mockReturnValue({
    eq: vi.fn().mockResolvedValue(mockUpdateResult),
  });
  return {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue(mockSessionResult),
      update: mockUpdateFn,
    })),
    auth: {
      admin: {
        listUsers: mockAuthListUsers,
      },
    },
  };
}

describe("POST /api/hub/signup/step2", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSessionResult = { data: null, error: null };
    mockUpdateResult = { error: null };
    (createAdminClient as ReturnType<typeof vi.fn>).mockImplementation(
      buildFromMock
    );
  });

  it("retourne 401 si signup_session_id absent", async () => {
    const req = new Request("http://localhost/api/hub/signup/step2", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        first_name: "Jean",
        last_name: "Dupont",
        email: "jean@example.com",
        password: "Pass123!",
      }),
    });
    const res = await POST(req as never);
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toContain("Session");
    expect(createAdminClient).not.toHaveBeenCalled();
  });

  it("retourne 404 si session introuvable", async () => {
    mockSessionResult = { data: null, error: { message: "Not found" } };

    const req = new Request("http://localhost/api/hub/signup/step2", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-signup-session-id": "00000000-0000-0000-0000-000000000001",
      },
      body: JSON.stringify({
        first_name: "Jean",
        last_name: "Dupont",
        email: "jean@example.com",
        password: "Pass123!",
      }),
    });
    const res = await POST(req as never);
    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.error).toMatch(/introuvable|expirée/);
  });

  it("retourne 410 si session expirée", async () => {
    const expired = new Date(Date.now() - 86400000).toISOString();
    mockSessionResult = {
      data: {
        id: "sess-1",
        account_type: "new",
        email: null,
        is_llc_client: false,
        expires_at: expired,
      },
      error: null,
    };

    const req = new Request("http://localhost/api/hub/signup/step2", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-signup-session-id": "sess-1",
      },
      body: JSON.stringify({
        first_name: "Jean",
        last_name: "Dupont",
        email: "jean@example.com",
        password: "Pass123!",
      }),
    });
    const res = await POST(req as never);
    expect(res.status).toBe(410);
    const json = await res.json();
    expect(json.error).toMatch(/expirée/);
  });

  it("retourne 400 si body invalide (email invalide, mot de passe faible)", async () => {
    mockSessionResult = {
      data: {
        id: "sess-new",
        account_type: "new",
        email: null,
        is_llc_client: false,
        expires_at: new Date(Date.now() + 86400000).toISOString(),
      },
      error: null,
    };

    const req = new Request("http://localhost/api/hub/signup/step2", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-signup-session-id": "sess-new",
      },
      body: JSON.stringify({
        first_name: "Jean",
        last_name: "Dupont",
        email: "invalid-email",
        password: "short",
      }),
    });
    const res = await POST(req as never);
    expect(res.status).toBe(400);
  });

  it("retourne 400 si body invalide (nouveau user: password manquant)", async () => {
    mockSessionResult = {
      data: {
        id: "sess-new",
        account_type: "new",
        email: null,
        is_llc_client: false,
        expires_at: new Date(Date.now() + 86400000).toISOString(),
      },
      error: null,
    };

    const req = new Request("http://localhost/api/hub/signup/step2", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-signup-session-id": "sess-new",
      },
      body: JSON.stringify({
        first_name: "Jean",
        last_name: "Dupont",
        email: "jean@example.com",
      }),
    });
    const res = await POST(req as never);
    expect(res.status).toBe(400);
  });

  it("retourne 400 si email déjà utilisé (nouveau user)", async () => {
    mockSessionResult = {
      data: {
        id: "sess-new",
        account_type: "new",
        email: null,
        is_llc_client: false,
        expires_at: new Date(Date.now() + 86400000).toISOString(),
      },
      error: null,
    };
    mockAuthListUsers.mockResolvedValue({
      data: { users: [{ email: "jean@example.com" }] },
      error: null,
    });

    const req = new Request("http://localhost/api/hub/signup/step2", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-signup-session-id": "sess-new",
      },
      body: JSON.stringify({
        first_name: "Jean",
        last_name: "Dupont",
        email: "jean@example.com",
        password: "Pass123!",
      }),
    });
    const res = await POST(req as never);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/déjà utilisé/);
  });

  it("nouveau user: 200, session mise à jour avec hashed_password", async () => {
    mockSessionResult = {
      data: {
        id: "sess-new",
        account_type: "new",
        email: null,
        is_llc_client: false,
        expires_at: new Date(Date.now() + 86400000).toISOString(),
      },
      error: null,
    };
    mockAuthListUsers.mockResolvedValue({
      data: { users: [] },
      error: null,
    });

    const req = new Request("http://localhost/api/hub/signup/step2", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-signup-session-id": "sess-new",
      },
      body: JSON.stringify({
        first_name: "Jean",
        last_name: "Dupont",
        email: "jean@example.com",
        password: "Pass123!",
        phone: "+33612345678",
      }),
    });
    const res = await POST(req as never);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.next_step).toBe("step3");

    expect(hashPassword).toHaveBeenCalledWith("Pass123!");
    expect(mockUpdateFn).toHaveBeenCalledWith(
      expect.objectContaining({
        first_name: "Jean",
        last_name: "Dupont",
        email: "jean@example.com",
        hashed_password: "$2b$10$mockedHash",
        phone: "+33612345678",
      })
    );
  });

  it("client LLC: 400 si email ne correspond pas à la session", async () => {
    mockSessionResult = {
      data: {
        id: "sess-llc",
        account_type: "existing_llc",
        email: "client@llc.com",
        is_llc_client: true,
        expires_at: new Date(Date.now() + 86400000).toISOString(),
      },
      error: null,
    };

    const req = new Request("http://localhost/api/hub/signup/step2", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-signup-session-id": "sess-llc",
      },
      body: JSON.stringify({
        first_name: "Jean",
        last_name: "Dupont",
        email: "autre@example.com",
      }),
    });
    const res = await POST(req as never);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/correspondre/);
    expect(mockUpdateFn).not.toHaveBeenCalled();
  });

  it("client LLC: 200, session mise à jour sans password", async () => {
    mockSessionResult = {
      data: {
        id: "sess-llc",
        account_type: "existing_llc",
        email: "client@llc.com",
        is_llc_client: true,
        expires_at: new Date(Date.now() + 86400000).toISOString(),
      },
      error: null,
    };

    const req = new Request("http://localhost/api/hub/signup/step2", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-signup-session-id": "sess-llc",
      },
      body: JSON.stringify({
        first_name: "Jean",
        last_name: "Dupont",
        email: "client@llc.com",
        phone: "+33612345678",
      }),
    });
    const res = await POST(req as never);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.next_step).toBe("step3");

    expect(hashPassword).not.toHaveBeenCalled();
    expect(mockUpdateFn).toHaveBeenCalledWith(
      expect.objectContaining({
        first_name: "Jean",
        last_name: "Dupont",
        email: "client@llc.com",
        phone: "+33612345678",
      })
    );
    const updatePayload = mockUpdateFn.mock.calls[0]?.[0];
    expect(updatePayload).not.toHaveProperty("hashed_password");
  });
});

describe("hub-signup step2 validation (schemas)", () => {
  describe("step2NewMemberSchema", () => {
    it("accepte un body valide avec prénom, nom, email, mot de passe fort, téléphone optionnel", () => {
      const result = step2NewMemberSchema.safeParse({
        first_name: "Jean",
        last_name: "Dupont",
        email: "jean@example.com",
        password: "Secret123",
        phone: "+33612345678",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.phone).toBe("+33612345678");
      }
    });

    it("accepte sans téléphone", () => {
      const result = step2NewMemberSchema.safeParse({
        first_name: "Jean",
        last_name: "Dupont",
        email: "jean@example.com",
        password: "Secret123",
      });
      expect(result.success).toBe(true);
    });

    it("refuse un mot de passe trop court", () => {
      const result = step2NewMemberSchema.safeParse({
        first_name: "Jean",
        last_name: "Dupont",
        email: "jean@example.com",
        password: "Abc12",
      });
      expect(result.success).toBe(false);
    });

    it("refuse un mot de passe sans chiffre", () => {
      const result = step2NewMemberSchema.safeParse({
        first_name: "Jean",
        last_name: "Dupont",
        email: "jean@example.com",
        password: "Abcdefgh",
      });
      expect(result.success).toBe(false);
    });

    it("refuse un mot de passe sans lettre", () => {
      const result = step2NewMemberSchema.safeParse({
        first_name: "Jean",
        last_name: "Dupont",
        email: "jean@example.com",
        password: "12345678",
      });
      expect(result.success).toBe(false);
    });

    it("refuse un email invalide", () => {
      const result = step2NewMemberSchema.safeParse({
        first_name: "Jean",
        last_name: "Dupont",
        email: "not-an-email",
        password: "Secret123",
      });
      expect(result.success).toBe(false);
    });

    it("refuse un téléphone non E.164", () => {
      const result = step2NewMemberSchema.safeParse({
        first_name: "Jean",
        last_name: "Dupont",
        email: "jean@example.com",
        password: "Secret123",
        phone: "0612345678",
      });
      expect(result.success).toBe(false);
    });

    it("accepte téléphone E.164 valide", () => {
      const result = step2NewMemberSchema.safeParse({
        first_name: "Jean",
        last_name: "Dupont",
        email: "jean@example.com",
        password: "Secret123",
        phone: "+33612345678",
      });
      expect(result.success).toBe(true);
    });

    it("refuse prénom vide", () => {
      const result = step2NewMemberSchema.safeParse({
        first_name: "",
        last_name: "Dupont",
        email: "jean@example.com",
        password: "Secret123",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("step2LlcClientSchema", () => {
    it("accepte un body sans password (client LLC)", () => {
      const result = step2LlcClientSchema.safeParse({
        first_name: "Jean",
        last_name: "Dupont",
        email: "client@example.com",
        phone: "+33612345678",
      });
      expect(result.success).toBe(true);
    });

    it("refuse si prénom manquant", () => {
      const result = step2LlcClientSchema.safeParse({
        last_name: "Dupont",
        email: "client@example.com",
      });
      expect(result.success).toBe(false);
    });
  });
});
