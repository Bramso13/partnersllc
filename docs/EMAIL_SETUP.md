# Configuration de l'envoi d'emails avec Resend

## 📧 Service gratuit : Resend

Resend offre **3000 emails gratuits par mois**, ce qui est largement suffisant pour démarrer.

## 🚀 Étapes de configuration

### 1. Créer un compte Resend

1. Allez sur [https://resend.com](https://resend.com)
2. Cliquez sur "Sign Up" (gratuit)
3. Créez votre compte avec votre email

### 2. Obtenir votre clé API

1. Une fois connecté, allez dans **Settings** → **API Keys**
2. Cliquez sur **Create API Key**
3. Donnez un nom à votre clé (ex: "Production" ou "Development")
4. Copiez la clé API (elle commence par `re_...`)
5. ⚠️ **Important** : Sauvegardez-la bien, vous ne pourrez la voir qu'une seule fois !

### 3. Configurer votre domaine (optionnel mais recommandé)

Par défaut, Resend vous permet d'envoyer depuis `onboarding@resend.dev`, mais pour un usage en production :

1. Allez dans **Domains**
2. Cliquez sur **Add Domain**
3. Ajoutez votre domaine (ex: `partners-llc.com`)
4. Suivez les instructions pour configurer les enregistrements DNS
5. Une fois vérifié, vous pourrez envoyer depuis `noreply@votredomaine.com`

### 4. Configurer les variables d'environnement

#### En local (fichier `.env.local`)

Créez un fichier `.env.local` à la racine du projet :

```env
# Resend API Key
RESEND_API_KEY=re_votre_cle_api_ici

# Email expéditeur (optionnel, par défaut: onboarding@resend.dev)
RESEND_FROM_EMAIL=noreply@votredomaine.com

# URL de votre application (pour les liens dans les emails)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

#### Sur Vercel (ou autre plateforme)

1. Allez dans les **Settings** de votre projet
2. Section **Environment Variables**
3. Ajoutez :
   - `RESEND_API_KEY` = votre clé API
   - `RESEND_FROM_EMAIL` = votre email expéditeur (optionnel)
   - `NEXT_PUBLIC_APP_URL` = l'URL de votre site (ex: https://votresite.com)

## 📝 Utilisation

### Depuis le code (côté serveur)

```typescript
import { sendEmail, emailTemplates } from '@/lib/email';

// Exemple 1 : Email simple
await sendEmail({
  to: 'client@example.com',
  subject: 'Bienvenue',
  html: '<h1>Bonjour !</h1><p>Votre compte a été créé.</p>',
});

// Exemple 2 : Utiliser un template
const template = emailTemplates.dossierAccepted('Jean Dupont', 'DOSSIER-123');
await sendEmail({
  to: 'client@example.com',
  ...template,
});
```

### Depuis une route API (côté client)

```typescript
const response = await fetch('/api/send-email', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    to: 'client@example.com',
    subject: 'Notification',
    html: '<p>Votre dossier a été accepté.</p>',
  }),
});
```

## 🎨 Templates disponibles

Le fichier `lib/email.ts` contient plusieurs templates prêts à l'emploi :

- `emailTemplates.dossierAccepted(userName, dossierId)` - Dossier accepté
- `emailTemplates.stepCompleted(userName, stepName)` - Étape complétée
- `emailTemplates.documentReady(userName, documentName)` - Document prêt

## 🔒 Sécurité

- ⚠️ **Ne jamais** commiter votre clé API dans Git
- ✅ Utilisez toujours `.env.local` en local
- ✅ Utilisez les variables d'environnement sur votre plateforme de déploiement
- ✅ Le fichier `.env.local` est déjà dans `.gitignore`

## 📊 Limites gratuites

- **3000 emails/mois** avec Resend gratuit
- Si vous dépassez, vous serez notifié et pourrez passer à un plan payant si nécessaire

## 🆘 Support

- Documentation Resend : [https://resend.com/docs](https://resend.com/docs)
- En cas de problème, vérifiez que :
  1. La clé API est correcte
  2. Les variables d'environnement sont bien configurées
  3. Votre domaine est vérifié (si vous utilisez un domaine personnalisé)

