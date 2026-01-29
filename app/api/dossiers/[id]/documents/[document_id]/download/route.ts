import { requireAuth } from "@/lib/auth";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/dossiers/[id]/documents/[document_id]/download
 * Secure document download route for clients
 * Verifies dossier ownership before serving file
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; document_id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id: dossierId, document_id } = await params;

    const supabase = await createClient();

    // Verify dossier belongs to user
    const { data: dossier, error: dossierError } = await supabase
      .from("dossiers")
      .select("id, user_id")
      .eq("id", dossierId)
      .eq("user_id", user.id)
      .single();

    if (dossierError || !dossier) {
      console.error("[DOWNLOAD DOC] Dossier not found or access denied:", {
        dossierId,
        userId: user.id,
        error: dossierError,
      });
      return NextResponse.json(
        { error: "Dossier non trouvé ou accès refusé" },
        { status: 404 }
      );
    }

    // Verify document belongs to dossier
    const { data: document, error: documentError } = await supabase
      .from("documents")
      .select("id, dossier_id, current_version_id")
      .eq("id", document_id)
      .eq("dossier_id", dossierId)
      .single();

    if (documentError || !document) {
      console.error("[DOWNLOAD DOC] Document not found:", {
        document_id,
        dossierId,
        error: documentError,
      });
      return NextResponse.json(
        { error: "Document non trouvé" },
        { status: 404 }
      );
    }

    if (!document.current_version_id) {
      console.error("[DOWNLOAD DOC] Document has no current_version_id:", document_id);
      return NextResponse.json(
        { error: "Le document n'a pas de version courante" },
        { status: 400 }
      );
    }

    // Get document version
    const { data: version, error: versionError } = await supabase
      .from("document_versions")
      .select("file_url, file_name, mime_type")
      .eq("id", document.current_version_id)
      .single();

    if (versionError || !version) {
      console.error("[DOWNLOAD DOC] Version not found:", {
        version_id: document.current_version_id,
        error: versionError,
      });
      return NextResponse.json(
        { error: "Version du document non trouvée" },
        { status: 404 }
      );
    }

    // Extract file path from file_url
    // file_url can be:
    // 1. Full public URL: https://xxx.supabase.co/storage/v1/object/public/bucket-name/path/to/file
    // 2. Signed URL: https://xxx.supabase.co/storage/v1/object/sign/...
    // 3. Relative path: path/to/file
    let filePath: string;

    try {
      if (version.file_url.includes("/storage/v1/object/public/")) {
        // Format: https://xxx.supabase.co/storage/v1/object/public/bucket-name/path/to/file
        const urlParts = version.file_url.split("/storage/v1/object/public/");
        if (urlParts.length > 1) {
          const pathAfterBucket = urlParts[1];
          const pathParts = pathAfterBucket.split("/");
          if (pathParts[0] === "dossier-documents") {
            filePath = pathParts.slice(1).join("/");
          } else {
            filePath = pathAfterBucket;
          }
        } else {
          throw new Error("Format d'URL invalide");
        }
      } else if (version.file_url.includes("/storage/v1/object/sign/")) {
        // If it's a signed URL, extract the path
        const url = new URL(version.file_url);
        const pathMatch = url.pathname.match(/\/storage\/v1\/object\/sign\/[^/]+\/(.+)/);
        if (pathMatch) {
          filePath = decodeURIComponent(pathMatch[1]);
        } else {
          throw new Error("Impossible d'extraire le chemin depuis l'URL signée");
        }
      } else {
        // Assume it's already a relative path
        filePath = version.file_url;
      }

      console.log("[DOWNLOAD DOC] Extracted file path:", filePath);
    } catch (error) {
      console.error("[DOWNLOAD DOC] Error extracting file path:", error);
      return NextResponse.json(
        { error: "Format d'URL de fichier invalide" },
        { status: 400 }
      );
    }

    // Create a signed URL that expires in 1 hour
    const adminClient = createAdminClient();
    const { data: signedUrlData, error: signedUrlError } = await adminClient.storage
      .from("dossier-documents")
      .createSignedUrl(filePath, 3600); // 1 hour expiration

    if (signedUrlError || !signedUrlData) {
      console.error("[DOWNLOAD DOC] Error creating signed URL:", signedUrlError);
      return NextResponse.json(
        { error: "Erreur lors de la génération du lien de téléchargement" },
        { status: 500 }
      );
    }

    // Redirect to the signed URL
    return NextResponse.redirect(signedUrlData.signedUrl);
  } catch (error) {
    console.error("Error in download document endpoint:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
