export function DocumentsEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="mb-6">
        <i className="fa-solid fa-file text-6xl text-brand-text-secondary" />
      </div>
      <h3 className="text-xl font-semibold text-brand-text-primary mb-2">
        Aucun document
      </h3>
      <p className="text-brand-text-secondary text-center max-w-md mb-6">
        Commencez par téléverser votre premier document pour gérer vos fichiers
        légaux et administratifs.
      </p>
    </div>
  );
}
