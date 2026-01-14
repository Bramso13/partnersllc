"use client";

export function DossiersEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 min-h-[400px]">
      <div className="text-center max-w-md">
        <div className="mb-6">
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-brand-accent/20 rounded-full blur-3xl"></div>
            <div className="relative bg-gradient-to-br from-brand-accent/10 to-brand-accent/5 rounded-3xl p-8 border border-brand-accent/20">
              <i className="fa-solid fa-folder-open text-6xl text-brand-accent"></i>
            </div>
          </div>
        </div>
        <h2 className="text-2xl font-bold text-brand-text-primary mb-2">
          Aucun dossier trouvé
        </h2>
        <p className="text-brand-text-secondary mb-6">
          Contactez le support si vous avez récemment effectué un paiement.
        </p>
        <a
          href="/dashboard/support"
          className="inline-flex items-center gap-2 px-6 py-3 bg-brand-accent text-brand-dark-bg rounded-lg hover:opacity-90 transition-opacity font-medium"
        >
          <span>Contacter le support</span>
          <i className="fa-solid fa-arrow-right"></i>
        </a>
      </div>
    </div>
  );
}
