import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/hub/auth", () => ({
  getHubMemberOrNull: vi.fn(),
}));
vi.mock("@/lib/hub/members-by-country", () => ({
  getMembersByCountry: vi.fn(),
}));

const mockUser = { id: "user-1", email: "hub@example.com" };

const samplePayload = [
  {
    country: "FR",
    count: 2,
    members: [
      { id: "id-1", display_name: "Alice", profession: "Avocat" },
      { id: "id-2", display_name: "Bob", profession: "Consultant" },
    ],
  },
  {
    country: "US",
    count: 1,
    members: [{ id: "id-3", display_name: "Carol", profession: null }],
  },
];

describe("GET /api/hub/map/members-by-country", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retourne 401 sans authentification Hub (pas de token / pas membre)", async () => {
    const { getHubMemberOrNull } = await import("@/lib/hub/auth");
    vi.mocked(getHubMemberOrNull).mockResolvedValueOnce(null);

    const { GET } = await import("@/app/api/hub/map/members-by-country/route");
    const res = await GET();

    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toBe("Unauthorized");
  });

  it("retourne 200 avec token Hub et payload JSON valide", async () => {
    const { getHubMemberOrNull } = await import("@/lib/hub/auth");
    const { getMembersByCountry } = await import(
      "@/lib/hub/members-by-country"
    );
    vi.mocked(getHubMemberOrNull).mockResolvedValueOnce(mockUser as never);
    vi.mocked(getMembersByCountry).mockResolvedValueOnce(samplePayload);

    const { GET } = await import("@/app/api/hub/map/members-by-country/route");
    const res = await GET();

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data).toHaveLength(2);

    const fr = data.find((r: { country: string }) => r.country === "FR");
    expect(fr).toBeDefined();
    expect(fr.count).toBe(2);
    expect(fr.members).toHaveLength(2);
    expect(fr.members[0]).toEqual({
      id: "id-1",
      display_name: "Alice",
      profession: "Avocat",
    });
    expect(fr.members[1]).toEqual({
      id: "id-2",
      display_name: "Bob",
      profession: "Consultant",
    });

    const us = data.find((r: { country: string }) => r.country === "US");
    expect(us).toBeDefined();
    expect(us.count).toBe(1);
    expect(us.members[0].profession).toBeNull();
  });

  it("retourne uniquement des membres actifs (source getMembersByCountry = RPC filtre subscription active)", async () => {
    const { getHubMemberOrNull } = await import("@/lib/hub/auth");
    const { getMembersByCountry } = await import(
      "@/lib/hub/members-by-country"
    );
    vi.mocked(getHubMemberOrNull).mockResolvedValueOnce(mockUser as never);
    vi.mocked(getMembersByCountry).mockResolvedValueOnce(samplePayload);

    const { GET } = await import("@/app/api/hub/map/members-by-country/route");
    const res = await GET();
    expect(res.status).toBe(200);
    expect(getMembersByCountry).toHaveBeenCalledTimes(1);
    // getMembersByCountry s'appuie sur la RPC get_hub_members_by_country qui
    // filtre sur hub_subscriptions.status = 'active' → seuls les membres actifs sont retournés
  });

  it("retourne 500 si getMembersByCountry lance une erreur", async () => {
    const { getHubMemberOrNull } = await import("@/lib/hub/auth");
    const { getMembersByCountry } = await import(
      "@/lib/hub/members-by-country"
    );
    vi.mocked(getHubMemberOrNull).mockResolvedValueOnce(mockUser as never);
    vi.mocked(getMembersByCountry).mockRejectedValueOnce(
      new Error("DB error")
    );

    const { GET } = await import("@/app/api/hub/map/members-by-country/route");
    const res = await GET();

    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toContain("DB error");
  });
});
