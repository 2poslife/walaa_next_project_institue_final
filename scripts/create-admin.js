/**
 * Script to create the first admin user
 * 
 * Usage: node scripts/create-admin.js
 */

const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

// Read .env.local file
const envPath = path.join(__dirname, '..', '.env.local');
let envContent = {};

if (fs.existsSync(envPath)) {
  const envFile = fs.readFileSync(envPath, 'utf8');
  envFile.split('\n').forEach(line => {
    const match = line.match(/^([^=:#]+)=(.*)$/);
    if (match) {
      envContent[match[1].trim()] = match[2].trim();
    }
  });
}

const supabaseUrl = envContent.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = envContent.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Missing Supabase credentials in .env.local');
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const args = process.argv.slice(2);
const usernameArg = args[0];
const passwordArg = args[1];
const roleArg = args[2];

const username = usernameArg || process.env.ADMIN_USERNAME || envContent.ADMIN_USERNAME || 'admin';
const password = passwordArg || process.env.ADMIN_PASSWORD || envContent.ADMIN_PASSWORD || 'admin123';
const role = (roleArg || process.env.ADMIN_ROLE || envContent.ADMIN_ROLE || 'admin').trim();

if (!username || !password) {
  console.error('❌ Error: Username and password are required.');
  console.error('Usage: node scripts/create-admin.js <username> <password> [role]');
  process.exit(1);
}

async function createAdmin() {
  console.log('🔐 Creating admin user...');
  console.log(`Username: ${username}`);
  console.log(`Role: ${role}`);
  console.log('');

  try {
    // Check if user already exists
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id, username, role')
      .eq('username', username.toLowerCase())
      .single();

    if (existingUser && !checkError) {
      console.log('⚠️  User already exists!');
      console.log(`User ID: ${existingUser.id}`);
      console.log(`Role: ${existingUser.role}`);
      console.log('');
      console.log('✅ You can login with this user!');
      return;
    }

    // Hash password
    console.log('🔒 Hashing password...');
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    console.log('👤 Creating user in database...');
    const { data: user, error: userError } = await supabase
      .from('users')
      .insert({
        username: username.toLowerCase(),
        password_hash: passwordHash,
        role,
        is_active: true,
      })
      .select()
      .single();

    if (userError) {
      console.error('❌ Error creating user:', userError.message);
      if (userError.code === '23505') {
        console.error('User already exists with this username');
      }
      return;
    }

    console.log('');
    console.log('✅ Admin user created successfully!');
    console.log('');
    console.log('📋 User Details:');
    console.log(`   ID: ${user.id}`);
    console.log(`   Username: ${user.username}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Active: ${user.is_active}`);
    console.log('');
    console.log('🚀 You can now login at: http://localhost:3000/login');
    console.log(`   Username: ${username}`);
    console.log(`   Password: ${password}`);
    console.log('');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createAdmin();

