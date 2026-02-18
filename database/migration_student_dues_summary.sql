-- Migration: Student dues summary calculated in the database
-- Run this in Supabase SQL Editor so the payments page can get totals without fetching all lessons.
-- Uses same logic as frontend: approved, not deleted, total_cost > 0; group share = total_cost / participant count.

CREATE OR REPLACE FUNCTION get_student_dues_summary()
RETURNS TABLE (
  student_id INT,
  student_name VARCHAR(120),
  level_name VARCHAR(50),
  individual_due DECIMAL,
  group_due DECIMAL,
  remedial_due DECIMAL,
  total_due DECIMAL,
  total_paid DECIMAL,
  remaining DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  WITH
  ind AS (
    SELECT il.student_id, COALESCE(SUM(il.total_cost), 0)::DECIMAL AS due
    FROM public.individual_lessons il
    WHERE il.approved = true
      AND (il.deleted_at IS NULL)
      AND COALESCE(il.total_cost, 0) > 0
    GROUP BY il.student_id
  ),
  -- Group: each student's share = lesson total_cost / number of participants (from group_lesson_students)
  grp AS (
    SELECT gls.student_id,
           COALESCE(SUM((gl.total_cost)::DECIMAL / NULLIF(cnt.c, 0)), 0)::DECIMAL AS due
    FROM public.group_lessons gl
    INNER JOIN (
      SELECT group_lesson_id, COUNT(*)::numeric AS c
      FROM public.group_lesson_students
      GROUP BY group_lesson_id
    ) cnt ON cnt.group_lesson_id = gl.id
    INNER JOIN public.group_lesson_students gls ON gls.group_lesson_id = gl.id
    WHERE gl.approved = true
      AND (gl.deleted_at IS NULL)
      AND COALESCE(gl.total_cost, 0) > 0
    GROUP BY gls.student_id
  ),
  rem AS (
    SELECT rl.student_id, COALESCE(SUM(rl.total_cost), 0)::DECIMAL AS due
    FROM public.remedial_lessons rl
    WHERE rl.approved = true
      AND (rl.deleted_at IS NULL)
      AND COALESCE(rl.total_cost, 0) > 0
    GROUP BY rl.student_id
  ),
  pay AS (
    SELECT p.student_id, COALESCE(SUM(p.amount), 0)::DECIMAL AS paid
    FROM public.payments p
    GROUP BY p.student_id
  )
  SELECT
    s.id,
    s.full_name::VARCHAR(120),
    COALESCE(el.name_ar, 'غير محدد')::VARCHAR(50),
    COALESCE(ind.due, 0),
    COALESCE(grp.due, 0),
    COALESCE(rem.due, 0),
    (COALESCE(ind.due, 0) + COALESCE(grp.due, 0) + COALESCE(rem.due, 0)),
    COALESCE(pay.paid, 0),
    (COALESCE(ind.due, 0) + COALESCE(grp.due, 0) + COALESCE(rem.due, 0) - COALESCE(pay.paid, 0))
  FROM public.students s
  LEFT JOIN public.education_levels el ON el.id = s.education_level_id
  LEFT JOIN ind ON ind.student_id = s.id
  LEFT JOIN grp ON grp.student_id = s.id
  LEFT JOIN rem ON rem.student_id = s.id
  LEFT JOIN pay ON pay.student_id = s.id
  ORDER BY (COALESCE(ind.due, 0) + COALESCE(grp.due, 0) + COALESCE(rem.due, 0) - COALESCE(pay.paid, 0)) DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql STABLE;

-- If group_due or remedial_due stay 0, run these in SQL Editor to verify data:
-- SELECT id, approved, deleted_at, total_cost FROM public.group_lessons LIMIT 5;
-- SELECT * FROM public.group_lesson_students LIMIT 10;
-- SELECT id, student_id, approved, deleted_at, total_cost FROM public.remedial_lessons LIMIT 5;
