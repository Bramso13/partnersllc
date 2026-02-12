/**
 * Script pour créer l'Address Configuration WhatsApp (Conversations API)
 *
 * L'Address Configuration enregistre ton numéro WhatsApp Business auprès de
 * Twilio Conversations, ce qui permet de l'utiliser comme proxy pour les participants.
 *
 * Usage:
 *   tsx scripts/setup-twilio-address-configuration.ts
 *
 * Variables requises dans .env:
 *   TWILIO_ACCOUNT_SID
 *   TWILIO_AUTH_TOKEN
 *   TWILIO_CONVERSATION_SERVICE_SID
 *   TWILIO_WHATSAPP_NUMBER (ton numéro WhatsApp Business en E.164, ex: +33612345678)
 *   TWILIO_WEBHOOK_URL (optionnel, ex: https://partners-llc.fr/api/webhooks/twilio)
 */

import { config } from "dotenv";
config();

import Twilio from "twilio";

function getEnv(name: string): string | undefined {
  return process.env[name];
}

function getEnvRequired(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Variable d'environnement requise: ${name}`);
  }
  return value;
}

async function main() {
  const accountSid = getEnvRequired("TWILIO_ACCOUNT_SID");
  const authToken = getEnvRequired("TWILIO_AUTH_TOKEN");
  const serviceSid = getEnvRequired("TWILIO_CONVERSATION_SERVICE_SID");
  const whatsappNumber = getEnvRequired("TWILIO_WHATSAPP_NUMBER");
  const appUrl = getEnv("NEXT_PUBLIC_APP_URL")?.replace(/\/$/, "");
  const webhookUrl =
    getEnv("TWILIO_WEBHOOK_URL") ||
    (appUrl ? `${appUrl}/api/webhooks/twilio` : null) ||
    "https://partners-llc.fr/api/webhooks/twilio";

  const client = Twilio(accountSid, authToken);

  // Nettoyer le numéro (retirer espaces, garder format E.164)
  const cleanNumber = whatsappNumber.replace(/\s/g, "");
  // Essayer les deux formats : certains comptes Twilio attendent le préfixe, d'autres non
  const addressWithPrefix = `whatsapp:${cleanNumber}`;
  const address = "+18635922571";

  console.log("📋 Configuration:");
  console.log(
    `   Numéro WhatsApp: ${address}${process.argv.includes("--no-prefix") ? " (sans préfixe whatsapp:)" : ""}`
  );
  console.log(`   Conversation Service: ${serviceSid}`);
  console.log(`   Webhook URL: ${webhookUrl}`);
  console.log("");

  // Étape 1: Lister les Address Configurations existantes
  console.log("🔍 Vérification des Address Configurations existantes...");
  try {
    const existingConfigs =
      await client.conversations.v1.addressConfigurations.list({
        type: "whatsapp",
      });
    const alreadyExists = existingConfigs.find(
      (c) =>
        c.address === address ||
        c.address === cleanNumber ||
        c.address === `whatsapp:${cleanNumber}`
    );
    if (alreadyExists) {
      console.log(`✅ Une Address Configuration existe déjà pour ${address}`);
      console.log(`   SID: ${alreadyExists.sid}`);
      console.log(
        "\n💡 Si tu as des erreurs 50407, vérifie que ce numéro est bien"
      );
      console.log(
        "   enregistré comme WhatsApp Sender (status ONLINE) dans la Console Twilio."
      );
      return;
    }
    console.log(`   Aucune config existante pour ${address}`);
  } catch (err: any) {
    console.warn("   Impossible de lister les configs:", err.message);
  }
  console.log("");

  // Étape 2: Vérifier les WhatsApp Senders (API Messaging v2)
  console.log("🔍 Vérification des WhatsApp Senders...");
  try {
    const auth = Buffer.from(`${accountSid}:${authToken}`).toString("base64");
    const res = await fetch(
      "https://messaging.twilio.com/v2/Channels/Senders",
      {
        headers: { Authorization: `Basic ${auth}` },
      }
    );
    const body = (await res.json()) as {
      senders?: Array<{ sender_id: string; status: string }>;
    };
    const senders = body.senders || [];
    const whatsappSenders = senders.filter((s) =>
      s.sender_id?.toLowerCase().startsWith("whatsapp:")
    );
    if (whatsappSenders.length === 0) {
      console.warn("   ⚠️  Aucun WhatsApp Sender trouvé sur ce compte.");
      console.warn("   Tu dois d'abord enregistrer ton numéro via:");
      console.warn(
        "   https://console.twilio.com/us1/develop/sms/senders/whatsapp-senders"
      );
      console.log("");
    } else {
      const matching = whatsappSenders.find(
        (s) =>
          s.sender_id?.toLowerCase() === address.toLowerCase() ||
          s.sender_id?.includes(cleanNumber)
      );
      if (matching) {
        console.log(
          `   ✅ Sender trouvé: ${matching.sender_id} (status: ${matching.status})`
        );
        if (matching.status !== "ONLINE") {
          console.warn(
            `   ⚠️  Le sender n'est pas ONLINE. Attends quelques minutes.`
          );
        }
      } else {
        console.warn(
          `   ⚠️  Le numéro ${address} n'apparaît pas dans tes WhatsApp Senders.`
        );
        console.warn(
          "   Numéros enregistrés:",
          whatsappSenders.map((s) => s.sender_id).join(", ")
        );
      }
    }
  } catch (err: any) {
    console.warn("   Impossible de lister les senders:", err.message);
  }
  console.log("");

  // Étape 3: Créer l'Address Configuration
  console.log("📝 Création de l'Address Configuration...");

  const params: Record<string, unknown> = {
    type: "whatsapp",
    address,
    friendlyName: "Partners LLC WhatsApp",
    "autoCreation.enabled": true,
    "autoCreation.type": "webhook",
    "autoCreation.conversationServiceSid": serviceSid,
    "autoCreation.webhookUrl": webhookUrl,
    "autoCreation.webhookMethod": "post",
    "autoCreation.webhookFilters": ["onParticipantAdded", "onMessageAdded"],
  };

  try {
    const config = await client.conversations.v1.addressConfigurations.create(
      params as any
    );
    console.log("✅ Address Configuration créée avec succès!");
    console.log(`   SID: ${config.sid}`);
    console.log(`   Address: ${config.address}`);
    console.log("");
    console.log(
      "🎉 Tu peux maintenant relancer le test: tsx scripts/test-twilio-conversation.ts"
    );
  } catch (err: any) {
    console.error("❌ Erreur lors de la création:");
    console.error("   Code:", err.code);
    console.error("   Message:", err.message);
    if (err.moreInfo) console.error("   Plus d'infos:", err.moreInfo);
    console.error("");
    console.error("   Paramètres envoyés:", JSON.stringify(params, null, 2));
    console.error("");
    console.error("🔧 Causes possibles:");
    console.error(
      "   1. Le numéro n'est pas un WhatsApp Sender valide (voir console Twilio)"
    );
    console.error(
      "   2. Le sender n'est pas encore ONLINE (attendre après inscription)"
    );
    console.error("   3. Le webhook URL n'est pas accessible (HTTPS requis)");
    console.error(
      "   4. Mauvaise région Twilio (vérifier l'URL: us1, eu1, etc.)"
    );
    console.error("");
    console.error("💡 Essaie avec le format sans préfixe:");
    console.error(
      "   tsx scripts/setup-twilio-address-configuration.ts --no-prefix"
    );
    console.error("");
    console.error("   Ou configure via la console Flex (si disponible):");
    console.error(
      "   https://console.twilio.com/us1/develop/flex/channels/messaging/conversations"
    );
    process.exit(1);
  }
}

main();
