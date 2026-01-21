import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";
import { createAdminClient } from "@/lib/supabase/server";
import {
  getAgentDossiers,
  getDossierAllData,
} from "@/lib/agent/dossiers";

describe("Agent Dossiers Integration Tests", () => {
  let supabase: Awaited<ReturnType<typeof createAdminClient>>;
  let testAgentEmail: string;
  let testDossierId: string;
  let testUserId: string;
  let testStepInstanceId: string;

  beforeAll(async () => {
    supabase = await createAdminClient();
    testAgentEmail = "test-agent@example.com";

    // Create a test user (client)
    const { data: userData, error: userError } = await supabase
      .from("profiles")
      .insert({
        email: "test-client@example.com",
        full_name: "Test Client",
        phone: "+1234567890",
      })
      .select()
      .single();

    if (userError) throw userError;
    testUserId = userData.id;

    // Create a test dossier
    const { data: dossierData, error: dossierError } = await supabase
      .from("dossiers")
      .insert({
        user_id: testUserId,
        type: "LLC",
        status: "IN_PROGRESS",
      })
      .select()
      .single();

    if (dossierError) throw dossierError;
    testDossierId = dossierData.id;

    // Create a test step
    const { data: stepData, error: stepError } = await supabase
      .from("steps")
      .insert({
        code: "TEST_STEP",
        label: "Test Step",
        position: 1,
      })
      .select()
      .single();

    if (stepError) throw stepError;

    // Create a test step_instance assigned to the agent
    const { data: stepInstanceData, error: stepInstanceError } = await supabase
      .from("step_instances")
      .insert({
        dossier_id: testDossierId,
        step_id: stepData.id,
        assigned_to: testAgentEmail,
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (stepInstanceError) throw stepInstanceError;
    testStepInstanceId = stepInstanceData.id;
  });

  afterAll(async () => {
    // Clean up test data
    if (testStepInstanceId) {
      await supabase
        .from("step_instances")
        .delete()
        .eq("id", testStepInstanceId);
    }
    if (testDossierId) {
      await supabase.from("dossiers").delete().eq("id", testDossierId);
    }
    if (testUserId) {
      await supabase.from("profiles").delete().eq("id", testUserId);
    }
  });

  describe("getAgentDossiers", () => {
    it("should retrieve dossiers assigned to the agent", async () => {
      const dossiers = await getAgentDossiers(testAgentEmail);

      expect(dossiers).toBeInstanceOf(Array);
      expect(dossiers.length).toBeGreaterThan(0);

      const testDossier = dossiers.find((d) => d.id === testDossierId);
      expect(testDossier).toBeDefined();
      expect(testDossier?.client_full_name).toBe("Test Client");
      expect(testDossier?.status).toBe("IN_PROGRESS");
      expect(testDossier?.type).toBe("LLC");
    });

    it("should return empty array for agent with no assigned dossiers", async () => {
      const dossiers = await getAgentDossiers("nonexistent@example.com");
      expect(dossiers).toBeInstanceOf(Array);
      expect(dossiers.length).toBe(0);
    });
  });

  describe("getDossierAllData", () => {
    it("should retrieve all dossier data for agent with access", async () => {
      const data = await getDossierAllData(testDossierId, testAgentEmail);

      expect(data).toBeDefined();
      expect(data?.dossier.id).toBe(testDossierId);
      expect(data?.client.full_name).toBe("Test Client");
      expect(data?.client.email).toBe("test-client@example.com");
      expect(data?.client.phone).toBe("+1234567890");
      expect(data?.step_instances).toBeInstanceOf(Array);
      expect(data?.step_instances.length).toBeGreaterThan(0);
    });

    it("should throw error for agent without access", async () => {
      await expect(
        getDossierAllData(testDossierId, "unauthorized@example.com")
      ).rejects.toThrow("Agent does not have access to this dossier");
    });

    it("should throw error for non-existent dossier", async () => {
      await expect(
        getDossierAllData("00000000-0000-0000-0000-000000000000", testAgentEmail)
      ).rejects.toThrow();
    });

    it("should include step fields when present", async () => {
      // Get the step_id for the test step_instance
      const { data: stepInstanceData } = await supabase
        .from("step_instances")
        .select("step_id")
        .eq("id", testStepInstanceId)
        .single();

      if (!stepInstanceData) {
        throw new Error("Step instance not found");
      }

      // Add a test field to the step_instance
      const { data: stepFieldData } = await supabase
        .from("step_fields")
        .insert({
          step_id: stepInstanceData.step_id,
          key: "test_field",
          label: "Test Field",
          field_type: "TEXT",
          position: 1,
        })
        .select()
        .single();

      const { data: fieldValueData } = await supabase
        .from("step_field_values")
        .insert({
          step_instance_id: testStepInstanceId,
          field_id: stepFieldData.id,
          field_key: "test_field",
          value: "Test Value",
        })
        .select()
        .single();

      const data = await getDossierAllData(testDossierId, testAgentEmail);

      const stepInstance = data?.step_instances.find(
        (si) => si.id === testStepInstanceId
      );
      expect(stepInstance?.fields).toBeInstanceOf(Array);
      expect(stepInstance?.fields.length).toBeGreaterThan(0);
      expect(stepInstance?.fields[0].field_key).toBe("test_field");
      expect(stepInstance?.fields[0].value).toBe("Test Value");

      // Clean up
      await supabase
        .from("step_field_values")
        .delete()
        .eq("id", fieldValueData.id);
      await supabase.from("step_fields").delete().eq("id", stepFieldData.id);
    });

    it("should include documents when present", async () => {
      // Add a test document
      const { data: documentTypeData } = await supabase
        .from("document_types")
        .insert({
          code: "TEST_DOC",
          label: "Test Document",
        })
        .select()
        .single();

      const { data: documentData } = await supabase
        .from("documents")
        .insert({
          step_instance_id: testStepInstanceId,
          document_type_id: documentTypeData.id,
          status: "APPROVED",
          file_name: "test.pdf",
          uploaded_at: new Date().toISOString(),
        })
        .select()
        .single();

      const data = await getDossierAllData(testDossierId, testAgentEmail);

      const stepInstance = data?.step_instances.find(
        (si) => si.id === testStepInstanceId
      );
      expect(stepInstance?.documents).toBeInstanceOf(Array);
      expect(stepInstance?.documents.length).toBeGreaterThan(0);
      expect(stepInstance?.documents[0].document_type).toBe("Test Document");
      expect(stepInstance?.documents[0].status).toBe("APPROVED");
      expect(stepInstance?.documents[0].file_name).toBe("test.pdf");

      // Clean up
      await supabase.from("documents").delete().eq("id", documentData.id);
      await supabase
        .from("document_types")
        .delete()
        .eq("id", documentTypeData.id);
    });
  });
});
