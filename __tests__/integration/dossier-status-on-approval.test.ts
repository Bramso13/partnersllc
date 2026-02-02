/**
 * Integration tests for Story 4.14: Statut dossier configurable à la validation d'une step
 *
 * Tests:
 * - Sauvegarde et rechargement du champ dossier_status_on_approval dans la config workflow
 * - Approbation d'une step avec statut configuré → le dossier passe au bon statut
 * - Approbation d'une step sans statut configuré → le statut du dossier ne change pas
 */

import { createAdminClient } from "@/lib/supabase/server";
import { isValidDossierStatus } from "@/lib/dossier-status";

const testIds: {
  productId?: string;
  stepId?: string;
  productStepId?: string;
  dossierId?: string;
  stepInstanceId?: string;
  profileId?: string;
} = {};

async function cleanup() {
  const supabase = createAdminClient();

  if (testIds.stepInstanceId) {
    await supabase
      .from("step_field_values")
      .delete()
      .eq("step_instance_id", testIds.stepInstanceId);
  }
  if (testIds.stepInstanceId) {
    await supabase
      .from("step_instances")
      .delete()
      .eq("id", testIds.stepInstanceId);
  }
  if (testIds.dossierId) {
    await supabase.from("dossiers").delete().eq("id", testIds.dossierId);
  }
  if (testIds.productStepId) {
    await supabase
      .from("product_steps")
      .delete()
      .eq("id", testIds.productStepId);
  }
  if (testIds.productId) {
    await supabase.from("products").delete().eq("id", testIds.productId);
  }
  if (testIds.stepId) {
    await supabase.from("steps").delete().eq("id", testIds.stepId);
  }
  if (testIds.profileId) {
    await supabase.from("profiles").delete().eq("id", testIds.profileId);
  }
}

describe("Story 4.14: Dossier status on step approval", () => {
  afterEach(async () => {
    await cleanup();
  });

  it("should persist and return dossier_status_on_approval in product_steps", async () => {
    const supabase = createAdminClient();

    // Get or create a product and step
    const { data: product } = await supabase
      .from("products")
      .select("id")
      .limit(1)
      .single();
    const { data: step } = await supabase
      .from("steps")
      .select("id")
      .limit(1)
      .single();

    if (!product || !step) {
      // Create minimal test data
      const { data: newProduct } = await supabase
        .from("products")
        .insert({
          code: `TEST_4_14_${Date.now()}`,
          name: "Test Product 4.14",
          dossier_type: "LLC",
          price_amount: 10000,
          currency: "USD",
          active: true,
        })
        .select("id")
        .single();

      const { data: newStep } = await supabase
        .from("steps")
        .insert({
          code: `TEST_STEP_${Date.now()}`,
          label: "Test Step",
          position: 0,
        })
        .select("id")
        .single();

      if (!newProduct || !newStep)
        throw new Error("Failed to create test data");
      testIds.productId = newProduct.id;
      testIds.stepId = newStep.id;
    } else {
      testIds.productId = product.id;
      testIds.stepId = step.id;
    }

    const { data: productStep, error: insertError } = await supabase
      .from("product_steps")
      .insert({
        product_id: testIds.productId!,
        step_id: testIds.stepId!,
        position: 0,
        is_required: true,
        dossier_status_on_approval: "COMPLETED",
      })
      .select()
      .single();

    if (insertError || !productStep) {
      throw new Error(`Failed to insert product_step: ${insertError?.message}`);
    }
    testIds.productStepId = productStep.id;

    expect(productStep.dossier_status_on_approval).toBe("COMPLETED");

    const { data: fetched } = await supabase
      .from("product_steps")
      .select("dossier_status_on_approval")
      .eq("id", productStep.id)
      .single();

    expect(fetched?.dossier_status_on_approval).toBe("COMPLETED");
  });

  it("should update dossier status when step has dossier_status_on_approval configured", async () => {
    const supabase = createAdminClient();

    const { data: product } = await supabase
      .from("products")
      .insert({
        code: `TEST_4_14_${Date.now()}`,
        name: "Test Product 4.14 Status",
        dossier_type: "LLC",
        price_amount: 10000,
        currency: "USD",
        active: true,
      })
      .select("id")
      .single();

    const { data: step } = await supabase
      .from("steps")
      .insert({
        code: `TEST_STEP_${Date.now()}`,
        label: "Test Step Status",
        position: 0,
      })
      .select("id")
      .single();

    if (!product || !step)
      throw new Error("Failed to create test product/step");
    testIds.productId = product.id;
    testIds.stepId = step.id;

    const { data: profile } = await supabase
      .from("profiles")
      .insert({
        full_name: "Test 4.14",
        email: `test_4_14_${Date.now()}@test.local`,
        role: "CLIENT",
        status: "ACTIVE",
      })
      .select("id")
      .single();

    if (!profile) throw new Error("Failed to create profile");
    testIds.profileId = profile.id;

    const { data: dossier } = await supabase
      .from("dossiers")
      .insert({
        user_id: profile.id,
        product_id: product.id,
        type: "LLC",
        status: "IN_PROGRESS",
      })
      .select("id")
      .single();

    if (!dossier) throw new Error("Failed to create dossier");
    testIds.dossierId = dossier.id;

    const { data: productStep } = await supabase
      .from("product_steps")
      .insert({
        product_id: product.id,
        step_id: step.id,
        position: 0,
        is_required: true,
        dossier_status_on_approval: "COMPLETED",
      })
      .select()
      .single();

    if (!productStep) throw new Error("Failed to create product_step");
    testIds.productStepId = productStep.id;

    const { data: stepInstance } = await supabase
      .from("step_instances")
      .insert({
        dossier_id: dossier.id,
        step_id: step.id,
        validation_status: "APPROVED",
        completed_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (!stepInstance) throw new Error("Failed to create step_instance");
    testIds.stepInstanceId = stepInstance.id;

    // Simulate approve route logic: get product_step and update dossier if configured
    const { data: productStepConfig } = await supabase
      .from("product_steps")
      .select("dossier_status_on_approval")
      .eq("product_id", product.id)
      .eq("step_id", step.id)
      .single();

    const newStatus = productStepConfig?.dossier_status_on_approval?.trim();
    if (newStatus && isValidDossierStatus(newStatus)) {
      await supabase
        .from("dossiers")
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", dossier.id);
    }

    const { data: updatedDossier } = await supabase
      .from("dossiers")
      .select("status")
      .eq("id", dossier.id)
      .single();

    expect(updatedDossier?.status).toBe("COMPLETED");
  });

  it("should NOT change dossier status when dossier_status_on_approval is null", async () => {
    const supabase = createAdminClient();

    const { data: product } = await supabase
      .from("products")
      .insert({
        code: `TEST_4_14_NO_${Date.now()}`,
        name: "Test Product 4.14 No Status",
        dossier_type: "LLC",
        price_amount: 10000,
        currency: "USD",
        active: true,
      })
      .select("id")
      .single();

    const { data: step } = await supabase
      .from("steps")
      .insert({
        code: `TEST_STEP_NO_${Date.now()}`,
        label: "Test Step No Status",
        position: 0,
      })
      .select("id")
      .single();

    if (!product || !step)
      throw new Error("Failed to create test product/step");
    testIds.productId = product.id;
    testIds.stepId = step.id;

    const { data: profile } = await supabase
      .from("profiles")
      .insert({
        full_name: "Test 4.14 No Status",
        email: `test_4_14_no_status_${Date.now()}@test.local`,
        role: "CLIENT",
        status: "ACTIVE",
      })
      .select("id")
      .single();

    if (!profile) throw new Error("Failed to create profile");
    testIds.profileId = profile.id;

    const { data: dossier } = await supabase
      .from("dossiers")
      .insert({
        user_id: profile.id,
        product_id: product.id,
        type: "LLC",
        status: "UNDER_REVIEW",
      })
      .select("id")
      .single();

    if (!dossier) throw new Error("Failed to create dossier");
    testIds.dossierId = dossier.id;

    const { data: productStep } = await supabase
      .from("product_steps")
      .insert({
        product_id: product.id,
        step_id: step.id,
        position: 0,
        is_required: true,
        dossier_status_on_approval: null,
      })
      .select()
      .single();

    if (!productStep) throw new Error("Failed to create product_step");
    testIds.productStepId = productStep.id;

    const { data: stepInstance } = await supabase
      .from("step_instances")
      .insert({
        dossier_id: dossier.id,
        step_id: step.id,
        validation_status: "APPROVED",
        completed_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (!stepInstance) throw new Error("Failed to create step_instance");
    testIds.stepInstanceId = stepInstance.id;

    const { data: productStepConfig } = await supabase
      .from("product_steps")
      .select("dossier_status_on_approval")
      .eq("product_id", product.id)
      .eq("step_id", step.id)
      .single();

    const newStatus = productStepConfig?.dossier_status_on_approval?.trim();
    if (newStatus && isValidDossierStatus(newStatus)) {
      await supabase
        .from("dossiers")
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", dossier.id);
    }

    const { data: updatedDossier } = await supabase
      .from("dossiers")
      .select("status")
      .eq("id", dossier.id)
      .single();

    expect(updatedDossier?.status).toBe("UNDER_REVIEW");
  });
});
