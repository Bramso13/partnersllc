import Twilio from "twilio";

function getEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Environment variable ${name} is not configured`);
  }
  return value;
}

function getTwilioClient(): Twilio.Twilio {
  return Twilio(getEnv("TWILIO_ACCOUNT_SID"), getEnv("TWILIO_AUTH_TOKEN"));
}

function getServiceSid(): string {
  return getEnv("TWILIO_CONVERSATION_SERVICE_SID");
}

/**
 * Create a new Twilio Conversation under the configured Service.
 * Returns the Conversation SID.
 */
export async function createTwilioConversation(): Promise<{
  conversationSid: string;
  serviceSid: string;
}> {
  const client = getTwilioClient();
  const serviceSid = getServiceSid();

  const conversation = await client.conversations.v1
    .services(serviceSid)
    .conversations.create({ friendlyName: `platform-${Date.now()}` });

  return {
    conversationSid: conversation.sid,
    serviceSid,
  };
}

/**
 * Add a client participant via WhatsApp proxy binding.
 * The client's phone number (E.164 format) is used as the WhatsApp address.
 */
export async function addClientParticipant(
  conversationSid: string,
  clientPhone: string
): Promise<string> {
  const client = getTwilioClient();
  const serviceSid = getServiceSid();

  try {
    const participant = await client.conversations.v1
      .services(serviceSid)
      .conversations(conversationSid)
      .participants.create({
        "messagingBinding.address": `whatsapp:${clientPhone}`,
        "messagingBinding.proxyAddress": `whatsapp:${getEnv("TWILIO_WHATSAPP_NUMBER")}`,
      });

    return participant.sid;
  } catch (error: any) {
    // Error 50416: Participant already exists in this or another conversation
    if (error.code === 50416) {
      console.warn(
        `Participant ${clientPhone} already exists in a conversation. ` +
        `Error: ${error.message}`
      );
      // Check if participant is already in THIS conversation
      const participants = await client.conversations.v1
        .services(serviceSid)
        .conversations(conversationSid)
        .participants.list();

      const existingParticipant = participants.find(
        (p) => p.messagingBinding?.address === `whatsapp:${clientPhone}`
      );

      if (existingParticipant) {
        // Participant is already in this conversation, return its SID
        return existingParticipant.sid;
      }

      // Participant is in another conversation - this is a real conflict
      throw new Error(
        `Phone number ${clientPhone} is already active in another conversation. ` +
        `Close the other conversation first or use a different approach.`
      );
    }

    // Re-throw other errors
    throw error;
  }
}

/**
 * Add an admin participant via identity (their profile ID).
 */
export async function addAdminParticipant(
  conversationSid: string,
  identity: string
): Promise<string> {
  const client = getTwilioClient();
  const serviceSid = getServiceSid();

  const participant = await client.conversations.v1
    .services(serviceSid)
    .conversations(conversationSid)
    .participants.create({ identity });

  return participant.sid;
}

/**
 * Send a message to a Twilio Conversation.
 * Returns the Twilio Message SID.
 */
export async function sendTwilioMessage(
  conversationSid: string,
  body: string,
  identity: string
): Promise<string> {
  const client = getTwilioClient();
  const serviceSid = getServiceSid();

  const message = await client.conversations.v1
    .services(serviceSid)
    .conversations(conversationSid)
    .messages.create({ body, author: identity });

  return message.sid;
}

/**
 * Verify the Twilio webhook signature for incoming requests.
 */
export function verifyTwilioSignature(
  url: string,
  params: Record<string, string>,
  signature: string
): boolean {
  const authToken = getEnv("TWILIO_AUTH_TOKEN");
  return Twilio.validateRequest(authToken, signature, url, params);
}
