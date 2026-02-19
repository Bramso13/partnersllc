/**
 * Tests unitaires GET /api/hub/members/[userId] et POST /api/hub/profile/update (Story 16.1)
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "@/app/api/hub/members/[userId]/route";
import { POST } from "@/app/api/hub/profile/update/route";

vi.mock("@/lib/hub-auth", () => ({
  requireHubAuth: vi.fn(() => Promise.resolve({ userId: "user-123" })),
}));

vi.mock("@/lib/supabase/server", () => ({
  createAdminClient: vi.fn(),
  createClient: vi.fn(),
}));

vi.mock("@/lib/profile-cache", () => ({
  profileCache: {
    key: (id: string) => `hub:member:profile:${id}`,
    get: vi.fn(() => null),
    set: vi.fn(),
    del: vi.fn(),
  },
}));

vi.mock("isomorphic-dompurify", () => ({
  default: { sanitize: (s: string) => s },
}));

import { createAdminClient } from "@/lib/supabase/server";
import { createClient } from "@/lib/supabase/server";


describe("GET /api/hub/members/[userId]", () => {
  let fromCalls: string[] = [];

  beforeEach(() => {
    vi.clearAllMocks();
    fromCalls = [];
    (createAdminClient as ReturnType<typeof vi.fn>).mockImplementation(() => ({
      from: (table: string) => {
        fromCalls.push(table);
        if (table === "hub_subscriptions") {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  maybeSingle: () =>
                    Promise.resolve(
                      fromCalls.length > 0
                        ? { data: { id: "sub-1" } }
                        : { data: null }
                    ),
                }),
              }),
            }),
          };
        }
        const profileRow = {
          id: "prof-1",
          user_id: "target-user",
          display_name: "Alice",
          profession: "Consultante",
          country: "FR",
          bio: "Bio",
          avatar_url: null,
          expertise_tags: ["fiscalité"],
          languages: [{ code: "fr", level: "natif" }],
          years_experience: 5,
          website: null,
          linkedin_url: null,
          twitter_handle: null,
          is_llc_client: false,
          created_at: "2025-01-01T00:00:00Z",
          updated_at: "2025-01-01T00:00:00Z",
        };
        return {
          select: () => ({
            eq: () => ({
              single: () => Promise.resolve({ data: profileRow, error: null }),
            }),
          }),
        };
      },
    }));
  });

  it("retourne 400 si userId manquant", async () => {
    const res = await GET(
      new Request("http://localhost/api/hub/members/") as never,
      { params: Promise.resolve({ userId: "" }) }
    );
    expect(res.status).toBe(400);
  });

  it("retourne 404 si le membre n'a pas d'abonnement actif", async () => {
    (createAdminClient as ReturnType<typeof vi.fn>).mockImplementation(() => ({
      from: (table: string) => {
        if (table === "hub_subscriptions") {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  maybeSingle: () => Promise.resolve({ data: null }),
                }),
              }),
            }),
          };
        }
        return {
          select: () => ({
            eq: () => ({
              single: () =>
                Promise.resolve({ data: null, error: { message: "Not found" } }),
            }),
          }),
        };
      },
    }));
    const res = await GET(
      new Request("http://localhost/api/hub/members/target-user") as never,
      { params: Promise.resolve({ userId: "target-user" }) }
    );
    expect(res.status).toBe(404);
  });

  it("retourne 200 et le profil si abonnement actif et profil trouvé", async () => {
    const res = await GET(
      new Request("http://localhost/api/hub/members/target-user") as never,
      { params: Promise.resolve({ userId: "target-user" }) }
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.display_name).toBe("Alice");
    expect(json.user_id).toBe("target-user");
  });
});

describe("POST /api/hub/profile/update", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (createClient as ReturnType<typeof vi.fn>).mockImplementation(() =>
      Promise.resolve({
        from: () => ({
          update: () => ({
            eq: () => Promise.resolve({ error: null }),
          }),
        }),
      })
    );
  });

  it("retourne 400 si body JSON invalide", async () => {
    const req = new Request("http://localhost/api/hub/profile/update", {
      method: "POST",
      body: "invalid",
    });
    const res = await POST(req as never);
    expect(res.status).toBe(400);
  });

  it("retourne 400 si validation échoue (years_experience négatif)", async () => {
    const req = new Request("http://localhost/api/hub/profile/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        years_experience: -1,
      }),
    });
    const res = await POST(req as never);
    expect(res.status).toBe(400);
  });

  it("retourne 200 et success si payload valide", async () => {
    const req = new Request("http://localhost/api/hub/profile/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        display_name: "Bob",
        profession: "Avocat",
        country: "FR",
        bio: "Ma bio",
        expertise_tags: ["droit"],
        years_experience: 10,
      }),
    });
    const res = await POST(req as never);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
  });
});
