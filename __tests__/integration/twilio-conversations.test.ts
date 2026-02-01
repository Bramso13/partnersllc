/**
 * Integration tests for Story 13.1: Twilio Conversations Backend
 *
 * These tests validate the schema constraints, API contract shapes,
 * and Twilio service module expectations without requiring a live
 * Twilio or Supabase connection.
 */

// ─── Migration SQL validation ─────────────────────────────────────────────
import { readFileSync } from "fs";
import { resolve } from "path";

const MIGRATIONS_DIR = resolve(__dirname, "../../supabase/migrations");

function readMigration(name: string): string {
  return readFileSync(resolve(MIGRATIONS_DIR, name), "utf-8");
}

describe("Migration 038 – twilio_conversations schema", () => {
  let sql: string;

  beforeAll(() => {
    sql = readMigration("038_twilio_conversations_schema.sql");
  });

  it("creates twilio_conversations table", () => {
    expect(sql).toMatch(/create table if not exists twilio_conversations/i);
  });

  it("creates twilio_conversation_participants table", () => {
    expect(sql).toMatch(/create table if not exists twilio_conversation_participants/i);
  });

  it("creates twilio_conversation_messages table", () => {
    expect(sql).toMatch(/create table if not exists twilio_conversation_messages/i);
  });

  it("enforces type constraint on twilio_conversations", () => {
    // Must have CHECK that type='client' requires dossier_id and type='agent' requires agent_profile_id
    expect(sql).toMatch(/type = 'client' AND dossier_id IS NOT NULL/i);
    expect(sql).toMatch(/type = 'agent' AND agent_profile_id IS NOT NULL/i);
  });

  it("creates index on messages (conversation_id, created_at)", () => {
    expect(sql).toMatch(/idx_twilio_messages_conversation_created/i);
  });

  it("creates unique index on conversation SID", () => {
    expect(sql).toMatch(/twilio_conversation_sid text NOT NULL UNIQUE/i);
  });

  it("creates updated_at trigger on twilio_conversations", () => {
    expect(sql).toMatch(/update_twilio_conversations_updated_at/i);
  });

  it("participants table has unique constraint per conversation + profile", () => {
    expect(sql).toMatch(/unique \(twilio_conversation_id, profile_id\)/i);
  });
});

describe("Migration 039 – twilio_conversations RLS", () => {
  let sql: string;

  beforeAll(() => {
    sql = readMigration("039_twilio_conversations_rls.sql");
  });

  it("enables RLS on all 3 tables", () => {
    expect(sql).toMatch(/alter table twilio_conversations enable row level security/i);
    expect(sql).toMatch(/alter table twilio_conversation_participants enable row level security/i);
    expect(sql).toMatch(/alter table twilio_conversation_messages enable row level security/i);
  });

  it("creates admin full-access policies", () => {
    expect(sql).toMatch(/twilio_conversations_admin_all/i);
    expect(sql).toMatch(/twilio_participants_admin_all/i);
    expect(sql).toMatch(/twilio_messages_admin_all/i);
  });

  it("creates client SELECT policies via dossier ownership", () => {
    expect(sql).toMatch(/twilio_conversations_client_select/i);
    expect(sql).toMatch(/dossiers.user_id = auth.uid\(\)/i);
  });

  it("creates agent SELECT policies via agent_profile_id or participant", () => {
    expect(sql).toMatch(/twilio_conversations_agent_select/i);
    expect(sql).toMatch(/agent_profile_id = auth.uid\(\)/i);
  });
});

// ─── Twilio service module validation ─────────────────────────────────────
describe("lib/twilio – module exports", () => {
  it("exports expected functions", async () => {
    const mod = await import("../../lib/twilio");
    expect(typeof mod.createTwilioConversation).toBe("function");
    expect(typeof mod.addClientParticipant).toBe("function");
    expect(typeof mod.addAdminParticipant).toBe("function");
    expect(typeof mod.sendTwilioMessage).toBe("function");
    expect(typeof mod.verifyTwilioSignature).toBe("function");
  });

  it("createTwilioConversation throws without env vars", async () => {
    const mod = await import("../../lib/twilio");
    const origSid = process.env.TWILIO_ACCOUNT_SID;
    delete process.env.TWILIO_ACCOUNT_SID;
    await expect(mod.createTwilioConversation()).rejects.toThrow(
      "TWILIO_ACCOUNT_SID is not configured"
    );
    if (origSid) process.env.TWILIO_ACCOUNT_SID = origSid;
  });

  it("verifyTwilioSignature throws without auth token", async () => {
    const mod = await import("../../lib/twilio");
    const origToken = process.env.TWILIO_AUTH_TOKEN;
    delete process.env.TWILIO_AUTH_TOKEN;
    expect(() =>
      mod.verifyTwilioSignature("http://example.com", {}, "sig")
    ).toThrow("TWILIO_AUTH_TOKEN is not configured");
    if (origToken) process.env.TWILIO_AUTH_TOKEN = origToken;
  });
});

// ─── Type file validation ──────────────────────────────────────────────────
describe("types/conversations – type exports", () => {
  it("exports required types", () => {
    // TypeScript compilation already validates this, but we verify the file exists
    const fs = require("fs");
    const path = resolve(__dirname, "../../types/conversations.ts");
    expect(fs.existsSync(path)).toBe(true);

    const content = fs.readFileSync(path, "utf-8");
    expect(content).toMatch(/TwilioConversationType/);
    expect(content).toMatch(/TwilioConversation/);
    expect(content).toMatch(/TwilioConversationParticipant/);
    expect(content).toMatch(/TwilioConversationMessage/);
    expect(content).toMatch(/CreateConversationRequest/);
    expect(content).toMatch(/SendMessageRequest/);
    expect(content).toMatch(/ClientConversationSummary/);
  });
});

// ─── API route file existence ──────────────────────────────────────────────
describe("API routes – file structure", () => {
  const APP_DIR = resolve(__dirname, "../../app/api");

  const expectedRoutes = [
    "admin/conversations/route.ts",
    "admin/conversations/[id]/route.ts",
    "admin/conversations/[id]/participants/route.ts",
    "admin/conversations/[id]/messages/route.ts",
    "conversations/route.ts",
    "conversations/[id]/route.ts",
    "conversations/[id]/messages/route.ts",
    "webhooks/twilio/route.ts",
  ];

  expectedRoutes.forEach((route) => {
    it(`exists: ${route}`, () => {
      const fs = require("fs");
      expect(fs.existsSync(resolve(APP_DIR, route))).toBe(true);
    });
  });
});

// ─── Webhook route validation ──────────────────────────────────────────────
describe("Webhook route – structure", () => {
  it("exports POST handler", () => {
    const fs = require("fs");
    const content = fs.readFileSync(
      resolve(__dirname, "../../app/api/webhooks/twilio/route.ts"),
      "utf-8"
    );
    expect(content).toMatch(/export async function POST/);
  });

  it("verifies Twilio signature before processing", () => {
    const fs = require("fs");
    const content = fs.readFileSync(
      resolve(__dirname, "../../app/api/webhooks/twilio/route.ts"),
      "utf-8"
    );
    expect(content).toMatch(/verifyTwilioSignature/);
    // Must return 403 on failure
    expect(content).toMatch(/status: 403/);
  });

  it("handles onMessageCreate event", () => {
    const fs = require("fs");
    const content = fs.readFileSync(
      resolve(__dirname, "../../app/api/webhooks/twilio/route.ts"),
      "utf-8"
    );
    expect(content).toMatch(/onMessageCreate/);
  });
});

// ─── .env.example validation ───────────────────────────────────────────────
describe(".env.example – Twilio variables documented", () => {
  it("documents all required Twilio env vars", () => {
    const fs = require("fs");
    const content = fs.readFileSync(
      resolve(__dirname, "../../.env.example"),
      "utf-8"
    );
    expect(content).toMatch(/TWILIO_ACCOUNT_SID/);
    expect(content).toMatch(/TWILIO_AUTH_TOKEN/);
    expect(content).toMatch(/TWILIO_CONVERSATION_SERVICE_SID/);
    expect(content).toMatch(/TWILIO_WHATSAPP_NUMBER/);
  });
});

// ─── ERD update validation ─────────────────────────────────────────────────
describe("database-erd.md – Twilio entities documented", () => {
  it("includes Twilio conversation entities", () => {
    const fs = require("fs");
    const content = fs.readFileSync(
      resolve(__dirname, "../../../database-erd.md"),
      "utf-8"
    );
    expect(content).toMatch(/TWILIO_CONVERSATIONS/);
    expect(content).toMatch(/TWILIO_CONVERSATION_PARTICIPANTS/);
    expect(content).toMatch(/TWILIO_CONVERSATION_MESSAGES/);
  });

  it("includes Twilio index strategy", () => {
    const fs = require("fs");
    const content = fs.readFileSync(
      resolve(__dirname, "../../../database-erd.md"),
      "utf-8"
    );
    expect(content).toMatch(/idx_twilio_conversations_sid/);
    expect(content).toMatch(/idx_twilio_messages_conversation_created/);
  });
});
