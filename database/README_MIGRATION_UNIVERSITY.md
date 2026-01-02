# Migration: Add 'جامعي' Education Level

## Quick Instructions

To add the "جامعي" (University) education level to your database:

### Option 1: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy and paste the entire contents of `migration_add_university_level.sql`
5. Click **Run** or press `Ctrl+Enter`
6. You should see "Success. No rows returned" or similar success message

### Option 2: Using Supabase CLI

```bash
supabase db execute -f database/migration_add_university_level.sql
```

### Verify It Worked

After running the migration, you can verify by running this query in SQL Editor:

```sql
SELECT id, name_ar, name_en 
FROM education_levels 
WHERE name_ar = 'جامعي';
```

You should see one row with:
- `name_ar`: 'جامعي'
- `name_en`: 'University'

Also verify the pricing was added:

```sql
SELECT p.*, el.name_ar 
FROM pricing p
JOIN education_levels el ON p.education_level_id = el.id
WHERE el.name_ar = 'جامعي';
```

You should see:
- `lesson_type`: 'individual'
- `price_per_hour`: 140.00

## What This Migration Does

1. ✅ Adds "جامعي" (University) education level
2. ✅ Sets pricing to 140 per hour for **individual lessons only**
3. ✅ Does NOT add group pricing (so it won't appear in group lesson forms)

## After Migration

Once the migration is run:
- ✅ "جامعي" will appear in the **Students** form dropdown
- ✅ "جامعي" will appear in the **Individual Lessons** form dropdown
- ✅ "جامعي" will **NOT** appear in the **Group Lessons** form dropdown (by design)
- ✅ "جامعي" will appear in all tables showing education levels
- ✅ Pricing will be automatically set to 140 per hour for individual lessons

## Troubleshooting

If "جامعي" still doesn't appear after running the migration:

1. **Refresh the page** - The frontend caches education levels
2. **Check browser console** - Look for any API errors
3. **Verify the migration ran** - Use the verification queries above
4. **Check API response** - Go to Network tab and check `/api/education-levels` response



