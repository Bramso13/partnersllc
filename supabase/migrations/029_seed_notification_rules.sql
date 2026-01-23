-- =========================================================
-- SEED DEFAULT NOTIFICATION RULES
-- Story 3.9: Event-to-Notification Orchestration System
-- =========================================================
-- This migration seeds the notification_rules table with default rules
-- for all existing notification scenarios
-- =========================================================

-- =========================================================
-- RULE: STEP_COMPLETED
-- =========================================================
insert into notification_rules (
  event_type,
  template_code,
  channels,
  is_active,
  priority,
  conditions,
  description
) values (
  'STEP_COMPLETED',
  'STEP_COMPLETED',
  array['EMAIL', 'WHATSAPP', 'IN_APP']::text[],
  true,
  100,
  null,
  'Notifie le client quand une étape est terminée (email, WhatsApp, et notification in-app)'
);

-- =========================================================
-- RULE: DOCUMENT_REVIEWED (APPROVED)
-- =========================================================
insert into notification_rules (
  event_type,
  template_code,
  channels,
  is_active,
  priority,
  conditions,
  description
) values (
  'DOCUMENT_REVIEWED',
  'DOCUMENT_APPROVED',
  array['EMAIL', 'IN_APP']::text[],
  true,
  100,
  '{"payload": {"review_status": "APPROVED"}}'::jsonb,
  'Notifie le client quand un document est approuvé (email et notification in-app)'
);

-- =========================================================
-- RULE: DOCUMENT_REVIEWED (REJECTED)
-- =========================================================
insert into notification_rules (
  event_type,
  template_code,
  channels,
  is_active,
  priority,
  conditions,
  description
) values (
  'DOCUMENT_REVIEWED',
  'DOCUMENT_REJECTED',
  array['EMAIL', 'IN_APP']::text[],
  true,
  100,
  '{"payload": {"review_status": "REJECTED"}}'::jsonb,
  'Notifie le client quand un document est rejeté et nécessite des corrections (email et notification in-app)'
);

-- =========================================================
-- RULE: DOCUMENT_UPLOADED
-- =========================================================
insert into notification_rules (
  event_type,
  template_code,
  channels,
  is_active,
  priority,
  conditions,
  description
) values (
  'DOCUMENT_UPLOADED',
  'DOCUMENT_UPLOADED',
  array['IN_APP']::text[],
  true,
  50,
  null,
  'Confirme au client que son document a bien été reçu (notification in-app seulement)'
);

-- =========================================================
-- RULE: DOCUMENT_DELIVERED
-- =========================================================
insert into notification_rules (
  event_type,
  template_code,
  channels,
  is_active,
  priority,
  conditions,
  description
) values (
  'DOCUMENT_DELIVERED',
  'ADMIN_DOCUMENT_DELIVERED',
  array['EMAIL', 'IN_APP']::text[],
  true,
  100,
  null,
  'Notifie le client quand un conseiller lui envoie des documents (email et notification in-app)'
);

-- =========================================================
-- RULE: PAYMENT_RECEIVED
-- =========================================================
insert into notification_rules (
  event_type,
  template_code,
  channels,
  is_active,
  priority,
  conditions,
  description
) values (
  'PAYMENT_RECEIVED',
  'PAYMENT_CONFIRMATION',
  array['EMAIL', 'IN_APP']::text[],
  true,
  100,
  null,
  'Confirme au client que son paiement a bien été reçu (email et notification in-app)'
);

-- Note: PAYMENT_CONFIRMATION template will need to be created in email-templates.ts
-- For now, the processor will fall back to generic notification format

-- =========================================================
-- RULE: PAYMENT_FAILED
-- =========================================================
insert into notification_rules (
  event_type,
  template_code,
  channels,
  is_active,
  priority,
  conditions,
  description
) values (
  'PAYMENT_FAILED',
  'PAYMENT_FAILED',
  array['EMAIL']::text[],
  true,
  100,
  null,
  'Notifie le client en cas d''échec de paiement (email seulement)'
);

-- Note: PAYMENT_FAILED template will need to be created in email-templates.ts
-- For now, the processor will fall back to generic notification format

-- =========================================================
-- RULE: MANUAL_CLIENT_CREATED
-- =========================================================
insert into notification_rules (
  event_type,
  template_code,
  channels,
  is_active,
  priority,
  conditions,
  description
) values (
  'MANUAL_CLIENT_CREATED',
  'WELCOME',
  array['EMAIL', 'IN_APP']::text[],
  true,
  100,
  null,
  'Message de bienvenue envoyé au client quand il est créé manuellement par un admin (email et notification in-app)'
);

-- =========================================================
-- RULE: DOSSIER_CREATED
-- =========================================================
insert into notification_rules (
  event_type,
  template_code,
  channels,
  is_active,
  priority,
  conditions,
  description
) values (
  'DOSSIER_CREATED',
  'WELCOME',
  array['EMAIL', 'IN_APP']::text[],
  true,
  100,
  null,
  'Message de bienvenue envoyé au client quand son dossier est créé (email et notification in-app)'
);

-- =========================================================
-- VERIFICATION
-- =========================================================
-- Verify that all default rules were created
do $$
declare
  v_rule_count integer;
begin
  select count(*) into v_rule_count from notification_rules;

  if v_rule_count < 9 then
    raise exception 'Failed to seed all default notification rules. Expected 9, got %', v_rule_count;
  end if;

  raise notice 'Successfully seeded % default notification rules', v_rule_count;
end $$;
