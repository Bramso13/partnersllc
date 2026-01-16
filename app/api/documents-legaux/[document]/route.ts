import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ document: string }> }
) {
  try {
    const { document } = await params;

    // Valider le nom du document
    if (document !== "cgv" && document !== "refund_policy") {
      return NextResponse.json(
        { error: "Document non trouvé" },
        { status: 404 }
      );
    }

    // Mapper les noms de documents aux fichiers
    const fileMap: Record<string, string> = {
      cgv: "cgv.txt",
      refund_policy: "refund_policy.txt",
    };

    const fileName = fileMap[document];
    const filePath = join(process.cwd(), "doc_leg", fileName);

    // Lire le fichier
    const content = await readFile(filePath, "utf-8");

    return NextResponse.json({ content });
  } catch (error) {
    console.error("Error reading document:", error);
    return NextResponse.json(
      { error: "Erreur lors de la lecture du document" },
      { status: 500 }
    );
  }
}
