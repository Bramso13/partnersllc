# Exemples d'utilisation de l'envoi d'emails

## 📧 Exemples pratiques

### 1. Envoyer un email quand un dossier est accepté

```typescript
// Dans app/admin/dossier-llc/[id]/page.tsx ou dans une fonction de mise à jour
import { sendEmail, emailTemplates } from '@/lib/email';

async function acceptDossier(dossierId: string, userEmail: string, userName: string) {
  // Mettre à jour le statut du dossier
  await data.updateDossier(dossierId, { status: 'accepte' });
  
  // Envoyer un email de notification
  const template = emailTemplates.dossierAccepted(userName, dossierId);
  await sendEmail({
    to: userEmail,
    ...template,
  });
}
```

### 2. Envoyer un email quand une étape est complétée

```typescript
// Dans app/admin/dossier-llc/[id]/page.tsx
import { sendEmail, emailTemplates } from '@/lib/email';

async function completeStep(stepId: string, stepName: string, userEmail: string, userName: string) {
  // Mettre à jour l'étape
  await data.upsertDossierStep(dossierId, stepId, 'complete', null);
  
  // Envoyer un email de notification
  const template = emailTemplates.stepCompleted(userName, stepName);
  await sendEmail({
    to: userEmail,
    ...template,
  });
}
```

### 3. Envoyer un email quand un document est uploadé

```typescript
// Dans app/admin/dossier-llc/[id]/page.tsx
import { sendEmail, emailTemplates } from '@/lib/email';

async function uploadDocument(documentName: string, userEmail: string, userName: string) {
  // Uploader le document...
  
  // Envoyer un email de notification
  const template = emailTemplates.documentReady(userName, documentName);
  await sendEmail({
    to: userEmail,
    ...template,
  });
}
```

### 4. Envoyer un email personnalisé depuis une route API

```typescript
// app/api/notify-user/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  const { userId, message } = await request.json();
  
  // Récupérer l'email de l'utilisateur depuis la base de données
  const user = await getUserById(userId);
  
  await sendEmail({
    to: user.email,
    subject: 'Notification importante',
    html: `
      <h1>Bonjour ${user.full_name},</h1>
      <p>${message}</p>
    `,
  });
  
  return NextResponse.json({ success: true });
}
```

### 5. Envoyer un email depuis le client (via API)

```typescript
// Dans un composant React
async function notifyUser() {
  const response = await fetch('/api/send-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to: 'client@example.com',
      subject: 'Votre dossier est prêt',
      html: '<h1>Bonjour !</h1><p>Votre dossier a été traité.</p>',
    }),
  });
  
  const result = await response.json();
  if (result.success) {
    console.log('Email envoyé !');
  }
}
```

## 🎯 Points importants

1. **Toujours utiliser côté serveur** : Les emails doivent être envoyés depuis le serveur (routes API ou Server Components) pour protéger votre clé API.

2. **Gestion des erreurs** : Toujours gérer les erreurs d'envoi d'email :
```typescript
try {
  const result = await sendEmail({ ... });
  if (!result.success) {
    console.error('Erreur:', result.error);
    // Gérer l'erreur (afficher un message à l'utilisateur, etc.)
  }
} catch (error) {
  console.error('Erreur inattendue:', error);
}
```

3. **Ne pas bloquer l'interface** : L'envoi d'email peut prendre du temps, ne bloquez pas l'interface utilisateur :
```typescript
// ✅ Bon : Envoyer en arrière-plan
sendEmail({ ... }).catch(console.error);

// ❌ Mauvais : Attendre la réponse
await sendEmail({ ... }); // Peut bloquer l'UI
```

## 🔄 Intégration dans votre workflow

Pour intégrer l'envoi d'emails dans votre application :

1. Identifiez les moments clés où envoyer des emails :
   - Dossier accepté/refusé
   - Étape complétée
   - Document uploadé
   - Notification importante

2. Ajoutez l'appel à `sendEmail()` après chaque action importante

3. Testez avec votre propre email avant de déployer en production

