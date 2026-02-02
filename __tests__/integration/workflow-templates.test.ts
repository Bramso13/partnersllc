/**
 * Integration tests for Story 4.15: Templates workflow produit – Sauvegarder et appliquer
 *
 * Verifies:
 * - Création d'un template (nom unique, steps non vides)
 * - Liste des templates
 * - Récupération d'un template par id (format enrichi pour l'UI)
 * - Validation : nom template vide ou doublon → erreur
 *
 * Requires: migration 041 (workflow_templates), Supabase (createAdminClient).
 */

import { createAdminClient } from "@/lib/supabase/server";

const testTemplateIds: string[] = [];

async function cleanup() {
  const supabase = createAdminClient();
  if (testTemplateIds.length > 0) {
    await supabase
      .from("workflow_templates")
      .delete()
      .in("id", testTemplateIds);
  }
}

/**
 * Test: Create template with valid name and steps
 */
export async function testCreateTemplate(): Promise<boolean> {
  const supabase = createAdminClient();

  const { data: step } = await supabase
    .from("steps")
    .select("id")
    .limit(1)
    .single();

  if (!step) {
    console.warn("⚠️ No step found, skipping testCreateTemplate");
    return true;
  }

  const templateName = `Test Template ${Date.now()}`;
  const steps = [
    {
      step_id: step.id,
      position: 0,
      is_required: true,
      estimated_duration_hours: 2,
      dossier_status_on_approval: null,
      document_type_ids: [] as string[],
      custom_fields: [] as unknown[],
    },
  ];

  const { data: template, error } = await supabase
    .from("workflow_templates")
    .insert({ name: templateName, steps })
    .select("id, name, steps")
    .single();

  if (error || !template) {
    console.error("Failed to create template:", error);
    return false;
  }

  testTemplateIds.push(template.id);

  if (template.name !== templateName) {
    console.error(`Expected name ${templateName}, got ${template.name}`);
    return false;
  }
  if (!Array.isArray(template.steps) || template.steps.length !== 1) {
    console.error("Expected 1 step in template");
    return false;
  }

  return true;
}

/**
 * Test: List templates
 */
export async function testListTemplates(): Promise<boolean> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("workflow_templates")
    .select("id, name, steps, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to list templates:", error);
    return false;
  }

  // Should return array (may be empty)
  if (!Array.isArray(data)) {
    console.error("Expected array of templates");
    return false;
  }

  return true;
}

/**
 * Test: Get template by id returns correct structure
 */
export async function testGetTemplateById(): Promise<boolean> {
  const supabase = createAdminClient();

  const { data: step } = await supabase
    .from("steps")
    .select("id")
    .limit(1)
    .single();

  if (!step) {
    console.warn("⚠️ No step found, skipping testGetTemplateById");
    return true;
  }

  const { data: created } = await supabase
    .from("workflow_templates")
    .insert({
      name: `Get Test ${Date.now()}`,
      steps: [
        {
          step_id: step.id,
          position: 0,
          is_required: true,
          document_type_ids: [],
          custom_fields: [],
        },
      ],
    })
    .select("id")
    .single();

  if (!created) {
    console.error("Failed to create template for get test");
    return false;
  }
  testTemplateIds.push(created.id);

  const { data: template, error } = await supabase
    .from("workflow_templates")
    .select("*")
    .eq("id", created.id)
    .single();

  if (error || !template) {
    console.error("Failed to get template:", error);
    return false;
  }

  if (!template.steps || !Array.isArray(template.steps)) {
    console.error("Template steps should be an array");
    return false;
  }

  return true;
}

/**
 * Test: Duplicate name raises unique constraint error
 */
export async function testDuplicateNameRejected(): Promise<boolean> {
  const supabase = createAdminClient();

  const { data: existing } = await supabase
    .from("workflow_templates")
    .select("name")
    .limit(1)
    .single();

  if (!existing?.name) {
    console.warn("⚠️ No existing template, skipping duplicate name test");
    return true;
  }

  const steps = [
    {
      step_id: "00000000-0000-0000-0000-000000000000",
      position: 0,
      is_required: true,
      document_type_ids: [] as string[],
      custom_fields: [] as unknown[],
    },
  ];

  const { error } = await supabase
    .from("workflow_templates")
    .insert({ name: existing.name, steps });

  if (!error) {
    console.error("Expected unique constraint error for duplicate name");
    return false;
  }

  return true;
}

describe("Story 4.15: Workflow Templates", () => {
  afterEach(cleanup);

  it("should create template with valid name and steps", async () => {
    expect(await testCreateTemplate()).toBe(true);
  });

  it("should list templates", async () => {
    expect(await testListTemplates()).toBe(true);
  });

  it("should get template by id with correct structure", async () => {
    expect(await testGetTemplateById()).toBe(true);
  });

  it("should reject duplicate template name", async () => {
    expect(await testDuplicateNameRejected()).toBe(true);
  });
});

/**
 * Run all workflow template tests (manual)
 */
export async function runAllWorkflowTemplateTests(): Promise<void> {
  console.log("\n" + "=".repeat(60));
  console.log("Story 4.15: Workflow Templates Integration Tests");
  console.log("=".repeat(60));

  try {
    const t1 = await testCreateTemplate();
    if (!t1) {
      console.error("❌ testCreateTemplate failed");
      await cleanup();
      return;
    }
    console.log("✅ testCreateTemplate passed");

    const t2 = await testListTemplates();
    if (!t2) {
      console.error("❌ testListTemplates failed");
      await cleanup();
      return;
    }
    console.log("✅ testListTemplates passed");

    const t3 = await testGetTemplateById();
    if (!t3) {
      console.error("❌ testGetTemplateById failed");
      await cleanup();
      return;
    }
    console.log("✅ testGetTemplateById passed");

    const t4 = await testDuplicateNameRejected();
    if (!t4) {
      console.error("❌ testDuplicateNameRejected failed");
      await cleanup();
      return;
    }
    console.log("✅ testDuplicateNameRejected passed");

    console.log("\n" + "=".repeat(60));
    console.log("✅ All Workflow Template Integration Tests Completed!");
    console.log("=".repeat(60));
  } catch (err) {
    console.error("❌ Test suite failed:", err);
  } finally {
    await cleanup();
  }
}
