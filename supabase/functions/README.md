# Supabase Edge Functions

## Resend (emails)

Les fonctions peuvent envoyer des emails via [Resend](https://resend.com) en utilisant le module partagé `_shared/resend.ts`.

### Configuration

1. Créer une clé API sur [Resend – API Keys](https://resend.com/api-keys).
2. Ajouter le secret dans Supabase : **Dashboard** > **Project Settings** > **Edge Functions** > **Secrets** :
   - `RESEND_API_KEY` = votre clé (ex. `re_xxxx`).
3. Vérifier un domaine dans [Resend – Domains](https://resend.com/domains) et utiliser un `from` du type `Nom <noreply@votredomaine.com>`.

### Fonctions

- **send-email** : POST avec body `{ to, subject, html, text?, from? }` pour envoyer un email. Utile pour les automatisations (epic 18) ou les tests.
- **process-automation-job** (à venir, story 18.1) : traite les jobs d’automatisation et peut appeler `sendEmailWithResend` depuis `_shared/resend.ts` pour les actions de type email.

### Utilisation dans une Edge Function

```ts
import { sendEmailWithResend } from "../_shared/resend.ts";

const apiKey = Deno.env.get("RESEND_API_KEY")!;
const result = await sendEmailWithResend(apiKey, {
  to: "client@example.com",
  subject: "Votre dossier",
  html: "<p>Contenu</p>",
  text: "Contenu",
});
if (result.error) {
  console.error("Email failed:", result.error);
}
```
