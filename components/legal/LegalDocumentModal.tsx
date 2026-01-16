"use client";

import { useEffect, useState } from "react";

interface LegalDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentType: "cgv" | "refund_policy";
  title: string;
}

export function LegalDocumentModal({
  isOpen,
  onClose,
  documentType,
  title,
}: LegalDocumentModalProps) {
  const [content, setContent] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Charger le contenu du document
  useEffect(() => {
    if (!isOpen) return;

    setIsLoading(true);
    setError(null);

    const loadDocument = async () => {
      try {
        const response = await fetch(`/api/documents-legaux/${documentType}`);
        if (!response.ok) {
          throw new Error("Erreur lors du chargement du document");
        }
        const data = await response.json();
        setContent(data.content || "");
      } catch (err) {
        console.error("Error loading document:", err);
        setError("Impossible de charger le document");
      } finally {
        setIsLoading(false);
      }
    };

    loadDocument();
  }, [isOpen, documentType]);

  // Fermer avec la touche Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  // Empêcher le scroll du body quand le modal est ouvert
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Format du contenu
  const formatContent = (text: string) => {
    return text
      .split("\n")
      .map((line) => {
        if (line.trim().length === 0) {
          return "";
        }

        // Headers
        if (
          line.startsWith("ARTICLE") ||
          line.startsWith("PRÉAMBULE") ||
          line.match(/^\d+\.\s+[A-Z]/) ||
          (line.match(/^[A-ZÀÂÄÉÈÊËÏÎÔÖÙÛÜŸÇ\s]+$/) &&
            line.trim().length > 5 &&
            !line.includes(":"))
        ) {
          return `<h2 class="text-xl font-bold text-foreground mt-6 mb-3">${line.trim()}</h2>`;
        }

        // Sub-headers
        if (
          line.match(/^\d+\.\d+\./) ||
          line.startsWith("A.") ||
          line.startsWith("B.") ||
          line.startsWith("C.")
        ) {
          return `<h3 class="text-lg font-semibold text-foreground mt-4 mb-2">${line.trim()}</h3>`;
        }

        // List items
        if (line.trim().startsWith("•") || line.trim().startsWith("-")) {
          return `<p class="text-foreground ml-4 mb-2">${line.trim()}</p>`;
        }

        // Regular paragraphs
        return `<p class="text-foreground mb-2">${line.trim()}</p>`;
      })
      .join("\n");
  };

  const formattedContent = formatContent(content);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative bg-[#363636] rounded-[18px] w-full max-w-4xl max-h-[90vh] shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-2xl font-bold text-foreground">{title}</h2>
          <button
            onClick={onClose}
            className="text-text-secondary hover:text-foreground transition-colors p-2 hover:bg-surface rounded-md"
            aria-label="Fermer"
          >
            <i className="fa-solid fa-times text-xl"></i>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 md:p-12">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <i className="fa-solid fa-spinner fa-spin text-2xl text-accent"></i>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-danger">{error}</p>
            </div>
          ) : (
            <div
              className="prose prose-invert max-w-none text-foreground"
              dangerouslySetInnerHTML={{ __html: formattedContent }}
            />
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border flex items-center justify-between">
          <p className="text-sm text-text-secondary">
            Dernière mise à jour : 16 janvier 2026
          </p>
          <button
            onClick={onClose}
            className="bg-accent text-background font-medium px-6 py-2 rounded-md hover:opacity-90 transition-all"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
