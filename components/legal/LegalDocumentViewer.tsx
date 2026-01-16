"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface LegalDocumentViewerProps {
  title: string;
  subtitle: string;
  content: string;
}

export function LegalDocumentViewer({
  title,
  subtitle,
  content,
}: LegalDocumentViewerProps) {
  const router = useRouter();
  const [returnUrl, setReturnUrl] = useState<string | null>(null);

  // Lire le paramètre return depuis l'URL
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const returnParam = params.get("return");
      setReturnUrl(returnParam);
    }
  }, []);

  // Convert plain text to formatted HTML
  const formatContent = (text: string) => {
    return text
      .split("\n")
      .map((line) => {
        if (line.trim().length === 0) {
          return "";
        }

        // Headers (ARTICLE, PRÉAMBULE, numbered sections, all caps lines)
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

        // Sub-headers (numbered subsections like 2.1., A., B.)
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

  const handleBack = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    
    // Si on a une URL de retour, l'utiliser
    if (returnUrl) {
      router.push(returnUrl);
      return;
    }
    
    // Sinon, utiliser window.history.back() ou fermer la fenêtre
    if (window.history.length > 1) {
      window.history.back();
    } else {
      // Si c'est un nouvel onglet, essayer de le fermer
      try {
        window.close();
        // Si window.close() ne fonctionne pas (bloqué par le navigateur), rediriger vers l'accueil
        setTimeout(() => {
          if (!document.hidden) {
            router.push("/");
          }
        }, 100);
      } catch {
        router.push("/");
      }
    }
  };

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-[#363636] rounded-[18px] p-8 md:p-12 shadow-2xl">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              {title}
            </h1>
            <p className="text-text-secondary">{subtitle}</p>
          </div>

          {/* Content */}
          <div
            className="prose prose-invert max-w-none text-foreground"
            dangerouslySetInnerHTML={{ __html: formattedContent }}
          />

          {/* Footer */}
          <div className="mt-12 pt-8 border-t border-border">
            <p className="text-sm text-text-secondary">
              Dernière mise à jour : 16 janvier 2026
            </p>
            <div className="mt-4">
              <button
                type="button"
                onClick={handleBack}
                className="text-accent hover:underline inline-flex items-center gap-2 cursor-pointer bg-transparent border-none p-0 focus:outline-none focus:ring-2 focus:ring-accent rounded"
              >
                <i className="fa-solid fa-arrow-left"></i>
                Retour
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
