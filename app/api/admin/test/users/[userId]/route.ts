import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";

/**
 * DELETE /api/admin/test/users/[userId]
 * Completely removes a test user and all their associated data.
 *
 * Deletion order (respects FK constraints):
 * 1. Nullify dossiers.current_step_instance_id (FK to step_instances)
 * 2. notification_deliveries (FK to notifications)
 * 3. ALL notifications for user (by dossier_id + by user_id catch-all)
 * 4. events (no FK — entity_id is untyped UUID)
 * 5. step_field_values (FK to step_instances)
 * 6. step_instances (FK to dossiers)
 * 7. documents (FK to dossiers)
 * 8. orders (FK to dossiers via dossier_id, and user)
 * 9. dossiers
 * 10. profiles (explicit delete — FK to auth.users may not cascade)
 * 11. auth user (admin delete)
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    await requireAdminAuth();
    const { userId } = await params;

    if (!userId) {
      return NextResponse.json({ error: "userId requis" }, { status: 400 });
    }

    const supabase = createAdminClient();

    // --- 1. Get all dossier IDs for this user ---
    const { data: dossiers, error: dossiersError } = await supabase
      .from("dossiers")
      .select("id")
      .eq("user_id", userId);

    if (dossiersError) {
      console.error("[DELETE test user] Error fetching dossiers:", dossiersError);
      return NextResponse.json(
        { error: "Erreur lors de la récupération des dossiers" },
        { status: 500 }
      );
    }

    const dossierIds = (dossiers ?? []).map((d) => d.id);

    if (dossierIds.length > 0) {
      // --- 2. Nullify current_step_instance_id to release FK ---
      await supabase
        .from("dossiers")
        .update({ current_step_instance_id: null })
        .in("id", dossierIds);

      // --- 3. Get step_instance IDs ---
      const { data: stepInstances } = await supabase
        .from("step_instances")
        .select("id")
        .in("dossier_id", dossierIds);

      const stepInstanceIds = (stepInstances ?? []).map((si) => si.id);

      // --- 4. Get notification IDs for these dossiers ---
      const { data: notifs } = await supabase
        .from("notifications")
        .select("id")
        .in("dossier_id", dossierIds);

      const notifIds = (notifs ?? []).map((n) => n.id);

      // --- 5. Delete notification_deliveries ---
      if (notifIds.length > 0) {
        await supabase
          .from("notification_deliveries")
          .delete()
          .in("notification_id", notifIds);
      }

      // --- 6. Delete notifications by dossier ---
      await supabase
        .from("notifications")
        .delete()
        .in("dossier_id", dossierIds);

      // --- 7. Delete events for dossiers ---
      await supabase
        .from("events")
        .delete()
        .eq("entity_type", "dossier")
        .in("entity_id", dossierIds);

      // --- 8. Delete step_field_values ---
      if (stepInstanceIds.length > 0) {
        await supabase
          .from("step_field_values")
          .delete()
          .in("step_instance_id", stepInstanceIds);

        // --- 9. Delete step_instances ---
        await supabase
          .from("step_instances")
          .delete()
          .in("dossier_id", dossierIds);
      }

      // --- 10. Delete documents ---
      await supabase
        .from("documents")
        .delete()
        .in("dossier_id", dossierIds);

      // --- 11. Delete orders ---
      await supabase
        .from("orders")
        .delete()
        .eq("user_id", userId);

      // --- 12. Delete dossiers ---
      await supabase
        .from("dossiers")
        .delete()
        .in("id", dossierIds);
    }

    // --- 13. Delete profile events ---
    await supabase
      .from("events")
      .delete()
      .eq("entity_type", "profile")
      .eq("entity_id", userId);

    // --- 14. Catch-all: delete any remaining notifications for this user ---
    // (covers edge cases where dossier_id was null or dossiers list was incomplete)
    const { data: remainingNotifs } = await supabase
      .from("notifications")
      .select("id")
      .eq("user_id", userId);

    if (remainingNotifs && remainingNotifs.length > 0) {
      const remainingIds = remainingNotifs.map((n) => n.id);
      await supabase
        .from("notification_deliveries")
        .delete()
        .in("notification_id", remainingIds);
      await supabase
        .from("notifications")
        .delete()
        .eq("user_id", userId);
    }

    // --- 15. Explicitly delete profile (FK to auth.users may not have CASCADE) ---
    await supabase
      .from("profiles")
      .delete()
      .eq("id", userId);

    // --- 16. Delete auth user ---
    const { error: deleteUserError } = await supabase.auth.admin.deleteUser(userId);

    if (deleteUserError) {
      console.error("[DELETE test user] Error deleting auth user:", deleteUserError);
      return NextResponse.json(
        { error: "Erreur lors de la suppression du compte utilisateur" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, userId, deletedDossiers: dossierIds.length });
  } catch (error) {
    console.error("[DELETE /api/admin/test/users/[userId]] Error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
