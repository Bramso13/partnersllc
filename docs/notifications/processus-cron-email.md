# Processus cron → email (code correspondant)

Ordre d’exécution avec les extraits de code réels.

---

## 1. Cron : récupération des events

**Fichier :** `app/api/cron/process-event-notifications/route.ts`

```ts
// Get events that haven't been processed yet
const timeWindow = new Date(Date.now() - 5 * 60 * 1000).toISOString();

const { data: recentEvents, error: eventsError } = await supabase
  .from("events")
  .select("*")
  .gte("created_at", timeWindow)
  .order("created_at", { ascending: true })
  .limit(50);
```

Puis filtrage des events déjà dans `notification_rule_executions` :

```ts
const { data: existingExecutions } = await supabase
  .from("notification_rule_executions")
  .select("id")
  .eq("event_id", event.id)
  .limit(1);

const alreadyProcessedEvent = !checkError && existingExecutions && existingExecutions.length > 0;
if (!alreadyProcessedEvent) {
  eventsToProcess.push(event);
}
```

Puis pour chaque event à traiter :

```ts
const result = await processEventForNotifications(event);
```

---

## 2. Orchestrator : création notification + déclenchement delivery

**Fichier :** `lib/notifications/orchestrator.ts`

Pour chaque règle et chaque destinataire :

```ts
const notification = await createNotificationFromRule(rule, event, userId);

if (notification) {
  await triggerNotificationDelivery(notification.id, rule.channels);
  await logRuleExecution(rule, event, notification.id, true, null);
  succeeded++;
}
```

---

## 3. Insert `notifications` (déclenche le trigger)

**Fichier :** `lib/notifications/orchestrator.ts` — `createNotificationFromRule`

```ts
const { data, error } = await supabase
  .from("notifications")
  .insert({
    user_id: userId,
    dossier_id: dossierId,
    event_id: event.id,
    title,
    message,
    template_code: rule.template_code,
    payload: event.payload,
    action_url: actionUrl,
  })
  .select("id")
  .single();
return data;
```

Dès que cet `insert` est exécuté, le trigger Postgres suivant s’exécute.

---

## 4. Trigger Postgres : création de la ligne `notification_deliveries`

**Fichier :** `supabase/migrations/020_email_notification_delivery.sql`

```sql
create or replace function create_email_delivery_for_notification()
returns trigger as $$
declare
  v_user_email text;
begin
  v_user_email := get_user_email(new.user_id);

  if v_user_email is not null and length(trim(v_user_email)) > 0 then
    insert into notification_deliveries (
      notification_id,
      channel,
      recipient,
      status,
      provider
    )
    values (
      new.id,
      'EMAIL',
      v_user_email,
      'PENDING',
      'nodemailer'   -- remplacer par 'resend' via migration 050
    );
  end if;

  return new;
end;
$$ language plpgsql security definer;

create trigger notification_email_delivery_created
  after insert on notifications
  for each row
  execute function create_email_delivery_for_notification();
```

---

## 5. Orchestrator : appel du processor EMAIL

**Fichier :** `lib/notifications/orchestrator.ts` — `triggerNotificationDelivery`

```ts
async function triggerNotificationDelivery(
  notificationId: string,
  channels: NotificationChannel[]
): Promise<void> {
  for (const channel of channels) {
    switch (channel) {
      case "EMAIL":
        deliveryPromises.push(
          processEmailNotification(notificationId).catch((error) => {
            console.error(`Error processing EMAIL notification ${notificationId}:`, error);
          })
        );
        break;
      // ...
    }
  }
}
```

---

## 6. Processor : récupération de la delivery (créée par le trigger)

**Fichier :** `lib/notifications/processor.ts` — `processEmailNotification`

On charge la notification et l’email user, puis on cherche une delivery existante (celle créée par le trigger) :

```ts
const { data: existingDelivery } = await supabase
  .from("notification_deliveries")
  .select("id, status, provider_response")
  .eq("notification_id", notificationId)
  .eq("channel", "EMAIL")
  .single();

if (existingDelivery) {
  // Ne skip que si déjà envoyé (SENT). PENDING = créée par le trigger, on doit envoyer.
  if (existingDelivery.status === "SENT") {
    console.log(`Email delivery ${existingDelivery.id} already SENT, skipping`);
    return { success: true };
  }
  // Si PENDING ou FAILED (retry), on continue avec deliveryId = existingDelivery.id
  deliveryId = existingDelivery.id;
} else {
  // Pas de trigger ou pas d’email user : on crée nous-mêmes la delivery (provider: "resend")
  const { data: newDelivery, error: deliveryError } = await supabase
    .from("notification_deliveries")
    .insert({
      notification_id: notificationId,
      channel: "EMAIL",
      recipient: userEmail.email,
      status: "PENDING",
      provider: "resend",
      provider_response: { retry_count: 0 },
    })
    .select("id")
    .single();
  deliveryId = newDelivery.id;
}
```

Puis génération du contenu et envoi :

```ts
const emailContent = await generateEmailContent(notif, userEmail);

const result = await sendEmail({
  to: userEmail.email,
  subject: notif.title,
  html: emailContent.html,
  text: emailContent.text,
  transport: "resend",
});
// Puis update notification_deliveries en SENT (ou FAILED en catch)
```

---

## 7. sendEmail → Resend

**Fichier :** `lib/notifications/email.ts`

```ts
export async function sendEmail(options: EmailOptions, retryCount: number = 0): Promise<EmailResult> {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is not set — cannot use Resend transport");
  }
  return await sendEmailWithResend({
    to: options.to,
    subject: options.subject,
    html: options.html,
    text: options.text,
    from: options.from,
    replyTo: options.replyTo,
  });
}
```

**Fichier :** `lib/notifications/resend.ts`

```ts
export async function sendEmailWithResend(options: ResendEmailOptions): Promise<ResendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const resend = new Resend(apiKey);
  const from = options.from || getResendFrom();

  const { data, error } = await resend.emails.send({
    from,
    to: options.to,
    subject: options.subject,
    html: options.html,
    text: options.text,
  });

  if (error) throw new Error(error.message || "Resend send failed");
  return { messageId: data?.id ?? "", accepted: [options.to], rejected: [] };
}
```

---

## Résumé de l’ordre d’exécution

1. **Cron** : récupère `events` (5 min), filtre déjà traités, appelle `processEventForNotifications(event)`.
2. **Orchestrator** : pour chaque règle/user, `createNotificationFromRule()` → **INSERT `notifications`**.
3. **Trigger** : AFTER INSERT sur `notifications` → **INSERT `notification_deliveries`** (EMAIL, PENDING, provider nodemailer/resend).
4. **Orchestrator** : `triggerNotificationDelivery(notification.id, channels)` → pour EMAIL appelle **`processEmailNotification(notificationId)`**.
5. **Processor** : SELECT delivery (trouve la ligne du trigger), si SENT → skip ; sinon (PENDING/FAILED) → `generateEmailContent` puis **`sendEmail()`**.
6. **email.ts** : **`sendEmailWithResend()`**.
7. **resend.ts** : **`resend.emails.send()`** → API Resend.
