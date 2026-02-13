"use client";

import { useEffect, useRef } from "react";
import { MarkdownContent } from "./MarkdownContent";

interface DocumentInfoPanelProps {
  description: string;
  isOpen: boolean;
  onClose: () => void;
  documentName: string;
}

/**
 * Elegant sliding info panel for document descriptions
 * Features frosted glass effect and smooth animations
 */
export function DocumentInfoPanel({
  description,
  isOpen,
  onClose,
  documentName,
}: DocumentInfoPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      // Prevent body scroll when panel is open
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 animate-fadeIn"
        onClick={onClose}
        style={{
          animation: "fadeIn 0.2s ease-out",
        }}
      />

      {/* Panel */}
      <div
        ref={panelRef}
        className="fixed right-0 top-0 h-full w-full max-w-lg bg-brand-card border-l border-brand-border shadow-2xl z-50 flex flex-col"
        style={{
          animation: "slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
          background:
            "linear-gradient(to bottom, var(--brand-card-bg), var(--brand-dark-bg))",
        }}
      >
        {/* Header with frosted glass effect */}
        <div
          className="relative border-b border-brand-border/50 px-6 py-5"
          style={{
            backdropFilter: "blur(12px)",
            background:
              "linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)",
          }}
        >
          {/* Decorative line accent */}
          <div
            className="absolute left-0 top-0 w-1 h-full bg-gradient-to-b from-brand-accent to-transparent"
            style={{
              boxShadow: "0 0 20px rgba(var(--brand-accent-rgb), 0.3)",
            }}
          />

          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 rounded-full bg-brand-accent animate-pulse" />
                <span className="text-xs uppercase tracking-wider text-brand-text-secondary font-medium">
                  Informations
                </span>
              </div>
              <h3 className="text-lg font-semibold text-brand-text-primary leading-tight">
                {documentName}
              </h3>
            </div>

            {/* Close button */}
            <button
              onClick={onClose}
              className="flex-shrink-0 w-9 h-9 rounded-lg bg-brand-dark-bg/50 hover:bg-brand-dark-bg border border-brand-border/50 hover:border-brand-accent/50 flex items-center justify-center transition-all duration-200 group"
              aria-label="Fermer"
            >
              <svg
                className="w-4 h-4 text-brand-text-secondary group-hover:text-brand-text-primary transition-colors"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Content area with custom scrollbar */}
        <div
          className="flex-1 overflow-y-auto px-6 py-6"
          style={{
            scrollbarWidth: "thin",
            scrollbarColor: "rgba(255,255,255,0.2) transparent",
          }}
        >
          {/* Content card with refined styling */}
          <div
            className="rounded-xl p-5 border border-brand-border/30"
            style={{
              background:
                "linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)",
            }}
          >
            <MarkdownContent
              content={description}
              className="prose-sm text-brand-text-secondary"
            />
          </div>

          {/* Subtle footer hint */}
          <div className="mt-6 flex items-center gap-2 text-xs text-brand-text-muted">
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>Appuyez sur Échap pour fermer</span>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        /* Custom scrollbar for webkit browsers */
        .overflow-y-auto::-webkit-scrollbar {
          width: 6px;
        }

        .overflow-y-auto::-webkit-scrollbar-track {
          background: transparent;
        }

        .overflow-y-auto::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 3px;
        }

        .overflow-y-auto::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }
      `}</style>
    </>
  );
}
