-- Add "بستان" (kindergarten) education level and pricing for individual + group lessons.
-- Prices default to the same as "ابتدائي" when that level exists; otherwise 100 per hour.

DO $$
DECLARE
  v_bustan_id INTEGER;
  v_elem_id INTEGER;
  v_ind_price DECIMAL(10, 2);
  v_grp_price DECIMAL(10, 2);
BEGIN
  SELECT id INTO v_bustan_id
  FROM education_levels
  WHERE name_ar = 'بستان'
  LIMIT 1;

  IF v_bustan_id IS NULL THEN
    INSERT INTO education_levels (name_ar, name_en)
    VALUES ('بستان', 'Kindergarten')
    RETURNING id INTO v_bustan_id;
  END IF;

  SELECT id INTO v_elem_id
  FROM education_levels
  WHERE name_ar = 'ابتدائي'
  LIMIT 1;

  IF v_elem_id IS NOT NULL THEN
    SELECT price_per_hour INTO v_ind_price
    FROM pricing
    WHERE education_level_id = v_elem_id AND lesson_type = 'individual'
    LIMIT 1;

    SELECT price_per_hour INTO v_grp_price
    FROM pricing
    WHERE education_level_id = v_elem_id AND lesson_type = 'group'
    LIMIT 1;
  END IF;

  IF v_ind_price IS NULL THEN
    v_ind_price := 100.00;
  END IF;
  IF v_grp_price IS NULL THEN
    v_grp_price := 100.00;
  END IF;

  INSERT INTO pricing (education_level_id, lesson_type, price_per_hour)
  VALUES (v_bustan_id, 'individual', v_ind_price)
  ON CONFLICT (education_level_id, lesson_type)
  DO UPDATE SET price_per_hour = EXCLUDED.price_per_hour;

  INSERT INTO pricing (education_level_id, lesson_type, price_per_hour)
  VALUES (v_bustan_id, 'group', v_grp_price)
  ON CONFLICT (education_level_id, lesson_type)
  DO UPDATE SET price_per_hour = EXCLUDED.price_per_hour;
END $$;
