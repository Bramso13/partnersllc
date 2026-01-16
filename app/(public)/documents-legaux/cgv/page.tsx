import { Metadata } from "next";
import { readFile } from "fs/promises";
import { join } from "path";
import { LegalDocumentViewer } from "@/components/legal/LegalDocumentViewer";

export const metadata: Metadata = {
  title: "Conditions Générales de Vente - Partners LLC",
  description: "Conditions Générales de Vente et de Prestation de Services",
};

export default async function CGVPage() {
  // Read the CGV file
  const filePath = join(process.cwd(), "doc_leg", "cgv.txt");
  let content = "";

  try {
    content = await readFile(filePath, "utf-8");
  } catch (error) {
    content = "Document non disponible pour le moment.";
  }

  return (
    <LegalDocumentViewer
      title="Conditions Générales de Vente"
      subtitle="Conditions Générales de Vente et de Prestation de Services"
      content={content}
    />
  );
}
