/**
 * Remove all lessons for teacher1 (individual + group)
 * Usage: npm run cleanup-lessons
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env.local');
const envContent = {};

if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8')
    .split('\n')
    .forEach((line) => {
      const match = line.match(/^([^=:#]+)=(.*)$/);
      if (match) {
        envContent[match[1].trim()] = match[2].trim();
      }
    });
}

const supabaseUrl =
  envContent.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey =
  envContent.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing Supabase credentials (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function cleanupLessons() {
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id')
    .eq('username', 'teacher1')
    .maybeSingle();

  if (userError || !user?.id) {
    console.error('❌ Could not find user "teacher1".');
    process.exit(1);
  }

  const { data: teacher, error: teacherError } = await supabase
    .from('teachers')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (teacherError || !teacher?.id) {
    console.error('❌ Teacher record for "teacher1" not found.');
    process.exit(1);
  }

  const { data: groupLessons, error: groupFetchError } = await supabase
    .from('group_lessons')
    .select('id')
    .eq('teacher_id', teacher.id)
    .eq('seeded_by_script', true);

  if (groupFetchError) {
    console.error('❌ Failed to fetch group lessons', groupFetchError);
    process.exit(1);
  }

  if (groupLessons?.length) {
    const groupLessonIds = groupLessons.map((lesson) => lesson.id);
    const { error: attendanceDeleteError } = await supabase
      .from('group_lesson_students')
      .delete()
      .in('group_lesson_id', groupLessonIds);

    if (attendanceDeleteError) {
      console.error('❌ Failed to delete group lesson students', attendanceDeleteError);
      process.exit(1);
    }

    const { error: groupDeleteError } = await supabase
      .from('group_lessons')
      .delete()
      .in('id', groupLessonIds);

    if (groupDeleteError) {
      console.error('❌ Failed to delete group lessons', groupDeleteError);
      process.exit(1);
    }

    console.log(`🗑️ Deleted ${groupLessons.length} group lessons for teacher1`);
  }

    const { error: individualDeleteError, count } = await supabase
      .from('individual_lessons')
      .delete({ count: 'exact' })
      .eq('teacher_id', teacher.id)
      .eq('seeded_by_script', true);

  if (individualDeleteError) {
    console.error('❌ Failed to delete individual lessons', individualDeleteError);
    process.exit(1);
  }

  console.log(`🗑️ Deleted ${count || 0} individual lessons for teacher1`);
  console.log('✅ Cleanup complete');
  process.exit(0);
}

cleanupLessons();

