import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { requireAdminAuth } from "@/lib/auth";
import crypto from "crypto";

// Helper function to get or create agent for user
async function getOrCreateAgent(userId: string, userName: string, userEmail: string) {
  const supabase = await createAdminClient();
  
  // Try to find existing agent by email
  const { data: agent, error } = await supabase
    .from("agents")
    .select("id")
    .eq("email", userEmail)
    .single();

  // If agent doesn't exist, create one
  if (error || !agent) {
    const { data: newAgent, error: createError } = await supabase
      .from("agents")
      .insert({
        email: userEmail,
        name: userName,
        active: true,
      })
      .select("id")
      .single();

    if (createError) {
      console.error("Error creating agent:", createError);
      throw new Error("Impossible de créer l'agent");
    }

    return newAgent.id;
  }

  return agent.id;
}

export async function POST(request: NextRequest) {
  try {
    // Auth check
    const user = await requireAdminAuth();

    const body = await request.json();
    const { prospect_email, prospect_name, product_id, expires_in_days } = body;

    // Validation
    if (!prospect_email || !product_id) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get or create agent for this user
    const agentId = await getOrCreateAgent(
      user.id,
      user.full_name || "Admin",
      user.email
    );

    // Generate unique token
    const token = crypto.randomBytes(16).toString("hex");

    // Calculate expiration date
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + (expires_in_days || 30));

    // Create payment link
    const { data, error } = await supabase
      .from("payment_links")
      .insert({
        token,
        prospect_email,
        prospect_name: prospect_name || null,
        product_id,
        expires_at: expiresAt.toISOString(),
        status: "ACTIVE",
        created_by: agentId,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating payment link:", error);
      return NextResponse.json(
        { error: "Failed to create payment link" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      payment_link: data,
      url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/register/${token}`,
    });
  } catch (error) {
    console.error("Error in create payment link API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
