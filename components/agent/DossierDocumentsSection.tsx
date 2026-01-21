"use client";

import type { DossierAllData } from "@/lib/agent/dossiers";
import { FileText, CheckCircle, Clock, XCircle } from "lucide-react";

interface DossierDocumentsSectionProps {
  documents: DossierAllData["step_instances"][number]["documents"];
}

export function DossierDocumentsSection({
  documents,
}: DossierDocumentsSectionProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "APPROVED":
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case "PENDING":
        return <Clock className="w-4 h-4 text-amber-400" />;
      case "REJECTED":
        return <XCircle className="w-4 h-4 text-red-400" />;
      default:
        return <FileText className="w-4 h-4 text-brand-text-secondary" />;
    }
  };

  const getStatusLabel = (status: string): string => {
    const statusMap: Record<string, string> = {
      APPROVED: "Approuvé",
      PENDING: "En attente",
      REJECTED: "Rejeté",
      DRAFT: "Brouillon",
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case "APPROVED":
        return "bg-green-500/20 text-green-300 border-green-500/30";
      case "PENDING":
        return "bg-amber-500/20 text-amber-300 border-amber-500/30";
      case "REJECTED":
        return "bg-red-500/20 text-red-300 border-red-500/30";
      default:
        return "bg-[#2A2B2F] text-brand-text-secondary border-[#363636]";
    }
  };

  if (!documents || documents.length === 0) {
    return null;
  }

  return (
    <div className="border border-[#363636] rounded-2xl bg-[#191A1D] overflow-hidden">
      <div className="px-5 py-4 border-b border-[#363636]">
        <h3 className="text-lg font-semibold text-brand-text-primary">
          Documents
        </h3>
        <p className="text-sm text-brand-text-secondary mt-0.5">
          Documents associés à cette étape
        </p>
      </div>

      <div className="p-5">
        <div className="space-y-3">
          {documents.map((doc, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-4 rounded-xl bg-[#2A2B2F] border border-[#363636]"
            >
              <div className="flex items-center gap-3 flex-1">
                <FileText className="w-5 h-5 text-brand-text-secondary shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-brand-text-primary font-medium">
                    {doc.document_type}
                  </div>
                  {doc.file_name && (
                    <div className="text-sm text-brand-text-secondary mt-0.5 truncate">
                      {doc.file_name}
                    </div>
                  )}
                  {doc.uploaded_at && (
                    <div className="text-xs text-brand-text-secondary mt-1">
                      Uploadé le{" "}
                      {new Date(doc.uploaded_at).toLocaleDateString("fr-FR")}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {getStatusIcon(doc.status)}
                <span
                  className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                    doc.status
                  )}`}
                >
                  {getStatusLabel(doc.status)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
