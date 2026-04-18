-- Remove بستان and بستان 2 from the database (run in Supabase SQL Editor when reverting those levels).
-- Reassigns students, lessons, and special notes that used those levels to ابتدائي before delete.
-- Review counts first: SELECT COUNT(*) FROM students WHERE education_level_id IN (SELECT id FROM education_levels WHERE name_ar IN ('بستان','بستان 2'));

DO $$
DECLARE
  bustan_ids INTEGER[];
  v_elem INTEGER;
BEGIN
  SELECT ARRAY_AGG(id) INTO bustan_ids
  FROM education_levels
  WHERE name_ar IN ('بستان', 'بستان 2');

  IF bustan_ids IS NULL OR cardinality(bustan_ids) = 0 THEN
    RAISE NOTICE 'No rows with name_ar بستان or بستان 2 — nothing to do.';
    RETURN;
  END IF;

  SELECT id INTO v_elem FROM education_levels WHERE name_ar = 'ابتدائي' LIMIT 1;
  IF v_elem IS NULL THEN
    RAISE EXCEPTION 'ابتدائي level not found — cannot reassign before delete.';
  END IF;

  UPDATE students SET education_level_id = v_elem WHERE education_level_id = ANY (bustan_ids);
  UPDATE individual_lessons SET education_level_id = v_elem WHERE education_level_id = ANY (bustan_ids);
  UPDATE group_lessons SET education_level_id = v_elem WHERE education_level_id = ANY (bustan_ids);
  UPDATE special_lesson_notes SET education_level_id = v_elem WHERE education_level_id = ANY (bustan_ids);

  DELETE FROM pricing WHERE education_level_id = ANY (bustan_ids);
  DELETE FROM group_pricing_tiers WHERE education_level_id = ANY (bustan_ids);

  DELETE FROM education_levels WHERE id = ANY (bustan_ids);

  RAISE NOTICE 'Removed بستان / بستان 2 and reassigned dependents to ابتدائي (id=%).', v_elem;
END $$;
