#!/usr/bin/env tsx
/**
 * Script de seed pour tester le cron process-event-notifications
 * 
 * Ce script crée un événement DOSSIER_CREATED
 * avec created_at récent (dans les 5 dernières minutes) pour que le cron
 * puisse le traiter.
 * 
 * Usage:
 *   npx tsx scripts/seed-events-for-cron-test.ts <email>
 * 
 * Exemple:
 *   npx tsx scripts/seed-events-for-cron-test.ts test@example.com
 */

// Charger les variables d'environnement
import { config } from "dotenv";
import { resolve } from "path";

// Charger .env.local en priorité, puis .env
config({ path: resolve(process.cwd(), ".env.local") });
config({ path: resolve(process.cwd(), ".env") });

import { createAdminClient } from "@/lib/supabase/server";
import { randomUUID } from "crypto";

async function main() {
  const email = process.argv[2] || "test-cron@example.com";
  
  console.log("🌱 Seed d'événements pour test du cron");
  console.log(`📧 Email de destination: ${email}\n`);

  const supabase = createAdminClient();

  // 1. Trouver ou créer l'utilisateur
  console.log("👤 Recherche/création de l'utilisateur...");
  let userId: string;

  const { data: authUsers, error: listError } = await supabase.auth.admin.listUsers();
  
  if (listError) {
    console.error("❌ Erreur lors de la recherche des utilisateurs:", listError);
    process.exit(1);
  }

  const existingUser = authUsers.users.find(u => u.email === email);
  
  if (existingUser) {
    userId = existingUser.id;
    console.log(`✅ Utilisateur trouvé: ${email} (${userId})`);
  } else {
    console.log(`📝 Création d'un nouvel utilisateur: ${email}`);
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: email,
      password: randomUUID(), // Mot de passe aléatoire pour les tests
      email_confirm: true,
      user_metadata: {
        full_name: "Test User Cron",
      }
    });

    if (createError || !newUser.user) {
      console.error("❌ Erreur lors de la création de l'utilisateur:", createError);
      process.exit(1);
    }

    userId = newUser.user.id;

    // Mettre à jour le profil
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        full_name: "Test User Cron",
        status: "ACTIVE"
      })
      .eq("id", userId);

    if (updateError) {
      console.error("⚠️  Avertissement: Impossible de mettre à jour le profil:", updateError);
    }

    console.log(`✅ Utilisateur créé: ${email} (${userId})`);
  }

  // 2. Créer l'événement avec created_at récent (dans les 5 dernières minutes)
  const now = new Date();
  const eventCreatedAt = new Date(now.getTime() - 2 * 60 * 1000); // Il y a 2 minutes

  console.log(`\n📅 Création de l'événement avec created_at: ${eventCreatedAt.toISOString()}`);

  // Événement DOSSIER_CREATED
  // Utiliser "test_dossier" comme entity_type pour éviter les erreurs de clé étrangère
  // sur dossier_id dans les notifications
  const dossierCreatedEvent = {
    id: randomUUID(),
    entity_type: "test_dossier", // Pas "dossier" pour éviter les erreurs de FK
    entity_id: randomUUID(),
    event_type: "DOSSIER_CREATED" as const,
    actor_type: "SYSTEM" as const,
    actor_id: null,
    payload: {
      // Ne pas mettre dossier_id pour éviter les erreurs de FK
      user_id: userId, // Important pour determineRecipients
      product_id: randomUUID(),
      created_via: "cron_test",
    },
    created_at: eventCreatedAt.toISOString(),
  };

  // 3. Insérer l'événement
  console.log("\n📝 Insertion de l'événement dans la table events...");

  const { data: insertedEvents, error: insertError } = await supabase
    .from("events")
    .insert([dossierCreatedEvent])
    .select("id, event_type, created_at");

  if (insertError) {
    console.error("❌ Erreur lors de l'insertion des événements:", insertError);
    process.exit(1);
  }

  console.log("✅ Événement créé avec succès:");
  insertedEvents?.forEach((event) => {
    console.log(`   - ${event.event_type} (${event.id})`);
  });

  // 4. Vérifier qu'il est bien dans la fenêtre de 5 minutes
  const timeWindow = new Date(Date.now() - 5 * 60 * 1000).toISOString();
  console.log(`\n🔍 Vérification que l'événement est dans la fenêtre de 5 minutes...`);
  console.log(`   Fenêtre: ${timeWindow} à maintenant`);

  const { data: recentEvents, error: checkError } = await supabase
    .from("events")
    .select("id, event_type, created_at")
    .in("id", insertedEvents.map(e => e.id))
    .gte("created_at", timeWindow);

  if (checkError) {
    console.error("❌ Erreur lors de la vérification:", checkError);
    process.exit(1);
  }

  console.log(`✅ ${recentEvents?.length || 0} événement(s) trouvé(s) dans la fenêtre de 5 minutes`);

  // 5. Résumé
  console.log("\n" + "=".repeat(60));
  console.log("✅ Seed terminé avec succès!");
  console.log("=".repeat(60));
  console.log(`\n📊 Résumé:`);
  console.log(`   - Utilisateur: ${email} (${userId})`);
  console.log(`   - Événement créé: DOSSIER_CREATED`);
  console.log(`   - Created at: ${eventCreatedAt.toISOString()}`);
  console.log(`\n🚀 Prochaines étapes:`);
  console.log(`   1. Appeler le cron: POST /api/cron/process-event-notifications`);
  console.log(`   2. Vérifier les notifications créées dans la table notifications`);
  console.log(`   3. Vérifier les emails envoyés à ${email}`);
  console.log(`\n💡 Note: L'événement sera traité par le cron s'il a été créé`);
  console.log(`   dans les 5 dernières minutes et n'a pas encore été traité.\n`);
}

main().catch((error) => {
  console.error("❌ Erreur fatale:", error);
  process.exit(1);
});
