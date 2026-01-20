"use client";

import { useState } from "react";
import { FileText, Eye, Check, X, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import type { VerificateurStepDetails } from "@/lib/agent-steps";
import { DocumentPreviewModal } from "./DocumentPreviewModal";
import { RejectDocumentModal } from "./RejectDocumentModal";

type RequiredDocument = VerificateurStepDetails["required_documents"][number];

interface VerificateurDocumentsSectionProps {
  stepInstanceId: string;
  requiredDocuments: RequiredDocument[];
  agentId: string;
}

const STATUS_COLORS = {
  PENDING: { bg: "bg-yellow-500/20", text: "text-yellow-300", border: "border-yellow-500/30", label: "En attente" },
  APPROVED: { bg: "bg-green-500/20", text: "text-green-300", border: "border-green-500/30", label: "Approuve" },
  REJECTED: { bg: "bg-red-500/20", text: "text-red-300", border: "border-red-500/30", label: "Rejete" },
  NOT_SUBMITTED: { bg: "bg-gray-500/20", text: "text-gray-400", border: "border-gray-500/30", label: "Non soumis" },
};

export function VerificateurDocumentsSection({
  stepInstanceId: _stepInstanceId,
  requiredDocuments: initialDocuments,
  agentId: _agentId,
}: VerificateurDocumentsSectionProps) {
  const [documents, setDocuments] = useState(initialDocuments);
  const [previewDoc, setPreviewDoc] = useState<{
    url: string;
    name: string;
  } | null>(null);
  const [rejectingDocId, setRejectingDocId] = useState<string | null>(null);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [expandedHistory, setExpandedHistory] = useState<Set<string>>(new Set());

  const handleApprove = async (documentId: string) => {
    setLoadingAction(`approve-${documentId}`);
    try {
      const res = await fetch(`/api/agent/documents/${documentId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "APPROVED" }),
      });

      if (res.ok) {
        // Optimistic update
        setDocuments((prev) =>
          prev.map((doc) => {
            if (doc.document?.id === documentId) {
              return {
                ...doc,
                document: {
                  ...doc.document,
                  status: "APPROVED" as const,
                },
              };
            }
            return doc;
          })
        );
      } else {
        const error = await res.json();
        alert(error.error || "Erreur lors de l'approbation");
      }
    } catch (err) {
      console.error("Error approving document", err);
      alert("Erreur lors de l'approbation");
    } finally {
      setLoadingAction(null);
    }
  };

  const handleReject = async (documentId: string, reason: string) => {
    setLoadingAction(`reject-${documentId}`);
    try {
      const res = await fetch(`/api/agent/documents/${documentId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "REJECTED", reason }),
      });

      if (res.ok) {
        // Optimistic update
        setDocuments((prev) =>
          prev.map((doc) => {
            if (doc.document?.id === documentId) {
              return {
                ...doc,
                document: {
                  ...doc.document,
                  status: "REJECTED" as const,
                },
              };
            }
            return doc;
          })
        );
        setRejectingDocId(null);
      } else {
        const error = await res.json();
        alert(error.error || "Erreur lors du rejet");
      }
    } catch (err) {
      console.error("Error rejecting document", err);
      alert("Erreur lors du rejet");
    } finally {
      setLoadingAction(null);
    }
  };

  const toggleHistory = (docTypeId: string) => {
    setExpandedHistory((prev) => {
      const next = new Set(prev);
      if (next.has(docTypeId)) {
        next.delete(docTypeId);
      } else {
        next.add(docTypeId);
      }
      return next;
    });
  };

  return (
    <div className="border border-[#363636] rounded-2xl bg-[#191A1D] overflow-hidden">
      <div className="px-5 py-4 border-b border-[#363636]">
        <h2 className="text-lg font-semibold text-brand-text-primary">
          Documents a verifier
        </h2>
      </div>

      <div className="divide-y divide-[#363636]">
        {documents.map((reqDoc) => {
          const status = reqDoc.document?.status || "NOT_SUBMITTED";
          const statusStyle = STATUS_COLORS[status as keyof typeof STATUS_COLORS] || STATUS_COLORS.NOT_SUBMITTED;
          const hasHistory = (reqDoc.document?.previous_versions?.length ?? 0) > 0;
          const isHistoryExpanded = expandedHistory.has(reqDoc.document_type.id);

          return (
            <div key={reqDoc.document_type.id} className="p-4 sm:p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="p-2 rounded-lg bg-[#2A2B2F]">
                    <FileText className="w-5 h-5 text-brand-text-secondary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-brand-text-primary">
                        {reqDoc.document_type.label}
                      </span>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyle.bg} ${statusStyle.text} border ${statusStyle.border}`}
                      >
                        {statusStyle.label}
                      </span>
                    </div>

                    {reqDoc.document ? (
                      <div className="mt-1 text-sm text-brand-text-secondary">
                        <span className="font-mono text-xs">
                          {reqDoc.document.current_version.file_name}
                        </span>
                        <span className="mx-2">-</span>
                        <span>
                          Version {reqDoc.document.current_version.version_number}
                        </span>
                        <span className="mx-2">-</span>
                        <span>
                          Uploade{" "}
                          {formatDistanceToNow(
                            new Date(reqDoc.document.current_version.uploaded_at),
                            { addSuffix: true, locale: fr }
                          )}
                        </span>
                      </div>
                    ) : (
                      <p className="mt-1 text-sm text-brand-text-secondary">
                        Le client n&apos;a pas encore soumis ce document
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  {reqDoc.document && (
                    <>
                      <button
                        onClick={() =>
                          setPreviewDoc({
                            url: reqDoc.document!.current_version.file_url,
                            name: reqDoc.document!.current_version.file_name,
                          })
                        }
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2A2B2F] hover:bg-[#363636] text-brand-text-secondary hover:text-brand-text-primary transition-colors text-sm"
                      >
                        <Eye className="w-4 h-4" />
                        Voir
                      </button>

                      {status === "PENDING" && (
                        <>
                          <button
                            onClick={() => handleApprove(reqDoc.document!.id)}
                            disabled={loadingAction === `approve-${reqDoc.document!.id}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-500 text-white transition-colors text-sm disabled:opacity-50"
                          >
                            {loadingAction === `approve-${reqDoc.document!.id}` ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Check className="w-4 h-4" />
                            )}
                            Approuver
                          </button>
                          <button
                            onClick={() => setRejectingDocId(reqDoc.document!.id)}
                            disabled={loadingAction === `reject-${reqDoc.document!.id}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white transition-colors text-sm disabled:opacity-50"
                          >
                            {loadingAction === `reject-${reqDoc.document!.id}` ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <X className="w-4 h-4" />
                            )}
                            Rejeter
                          </button>
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Version History Toggle */}
              {hasHistory && (
                <div className="mt-3">
                  <button
                    onClick={() => toggleHistory(reqDoc.document_type.id)}
                    className="inline-flex items-center gap-1 text-sm text-brand-text-secondary hover:text-brand-text-primary transition-colors"
                  >
                    {isHistoryExpanded ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                    Versions precedentes ({reqDoc.document!.previous_versions.length})
                  </button>

                  {isHistoryExpanded && (
                    <div className="mt-2 pl-4 border-l-2 border-[#363636] space-y-2">
                      {reqDoc.document!.previous_versions.map((version) => (
                        <div
                          key={version.id}
                          className="flex items-center justify-between gap-4 py-2 text-sm"
                        >
                          <div className="text-brand-text-secondary">
                            <span>v{version.version_number}</span>
                            <span className="mx-2">-</span>
                            <span>
                              {formatDistanceToNow(new Date(version.uploaded_at), {
                                addSuffix: true,
                                locale: fr,
                              })}
                            </span>
                            {version.review_status && (
                              <>
                                <span className="mx-2">-</span>
                                <span
                                  className={
                                    version.review_status === "APPROVED"
                                      ? "text-green-400"
                                      : "text-red-400"
                                  }
                                >
                                  {version.review_status === "APPROVED"
                                    ? "Approuve"
                                    : "Rejete"}
                                </span>
                                {version.review_reason && (
                                  <span className="text-brand-text-secondary ml-1">
                                    - &quot;{version.review_reason}&quot;
                                  </span>
                                )}
                              </>
                            )}
                          </div>
                          <button
                            onClick={() =>
                              setPreviewDoc({
                                url: version.file_url,
                                name: `v${version.version_number}`,
                              })
                            }
                            className="text-brand-text-secondary hover:text-brand-text-primary"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {documents.length === 0 && (
          <div className="p-8 text-center text-brand-text-secondary">
            Aucun document requis pour cette etape.
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {previewDoc && (
        <DocumentPreviewModal
          url={previewDoc.url}
          name={previewDoc.name}
          onClose={() => setPreviewDoc(null)}
        />
      )}

      {/* Reject Modal */}
      {rejectingDocId && (
        <RejectDocumentModal
          onConfirm={(reason) => handleReject(rejectingDocId, reason)}
          onCancel={() => setRejectingDocId(null)}
          isLoading={loadingAction === `reject-${rejectingDocId}`}
        />
      )}
    </div>
  );
}
