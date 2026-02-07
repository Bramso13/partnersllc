# 🧪 Guide de Test Twilio Conversations

## Configuration initiale

### 1. Variables d'environnement

Créez ou mettez à jour votre fichier `.env.local` :

```bash
# Trouvez ces valeurs sur: https://console.twilio.com/
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here

# Service SID: https://console.twilio.com/us1/develop/conversations/manage/services
TWILIO_CONVERSATION_SERVICE_SID=ISxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Pour WhatsApp Sandbox (test): https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn
TWILIO_WHATSAPP_NUMBER=+14155238886

# Votre numéro pour tester (format E.164: +33612345678)
TEST_PHONE_NUMBER=+33XXXXXXXXX
```

### 2. Activation WhatsApp Sandbox (Recommandé pour test)

**Option la plus rapide pour tester!**

1. Allez sur https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn
2. Envoyez le code d'activation (ex: "join xxxxx-xxxxx") au numéro fourni depuis votre WhatsApp
3. Vous recevrez une confirmation "You are all set!"
4. Votre numéro est maintenant connecté au sandbox ✅

### 3. Alternative: Utiliser SMS

Si vous préférez tester avec SMS plutôt que WhatsApp:

1. Achetez un numéro Twilio (https://console.twilio.com/us1/develop/phone-numbers/manage/search)
2. Configurez-le pour les Conversations
3. Utilisez le script `test-twilio-sms-conversation.ts`

## 🚀 Exécuter le test

```bash
# Test avec WhatsApp
tsx scripts/test-twilio-conversation.ts

# Ou avec SMS
tsx scripts/test-twilio-sms-conversation.ts
```

## 📱 Ce qui va se passer

1. ✅ Une conversation est créée
2. 📱 Votre numéro est ajouté comme participant
3. 💬 Vous recevez un message de test sur WhatsApp/SMS
4. 🔄 Vous pouvez répondre et voir la conversation dans la console Twilio

## 🔍 Vérifier dans la console Twilio

Après le test, allez sur:
- **Vue d'ensemble**: https://console.twilio.com/us1/develop/conversations/manage/services
- **Votre service**: Cliquez sur votre Service SID
- **Conversations**: Vous verrez la conversation créée avec le timestamp

## 💡 Cas d'usage réels

Votre implémentation actuelle supporte:

### WhatsApp avec clients
```typescript
// Créer une conversation
const { conversationSid } = await createTwilioConversation();

// Ajouter un client via WhatsApp
await addClientParticipant(conversationSid, "+33612345678");

// Envoyer un message en tant qu'admin
await sendTwilioMessage(
  conversationSid,
  "Bonjour! Comment puis-je vous aider?",
  "admin-user-id"
);
```

### Recevoir des webhooks
```typescript
// Dans votre API route (Next.js)
import { verifyTwilioSignature } from "@/lib/twilio";

export async function POST(req: Request) {
  const signature = req.headers.get("x-twilio-signature") || "";
  const url = req.url;
  const params = await req.json();

  if (!verifyTwilioSignature(url, params, signature)) {
    return new Response("Unauthorized", { status: 403 });
  }

  // Traiter le webhook...
}
```

## ⚠️ Points importants

1. **Format E.164**: Les numéros doivent commencer par `+` suivi du code pays
   - ✅ Correct: `+33612345678`, `+14155551234`
   - ❌ Incorrect: `0612345678`, `612345678`

2. **WhatsApp Sandbox**:
   - Gratuit pour tester
   - Limité à 5 numéros
   - Message "Sent from your Twilio trial account"
   - Pour production: activez WhatsApp Business API

3. **Webhooks**: Configurez les webhooks dans votre Service pour recevoir les messages entrants
   - https://console.twilio.com/us1/develop/conversations/manage/services/[SERVICE_SID]/webhooks

4. **Coûts**:
   - WhatsApp: ~$0.005 par message (varie selon pays)
   - SMS: varie selon pays (~$0.04-0.10)
   - Conversations API: gratuit jusqu'à certaines limites

## 🐛 Dépannage

### "Environment variable X is not configured"
→ Vérifiez que toutes les variables sont dans `.env.local`

### Message non reçu sur WhatsApp
→ Vérifiez que vous avez bien activé le sandbox et envoyé le code "join"

### "Unable to create record"
→ Vérifiez que le Service SID est correct

### "Invalid phone number"
→ Assurez-vous que le numéro est en format E.164 avec `+`

## 📚 Documentation Twilio

- [Conversations API](https://www.twilio.com/docs/conversations)
- [WhatsApp Business](https://www.twilio.com/docs/whatsapp)
- [Webhooks](https://www.twilio.com/docs/conversations/webhook-events)
