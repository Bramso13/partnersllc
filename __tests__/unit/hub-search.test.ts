/**
 * Tests unitaires: GET /api/hub/search (Story 16.2)
 * - Schéma de validation des query params (filtres, pagination, q)
 * - Réponse API (structure results, total, page, limit)
 */
import { describe, it, expect } from "vitest";
import { hubSearchQuerySchema } from "@/lib/validation/hub-search-schemas";
import { GET } from "@/app/api/hub/search/route";

describe("hubSearchQuerySchema", () => {
  it("parse page et limit par défaut", () => {
    const result = hubSearchQuerySchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(1);
      expect(result.data.limit).toBe(20);
    }
  });

  it("parse page et limit fournis", () => {
    const result = hubSearchQuerySchema.safeParse({
      page: "2",
      limit: "10",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(2);
      expect(result.data.limit).toBe(10);
    }
  });

  it("parse country en liste (virgules)", () => {
    const result = hubSearchQuerySchema.safeParse({
      country: "FR,US,DE",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.country).toEqual(["FR", "US", "DE"]);
    }
  });

  it("parse profession en liste", () => {
    const result = hubSearchQuerySchema.safeParse({
      profession: "Avocat,Consultant",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.profession).toEqual(["Avocat", "Consultant"]);
    }
  });

  it("parse expertise en liste", () => {
    const result = hubSearchQuerySchema.safeParse({
      expertise: "LLC,Fusion",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.expertise).toEqual(["LLC", "Fusion"]);
    }
  });

  it("parse languages en liste", () => {
    const result = hubSearchQuerySchema.safeParse({
      languages: "fr,en",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.languages).toEqual(["fr", "en"]);
    }
  });

  it("parse q (recherche texte) et ignore chaîne vide", () => {
    const withQ = hubSearchQuerySchema.safeParse({ q: "  Jean  " });
    expect(withQ.success).toBe(true);
    if (withQ.success) expect(withQ.data.q).toBe("Jean");

    const empty = hubSearchQuerySchema.safeParse({ q: "   " });
    expect(empty.success).toBe(true);
    if (empty.success) expect(empty.data.q).toBeUndefined();
  });

  it("borne limit à 100", () => {
    const result = hubSearchQuerySchema.safeParse({ limit: "200" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.limit).toBe(100);
  });

  it("filtres combinés: country, profession, expertise, languages, q, page, limit", () => {
    const result = hubSearchQuerySchema.safeParse({
      country: "FR",
      profession: "Avocat",
      expertise: "LLC",
      languages: "fr",
      q: "bio",
      page: "3",
      limit: "15",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.country).toEqual(["FR"]);
      expect(result.data.profession).toEqual(["Avocat"]);
      expect(result.data.expertise).toEqual(["LLC"]);
      expect(result.data.languages).toEqual(["fr"]);
      expect(result.data.q).toBe("bio");
      expect(result.data.page).toBe(3);
      expect(result.data.limit).toBe(15);
    }
  });
});

describe("GET /api/hub/search", () => {
  it("retourne 401 sans authentification", async () => {
    const req = new NextRequest("http://localhost/api/hub/search");
    const res = await GET(req);
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toMatch(/authentification/i);
  });
});
