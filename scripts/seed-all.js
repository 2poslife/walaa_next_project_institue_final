/**
 * Seed the database with sample data:
 * - Education levels
 * - Students
 * - Teachers + users
 * - Pricing + group pricing tiers
 * - Individual lessons (pending)
 *
 * Usage:
 *   node scripts/seed-all.js
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.
 */

const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
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
  console.error('❌ Missing Supabase credentials.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

const educationLevels = [
  { name_ar: 'ابتدائي', name_en: 'Elementary' },
  { name_ar: 'إعدادي', name_en: 'Middle' },
  { name_ar: 'ثانوي', name_en: 'Secondary' },
];

const students = [
  { full_name: 'محمد صالح', parent_contact: '0512345678', education_level: 'ابتدائي' },
  { full_name: 'أحمد علي', parent_contact: '0598765432', education_level: 'إعدادي' },
  { full_name: 'ليان خالد', parent_contact: '0567891234', education_level: 'ثانوي' },
  { full_name: 'سارة سالم', parent_contact: '0534567890', education_level: 'إعدادي' },
];

const teacherSeeds = Array.from({ length: 3 }).map((_, idx) => ({
  username: `teacher${idx + 1}`,
  password: `teacher${idx + 1}`,
  full_name: `Teacher ${idx + 1}`,
  phone: `05${String(idx + 1).padStart(8, '0')}`,
}));

const pricingConfig = [
  {
    matcher: 'ابتدائي',
    individual: 50,
    group: 50,
    tiers: [
      { student_count: 2, total_price: 110 },
      { student_count: 3, total_price: 150 },
    ],
  },
  {
    matcher: 'إعدادي',
    individual: 60,
    group: 60,
    tiers: [
      { student_count: 2, total_price: 130 },
      { student_count: 3, total_price: 180 },
    ],
  },
  {
    matcher: 'ثانوي',
    individual: 70,
    group: 70,
    tiers: [
      { student_count: 2, total_price: 150 },
      { student_count: 3, total_price: 210 },
    ],
  },
];

async function seedEducationLevels() {
  console.log('📚 Seeding education levels...');
  const { data: existing, error: existingError } = await supabase
    .from('education_levels')
    .select('name_ar, id');
  if (existingError) throw new Error(existingError.message);

  const existingNames = new Set((existing || []).map((level) => level.name_ar));
  const toInsert = educationLevels.filter(
    (level) => !existingNames.has(level.name_ar)
  );

  if (toInsert.length > 0) {
    const { error: insertError } = await supabase
      .from('education_levels')
      .insert(toInsert);
    if (insertError) throw new Error(insertError.message);
  }

  const { data } = await supabase
    .from('education_levels')
    .select('id, name_ar');
  return data;
}

async function seedStudents(levelsMap) {
  console.log('👨‍🎓 Seeding students...');
  const payload = students.map((student) => ({
    full_name: student.full_name,
    parent_contact: student.parent_contact,
    education_level_id: levelsMap.get(student.education_level),
  }));
  const { error } = await supabase
    .from('students')
    .upsert(payload, { onConflict: 'full_name' });
  if (error) throw new Error(error.message);

  const { data } = await supabase.from('students').select('*');
  return data;
}

async function seedTeachers() {
  console.log('👩‍🏫 Seeding teachers...');
  for (const seed of teacherSeeds) {
    const password_hash = await bcrypt.hash(seed.password, 10);
    const { data: user, error: userError } = await supabase
      .from('users')
      .upsert(
        {
          username: seed.username,
          password_hash,
          role: 'teacher',
          is_active: true,
        },
        { onConflict: 'username' }
      )
      .select()
      .single();
    if (userError || !user) throw new Error(userError?.message);

    const { error: teacherError } = await supabase
      .from('teachers')
      .upsert(
        {
          user_id: user.id,
          full_name: seed.full_name,
          phone: seed.phone,
        },
        { onConflict: 'user_id' }
      );
    if (teacherError) throw new Error(teacherError.message);
  }

  const { data } = await supabase
    .from('teachers')
    .select('id, full_name, user_id');
  return data;
}

async function seedPricing(levelsMap) {
  console.log('💰 Seeding pricing & tiers...');
  const pricingRows = [];
  const tierRows = [];

  pricingConfig.forEach((config) => {
    const levelId = levelsMap.get(config.matcher);
    if (!levelId) return;
    pricingRows.push(
      {
        education_level_id: levelId,
        lesson_type: 'individual',
        price_per_hour: config.individual,
      },
      {
        education_level_id: levelId,
        lesson_type: 'group',
        price_per_hour: config.group,
      }
    );
    config.tiers?.forEach((tier) => {
      tierRows.push({
        education_level_id: levelId,
        student_count: tier.student_count,
        total_price: tier.total_price,
        price_per_student: parseFloat(
          (tier.total_price / tier.student_count).toFixed(2)
        ),
      });
    });
  });

  if (pricingRows.length) {
    const { error } = await supabase
      .from('pricing')
      .upsert(pricingRows, { onConflict: 'education_level_id,lesson_type' });
    if (error) throw new Error(error.message);
  }

  if (tierRows.length) {
    const { error } = await supabase
      .from('group_pricing_tiers')
      .upsert(tierRows, { onConflict: 'education_level_id,student_count' });
    if (error) throw new Error(error.message);
  }
}

async function seedLessons(teachers, studentsList, levelsMap) {
  console.log('📘 Seeding sample lessons...');
  const firstTeacher = teachers[0];
  if (!firstTeacher) {
    console.warn('No teachers available to seed lessons.');
    return;
  }

  const sampleLessons = studentsList.slice(0, 2).map((student, idx) => ({
    teacher_id: firstTeacher.id,
    student_id: student.id,
    education_level_id: student.education_level_id,
    date: new Date(Date.now() - idx * 86400000).toISOString().split('T')[0],
    hours: 1 + idx * 0.5,
    approved: false,
  }));

  const { error } = await supabase.from('individual_lessons').insert(sampleLessons);
  if (error) throw new Error(error.message);
}

async function main() {
  try {
    const levels = await seedEducationLevels();
    const levelsMap = new Map(levels.map((level) => [level.name_ar, level.id]));
    const students = await seedStudents(levelsMap);
    const teachers = await seedTeachers();
    await seedPricing(levelsMap);
    await seedLessons(teachers, students, levelsMap);
    console.log('✅ Sample data seeding complete.');
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    process.exit(1);
  }
}

main();


