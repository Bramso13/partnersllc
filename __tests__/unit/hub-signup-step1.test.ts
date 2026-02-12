/**
 * Unit tests: Hub signup step1
 * Story 14.5 - Validation Zod, réponses API
 */
import { describe, it, expect } from "vitest";
import { hubSignupStep1BodySchema } from "@/lib/validation/hub-signup-schemas";

describe("hubSignupStep1BodySchema", () => {
  it("accepte accountType='new' sans email", () => {
    const result = hubSignupStep1BodySchema.safeParse({ accountType: "new" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.accountType).toBe("new");
      expect(result.data.email).toBeUndefined();
    }
  });

  it("accepte accountType='new' avec email optionnel", () => {
    const result = hubSignupStep1BodySchema.safeParse({
      accountType: "new",
      email: "a@b.com",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.accountType).toBe("new");
      expect(result.data.email).toBe("a@b.com");
    }
  });

  it("accepte accountType='existing_llc' avec email valide", () => {
    const result = hubSignupStep1BodySchema.safeParse({
      accountType: "existing_llc",
      email: "client@partners.com",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.accountType).toBe("existing_llc");
      expect(result.data.email).toBe("client@partners.com");
    }
  });

  it("rejette accountType='existing_llc' sans email", () => {
    const result = hubSignupStep1BodySchema.safeParse({
      accountType: "existing_llc",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes("email"))).toBe(true);
    }
  });

  it("rejette accountType='existing_llc' avec email vide", () => {
    const result = hubSignupStep1BodySchema.safeParse({
      accountType: "existing_llc",
      email: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejette email invalide", () => {
    const result = hubSignupStep1BodySchema.safeParse({
      accountType: "existing_llc",
      email: "not-an-email",
    });
    expect(result.success).toBe(false);
  });

  it("rejette sans accountType", () => {
    const result = hubSignupStep1BodySchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("rejette accountType invalide", () => {
    const result = hubSignupStep1BodySchema.safeParse({
      accountType: "other",
      email: "a@b.com",
    });
    expect(result.success).toBe(false);
  });
});
