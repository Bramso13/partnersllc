/**
 * Test d'envoi d'un message WhatsApp via template (Content API)
 *
 * Usage:
 *   tsx scripts/test-twilio-whatsapp-template.ts
 *
 * Variables requises dans .env:
 *   TWILIO_ACCOUNT_SID
 *   TWILIO_AUTH_TOKEN
 *   TWILIO_WHATSAPP_NUMBER (ton numéro WhatsApp Business)
 *   TEST_PHONE_NUMBER (numéro du destinataire)
 */

import { config } from "dotenv";
config();

import Twilio from "twilio";

const CONTENT_SID = "HX801032b2d4ef3537d13494e1c44ccf77";

function getEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Variable d'environnement requise: ${name}`);
  }
  return value;
}

async function main() {
  const accountSid = getEnv("TWILIO_ACCOUNT_SID");
  const authToken = getEnv("TWILIO_AUTH_TOKEN");
  const fromNumber = getEnv("TWILIO_WHATSAPP_NUMBER").replace(/\s/g, "");
  const toNumber = getEnv("TEST_PHONE_NUMBER").replace(/\s/g, "");

  const client = Twilio(accountSid, authToken);

  console.log("📱 Envoi du message WhatsApp (template)...");
  console.log(`   From: whatsapp:${fromNumber}`);
  console.log(`   To: whatsapp:${toNumber}`);
  console.log(`   ContentSID: ${CONTENT_SID}`);
  console.log("");

  try {
    const message = await client.messages.create({
      contentSid: CONTENT_SID,
      contentVariables: JSON.stringify({
        1: "Jean",
        // Ajoute d'autres variables si ton template en a : 2: "valeur2", etc.
      }),
      from: `whatsapp:${fromNumber}`,
      to: `whatsapp:${toNumber}`,
    });

    console.log("✅ Message envoyé avec succès!");
    console.log(`   SID: ${message.sid}`);
    console.log(`   Status: ${message.status}`);
  } catch (error: any) {
    console.error("❌ Erreur:", error.message);
    if (error.code) console.error("   Code:", error.code);
    if (error.moreInfo) console.error("   Plus d'infos:", error.moreInfo);
    process.exit(1);
  }
}

main();
