"use client";

import { useEffect } from "react";
import { X, ExternalLink } from "lucide-react";

interface DocumentPreviewModalProps {
  url: string;
  name: string;
  onClose: () => void;
}

export function DocumentPreviewModal({
  url,
  name,
  onClose,
}: DocumentPreviewModalProps) {
  // Escape key to close
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  // Determine file type
  const isPdf = url.toLowerCase().includes(".pdf") || url.includes("application/pdf");
  const isImage =
    url.toLowerCase().includes(".jpg") ||
    url.toLowerCase().includes(".jpeg") ||
    url.toLowerCase().includes(".png") ||
    url.toLowerCase().includes(".gif") ||
    url.toLowerCase().includes(".webp");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-5xl max-h-[90vh] bg-[#191A1D] rounded-2xl border border-[#363636] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#363636]">
          <h3 className="text-lg font-semibold text-brand-text-primary truncate">
            {name}
          </h3>
          <div className="flex items-center gap-2">
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg hover:bg-[#2A2B2F] text-brand-text-secondary hover:text-brand-text-primary transition-colors"
              title="Ouvrir dans un nouvel onglet"
            >
              <ExternalLink className="w-5 h-5" />
            </a>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-[#2A2B2F] text-brand-text-secondary hover:text-brand-text-primary transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          {isPdf ? (
            <iframe
              src={url}
              className="w-full h-full min-h-[70vh] rounded-lg bg-white"
              title={name}
            />
          ) : isImage ? (
            <div className="flex items-center justify-center h-full">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt={name}
                className="max-w-full max-h-[70vh] object-contain rounded-lg"
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-brand-text-secondary">
              <p>Apercu non disponible pour ce type de fichier.</p>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-primary hover:bg-brand-primary/90 text-white transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                Telecharger le fichier
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
