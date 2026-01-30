"use client";

export function FormationsEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 min-h-[500px]">
      <div className="text-center max-w-md">
        {/* Icon */}
        <div className="mb-6 relative inline-block">
          <div className="absolute inset-0 bg-accent/20 rounded-full blur-2xl"></div>
          <div className="relative bg-gradient-to-br from-accent/10 to-accent/5 rounded-2xl p-8 border border-accent/20">
            <i className="fa-solid fa-graduation-cap text-6xl text-accent"></i>
          </div>
        </div>

        {/* Heading */}
        <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
          Aucune formation disponible
        </h2>

        {/* Description */}
        <p className="text-text-secondary mb-6">
          Les formations seront disponibles en fonction de vos produits et
          dossiers. Revenez plus tard pour découvrir de nouvelles ressources.
        </p>

        {/* Info card */}
        <div className="bg-surface border border-border rounded-xl p-4 text-left">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-accent/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <i className="fa-solid fa-info text-accent text-sm"></i>
            </div>
            <div>
              <h4 className="font-semibold text-foreground text-sm mb-1">
                Comment accéder aux formations ?
              </h4>
              <p className="text-xs text-text-secondary">
                Les formations sont associées à vos produits et services. Une
                fois que vous avez commandé un produit, les formations
                correspondantes apparaîtront automatiquement ici.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
