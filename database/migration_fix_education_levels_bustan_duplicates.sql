-- Deduplicate education levels by Arabic name and enforce uniqueness.
-- This prevents repeated insertion of the same level (e.g., "بستان").

BEGIN;

-- Keep the earliest row per Arabic name, remove later duplicates.
WITH ranked AS (
  SELECT
    id,
    name_ar,
    ROW_NUMBER() OVER (PARTITION BY name_ar ORDER BY id ASC) AS rn
  FROM education_levels
)
DELETE FROM education_levels e
USING ranked r
WHERE e.id = r.id
  AND r.rn > 1;

-- Enforce uniqueness at DB level.
CREATE UNIQUE INDEX IF NOT EXISTS education_levels_name_ar_uidx
  ON education_levels (name_ar);

-- Ensure Bustan exists exactly once.
INSERT INTO education_levels (name_ar, name_en)
VALUES ('بستان', 'Bustan')
ON CONFLICT (name_ar) DO UPDATE
SET name_en = EXCLUDED.name_en;

COMMIT;
