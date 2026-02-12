# API Hub Signup – Step 1 (Type de compte)

**Story 14.5** – Première étape du tunnel d'inscription Partners Hub.

## POST `/api/hub/signup/step1`

Crée une session d'inscription temporaire (24h) et détermine si l'utilisateur est un client Partners LLC existant.

### Request

- **Method:** `POST`
- **Headers:** `Content-Type: application/json`
- **Body (JSON):**

| Champ        | Type   | Obligatoire | Description |
|-------------|--------|-------------|-------------|
| `accountType` | `'new'` \| `'existing_llc'` | Oui | Type de compte : nouveau membre ou client LLC existant |
| `email`       | string | Si `accountType === 'existing_llc'` | Email du client LLC (format email valide) |

### Response 200 (succès)

```json
{
  "signup_session_id": "uuid",
  "next_step": "step2",
  "is_llc_client": false
}
```

- `signup_session_id` : identifiant de la session (à envoyer aux étapes suivantes).
- `next_step` : toujours `"step2"`.
- `is_llc_client` : `true` si l’email a été trouvé comme client Partners LLC, sinon `false`.

### Erreurs

| Status | Body | Cas |
|--------|------|-----|
| 400 | `{ "error": "message" }` | Validation échouée (body invalide, `existing_llc` sans email, email invalide). |
| 404 | `{ "error": "Email non trouvé dans nos clients Partners LLC" }` | `accountType === 'existing_llc'` et email inconnu ou pas client. |
| 500 | `{ "error": "message" }` | Erreur serveur (DB, session, etc.). |

### Exemple cURL

```bash
# Nouveau membre
curl -X POST http://localhost:3000/api/hub/signup/step1 \
  -H "Content-Type: application/json" \
  -d '{"accountType":"new"}'

# Client LLC existant
curl -X POST http://localhost:3000/api/hub/signup/step1 \
  -H "Content-Type: application/json" \
  -d '{"accountType":"existing_llc","email":"client@example.com"}'
```
