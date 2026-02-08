import type { AdminStepViewProps } from "../types";

/**
 * AdminStepView Component
 *
 * Read-only view for ADMIN steps.
 * Displays:
 * - Admin step status (pending/in progress/completed)
 * - Documents uploaded by the admin (if completed)
 * - Navigation buttons
 */
export function AdminStepView({
  currentStepInstance,
  uploadedDocuments,
  dossierId,
  onViewDocument,
  onNavigateNext,
  onNavigatePrevious,
  currentStepIndex,
  totalSteps,
  isNextStepBlockedByTimer,
}: AdminStepViewProps) {
  return (
    <div className="bg-brand-card border border-brand-border rounded-lg p-6">
      <div className="flex items-start gap-4 mb-6">
        <div className="flex-shrink-0">
          <div className="w-12 h-12 bg-brand-warning/20 rounded-lg flex items-center justify-center">
            <i className="fas fa-user-shield text-brand-warning text-xl"></i>
          </div>
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-brand-text-primary mb-2">
            Étape gérée par votre conseiller
          </h3>
          <p className="text-sm text-brand-text-secondary">
            {currentStepInstance?.completed_at
              ? "Votre conseiller a complété cette étape. Les documents sont disponibles ci-dessous."
              : currentStepInstance?.started_at
                ? "Votre conseiller travaille actuellement sur cette étape. Vous recevrez une notification lorsque les documents seront disponibles."
                : "Cette étape sera traitée par votre conseiller. Vous recevrez une notification lorsqu'elle sera complétée."}
          </p>
        </div>
      </div>

      {/* Admin Step Status */}
      {currentStepInstance && (
        <div>
          <div className="flex items-center gap-2 mb-6">
            <span
              className={`px-3 py-1 rounded text-sm font-medium ${
                currentStepInstance.completed_at
                  ? "bg-brand-success/20 text-brand-success"
                  : currentStepInstance.started_at
                    ? "bg-brand-warning/20 text-brand-warning"
                    : "bg-brand-dark-surface text-brand-text-secondary"
              }`}
            >
              {currentStepInstance.completed_at
                ? "✓ Complété"
                : currentStepInstance.started_at
                  ? "⏳ En cours"
                  : "⏸ En attente"}
            </span>
            {currentStepInstance.completed_at && (
              <span className="text-sm text-brand-text-secondary">
                le{" "}
                {new Date(currentStepInstance.completed_at).toLocaleDateString(
                  "fr-FR",
                  {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  }
                )}
              </span>
            )}
          </div>

          {/* Documents Received from Admin */}
          {currentStepInstance.completed_at && (
            <div className="border-t border-brand-border pt-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-base font-semibold text-brand-text-primary">
                  Documents disponibles
                </h4>
                {uploadedDocuments.length > 0 && (
                  <span className="text-sm text-brand-text-secondary">
                    {uploadedDocuments.length} document
                    {uploadedDocuments.length > 1 ? "s" : ""}
                  </span>
                )}
              </div>
              {uploadedDocuments.length > 0 ? (
                <div id="admin-step-documents" className="space-y-3">
                  {uploadedDocuments.map((doc: any) => {
                    const fileName =
                      doc.current_version?.file_name ||
                      doc.file_name ||
                      "Document";
                    const uploadedAt =
                      doc.current_version?.uploaded_at || doc.created_at;
                    const fileSize =
                      doc.current_version?.file_size_bytes ||
                      doc.file_size_bytes;

                    return (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between p-4 bg-brand-dark-bg rounded-lg border border-brand-border hover:border-brand-accent/50 transition-colors"
                      >
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          <div className="flex-shrink-0">
                            <div className="w-10 h-10 bg-brand-primary/20 rounded-lg flex items-center justify-center">
                              <i className="fas fa-file-pdf text-brand-primary"></i>
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-brand-text-primary truncate">
                              {fileName}
                            </p>
                            <div className="flex items-center gap-3 mt-1">
                              {uploadedAt && (
                                <p className="text-xs text-brand-text-secondary">
                                  {new Date(uploadedAt).toLocaleDateString(
                                    "fr-FR",
                                    {
                                      day: "numeric",
                                      month: "short",
                                      year: "numeric",
                                    }
                                  )}
                                </p>
                              )}
                              {fileSize && (
                                <p className="text-xs text-brand-text-secondary">
                                  {(fileSize / 1024 / 1024).toFixed(2)} MB
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <button
                            onClick={() => onViewDocument(doc)}
                            className="px-3 py-2 text-sm bg-brand-dark-surface text-brand-text-primary rounded-lg hover:bg-brand-dark-surface/80 transition-colors"
                            title="Prévisualiser"
                          >
                            <i className="fas fa-eye"></i>
                          </button>
                          <a
                            href={`/api/dossiers/${dossierId}/documents/${doc.id}/download`}
                            download
                            className="px-4 py-2 text-sm bg-brand-accent text-white rounded-lg hover:bg-brand-accent/90 transition-colors font-medium"
                            title="Télécharger"
                          >
                            <i className="fas fa-download mr-2"></i>
                            Télécharger
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 bg-brand-dark-bg rounded-lg border border-brand-border border-dashed">
                  <i className="fas fa-inbox text-3xl text-brand-text-secondary mb-3"></i>
                  <p className="text-sm font-medium text-brand-text-secondary">
                    Aucun document disponible
                  </p>
                  <p className="text-xs text-brand-text-secondary mt-1">
                    Votre conseiller n&apos;a pas encore ajouté de documents
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Navigation buttons for admin steps */}
      <div className="pt-6 border-t border-brand-border flex items-center justify-between mt-6">
        {currentStepIndex > 0 && (
          <button
            type="button"
            onClick={onNavigatePrevious}
            className="px-6 py-3 text-brand-text-secondary hover:text-brand-text-primary transition-colors"
          >
            <i className="fa-solid fa-arrow-left mr-2"></i>
            Étape précédente
          </button>
        )}
        <button
          type="button"
          onClick={onNavigateNext}
          disabled={isNextStepBlockedByTimer}
          className="ml-auto px-8 py-3.5 rounded-xl font-semibold text-base
            bg-brand-accent text-brand-dark-bg
            transition-all duration-300
            hover:opacity-90 hover:translate-y-[-2px] hover:shadow-[0_6px_20px_rgba(0,240,255,0.3)]
            flex items-center justify-center gap-2"
        >
          {currentStepIndex === totalSteps - 1 ? (
            "Retour au tableau de bord"
          ) : (
            <>
              Étape suivante
              <i className="fa-solid fa-arrow-right"></i>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
