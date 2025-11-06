-- Migration: Add Ahmed Kutty User Permissions
-- Date: 2025-10-11
-- User ID: b35ea557-f1a1-4e3d-b761-7e6b2f3b6c32
-- Email: ahammedkuttykoottil1976@gmail.com
-- Status: EXECUTED SUCCESSFULLY (2025-10-11)

-- Step 1: Extend user_branch_permissions table with new permission columns
ALTER TABLE user_branch_permissions
ADD COLUMN IF NOT EXISTS allowed_customer_owners TEXT[],
ADD COLUMN IF NOT EXISTS vehicle_instalment_departments TEXT[],
ADD COLUMN IF NOT EXISTS loan_filter_rules JSONB;

-- Step 2: Insert Ahmed Kutty's user record with specified permissions
INSERT INTO user_branch_permissions (
  user_id,
  user_email,
  allowed_branches,
  allowed_customer_owners,
  vehicle_instalment_departments,
  loan_filter_rules,
  preferred_language,
  display_name_en,
  display_name_ar,
  role,
  created_at,
  updated_at
) VALUES (
  'b35ea557-f1a1-4e3d-b761-7e6b2f3b6c32',
  'ahammedkuttykoottil1976@gmail.com',
  -- Allowed branches (using location_name as per LocationFilterContext)
  ARRAY[
    'Frozen / ثلاجة',
    'Nashad - Frozen / ثلاجة',
    'Nisam - Frozen / ثلاجة',
    'JTB 5936'
  ],
  -- Allowed customer owners
  ARRAY[
    'Nashad',
    'Nisam',
    'Frozen Counter',
    'Unassigned'
  ],
  -- Vehicle instalment departments (only Frozen)
  ARRAY['Frozen'],
  -- Loan filter rules: Show overdue loans OR loans with remaining days < 30
  '{"show_overdue": true, "remaining_days_threshold": 30}'::JSONB,
  -- Preferred language
  'en',
  -- Display name in English
  'Ahmed Kutty',
  -- Display name in Arabic (if needed)
  'أحمد كوتي',
  -- Role
  'manager',
  -- Timestamps
  NOW(),
  NOW()
)
ON CONFLICT (user_id) DO UPDATE SET
  user_email = EXCLUDED.user_email,
  allowed_branches = EXCLUDED.allowed_branches,
  allowed_customer_owners = EXCLUDED.allowed_customer_owners,
  vehicle_instalment_departments = EXCLUDED.vehicle_instalment_departments,
  loan_filter_rules = EXCLUDED.loan_filter_rules,
  preferred_language = EXCLUDED.preferred_language,
  display_name_en = EXCLUDED.display_name_en,
  display_name_ar = EXCLUDED.display_name_ar,
  role = EXCLUDED.role,
  updated_at = NOW();

-- Step 3: Verify the insertion
SELECT
  user_id,
  display_name_en,
  array_length(allowed_branches, 1) as branch_count,
  array_length(allowed_customer_owners, 1) as owner_count,
  array_length(vehicle_instalment_departments, 1) as dept_count,
  loan_filter_rules,
  preferred_language,
  role
FROM user_branch_permissions
WHERE user_id = 'b35ea557-f1a1-4e3d-b761-7e6b2f3b6c32';

-- Step 4: Verification Notes (Post-Migration)
-- ✅ All 4 branches exist in database and were verified
-- ⚠️ Customer owner "Nisam" does NOT exist in customer_balance_aging_filtered view
--    (Only Nashad, Frozen Counter, and Unassigned have customer data)
-- ✅ Frozen department has 9 vehicles in vehicle_loans table
-- ✅ User record created successfully with all permissions

-- To verify branch names exist in database, run:
-- SELECT location_name FROM branch WHERE location_name IN ('Frozen / ثلاجة', 'Nashad - Frozen / ثلاجة', 'Nisam - Frozen / ثلاجة', 'JTB 5936');

-- To verify customer owners exist in database, run:
-- SELECT DISTINCT customer_owner_name_custom, COUNT(*) as customer_count
-- FROM customer_balance_aging_filtered
-- WHERE customer_owner_name_custom IN ('Nashad', 'Nisam', 'Frozen Counter', 'Unassigned')
-- GROUP BY customer_owner_name_custom;
