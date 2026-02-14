"use client";

import { useState } from "react";
import { useApi } from "@/lib/api/useApi";

interface CreateDocumentTypeModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const FILE_EXTENSIONS = [
  "pdf",
  "jpg",
  "jpeg",
  "png",
  "doc",
  "docx",
  "xls",
  "xlsx",
  "txt",
];

export function CreateDocumentTypeModal({
  onClose,
  onSuccess,
}: CreateDocumentTypeModalProps) {
  const api = useApi();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    label: "",
    description: "",
    max_file_size_mb: 10,
    allowed_extensions: ["pdf", "jpg", "png"],
  });

  const generateCode = (label: string): string => {
    return label
      .toUpperCase()
      .replace(/[^A-Z0-9\s]/g, "")
      .replace(/\s+/g, "_")
      .substring(0, 50);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (formData.label.length < 2) {
        throw new Error("Label must be at least 2 characters");
      }

      if (formData.allowed_extensions.length === 0) {
        throw new Error("Select at least one file type");
      }

      await api.post("/api/admin/document-types", {
        code: generateCode(formData.label),
        label: formData.label,
        description: formData.description || null,
        max_file_size_mb: formData.max_file_size_mb,
        allowed_extensions: formData.allowed_extensions,
      });
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const toggleExtension = (ext: string) => {
    if (formData.allowed_extensions.includes(ext)) {
      setFormData({
        ...formData,
        allowed_extensions: formData.allowed_extensions.filter(
          (e) => e !== ext
        ),
      });
    } else {
      setFormData({
        ...formData,
        allowed_extensions: [...formData.allowed_extensions, ext],
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-brand-card border border-brand-border rounded-lg max-w-md w-full">
        {/* Header */}
        <div className="px-6 py-4 border-b border-brand-border flex items-center justify-between">
          <h3 className="text-lg font-semibold text-brand-text-primary">
            Create Document Type
          </h3>
          <button
            onClick={onClose}
            className="text-brand-text-secondary hover:text-brand-text-primary text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-brand-text-primary mb-1">
              Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.label}
              onChange={(e) =>
                setFormData({ ...formData, label: e.target.value })
              }
              className="w-full px-3 py-2 bg-brand-dark-bg border border-brand-border rounded-lg text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-accent"
              placeholder="e.g., Passport"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-brand-text-primary mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full px-3 py-2 bg-brand-dark-bg border border-brand-border rounded-lg text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-accent"
              placeholder="Brief description of required document"
              rows={2}
            />
          </div>

          {/* Max File Size */}
          <div>
            <label className="block text-sm font-medium text-brand-text-primary mb-1">
              Max File Size (MB)
            </label>
            <input
              type="number"
              min="1"
              max="100"
              value={formData.max_file_size_mb}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  max_file_size_mb: parseInt(e.target.value),
                })
              }
              className="w-full px-3 py-2 bg-brand-dark-bg border border-brand-border rounded-lg text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-accent"
            />
          </div>

          {/* Allowed File Types */}
          <div>
            <label className="block text-sm font-medium text-brand-text-primary mb-2">
              Allowed File Types <span className="text-red-400">*</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {FILE_EXTENSIONS.map((ext) => (
                <label
                  key={ext}
                  className={`px-3 py-1 rounded border cursor-pointer transition-colors ${
                    formData.allowed_extensions.includes(ext)
                      ? "border-brand-accent bg-brand-accent/20 text-brand-accent"
                      : "border-brand-border text-brand-text-secondary hover:border-brand-accent/50"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={formData.allowed_extensions.includes(ext)}
                    onChange={() => toggleExtension(ext)}
                    className="sr-only"
                  />
                  .{ext}
                </label>
              ))}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 border border-brand-border rounded-lg text-brand-text-primary hover:bg-brand-dark-bg/50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-brand-accent text-white rounded-lg hover:bg-brand-accent/90 transition-colors disabled:opacity-50 font-medium"
            >
              {loading ? "Creating..." : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
