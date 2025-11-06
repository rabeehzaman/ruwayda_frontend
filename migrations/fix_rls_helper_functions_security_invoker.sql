-- ============================================================================
-- FIX: RLS Helper Functions - Change SECURITY DEFINER → SECURITY INVOKER
-- ============================================================================
-- Issue: Ahmed and other restricted users can still see ALL branch data
--
-- Root Cause: RLS helper functions are marked as SECURITY DEFINER
--   - Functions run as postgres superuser (owner), not as calling user
--   - auth.uid() returns NULL when running as postgres
--   - RLS policies cannot identify current user
--   - Result: Everyone sees all data (security bypass)
--
-- Security Impact: CRITICAL
--   - Previous migration removed application filtering but RLS didn't work
--   - All users (Ahmed, etc.) can see data from ALL branches
--   - Complete breakdown of Row Level Security
--
-- Solution: Change from SECURITY DEFINER to SECURITY INVOKER
--   - Functions run with CALLER's permissions (Ahmed's auth context)
--   - auth.uid() correctly returns current user's ID
--   - RLS policies can identify and filter by user
--   - Keep STABLE modifier for performance optimization
--
-- Date: 2025-10-14
-- Related: fix_overview_rls_security_vulnerability.sql (previous attempt)
-- ============================================================================

-- Recreate is_admin_user() with SECURITY INVOKER
-- Using CREATE OR REPLACE to preserve dependent policies
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE            -- Result doesn't change within transaction (performance optimization)
SECURITY INVOKER  -- Run with CALLER's permissions so auth.uid() works
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_branch_permissions
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'super_admin')
  );
END;
$$;

COMMENT ON FUNCTION public.is_admin_user IS
'Check if current user is admin. Runs as SECURITY INVOKER so auth.uid() returns caller identity.
STABLE for performance - result cached within transaction.';

-- Recreate is_branch_allowed() with SECURITY INVOKER
-- Using CREATE OR REPLACE to preserve dependent policies
CREATE OR REPLACE FUNCTION public.is_branch_allowed(p_branch_name TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE            -- Result doesn't change within transaction (performance optimization)
SECURITY INVOKER  -- Run with CALLER's permissions so auth.uid() works
AS $$
BEGIN
  -- Admin users can see all branches
  IF is_admin_user() THEN
    RETURN TRUE;
  END IF;

  -- Check if branch is in user's allowed list
  RETURN p_branch_name = ANY(get_user_branches());
END;
$$;

COMMENT ON FUNCTION public.is_branch_allowed IS
'Check if branch is allowed for current user. Runs as SECURITY INVOKER so auth.uid() works.
STABLE for performance - result cached within transaction.';

-- Recreate get_user_branches() with SECURITY INVOKER
-- Using CREATE OR REPLACE to preserve dependent policies
CREATE OR REPLACE FUNCTION public.get_user_branches()
RETURNS TEXT[]
LANGUAGE plpgsql
STABLE            -- Result doesn't change within transaction (performance optimization)
SECURITY INVOKER  -- Run with CALLER's permissions so auth.uid() works
AS $$
DECLARE
  v_branches TEXT[];
BEGIN
  -- Admin users see all branches
  IF is_admin_user() THEN
    RETURN ARRAY(SELECT location_name FROM branch WHERE location_name IS NOT NULL);
  END IF;

  -- Return user's allowed branches from permissions table
  SELECT allowed_branches INTO v_branches
  FROM user_branch_permissions
  WHERE user_id = auth.uid();

  RETURN COALESCE(v_branches, ARRAY[]::TEXT[]);
END;
$$;

COMMENT ON FUNCTION public.get_user_branches IS
'Get list of branches allowed for current user. Runs as SECURITY INVOKER so auth.uid() works.
STABLE for performance - result cached within transaction.
Returns all branches for admin, allowed branches for restricted users, empty array if no permissions.';

-- ============================================================================
-- VERIFICATION TESTS
-- ============================================================================

DO $$
DECLARE
  v_current_user_id UUID;
  v_is_admin BOOLEAN;
  v_branches TEXT[];
BEGIN
  RAISE NOTICE '=== Testing RLS Helper Functions (SECURITY INVOKER) ===';
  RAISE NOTICE '';

  -- Test auth.uid() access
  SELECT auth.uid() INTO v_current_user_id;
  RAISE NOTICE 'Test 1: auth.uid() Access';
  IF v_current_user_id IS NULL THEN
    RAISE NOTICE '  ⚠️  auth.uid() is NULL (running as postgres superuser)';
    RAISE NOTICE '  ⚠️  Cannot test user-specific filtering in this context';
    RAISE NOTICE '  ✅ In production, auth.uid() will return actual user ID';
  ELSE
    RAISE NOTICE '  ✅ auth.uid() = %', v_current_user_id;
  END IF;
  RAISE NOTICE '';

  -- Test is_admin_user()
  SELECT is_admin_user() INTO v_is_admin;
  RAISE NOTICE 'Test 2: is_admin_user()';
  RAISE NOTICE '  Result: %', v_is_admin;
  IF v_current_user_id IS NULL THEN
    RAISE NOTICE '  ⚠️  Returns FALSE because auth.uid() is NULL (expected in postgres context)';
  END IF;
  RAISE NOTICE '';

  -- Test get_user_branches()
  SELECT get_user_branches() INTO v_branches;
  RAISE NOTICE 'Test 3: get_user_branches()';
  RAISE NOTICE '  Branch Count: %', array_length(v_branches, 1);
  IF v_current_user_id IS NULL THEN
    RAISE NOTICE '  ⚠️  Returns empty array because auth.uid() is NULL (expected in postgres context)';
  ELSE
    RAISE NOTICE '  Allowed Branches: %', array_to_string(v_branches, ', ');
  END IF;
  RAISE NOTICE '';

  RAISE NOTICE '✅ Functions recreated with SECURITY INVOKER';
  RAISE NOTICE '✅ STABLE modifier retained for performance';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  IMPORTANT: Test with actual user login (Ahmed) to verify filtering';
  RAISE NOTICE '   Expected for Ahmed:';
  RAISE NOTICE '     - is_admin_user() = FALSE';
  RAISE NOTICE '     - get_user_branches() = [Frozen, JTB 5936, Nashad-Frozen, Nisam-Frozen, MAHER WH, Zarif WH]';
  RAISE NOTICE '     - Overview tab shows 262 invoices (~299K SAR)';
  RAISE NOTICE '';
  RAISE NOTICE '   Expected for Admin users:';
  RAISE NOTICE '     - is_admin_user() = TRUE';
  RAISE NOTICE '     - get_user_branches() = [all 34 branches]';
  RAISE NOTICE '     - Overview tab shows 318 invoices (~505K SAR)';
END $$;

-- ============================================================================
-- ROLLBACK INSTRUCTIONS
-- ============================================================================
-- To rollback (restore SECURITY DEFINER):
--
-- CREATE OR REPLACE FUNCTION public.is_admin_user()
-- RETURNS BOOLEAN
-- LANGUAGE plpgsql
-- STABLE
-- SECURITY DEFINER  -- WARNING: This breaks auth.uid() access!
-- AS $$ ... $$;
--
-- Same for is_branch_allowed() and get_user_branches()
--
-- NOTE: Rollback will re-break RLS filtering. Only use for emergencies.
-- ============================================================================
