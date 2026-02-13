"use client";

import { useState } from "react";
import { useApi } from "@/lib/api/useApi";
import { DocumentType } from "@/lib/workflow";
import { DocumentInfoPanel } from "@/components/ui/DocumentInfoPanel";
import { DocumentInfoButton } from "@/components/ui/DocumentInfoButton";

interface UploadedDocument {
  id: string;
  document_type_id: string;
  file_name: string;
  file_url: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  created_at: string;
}

interface StepDocumentsProps {
  dossierId: string;
  stepInstanceId: string;
  requiredDocuments: DocumentType[];
  uploadedDocuments: UploadedDocument[];
  onDocumentUploaded: () => void;
}

export function StepDocuments({
  dossierId,
  stepInstanceId,
  requiredDocuments,
  uploadedDocuments,
  onDocumentUploaded,
}: StepDocumentsProps) {
  const api = useApi();
  const [uploading, setUploading] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [activeDocumentTypeId, setActiveDocumentTypeId] = useState<string | null>(null);

  const handleFileUpload = async (documentType: DocumentType, file: File) => {
    setUploading(documentType.id);
    setUploadError(null);

    try {
      // Validate file size
      const maxSizeBytes = documentType.max_file_size_mb * 1024 * 1024;
      if (file.size > maxSizeBytes) {
        throw new Error(
          `File size exceeds maximum of ${documentType.max_file_size_mb}MB`
        );
      }

      // Validate file extension
      const fileExtension = file.name.split(".").pop()?.toLowerCase();
      if (
        !fileExtension ||
        !documentType.allowed_extensions.includes(fileExtension)
      ) {
        throw new Error(
          `Invalid file type. Allowed: ${documentType.allowed_extensions.join(", ")}`
        );
      }

      // Create form data
      const formData = new FormData();
      formData.append("file", file);
      formData.append("dossier_id", dossierId);
      formData.append("document_type_id", documentType.id);
      formData.append("step_instance_id", stepInstanceId);

      await api.post("/api/workflow/upload-document", formData);

      // Wait a bit to ensure database is updated, then refresh documents list
      await new Promise((resolve) => setTimeout(resolve, 500));
      onDocumentUploaded();
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setUploading(null);
    }
  };

  const getDocumentStatus = (documentTypeId: string) => {
    return uploadedDocuments.find(
      (doc) => doc.document_type_id === documentTypeId
    );
  };

  const openDocumentInfo = (documentTypeId: string) => {
    setActiveDocumentTypeId(documentTypeId);
  };

  const closeDocumentInfo = () => {
    setActiveDocumentTypeId(null);
  };

  const activeDocumentType = requiredDocuments.find(
    (doc) => doc.id === activeDocumentTypeId
  );

  if (requiredDocuments.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-brand-text-primary">
        Required Documents
      </h3>

      {uploadError && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-400 text-sm">
          {uploadError}
        </div>
      )}

      <div className="space-y-3">
        {requiredDocuments.map((docType) => {
          const uploadedDoc = getDocumentStatus(docType.id);
          const isUploading = uploading === docType.id;

          return (
            <div
              key={docType.id}
              className="border border-brand-border rounded-lg p-4 bg-brand-card"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-brand-text-primary">
                      {docType.label}
                    </h4>
                    <DocumentInfoButton
                      onClick={() => openDocumentInfo(docType.id)}
                      hasDescription={!!docType.description}
                    />
                    {uploadedDoc && (
                      <span
                        className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                          uploadedDoc.status === "APPROVED"
                            ? "bg-green-500/10 text-green-400"
                            : uploadedDoc.status === "REJECTED"
                              ? "bg-red-500/10 text-red-400"
                              : "bg-yellow-500/10 text-yellow-400"
                        }`}
                      >
                        {uploadedDoc.status}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-brand-text-secondary mt-2">
                    Max size: {docType.max_file_size_mb}MB • Formats:{" "}
                    {docType.allowed_extensions.join(", ")}
                  </div>

                  {uploadedDoc && (
                    <div className="mt-2 text-sm">
                      <a
                        href={uploadedDoc.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-brand-accent hover:underline flex items-center gap-1"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                          />
                        </svg>
                        {uploadedDoc.file_name}
                      </a>
                    </div>
                  )}
                </div>

                <div>
                  {isUploading ? (
                    <div className="px-4 py-2 text-sm text-brand-text-secondary">
                      Uploading...
                    </div>
                  ) : (
                    <label className="px-4 py-2 bg-brand-accent text-white rounded-lg hover:bg-brand-accent/90 transition-colors cursor-pointer text-sm font-medium inline-block">
                      {uploadedDoc ? "Remplacer" : "Téléverser"}
                      <input
                        type="file"
                        accept={docType.allowed_extensions
                          .map((ext) => `.${ext}`)
                          .join(",")}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleFileUpload(docType, file);
                          }
                          e.target.value = "";
                        }}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Info Panel */}
      {activeDocumentType?.description && (
        <DocumentInfoPanel
          description={activeDocumentType.description}
          isOpen={activeDocumentTypeId !== null}
          onClose={closeDocumentInfo}
          documentName={activeDocumentType.label}
        />
      )}
    </div>
  );
}
