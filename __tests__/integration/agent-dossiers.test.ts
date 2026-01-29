import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";
import { createAdminClient } from "@/lib/supabase/server";
import {
  getAgentDossiers,
  getDossierAllData,
} from "@/lib/agent/dossiers";

describe("Agent Dossiers Integration Tests (with dossier_agent_assignments)", () => {
  let supabase: ReturnType<typeof createAdminClient>;
  let testAgentId: string;
  let testAgentEmail: string;
  let testDossierId: string;
  let testUserId: string;
  let testStepInstanceId: string;
  let testStepId: string;
  let testAssignmentId: string;

  beforeAll(async () => {
    supabase = createAdminClient();
    testAgentEmail = `test-agent-${Date.now()}@example.com`;

    // Create a test agent in agents table
    const { data: agentData, error: agentError } = await supabase
      .from("agents")
      .insert({
        email: testAgentEmail,
        agent_type: "VERIFICATEUR",
        active: true,
      })
      .select()
      .single();

    if (agentError) throw agentError;
    testAgentId = agentData.id;

    // Create a test user (client)
    const { data: userData, error: userError } = await supabase
      .from("profiles")
      .insert({
        email: `test-client-${Date.now()}@example.com`,
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
        code: `TEST_STEP_${Date.now()}`,
        label: "Test Step",
        position: 1,
        step_type: "CLIENT",
      })
      .select()
      .single();

    if (stepError) throw stepError;
    testStepId = stepData.id;

    // Create a test step_instance assigned to the agent
    const { data: stepInstanceData, error: stepInstanceError } = await supabase
      .from("step_instances")
      .insert({
        dossier_id: testDossierId,
        step_id: testStepId,
        assigned_to: testAgentId,
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (stepInstanceError) throw stepInstanceError;
    testStepInstanceId = stepInstanceData.id;

    // Create dossier_agent_assignment for dossier-level access
    const { data: assignmentData, error: assignmentError } = await supabase
      .from("dossier_agent_assignments")
      .insert({
        dossier_id: testDossierId,
        agent_id: testAgentId,
        assignment_type: "VERIFICATEUR",
      })
      .select()
      .single();

    if (assignmentError) throw assignmentError;
    testAssignmentId = assignmentData.id;
  });

  afterAll(async () => {
    // Clean up test data (in reverse order of creation)
    if (testAssignmentId) {
      await supabase
        .from("dossier_agent_assignments")
        .delete()
        .eq("id", testAssignmentId);
    }
    if (testStepInstanceId) {
      await supabase
        .from("step_instances")
        .delete()
        .eq("id", testStepInstanceId);
    }
    if (testDossierId) {
      await supabase.from("dossiers").delete().eq("id", testDossierId);
    }
    if (testStepId) {
      await supabase.from("steps").delete().eq("id", testStepId);
    }
    if (testUserId) {
      await supabase.from("profiles").delete().eq("id", testUserId);
    }
    if (testAgentId) {
      await supabase.from("agents").delete().eq("id", testAgentId);
    }
  });

  describe("getAgentDossiers", () => {
    it("should retrieve dossiers assigned to the agent via dossier_agent_assignments", async () => {
      const dossiers = await getAgentDossiers(testAgentId);

      expect(dossiers).toBeInstanceOf(Array);
      expect(dossiers.length).toBeGreaterThan(0);

      const testDossier = dossiers.find((d) => d.id === testDossierId);
      expect(testDossier).toBeDefined();
      expect(testDossier?.client_full_name).toBe("Test Client");
      expect(testDossier?.status).toBe("IN_PROGRESS");
      expect(testDossier?.type).toBe("LLC");
    });

    it("should return empty array for agent with no assigned dossiers", async () => {
      // Create another agent without dossier assignments
      const { data: unassignedAgent } = await supabase
        .from("agents")
        .insert({
          email: `unassigned-agent-${Date.now()}@example.com`,
          agent_type: "VERIFICATEUR",
          active: true,
        })
        .select()
        .single();

      const dossiers = await getAgentDossiers(unassignedAgent!.id);
      expect(dossiers).toBeInstanceOf(Array);
      expect(dossiers.length).toBe(0);

      // Clean up
      await supabase.from("agents").delete().eq("id", unassignedAgent!.id);
    });
  });

  describe("getDossierAllData", () => {
    it("should retrieve all dossier data for agent with dossier assignment", async () => {
      const data = await getDossierAllData(testDossierId, testAgentId);

      expect(data).toBeDefined();
      expect(data?.dossier.id).toBe(testDossierId);
      expect(data?.client.full_name).toBe("Test Client");
      expect(data?.client.phone).toBe("+1234567890");
      expect(data?.step_instances).toBeInstanceOf(Array);
      expect(data?.step_instances.length).toBeGreaterThan(0);
    });

    it("should throw error for agent without dossier assignment", async () => {
      // Create another agent without dossier assignment
      const { data: unauthorizedAgent } = await supabase
        .from("agents")
        .insert({
          email: `unauthorized-agent-${Date.now()}@example.com`,
          agent_type: "VERIFICATEUR",
          active: true,
        })
        .select()
        .single();

      await expect(
        getDossierAllData(testDossierId, unauthorizedAgent!.id)
      ).rejects.toThrow("Agent does not have access to this dossier");

      // Clean up
      await supabase.from("agents").delete().eq("id", unauthorizedAgent!.id);
    });

    it("should throw error for non-existent dossier", async () => {
      await expect(
        getDossierAllData("00000000-0000-0000-0000-000000000000", testAgentId)
      ).rejects.toThrow();
    });
  });

  describe("Dossier Agent Assignment API", () => {
    it("should allow admin to assign agent to dossier", async () => {
      // This would be a test for the PUT /api/admin/dossiers/[id]/dossier-agent-assignments endpoint
      // Left as a placeholder for API-level testing
      expect(testAssignmentId).toBeDefined();
    });

    it("should enforce unique constraint on (dossier_id, assignment_type)", async () => {
      // Try to create a duplicate assignment
      const { error } = await supabase
        .from("dossier_agent_assignments")
        .insert({
          dossier_id: testDossierId,
          agent_id: testAgentId,
          assignment_type: "VERIFICATEUR",
        });

      // Should fail due to unique constraint
      expect(error).toBeDefined();
      expect(error?.code).toBe("23505"); // PostgreSQL unique violation code
    });

    it("should allow both VERIFICATEUR and CREATEUR assignments for same dossier", async () => {
      // Create a CREATEUR agent
      const { data: createurAgent } = await supabase
        .from("agents")
        .insert({
          email: `createur-agent-${Date.now()}@example.com`,
          agent_type: "CREATEUR",
          active: true,
        })
        .select()
        .single();

      // Assign CREATEUR to the same dossier
      const { data: createurAssignment, error: createurError } = await supabase
        .from("dossier_agent_assignments")
        .insert({
          dossier_id: testDossierId,
          agent_id: createurAgent!.id,
          assignment_type: "CREATEUR",
        })
        .select()
        .single();

      // Should succeed
      expect(createurError).toBeNull();
      expect(createurAssignment).toBeDefined();

      // Clean up
      await supabase
        .from("dossier_agent_assignments")
        .delete()
        .eq("id", createurAssignment!.id);
      await supabase.from("agents").delete().eq("id", createurAgent!.id);
    });
  });
});
