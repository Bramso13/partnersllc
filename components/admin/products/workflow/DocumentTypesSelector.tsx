"use client";

import { useEffect, useState } from "react";
import { DocumentType } from "@/types/products";
import { CreateDocumentTypeModal } from "./CreateDocumentTypeModal";

interface DocumentTypesSelectorProps {
  selectedDocumentTypes: DocumentType[];
  onUpdate: (documentTypes: DocumentType[]) => void;
}

export function DocumentTypesSelector({
  selectedDocumentTypes,
  onUpdate,
}: DocumentTypesSelectorProps) {
  const [availableDocTypes, setAvailableDocTypes] = useState<DocumentType[]>(
    []
  );
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchDocumentTypes = async () => {
    try {
      const response = await fetch("/api/admin/document-types");
      if (response.ok) {
        const data = await response.json();
        setAvailableDocTypes(data.documentTypes || []);
      }
    } catch (err) {
      console.error("Error fetching document types:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocumentTypes();
  }, []);

  const handleToggleDocType = (docType: DocumentType) => {
    const isSelected = selectedDocumentTypes.some((dt) => dt.id === docType.id);

    if (isSelected) {
      onUpdate(selectedDocumentTypes.filter((dt) => dt.id !== docType.id));
    } else {
      onUpdate([...selectedDocumentTypes, docType]);
    }
  };

  const handleDocTypeCreated = () => {
    setShowCreateModal(false);
    fetchDocumentTypes();
  };

  if (loading) {
    return (
      <div className="text-sm text-brand-text-secondary">
        Loading document types...
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Selected Document Types */}
      {selectedDocumentTypes.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedDocumentTypes.map((docType) => (
            <span
              key={docType.id}
              className="px-3 py-1 bg-brand-accent/20 text-brand-accent rounded-full text-sm flex items-center gap-2"
            >
              {docType.label}
              <button
                onClick={() => handleToggleDocType(docType)}
                className="hover:text-brand-accent/80"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Document Types Selector */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-brand-text-primary">
          Available Document Types
        </label>
        <div className="border border-brand-border rounded-lg max-h-48 overflow-y-auto">
          {availableDocTypes.length === 0 ? (
            <div className="p-4 text-center text-brand-text-secondary text-sm">
              No document types available. Create one to get started.
            </div>
          ) : (
            <div className="divide-y divide-brand-border">
              {availableDocTypes.map((docType) => {
                const isSelected = selectedDocumentTypes.some(
                  (dt) => dt.id === docType.id
                );
                return (
                  <label
                    key={docType.id}
                    className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-brand-dark-bg/30 transition-colors ${
                      isSelected ? "bg-brand-accent/5" : ""
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggleDocType(docType)}
                      className="w-4 h-4 rounded border-brand-border"
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-brand-text-primary">
                        {docType.label}
                      </div>
                      {docType.description && (
                        <div className="text-xs text-brand-text-secondary mt-0.5">
                          {docType.description}
                        </div>
                      )}
                      <div className="text-xs text-brand-text-secondary mt-1">
                        Max: {docType.max_file_size_mb}MB •{" "}
                        {docType.allowed_extensions.join(", ")}
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Create New Button */}
      <button
        onClick={() => setShowCreateModal(true)}
        className="text-sm text-brand-accent hover:text-brand-accent/80 font-medium"
      >
        + Create New Document Type
      </button>

      {/* Create Modal */}
      {showCreateModal && (
        <CreateDocumentTypeModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleDocTypeCreated}
        />
      )}
    </div>
  );
}
