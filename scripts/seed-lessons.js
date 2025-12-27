/**
 * Seed 50 lessons for teacher1 (25 individual + 25 group)
 * Usage: npm run seed-lessons
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

async function seedLessons() {
  const { data: user } = await supabase
    .from('users')
    .select('id')
    .eq('username', 'teacher1')
    .maybeSingle();

  if (!user?.id) {
    console.error('❌ User "teacher1" not found.');
    process.exit(1);
  }

  const { data: teacher } = await supabase
    .from('teachers')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!teacher?.id) {
    console.error('❌ Teacher record for "teacher1" not found.');
    process.exit(1);
  }

  const { data: students } = await supabase
    .from('students')
    .select('id, education_level_id')
    .limit(100);

  if (!students?.length) {
    console.error('❌ No students found to assign lessons.');
    process.exit(1);
  }

  const individualLessons = [];
  const today = new Date();

  for (let i = 0; i < 25; i++) {
    const student = students[i % students.length];
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    individualLessons.push({
      teacher_id: teacher.id,
      student_id: student.id,
      education_level_id: student.education_level_id,
      date: date.toISOString().split('T')[0],
      hours: 1 + (i % 3),
      approved: i % 2 === 0,
      total_cost: 120 + i * 5,
      seeded_by_script: true,
    });
  }

  if (individualLessons.length) {
    const { error } = await supabase.from('individual_lessons').insert(individualLessons);
    if (error) {
      console.error('❌ Failed to insert individual lessons', error);
      process.exit(1);
    }
  }

  for (let i = 0; i < 25; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() - i - 5);
    const groupStudents = students.slice(i % students.length, (i % students.length) + 3);
    if (!groupStudents.length) continue;
    const levelId = groupStudents[0].education_level_id || students[0].education_level_id;

    const { data: groupLesson, error } = await supabase
      .from('group_lessons')
      .insert({
        teacher_id: teacher.id,
        education_level_id: levelId,
        date: date.toISOString().split('T')[0],
        hours: 2,
        approved: i % 2 === 0,
        total_cost: 200 + i * 10,
        seeded_by_script: true,
      })
      .select()
      .single();

    if (error || !groupLesson) {
      console.error('❌ Failed to insert group lesson', error);
      continue;
    }

    const attendance = groupStudents.map((student) => ({
      group_lesson_id: groupLesson.id,
      student_id: student.id,
    }));

    const { error: attendanceError } = await supabase
      .from('group_lesson_students')
      .insert(attendance);

    if (attendanceError) {
      console.error('⚠️ Failed to insert group lesson students', attendanceError);
    }
  }

  console.log('✅ Seeded 50 lessons for teacher1');
  process.exit(0);
}

seedLessons();

