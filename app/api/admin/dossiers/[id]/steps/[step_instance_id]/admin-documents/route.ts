import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";

export interface AdminDocumentItem {
  document_type: { id: string; code: string; label: string; description: string | null };
  document?: {
    id: string;
    status: string;
    current_version: {
      id: string;
      file_url: string;
      file_name: string;
      uploaded_at: string;
    };
    delivered_at?: string | null;
  };
}

/**
 * GET /api/admin/dossiers/[dossierId]/steps/[stepInstanceId]/admin-documents
 * Liste les types de documents requis pour l'étape admin et l'état uploadé (document + current_version) pour chaque type.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; step_instance_id: string }> }
) {
  try {
    await requireAdminAuth();
    const { id: dossierId, step_instance_id: stepInstanceId } = await params;
    const supabase = createAdminClient();

    const { data: stepInstance } = await supabase
      .from("step_instances")
      .select("id, dossier_id, step_id, step:steps(step_type)")
      .eq("id", stepInstanceId)
      .eq("dossier_id", dossierId)
      .single();

    if (!stepInstance) {
      return NextResponse.json(
        { error: "Étape non trouvée" },
        { status: 404 }
      );
    }

    const step = Array.isArray(stepInstance.step) ? stepInstance.step[0] : stepInstance.step;
    if (!step || step.step_type !== "ADMIN") {
      return NextResponse.json(
        { error: "Cette étape n'est pas une étape admin" },
        { status: 400 }
      );
    }

    const { data: stepDocTypes } = await supabase
      .from("step_document_types")
      .select(
        `
        document_type:document_types (
          id,
          code,
          label,
          description
        )
      `
      )
      .eq("step_id", stepInstance.step_id);

    const admin_documents: AdminDocumentItem[] = [];

    for (const sdt of stepDocTypes || []) {
      const docType = Array.isArray(sdt.document_type)
        ? sdt.document_type[0]
        : sdt.document_type;
      if (!docType) continue;

      const { data: docData } = await supabase
        .from("documents")
        .select(
          `
          id,
          status,
          current_version_id,
          delivered_at,
          versions:document_versions (
            id,
            file_url,
            file_name,
            uploaded_at,
            version_number
          )
        `
        )
        .eq("dossier_id", dossierId)
        .eq("document_type_id", docType.id)
        .eq("step_instance_id", stepInstanceId)
        .single();

      let document: AdminDocumentItem["document"];
      if (docData?.versions && docData.current_version_id) {
        const versions = Array.isArray(docData.versions) ? docData.versions : [docData.versions];
        const current = versions.find(
          (v: { id: string }) => v.id === docData.current_version_id
        );
        if (current) {
          document = {
            id: docData.id,
            status: docData.status ?? "PENDING",
            current_version: {
              id: current.id,
              file_url: current.file_url,
              file_name: current.file_name ?? "",
              uploaded_at: current.uploaded_at,
            },
            delivered_at: docData.delivered_at ?? undefined,
          };
        }
      }

      admin_documents.push({
        document_type: docType,
        document,
      });
    }

    return NextResponse.json({ admin_documents });
  } catch (error) {
    console.error("GET admin-documents error:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
