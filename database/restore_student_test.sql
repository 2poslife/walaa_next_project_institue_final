-- Restore (enable) soft-deleted student by clearing deleted_at and deletion_note
-- Run in Supabase SQL Editor. Replace 'test' with the student name if needed.

UPDATE students
SET deleted_at = NULL, deletion_note = NULL
WHERE full_name = 'test'
  AND deleted_at IS NOT NULL;

-- Verify: should return one row with deleted_at = NULL
-- SELECT id, full_name, deleted_at, deletion_note FROM students WHERE full_name = 'test';
