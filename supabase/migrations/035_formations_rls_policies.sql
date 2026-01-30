-- RLS Policies for Formations Feature
-- Story 12.3: Enable client access to formations

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "formations_select_authenticated" ON formations;
DROP POLICY IF EXISTS "formation_elements_select_authenticated" ON formation_elements;
DROP POLICY IF EXISTS "user_formation_progress_select_own" ON user_formation_progress;
DROP POLICY IF EXISTS "user_formation_progress_insert_own" ON user_formation_progress;
DROP POLICY IF EXISTS "user_formation_progress_update_own" ON user_formation_progress;

-- Enable RLS on formations tables
ALTER TABLE formations ENABLE ROW LEVEL SECURITY;
ALTER TABLE formation_elements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_formation_progress ENABLE ROW LEVEL SECURITY;

-- Policy: All authenticated users can read formations
-- (visibility filtering is handled in application logic)
CREATE POLICY "formations_select_authenticated"
ON formations
FOR SELECT
TO authenticated
USING (true);

-- Policy: All authenticated users can read formation elements
CREATE POLICY "formation_elements_select_authenticated"
ON formation_elements
FOR SELECT
TO authenticated
USING (true);

-- Policy: Users can read their own progress
CREATE POLICY "user_formation_progress_select_own"
ON user_formation_progress
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Policy: Users can insert their own progress
CREATE POLICY "user_formation_progress_insert_own"
ON user_formation_progress
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own progress
CREATE POLICY "user_formation_progress_update_own"
ON user_formation_progress
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Note: Admin operations (INSERT, UPDATE, DELETE on formations/elements)
-- should use the service role key, which bypasses RLS
