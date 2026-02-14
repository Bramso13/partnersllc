"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { DocumentType } from "@/types/products";
import { useApi } from "@/lib/api/useApi";

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
}

interface AdminDocumentItem {
  document_type: {
    id: string;
    code: string;
    label: string;
    description: string | null;
  };
  document?: {
    id: string;
    status: string;
    current_version: {
      id: string;
      file_url: string;
      file_name: string;
      uploaded_at: string;
    };
    delivered_at?: string | null;
  };
}

const MAX_FILE_SIZE_MB = 10;
const ALLOWED_TYPES = ["pdf", "jpg", "jpeg", "png"];
const ADMIN_UPLOAD_ACCEPT =
  ".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export function SendDocumentsModal({
  dossierId,
  productId,
  stepInstanceId,
  stepName,
  onClose,
  onSuccess,
}: SendDocumentsModalProps) {
  const api = useApi();
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  const [selectedTypeIds, setSelectedTypeIds] = useState<string[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [adminDocuments, setAdminDocuments] = useState<AdminDocumentItem[]>([]);
  const [loadingAdminDocs, setLoadingAdminDocs] = useState(false);
  const [actionDocId, setActionDocId] = useState<string | null>(null);
  const [actionTypeId, setActionTypeId] = useState<string | null>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);
  const [replaceTarget, setReplaceTarget] = useState<{
    documentTypeId: string;
    documentTypeLabel: string;
  } | null>(null);

  const fetchAdminDocuments = useCallback(async () => {
    if (!stepInstanceId || !dossierId) {
      setAdminDocuments([]);
      return;
    }
    setLoadingAdminDocs(true);
    try {
      const data = await api.get<{ admin_documents?: AdminDocumentItem[] }>(
        `/api/admin/dossiers/${dossierId}/steps/${stepInstanceId}/admin-documents`
      );
      setAdminDocuments(data?.admin_documents ?? []);
    } catch {
      setAdminDocuments([]);
    } finally {
      setLoadingAdminDocs(false);
    }
  }, [api, dossierId, stepInstanceId]);

  useEffect(() => {
    fetchAdminDocuments();
  }, [fetchAdminDocuments]);

  useEffect(() => {
    let cancelled = false;
    api
      .get<{ document_types?: DocumentType[] }>("/api/admin/document-types")
      .then((data) => {
        if (!cancelled) setDocumentTypes(data?.document_types ?? []);
      })
      .catch(() => {
        if (!cancelled) setDocumentTypes([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const validateFile = (file: File): string | null => {
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      return `Max ${MAX_FILE_SIZE_MB} MB par fichier`;
    }
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!ext || !ALLOWED_TYPES.includes(ext)) {
      return `Types autorisés: ${ALLOWED_TYPES.join(", ")}`;
    }
    return null;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    setError(null);
    for (const file of files) {
      const err = validateFile(file);
      if (err) {
        setError(err);
        e.target.value = "";
        return;
      }
      setSelectedFiles((prev) => [
        ...prev,
        { file, id: `${Date.now()}-${Math.random()}` },
      ]);
    }
    e.target.value = "";
  };

  const removeFile = (id: string) => {
    setSelectedFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleAdminReplace = async (
    file: File,
    documentTypeId: string,
    _documentTypeLabel: string
  ) => {
    if (!stepInstanceId || !dossierId) return;
    setError(null);
    setActionTypeId(documentTypeId);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("document_type_id", documentTypeId);
      formData.append("step_instance_id", stepInstanceId);
      await api.post(
        `/api/admin/dossiers/${dossierId}/admin-documents/upload`,
        formData
      );
      await fetchAdminDocuments();
      onSuccess();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur remplacement");
    } finally {
      setActionTypeId(null);
      setReplaceTarget(null);
    }
  };

  const handleAdminClearVersion = async (documentId: string) => {
    if (!dossierId) return;
    setError(null);
    setActionDocId(documentId);
    try {
      await api.patch(
        `/api/admin/dossiers/${dossierId}/documents/${documentId}/clear-version`
      );
      await fetchAdminDocuments();
      onSuccess();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur suppression");
    } finally {
      setActionDocId(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (selectedFiles.length === 0) {
      setError("Sélectionnez au moins un fichier");
      return;
    }
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      selectedFiles.forEach((sf) => formData.append("files", sf.file));
      if (stepInstanceId) formData.append("step_instance_id", stepInstanceId);
      selectedTypeIds.forEach((id) =>
        formData.append("document_type_ids[]", id)
      );
      if (message.trim()) formData.append("message", message.trim());

      await api.post(
        `/api/admin/dossiers/${dossierId}/send-documents`,
        formData
      );
      onSuccess();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="rounded-xl bg-[#252628] border border-[#363636] w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-xl">
        <div className="px-6 py-4 border-b border-[#363636] flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-[#f9f9f9]">
              Envoyer des documents
            </h2>
            {stepName && (
              <p className="text-xs text-[#b7b7b7] mt-0.5">
                Pour l’étape : {stepName}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="text-[#b7b7b7] hover:text-[#f9f9f9] text-xl leading-none disabled:opacity-50"
            aria-label="Fermer"
          >
            ×
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="p-6 space-y-5 overflow-y-auto flex-1"
        >
          {error && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-3 text-sm text-red-400">
              {error}
            </div>
          )}

          {stepInstanceId && (
            <div>
              <label className="block text-xs font-medium text-[#b7b7b7] mb-2">
                Documents de l’étape
              </label>
              {loadingAdminDocs ? (
                <p className="text-xs text-[#b7b7b7]">Chargement…</p>
              ) : adminDocuments.length === 0 ? (
                <p className="text-xs text-[#b7b7b7]">
                  Aucun type de document requis pour cette étape.
                </p>
              ) : (
                <ul className="space-y-2 max-h-48 overflow-y-auto rounded-lg border border-[#363636] p-2">
                  {adminDocuments.map((item) => (
                    <li
                      key={item.document_type.id}
                      className="flex flex-wrap items-center justify-between gap-2 p-2 rounded-lg bg-[#1e1f22] border border-[#363636]"
                    >
                      <div className="min-w-0">
                        <span className="text-sm font-medium text-[#f9f9f9]">
                          {item.document_type.label}
                        </span>
                        {item.document?.current_version ? (
                          <p className="text-[10px] text-[#b7b7b7] truncate mt-0.5">
                            {item.document.current_version.file_name}
                          </p>
                        ) : (
                          <p className="text-[10px] text-[#b7b7b7] mt-0.5">
                            Aucun fichier
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {item.document?.current_version ? (
                          <>
                            <a
                              href={item.document.current_version.file_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2 py-1 text-[10px] bg-[#363636] hover:bg-[#404040] text-[#f9f9f9] rounded"
                            >
                              Voir
                            </a>
                            <button
                              type="button"
                              onClick={() => {
                                setReplaceTarget({
                                  documentTypeId: item.document_type.id,
                                  documentTypeLabel: item.document_type.label,
                                });
                                replaceInputRef.current?.click();
                              }}
                              disabled={actionTypeId === item.document_type.id}
                              className="px-2 py-1 text-[10px] bg-[#363636] hover:bg-[#404040] text-[#f9f9f9] rounded disabled:opacity-50"
                            >
                              {actionTypeId === item.document_type.id
                                ? "…"
                                : "Remplacer"}
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleAdminClearVersion(item.document!.id)
                              }
                              disabled={actionDocId === item.document?.id}
                              className="px-2 py-1 text-[10px] bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded disabled:opacity-50"
                            >
                              {actionDocId === item.document?.id
                                ? "…"
                                : "Supprimer"}
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setReplaceTarget({
                                documentTypeId: item.document_type.id,
                                documentTypeLabel: item.document_type.label,
                              });
                              replaceInputRef.current?.click();
                            }}
                            disabled={actionTypeId === item.document_type.id}
                            className="px-2 py-1 text-[10px] bg-[#50b989] text-[#191a1d] rounded font-medium disabled:opacity-50"
                          >
                            {actionTypeId === item.document_type.id
                              ? "…"
                              : "Ajouter"}
                          </button>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              <input
                ref={replaceInputRef}
                type="file"
                className="hidden"
                accept={ADMIN_UPLOAD_ACCEPT}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file && replaceTarget) {
                    handleAdminReplace(
                      file,
                      replaceTarget.documentTypeId,
                      replaceTarget.documentTypeLabel
                    );
                    e.target.value = "";
                  }
                }}
              />
            </div>
          )}

          {!loading && documentTypes.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-[#b7b7b7] mb-2">
                Types de documents (optionnel)
              </label>
              <div className="max-h-32 overflow-y-auto rounded-lg border border-[#363636] p-2 space-y-1">
                {documentTypes.map((dt) => (
                  <label
                    key={dt.id}
                    className="flex items-center gap-2 cursor-pointer py-1.5 px-2 rounded hover:bg-[#363636]/30"
                  >
                    <input
                      type="checkbox"
                      checked={selectedTypeIds.includes(dt.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedTypeIds((prev) => [...prev, dt.id]);
                        } else {
                          setSelectedTypeIds((prev) =>
                            prev.filter((id) => id !== dt.id)
                          );
                        }
                      }}
                      className="rounded border-[#363636] bg-[#191a1d] text-[#50b989] focus:ring-[#50b989]"
                    />
                    <span className="text-sm text-[#f9f9f9]">{dt.label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-[#b7b7b7] mb-2">
              Fichiers <span className="text-red-400">*</span>
            </label>
            <div className="border-2 border-dashed border-[#363636] rounded-lg p-6 text-center hover:border-[#50b989]/50 transition-colors">
              <input
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload-modal"
                disabled={isSubmitting}
              />
              <label
                htmlFor="file-upload-modal"
                className="cursor-pointer flex flex-col items-center gap-2"
              >
                <i className="fa-solid fa-cloud-arrow-up text-2xl text-[#b7b7b7]" />
                <span className="text-sm font-medium text-[#f9f9f9]">
                  Cliquer pour sélectionner
                </span>
                <span className="text-[10px] text-[#b7b7b7]">
                  PDF, JPG, PNG · max {MAX_FILE_SIZE_MB} MB
                </span>
              </label>
            </div>
            {selectedFiles.length > 0 && (
              <ul className="mt-3 space-y-2">
                {selectedFiles.map((sf) => (
                  <li
                    key={sf.id}
                    className="flex items-center justify-between gap-2 p-2 rounded-lg bg-[#1e1f22] border border-[#363636]"
                  >
                    <span className="text-xs text-[#f9f9f9] truncate flex-1">
                      {sf.file.name}
                    </span>
                    <span className="text-[10px] text-[#b7b7b7] shrink-0">
                      {(sf.file.size / 1024 / 1024).toFixed(2)} MB
                    </span>
                    <button
                      type="button"
                      onClick={() => removeFile(sf.id)}
                      className="text-red-400 hover:text-red-300 shrink-0"
                      aria-label="Retirer"
                    >
                      <i className="fa-solid fa-times" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-[#b7b7b7] mb-1.5">
              Message (optionnel)
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Message pour le client…"
              rows={2}
              className="w-full px-3 py-2 rounded-lg bg-[#191a1d] border border-[#363636] text-[#f9f9f9] placeholder-[#b7b7b7]/50 text-sm focus:outline-none focus:ring-2 focus:ring-[#50b989] resize-none disabled:opacity-50"
              disabled={isSubmitting}
            />
          </div>

          <div className="flex gap-3 pt-2 border-t border-[#363636]">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2.5 rounded-lg border border-[#363636] text-[#f9f9f9] text-sm hover:bg-[#363636]/50 disabled:opacity-50 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting || selectedFiles.length === 0}
              className="flex-1 px-4 py-2.5 rounded-lg bg-[#50b989] text-[#191a1d] text-sm font-medium hover:bg-[#50b989]/90 disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? "Envoi…" : "Envoyer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
