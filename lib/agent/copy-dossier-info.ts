import { DossierAllData } from "./dossiers";

/**
 * Format dossier data into a readable text format for copying
 * @param data All dossier data
 * @returns Formatted text string
 */
export function formatDossierInfoForCopy(data: DossierAllData): string {
  let text = `=== DOSSIER ===\n`;
  text += `ID: ${data.dossier.id}\n`;
  text += `Statut: ${data.dossier.status}\n`;
  text += `Type: ${data.dossier.type}\n`;
  text += `Créé le: ${new Date(data.dossier.created_at).toLocaleDateString(
    "fr-FR"
  )}\n\n`;

  text += `=== CLIENT ===\n`;
  const nameParts = data.client.full_name?.split(" ") || [];
  const firstName = nameParts[0] || "N/A";
  const lastName = nameParts.slice(1).join(" ") || "N/A";
  text += `Prénom: ${firstName}\n`;
  text += `Nom: ${lastName}\n`;
  text += `Téléphone: ${data.client.phone || "N/A"}\n\n`;

  data.step_instances.forEach((stepInstance, index) => {
    text += `=== STEP ${index + 1}: ${stepInstance.step.label || stepInstance.step.code} ===\n`;
    text += `Statut: ${stepInstance.completed_at ? "Complété" : "En cours"}\n`;
    if (stepInstance.started_at) {
      text += `Démarré le: ${new Date(stepInstance.started_at).toLocaleDateString("fr-FR")}\n`;
    }
    if (stepInstance.completed_at) {
      text += `Complété le: ${new Date(stepInstance.completed_at).toLocaleDateString("fr-FR")}\n`;
    }
    text += `\n`;

    if (stepInstance.fields.length > 0) {
      text += `Champs:\n`;
      stepInstance.fields.forEach((field) => {
        let value = "N/A";
        if (field.value) {
          value = field.value;
        } else if (field.value_jsonb) {
          // Handle JSON values
          if (typeof field.value_jsonb === "object") {
            value = JSON.stringify(field.value_jsonb, null, 2);
          } else {
            value = String(field.value_jsonb);
          }
        }
        text += `- ${field.field_label}: ${value}\n`;
      });
      text += `\n`;
    }

  });

  return text;
}
