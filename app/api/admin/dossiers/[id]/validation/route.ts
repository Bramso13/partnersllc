import { requireAdminAuth } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminAuth();
    const { id: dossierId } = await params;

    console.log("[VALIDATION API] ===== START =====");
    console.log("[VALIDATION API] Fetching validation data for dossier:", dossierId);

    const supabase = await createAdminClient();

    // Query all step instances for dossier with field counts
    const { data: stepInstances, error: stepError } = await supabase
      .from("step_instances")
      .select(
        `
        id,
        dossier_id,
        step_id,
        assigned_to,
        started_at,
        completed_at,
        validation_status,
        rejection_reason,
        validated_by,
        validated_at,
        steps!inner (
          id,
          label,
          description
        )
      `
      )
      .eq("dossier_id", dossierId)
      .order("started_at", { ascending: true });

    if (stepError) {
      console.error("[VALIDATION API] Error fetching step instances:", stepError);
      return NextResponse.json(
        { error: "Erreur lors de la récupération des étapes" },
        { status: 500 }
      );
    }

    console.log("[VALIDATION API] Found step instances:", stepInstances?.length || 0);

    // For each step instance, fetch fields and counts
    const stepInstancesWithFields = await Promise.all(
      (stepInstances || []).map(async (si) => {
        interface StepField {
          id: string;
          label: string;
          field_type: string;
          is_required: boolean;
          position: number;
        }

        interface FieldValueRow {
          id: string;
          step_instance_id: string;
          step_field_id: string;
          value: string | null;
          value_jsonb: Record<string, unknown> | null;
          validation_status: string;
          rejection_reason: string | null;
          reviewed_by: string | null;
          reviewed_at: string | null;
          step_fields: StepField | StepField[];
        }

        // Fetch fields for this step instance
        const { data: fields, error: fieldsError } = await supabase
          .from("step_field_values")
          .select(
            `
            id,
            step_instance_id,
            step_field_id,
            value,
            value_jsonb,
            validation_status,
            rejection_reason,
            reviewed_by,
            reviewed_at,
            step_fields!inner (
              id,
              label,
              field_type,
              is_required,
              position
            )
          `
          )
          .eq("step_instance_id", si.id)
          .order("step_fields(position)", { ascending: true });

        if (fieldsError) {
          console.error("Error fetching fields:", fieldsError);
        }

        // Transform fields to flat structure
        const transformedFields = (fields as FieldValueRow[] || []).map((f) => {
          const stepField = Array.isArray(f.step_fields) ? f.step_fields[0] : f.step_fields;
          return {
            id: f.id,
            step_instance_id: f.step_instance_id,
            step_field_id: f.step_field_id,
            value: f.value,
            value_jsonb: f.value_jsonb,
            validation_status: f.validation_status,
            rejection_reason: f.rejection_reason,
            reviewed_by: f.reviewed_by,
            reviewed_at: f.reviewed_at,
            field_label: stepField?.label || "Unknown",
            field_type: stepField?.field_type || "text",
            is_required: stepField?.is_required || false,
          };
        });

        // Count approved fields
        const approvedCount = transformedFields.filter(
          (f) => f.validation_status === "APPROVED"
        ).length;

        console.log(`[VALIDATION API] Fetching documents for step_instance_id: ${si.id}`);
        
        // Fetch documents for this step instance
        const { data: documents, error: docsError } = await supabase
          .from("documents")
          .select(
            `
            id,
            dossier_id,
            document_type_id,
            step_instance_id,
            status,
            current_version_id,
            created_at,
            updated_at,
            document_types (
              id,
              code,
              label,
              description
            )
          `
          )
          .eq("step_instance_id", si.id)
          .order("created_at", { ascending: true });

        if (docsError) {
          console.error(`[VALIDATION API] Error fetching documents for step ${si.id}:`, docsError);
        }
        
        console.log(`[VALIDATION API] Found ${documents?.length || 0} documents for step_instance_id: ${si.id}`);
        if (documents && documents.length > 0) {
          console.log("[VALIDATION API] Documents raw data:", JSON.stringify(documents, null, 2));
        }

        // Fetch document versions for each document that has a current_version_id
        const documentsWithVersions = await Promise.all(
          (documents || []).map(async (doc) => {
            if (!doc.current_version_id) {
              console.log(`[VALIDATION API] Document ${doc.id} has no current_version_id`);
              return { ...doc, current_version: null };
            }

            const { data: version, error: versionError } = await supabase
              .from("document_versions")
              .select(
                `
                id,
                file_url,
                file_name,
                file_size_bytes,
                mime_type,
                uploaded_at
              `
              )
              .eq("id", doc.current_version_id)
              .single();

            if (versionError) {
              console.error(`[VALIDATION API] Error fetching version for document ${doc.id}:`, versionError);
              return { ...doc, current_version: null };
            }

            console.log(`[VALIDATION API] Found version for document ${doc.id}:`, version);
            return { ...doc, current_version: version };
          })
        );

        interface DocumentType {
          id: string;
          code: string;
          label: string;
          description: string | null;
        }

        interface DocumentVersion {
          id: string;
          file_url: string;
          file_name: string | null;
          file_size_bytes: number | null;
          mime_type: string | null;
          uploaded_at: string;
        }

        interface DocumentRowWithVersion {
          id: string;
          dossier_id: string;
          document_type_id: string;
          step_instance_id: string | null;
          status: string;
          created_at: string;
          updated_at: string;
          current_version_id: string | null;
          document_types: DocumentType | DocumentType[] | null;
          current_version: DocumentVersion | null;
        }

        // Transform documents
        const transformedDocuments = (documentsWithVersions as DocumentRowWithVersion[] || []).map((doc) => {
          const docType = doc.document_types
            ? Array.isArray(doc.document_types)
              ? doc.document_types[0]
              : doc.document_types
            : null;

          console.log(`[VALIDATION API] Transforming document ${doc.id}:`, {
            has_doc_type: !!docType,
            doc_type_label: docType?.label,
            has_version: !!doc.current_version,
            file_name: doc.current_version?.file_name,
          });

          return {
            id: doc.id,
            dossier_id: doc.dossier_id,
            document_type_id: doc.document_type_id,
            step_instance_id: doc.step_instance_id,
            status: doc.status,
            created_at: doc.created_at,
            updated_at: doc.updated_at,
            document_type_label: docType?.label || "Type inconnu",
            document_type_code: docType?.code || "unknown",
            current_version: doc.current_version,
          };
        });

        // Count approved documents
        const approvedDocsCount = transformedDocuments.filter(
          (d) => d.status === "APPROVED"
        ).length;

        console.log(`[VALIDATION API] Step ${si.id} summary:`, {
          step_label: (si.steps as any)?.label,
          fields_count: transformedFields.length,
          approved_fields: approvedCount,
          documents_count: transformedDocuments.length,
          approved_documents: approvedDocsCount,
        });

        interface StepInfo {
          label: string;
          description: string | null;
        }

        const result = {
          id: si.id,
          dossier_id: si.dossier_id,
          step_id: si.step_id,
          assigned_to: si.assigned_to,
          started_at: si.started_at,
          completed_at: si.completed_at,
          validation_status: si.validation_status,
          rejection_reason: si.rejection_reason,
          validated_by: si.validated_by,
          validated_at: si.validated_at,
          step_label: (si.steps as unknown as StepInfo)?.label || "Unknown Step",
          step_description: (si.steps as unknown as StepInfo)?.description || null,
          approved_fields_count: approvedCount,
          total_fields_count: transformedFields.length,
          approved_documents_count: approvedDocsCount,
          total_documents_count: transformedDocuments.length,
          fields: transformedFields,
          documents: transformedDocuments,
        };
        
        console.log(`[VALIDATION API] Transformed documents for step ${si.id}:`, JSON.stringify(transformedDocuments, null, 2));
        
        return result;
      })
    );

    console.log("[VALIDATION API] ===== RESPONSE SUMMARY =====");
    console.log(`[VALIDATION API] Total steps: ${stepInstancesWithFields.length}`);
    stepInstancesWithFields.forEach((step, index) => {
      console.log(`[VALIDATION API] Step ${index + 1}: ${step.step_label} - ${step.total_documents_count} documents`);
    });
    console.log("[VALIDATION API] ===== END =====");

    return NextResponse.json({ stepInstances: stepInstancesWithFields });
  } catch (error) {
    console.error("Error in validation endpoint:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
