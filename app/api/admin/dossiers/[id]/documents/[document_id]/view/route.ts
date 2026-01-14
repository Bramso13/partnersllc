import { requireAdminAuth } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

/**
 * Route API pour servir un document avec les droits admin
 * Extrait le fichier du bucket sécurisé et le renvoie avec les headers appropriés
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; document_id: string }> }
) {
  try {
    await requireAdminAuth();
    const { id: dossierId, document_id } = await params;

    const supabase = await createAdminClient();

    // Vérifier que le document appartient à ce dossier
    const { data: document, error: verifyError } = await supabase
      .from("documents")
      .select("id, dossier_id, current_version_id")
      .eq("id", document_id)
      .single();

    if (verifyError || !document) {
      console.error("[VIEW DOC] Document not found:", document_id, verifyError);
      return NextResponse.json(
        { error: "Document non trouvé" },
        { status: 404 }
      );
    }

    if (document.dossier_id !== dossierId) {
      console.error("[VIEW DOC] Document belongs to different dossier:", {
        document_id,
        expected_dossier: dossierId,
        actual_dossier: document.dossier_id,
      });
      return NextResponse.json(
        { error: "Document non autorisé pour ce dossier" },
        { status: 403 }
      );
    }

    if (!document.current_version_id) {
      console.error("[VIEW DOC] Document has no current_version_id:", document_id);
      return NextResponse.json(
        { error: "Le document n'a pas de version courante" },
        { status: 400 }
      );
    }

    // Récupérer la version du document
    const { data: version, error: versionError } = await supabase
      .from("document_versions")
      .select("file_url, file_name, mime_type")
      .eq("id", document.current_version_id)
      .single();

    if (versionError || !version) {
      console.error("[VIEW DOC] Version not found:", document.current_version_id, versionError);
      return NextResponse.json(
        { error: "Version du document non trouvée" },
        { status: 404 }
      );
    }

    // Extraire le chemin du fichier depuis file_url
    // file_url est stocké comme une URL publique Supabase: 
    // https://xxx.supabase.co/storage/v1/object/public/bucket-name/path/to/file
    let filePath: string;
    
    try {
      // Si c'est une URL complète, extraire le chemin
      if (version.file_url.includes("/storage/v1/object/public/")) {
        // Format: https://xxx.supabase.co/storage/v1/object/public/bucket-name/path/to/file
        const urlParts = version.file_url.split("/storage/v1/object/public/");
        if (urlParts.length > 1) {
          const pathAfterBucket = urlParts[1];
          // Enlever le nom du bucket (dossier-documents) et prendre le reste
          const pathParts = pathAfterBucket.split("/");
          if (pathParts[0] === "dossier-documents") {
            filePath = pathParts.slice(1).join("/");
          } else {
            // Si le bucket n'est pas dans l'URL, prendre tout après le bucket
            filePath = pathAfterBucket;
          }
        } else {
          throw new Error("Format d'URL invalide");
        }
      } else if (version.file_url.includes("/storage/v1/object/sign/")) {
        // Si c'est une signed URL, extraire le chemin depuis l'URL
        const url = new URL(version.file_url);
        const pathMatch = url.pathname.match(/\/storage\/v1\/object\/sign\/[^/]+\/(.+)/);
        if (pathMatch) {
          filePath = decodeURIComponent(pathMatch[1]);
        } else {
          throw new Error("Impossible d'extraire le chemin depuis l'URL signée");
        }
      } else {
        // Si ce n'est pas une URL complète, utiliser directement comme chemin relatif
        // (cas où file_url serait déjà un chemin relatif)
        filePath = version.file_url;
      }

      console.log("[VIEW DOC] Extracted file path:", filePath);
    } catch (error) {
      console.error("[VIEW DOC] Error extracting file path:", error);
      return NextResponse.json(
        { error: "Format d'URL de fichier invalide" },
        { status: 400 }
      );
    }

    // Télécharger le fichier depuis le bucket avec les droits admin
    const { data: fileData, error: downloadError } = await supabase.storage
      .from("dossier-documents")
      .download(filePath);

    if (downloadError || !fileData) {
      console.error("[VIEW DOC] Error downloading file:", downloadError);
      return NextResponse.json(
        { error: "Erreur lors du téléchargement du fichier" },
        { status: 500 }
      );
    }

    // Convertir le Blob en ArrayBuffer puis en Buffer
    const arrayBuffer = await fileData.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Déterminer le Content-Type
    const contentType = version.mime_type || "application/octet-stream";

    // Renvoyer le fichier avec les headers appropriés
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `inline; filename="${version.file_name || "document"}"`,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (error) {
    console.error("Error in view document endpoint:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
