import { NextRequest, NextResponse } from "next/server";
import { uploadDocument } from "@/lib/modules/workflow/client";
import { requireAuth } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const dossierId = formData.get("dossier_id") as string;
    const documentTypeId = formData.get("document_type_id") as string;
    const stepInstanceIdRaw = formData.get("step_instance_id") as string | null;
    const stepInstanceId = stepInstanceIdRaw && stepInstanceIdRaw.trim() !== "" 
      ? stepInstanceIdRaw 
      : null;

    if (!file || !dossierId || !documentTypeId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const result = await uploadDocument(
      user.id,
      file,
      dossierId,
      documentTypeId,
      stepInstanceId
    );

    return NextResponse.json({
      success: true,
      document_id: result.document_id,
      file_url: result.file_url,
    });
  } catch (error) {
    console.error("Error in upload-document:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to upload document",
      },
      { status: 500 }
    );
  }
}
