-- =========================================================
-- PARTNERS HUB: Function get_hub_members_by_country (Story 15.3)
-- =========================================================
-- Returns members aggregated by country (active subscription only).
-- Called from API after auth check; uses SECURITY DEFINER to read
-- hub_subscriptions + hub_member_profiles.
-- =========================================================

CREATE OR REPLACE FUNCTION get_hub_members_by_country()
RETURNS TABLE(
  country char(2),
  member_count bigint,
  members jsonb
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.country,
    count(*)::bigint AS member_count,
    jsonb_agg(
      jsonb_build_object(
        'id', p.id,
        'display_name', p.display_name,
        'profession', p.profession
      )
      ORDER BY p.display_name NULLS LAST, p.id
    ) AS members
  FROM hub_member_profiles p
  INNER JOIN hub_subscriptions s ON s.user_id = p.user_id AND s.status = 'active'
  WHERE p.country IS NOT NULL AND p.country <> ''
  GROUP BY p.country
  ORDER BY p.country;
$$;

COMMENT ON FUNCTION get_hub_members_by_country() IS 'Story 15.3: Active Hub members aggregated by country (id, display_name, profession). Call only after verifying caller is a Hub member.';
