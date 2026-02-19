import { test, expect } from "@playwright/test";

/**
 * Tests E2E PARTNERS Hub - Suggestions (Story 16.3).
 * Prérequis : utilisateur connecté avec abonnement Hub actif pour les parcours protégés.
 * En CI : utiliser des identifiants de test ou mocker l'auth.
 */

test.describe("Hub - Suggestions de connexions", () => {
  test("page Hub affiche le widget ou un état vide", async ({ page }) => {
    await page.goto("/dashboard/hub");
    await expect(page).toHaveURL(/\/dashboard\/hub/);
    await expect(
      page.getByRole("heading", { name: /PARTNERS Hub/i })
    ).toBeVisible();
    const suggestions = page.getByTestId("connection-suggestions");
    const skeleton = page.getByTestId("suggestion-skeleton");
    const viewMore = page.getByTestId("suggestions-view-more");
    await expect(suggestions.or(skeleton).first()).toBeVisible({ timeout: 10000 });
    if (await viewMore.isVisible()) {
      await expect(viewMore).toHaveAttribute("href", "/dashboard/hub/suggestions");
    }
  });

  test("page Suggestions affiche la liste ou un message", async ({ page }) => {
    await page.goto("/dashboard/hub/suggestions");
    await expect(page).toHaveURL(/\/dashboard\/hub\/suggestions/);
    await expect(
      page.getByRole("heading", { name: /Membres que vous pourriez connaître/i })
    ).toBeVisible();
    const section = page.getByTestId("connection-suggestions");
    await expect(section).toBeVisible({ timeout: 10000 });
  });

  test("clic sur un membre suggéré ouvre la page profil", async ({ page }) => {
    await page.goto("/dashboard/hub/suggestions");
    await expect(page).toHaveURL(/\/dashboard\/hub\/suggestions/);
    const section = page.getByTestId("connection-suggestions");
    await expect(section).toBeVisible({ timeout: 10000 });
    const firstCard = page.getByTestId(/^suggestion-card-/).first();
    const count = await page.getByTestId(/^suggestion-card-/).count();
    if (count > 0) {
      await firstCard.click();
      await expect(page).toHaveURL(/\/dashboard\/hub\/members\/[a-f0-9-]+/);
      await expect(page.getByText(/Profil membre|user_id:/i)).toBeVisible();
    }
  });
});

test.describe("Hub - Parcours recherche (Story 16.2)", () => {
  test.skip("recherche par pays France → résultats → clic membre → profil ouvert", async () => {
    await test.info().annotate("skip", "Route /dashboard/hub/search à implémenter (Story 16.2)");
  });

  test.skip("recherche texte avocat → résultats pertinents", async () => {
    await test.info().annotate("skip", "Route /dashboard/hub/search à implémenter (Story 16.2)");
  });
});

test.describe("Hub - Parcours profil (Story 16.1)", () => {
  test.skip("connexion Hub → édition profil → upload avatar → sauvegarde → profil public mis à jour", async () => {
    await test.info().annotate("skip", "Pages /dashboard/hub/profile/edit et API à implémenter (Story 16.1)");
  });
});
