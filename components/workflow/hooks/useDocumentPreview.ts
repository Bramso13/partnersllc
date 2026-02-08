import { useState } from "react";
import { toast } from "sonner";
import type { UseDocumentPreviewReturn } from "../types";

/**
 * Custom hook to manage document preview modal state and blob loading.
 *
 * @param dossierId - The ID of the dossier to fetch documents from
 * @returns Document preview state and handlers
 *
 * @example
 * const preview = useDocumentPreview(dossierId);
 * <button onClick={() => preview.handleViewDocument(doc)}>Preview</button>
 * <DocumentPreviewModal {...preview} />
 */
export function useDocumentPreview(
  dossierId: string
): UseDocumentPreviewReturn {
  const [showPreview, setShowPreview] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewDocument, setPreviewDocument] = useState<any>(null);

  const handleViewDocument = async (doc: any) => {
    try {
      setPreviewLoading(true);
      setShowPreview(true);
      setPreviewDocument(doc);

      // Fetch document blob from API
      const viewUrl = `/api/dossiers/${dossierId}/documents/${doc.id}/download`;
      const response = await fetch(viewUrl);

      if (!response.ok) {
        throw new Error("Erreur lors du chargement du document");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
    } catch (err) {
      console.error("Error viewing document:", err);
      toast.error(
        err instanceof Error
          ? err.message
          : "Erreur lors du chargement du document"
      );
      setShowPreview(false);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleClosePreview = () => {
    // Clean up object URL to prevent memory leaks
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setShowPreview(false);
    setPreviewDocument(null);
  };

  return {
    showPreview,
    previewUrl,
    previewLoading,
    previewDocument,
    handleViewDocument,
    handleClosePreview,
  };
}
