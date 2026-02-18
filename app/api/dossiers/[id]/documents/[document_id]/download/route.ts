import { requireAuth } from "@/lib/auth";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

function sanitizeFilename(name: string): string {
  return name.replace(/["\\\r\n]/g, "_");
}

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

    // Extract bucket and file path from file_url
    // file_url can be:
    // 1. Full public URL: https://xxx.supabase.co/storage/v1/object/public/bucket-name/path/to/file
    // 2. Signed URL: https://xxx.supabase.co/storage/v1/object/sign/...
    // 3. Relative path: "documents/dossierId/code/1.pdf" (bucket "documents") or "admin/xxx.pdf" (bucket "dossier-documents")
    const knownBuckets = ["dossier-documents", "documents"];
    let bucket = "dossier-documents";
    let filePath: string;

    try {
      if (version.file_url.includes("/storage/v1/object/public/")) {
        const urlParts = version.file_url.split("/storage/v1/object/public/");
        if (urlParts.length > 1) {
          const pathAfterBucket = urlParts[1];
          const pathParts = pathAfterBucket.split("/");
          if (pathParts.length > 1 && knownBuckets.includes(pathParts[0])) {
            bucket = pathParts[0];
            filePath = pathParts.slice(1).join("/");
          } else if (pathParts[0] === "dossier-documents") {
            filePath = pathParts.slice(1).join("/");
          } else {
            filePath = pathAfterBucket;
          }
        } else {
          throw new Error("Format d'URL invalide");
        }
      } else if (version.file_url.includes("/storage/v1/object/sign/")) {
        const url = new URL(version.file_url);
        const pathMatch = url.pathname.match(
          /\/storage\/v1\/object\/sign\/[^/]+\/(.+)/
        );
        if (pathMatch) {
          const fullPath = decodeURIComponent(pathMatch[1]);
          const pathParts = fullPath.split("/");
          if (pathParts.length > 1 && knownBuckets.includes(pathParts[0])) {
            bucket = pathParts[0];
            filePath = pathParts.slice(1).join("/");
          } else {
            filePath = fullPath;
          }
        } else {
          throw new Error("Impossible d'extraire le chemin depuis l'URL signée");
        }
      } else {
        // Relative path: client uploads use "documents/dossierId/code/1.ext" in bucket "documents"
        filePath = version.file_url;
        if (filePath.startsWith("documents/")) {
          bucket = "documents";
        }
        // else: "admin/..." or other => bucket stays "dossier-documents"
      }
    } catch (error) {
      console.error("[DOWNLOAD DOC] Error extracting file path:", error);
      return NextResponse.json(
        { error: "Format d'URL de fichier invalide" },
        { status: 400 }
      );
    }

    // Download file from storage and stream it back (no redirect)
    const adminClient = createAdminClient();
    let blob: Blob | null = null;
    let downloadError: { message: string } | null = null;

    const result = await adminClient.storage.from(bucket).download(filePath);
    blob = result.data;
    downloadError = result.error;

    // If not found in first bucket, try the other (legacy data may differ)
    if (downloadError?.message?.includes("Object not found") && knownBuckets.includes(bucket)) {
      const otherBucket = bucket === "dossier-documents" ? "documents" : "dossier-documents";
      const fallback = await adminClient.storage.from(otherBucket).download(filePath);
      if (!fallback.error && fallback.data) {
        blob = fallback.data;
        downloadError = null;
      }
    }

    if (downloadError || !blob) {
      console.error("[DOWNLOAD DOC] Error downloading file:", {
        bucket,
        filePath,
        error: downloadError,
      });
      return NextResponse.json(
        { error: "Erreur lors du téléchargement du document" },
        { status: 500 }
      );
    }

    const fileName =
      version.file_name || filePath.split("/").pop() || "document";
    const mimeType = version.mime_type || "application/octet-stream";

    return new NextResponse(blob, {
      status: 200,
      headers: {
        "Content-Type": mimeType,
        "Content-Disposition": `inline; filename="${sanitizeFilename(fileName)}"`,
      },
    });
  } catch (error) {
    console.error("Error in download document endpoint:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
