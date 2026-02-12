import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";

async function getOrCreateAgent(
  userId: string,
  userName: string,
  userEmail: string
) {
  const supabase = await createAdminClient();
  const { data: agent } = await supabase
    .from("agents")
    .select("id")
    .eq("email", userEmail)
    .single();

  if (agent) return agent.id;

  const { data: newAgent, error } = await supabase
    .from("agents")
    .insert({
      email: userEmail,
      name: userName,
      active: true,
    })
    .select("id")
    .single();

  if (error) throw new Error("Impossible de créer l'agent");
  return newAgent!.id;
}

/**
 * POST /api/admin/dossiers/[dossierId]/admin-documents/upload
 * Upload ou remplace un document admin (même sémantique que le créateur : upsert + nouvelle version).
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAdminAuth();
    const { id: dossierId } = await params;
    const supabase = createAdminClient();

    const agentId = await getOrCreateAgent(
      user.id,
      user.full_name || user.email || "Admin",
      user.email || ""
    );

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const documentTypeId = formData.get("document_type_id") as string;
    const stepInstanceId = formData.get("step_instance_id") as string;

    if (!file || !documentTypeId || !stepInstanceId) {
      return NextResponse.json(
        { error: "Champs requis manquants (file, document_type_id, step_instance_id)" },
        { status: 400 }
      );
    }

    const { data: stepInstance } = await supabase
      .from("step_instances")
      .select("id, dossier_id, step:steps(step_type)")
      .eq("id", stepInstanceId)
      .single();

    if (!stepInstance || stepInstance.dossier_id !== dossierId) {
      return NextResponse.json(
        { error: "Étape non trouvée ou dossier incorrect" },
        { status: 404 }
      );
    }

    const step = Array.isArray(stepInstance.step)
      ? stepInstance.step[0]
      : stepInstance.step;
    if (!step || step.step_type !== "ADMIN") {
      return NextResponse.json(
        { error: "Cette étape n'est pas une étape admin" },
        { status: 400 }
      );
    }

    const fileExt = file.name.split(".").pop();
    const fileName = `admin/${stepInstanceId}_${documentTypeId}_${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("dossier-documents")
      .upload(fileName, file, { contentType: file.type, upsert: false });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      return NextResponse.json(
        { error: "Échec de l'upload du fichier" },
        { status: 500 }
      );
    }

    const fileUrl = supabase.storage
      .from("dossier-documents")
      .getPublicUrl(fileName).data.publicUrl;

    const { data: document, error: docError } = await supabase
      .from("documents")
      .upsert(
        {
          document_type_id: documentTypeId,
          dossier_id: stepInstance.dossier_id,
          step_instance_id: stepInstanceId,
          status: "PENDING",
        },
        { onConflict: "dossier_id,document_type_id,step_instance_id" }
      )
      .select()
      .single();

    if (docError) {
      console.error("Document upsert error:", docError);
      return NextResponse.json(
        { error: "Erreur lors de la création/mise à jour du document" },
        { status: 500 }
      );
    }

    const { count: versionCount } = await supabase
      .from("document_versions")
      .select("*", { count: "exact", head: true })
      .eq("document_id", document.id);

    const nextVersionNumber = (versionCount || 0) + 1;

    const { data: version, error: versionError } = await supabase
      .from("document_versions")
      .insert({
        document_id: document.id,
        file_url: fileUrl,
        file_name: file.name,
        file_size_bytes: file.size,
        mime_type: file.type,
        version_number: nextVersionNumber,
        uploaded_by_type: "AGENT",
        uploaded_by_id: agentId,
      })
      .select()
      .single();

    if (versionError || !version) {
      console.error("Version creation error:", versionError);
      return NextResponse.json(
        { error: "Erreur lors de la création de la version" },
        { status: 500 }
      );
    }

    await supabase
      .from("documents")
      .update({ current_version_id: version.id })
      .eq("id", document.id);

    await supabase.from("events").insert({
      entity_type: "document",
      entity_id: document.id,
      event_type: "DOCUMENT_UPLOADED",
      actor_type: "AGENT",
      actor_id: agentId,
      payload: {
        document_type: documentTypeId,
        agent_name: user.full_name,
        source: "ADMIN",
        admin_upload: true,
      },
    });

    return NextResponse.json({
      success: true,
      document: { id: document.id, status: "PENDING" },
    });
  } catch (error) {
    console.error("Admin admin-documents upload error:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
