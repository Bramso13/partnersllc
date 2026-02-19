import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "@/app/api/hub/suggestions/route";

const mockUser = {
  id: "user-me",
  email: "me@example.com",
} as unknown as { id: string; email: string };

const mockProfile = {
  id: "profile-me",
  user_id: "user-me",
  display_name: "Moi",
  country: "FR",
  profession: "Avocat",
  bio: "Bio courte",
  is_llc_client: false,
};

const mockOtherProfiles = [
  {
    id: "profile-1",
    user_id: "user-1",
    display_name: "Alice",
    profession: "Avocat",
    country: "FR",
    bio: "Avocate à Paris.",
  },
  {
    id: "profile-2",
    user_id: "user-2",
    display_name: "Bob",
    profession: "Consultant",
    country: "FR",
    bio: null,
  },
];

vi.mock("@/lib/hub/auth", () => ({
  getHubMemberOrNull: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("@/lib/hub/cache", () => ({
  cacheGet: vi.fn(),
  cacheSet: vi.fn(),
  HUB_CACHE_KEYS: { suggestions: (uid: string) => `hub:suggestions:${uid}` },
}));

import { getHubMemberOrNull } from "@/lib/hub/auth";
import { createClient } from "@/lib/supabase/server";
import { cacheGet, cacheSet } from "@/lib/hub/cache";

describe("GET /api/hub/suggestions", () => {
  beforeEach(() => {
    vi.mocked(cacheGet).mockReturnValue(undefined);
    vi.mocked(createClient).mockResolvedValue({
      from: vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        neq: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: mockOtherProfiles, error: null }),
      })),
    } as unknown as Awaited<ReturnType<typeof createClient>>);
  });

  it("retourne 401 si non authentifié Hub", async () => {
    vi.mocked(getHubMemberOrNull).mockResolvedValue(null);

    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.error).toContain("Authentification Hub requise");
    expect(cacheGet).not.toHaveBeenCalled();
  });

  it("retourne les résultats du cache si présents", async () => {
    vi.mocked(getHubMemberOrNull).mockResolvedValue({
      user: mockUser as never,
      profile: mockProfile as never,
    });
    const cached = [
      { id: "p1", user_id: "u1", display_name: "Cached", profession: null, country: "FR", bio_snippet: null, avatar_url: null },
    ];
    vi.mocked(cacheGet).mockReturnValue(cached);

    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.results).toEqual(cached);
    expect(createClient).not.toHaveBeenCalled();
  });

  it("retourne des suggestions (pays ou métier), sans duplication de soi", async () => {
    vi.mocked(getHubMemberOrNull).mockResolvedValue({
      user: mockUser as never,
      profile: mockProfile as never,
    });
    const fromMock = vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      neq: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: mockOtherProfiles, error: null }),
    }));
    vi.mocked(createClient).mockResolvedValue({ from: fromMock } as never);

    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(Array.isArray(data.results)).toBe(true);
    expect(data.results.length).toBeLessThanOrEqual(10);
    const userIds = data.results.map((r: { user_id: string }) => r.user_id);
    expect(userIds).not.toContain("user-me");
    expect(data.results[0]).toMatchObject({
      display_name: expect.any(String),
      profession: expect.anything(),
      country: expect.anything(),
      bio_snippet: expect.anything(),
      avatar_url: null,
    });
    expect(cacheSet).toHaveBeenCalledWith(
      "hub:suggestions:user-me",
      expect.any(Array),
      expect.any(Number)
    );
  });

  it("retourne tableau vide si pas de country ni profession", async () => {
    vi.mocked(getHubMemberOrNull).mockResolvedValue({
      user: mockUser as never,
      profile: { ...mockProfile, country: null, profession: null } as never,
    });

    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.results).toEqual([]);
    expect(createClient).not.toHaveBeenCalled();
    expect(cacheSet).toHaveBeenCalledWith("hub:suggestions:user-me", [], expect.any(Number));
  });

  it("retourne 500 si erreur Supabase", async () => {
    vi.mocked(getHubMemberOrNull).mockResolvedValue({
      user: mockUser as never,
      profile: mockProfile as never,
    });
    vi.mocked(createClient).mockResolvedValue({
      from: vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        neq: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: null, error: { message: "DB error" } }),
      })),
    } as never);

    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.error).toBeDefined();
  });
});
