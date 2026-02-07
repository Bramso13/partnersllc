/**
 * Script de test pour Twilio Conversations avec SMS
 *
 * Alternative au test WhatsApp - utilise SMS à la place
 *
 * Usage:
 *   tsx scripts/test-twilio-sms-conversation.ts
 *
 * Variables d'environnement requises:
 *   TWILIO_ACCOUNT_SID
 *   TWILIO_AUTH_TOKEN
 *   TWILIO_CONVERSATION_SERVICE_SID
 *   TWILIO_SMS_NUMBER (votre numéro Twilio acheté)
 *   TEST_PHONE_NUMBER (votre numéro personnel)
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

async function testSMSConversation() {
  try {
    console.log("🚀 Démarrage du test Twilio Conversations (SMS)...\n");

    const client = Twilio(
      getEnv("TWILIO_ACCOUNT_SID"),
      getEnv("TWILIO_AUTH_TOKEN")
    );
    const serviceSid = getEnv("TWILIO_CONVERSATION_SERVICE_SID");
    const twilioSmsNumber = getEnv("TWILIO_SMS_NUMBER");
    const testPhoneNumber = getEnv("TEST_PHONE_NUMBER");

    // Validation du format E.164
    if (!testPhoneNumber.startsWith("+")) {
      console.error("❌ Erreur: TEST_PHONE_NUMBER doit être en format E.164 (commencer par +)");
      console.log("   Exemple: +33612345678");
      process.exit(1);
    }

    // Étape 1: Créer une conversation
    console.log("📝 Création d'une nouvelle conversation...");
    const conversation = await client.conversations.v1
      .services(serviceSid)
      .conversations.create({
        friendlyName: `sms-test-${Date.now()}`,
      });
    console.log(`✅ Conversation créée: ${conversation.sid}\n`);

    // Étape 2: Ajouter votre numéro comme participant SMS
    console.log(`📱 Ajout du participant SMS: ${testPhoneNumber}`);
    const clientParticipant = await client.conversations.v1
      .services(serviceSid)
      .conversations(conversation.sid)
      .participants.create({
        "messagingBinding.address": testPhoneNumber,
        "messagingBinding.proxyAddress": twilioSmsNumber,
      });
    console.log(`✅ Participant ajouté: ${clientParticipant.sid}\n`);

    // Étape 3: Ajouter un admin participant
    console.log("👤 Ajout d'un participant admin...");
    const adminParticipant = await client.conversations.v1
      .services(serviceSid)
      .conversations(conversation.sid)
      .participants.create({
        identity: "admin-sms-test",
      });
    console.log(`✅ Admin ajouté: ${adminParticipant.sid}\n`);

    // Attendre un peu pour que les participants soient bien configurés
    console.log("⏳ Attente de 2 secondes...");
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Étape 4: Envoyer un message de test
    console.log("💬 Envoi d'un message de test via SMS...");
    const message = await client.conversations.v1
      .services(serviceSid)
      .conversations(conversation.sid)
      .messages.create({
        author: "admin-sms-test",
        body: "🎉 Test Twilio Conversations par SMS! Si vous recevez ceci, tout fonctionne.",
      });
    console.log(`✅ Message envoyé: ${message.sid}\n`);

    // Étape 5: Afficher les informations de la conversation
    console.log("✨ Test terminé avec succès!\n");
    console.log("📊 Informations de la conversation:");
    console.log(`   Conversation SID: ${conversation.sid}`);
    console.log(`   Service SID: ${serviceSid}`);
    console.log(`   Numéro Twilio: ${twilioSmsNumber}`);
    console.log(`   Votre numéro: ${testPhoneNumber}`);
    console.log(`   Message SID: ${message.sid}\n`);

    console.log("📲 Prochaines étapes:");
    console.log("   1. Vérifiez vos SMS - vous devriez recevoir le message");
    console.log("   2. Répondez au SMS pour tester la conversation bidirectionnelle");
    console.log("   3. Consultez la console Twilio:");
    console.log(`      https://console.twilio.com/us1/develop/conversations/manage/services/${serviceSid}/conversations/${conversation.sid}\n`);

    console.log("💡 Pour recevoir les réponses:");
    console.log("   1. Configurez un webhook dans votre Service Twilio");
    console.log("   2. Pointez vers votre API route (ex: /api/twilio/webhook)");
    console.log("   3. Utilisez verifyTwilioSignature() pour valider les webhooks");

  } catch (error) {
    console.error("❌ Erreur lors du test:", error);
    if (error instanceof Error) {
      console.error("   Message:", error.message);

      // Erreurs communes
      if (error.message.includes("Unable to create record")) {
        console.log("\n💡 Suggestions:");
        console.log("   - Vérifiez que TWILIO_CONVERSATION_SERVICE_SID est correct");
        console.log("   - Vérifiez que TWILIO_SMS_NUMBER est un numéro valide que vous possédez");
      } else if (error.message.includes("not configured")) {
        console.log("\n💡 Variables manquantes:");
        console.log("   TWILIO_ACCOUNT_SID");
        console.log("   TWILIO_AUTH_TOKEN");
        console.log("   TWILIO_CONVERSATION_SERVICE_SID");
        console.log("   TWILIO_SMS_NUMBER");
        console.log("   TEST_PHONE_NUMBER");
      }
    }
    process.exit(1);
  }
}

// Exécuter le test
testSMSConversation();
