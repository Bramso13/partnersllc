-- =========================================================
-- PARTNERS HUB: ÉVÉNEMENTS (Story hub-events)
-- =========================================================
-- Tables: hub_events, hub_event_registrations
-- RLS: événements publics (membres Hub), inscriptions privées
-- =========================================================

-- ── Enums ──────────────────────────────────────────────────

CREATE TYPE hub_event_type               AS ENUM ('online', 'irl', 'hybrid');
CREATE TYPE hub_event_status             AS ENUM ('draft', 'published', 'cancelled');
CREATE TYPE hub_event_registration_status AS ENUM ('registered', 'waitlisted', 'cancelled');

-- ── Tables ─────────────────────────────────────────────────

CREATE TABLE hub_events (
  id                 uuid              PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_user_id  uuid              NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title              text              NOT NULL CHECK (char_length(title) BETWEEN 3 AND 150),
  description        text,
  type               hub_event_type    NOT NULL DEFAULT 'online',
  start_at           timestamptz       NOT NULL,
  end_at             timestamptz       NOT NULL,
  timezone           text              NOT NULL DEFAULT 'Europe/Paris',
  location_text      text,
  meet_url           text,
  max_attendees      integer           CHECK (max_attendees IS NULL OR max_attendees > 0),
  status             hub_event_status  NOT NULL DEFAULT 'draft',
  cover_image_url    text,
  tags               text[]            NOT NULL DEFAULT '{}',
  created_at         timestamptz       NOT NULL DEFAULT now(),
  updated_at         timestamptz       NOT NULL DEFAULT now(),

  CONSTRAINT hub_events_end_after_start CHECK (end_at > start_at)
);

CREATE TABLE hub_event_registrations (
  id            uuid                         PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id      uuid                         NOT NULL REFERENCES hub_events(id) ON DELETE CASCADE,
  user_id       uuid                         NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status        hub_event_registration_status NOT NULL DEFAULT 'registered',
  registered_at timestamptz                  NOT NULL DEFAULT now(),

  CONSTRAINT hub_event_registrations_unique UNIQUE (event_id, user_id)
);

-- ── Indexes ────────────────────────────────────────────────

CREATE INDEX idx_hub_events_status    ON hub_events(status);
CREATE INDEX idx_hub_events_start_at  ON hub_events(start_at);
CREATE INDEX idx_hub_events_organizer ON hub_events(organizer_user_id);
CREATE INDEX idx_hub_event_regs_event ON hub_event_registrations(event_id);
CREATE INDEX idx_hub_event_regs_user  ON hub_event_registrations(user_id);

-- ── Triggers ───────────────────────────────────────────────

CREATE TRIGGER set_hub_events_updated_at
  BEFORE UPDATE ON hub_events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ── RLS ────────────────────────────────────────────────────

ALTER TABLE hub_events              ENABLE ROW LEVEL SECURITY;
ALTER TABLE hub_event_registrations ENABLE ROW LEVEL SECURITY;

-- Événements publiés : visibles par tous les membres Hub
CREATE POLICY "Hub members can view published events"
  ON hub_events FOR SELECT
  USING (status = 'published' AND is_hub_member(auth.uid()));

-- L'organisateur voit aussi ses brouillons
CREATE POLICY "Organizer sees own events"
  ON hub_events FOR SELECT
  USING (organizer_user_id = auth.uid());

CREATE POLICY "Organizer can insert event"
  ON hub_events FOR INSERT
  WITH CHECK (organizer_user_id = auth.uid() AND is_hub_member(auth.uid()));

CREATE POLICY "Organizer can update own event"
  ON hub_events FOR UPDATE
  USING (organizer_user_id = auth.uid())
  WITH CHECK (organizer_user_id = auth.uid());

-- Inscriptions : lecture sur ses propres inscriptions
CREATE POLICY "User sees own registrations"
  ON hub_event_registrations FOR SELECT
  USING (user_id = auth.uid());

-- L'organisateur voit qui s'est inscrit
CREATE POLICY "Organizer sees event registrations"
  ON hub_event_registrations FOR SELECT
  USING (
    event_id IN (SELECT id FROM hub_events WHERE organizer_user_id = auth.uid())
  );

CREATE POLICY "Hub member can register"
  ON hub_event_registrations FOR INSERT
  WITH CHECK (user_id = auth.uid() AND is_hub_member(auth.uid()));

CREATE POLICY "User can cancel own registration"
  ON hub_event_registrations FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "User can delete own registration"
  ON hub_event_registrations FOR DELETE
  USING (user_id = auth.uid());

-- ── Fonction helpers ───────────────────────────────────────

-- Nombre d'inscrits actifs pour un événement
CREATE OR REPLACE FUNCTION count_event_registrations(p_event_id uuid)
RETURNS bigint
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT COUNT(*) FROM hub_event_registrations
  WHERE event_id = p_event_id AND status = 'registered';
$$;
