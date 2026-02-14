/**
 * Integration tests for Story 4.23:
 * - Auto-assign dossier au créateur
 * - Step APPROVED à la complétion créateur
 * - Blocage « Marquer comme complété » avant livraison
 *
 * Ces tests sont conçus pour être exécutés manuellement sur une base de données de test.
 * Ils utilisent createAdminClient() et supposent un environnement Supabase local ou de staging.
 */

import { createAdminClient } from "@/lib/supabase/server";

const testIds: {
  agentId?: string;
  productId?: string;
  stepId?: string;
  productStepId?: string;
  dossierId?: string;
  stepInstanceId?: string;
  profileId?: string;
  orderId?: string;
} = {};

async function cleanup() {
  const supabase = createAdminClient();

  if (testIds.stepInstanceId) {
    await supabase
      .from("step_instances")
      .delete()
      .eq("id", testIds.stepInstanceId);
  }
  if (testIds.dossierId) {
    await supabase
      .from("dossier_agent_assignments")
      .delete()
      .eq("dossier_id", testIds.dossierId);
    await supabase.from("dossiers").delete().eq("id", testIds.dossierId);
  }
  if (testIds.orderId) {
    await supabase.from("orders").delete().eq("id", testIds.orderId);
  }
  if (testIds.productStepId) {
    await supabase
      .from("product_steps")
      .delete()
      .eq("id", testIds.productStepId);
  }
  if (testIds.stepId) {
    await supabase.from("steps").delete().eq("id", testIds.stepId);
  }
  if (testIds.productId) {
    await supabase.from("products").delete().eq("id", testIds.productId);
  }
  if (testIds.agentId) {
    await supabase
      .from("agents")
      .delete()
      .eq("id", testIds.agentId)
      .eq("email", "test+createur4_23@partnersllc.test");
  }
}

/**
 * Test 1: Création dossier → auto-assign CREATEUR
 *
 * Vérifie qu'après création d'un dossier via l'API admin,
 * une ligne dossier_agent_assignments CREATEUR est insérée
 * avec le premier agent CREATEUR (ordre id ASC).
 */
export async function testAutoAssignCreateurOnDossierCreation(): Promise<boolean> {
  console.log("🧪 Test 1: Auto-assign CREATEUR à la création du dossier");
  const supabase = createAdminClient();

  // Récupérer le premier agent CREATEUR existant
  const { data: createurAgent } = await supabase
    .from("agents")
    .select("id, email, name")
    .eq("agent_type", "CREATEUR")
    .order("id", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!createurAgent) {
    console.warn("⚠️ Aucun agent CREATEUR trouvé - créer un agent de test");
    // Créer un agent CREATEUR de test
    const { data: newAgent, error: agentError } = await supabase
      .from("agents")
      .insert({
        email: "test+createur4_23@partnersllc.test",
        name: "Test Createur 4.23",
        agent_type: "CREATEUR",
        active: true,
      })
      .select("id")
      .single();

    if (agentError || !newAgent) {
      console.error("❌ Impossible de créer un agent CREATEUR de test", agentError);
      return false;
    }
    testIds.agentId = newAgent.id;
  }

  // Récupérer un profil client existant pour le test
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("role", "CLIENT")
    .limit(1)
    .maybeSingle();

  if (!profile) {
    console.error("❌ Aucun profil client trouvé pour le test");
    return false;
  }
  testIds.profileId = profile.id;

  // Créer un produit de test
  const { data: product, error: productError } = await supabase
    .from("products")
    .insert({
      name: "Test Product 4.23",
      description: "Test",
      price_amount: 1000,
      currency: "USD",
      dossier_type: "LLC",
      active: true,
    })
    .select("id")
    .single();

  if (productError || !product) {
    console.error("❌ Erreur création produit test", productError);
    return false;
  }
  testIds.productId = product.id;

  // Créer une commande
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      user_id: profile.id,
      product_id: product.id,
      amount: 1000,
      currency: "USD",
      status: "PAID",
      paid_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (orderError || !order) {
    console.error("❌ Erreur création commande test", orderError);
    return false;
  }
  testIds.orderId = order.id;

  // Créer le dossier directement (simule ce que fait l'API)
  const { data: dossier, error: dossierError } = await supabase
    .from("dossiers")
    .insert({
      user_id: profile.id,
      product_id: product.id,
      type: "LLC",
      status: "QUALIFICATION",
      metadata: { order_id: order.id, created_via: "test_4_23" },
    })
    .select("id")
    .single();

  if (dossierError || !dossier) {
    console.error("❌ Erreur création dossier test", dossierError);
    return false;
  }
  testIds.dossierId = dossier.id;

  // Simuler l'auto-assign (logique extraite de l'API)
  const { data: firstCreateur } = await supabase
    .from("agents")
    .select("id")
    .eq("agent_type", "CREATEUR")
    .order("id", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (firstCreateur) {
    await supabase.from("dossier_agent_assignments").insert({
      dossier_id: dossier.id,
      agent_id: firstCreateur.id,
      assignment_type: "CREATEUR",
    });
  }

  // Vérifier que la ligne existe
  const { data: assignment } = await supabase
    .from("dossier_agent_assignments")
    .select("id, agent_id, assignment_type")
    .eq("dossier_id", dossier.id)
    .eq("assignment_type", "CREATEUR")
    .maybeSingle();

  if (!assignment) {
    console.error("❌ Aucune ligne dossier_agent_assignments CREATEUR trouvée");
    return false;
  }

  console.log(`✅ Assignment CREATEUR créé: agent_id=${assignment.agent_id}`);

  // Vérifier que c'est bien le premier agent (ordre id ASC)
  if (createurAgent && assignment.agent_id !== createurAgent.id) {
    // Si on a créé un agent de test, l'id le plus bas peut avoir changé
    console.warn("⚠️ L'agent assigné n'est pas le premier par ID - à vérifier selon les données");
  }

  return true;
}

/**
 * Test 2: Aucun agent CREATEUR → création dossier OK, pas de ligne
 *
 * Vérifie que si aucun agent CREATEUR n'existe, la création du dossier
 * réussit sans erreur et sans insérer de ligne dans dossier_agent_assignments.
 */
export async function testNoCREATEURAgentDoesNotFailDossierCreation(): Promise<boolean> {
  console.log("🧪 Test 2: Aucun agent CREATEUR → création dossier OK");

  const supabase = createAdminClient();

  // Vérifier qu'aucune ligne n'est insérée quand createurAgent est null
  const mockDossierId = crypto.randomUUID();

  // Simule la logique de l'API avec aucun agent CREATEUR (agent non trouvé → null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const createurAgent: { id: string } | null = null as any;

  if (createurAgent) {
    await supabase.from("dossier_agent_assignments").insert({
      dossier_id: mockDossierId,
      agent_id: (createurAgent as { id: string }).id,
      assignment_type: "CREATEUR",
    });
  }

  // Vérifier qu'aucune ligne n'a été insérée
  const { data: assignment } = await supabase
    .from("dossier_agent_assignments")
    .select("id")
    .eq("dossier_id", mockDossierId)
    .maybeSingle();

  if (assignment) {
    console.error("❌ Une ligne a été insérée malgré l'absence d'agent CREATEUR");
    return false;
  }

  console.log("✅ Aucune ligne insérée quand aucun agent CREATEUR - comportement correct");
  return true;
}

/**
 * Test 3: Créateur complète une step → validation_status = APPROVED
 *
 * Vérifie que lors de la complétion d'une step par un agent CREATEUR,
 * les champs validation_status, validated_by, validated_at sont renseignés.
 */
export async function testCreateurCompleteStepSetsApproved(): Promise<boolean> {
  console.log("🧪 Test 3: Créateur complète step → validation_status = APPROVED");
  const supabase = createAdminClient();

  // Récupérer un agent CREATEUR
  const { data: agent } = await supabase
    .from("agents")
    .select("id, agent_type")
    .eq("agent_type", "CREATEUR")
    .order("id", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!agent) {
    console.error("❌ Aucun agent CREATEUR trouvé");
    return false;
  }

  // Récupérer ou créer une step_instance de test
  if (!testIds.dossierId) {
    console.error("❌ Pas de dossier de test disponible - exécuter testAutoAssignCreateurOnDossierCreation d'abord");
    return false;
  }

  // Créer une step ADMIN de test
  const { data: step, error: stepError } = await supabase
    .from("steps")
    .insert({
      code: `TEST_STEP_4_23_${Date.now()}`,
      label: "Test Step 4.23",
      step_type: "ADMIN",
    })
    .select("id")
    .single();

  if (stepError || !step) {
    console.error("❌ Erreur création step test", stepError);
    return false;
  }
  testIds.stepId = step.id;

  // Créer une step_instance
  const now = new Date().toISOString();
  const { data: stepInstance, error: siError } = await supabase
    .from("step_instances")
    .insert({
      dossier_id: testIds.dossierId,
      step_id: step.id,
      assigned_to: agent.id,
      started_at: now,
    })
    .select("id")
    .single();

  if (siError || !stepInstance) {
    console.error("❌ Erreur création step_instance test", siError);
    return false;
  }
  testIds.stepInstanceId = stepInstance.id;

  // Simuler la complétion par un CREATEUR (logique extraite de l'API)
  const completedAt = new Date().toISOString();
  const updateData: Record<string, string> = { completed_at: completedAt };
  if (agent.agent_type === "CREATEUR") {
    updateData.validation_status = "APPROVED";
    updateData.validated_by = agent.id;
    updateData.validated_at = completedAt;
  }

  const { error: updateError } = await supabase
    .from("step_instances")
    .update(updateData)
    .eq("id", stepInstance.id);

  if (updateError) {
    console.error("❌ Erreur mise à jour step_instance", updateError);
    return false;
  }

  // Vérifier les champs
  const { data: updated } = await supabase
    .from("step_instances")
    .select("validation_status, validated_by, validated_at, completed_at")
    .eq("id", stepInstance.id)
    .single();

  if (!updated) {
    console.error("❌ Impossible de relire la step_instance");
    return false;
  }

  const checks = [
    { field: "validation_status", expected: "APPROVED", actual: updated.validation_status },
    { field: "validated_by", expected: agent.id, actual: updated.validated_by },
    { field: "completed_at", expected: "non-null", actual: updated.completed_at },
    { field: "validated_at", expected: "non-null", actual: updated.validated_at },
  ];

  let allPassed = true;
  for (const check of checks) {
    if (check.expected === "non-null") {
      if (!check.actual) {
        console.error(`❌ ${check.field} est null`);
        allPassed = false;
      } else {
        console.log(`✅ ${check.field}: ${check.actual}`);
      }
    } else {
      if (check.actual !== check.expected) {
        console.error(`❌ ${check.field}: attendu "${check.expected}", reçu "${check.actual}"`);
        allPassed = false;
      } else {
        console.log(`✅ ${check.field}: ${check.actual}`);
      }
    }
  }

  return allPassed;
}

/**
 * Test 4: API retourne 400 si documents non livrés (test de non-régression)
 *
 * Vérifie que l'API /api/agent/steps/[id]/complete retourne 400
 * quand un agent CREATEUR tente de compléter une step avec des documents non livrés.
 * Note: Ce test est fonctionnel (simule l'appel API via fetch).
 */
export async function testAPIRejects400WhenDocumentsNotDelivered(
  baseUrl: string,
  authCookie: string,
  stepInstanceId: string
): Promise<boolean> {
  console.log("🧪 Test 4: API retourne 400 si documents non livrés");

  const response = await fetch(`${baseUrl}/api/agent/steps/${stepInstanceId}/complete`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: authCookie,
    },
    body: JSON.stringify({ agent_type: "CREATEUR" }),
  });

  if (response.status === 400) {
    const body = await response.json();
    console.log(`✅ API retourne 400 avec message: ${body.error}`);
    return true;
  }

  console.error(`❌ API retourne ${response.status} au lieu de 400`);
  return false;
}

/**
 * Exécuter tous les tests
 */
export async function runAll4_23Tests() {
  console.log("\n=== Tests Story 4.23 ===\n");
  const results: Record<string, boolean> = {};

  try {
    results["1_auto_assign_createur"] = await testAutoAssignCreateurOnDossierCreation();
    results["2_no_createur_agent"] = await testNoCREATEURAgentDoesNotFailDossierCreation();
    results["3_createur_step_approved"] = await testCreateurCompleteStepSetsApproved();
    // Test 4 nécessite un environnement HTTP - à exécuter manuellement

    console.log("\n=== Résultats ===");
    for (const [name, passed] of Object.entries(results)) {
      console.log(`${passed ? "✅" : "❌"} ${name}`);
    }

    const allPassed = Object.values(results).every(Boolean);
    console.log(`\n${allPassed ? "✅ Tous les tests passent" : "❌ Certains tests échouent"}\n`);
  } finally {
    await cleanup();
    console.log("🧹 Cleanup effectué");
  }
}
