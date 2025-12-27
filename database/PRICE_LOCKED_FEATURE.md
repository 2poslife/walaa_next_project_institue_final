# Price Locked Feature

## Overview
The `price_locked` flag prevents lesson costs from being recalculated when pricing changes. This ensures that students who have already paid for lessons at a specific price won't be charged more if the admin updates pricing later.

## Problem Solved
**Scenario:** 
- Student pays 50 for a lesson (when price was 50)
- Admin later updates pricing to 70
- Without the flag, the lesson's `total_cost` would be recalculated to 70
- Student would now show as owing 20 more, even though they already paid 50

**Solution:**
- When a lesson's price is locked, the database trigger will NOT recalculate the cost
- The original `total_cost` is preserved

## Database Migration

Run the migration script to add the `price_locked` column:

```sql
-- Run this in your Supabase SQL Editor
-- See: database/migration_add_price_locked.sql
```

This will:
1. Add `price_locked BOOLEAN DEFAULT FALSE` to both `individual_lessons` and `group_lessons` tables
2. Update the trigger functions to check this flag before recalculating costs
3. Add indexes for better query performance

## When Prices Are Locked

Prices are automatically locked when:
- ✅ A lesson is **approved** (single or bulk approval)
- ✅ This ensures approved lessons maintain their original cost

## Manual Price Locking

Admins can manually lock/unlock prices by updating the `price_locked` field directly in the database:

```sql
-- Lock a specific lesson's price
UPDATE individual_lessons 
SET price_locked = TRUE 
WHERE id = 123;

-- Unlock a lesson's price (allows recalculation)
UPDATE individual_lessons 
SET price_locked = FALSE 
WHERE id = 123;
```

## API Behavior

### When Updating Lessons
- If `price_locked = TRUE`: The `total_cost` will NOT be recalculated, even if pricing changes
- If `price_locked = FALSE`: The `total_cost` will be recalculated based on current pricing

### When Approving Lessons
- Both single and bulk approval automatically set `price_locked = TRUE`
- This prevents future price changes from affecting already-approved lessons

## Best Practices

1. **Lock prices before payment**: If a student has paid for a lesson, consider locking its price
2. **Lock approved lessons**: Approved lessons are automatically locked
3. **Review before unlocking**: Only unlock prices if you're sure you want to recalculate costs

## Example Workflows

### Example 1: Price Locked (Protected) ✅

1. Student has a lesson with `total_cost = 50`, `price_locked = FALSE`
2. Admin approves the lesson → `price_locked = TRUE` automatically
3. Admin updates pricing from 50 to 70
4. Lesson's `total_cost` remains 50 (because `price_locked = TRUE`)
5. Student balance calculation uses the original 50, not 70

**Result:** ✅ Student is protected from price changes

---

### Example 2: Price NOT Locked (Recalculated) ⚠️

**Scenario:** Lesson is NOT approved yet, so `price_locked = FALSE`

1. **January 1:** Lesson created
   - Student: Sara
   - Education Level: Elementary
   - Hours: 2
   - Current pricing: 25/hour
   - `total_cost = 50` (25 × 2)
   - `price_locked = FALSE` (default)
   - `approved = FALSE`

2. **January 5:** Admin updates pricing
   - Old price: 25/hour
   - New price: 35/hour
   - Database trigger runs: `price_locked = FALSE` → **Recalculates cost!**
   - `total_cost = 70` (35 × 2) ← **Changed from 50 to 70!**
   - `price_locked = FALSE` (still not locked)

3. **January 10:** Student pays
   - Student pays: 50 (based on old price)
   - But lesson now costs: 70
   - Student balance: -20 (owes 20 more!)

**Result:** ⚠️ Student owes more because price wasn't locked

---

### Example 3: Price NOT Locked (Before Payment) ✅

**Scenario:** Admin updates pricing BEFORE student pays (this is OK)

1. **January 1:** Lesson created
   - `total_cost = 50`
   - `price_locked = FALSE`
   - `approved = FALSE`

2. **January 5:** Admin updates pricing
   - Old: 25/hour → New: 35/hour
   - `total_cost = 70` (recalculated)
   - `price_locked = FALSE`

3. **January 10:** Student pays
   - Student pays: 70 (correct amount)
   - Balance: 0 ✅

**Result:** ✅ This is fine - student pays the updated price

---

### Example 4: Manual Lock Before Payment

**Scenario:** Admin wants to lock price manually before approval

1. **January 1:** Lesson created
   - `total_cost = 50`
   - `price_locked = FALSE`

2. **January 2:** Admin manually locks price
   ```sql
   UPDATE individual_lessons 
   SET price_locked = TRUE 
   WHERE id = 123;
   ```
   - `price_locked = TRUE` ✅

3. **January 5:** Admin updates pricing
   - Old: 25/hour → New: 35/hour
   - `total_cost = 50` (NOT recalculated because locked)
   - `price_locked = TRUE` (still locked)

4. **January 10:** Student pays
   - Student pays: 50
   - Balance: 0 ✅

**Result:** ✅ Price locked manually, protected from changes

