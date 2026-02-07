/**
 * Script pour supprimer TOUTES les conversations Twilio ET les entrées DB
 * ⚠️ ATTENTION: Cette action est IRRÉVERSIBLE
 *
 * Usage:
 *   tsx scripts/delete-all-conversations-and-db.ts
 */

// Charger les variables d'environnement depuis .env
import { config } from "dotenv";
config();

import Twilio from "twilio";
import { createClient } from "@supabase/supabase-js";

function getEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Environment variable ${name} is not configured`);
  }
  return value;
}

async function deleteAllConversationsAndDB() {
  try {
    console.log("🗑️  Suppression COMPLÈTE: Twilio + Database\n");
    console.log("⚠️  ATTENTION: Cette action est IRRÉVERSIBLE!\n");

    const twilioClient = Twilio(
      getEnv("TWILIO_ACCOUNT_SID"),
      getEnv("TWILIO_AUTH_TOKEN")
    );
    const serviceSid = getEnv("TWILIO_CONVERSATION_SERVICE_SID");

    const supabase = createClient(
      getEnv("NEXT_PUBLIC_SUPABASE_URL"),
      getEnv("SUPABASE_SERVICE_ROLE_KEY")
    );

    // Étape 1: Supprimer de Twilio
    console.log("📡 Étape 1/2: Suppression dans Twilio...\n");

    const conversations = await twilioClient.conversations.v1
      .services(serviceSid)
      .conversations.list({ limit: 100 });

    let deletedTwilio = 0;

    for (const conv of conversations) {
      try {
        console.log(`   🗑️  ${conv.friendlyName || conv.sid}`);
        await twilioClient.conversations.v1
          .services(serviceSid)
          .conversations(conv.sid)
          .remove();
        deletedTwilio++;
      } catch (error: any) {
        console.log(`   ❌ Erreur: ${error.message}`);
      }
    }

    console.log(`\n   ✅ Twilio: ${deletedTwilio} conversation(s) supprimée(s)\n`);

    // Étape 2: Supprimer de la base de données
    console.log("💾 Étape 2/2: Suppression dans la base de données...\n");

    const { data: dbConversations } = await supabase
      .from("twilio_conversations")
      .select("*");

    console.log(`   Trouvées: ${dbConversations?.length || 0} entrée(s)`);

    if (dbConversations && dbConversations.length > 0) {
      const { error } = await supabase
        .from("twilio_conversations")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000"); // Delete all

      if (error) {
        console.log(`   ❌ Erreur DB: ${error.message}`);
      } else {
        console.log(`   ✅ Database: ${dbConversations.length} entrée(s) supprimée(s)\n`);
      }
    }

    console.log("━".repeat(50));
    console.log("✨ Nettoyage complet terminé!\n");
    console.log("💡 Vous pouvez maintenant créer de nouvelles conversations.");

  } catch (error) {
    console.error("❌ Erreur:", error);
    if (error instanceof Error) {
      console.error("   Message:", error.message);
    }
    process.exit(1);
  }
}

deleteAllConversationsAndDB();
