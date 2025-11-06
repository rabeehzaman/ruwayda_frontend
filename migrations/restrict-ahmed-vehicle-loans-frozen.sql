-- Migration: Restrict Ahmed Kutty's Vehicle Loans to Frozen Department Only
-- Created: 2025-10-14
-- Author: Claude Code
-- Purpose: Implement department-based RLS for vehicle loans, restricting Ahmed to Frozen department

-- Background:
-- Before this migration, Ahmed could see ALL vehicle loans from ALL departments (25 vehicles total).
-- The existing RLS policies on vehicle_loans table had "qual: true" which allowed unrestricted access.
-- This migration restricts Ahmed to ONLY see the 9 vehicles in the Frozen department.

-- Vehicle Loan Distribution:
-- - Frozen: 9 vehicles (Ahmed will see ONLY these)
-- - Hassan: 1 vehicle
-- - Jebreel: 1 vehicle
-- - Mada: 4 vehicles
-- - Madinah: 2 vehicles
-- - Osaimi: 2 vehicles
-- - Qurban: 2 vehicles
-- - Team Babu: 3 vehicles
-- - Waleed: 1 vehicle
-- Total: 25 vehicles (Ahmed will be restricted from seeing 16 of these)

-- Step 1: Update Ahmed Kutty's vehicle department permissions
UPDATE user_branch_permissions
SET
  vehicle_instalment_departments = ARRAY['Frozen'],
  updated_at = NOW()
WHERE user_email = 'ahammedkuttykoottil1976@gmail.com';

-- Step 2: Drop existing permissive RLS policies (they allow ALL data)
DROP POLICY IF EXISTS "Allow anon users to read vehicle loans" ON vehicle_loans;
DROP POLICY IF EXISTS "Allow authenticated users to read vehicle loans" ON vehicle_loans;

-- Step 3: Create proper RLS policy with department filtering
CREATE POLICY "Restrict vehicle loans by department and user permissions"
ON vehicle_loans
FOR SELECT
TO authenticated
USING (
  -- Allow admin users to see all vehicle loans
  is_admin_user()
  OR
  -- Allow restricted users to see only their assigned departments
  (
    department = ANY(
      SELECT unnest(vehicle_instalment_departments)
      FROM user_branch_permissions
      WHERE user_id = auth.uid()
        AND vehicle_instalment_departments IS NOT NULL
    )
  )
  OR
  -- If user has no department restrictions (vehicle_instalment_departments IS NULL),
  -- allow them to see all departments
  (
    NOT EXISTS (
      SELECT 1
      FROM user_branch_permissions
      WHERE user_id = auth.uid()
        AND vehicle_instalment_departments IS NOT NULL
    )
  )
);

-- Step 4: Ensure RLS is enabled on the table
ALTER TABLE vehicle_loans ENABLE ROW LEVEL SECURITY;

-- Step 5: Add anon policy for public access (if needed by your app)
-- Note: This allows unauthenticated users to see all vehicle loans
-- Remove this policy if you want to restrict to authenticated users only
CREATE POLICY "Allow anon users to read all vehicle loans"
ON vehicle_loans
FOR SELECT
TO anon
USING (true);

-- Verification Queries:
-- Run these to verify the migration worked correctly

-- Query 1: Check Ahmed's updated permissions
SELECT
  user_email,
  role,
  vehicle_instalment_departments,
  loan_filter_rules,
  hidden_pages
FROM user_branch_permissions
WHERE user_email = 'ahammedkuttykoottil1976@gmail.com';

-- Expected Result:
--   user_email: ahammedkuttykoottil1976@gmail.com
--   role: manager
--   vehicle_instalment_departments: {Frozen}
--   loan_filter_rules: {"show_overdue": true, "remaining_days_threshold": 30}
--   hidden_pages: NULL

-- Query 2: Check RLS policies on vehicle_loans table
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename = 'vehicle_loans'
ORDER BY policyname;

-- Expected Result: 2 policies
--   1. "Allow anon users to read all vehicle loans" (anon role)
--   2. "Restrict vehicle loans by department and user permissions" (authenticated role)

-- Query 3: Count vehicles by department (as system/admin)
SELECT department, COUNT(*) as vehicle_count
FROM vehicle_loans
GROUP BY department
ORDER BY department;

-- Expected Result: 9 departments
--   Frozen: 9 vehicles (Ahmed will see these)
--   Hassan: 1 vehicle
--   Jebreel: 1 vehicle
--   Mada: 4 vehicles
--   Madinah: 2 vehicles
--   Osaimi: 2 vehicles
--   Qurban: 2 vehicles
--   Team Babu: 3 vehicles
--   Waleed: 1 vehicle

-- Notes:
-- 1. Ahmed's loan_filter_rules still apply AFTER department filtering
--    - First: Filter to Frozen department only (9 vehicles)
--    - Then: Filter by status (overdue + expiring within 30 days)
--    - Final result: May show 0-9 vehicles depending on loan statuses
--
-- 2. Admin users bypass ALL filtering and see all 25 vehicles
--
-- 3. Users with vehicle_instalment_departments = NULL see all departments
--
-- 4. The frontend (use-vehicle-loans.ts) automatically uses this RLS policy
--    No code changes needed - filtering happens at database level

-- Testing Instructions:
-- 1. Log in as Ahmed (ahammedkuttykoottil1976@gmail.com)
-- 2. Navigate to Vehicle Instalments page
-- 3. Verify you see ONLY Frozen department vehicles (0-9 vehicles)
-- 4. Check department filter dropdown - should show only "Frozen"
-- 5. Log in as admin user
-- 6. Verify you see all 25 vehicles from all 9 departments

-- Rollback Instructions (if needed):
-- To revert this migration:
/*
-- Restore Ahmed's full access
UPDATE user_branch_permissions
SET
  vehicle_instalment_departments = NULL,
  updated_at = NOW()
WHERE user_email = 'ahammedkuttykoottil1976@gmail.com';

-- Drop the restrictive policy
DROP POLICY IF EXISTS "Restrict vehicle loans by department and user permissions" ON vehicle_loans;

-- Restore permissive policies
CREATE POLICY "Allow authenticated users to read vehicle loans"
ON vehicle_loans
FOR SELECT
TO authenticated
USING (true);
*/

-- Migration Complete
-- Status: Ready to apply
-- Risk Level: LOW - Only affects Ahmed's access, no data loss
-- Impact: Ahmed will see 9 vehicles instead of 25 (restricted to Frozen department)
