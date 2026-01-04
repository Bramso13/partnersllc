import { Resend } from 'resend';

// Initialiser Resend avec la clé API depuis les variables d'environnement
// Vérifier si la clé API est disponible
const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
}

/**
 * Envoyer un email via Resend
 */
export async function sendEmail({ to, subject, html, from }: EmailOptions) {
  try {
    // Vérifier si Resend est configuré
    if (!resend || !resendApiKey) {
      const errorMsg = 'RESEND_API_KEY n\'est pas configurée. Veuillez ajouter votre clé API dans les variables d\'environnement.';
      console.error(errorMsg);
      return { success: false, error: { message: errorMsg } };
    }

    // Utiliser l'email par défaut ou celui configuré dans les variables d'environnement
    const fromEmail = from || process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
    
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
    });

    if (error) {
      console.error('Erreur lors de l\'envoi de l\'email:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error: any) {
    console.error('Erreur lors de l\'envoi de l\'email:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Templates d'emails prédéfinis
 */
export const emailTemplates = {
  /**
   * Email de notification de dossier accepté
   */
  dossierAccepted: (userName: string, dossierId: string) => ({
    subject: 'Votre dossier LLC a été accepté',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #10b981; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; padding: 12px 24px; background-color: #10b981; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Dossier Accepté ✓</h1>
            </div>
            <div class="content">
              <p>Bonjour ${userName},</p>
              <p>Nous avons le plaisir de vous informer que votre dossier LLC (${dossierId}) a été accepté.</p>
              <p>Votre demande est maintenant en cours de traitement. Vous recevrez une notification dès que vos documents officiels seront prêts.</p>
              <p>Délai estimé : 48h (jours ouvrables)</p>
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard" class="button">Voir mon dossier</a>
              <p style="margin-top: 30px; font-size: 12px; color: #6b7280;">
                Cordialement,<br>
                L'équipe PARTNERS LLC
              </p>
            </div>
          </div>
        </body>
      </html>
    `,
  }),

  /**
   * Email de notification d'étape complétée
   */
  stepCompleted: (userName: string, stepName: string) => ({
    subject: `Étape "${stepName}" complétée`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #10b981; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Étape Complétée ✓</h1>
            </div>
            <div class="content">
              <p>Bonjour ${userName},</p>
              <p>L'étape "${stepName}" de votre dossier LLC a été complétée avec succès.</p>
              <p>Vous pouvez suivre l'avancement de votre dossier depuis votre tableau de bord.</p>
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard" style="display: inline-block; padding: 12px 24px; background-color: #10b981; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px;">Voir mon dossier</a>
              <p style="margin-top: 30px; font-size: 12px; color: #6b7280;">
                Cordialement,<br>
                L'équipe PARTNERS LLC
              </p>
            </div>
          </div>
        </body>
      </html>
    `,
  }),

  /**
   * Email de notification quand l'étape 3 (Enregistrement) est validée par l'admin
   */
  step3Validated: (userName: string) => ({
    subject: 'Votre dossier LLC a été accepté',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #10b981; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; padding: 12px 24px; background-color: #10b981; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
            .highlight { background-color: #d1fae5; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #10b981; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Dossier Accepté ✓</h1>
            </div>
            <div class="content">
              <p>Bonjour ${userName},</p>
              <div class="highlight">
                <p style="margin: 0; font-weight: 600; color: #065f46;">Nous avons le plaisir de vous informer que PARTNERS LLC a bien accepté tous vos documents et que votre demande est maintenant en cours de traitement.</p>
              </div>
              <p>Votre dossier a été validé avec succès et notre équipe procède actuellement aux démarches nécessaires pour finaliser votre création de LLC.</p>
              <p>Vous serez notifié par email dès que vos documents officiels seront prêts. Le délai estimé est de 48 heures (jours ouvrables), sous réserve du traitement par le secrétaire d'État.</p>
              <p>Vous pouvez suivre l'avancement de votre dossier en temps réel depuis votre tableau de bord.</p>
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard" class="button">Voir mon dossier</a>
              <p style="margin-top: 30px; font-size: 12px; color: #6b7280;">
                Cordialement,<br>
                L'équipe PARTNERS LLC
              </p>
            </div>
          </div>
        </body>
      </html>
    `,
  }),

  /**
   * Email de félicitations quand l'étape 4 (Obtention EIN) est validée - LLC créée
   */
  step4Validated: (userName: string, llcName: string) => ({
    subject: 'Félicitations ! Votre LLC a été créée avec succès',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; padding: 12px 24px; background-color: #10b981; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
            .highlight { background-color: #d1fae5; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #10b981; }
            .success-icon { font-size: 48px; margin-bottom: 10px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="success-icon">🎉</div>
              <h1 style="margin: 0; font-size: 28px;">Félicitations !</h1>
            </div>
            <div class="content">
              <p style="font-size: 18px; font-weight: 600; color: #065f46; margin-top: 0;">Bonjour ${userName},</p>
              <div class="highlight">
                <p style="margin: 0; font-weight: 600; color: #065f46; font-size: 16px;">Nous avons le plaisir de vous annoncer que votre LLC <strong>"${llcName}"</strong> a été créée avec succès !</p>
              </div>
              <p>Votre entreprise est maintenant officiellement enregistrée et opérationnelle. Tous les documents nécessaires ont été validés et votre LLC est prête à démarrer ses activités.</p>
              <p>Vous pouvez désormais :</p>
              <ul style="color: #374151; line-height: 2;">
                <li>Utiliser votre numéro EIN pour vos opérations bancaires et fiscales</li>
                <li>Commencer vos activités commerciales</li>
                <li>Accéder à tous vos documents officiels depuis votre espace</li>
              </ul>
              <p style="margin-top: 25px;">Tous vos documents officiels sont disponibles dans votre espace personnel. Nous restons à votre disposition pour toute question ou assistance supplémentaire.</p>
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/documents" class="button">Voir mes documents</a>
              <p style="margin-top: 30px; font-size: 12px; color: #6b7280;">
                Cordialement,<br>
                L'équipe PARTNERS LLC
              </p>
            </div>
          </div>
        </body>
      </html>
    `,
  }),

  /**
   * Email de notification quand l'étape 5 (EIN) est validée par l'admin
   */
  step5Validated: (userName: string) => ({
    subject: 'Enregistrement EIN en cours',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; padding: 12px 24px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
            .highlight { background-color: #dbeafe; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #3b82f6; }
            .info-icon { font-size: 48px; margin-bottom: 10px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="info-icon">📋</div>
              <h1 style="margin: 0; font-size: 28px;">Enregistrement EIN en cours</h1>
            </div>
            <div class="content">
              <p style="font-size: 18px; font-weight: 600; color: #1e40af; margin-top: 0;">Bonjour ${userName},</p>
              <div class="highlight">
                <p style="margin: 0; font-weight: 600; color: #1e40af; font-size: 16px;">Votre demande d'enregistrement EIN (Employer Identification Number) est maintenant en cours de traitement.</p>
              </div>
              <p>Nous avons bien reçu votre demande et notre équipe procède actuellement à l'obtention de votre numéro EIN auprès des autorités compétentes.</p>
              <p>Dès que votre EIN sera validé et attribué, vous recevrez automatiquement un document officiel contenant votre numéro EIN dans votre espace personnel. Ce document sera disponible dans la section "Documents" de votre tableau de bord.</p>
              <p>Le délai de traitement peut varier selon les autorités, mais nous vous tiendrons informé de l'avancement. Vous recevrez une notification par email dès que votre document EIN sera disponible.</p>
              <p>En attendant, vous pouvez suivre l'avancement de votre dossier depuis votre tableau de bord.</p>
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/documents" class="button">Voir mes documents</a>
              <p style="margin-top: 30px; font-size: 12px; color: #6b7280;">
                Cordialement,<br>
                L'équipe PARTNERS LLC
              </p>
            </div>
          </div>
        </body>
      </html>
    `,
  }),

  /**
   * Email de notification finale quand l'EIN est disponible (étape 6)
   */
  step6EINReady: (userName: string, llcName: string) => ({
    subject: 'Excellent ! Votre EIN est disponible',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 40px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; padding: 14px 28px; background-color: #10b981; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; font-weight: 600; }
            .highlight { background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%); padding: 25px; border-radius: 8px; margin: 25px 0; border: 2px solid #10b981; text-align: center; }
            .success-icon { font-size: 64px; margin-bottom: 15px; }
            .ein-badge { display: inline-block; background-color: white; color: #10b981; padding: 8px 16px; border-radius: 20px; font-weight: 700; font-size: 14px; margin-top: 10px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="success-icon">🎊</div>
              <h1 style="margin: 0; font-size: 32px; font-weight: 700;">Excellent !</h1>
              <p style="margin: 10px 0 0 0; font-size: 18px; opacity: 0.95;">Votre EIN est disponible</p>
            </div>
            <div class="content">
              <p style="font-size: 20px; font-weight: 600; color: #065f46; margin-top: 0;">Bonjour ${userName},</p>
              <div class="highlight">
                <p style="margin: 0; font-weight: 700; color: #065f46; font-size: 18px; line-height: 1.5;">
                  Félicitations ! Votre numéro EIN (Employer Identification Number) pour votre LLC <strong>"${llcName}"</strong> a été obtenu avec succès.
                </p>
                <div class="ein-badge">EIN DISPONIBLE</div>
              </div>
              <p style="font-size: 16px; color: #374151; margin-top: 25px;">Votre document officiel contenant votre numéro EIN est maintenant disponible dans votre espace personnel. Vous pouvez le télécharger et l'utiliser immédiatement pour toutes vos démarches administratives, bancaires et fiscales.</p>
              <p style="font-size: 16px; color: #374151;">Ce document est essentiel pour :</p>
              <ul style="color: #374151; line-height: 2.2; font-size: 15px; padding-left: 20px;">
                <li>Ouvrir un compte bancaire professionnel</li>
                <li>Effectuer vos déclarations fiscales</li>
                <li>Embaucher des employés</li>
                <li>Effectuer toutes vos transactions commerciales</li>
              </ul>
              <p style="font-size: 16px; color: #374151; margin-top: 25px; font-weight: 600;">Allez récupérer votre document EIN dès maintenant dans la section "Documents" de votre espace.</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/documents" class="button">📄 Voir mes documents</a>
              </div>
              <p style="margin-top: 30px; font-size: 14px; color: #6b7280; line-height: 1.8;">
                Votre LLC est maintenant complètement opérationnelle ! Nous sommes ravis d'avoir accompagné votre création d'entreprise et restons à votre disposition pour toute question ou assistance supplémentaire.
              </p>
              <p style="margin-top: 30px; font-size: 12px; color: #6b7280;">
                Cordialement,<br>
                <strong>L'équipe PARTNERS LLC</strong>
              </p>
            </div>
          </div>
        </body>
      </html>
    `,
  }),

  /**
   * Email de notification de document prêt
   */
  documentReady: (userName: string, documentName: string) => ({
    subject: 'Votre document est prêt',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #10b981; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Document Prêt ✓</h1>
            </div>
            <div class="content">
              <p>Bonjour ${userName},</p>
              <p>Votre document "${documentName}" est maintenant disponible dans votre espace.</p>
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/documents" style="display: inline-block; padding: 12px 24px; background-color: #10b981; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px;">Voir mes documents</a>
              <p style="margin-top: 30px; font-size: 12px; color: #6b7280;">
                Cordialement,<br>
                L'équipe PARTNERS LLC
              </p>
            </div>
          </div>
        </body>
      </html>
    `,
  }),
};

