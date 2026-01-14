"use client";

export function ErrorState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="text-center max-w-md">
        <div className="mb-6">
          <i className="fa-solid fa-exclamation-triangle text-6xl text-brand-danger"></i>
        </div>
        <h3 className="text-xl font-semibold text-brand-text-primary mb-2">
          Erreur de chargement
        </h3>
        <p className="text-brand-text-secondary mb-6">
          Une erreur s'est produite lors du chargement de vos dossiers.
          Veuillez réessayer.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-3 bg-[#50B88A] text-white rounded-lg font-semibold hover:opacity-90 transition-opacity"
        >
          Réessayer
        </button>
      </div>
    </div>
  );
}
