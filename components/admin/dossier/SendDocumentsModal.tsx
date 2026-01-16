"use client";

import { useState, useEffect } from "react";
import { DocumentType } from "@/types/products";

interface SendDocumentsModalProps {
  dossierId: string;
  productId: string;
  stepInstanceId?: string;
  stepName?: string;
  onClose: () => void;
  onSuccess: () => void;
}

interface SelectedFile {
  file: File;
  id: string;
  progress: number;
  error?: string;
}

const MAX_FILE_SIZE_MB = 10;
const ALLOWED_TYPES = ["pdf", "jpg", "jpeg", "png"];

export function SendDocumentsModal({
  dossierId,
  productId,
  stepInstanceId,
  stepName,
  onClose,
  onSuccess,
}: SendDocumentsModalProps) {
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  const [selectedDocumentTypeIds, setSelectedDocumentTypeIds] = useState<string[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch document types for product/step
  useEffect(() => {
    const fetchDocumentTypes = async () => {
      try {
        // For now, fetch all document types - can be enhanced later with step-specific types
        const response = await fetch(`/api/admin/document-types`);
        if (response.ok) {
          const data = await response.json();
          setDocumentTypes(data.document_types || []);
        }
      } catch (err) {
        console.error("Error fetching document types:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDocumentTypes();
  }, [dossierId, productId, stepInstanceId]);

  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      return `Le fichier dépasse la taille maximale de ${MAX_FILE_SIZE_MB}MB`;
    }

    // Check file extension
    const extension = file.name.split(".").pop()?.toLowerCase();
    if (!extension || !ALLOWED_TYPES.includes(extension)) {
      return `Type de fichier non autorisé. Types autorisés: ${ALLOWED_TYPES.join(", ")}`;
    }

    return null;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newFiles: SelectedFile[] = [];

    files.forEach((file) => {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }

      newFiles.push({
        file,
        id: `${Date.now()}-${Math.random()}`,
        progress: 0,
      });
    });

    setSelectedFiles((prev) => [...prev, ...newFiles]);
    setError(null);
    e.target.value = ""; // Reset input
  };

  const removeFile = (fileId: string) => {
    setSelectedFiles((prev) => prev.filter((f) => f.id !== fileId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (selectedFiles.length === 0) {
      setError("Veuillez sélectionner au moins un fichier");
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      selectedFiles.forEach((sf) => {
        formData.append("files", sf.file);
      });

      if (stepInstanceId) {
        formData.append("step_instance_id", stepInstanceId);
      }

      if (selectedDocumentTypeIds.length > 0) {
        selectedDocumentTypeIds.forEach((id) => {
          formData.append("document_type_ids[]", id);
        });
      } else {
        // If no document types selected, we'll use a generic one in the API
      }

      if (message.trim()) {
        formData.append("message", message.trim());
      }

      const response = await fetch(`/api/admin/dossiers/${dossierId}/send-documents`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de l'envoi des documents");
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur s'est produite");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-brand-card border border-brand-border rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-brand-border flex items-center justify-between sticky top-0 bg-brand-card z-10">
          <div>
            <h2 className="text-xl font-semibold text-brand-text-primary">
              Envoyer des documents
            </h2>
            {stepName && (
              <p className="text-sm text-brand-text-secondary mt-1">
                Pour l'étape: {stepName}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-brand-text-secondary hover:text-brand-text-primary text-2xl leading-none"
            disabled={isSubmitting}
          >
            ×
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Document Type Selector (optional) */}
          {!loading && documentTypes.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-brand-text-primary mb-2">
                Types de documents (optionnel)
              </label>
              <div className="space-y-2 max-h-40 overflow-y-auto border border-brand-border rounded-lg p-3">
                {documentTypes.map((docType) => (
                  <label
                    key={docType.id}
                    className="flex items-center gap-2 cursor-pointer hover:bg-brand-dark-bg/50 p-2 rounded"
                  >
                    <input
                      type="checkbox"
                      checked={selectedDocumentTypeIds.includes(docType.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedDocumentTypeIds((prev) => [...prev, docType.id]);
                        } else {
                          setSelectedDocumentTypeIds((prev) =>
                            prev.filter((id) => id !== docType.id)
                          );
                        }
                      }}
                      className="rounded"
                    />
                    <span className="text-sm text-brand-text-primary">{docType.label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-brand-text-primary mb-2">
              Fichiers <span className="text-red-400">*</span>
            </label>
            <div className="border-2 border-dashed border-brand-border rounded-lg p-6 text-center hover:border-brand-accent/50 transition-colors">
              <input
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
                disabled={isSubmitting}
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer flex flex-col items-center gap-2"
              >
                <i className="fas fa-cloud-upload-alt text-3xl text-brand-text-secondary"></i>
                <span className="text-brand-text-primary font-medium">
                  Cliquez pour sélectionner des fichiers
                </span>
                <span className="text-sm text-brand-text-secondary">
                  PDF, JPG, PNG (max {MAX_FILE_SIZE_MB}MB par fichier)
                </span>
              </label>
            </div>

            {/* Selected Files List */}
            {selectedFiles.length > 0 && (
              <div className="mt-4 space-y-2">
                {selectedFiles.map((sf) => (
                  <div
                    key={sf.id}
                    className="flex items-center justify-between p-3 bg-brand-dark-bg rounded-lg"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <i className="fas fa-file text-brand-text-secondary"></i>
                      <span className="text-sm text-brand-text-primary truncate">
                        {sf.file.name}
                      </span>
                      <span className="text-xs text-brand-text-secondary">
                        ({(sf.file.size / 1024 / 1024).toFixed(2)} MB)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(sf.id)}
                      className="text-red-400 hover:text-red-300 ml-2"
                      disabled={isSubmitting}
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Message */}
          <div>
            <label className="block text-sm font-medium text-brand-text-primary mb-2">
              Message (optionnel)
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Ajoutez un message pour accompagner les documents..."
              rows={3}
              className="w-full px-3 py-2 bg-brand-dark-bg border border-brand-border rounded-lg text-brand-text-primary placeholder-brand-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-brand-accent resize-none"
              disabled={isSubmitting}
            />
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-brand-border">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 border border-brand-border rounded-lg text-brand-text-primary hover:bg-brand-dark-bg/50 transition-colors disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting || selectedFiles.length === 0}
              className="px-4 py-2 bg-brand-accent text-white rounded-lg hover:bg-brand-accent/90 transition-colors disabled:opacity-50 font-medium"
            >
              {isSubmitting ? "Envoi en cours..." : "Envoyer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
