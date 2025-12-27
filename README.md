# Institute Management System

A modern Next.js application for managing a private institute with admin and teacher roles.

## Features

- 🔐 Authentication with JWT (access + refresh tokens)
- 👨‍🏫 Teacher Management
- 👩‍🎓 Student Management
- 📘 Lesson Management (Individual & Group)
- 💰 Payment Tracking
- 💵 Pricing Management
- 📊 Statistics & Reports
- 🏠 Public Website (Home, About, Contact)

## Tech Stack

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety
- **Supabase** - PostgreSQL database
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **Tailwind CSS** - Styling

## Quick Start

### Step 1: Install Dependencies

```bash
npm install
```

### Step 2: Set Up Environment Variables

1. Copy the example file:
   ```bash
   # Copy .env.example to .env.local
   copy .env.example .env.local
   ```

2. Open `.env.local` and fill in your actual values (see `.env.example` for reference)

**Required fields:**
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key
- `JWT_SECRET` - Random secret key (min 32 characters)
- `JWT_REFRESH_SECRET` - Random secret key (min 32 characters)
- `NEXT_PUBLIC_APP_URL` - Your app URL (http://localhost:3000 for development)

#### How to Get Supabase Credentials:

1. Go to [supabase.com](https://supabase.com) and sign in
2. Open your project (or create a new one)
3. Go to **Settings** → **API**
4. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY` ⚠️ Keep this secret!

#### Generate JWT Secrets:

**Windows (PowerShell):**
```powershell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | % {[char]$_})
```

**Or use an online generator:**
- Visit: https://randomkeygen.com/
- Use a "CodeIgniter Encryption Keys" (256-bit)

### Step 3: Set Up Database

1. Go to your Supabase project dashboard
2. Click on **SQL Editor** in the left sidebar
3. Click **New Query**
4. Open `database/schema.sql` from this project
5. Copy and paste the entire file content
6. Click **Run** (or press Ctrl+Enter)

This will create all tables, indexes, triggers, and initial data.

**Optional:** Run `database/seed.sql` to add sample pricing data and create an admin user (remember to update the password hash first).

See `database/README.md` for detailed instructions.

### Step 4: Run the Development Server

```bash
npm run dev
```

### Dynamic Group Pricing Mode
You can switch how group lesson costs are calculated at runtime using an env flag.

- `default`: use `pricing` table (price per hour) for both individual and group lessons
- `tiers`: use `pricing` for individual, and `group_pricing_tiers` for group lessons

Set in `.env.local`:

```env
NEXT_PUBLIC_GROUP_PRICING_MODE=default  # or 'tiers'
```

Or use pre-made scripts:

```bash
# Default pricing
npm run dev:default

# Tiered group pricing
npm run dev:tiers
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Creating Your First Admin User

### Option 1: Using SQL (Quick Setup)

1. Hash a password using: https://bcrypt-generator.com/
2. Run in Supabase SQL Editor:

```sql
INSERT INTO users (username, password_hash, role, is_active) 
VALUES ('admin', '$2a$10$YourHashedPasswordHere', 'admin', true);
```

### Option 2: Create a Seed Script

Create `scripts/seed.ts`:

```typescript
import { hashPassword } from '../lib/auth';
import { supabaseAdmin } from '../lib/supabase';

async function seed() {
  const password = await hashPassword('admin123');
  const { data, error } = await supabaseAdmin
    .from('users')
    .insert({
      username: 'admin',
      password_hash: password,
      role: 'admin',
      is_active: true,
    });
  console.log('Admin user created:', data);
}

seed();
```

## Project Structure

```
├── app/
│   ├── api/              # API routes (backend)
│   │   ├── auth/        # Authentication endpoints
│   │   ├── teachers/    # Teacher management
│   │   ├── students/    # Student management
│   │   ├── lessons/     # Lesson management
│   │   ├── payments/    # Payment management
│   │   └── pricing/     # Pricing management
│   ├── dashboard/       # Dashboard pages (protected)
│   ├── about/          # About Us page
│   ├── contact/        # Contact Us page
│   ├── login/          # Login page
│   ├── layout.tsx      # Root layout
│   └── page.tsx        # Home page
├── components/
│   ├── ui/             # Reusable UI components
│   ├── layout/         # Layout components (Header, Footer, Sidebar)
│   └── providers/      # Context providers
├── contexts/           # React contexts (AuthContext)
├── lib/
│   ├── auth.ts         # JWT & password utilities
│   ├── config.ts       # App configuration
│   ├── constants.ts    # Application constants
│   ├── supabase.ts     # Supabase client setup
│   ├── api-client.ts   # Client-side API utilities
│   └── utils/          # Helper functions
├── types/              # TypeScript type definitions
├── middleware.ts       # Next.js middleware for auth
└── .env.local          # Environment variables (create this)
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## API Routes

### Authentication
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `POST /api/auth/refresh` - Refresh token
- `POST /api/auth/change-password` - Change password

### Teachers
- `GET /api/teachers` - Get all teachers
- `POST /api/teachers` - Create teacher
- `GET /api/teachers/[id]` - Get teacher by ID
- `PUT /api/teachers/[id]` - Update teacher
- `DELETE /api/teachers/[id]` - Delete teacher

### Students
- `GET /api/students` - Get all students
- `POST /api/students` - Create student

### Lessons
- `GET /api/lessons/individual` - Get individual lessons
- `POST /api/lessons/individual` - Create individual lesson

### Payments
- `GET /api/payments` - Get all payments
- `POST /api/payments` - Create payment

### Pricing
- `GET /api/pricing` - Get pricing rules
- `POST /api/pricing` - Save pricing

## Troubleshooting

### Port 3000 already in use?
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Or use a different port
npm run dev -- -p 3001
```

### Environment variables not working?
- Make sure `.env.local` is in the root directory
- Restart the dev server after changing `.env.local`
- Check that variable names match exactly (case-sensitive)

### Database connection errors?
- Verify your Supabase URL and keys are correct
- Check that your Supabase project is active
- Ensure all tables are created

### Authentication not working?
- Check that JWT secrets are set
- Verify user exists in database
- Check browser console for errors

## Deployment

This project is configured for deployment on Vercel. Make sure to set all environment variables in your Vercel project settings.

## License

Private project for institute management.
