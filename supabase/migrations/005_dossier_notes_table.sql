-- Migration: Create dossier_notes table for internal agent notes
-- Story: 4.3 Enhanced Agent Dossier Management View
-- Purpose: Store internal notes that agents add to dossiers (not visible to clients)

CREATE TABLE IF NOT EXISTS dossier_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dossier_id uuid NOT NULL REFERENCES dossiers(id) ON DELETE CASCADE,
  agent_id uuid NOT NULL REFERENCES agents(id) ON DELETE RESTRICT,
  note_text text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create indexes for performance
CREATE INDEX idx_dossier_notes_dossier_id ON dossier_notes(dossier_id);
CREATE INDEX idx_dossier_notes_agent_id ON dossier_notes(agent_id);
CREATE INDEX idx_dossier_notes_created_at ON dossier_notes(created_at DESC);

-- Create trigger to auto-update updated_at column
CREATE TRIGGER update_dossier_notes_updated_at
  BEFORE UPDATE ON dossier_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies for dossier_notes
ALTER TABLE dossier_notes ENABLE ROW LEVEL SECURITY;

-- Policy: Agents can view all notes
CREATE POLICY "Agents can view all dossier notes"
  ON dossier_notes
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM agents
      WHERE agents.id = auth.uid()
    )
  );

-- Policy: Agents can insert notes
CREATE POLICY "Agents can create dossier notes"
  ON dossier_notes
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM agents
      WHERE agents.id = auth.uid()
    )
    AND agent_id = auth.uid()
  );

-- Policy: Agents can update their own notes
CREATE POLICY "Agents can update their own notes"
  ON dossier_notes
  FOR UPDATE
  USING (agent_id = auth.uid())
  WITH CHECK (agent_id = auth.uid());

-- Policy: Agents can delete their own notes (optional)
CREATE POLICY "Agents can delete their own notes"
  ON dossier_notes
  FOR DELETE
  USING (agent_id = auth.uid());

-- Policy: Clients CANNOT see dossier notes (internal only)
-- No policy needed - absence of policy prevents client access

COMMENT ON TABLE dossier_notes IS 'Internal notes added by agents to dossiers. Not visible to clients.';
COMMENT ON COLUMN dossier_notes.note_text IS 'The content of the internal note';
COMMENT ON COLUMN dossier_notes.agent_id IS 'The agent who created the note';
