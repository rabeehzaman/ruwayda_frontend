-- Migration: Hide Loans Page from Ahmed Kutty
-- Date: 2025-10-12
-- User ID: b35ea557-f1a1-4e3d-b761-7e6b2f3b6c32
-- Email: ahammedkuttykoottil1976@gmail.com
-- Purpose: Add page visibility control to user permissions

-- Step 1: Add hidden_pages column to user_branch_permissions table
ALTER TABLE user_branch_permissions
ADD COLUMN IF NOT EXISTS hidden_pages TEXT[];

-- Step 2: Update Ahmed Kutty's record to hide the loans page
UPDATE user_branch_permissions
SET
  hidden_pages = ARRAY['/loans'],
  updated_at = NOW()
WHERE user_id = 'b35ea557-f1a1-4e3d-b761-7e6b2f3b6c32';

-- Step 3: Verify the update
SELECT
  user_id,
  user_email,
  display_name_en,
  hidden_pages,
  array_length(hidden_pages, 1) as hidden_page_count,
  updated_at
FROM user_branch_permissions
WHERE user_id = 'b35ea557-f1a1-4e3d-b761-7e6b2f3b6c32';

-- Step 4: Usage Notes
-- ✅ To unhide the loans page later, run:
--    UPDATE user_branch_permissions
--    SET hidden_pages = ARRAY[]::TEXT[]
--    WHERE user_id = 'b35ea557-f1a1-4e3d-b761-7e6b2f3b6c32';
--
-- ✅ To hide additional pages:
--    UPDATE user_branch_permissions
--    SET hidden_pages = ARRAY['/loans', '/financials']
--    WHERE user_id = 'b35ea557-f1a1-4e3d-b761-7e6b2f3b6c32';
--
-- ✅ To hide pages for other users:
--    UPDATE user_branch_permissions
--    SET hidden_pages = ARRAY['/vendors', '/expenses']
--    WHERE user_email = 'other_user@example.com';
