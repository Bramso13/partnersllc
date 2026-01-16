# Configuration du Mode Test pour les Emails

## Vue d'ensemble

Pour le développement local, le système d'email utilise **Ethereal Email** pour capturer tous les emails envoyés sans risquer d'envoyer à de vrais utilisateurs.

## Configuration

### 1. Variables d'environnement

Ajoutez les variables suivantes à votre fichier `.env.local` :

```bash
# Mode test email (développement uniquement)
EMAIL_TEST_MODE=true

# Configuration Ethereal (générée automatiquement ou manuellement)
ETHEREAL_USER=your-ethereal-email@ethereal.email
ETHEREAL_PASS=your-ethereal-password
```

### 2. Créer un compte Ethereal

#### Option A : Automatique (recommandé)

Le système peut créer automatiquement un compte Ethereal au démarrage. Utilisez la fonction `createTestAccount()` :

```typescript
import { createTestAccount } from "@/lib/notifications/email";

const account = await createTestAccount();
console.log("Ethereal Account:", account);
// Utilisez account.user et account.pass dans vos variables d'environnement
```

#### Option B : Manuel

1. Visitez https://ethereal.email/
2. Cliquez sur "Create Ethereal Account"
3. Copiez les identifiants SMTP fournis
4. Ajoutez-les à votre `.env.local`

### 3. Configuration SMTP Production

Pour la production, configurez vos variables SMTP :

```bash
# Configuration SMTP Production
SMTP_HOST=smtp.sendgrid.net  # ou votre fournisseur SMTP
SMTP_PORT=587
SMTP_SECURE=false  # true pour port 465 (SSL), false pour port 587 (TLS)
SMTP_USER=your-smtp-username
SMTP_PASS=your-smtp-password
SMTP_FROM=noreply@partnersllc.com
```

### 4. Vérifier la connexion

Vous pouvez vérifier la connexion email avec :

```typescript
import { verifyEmailConnection } from "@/lib/notifications/email";

const isConnected = await verifyEmailConnection();
console.log("Email connection:", isConnected ? "OK" : "FAILED");
```

## Utilisation

### Mode Test (Développement)

Quand `EMAIL_TEST_MODE=true` et `NODE_ENV=development` :
- Tous les emails sont envoyés via Ethereal
- Les emails sont capturés dans le dashboard Ethereal
- Aucun email n'est envoyé à de vrais destinataires
- Vous pouvez voir le contenu HTML/text de chaque email

### Mode Production

Quand `EMAIL_TEST_MODE` n'est pas défini ou `NODE_ENV=production` :
- Les emails sont envoyés via la configuration SMTP de production
- Les emails sont réellement délivrés aux destinataires

## Dashboard Ethereal

Une fois qu'un email est envoyé en mode test :

1. Visitez https://ethereal.email/
2. Connectez-vous avec vos identifiants Ethereal
3. Vous verrez tous les emails capturés dans votre boîte de réception
4. Cliquez sur un email pour voir :
   - Le contenu HTML
   - Le contenu texte
   - Les en-têtes
   - Les pièces jointes (si présentes)

## Alternative : MailHog

Si vous préférez utiliser MailHog localement :

1. Installez MailHog : https://github.com/mailhog/MailHog
2. Démarrez MailHog : `mailhog`
3. Configurez dans `.env.local` :
   ```bash
   SMTP_HOST=localhost
   SMTP_PORT=1025
   SMTP_SECURE=false
   SMTP_USER=
   SMTP_PASS=
   ```
4. Accédez à l'interface web : http://localhost:8025

## Dépannage

### Erreur : "Invalid login"
- Vérifiez que vos identifiants Ethereal sont corrects
- Régénérez un nouveau compte Ethereal si nécessaire

### Erreur : "Connection timeout"
- Vérifiez votre connexion internet
- Vérifiez que le port SMTP n'est pas bloqué par un firewall

### Emails non reçus en mode test
- Vérifiez que `EMAIL_TEST_MODE=true` est défini
- Vérifiez que `NODE_ENV=development`
- Consultez les logs de l'application pour les erreurs
- Vérifiez le dashboard Ethereal pour les emails capturés

## Notes importantes

- ⚠️ **Ne jamais** utiliser le mode test en production
- ⚠️ Les comptes Ethereal expirent après 24h d'inactivité
- ⚠️ Les emails Ethereal ne sont pas réellement délivrés
- ✅ Utilisez toujours le mode test en développement local
- ✅ Testez tous les templates d'email avant de déployer
