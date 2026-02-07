/**
 * Script pour SUPPRIMER toutes les conversations Twilio
 * ⚠️ ATTENTION: Cette action est IRRÉVERSIBLE
 *
 * Usage:
 *   tsx scripts/delete-all-conversations.ts
 */

// Charger les variables d'environnement depuis .env
import { config } from "dotenv";
config();

import Twilio from "twilio";

function getEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Environment variable ${name} is not configured`);
  }
  return value;
}

async function deleteAllConversations() {
  try {
    console.log("🗑️  Suppression de TOUTES les conversations Twilio...\n");
    console.log("⚠️  ATTENTION: Cette action est IRRÉVERSIBLE!\n");

    const client = Twilio(
      getEnv("TWILIO_ACCOUNT_SID"),
      getEnv("TWILIO_AUTH_TOKEN")
    );
    const serviceSid = getEnv("TWILIO_CONVERSATION_SERVICE_SID");

    // Récupérer toutes les conversations
    const conversations = await client.conversations.v1
      .services(serviceSid)
      .conversations.list({ limit: 100 });

    if (conversations.length === 0) {
      console.log("✅ Aucune conversation à supprimer.\n");
      return;
    }

    console.log(`📋 ${conversations.length} conversation(s) trouvée(s):\n`);

    let deleted = 0;
    let failed = 0;

    for (const conv of conversations) {
      try {
        console.log(`🗑️  Suppression: ${conv.friendlyName || conv.sid}`);
        console.log(`   SID: ${conv.sid}`);
        console.log(`   État: ${conv.state}`);

        // Supprimer la conversation
        await client.conversations.v1
          .services(serviceSid)
          .conversations(conv.sid)
          .remove();

        console.log(`   ✅ Supprimée\n`);
        deleted++;
      } catch (error: any) {
        console.log(`   ❌ Erreur: ${error.message}\n`);
        failed++;
      }
    }

    console.log("━".repeat(50));
    console.log(`✨ Résumé:`);
    console.log(`   ✅ Supprimées: ${deleted}`);
    console.log(`   ❌ Échecs: ${failed}`);
    console.log(`   📊 Total: ${conversations.length}\n`);

    if (deleted > 0) {
      console.log("💡 Toutes les conversations ont été supprimées.");
      console.log("   Vous pouvez maintenant créer de nouvelles conversations.");
    }

  } catch (error) {
    console.error("❌ Erreur:", error);
    if (error instanceof Error) {
      console.error("   Message:", error.message);
    }
    process.exit(1);
  }
}

deleteAllConversations();
