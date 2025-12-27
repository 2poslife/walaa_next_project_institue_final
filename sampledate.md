# Sample Data for All Tables

> Use these rows as quick inserts or fixtures when seeding a dev environment.  
> IDs are illustrative; feel free to adjust sequences to match your database state.

## 1. `users`
| id | username         | role     | is_active | notes               |
|----|------------------|----------|-----------|---------------------|
| 1  | admin            | admin    | true      | Default super admin |
| 2  | mariam.teacher   | teacher  | true      | Math teacher        |
| 3  | ahmed.subadmin   | subAdmin | true      | Branch coordinator  |

## 2. `teachers`
| id | user_id | full_name        | phone        |
|----|---------|------------------|--------------|
| 1  | 2       | Mariam Al-Hassan | +96650011122 |

## 3. `education_levels`
| id | name_ar  | name_en    |
|----|----------|------------|
| 1  | ابتدائي  | Elementary |
| 2  | إعدادي   | Middle     |
| 3  | ثانوي    | Secondary  |

## 4. `students`
| id | full_name      | parent_contact    | education_level_id |
|----|----------------|-------------------|--------------------|
| 1  | Sara Ali       | +96651111111      | 1                  |
| 2  | Omar Nabil     | +96652222222      | 2                  |
| 3  | Lina Hasan     | +96653333333      | 3                  |
| 4  | Yusuf Kareem   | +96654444444      | 1                  |
| 5  | Huda Sami      | +96655555555      | 2                  |

## 5. `pricing`
| id | education_level_id | lesson_type | price_per_hour |
|----|--------------------|-------------|----------------|
| 1  | 1                  | individual  | 120.00         |
| 2  | 1                  | group       | 90.00          |
| 3  | 2                  | individual  | 140.00         |
| 4  | 2                  | group       | 110.00         |
| 5  | 3                  | individual  | 160.00         |
| 6  | 3                  | group       | 130.00         |

## 6. `group_pricing_tiers`
| id | education_level_id | student_count | total_price | price_per_student |
|----|--------------------|---------------|-------------|-------------------|
| 1  | 1                  | 2             | 180.00      | 90.00             |
| 2  | 1                  | 4             | 320.00      | 80.00             |
| 3  | 2                  | 3             | 300.00      | 100.00            |
| 4  | 2                  | 5             | 450.00      | 90.00             |
| 5  | 3                  | 3             | 360.00      | 120.00            |

## 7. `individual_lessons`
| id | teacher_id | student_id | education_level_id | date       | hours | approved | total_cost |
|----|------------|------------|--------------------|------------|-------|----------|------------|
| 1  | 1          | 1          | 1                  | 2025-01-05 | 1.5   | true     | 180.00     |
| 2  | 1          | 2          | 2                  | 2025-01-07 | 2.0   | false    | 280.00     |
| 3  | 1          | 3          | 3                  | 2025-01-09 | 1.0   | true     | 160.00     |

## 8. `group_lessons`
| id | teacher_id | education_level_id | date       | hours | approved | total_cost |
|----|------------|--------------------|------------|-------|----------|------------|
| 1  | 1          | 1                  | 2025-01-10 | 2.0   | true     | 180.00     |
| 2  | 1          | 2                  | 2025-01-12 | 1.5   | false    | 165.00     |

## 9. `group_lesson_students`
| group_lesson_id | student_id |
|-----------------|------------|
| 1               | 1          |
| 1               | 4          |
| 2               | 2          |
| 2               | 5          |

## 10. `payments`
| id | student_id | amount | payment_date | note                  |
|----|------------|--------|--------------|-----------------------|
| 1  | 1          | 200.00 | 2025-01-08   | January tuition       |
| 2  | 2          | 150.00 | 2025-01-11   | Partial group lesson  |
| 3  | 3          | 320.00 | 2025-01-13   | Individual lessons    |


