export function PendingStatus() {
  return (
    <div className="bg-surface border border-border rounded-lg p-6">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-2xl">⏳</span>
        <h2 className="text-xl font-semibold text-foreground">
          Paiement en cours de traitement
        </h2>
      </div>
      <p className="text-text-secondary mb-6">
        Votre paiement est en cours de traitement. Vous recevrez un email lorsque
        votre compte sera activé.
      </p>
      <div className="bg-surface border border-border rounded-lg p-4">
        <h3 className="text-lg font-medium text-foreground mb-3">
          Statut de la commande
        </h3>
        <div className="flex items-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-accent"></div>
          <span className="text-text-secondary">Traitement en cours...</span>
        </div>
      </div>
    </div>
  );
}
