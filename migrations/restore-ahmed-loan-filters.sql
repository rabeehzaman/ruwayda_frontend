-- Migration: Restore Ahmed Kutty's Loan Filter Rules
-- Date: 2025-10-13
-- User ID: b35ea557-f1a1-4e3d-b761-7e6b2f3b6c32
-- Email: ahammedkuttykoottil1976@gmail.com
-- Purpose: Restore loan filtering configuration that was previously reset
-- Status: ✅ EXECUTED SUCCESSFULLY (2025-10-13 13:55:24 UTC)

-- Background:
-- On October 11, 2025, Ahmed's loan_filter_rules were initially set to filter loans.
-- On October 12, 2025, the approach changed to hide the entire loans page instead.
-- This migration restores the original data filtering approach per user request.

-- Step 1: Update Ahmed Kutty's record to restore loan filter rules
UPDATE user_branch_permissions
SET
  loan_filter_rules = '{"show_overdue": true, "remaining_days_threshold": 30}'::JSONB,
  updated_at = NOW()
WHERE user_email = 'ahammedkuttykoottil1976@gmail.com';

-- Step 2: Verify the update (run this separately to confirm)
SELECT
  user_email,
  role,
  loan_filter_rules,
  jsonb_pretty(loan_filter_rules) as formatted_rules,
  hidden_pages,
  updated_at
FROM user_branch_permissions
WHERE user_email = 'ahammedkuttykoottil1976@gmail.com';

-- Expected Result:
-- {
--   "user_email": "ahammedkuttykoottil1976@gmail.com",
--   "role": "manager",
--   "loan_filter_rules": {"show_overdue": true, "remaining_days_threshold": 30},
--   "hidden_pages": null,
--   "updated_at": "2025-10-13 13:55:24.510192+00"
-- }

-- Step 3: Filtering Logic Documentation
-- ✅ Ahmed will see loans that match ANY of these conditions:
--    1. Loan status = 'overdue' (maturity date has passed)
--    2. Remaining days < 30 (expiring within 30 days)
--
-- ❌ Ahmed will NOT see:
--    1. Fully paid loans (status = 'closed')
--    2. Active loans with > 30 days remaining
--
-- ✅ Admin users bypass all filtering and see ALL loans

-- Step 4: Application Code Integration (No changes needed)
-- The filtering logic is already implemented in:
-- • src/hooks/use-loans.ts (lines 101-120)
-- • src/contexts/auth-context.tsx (loads loan_filter_rules automatically)
-- • No code changes required - just database configuration!

-- Step 5: Rollback Instructions
-- To remove filtering and show all loans to Ahmed:
-- UPDATE user_branch_permissions
-- SET loan_filter_rules = NULL, updated_at = NOW()
-- WHERE user_email = 'ahammedkuttykoottil1976@gmail.com';

-- Step 6: Hide Loans Page Entirely (Alternative Approach)
-- If you prefer to hide the page instead of filtering:
-- UPDATE user_branch_permissions
-- SET
--   hidden_pages = ARRAY['/loans'],
--   loan_filter_rules = NULL,
--   updated_at = NOW()
-- WHERE user_email = 'ahammedkuttykoottil1976@gmail.com';

-- Migration Notes:
-- • Risk Level: LOW - Only affects one user's view
-- • Breaking Changes: NONE
-- • Performance Impact: NONE - filtering happens in-memory on frontend
-- • Testing: Log in as Ahmed and verify loans page shows only filtered data
