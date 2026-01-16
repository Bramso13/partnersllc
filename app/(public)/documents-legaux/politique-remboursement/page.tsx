import { Metadata } from "next";
import { readFile } from "fs/promises";
import { join } from "path";
import { LegalDocumentViewer } from "@/components/legal/LegalDocumentViewer";

export const metadata: Metadata = {
  title: "Politique de Remboursement - Partners LLC",
  description: "Politique de Remboursement et d'Annulation",
};

export default async function RefundPolicyPage() {
  // Read the refund policy file
  const filePath = join(process.cwd(), "doc_leg", "refund_policy.txt");
  let content = "";

  try {
    content = await readFile(filePath, "utf-8");
  } catch (error) {
    content = "Document non disponible pour le moment.";
  }

  return (
    <LegalDocumentViewer
      title="Politique de Remboursement"
      subtitle="Politique de Remboursement et d'Annulation"
      content={content}
    />
  );
}
