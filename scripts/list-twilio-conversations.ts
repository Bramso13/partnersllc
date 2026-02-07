/**
 * Script pour lister toutes les conversations Twilio
 *
 * Usage:
 *   tsx scripts/list-twilio-conversations.ts
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

async function listConversations() {
  try {
    console.log("📋 Récupération des conversations Twilio...\n");

    const client = Twilio(
      getEnv("TWILIO_ACCOUNT_SID"),
      getEnv("TWILIO_AUTH_TOKEN")
    );
    const serviceSid = getEnv("TWILIO_CONVERSATION_SERVICE_SID");

    // Récupérer toutes les conversations
    const conversations = await client.conversations.v1
      .services(serviceSid)
      .conversations.list({ limit: 20 });

    if (conversations.length === 0) {
      console.log("ℹ️  Aucune conversation trouvée.");
      console.log("   Exécutez un script de test pour en créer une!\n");
      return;
    }

    console.log(`✅ ${conversations.length} conversation(s) trouvée(s):\n`);

    for (const conv of conversations) {
      console.log(`📝 ${conv.friendlyName || "Sans nom"}`);
      console.log(`   SID: ${conv.sid}`);
      console.log(`   État: ${conv.state}`);
      console.log(`   Créée: ${conv.dateCreated?.toLocaleString()}`);
      console.log(`   Mise à jour: ${conv.dateUpdated?.toLocaleString()}`);

      // Récupérer les participants
      const participants = await client.conversations.v1
        .services(serviceSid)
        .conversations(conv.sid)
        .participants.list();

      console.log(`   Participants (${participants.length}):`);
      for (const p of participants) {
        if (p.identity) {
          console.log(`      - Identity: ${p.identity}`);
        }
        if (p.messagingBinding) {
          const binding = p.messagingBinding as any;
          console.log(`      - ${binding.type}: ${binding.address}`);
        }
      }

      // Récupérer les derniers messages
      const messages = await client.conversations.v1
        .services(serviceSid)
        .conversations(conv.sid)
        .messages.list({ limit: 3 });

      if (messages.length > 0) {
        console.log(`   Messages récents (${messages.length}):`);
        for (const msg of messages.reverse()) {
          const preview = msg.body && msg.body.length > 50
            ? msg.body.substring(0, 50) + "..."
            : msg.body;
          console.log(`      - [${msg.author}]: ${preview}`);
        }
      }

      console.log(`   🔗 URL: https://console.twilio.com/us1/develop/conversations/manage/services/${serviceSid}/conversations/${conv.sid}`);
      console.log("");
    }

    console.log("💡 Conseils:");
    console.log("   - Les conversations en état 'active' sont en cours");
    console.log("   - Les conversations 'closed' sont archivées");
    console.log("   - Configurez les webhooks pour recevoir les messages entrants\n");

  } catch (error) {
    console.error("❌ Erreur:", error);
    if (error instanceof Error) {
      console.error("   Message:", error.message);
    }
    process.exit(1);
  }
}

listConversations();
