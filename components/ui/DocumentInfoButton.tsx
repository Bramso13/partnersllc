"use client";

import { useState } from "react";

interface DocumentInfoButtonProps {
  onClick: () => void;
  hasDescription: boolean;
  className?: string;
}

/**
 * Refined info button with hover tooltip and smooth interactions
 */
export function DocumentInfoButton({
  onClick,
  hasDescription,
  className = "",
}: DocumentInfoButtonProps) {
  const [isHovered, setIsHovered] = useState(false);

  if (!hasDescription) return null;

  return (
    <div className="relative inline-block">
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`group relative flex items-center justify-center w-7 h-7 rounded-full transition-all duration-200 ${className}`}
        style={{
          background:
            "linear-gradient(135deg, rgba(var(--brand-accent-rgb, 59, 130, 246), 0.15) 0%, rgba(var(--brand-accent-rgb, 59, 130, 246), 0.08) 100%)",
          border: "1px solid rgba(var(--brand-accent-rgb, 59, 130, 246), 0.2)",
          boxShadow: isHovered
            ? "0 0 0 3px rgba(var(--brand-accent-rgb, 59, 130, 246), 0.1)"
            : "none",
        }}
        aria-label="Voir les détails"
      >
        {/* Icon */}
        <svg
          className="w-3.5 h-3.5 text-brand-accent transition-transform duration-200 group-hover:scale-110"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2.5}
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>

        {/* Subtle glow effect on hover */}
        <div
          className="absolute inset-0 rounded-full transition-opacity duration-200"
          style={{
            background:
              "radial-gradient(circle, rgba(var(--brand-accent-rgb, 59, 130, 246), 0.2) 0%, transparent 70%)",
            opacity: isHovered ? 1 : 0,
          }}
        />
      </button>

      {/* Elegant tooltip on hover */}
      {isHovered && (
        <div
          className="absolute left-1/2 -translate-x-1/2 top-full mt-2 z-50 whitespace-nowrap pointer-events-none"
          style={{
            animation: "tooltipFade 0.2s ease-out",
          }}
        >
          <div
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-white shadow-lg"
            style={{
              background:
                "linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(0, 0, 0, 0.85) 100%)",
              backdropFilter: "blur(8px)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
            }}
          >
            En savoir plus
            {/* Arrow */}
            <div
              className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45"
              style={{
                background: "rgba(0, 0, 0, 0.95)",
                borderTop: "1px solid rgba(255, 255, 255, 0.1)",
                borderLeft: "1px solid rgba(255, 255, 255, 0.1)",
              }}
            />
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes tooltipFade {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(-4px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
