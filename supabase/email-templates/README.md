# Templates email Supabase (Auth)

Templates HTML à configurer dans le **Dashboard Supabase** pour les emails d’authentification.

## Où les configurer

1. Ouvrir le [Dashboard Supabase](https://supabase.com/dashboard) du projet.
2. Aller dans **Authentication** → **Email Templates**.
3. Choisir le type d’email à personnaliser (ex. **Magic Link**, **Confirm signup**).
4. Coller le contenu du fichier HTML correspondant dans le champ **Body** (ou **HTML** si disponible).
5. Renseigner un **Subject** cohérent, par exemple :
   - Magic Link : `Votre code de connexion - Partners LLC`
   - Confirm signup : `Confirmez votre inscription - Partners LLC`

## Fichiers

| Fichier | Usage Supabase |
|--------|------------------|
| `confirmation-token.html` | **Magic Link** et/ou **Confirm signup** : lien de connexion + affichage du code OTP ({{ .Token }}). |

## Variables Go template (Supabase)

- `{{ .ConfirmationURL }}` — Lien de confirmation (clic = connexion).
- `{{ .Token }}` — Code OTP à 6 chiffres pour saisie manuelle.
- `{{ .Email }}` — Adresse email du destinataire.
- `{{ .SiteURL }}` — URL du site (config Auth).
- `{{ .RedirectTo }}` — Redirection après confirmation.

Ne pas modifier la syntaxe `{{ .Variable }}`, elle est remplacée par Supabase à l’envoi.
