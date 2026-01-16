import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdminAuth();
    const { id } = await params;
    const { reason } = await request.json().catch(() => ({}));

    const supabase = createAdminClient();

    // Vérifier que le client existe et récupérer toutes ses données
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", id)
      .single();

    if (profileError) {
      console.error("Error fetching profile:", profileError);
      return NextResponse.json(
        {
          error: "Client non trouvé",
          details: profileError.message,
          code: profileError.code,
        },
        { status: 404 }
      );
    }

    if (!profile) {
      return NextResponse.json({ error: "Client non trouvé" }, { status: 404 });
    }

    // Vérifier que le profil n'est pas déjà archivé
    const { data: existingArchive, error: archiveCheckError } = await supabase
      .from("archived_user_profiles")
      .select("id")
      .eq("original_user_id", id)
      .limit(1)
      .maybeSingle();

    let archivedProfileId: string;

    if (existingArchive) {
      // Le profil est déjà archivé
      archivedProfileId = existingArchive.id;

      // Vérifier si les dossiers sont aussi archivés
      const { data: dossierArchive, error: dossierCheckError } = await supabase
        .from("archived_user_dossiers")
        .select("id")
        .eq("archived_profile_id", archivedProfileId)
        .limit(1)
        .maybeSingle();

      if (dossierArchive) {
        return NextResponse.json(
          { error: "Ce client et ses dossiers sont déjà archivés" },
          { status: 400 }
        );
      }

      // Le profil est archivé mais pas les dossiers, archiver les dossiers seulement
      const { data: archiveResult, error: archiveError } = await supabase.rpc(
        "archive_user_dossiers",
        {
          p_user_id: id,
          p_archived_by: admin.id,
          p_reason: reason || "Archivage manuel par l'administrateur",
        }
      );

      if (archiveError) {
        console.error("Error archiving dossiers:", archiveError);
        return NextResponse.json(
          { error: "Erreur lors de l'archivage des dossiers" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "Dossiers archivés avec succès",
        archived_dossiers_id: archiveResult,
      });
    }

    // Le profil n'est pas encore archivé, créer l'archive du profil
    const { data: newArchive, error: createArchiveError } = await supabase
      .from("archived_user_profiles")
      .insert({
        original_user_id: id,
        full_name: profile.full_name,
        phone: profile.phone,
        status: profile.status,
        stripe_customer_id: profile.stripe_customer_id,
        archived_reason: reason || "Archivage manuel par l'administrateur",
        original_created_at: profile.created_at,
        original_updated_at: profile.updated_at,
      })
      .select("id")
      .single();

    if (createArchiveError) {
      console.error("Error creating archive:", createArchiveError);
      return NextResponse.json(
        { error: "Erreur lors de la création de l'archive du profil" },
        { status: 500 }
      );
    }

    archivedProfileId = newArchive.id;

    // Archiver les dossiers
    const { data: archiveResult, error: archiveError } = await supabase.rpc(
      "archive_user_dossiers",
      {
        p_user_id: id,
        p_archived_by: admin.id,
        p_reason: reason || "Archivage manuel par l'administrateur",
      }
    );

    if (archiveError) {
      console.error("Error archiving dossiers:", archiveError);
      return NextResponse.json(
        { error: "Erreur lors de l'archivage des dossiers" },
        { status: 500 }
      );
    }

    // Supprimer le profil (le trigger va créer un doublon mais on l'ignore)
    // Ou mieux: on ne supprime pas automatiquement, on laisse l'admin le faire manuellement
    // pour éviter les erreurs

    return NextResponse.json({
      success: true,
      message: "Client et dossiers archivés avec succès",
      archived_profile_id: archivedProfileId,
      archived_dossiers_id: archiveResult,
    });
  } catch (error) {
    console.error("Error archiving client:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'archivage du client" },
      { status: 500 }
    );
  }
}
