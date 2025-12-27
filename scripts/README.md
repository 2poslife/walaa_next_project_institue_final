# Scripts Guide

All scripts assume:

- You have Node.js installed.
- You run commands from the project root: `C:\Users\Majd\Desktop\mhms\next_project_institute`.
- `.env.local` (or system environment variables) contains Supabase credentials:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`

Use PowerShell or any terminal and run `node <script-path>`. Examples below:

## 1. Create Admin

Creates a specific admin user (default `admin/admin123` unless you pass args/env).

```
node scripts/create-admin.js [username] [password] [role]
```

If you omit args, it falls back to environment variables or defaults.

## 2. Setup Pricing

Seeds/updates pricing in `pricing` and `group_pricing_tiers`.

```
node scripts/setup-pricing.js
```

The script uses the `pricingConfig` inside the file; adjust values (individual, group, groupTiers) before running.

## 3. Setup Teachers

Creates five teacher accounts (`teacher1` … `teacher5`, passwords match usernames).

```
node scripts/setup-teachers.js
```

If a teacher already exists, the script skips it and moves on.

## 4. Seed All Sample Data

Seeds education levels, students, teachers, pricing + group tiers, and a couple of sample lessons.

```
node scripts/seed-all.js
```

### Expected result

#### `education_levels`
| id | name_ar | name_en |
| --- | --- | --- |
| 1 | ابتدائي | Elementary |
| 2 | إعدادي | Middle |
| 3 | ثانوي | Secondary |

#### `students`
| full_name | parent_contact | level (name_ar) |
| --- | --- | --- |
| محمد صالح | 0512345678 | ابتدائي |
| أحمد علي | 0598765432 | إعدادي |
| ليان خالد | 0567891234 | ثانوي |
| سارة سالم | 0534567890 | إعدادي |

#### `users` + `teachers`
| username | password | full_name | phone |
| --- | --- | --- | --- |
| teacher1 | teacher1 | Teacher 1 | 0500000001 |
| teacher2 | teacher2 | Teacher 2 | 0500000002 |
| teacher3 | teacher3 | Teacher 3 | 0500000003 |

#### `pricing` (price_per_hour)
| level | individual | group |
| --- | --- | --- |
| ابتدائي | 50 | 50 |
| إعدادي | 60 | 60 |
| ثانوي | 70 | 70 |

#### `group_pricing_tiers`
| level | student_count | total_price | price_per_student |
| --- | --- | --- | --- |
| ابتدائي | 2 | 110 | 55 |
| ابتدائي | 3 | 150 | 50 |
| إعدادي | 2 | 130 | 65 |
| إعدادي | 3 | 180 | 60 |
| ثانوي | 2 | 150 | 75 |
| ثانوي | 3 | 210 | 70 |

#### `individual_lessons`
Two pending lessons for `teacher1` with the first two students (dates: today/yesterday, hours 1 & 1.5).

## Notes

- Re-run scripts any time; they use `upsert` or skip duplicates, so it’s safe.
- Check console output for success or errors. If you see “Missing Supabase credentials”, verify `.env.local`.

