"use client";

import { useRef, useState } from "react";
import {
  Upload,
  FileText,
  CheckCircle,
  Clock,
  Loader2,
  AlertCircle,
  X,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import type { CreateurStepDetails } from "@/lib/agent-steps";
import { revalidateDossier } from "@/app/actions/revalidate-dossier";

interface AdminDocumentUploadSectionProps {
  stepInstanceId: string;
  adminDocuments: CreateurStepDetails["admin_documents"];
  agentId: string;
  dossierId: string;
}

type UploadStatus = {
  documentTypeId: string;
  status: "uploading" | "success" | "error";
  progress: number;
  message: string;
  fileName?: string;
};

type DeliveryStatus = {
  documentId: string;
  status: "delivering" | "success" | "error";
  message: string;
};

type DeleteStatus = {
  documentId: string;
  status: "deleting" | "success" | "error";
  message: string;
};

export function AdminDocumentUploadSection({
  stepInstanceId,
  adminDocuments,
  agentId,
  dossierId,
}: AdminDocumentUploadSectionProps) {
  const router = useRouter();
  const [uploadStatus, setUploadStatus] = useState<UploadStatus | null>(null);
  const [deliveryStatus, setDeliveryStatus] = useState<DeliveryStatus | null>(
    null
  );
  const [deleteStatus, setDeleteStatus] = useState<DeleteStatus | null>(null);
  const [replaceTarget, setReplaceTarget] = useState<{
    documentTypeId: string;
    documentTypeLabel: string;
  } | null>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (
    documentTypeId: string,
    documentTypeLabel: string,
    file: File
  ) => {
    // Validation de la taille du fichier
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      setUploadStatus({
        documentTypeId,
        status: "error",
        progress: 0,
        message: "Le fichier est trop volumineux (max 10MB)",
        fileName: file.name,
      });
      setTimeout(() => setUploadStatus(null), 5000);
      return;
    }

    // Validation du type de fichier
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (!allowedTypes.includes(file.type)) {
      setUploadStatus({
        documentTypeId,
        status: "error",
        progress: 0,
        message: "Type de fichier non autorisé (PDF, DOC, DOCX uniquement)",
        fileName: file.name,
      });
      setTimeout(() => setUploadStatus(null), 5000);
      return;
    }

    setUploadStatus({
      documentTypeId,
      status: "uploading",
      progress: 0,
      message: `Préparation de l'upload de "${file.name}"...`,
      fileName: file.name,
    });

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("document_type_id", documentTypeId);
      formData.append("step_instance_id", stepInstanceId);

      // Simulation de progression pour une meilleure UX
      const progressInterval = setInterval(() => {
        setUploadStatus((prev) =>
          prev && prev.status === "uploading"
            ? {
                ...prev,
                progress: Math.min(prev.progress + 10, 90),
                message:
                  prev.progress < 30
                    ? `Upload de "${file.name}" en cours...`
                    : prev.progress < 60
                      ? `Envoi des données au serveur...`
                      : `Finalisation de l'upload...`,
              }
            : prev
        );
      }, 300);

      const response = await fetch("/api/agent/admin-documents/upload", {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ error: "Upload failed" }));
        throw new Error(errorData.error || "Upload échoué");
      }

      const result = await response.json();

      setUploadStatus({
        documentTypeId,
        status: "success",
        progress: 100,
        message: `✓ "${file.name}" uploadé avec succès pour ${documentTypeLabel}`,
        fileName: file.name,
      });

      // Revalider les données du dossier et attendre un peu avant de fermer le modal
      await revalidateDossier(dossierId);

      setTimeout(() => {
        setUploadStatus(null);
        router.refresh();
      }, 1500);
    } catch (error) {
      console.error("Upload error:", error);
      setUploadStatus({
        documentTypeId,
        status: "error",
        progress: 0,
        message:
          error instanceof Error
            ? error.message
            : "Erreur lors de l'upload du document",
        fileName: file.name,
      });
      setTimeout(() => setUploadStatus(null), 5000);
    }
  };

  const handleClearVersion = async (
    documentId: string,
    documentTypeLabel: string
  ) => {
    setDeleteStatus({
      documentId,
      status: "deleting",
      message: `Suppression du document "${documentTypeLabel}"...`,
    });
    try {
      const response = await fetch(
        `/api/agent/admin-documents/${documentId}/clear-version`,
        {
          method: "PATCH",
        }
      );
      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ error: "Suppression échouée" }));
        throw new Error(errorData.error || "Suppression échouée");
      }
      setDeleteStatus({
        documentId,
        status: "success",
        message: `✓ Document "${documentTypeLabel}" supprimé. Vous pouvez déposer un nouveau fichier.`,
      });
      await revalidateDossier(dossierId);
      setTimeout(() => {
        setDeleteStatus(null);
        router.refresh();
      }, 1500);
    } catch (error) {
      console.error("Clear version error:", error);
      setDeleteStatus({
        documentId,
        status: "error",
        message:
          error instanceof Error
            ? error.message
            : "Erreur lors de la suppression du document",
      });
      setTimeout(() => setDeleteStatus(null), 5000);
    }
  };

  const handleDeliver = async (
    documentId: string,
    documentTypeLabel: string
  ) => {
    setDeliveryStatus({
      documentId,
      status: "delivering",
      message: `Livraison du document "${documentTypeLabel}" au client...`,
    });

    try {
      const response = await fetch(
        `/api/agent/admin-documents/${documentId}/deliver`,
        {
          method: "POST",
        }
      );

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ error: "Delivery failed" }));
        throw new Error(errorData.error || "Livraison échouée");
      }

      setDeliveryStatus({
        documentId,
        status: "success",
        message: `✓ Document "${documentTypeLabel}" livré au client avec succès`,
      });

      // Revalider les données du dossier
      await revalidateDossier(dossierId);

      setTimeout(() => {
        setDeliveryStatus(null);
        router.refresh();
      }, 1500);
    } catch (error) {
      console.error("Delivery error:", error);
      setDeliveryStatus({
        documentId,
        status: "error",
        message:
          error instanceof Error
            ? error.message
            : "Erreur lors de la livraison du document",
      });
      setTimeout(() => setDeliveryStatus(null), 5000);
    }
  };

  const getStatusInfo = (
    document: CreateurStepDetails["admin_documents"][0]["document"]
  ) => {
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

      {/* Modal de statut d'upload */}
      {uploadStatus && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#191A1D] border border-[#363636] rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                {uploadStatus.status === "uploading" && (
                  <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                )}
                {uploadStatus.status === "success" && (
                  <CheckCircle className="w-6 h-6 text-green-500" />
                )}
                {uploadStatus.status === "error" && (
                  <AlertCircle className="w-6 h-6 text-red-500" />
                )}
                <div>
                  <h4 className="text-brand-text-primary font-semibold">
                    {uploadStatus.status === "uploading" && "Upload en cours"}
                    {uploadStatus.status === "success" && "Upload réussi"}
                    {uploadStatus.status === "error" && "Erreur d'upload"}
                  </h4>
                  <p className="text-brand-text-secondary text-sm mt-1">
                    {uploadStatus.message}
                  </p>
                </div>
              </div>
              {uploadStatus.status !== "uploading" && (
                <button
                  onClick={() => setUploadStatus(null)}
                  className="text-brand-text-secondary hover:text-brand-text-primary transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {uploadStatus.status === "uploading" && (
              <div className="space-y-2">
                <div className="w-full bg-[#2A2B2F] rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full bg-blue-500 transition-all duration-300 ease-out"
                    style={{ width: `${uploadStatus.progress}%` }}
                  />
                </div>
                <p className="text-brand-text-secondary text-xs text-center">
                  {uploadStatus.progress}% complété
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal de statut de livraison */}
      {deliveryStatus && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#191A1D] border border-[#363636] rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                {deliveryStatus.status === "delivering" && (
                  <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                )}
                {deliveryStatus.status === "success" && (
                  <CheckCircle className="w-6 h-6 text-green-500" />
                )}
                {deliveryStatus.status === "error" && (
                  <AlertCircle className="w-6 h-6 text-red-500" />
                )}
                <div>
                  <h4 className="text-brand-text-primary font-semibold">
                    {deliveryStatus.status === "delivering" &&
                      "Livraison en cours"}
                    {deliveryStatus.status === "success" && "Document livré"}
                    {deliveryStatus.status === "error" && "Erreur de livraison"}
                  </h4>
                  <p className="text-brand-text-secondary text-sm mt-1">
                    {deliveryStatus.message}
                  </p>
                </div>
              </div>
              {deliveryStatus.status !== "delivering" && (
                <button
                  onClick={() => setDeliveryStatus(null)}
                  className="text-brand-text-secondary hover:text-brand-text-primary transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {adminDocuments.map((docItem) => {
          const statusInfo = getStatusInfo(docItem.document);
          const StatusIcon = statusInfo.icon;
          const isCurrentlyUploading =
            uploadStatus?.documentTypeId === docItem.document_type.id &&
            uploadStatus.status === "uploading";
          const isCurrentlyDelivering =
            deliveryStatus?.documentId === docItem.document?.id &&
            deliveryStatus?.status === "delivering";

          return (
            <div
              key={docItem.document_type.id}
              className="border border-[#363636] rounded-lg bg-[#1A1B1E] p-4"
            >
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
                  {isCurrentlyUploading ? (
                    <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                  ) : (
                    <StatusIcon
                      className="w-4 h-4"
                      style={{ color: statusInfo.color }}
                    />
                  )}
                  <span
                    className="text-xs px-2 py-1 rounded"
                    style={{
                      backgroundColor: `${statusInfo.color}20`,
                      color: statusInfo.color,
                      border: `1px solid ${statusInfo.color}30`,
                    }}
                  >
                    {isCurrentlyUploading ? "Upload..." : statusInfo.label}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {!docItem.document ? (
                  // Zone d'upload
                  <div className="flex-1">
                    <label className="block">
                      <div
                        className={`border-2 border-dashed rounded-lg p-4 text-center transition-all ${
                          isCurrentlyUploading
                            ? "border-blue-500 bg-blue-500/5 cursor-not-allowed"
                            : "border-[#363636] cursor-pointer hover:border-blue-500 hover:bg-blue-500/5"
                        }`}
                      >
                        {isCurrentlyUploading ? (
                          <Loader2 className="w-8 h-8 mx-auto mb-2 text-blue-500 animate-spin" />
                        ) : (
                          <Upload className="w-8 h-8 mx-auto mb-2 text-brand-text-secondary" />
                        )}
                        <p className="text-brand-text-secondary text-sm mb-1 font-medium">
                          {isCurrentlyUploading
                            ? "Upload en cours..."
                            : "Cliquez pour sélectionner un fichier"}
                        </p>
                        <p className="text-brand-text-secondary text-xs">
                          PDF, DOC, DOCX (max 10MB)
                        </p>
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleFileUpload(
                              docItem.document_type.id,
                              docItem.document_type.label,
                              file
                            );
                            e.target.value = ""; // Reset input
                          }
                        }}
                        disabled={isCurrentlyUploading}
                      />
                    </label>
                  </div>
                ) : (
                  // Document uploadé
                  <div className="flex-1 flex items-center justify-between bg-[#2A2B2F] rounded-lg p-3">
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                          <FileText className="w-5 h-5 text-blue-400" />
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-brand-text-primary text-sm font-medium truncate">
                          {docItem.document.current_version.file_name}
                        </p>
                        <p className="text-brand-text-secondary text-xs">
                          Uploadé le{" "}
                          {new Date(
                            docItem.document.current_version.uploaded_at
                          ).toLocaleDateString("fr-FR", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 ml-4">
                      <button
                        onClick={() =>
                          window.open(
                            docItem.document!.current_version.file_url,
                            "_blank"
                          )
                        }
                        className="px-3 py-1.5 text-xs bg-[#363636] hover:bg-[#404040] text-brand-text-primary rounded-lg transition-colors font-medium"
                        title="Voir le document"
                      >
                        Voir
                      </button>
                      {docItem.document.status !== "DELIVERED" && (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setReplaceTarget({
                                documentTypeId: docItem.document_type.id,
                                documentTypeLabel: docItem.document_type.label,
                              });
                              replaceInputRef.current?.click();
                            }}
                            disabled={isCurrentlyUploading}
                            className="px-3 py-1.5 text-xs bg-[#363636] hover:bg-[#404040] text-brand-text-primary rounded-lg transition-colors font-medium flex items-center gap-1.5 disabled:opacity-50"
                            title="Remplacer le fichier"
                          >
                            {uploadStatus?.documentTypeId ===
                              docItem.document_type.id &&
                            uploadStatus?.status === "uploading" ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <RefreshCw className="w-3 h-3" />
                            )}
                            Remplacer
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              handleClearVersion(
                                docItem.document!.id,
                                docItem.document_type.label
                              )
                            }
                            disabled={
                              deleteStatus?.documentId ===
                                docItem.document?.id &&
                              deleteStatus?.status === "deleting"
                            }
                            className="px-3 py-1.5 text-xs bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg transition-colors font-medium flex items-center gap-1.5 disabled:opacity-50"
                            title="Supprimer le document (reste téléchargeable pour un nouvel upload)"
                          >
                            {deleteStatus?.documentId ===
                              docItem.document?.id &&
                            deleteStatus?.status === "deleting" ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Trash2 className="w-3 h-3" />
                            )}
                            Supprimer
                          </button>
                          <button
                            onClick={() =>
                              handleDeliver(
                                docItem.document!.id,
                                docItem.document_type.label
                              )
                            }
                            disabled={isCurrentlyDelivering}
                            className="px-3 py-1.5 text-xs bg-green-600 hover:bg-green-700 disabled:bg-green-600/50 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium flex items-center gap-1.5"
                            title="Livrer au client"
                          >
                            {isCurrentlyDelivering ? (
                              <>
                                <Loader2 className="w-3 h-3 animate-spin" />
                                Livraison...
                              </>
                            ) : (
                              <>
                                <CheckCircle className="w-3 h-3" />
                                Livrer au client
                              </>
                            )}
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

      {/* Input caché pour Remplacer (réutilise le flux d'upload) */}
      <input
        ref={replaceInputRef}
        type="file"
        className="hidden"
        accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file && replaceTarget) {
            handleFileUpload(
              replaceTarget.documentTypeId,
              replaceTarget.documentTypeLabel,
              file
            );
            setReplaceTarget(null);
            e.target.value = "";
          }
        }}
      />

      {/* Modal de statut de suppression */}
      {deleteStatus && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#191A1D] border border-[#363636] rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                {deleteStatus.status === "deleting" && (
                  <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                )}
                {deleteStatus.status === "success" && (
                  <CheckCircle className="w-6 h-6 text-green-500" />
                )}
                {deleteStatus.status === "error" && (
                  <AlertCircle className="w-6 h-6 text-red-500" />
                )}
                <div>
                  <h4 className="text-brand-text-primary font-semibold">
                    {deleteStatus.status === "deleting" && "Suppression…"}
                    {deleteStatus.status === "success" && "Document supprimé"}
                    {deleteStatus.status === "error" && "Erreur"}
                  </h4>
                  <p className="text-brand-text-secondary text-sm mt-1">
                    {deleteStatus.message}
                  </p>
                </div>
              </div>
              {deleteStatus.status !== "deleting" && (
                <button
                  onClick={() => setDeleteStatus(null)}
                  className="text-brand-text-secondary hover:text-brand-text-primary transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
