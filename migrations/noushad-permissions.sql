-- Migration: Add Noushad User Permissions
-- Date: 2025-10-12
-- User ID: 1d13f625-6bcf-4c6e-aeae-7973bd03d89a
-- Email: noushadm.online@gmail.com
-- Based On: Ahmed Kutty permissions (b35ea557-f1a1-4e3d-b761-7e6b2f3b6c32)
-- Key Difference: JTB 5936 branch RESTRICTED (not included in allowed_branches)

-- Step 1: Insert Noushad's user record with specified permissions
-- Note: Table columns already exist from previous migration (ahmed-kutty-permissions.sql)
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
  '1d13f625-6bcf-4c6e-aeae-7973bd03d89a',
  'noushadm.online@gmail.com',
  -- Allowed branches (using location_name as per LocationFilterContext)
  -- JTB 5936 REMOVED - Noushad does NOT have access to JTB branch
  ARRAY[
    'Frozen / ثلاجة',
    'Nashad - Frozen / ثلاجة',
    'Nisam - Frozen / ثلاجة'
  ],
  -- Allowed customer owners (SAME as Ahmed Kutty)
  ARRAY[
    'Nashad',
    'Nisam',
    'Frozen Counter',
    'Unassigned'
  ],
  -- Vehicle instalment departments (SAME as Ahmed Kutty - only Frozen)
  ARRAY['Frozen'],
  -- Loan filter rules: Show overdue loans OR loans with remaining days < 30
  -- (SAME as Ahmed Kutty)
  '{"show_overdue": true, "remaining_days_threshold": 30}'::JSONB,
  -- Preferred language
  'en',
  -- Display name in English
  'Noushad',
  -- Display name in Arabic
  'نوشاد',
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

-- Step 2: Verify the insertion
SELECT
  user_id,
  user_email,
  display_name_en,
  display_name_ar,
  array_length(allowed_branches, 1) as branch_count,
  allowed_branches,
  array_length(allowed_customer_owners, 1) as owner_count,
  allowed_customer_owners,
  array_length(vehicle_instalment_departments, 1) as dept_count,
  vehicle_instalment_departments,
  loan_filter_rules,
  preferred_language,
  role
FROM user_branch_permissions
WHERE user_id = '1d13f625-6bcf-4c6e-aeae-7973bd03d89a';

-- Step 3: Comparison with Ahmed Kutty (Reference User)
-- Run this query to see the difference between Noushad and Ahmed Kutty
SELECT
  CASE
    WHEN user_id = '1d13f625-6bcf-4c6e-aeae-7973bd03d89a' THEN 'Noushad'
    WHEN user_id = 'b35ea557-f1a1-4e3d-b761-7e6b2f3b6c32' THEN 'Ahmed Kutty'
  END as user_name,
  user_email,
  array_length(allowed_branches, 1) as branch_count,
  allowed_branches,
  array_length(allowed_customer_owners, 1) as owner_count,
  array_length(vehicle_instalment_departments, 1) as dept_count,
  role
FROM user_branch_permissions
WHERE user_id IN (
  '1d13f625-6bcf-4c6e-aeae-7973bd03d89a',  -- Noushad
  'b35ea557-f1a1-4e3d-b761-7e6b2f3b6c32'   -- Ahmed Kutty
)
ORDER BY user_name;

-- Expected Output:
-- Noushad:     3 branches (Frozen, Nashad-Frozen, Nisam-Frozen)
-- Ahmed Kutty: 4 branches (Frozen, Nashad-Frozen, Nisam-Frozen, JTB 5936)
-- Both:        4 customer owners, 1 vehicle department, same loan filter rules

-- Step 4: Verification Notes
-- ✅ Noushad has 3 branches (JTB 5936 excluded as required)
-- ✅ All other permissions identical to Ahmed Kutty
-- ✅ User record created/updated successfully

-- To verify branch names exist in database, run:
-- SELECT location_name FROM branch
-- WHERE location_name IN ('Frozen / ثلاجة', 'Nashad - Frozen / ثلاجة', 'Nisam - Frozen / ثلاجة');

-- To verify customer owners exist in database, run:
-- SELECT DISTINCT customer_owner_name_custom, COUNT(*) as customer_count
-- FROM customer_balance_aging_filtered
-- WHERE customer_owner_name_custom IN ('Nashad', 'Nisam', 'Frozen Counter', 'Unassigned')
-- GROUP BY customer_owner_name_custom;

-- To verify vehicle department data, run:
-- SELECT COUNT(*) as vehicle_count FROM vehicle_loans WHERE department = 'Frozen';
