/**
 * Script de test pour Twilio Conversations
 *
 * Usage:
 *   tsx scripts/test-twilio-conversation.ts
 *
 * Assurez-vous d'avoir configuré vos variables d'environnement:
 *   TWILIO_ACCOUNT_SID
 *   TWILIO_AUTH_TOKEN
 *   TWILIO_CONVERSATION_SERVICE_SID
 *   TWILIO_WHATSAPP_NUMBER
 */

// Charger les variables d'environnement depuis .env
import { config } from "dotenv";
config();

import {
  createTwilioConversation,
  addClientParticipant,
  addAdminParticipant,
  sendTwilioMessage,
} from "../lib/twilio";

async function testConversation() {
  try {
    console.log("🚀 Démarrage du test Twilio Conversations...\n");

    // Étape 1: Créer une conversation
    console.log("📝 Création d'une nouvelle conversation...");
    const { conversationSid, serviceSid } = await createTwilioConversation();
    console.log(`✅ Conversation créée: ${conversationSid}`);
    console.log(`   Service: ${serviceSid}\n`);

    // Étape 2: Ajouter votre numéro comme participant client
    // ⚠️ IMPORTANT: Remplacez par votre numéro en format E.164 (ex: +33612345678)
    // Note: Configure d'abord l'Address Configuration avec: tsx scripts/setup-twilio-address-configuration.ts
    const YOUR_PHONE_NUMBER = process.env.TEST_PHONE_NUMBER || "+33XXXXXXXXX";

    if (YOUR_PHONE_NUMBER === "+33XXXXXXXXX") {
      console.error(
        "❌ Erreur: Définissez votre numéro dans TEST_PHONE_NUMBER"
      );
      console.log("   Exemple: TEST_PHONE_NUMBER=+33612345678");
      process.exit(1);
    }

    console.log(`📱 Ajout du participant client: ${YOUR_PHONE_NUMBER}`);
    const clientParticipantSid = await addClientParticipant(
      conversationSid,
      YOUR_PHONE_NUMBER
    );
    console.log(`✅ Participant client ajouté: ${clientParticipantSid}\n`);

    // Étape 3: Ajouter un admin (vous, via identity)
    console.log("👤 Ajout d'un participant admin...");
    const adminParticipantSid = await addAdminParticipant(
      conversationSid,
      "admin-test-001"
    );
    console.log(`✅ Participant admin ajouté: ${adminParticipantSid}\n`);

    // Étape 4: Envoyer un message de test
    console.log("💬 Envoi d'un message de test...");
    const messageSid = await sendTwilioMessage(
      conversationSid,
      "🎉 Bonjour! Ceci est un message de test depuis Twilio Conversations.",
      "admin-test-001"
    );
    console.log(`✅ Message envoyé: ${messageSid}\n`);

    // Instructions finales
    console.log("✨ Test terminé avec succès!\n");
    console.log("📲 Prochaines étapes:");
    console.log(
      "   1. Vérifiez votre WhatsApp - vous devriez recevoir le message"
    );
    console.log("   2. Répondez au message sur WhatsApp");
    console.log("   3. Consultez la console Twilio pour voir la conversation:");
    console.log(
      `      https://console.twilio.com/us1/develop/conversations/manage/services/${serviceSid}/conversations/${conversationSid}`
    );
    console.log("\n📊 Informations de la conversation:");
    console.log(`   Conversation SID: ${conversationSid}`);
    // console.log(`   Client Participant: ${clientParticipantSid}`);
    // console.log(`   Admin Participant: ${adminParticipantSid}`);
    console.log(`   Message: ${messageSid}`);
  } catch (error) {
    console.error("❌ Erreur lors du test:", error);
    if (error instanceof Error) {
      console.error("   Message:", error.message);
      console.error("   Stack:", error.stack);
    }
    process.exit(1);
  }
}

// Exécuter le test
testConversation();
