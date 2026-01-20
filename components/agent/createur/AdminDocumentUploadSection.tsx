"use client";

import { useState } from "react";
import { Upload, FileText, CheckCircle, Clock } from "lucide-react";
import type { CreateurStepDetails } from "@/lib/agent-steps";

interface AdminDocumentUploadSectionProps {
  stepInstanceId: string;
  adminDocuments: CreateurStepDetails["admin_documents"];
  agentId: string;
}

export function AdminDocumentUploadSection({
  stepInstanceId,
  adminDocuments,
  agentId,
}: AdminDocumentUploadSectionProps) {
  const [uploading, setUploading] = useState<string | null>(null);

  const handleFileUpload = async (documentTypeId: string, file: File) => {
    setUploading(documentTypeId);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('document_type_id', documentTypeId);
      formData.append('step_instance_id', stepInstanceId);

      const response = await fetch('/api/agent/admin-documents/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      // Refresh the page to show updated state
      window.location.reload();
    } catch (error) {
      console.error('Upload error:', error);
      alert('Erreur lors de l\'upload du document');
    } finally {
      setUploading(null);
    }
  };

  const handleDeliver = async (documentId: string) => {
    try {
      const response = await fetch(`/api/agent/admin-documents/${documentId}/deliver`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Delivery failed');
      }

      // Refresh the page to show updated state
      window.location.reload();
    } catch (error) {
      console.error('Delivery error:', error);
      alert('Erreur lors de la livraison du document');
    }
  };

  const getStatusInfo = (document: CreateurStepDetails["admin_documents"][0]["document"]) => {
    if (!document) {
      return { label: "Non uploadé", color: "#6B7280", icon: Clock };
    }
    if (document.status === "DELIVERED") {
      return { label: "Livré", color: "#22C55E", icon: CheckCircle };
    }
    return { label: "Uploadé", color: "#3B82F6", icon: FileText };
  };

  return (
    <div className="border border-[#363636] rounded-xl bg-[#191A1D] p-6">
      <h3 className="text-lg font-semibold text-brand-text-primary mb-6">
        Documents à Créer et Livrer
      </h3>

      <div className="space-y-4">
        {adminDocuments.map((docItem) => {
          const statusInfo = getStatusInfo(docItem.document);
          const StatusIcon = statusInfo.icon;
          const isUploading = uploading === docItem.document_type.id;

          return (
            <div key={docItem.document_type.id} className="border border-[#363636] rounded-lg bg-[#1A1B1E] p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-brand-text-secondary" />
                  <div>
                    <h4 className="text-brand-text-primary font-medium">
                      {docItem.document_type.label}
                    </h4>
                    {docItem.document_type.description && (
                      <p className="text-brand-text-secondary text-sm">
                        {docItem.document_type.description}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <StatusIcon
                    className="w-4 h-4"
                    style={{ color: statusInfo.color }}
                  />
                  <span
                    className="text-xs px-2 py-1 rounded"
                    style={{
                      backgroundColor: `${statusInfo.color}20`,
                      color: statusInfo.color,
                      border: `1px solid ${statusInfo.color}30`
                    }}
                  >
                    {statusInfo.label}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {!docItem.document ? (
                  // Zone d'upload
                  <div className="flex-1">
                    <label className="block">
                      <div className="border-2 border-dashed border-[#363636] rounded-lg p-4 text-center cursor-pointer hover:border-brand-text-secondary transition-colors">
                        <Upload className="w-8 h-8 mx-auto mb-2 text-brand-text-secondary" />
                        <p className="text-brand-text-secondary text-sm mb-1">
                          Glisser-déposer un fichier ici ou cliquer pour sélectionner
                        </p>
                        <p className="text-brand-text-secondary text-xs">
                          PDF, DOC, DOCX (max 10MB)
                        </p>
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept=".pdf,.doc,.docx"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleFileUpload(docItem.document_type.id, file);
                          }
                        }}
                        disabled={isUploading}
                      />
                    </label>
                  </div>
                ) : (
                  // Document uploadé
                  <div className="flex-1 flex items-center justify-between bg-[#2A2B2F] rounded-lg p-3">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-brand-text-secondary" />
                      <div>
                        <p className="text-brand-text-primary text-sm font-medium">
                          {docItem.document.current_version.file_name}
                        </p>
                        <p className="text-brand-text-secondary text-xs">
                          Uploadé le {new Date(docItem.document.current_version.uploaded_at).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => window.open(docItem.document!.current_version.file_url, '_blank')}
                        className="px-3 py-1 text-xs bg-[#363636] hover:bg-[#404040] text-brand-text-primary rounded transition-colors"
                      >
                        Voir
                      </button>
                      {docItem.document.status !== "DELIVERED" && (
                        <>
                          <button className="px-3 py-1 text-xs bg-[#363636] hover:bg-[#404040] text-brand-text-primary rounded transition-colors">
                            Remplacer
                          </button>
                          <button
                            onClick={() => handleDeliver(docItem.document!.id)}
                            className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                          >
                            Livrer au client
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}