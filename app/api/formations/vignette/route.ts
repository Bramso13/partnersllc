import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getAccessibleFormations } from "@/lib/formations";

const BUCKET = "formation-images";

/**
 * Valide et sécurise le path de la vignette
 * - Doit commencer par "vignettes/"
 * - Pas de path traversal (..)
 * - Pas de slash initial
 * - Format strict: vignettes/[filename].[ext]
 */
function isPathAllowed(path: string | null): path is string {
  if (!path || typeof path !== "string" || path.length > 500) return false;
  // Pas de path traversal
  if (path.includes("..") || path.startsWith("/")) return false;
  // Doit être dans le dossier vignettes avec un nom de fichier valide
  if (!path.startsWith("vignettes/")) return false;
  // Pas de sous-dossiers (un seul niveau sous vignettes/)
  const parts = path.split("/");
  if (parts.length !== 2) return false;
  // Nom de fichier: alphanumerique, tirets, underscores, point pour l'extension
  const filename = parts[1];
  if (!/^[a-zA-Z0-9_.-]+\.[a-zA-Z0-9]+$/.test(filename)) return false;
  return true;
}

/**
 * GET /api/formations/vignette?path=vignettes/xxx.png
 *
 * Sert une vignette de formation depuis Supabase Storage.
 * Sécurité:
 * - Authentification requise
 * - Path validé (vignettes/* uniquement, pas de path traversal)
 * - Vérification que l'utilisateur a accès à une formation utilisant cette vignette
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const path = searchParams.get("path");

    if (!isPathAllowed(path)) {
      return NextResponse.json({ error: "Invalid or missing path" }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    // Vérifier que cette vignette est utilisée par une formation accessible à l'utilisateur
    const formations = await getAccessibleFormations(user.id);
    const formationWithVignette = formations.find((f) => f.vignette_path === path);

    if (!formationWithVignette) {
      return NextResponse.json({ error: "Access denied or vignette not found" }, { status: 403 });
    }

    // Télécharger depuis Storage (admin client pour contourner RLS si bucket privé)
    const adminSupabase = createAdminClient();
    const { data: fileData, error: storageError } = await adminSupabase.storage
      .from(BUCKET)
      .download(path);

    if (storageError || !fileData) {
      console.error("[GET /api/formations/vignette] Storage error:", storageError);
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const arrayBuffer = await fileData.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Déduire le Content-Type depuis l'extension
    const ext = path.split(".").pop()?.toLowerCase();
    const mimeTypes: Record<string, string> = {
      png: "image/png",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      gif: "image/gif",
      webp: "image/webp",
      svg: "image/svg+xml",
    };
    const contentType = mimeTypes[ext || ""] || "application/octet-stream";

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `inline; filename="${path.split("/").pop()}"`,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (error) {
    console.error("[GET /api/formations/vignette] Unexpected error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
