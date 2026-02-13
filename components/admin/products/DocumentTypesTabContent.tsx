"use client";

import { useEffect, useState, useCallback } from "react";

import { useApi } from "@/lib/api/useApi";
import { DocumentType } from "@/types/products";
import { CreateDocumentTypeModal } from "./CreateDocumentTypeModal";
import { EditDocumentTypeModal } from "./EditDocumentTypeModal";

export function DocumentTypesTabContent() {
  const api = useApi();
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingDocumentType, setEditingDocumentType] =
    useState<DocumentType | null>(null);

  const fetchDocumentTypes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get<{ documentTypes: DocumentType[] }>(
        "/api/admin/document-types"
      );
      setDocumentTypes(data?.documentTypes ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocumentTypes();
  }, []);

  const handleDocumentTypeCreated = () => {
    setShowCreateModal(false);
    fetchDocumentTypes();
  };

  const handleDocumentTypeUpdated = () => {
    setEditingDocumentType(null);
    fetchDocumentTypes();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-brand-text-secondary">
          Chargement des types de documents...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-400">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="text-brand-text-secondary">
          {documentTypes.length} type{documentTypes.length !== 1 ? "s" : ""} de
          document{documentTypes.length !== 1 ? "s" : ""} au total
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-brand-accent text-white rounded-lg hover:bg-brand-accent/90 transition-colors font-medium"
        >
          + Créer un type de document
        </button>
      </div>

      <div className="bg-brand-card-bg rounded-lg border border-brand-border overflow-hidden">
        <table className="w-full">
          <thead className="bg-brand-surface-light border-b border-brand-border">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-brand-text-secondary uppercase tracking-wider">
                Code
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-brand-text-secondary uppercase tracking-wider">
                Label
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-brand-text-secondary uppercase tracking-wider">
                Description
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-brand-text-secondary uppercase tracking-wider">
                Taille max (MB)
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-brand-text-secondary uppercase tracking-wider">
                Extensions
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-brand-text-secondary uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-border">
            {documentTypes.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-6 py-12 text-center text-brand-text-secondary"
                >
                  Aucun type de document
                </td>
              </tr>
            ) : (
              documentTypes.map((docType) => (
                <tr
                  key={docType.id}
                  className="hover:bg-brand-surface-light transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-brand-text-primary">
                    {docType.code}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-text-primary">
                    {docType.label}
                  </td>
                  <td className="px-6 py-4 text-sm text-brand-text-secondary max-w-md">
                    <div className="line-clamp-2">
                      {docType.description || (
                        <span className="italic text-brand-text-muted">
                          Aucune description
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-text-primary">
                    {docType.max_file_size_mb} MB
                  </td>
                  <td className="px-6 py-4 text-sm text-brand-text-secondary">
                    <div className="flex flex-wrap gap-1">
                      {docType.allowed_extensions.map((ext) => (
                        <span
                          key={ext}
                          className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-brand-surface-light text-brand-text-primary border border-brand-border"
                        >
                          {ext}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    <button
                      onClick={() => setEditingDocumentType(docType)}
                      className="text-brand-accent hover:text-brand-accent/80 font-medium transition-colors"
                    >
                      Modifier
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showCreateModal && (
        <CreateDocumentTypeModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleDocumentTypeCreated}
        />
      )}

      {editingDocumentType && (
        <EditDocumentTypeModal
          documentType={editingDocumentType}
          onClose={() => setEditingDocumentType(null)}
          onSuccess={handleDocumentTypeUpdated}
        />
      )}
    </div>
  );
}
