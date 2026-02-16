// =========================================================
// EMAIL TEMPLATES
// =========================================================

interface BaseTemplateData {
  userName: string;
  unsubscribeUrl?: string;
}

interface WelcomeEmailData extends BaseTemplateData {
  dossierId: string;
  productName: string;
}

interface DocumentUploadConfirmationData extends BaseTemplateData {
  documentType: string;
  dossierId: string;
  dossierUrl: string;
}

/** Email quand un document a été déposé par l'admin/agent pour le client */
interface DocumentWaitingForClientData extends BaseTemplateData {
  dossierUrl: string;
}

interface DocumentApprovedData extends BaseTemplateData {
  documentType: string;
  dossierId: string;
  dossierUrl: string;
}

interface DocumentRejectedData extends BaseTemplateData {
  documentType: string;
  rejectionReason: string;
  dossierId: string;
  dossierUrl: string;
}

interface StepCompletedData extends BaseTemplateData {
  stepName: string;
  dossierId: string;
  dossierUrl: string;
  nextStepName?: string;
}

interface PaymentReminderData extends BaseTemplateData {
  orderId: string;
  amount: number;
  currency: string;
  paymentUrl: string;
}

interface AdminDocumentDeliveredData extends BaseTemplateData {
  documentCount: number;
  dossierId: string;
  dossierUrl: string;
  message?: string;
}

interface AdminStepCompletedData extends BaseTemplateData {
  stepName: string;
  documentCount: number;
  dossierId: string;
  dossierUrl: string;
  message?: string;
}

interface SetPasswordEmailData extends BaseTemplateData {
  setPasswordUrl: string;
  productName?: string;
}

// =========================================================
// BASE TEMPLATE STYLES
// =========================================================

const baseStyles = `
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  line-height: 1.6;
  color: #333333;
`;

const containerStyle = `
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
  background-color: #ffffff;
`;

const headerStyle = `
  background-color: #1a1a1a;
  padding: 30px 20px;
  text-align: center;
`;

const contentStyle = `
  padding: 30px 20px;
  background-color: #ffffff;
`;

const buttonStyle = `
  display: inline-block;
  padding: 12px 24px;
  background-color: #2563eb;
  color: #ffffff;
  text-decoration: none;
  border-radius: 6px;
  font-weight: 600;
  margin: 20px 0;
`;

const footerStyle = `
  padding: 20px;
  background-color: #f9fafb;
  text-align: center;
  font-size: 12px;
  color: #6b7280;
  border-top: 1px solid #e5e7eb;
`;

// =========================================================
// EMAIL TEMPLATES
// =========================================================

/**
 * Generate email HTML with base layout
 */
function generateEmailHTML(
  title: string,
  content: string,
  actionUrl?: string,
  actionText?: string,
  unsubscribeUrl?: string
): string {
  const actionButton = actionUrl && actionText
    ? `<div style="text-align: center;">
         <a href="${actionUrl}" style="${buttonStyle}">${actionText}</a>
       </div>`
    : "";

  const unsubscribeLink = unsubscribeUrl
    ? `<p style="font-size: 12px; color: #6b7280; text-align: center; margin-top: 30px;">
         <a href="${unsubscribeUrl}" style="color: #6b7280;">Se désabonner</a>
       </p>`
    : "";

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="${baseStyles} margin: 0; padding: 0; background-color: #f3f4f6;">
  <div style="${containerStyle}">
    <!-- Header -->
    <div style="${headerStyle}">
      <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Partners LLC</h1>
    </div>
    
    <!-- Content -->
    <div style="${contentStyle}">
      <h2 style="color: #1a1a1a; margin-top: 0;">${title}</h2>
      ${content}
      ${actionButton}
    </div>
    
    <!-- Footer -->
    <div style="${footerStyle}">
      <p style="margin: 0 0 10px 0;">
        <strong>Partners LLC</strong><br>
        Votre partenaire de confiance pour la création d'entreprise
      </p>
      <p style="margin: 0;">
        Pour toute question, contactez-nous à <a href="mailto:support@partnersllc.com" style="color: #2563eb;">support@partnersllc.com</a>
      </p>
      ${unsubscribeLink}
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Generate plain text version
 */
function generatePlainText(
  title: string,
  content: string,
  actionUrl?: string,
  actionText?: string
): string {
  const actionLink = actionUrl && actionText ? `\n\n${actionText}: ${actionUrl}` : "";
  return `${title}\n\n${content}${actionLink}\n\n---\nPartners LLC\nPour toute question: support@partnersllc.com`;
}

// =========================================================
// TEMPLATE FUNCTIONS
// =========================================================

/**
 * Welcome email (after payment)
 */
export function generateWelcomeEmail(data: WelcomeEmailData): { html: string; text: string } {
  const title = "Bienvenue chez Partners LLC !";
  const content = `
    <p>Bonjour ${data.userName},</p>
    <p>Merci pour votre confiance ! Votre paiement a été reçu avec succès et votre dossier <strong>${data.dossierId}</strong> a été créé.</p>
    <p>Vous pouvez maintenant commencer à compléter votre dossier pour le produit <strong>${data.productName}</strong>.</p>
    <p>Nous vous accompagnerons à chaque étape du processus.</p>
  `;

  const unsubscribeUrl = data.unsubscribeUrl
    ? `${data.unsubscribeUrl}?email=${encodeURIComponent(data.userName)}`
    : undefined;

  return {
    html: generateEmailHTML(
      title,
      content,
      undefined,
      undefined,
      unsubscribeUrl
    ),
    text: generatePlainText(title, content.replace(/<[^>]*>/g, "")),
  };
}

/**
 * Document waiting for client — envoyé quand admin/agent a déposé un document pour le client
 */
export function generateDocumentWaitingForClientEmail(
  data: DocumentWaitingForClientData
): { html: string; text: string } {
  const title = "Un document vous attend sur la plateforme";
  const content = `
    <p>Bonjour ${data.userName},</p>
    <p>Votre conseiller a déposé un document sur votre dossier.</p>
    <p>Connectez-vous à votre espace client pour le consulter.</p>
  `;
  return {
    html: generateEmailHTML(
      title,
      content,
      data.dossierUrl,
      "Voir mon dossier"
    ),
    text: generatePlainText(
      title,
      content.replace(/<[^>]*>/g, ""),
      data.dossierUrl,
      "Voir mon dossier"
    ),
  };
}

/**
 * Document upload confirmation
 */
export function generateDocumentUploadConfirmationEmail(
  data: DocumentUploadConfirmationData
): { html: string; text: string } {
  const title = "Document téléchargé avec succès";
  const content = `
    <p>Bonjour ${data.userName},</p>
    <p>Nous avons bien reçu votre document <strong>${data.documentType}</strong> pour le dossier <strong>${data.dossierId}</strong>.</p>
    <p>Notre équipe va maintenant examiner votre document. Vous recevrez une notification une fois l'examen terminé.</p>
  `;

  const unsubscribeUrl = data.unsubscribeUrl
    ? `${data.unsubscribeUrl}?email=${encodeURIComponent(data.userName)}`
    : undefined;

  return {
    html: generateEmailHTML(
      title,
      content,
      data.dossierUrl,
      "Voir mon dossier",
      unsubscribeUrl
    ),
    text: generatePlainText(
      title,
      content.replace(/<[^>]*>/g, ""),
      data.dossierUrl,
      "Voir mon dossier"
    ),
  };
}

/**
 * Document approved notification
 */
export function generateDocumentApprovedEmail(
  data: DocumentApprovedData
): { html: string; text: string } {
  const title = "Document approuvé";
  const content = `
    <p>Bonjour ${data.userName},</p>
    <p>Excellente nouvelle ! Votre document <strong>${data.documentType}</strong> pour le dossier <strong>${data.dossierId}</strong> a été approuvé.</p>
    <p>Vous pouvez continuer avec les prochaines étapes de votre dossier.</p>
  `;

  const unsubscribeUrl = data.unsubscribeUrl
    ? `${data.unsubscribeUrl}?email=${encodeURIComponent(data.userName)}`
    : undefined;

  return {
    html: generateEmailHTML(
      title,
      content,
      data.dossierUrl,
      "Voir mon dossier",
      unsubscribeUrl
    ),
    text: generatePlainText(
      title,
      content.replace(/<[^>]*>/g, ""),
      data.dossierUrl,
      "Voir mon dossier"
    ),
  };
}

/**
 * Document rejected notification
 */
export function generateDocumentRejectedEmail(
  data: DocumentRejectedData
): { html: string; text: string } {
  const title = "Document à corriger";
  const content = `
    <p>Bonjour ${data.userName},</p>
    <p>Votre document <strong>${data.documentType}</strong> pour le dossier <strong>${data.dossierId}</strong> nécessite des corrections.</p>
    <p><strong>Raison :</strong> ${data.rejectionReason}</p>
    <p>Veuillez télécharger une nouvelle version de ce document avec les corrections nécessaires.</p>
  `;

  const unsubscribeUrl = data.unsubscribeUrl
    ? `${data.unsubscribeUrl}?email=${encodeURIComponent(data.userName)}`
    : undefined;

  return {
    html: generateEmailHTML(
      title,
      content,
      data.dossierUrl,
      "Voir mon dossier",
      unsubscribeUrl
    ),
    text: generatePlainText(
      title,
      content.replace(/<[^>]*>/g, ""),
      data.dossierUrl,
      "Voir mon dossier"
    ),
  };
}

/**
 * Step completed notification
 */
export function generateStepCompletedEmail(
  data: StepCompletedData
): { html: string; text: string } {
  const title = "Étape terminée";
  const nextStepInfo = data.nextStepName
    ? `<p>La prochaine étape est : <strong>${data.nextStepName}</strong></p>`
    : "<p>Votre dossier est maintenant complet !</p>";

  const content = `
    <p>Bonjour ${data.userName},</p>
    <p>L'étape <strong>${data.stepName}</strong> de votre dossier <strong>${data.dossierId}</strong> a été terminée avec succès.</p>
    ${nextStepInfo}
  `;

  const unsubscribeUrl = data.unsubscribeUrl
    ? `${data.unsubscribeUrl}?email=${encodeURIComponent(data.userName)}`
    : undefined;

  return {
    html: generateEmailHTML(
      title,
      content,
      data.dossierUrl,
      "Voir mon dossier",
      unsubscribeUrl
    ),
    text: generatePlainText(
      title,
      content.replace(/<[^>]*>/g, ""),
      data.dossierUrl,
      "Voir mon dossier"
    ),
  };
}

/**
 * Payment reminder for SUSPENDED users
 */
export function generatePaymentReminderEmail(
  data: PaymentReminderData
): { html: string; text: string } {
  const title = "Rappel de paiement";
  const amountFormatted = new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: data.currency,
  }).format(data.amount);

  const content = `
    <p>Bonjour ${data.userName},</p>
    <p>Votre dossier a été suspendu en raison d'un paiement en attente.</p>
    <p><strong>Montant à payer :</strong> ${amountFormatted}</p>
    <p>Pour réactiver votre dossier et continuer le processus, veuillez effectuer le paiement.</p>
  `;

  const unsubscribeUrl = data.unsubscribeUrl
    ? `${data.unsubscribeUrl}?email=${encodeURIComponent(data.userName)}`
    : undefined;

  return {
    html: generateEmailHTML(
      title,
      content,
      data.paymentUrl,
      "Effectuer le paiement",
      unsubscribeUrl
    ),
    text: generatePlainText(
      title,
      content.replace(/<[^>]*>/g, ""),
      data.paymentUrl,
      "Effectuer le paiement"
    ),
  };
}

/**
 * Admin document delivered notification
 */
export function generateAdminDocumentDeliveredEmail(
  data: AdminDocumentDeliveredData
): { html: string; text: string } {
  const title = "Nouveaux documents disponibles";
  const documentText = data.documentCount === 1 ? "document" : "documents";
  const messageSection = data.message
    ? `<p><strong>Message de votre conseiller :</strong> ${data.message}</p>`
    : "";

  const content = `
    <p>Bonjour ${data.userName},</p>
    <p>Votre conseiller vous a envoyé <strong>${data.documentCount} ${documentText}</strong> pour le dossier <strong>${data.dossierId}</strong>.</p>
    ${messageSection}
    <p>Vous pouvez consulter et télécharger ces documents dans votre dossier.</p>
  `;

  const unsubscribeUrl = data.unsubscribeUrl
    ? `${data.unsubscribeUrl}?email=${encodeURIComponent(data.userName)}`
    : undefined;

  return {
    html: generateEmailHTML(
      title,
      content,
      data.dossierUrl,
      "Voir mon dossier",
      unsubscribeUrl
    ),
    text: generatePlainText(
      title,
      content.replace(/<[^>]*>/g, ""),
      data.dossierUrl,
      "Voir mon dossier"
    ),
  };
}

/**
 * Set password email — sent when admin creates a client manually
 */
export function generateSetPasswordEmail(data: SetPasswordEmailData): { html: string; text: string } {
  const title = "Votre compte a été créé — Choisissez votre mot de passe";
  const productSection = data.productName
    ? `<p>Vous avez été inscrit pour le produit <strong>${data.productName}</strong>.</p>`
    : "";

  const content = `
    <p>Bonjour ${data.userName},</p>
    <p>Votre compte Partners LLC a été créé par notre équipe.</p>
    ${productSection}
    <p>Pour accéder à votre espace, veuillez choisir votre mot de passe en cliquant sur le bouton ci-dessous.</p>
    <p style="color: #6b7280; font-size: 14px;">Ce lien est valable <strong>24 heures</strong>. Après expiration, contactez notre équipe pour en obtenir un nouveau.</p>
  `;

  return {
    html: generateEmailHTML(
      title,
      content,
      data.setPasswordUrl,
      "Choisir mon mot de passe"
    ),
    text: generatePlainText(
      title,
      content.replace(/<[^>]*>/g, ""),
      data.setPasswordUrl,
      "Choisir mon mot de passe"
    ),
  };
}

/**
 * Admin step completed notification
 */
export function generateAdminStepCompletedEmail(
  data: AdminStepCompletedData
): { html: string; text: string } {
  const title = `Étape "${data.stepName}" terminée`;
  const documentText = data.documentCount === 1 ? "document" : "documents";
  const messageSection = data.message
    ? `<p><strong>Message de votre conseiller :</strong> ${data.message}</p>`
    : "";

  const content = `
    <p>Bonjour ${data.userName},</p>
    <p>Votre conseiller a terminé l'étape <strong>"${data.stepName}"</strong> de votre dossier <strong>${data.dossierId}</strong>.</p>
    <p>Vous avez reçu <strong>${data.documentCount} ${documentText}</strong> dans le cadre de cette étape.</p>
    ${messageSection}
    <p>Vous pouvez consulter et télécharger ces documents dans votre dossier.</p>
  `;

  const unsubscribeUrl = data.unsubscribeUrl
    ? `${data.unsubscribeUrl}?email=${encodeURIComponent(data.userName)}`
    : undefined;

  return {
    html: generateEmailHTML(
      title,
      content,
      data.dossierUrl,
      "Voir mon dossier",
      unsubscribeUrl
    ),
    text: generatePlainText(
      title,
      content.replace(/<[^>]*>/g, ""),
      data.dossierUrl,
      "Voir mon dossier"
    ),
  };
}
