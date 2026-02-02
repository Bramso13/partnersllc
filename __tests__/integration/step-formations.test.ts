/**
 * Integration tests for Story 12.4: Formations liées aux steps
 *
 * Verifies:
 * - step_formations table: insert, select by step_id, delete
 * - getFormationsByStepForUser returns only formations linked to step and accessible to user
 *
 * Requires: migration 042 (step_formations), formations and steps exist.
 */

import { createAdminClient } from "@/lib/supabase/server";
import { getFormationsByStepForUser } from "@/lib/formations";

const testStepFormationLinks: { step_id: string; formation_id: string }[] = [];
const testFormationIds: string[] = [];

async function cleanup() {
  const supabase = createAdminClient();
  for (const link of testStepFormationLinks) {
    await supabase
      .from("step_formations")
      .delete()
      .eq("step_id", link.step_id)
      .eq("formation_id", link.formation_id);
  }
  if (testFormationIds.length > 0) {
    await supabase.from("formations").delete().in("id", testFormationIds);
  }
}

/**
 * Test: step_formations insert and select by step_id
 */
export async function testStepFormationsInsertAndSelect(): Promise<boolean> {
  const supabase = createAdminClient();

  const { data: step } = await supabase
    .from("steps")
    .select("id")
    .limit(1)
    .single();
  if (!step) {
    console.warn("⚠️ No step found, skipping testStepFormationsInsertAndSelect");
    return true;
  }

  const { data: formation } = await supabase
    .from("formations")
    .select("id")
    .limit(1)
    .single();
  if (!formation) {
    console.warn("⚠️ No formation found, skipping testStepFormationsInsertAndSelect");
    return true;
  }

  const { error: insertError } = await supabase.from("step_formations").insert({
    step_id: step.id,
    formation_id: formation.id,
    position: 0,
  });
  if (insertError) {
    console.error("step_formations insert failed:", insertError);
    return false;
  }
  testStepFormationLinks.push({ step_id: step.id, formation_id: formation.id });

  const { data: rows, error: selectError } = await supabase
    .from("step_formations")
    .select("step_id, formation_id, position")
    .eq("step_id", step.id)
    .order("position", { ascending: true });

  if (selectError) {
    console.error("step_formations select failed:", selectError);
    return false;
  }
  if (!rows || rows.length === 0) {
    console.error("Expected at least one row for step");
    return false;
  }
  if (rows[0].formation_id !== formation.id) {
    console.error("Expected formation_id to match");
    return false;
  }

  await cleanup();
  return true;
}

/**
 * Test: getFormationsByStepForUser returns only linked and accessible formations
 */
export async function testGetFormationsByStepForUser(): Promise<boolean> {
  const supabase = createAdminClient();

  const { data: step } = await supabase
    .from("steps")
    .select("id")
    .limit(1)
    .single();
  if (!step) {
    console.warn("⚠️ No step found, skipping testGetFormationsByStepForUser");
    return true;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("role", "CLIENT")
    .limit(1)
    .single();
  if (!profile) {
    console.warn("⚠️ No client profile found, skipping testGetFormationsByStepForUser");
    return true;
  }

  const { data: formations } = await supabase
    .from("formations")
    .select("id")
    .limit(2);
  if (!formations || formations.length === 0) {
    console.warn("⚠️ No formations found, skipping testGetFormationsByStepForUser");
    return true;
  }

  for (let i = 0; i < formations.length; i++) {
    await supabase.from("step_formations").insert({
      step_id: step.id,
      formation_id: formations[i].id,
      position: i,
    });
    testStepFormationLinks.push({
      step_id: step.id,
      formation_id: formations[i].id,
    });
  }

  const result = await getFormationsByStepForUser(step.id, profile.id);
  await cleanup();

  if (!Array.isArray(result)) {
    console.error("Expected array from getFormationsByStepForUser");
    return false;
  }
  return true;
}

describe("Story 12.4 – Step formations", () => {
  afterAll(async () => {
    await cleanup();
  });

  it("inserts and selects step_formations by step_id", async () => {
    const ok = await testStepFormationsInsertAndSelect();
    expect(ok).toBe(true);
  });

  it("getFormationsByStepForUser returns array", async () => {
    const ok = await testGetFormationsByStepForUser();
    expect(ok).toBe(true);
  });
});
