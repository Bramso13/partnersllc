#!/usr/bin/env tsx
/**
 * Script pour lancer les tests d'email notifications
 * 
 * Usage: pnpm tsx scripts/run-email-notifications-test.ts
 */

// Charger les variables d'environnement
import { config } from "dotenv";
import { resolve } from "path";

// Charger .env.local en priorité, puis .env
config({ path: resolve(process.cwd(), ".env.local") });
config({ path: resolve(process.cwd(), ".env") });

import { createAdminClient } from "@/lib/supabase/server";
import { runEmailNotificationTests } from "@/__tests__/integration/email-notifications.test";

async function main() {
  console.log("🔍 Recherche d'un utilisateur et d'un dossier de test...\n");

  const supabase = createAdminClient();



  // Récupérer le premier utilisateur disponible
  let { data: users, error: usersError } = await supabase
    .from("profiles")
    .select("id, email, full_name")
    .limit(1);

  let userId: string;

  if (usersError || !users || users.length === 0) {
    // Créer un utilisateur de test
    console.log("📝 Création d'un utilisateur de test...");
    
    // Générer un email unique pour le test
    const testEmail = `b.belabbas.sin@gmail.com`;
    
    // Créer l'utilisateur dans auth.users via l'API admin
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: "TestPassword123!",
      email_confirm: true,
      user_metadata: {
        full_name: "Test User Email Notifications"
      }
    });

    if (authError || !authUser?.user) {
      console.error("❌ Impossible de créer un utilisateur de test:", authError);
      process.exit(1);
    }

    userId = authUser.user.id;
    
    // Mettre à jour le profil créé automatiquement par le trigger
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        full_name: "Test User Email Notifications",
        status: "ACTIVE"
      })
      .eq("id", userId);

    if (updateError) {
      console.error("⚠️  Avertissement: Impossible de mettre à jour le profil:", updateError);
    }

    console.log(`✅ Utilisateur de test créé: ${testEmail} (${userId})`);
  } else {
    userId = users[0].id;
    console.log(`✅ Utilisateur trouvé: ${users[0].email || 'N/A'} (${users[0].full_name || 'N/A'})`);
  }

  // Récupérer le premier dossier disponible pour cet utilisateur
  const { data: dossiers, error: dossiersError } = await supabase
    .from("dossiers")
    .select("id, status")
    .eq("user_id", userId)
    .limit(1);

  let dossierId: string;

  if (dossiersError || !dossiers || dossiers.length === 0) {
    // Créer un dossier de test si aucun n'existe
    console.log("📝 Création d'un dossier de test...");
    const { data: newDossier, error: createError } = await supabase
      .from("dossiers")
      .insert({
        user_id: userId,
        type: "LLC",
        status: "IN_PROGRESS",
      })
      .select("id")
      .single();

    if (createError || !newDossier) {
      console.error("❌ Impossible de créer un dossier de test:", createError);
      process.exit(1);
    }

    dossierId = newDossier.id;
    console.log(`✅ Dossier de test créé: ${dossierId}`);
  } else {
    dossierId = dossiers[0].id;
    console.log(`✅ Dossier trouvé: ${dossierId} (status: ${dossiers[0].status})`);
  }

  console.log("\n" + "=".repeat(60));
  console.log(`🧪 Lancement des tests avec:`);
  console.log(`   User ID: ${userId}`);
  console.log(`   Dossier ID: ${dossierId}`);
  console.log("=".repeat(60) + "\n");

  // Lancer les tests
  const results = await runEmailNotificationTests(userId, dossierId);

  console.log("\n" + "=".repeat(60));
  if (results.failed === 0) {
    console.log("✅ Tous les tests sont passés !");
    process.exit(0);
  } else {
    console.log(`❌ ${results.failed} test(s) ont échoué`);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("❌ Erreur fatale:", error);
  process.exit(1);
});
