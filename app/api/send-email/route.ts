import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';

/**
 * Route API pour envoyer des emails
 * POST /api/send-email
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to, subject, html, from } = body;

    // Validation
    if (!to || !subject || !html) {
      return NextResponse.json(
        { error: 'Les champs "to", "subject" et "html" sont requis' },
        { status: 400 }
      );
    }

    // Vérifier que la clé API Resend est configurée
    if (!process.env.RESEND_API_KEY) {
      console.error('RESEND_API_KEY n\'est pas configurée');
      return NextResponse.json(
        { error: 'Configuration email manquante' },
        { status: 500 }
      );
    }

    // Envoyer l'email
    const result = await sendEmail({ to, subject, html, from });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Erreur lors de l\'envoi de l\'email' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Email envoyé avec succès',
      data: result.data 
    });
  } catch (error: any) {
    console.error('Erreur dans /api/send-email:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    );
  }
}

