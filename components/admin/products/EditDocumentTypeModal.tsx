"use client";

import { useState } from "react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import { useApi } from "@/lib/api/useApi";
import rehypeSanitize from "rehype-sanitize";
import { DocumentType } from "@/types/products";

interface EditDocumentTypeModalProps {
  documentType: DocumentType;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditDocumentTypeModal({
  documentType,
  onClose,
  onSuccess,
}: EditDocumentTypeModalProps) {
  const api = useApi();
  const [formData, setFormData] = useState({
    label: documentType.label,
    description: documentType.description || "",
    max_file_size_mb: documentType.max_file_size_mb,
    allowed_extensions: documentType.allowed_extensions.join(","),
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await api.patch(
        `/api/admin/document-types/${documentType.id}`,
        {
          label: formData.label.trim(),
          description: formData.description.trim() || null,
          max_file_size_mb: formData.max_file_size_mb,
          allowed_extensions: formData.allowed_extensions
            .split(",")
            .map((ext) => ext.trim())
            .filter(Boolean),
        }
      );
      toast.success("Type de document modifié avec succès");
      onSuccess();
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Une erreur est survenue"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-brand-card-bg rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-brand-card-bg border-b border-brand-border px-6 py-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-brand-text-primary">
              Modifier le type de document
            </h2>
            <button
              onClick={onClose}
              className="text-brand-text-secondary hover:text-brand-text-primary transition-colors"
              type="button"
            >
              ✕
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Code (Read-only) */}
          <div>
            <label
              htmlFor="code"
              className="block text-sm font-medium text-brand-text-primary mb-2"
            >
              Code
            </label>
            <input
              type="text"
              id="code"
              value={documentType.code}
              readOnly
              disabled
              className="w-full px-3 py-2 bg-brand-surface-dark border border-brand-border rounded-lg text-brand-text-muted font-mono cursor-not-allowed"
            />
            <p className="mt-1 text-xs text-brand-text-muted">
              Le code ne peut pas être modifié
            </p>
          </div>

          {/* Label */}
          <div>
            <label
              htmlFor="label"
              className="block text-sm font-medium text-brand-text-primary mb-2"
            >
              Label <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="label"
              required
              value={formData.label}
              onChange={(e) =>
                setFormData({ ...formData, label: e.target.value })
              }
              className="w-full px-3 py-2 bg-brand-surface-light border border-brand-border rounded-lg text-brand-text-primary placeholder-brand-text-muted focus:outline-none focus:ring-2 focus:ring-brand-accent"
              placeholder="ex: Statuts de la société"
            />
          </div>

          {/* Description with Preview */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label
                htmlFor="description"
                className="block text-sm font-medium text-brand-text-primary"
              >
                Description (Markdown)
              </label>
              <button
                type="button"
                onClick={() => setShowPreview(!showPreview)}
                className="text-xs text-brand-accent hover:text-brand-accent/80 transition-colors"
              >
                {showPreview ? "Masquer l'aperçu" : "Aperçu"}
              </button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={8}
                className="w-full px-3 py-2 bg-brand-surface-light border border-brand-border rounded-lg text-brand-text-primary placeholder-brand-text-muted focus:outline-none focus:ring-2 focus:ring-brand-accent resize-none font-mono text-sm"
                placeholder="ex: Les **statuts de la société** sont nécessaires pour..."
              />
              {showPreview && (
                <div className="px-4 py-3 bg-brand-surface-light border border-brand-border rounded-lg overflow-auto max-h-[200px]">
                  {formData.description.trim() ? (
                    <div className="prose prose-sm prose-invert max-w-none">
                      <ReactMarkdown rehypePlugins={[rehypeSanitize]}>
                        {formData.description}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <p className="text-brand-text-muted italic text-sm">
                      L&apos;aperçu apparaîtra ici...
                    </p>
                  )}
                </div>
              )}
            </div>
            <p className="mt-2 text-xs text-brand-text-muted">
              Vous pouvez utiliser du Markdown : **gras**, *italique*, listes,
              liens, etc.
            </p>
          </div>

          {/* Max File Size */}
          <div>
            <label
              htmlFor="max_file_size_mb"
              className="block text-sm font-medium text-brand-text-primary mb-2"
            >
              Taille maximale (MB) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              id="max_file_size_mb"
              required
              min="1"
              max="100"
              value={formData.max_file_size_mb}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  max_file_size_mb: parseInt(e.target.value) || 10,
                })
              }
              className="w-full px-3 py-2 bg-brand-surface-light border border-brand-border rounded-lg text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-accent"
            />
          </div>

          {/* Allowed Extensions */}
          <div>
            <label
              htmlFor="allowed_extensions"
              className="block text-sm font-medium text-brand-text-primary mb-2"
            >
              Extensions autorisées <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="allowed_extensions"
              required
              value={formData.allowed_extensions}
              onChange={(e) =>
                setFormData({ ...formData, allowed_extensions: e.target.value })
              }
              className="w-full px-3 py-2 bg-brand-surface-light border border-brand-border rounded-lg text-brand-text-primary placeholder-brand-text-muted focus:outline-none focus:ring-2 focus:ring-brand-accent font-mono"
              placeholder="pdf,jpg,png"
            />
            <p className="mt-2 text-xs text-brand-text-muted">
              Séparez les extensions par des virgules (ex: pdf,jpg,png)
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-brand-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-brand-text-secondary hover:text-brand-text-primary transition-colors"
              disabled={isSubmitting}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-brand-accent text-white rounded-lg hover:bg-brand-accent/90 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Modification..." : "Modifier"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
