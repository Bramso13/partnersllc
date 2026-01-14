"use client";

interface Document {
  id: string;
  name: string;
  status: "action_required" | "draft" | "validated" | "ready";
  type: "pdf" | "text" | "id" | "signature";
}

interface DocumentsSectionProps {
  documents?: Document[];
}

export function DocumentsSection({ documents }: DocumentsSectionProps) {
  const defaultDocuments: Document[] = [
    {
      id: "1",
      name: "Certificate of Formation",
      status: "action_required",
      type: "pdf",
    },
    {
      id: "2",
      name: "Operating Agreement",
      status: "draft",
      type: "text",
    },
    {
      id: "3",
      name: "Passeport (copie)",
      status: "validated",
      type: "id",
    },
    {
      id: "4",
      name: "W-9 Form",
      status: "ready",
      type: "signature",
    },
  ];

  const docsToShow = documents || defaultDocuments;

  return (
    <div id="documents-section">
      <h3 className="text-lg font-semibold text-brand-text-primary mb-4">
        Documents importants
      </h3>
      <div className="bg-brand-dark-bg rounded-2xl p-4 card-hover space-y-2">
        {docsToShow.map((doc) => (
          <div
            key={doc.id}
            className="p-3 hover:bg-brand-dark-surface rounded-lg transition-colors cursor-pointer flex items-center justify-between"
          >
            <div className="flex items-center space-x-4">
              <div
                className={`w-10 h-10 ${getDocumentIconBg(doc.type)} rounded-lg flex items-center justify-center`}
              >
                <i
                  className={`${getDocumentIcon(doc.type)} ${getDocumentIconColor(doc.type)} text-lg`}
                ></i>
              </div>
              <div>
                <p className="text-sm font-medium text-brand-text-primary">
                  {doc.name}
                </p>
                <p
                  className={`text-xs ${getStatusTextColor(doc.status)}`}
                >
                  {getStatusLabel(doc.status)}
                </p>
              </div>
            </div>
            <i className="fa-solid fa-chevron-right text-brand-text-secondary text-xs"></i>
          </div>
        ))}
      </div>
    </div>
  );
}

function getDocumentIcon(type: string): string {
  const iconMap: Record<string, string> = {
    pdf: "fa-solid fa-file-pdf",
    text: "fa-solid fa-file-lines",
    id: "fa-solid fa-id-card",
    signature: "fa-solid fa-file-signature",
  };
  return iconMap[type] || "fa-solid fa-file";
}

function getDocumentIconBg(type: string): string {
  const bgMap: Record<string, string> = {
    pdf: "bg-brand-danger/20",
    text: "bg-brand-accent/20",
    id: "bg-brand-success/20",
    signature: "bg-purple-500/20",
  };
  return bgMap[type] || "bg-brand-dark-surface";
}

function getDocumentIconColor(type: string): string {
  const colorMap: Record<string, string> = {
    pdf: "text-brand-danger",
    text: "text-brand-accent",
    id: "text-brand-success",
    signature: "text-purple-400",
  };
  return colorMap[type] || "text-brand-text-secondary";
}

function getStatusLabel(status: string): string {
  const labelMap: Record<string, string> = {
    action_required: "Action requise",
    draft: "Brouillon disponible",
    validated: "Validé",
    ready: "Prêt à télécharger",
  };
  return labelMap[status] || "En attente";
}

function getStatusTextColor(status: string): string {
  const colorMap: Record<string, string> = {
    action_required: "text-brand-danger",
    draft: "text-brand-text-secondary",
    validated: "text-brand-success",
    ready: "text-brand-text-secondary",
  };
  return colorMap[status] || "text-brand-text-secondary";
}
