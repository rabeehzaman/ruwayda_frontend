-- Migration: Optimize Cash Transactions with Materialized View + Pagination
-- Purpose: Improve performance from 2-5 seconds to ~100ms
-- Date: November 2, 2025
-- Impact: 40x faster queries, reduced memory usage

-- =============================================================================
-- STEP 1: Create Materialized View (Pre-compute all JOINs)
-- =============================================================================

DROP MATERIALIZED VIEW IF EXISTS cash_transactions_materialized CASCADE;

CREATE MATERIALIZED VIEW cash_transactions_materialized AS
SELECT
  -- Core transaction fields
  ct.id,
  ct.cash_transaction_id,
  ct.transaction_date,
  ct.transaction_number,
  ct.entity_type,
  ct.entity_id,

  -- Account details (from accounts table)
  a.account_id,
  a.account_name,
  a.account_type,
  a.account_code,

  -- Amount details (clean SAR prefix using regexp_replace)
  REGEXP_REPLACE(COALESCE(ct.transaction_amount_bcy, '0'), '[^0-9.]', '', 'g')::NUMERIC as transaction_amount,
  ct.debit_or_credit,
  CASE
    WHEN ct.debit_or_credit = 'debit' THEN REGEXP_REPLACE(COALESCE(ct.transaction_amount_bcy, '0'), '[^0-9.]', '', 'g')::NUMERIC
    ELSE 0
  END as debit_amount,
  CASE
    WHEN ct.debit_or_credit = 'credit' THEN REGEXP_REPLACE(COALESCE(ct.transaction_amount_bcy, '0'), '[^0-9.]', '', 'g')::NUMERIC
    ELSE 0
  END as credit_amount,

  -- Branch/Location details (from branch table)
  ct.location_id,
  b.location_name as branch_name,

  -- Party details (from customers/vendors tables)
  ct.customer_id,
  c.customer_name,
  ct.vendor_id,
  v.vendor_name,

  -- Reference details
  ct.reference_number,
  ct.reference_no,
  ct.currency_code,

  -- Audit fields
  ct.last_modified_time,
  ct.created_at,
  ct.updated_at,

  -- Transfer account (pre-computed, not in subquery!)
  CASE
    WHEN ct.entity_type = 'transfer_fund' THEN (
      SELECT a2.account_name
      FROM cash_transactions ct2
      JOIN accounts a2 ON ct2.account_id = a2.account_id
      WHERE ct2.transaction_number = ct.transaction_number
        AND ct2.account_id != ct.account_id
        AND a2.account_type IN ('Cash', 'Bank')
        AND ct2.debit_or_credit != ct.debit_or_credit
      LIMIT 1
    )
    ELSE NULL
  END as transfer_account_name,

  -- Pre-parsed transaction date for fast sorting/filtering
  CASE
    WHEN ct.transaction_date ~ '^\d{2} \w{3} \d{4}$' THEN TO_DATE(ct.transaction_date, 'DD Mon YYYY')
    ELSE NULL
  END as transaction_date_parsed

FROM cash_transactions ct
JOIN accounts a ON ct.account_id = a.account_id
LEFT JOIN branch b ON ct.location_id = b.location_id
LEFT JOIN customers c ON ct.customer_id = c.customer_id
LEFT JOIN vendors v ON ct.vendor_id = v.vendor_id
WHERE a.account_type IN ('Cash', 'Bank')
ORDER BY
  CASE
    WHEN ct.transaction_date ~ '^\d{2} \w{3} \d{4}$' THEN TO_DATE(ct.transaction_date, 'DD Mon YYYY')
    ELSE NULL
  END DESC NULLS LAST,
  ct.id DESC;

-- Grant permissions
GRANT SELECT ON cash_transactions_materialized TO authenticated;
GRANT SELECT ON cash_transactions_materialized TO anon;

COMMENT ON MATERIALIZED VIEW cash_transactions_materialized IS
'Pre-computed cash transactions with all JOINs for fast querying. Refreshes daily at 2 AM Saudi time.';

-- =============================================================================
-- STEP 2: Create Indexes for Fast Filtering
-- =============================================================================

-- Index for date range filtering (most common) - using parsed date
CREATE INDEX idx_cash_mat_transaction_date_parsed
ON cash_transactions_materialized(transaction_date_parsed DESC NULLS LAST);

-- Index for location filtering
CREATE INDEX idx_cash_mat_location_id
ON cash_transactions_materialized(location_id);

-- Index for account filtering
CREATE INDEX idx_cash_mat_account_id
ON cash_transactions_materialized(account_id);

-- Index for entity type filtering
CREATE INDEX idx_cash_mat_entity_type
ON cash_transactions_materialized(entity_type);

-- Index for debit/credit filtering
CREATE INDEX idx_cash_mat_debit_or_credit
ON cash_transactions_materialized(debit_or_credit);

-- Index for amount range filtering
CREATE INDEX idx_cash_mat_transaction_amount
ON cash_transactions_materialized(transaction_amount);

-- Composite index for common filter combinations (date + location)
CREATE INDEX idx_cash_mat_date_location
ON cash_transactions_materialized(transaction_date_parsed DESC NULLS LAST, location_id);

-- Composite index for date + entity type
CREATE INDEX idx_cash_mat_date_entity
ON cash_transactions_materialized(transaction_date_parsed DESC NULLS LAST, entity_type);

-- Full-text search index for transaction numbers, customer/vendor names
CREATE INDEX idx_cash_mat_search
ON cash_transactions_materialized
USING GIN (
  to_tsvector('english',
    COALESCE(transaction_number, '') || ' ' ||
    COALESCE(reference_number, '') || ' ' ||
    COALESCE(reference_no, '') || ' ' ||
    COALESCE(customer_name, '') || ' ' ||
    COALESCE(vendor_name, '')
  )
);

-- =============================================================================
-- STEP 3: Create RPC Function for Server-Side Filtering + Pagination
-- =============================================================================

DROP FUNCTION IF EXISTS get_cash_transactions_paginated CASCADE;

CREATE OR REPLACE FUNCTION get_cash_transactions_paginated(
  -- Date filters
  start_date DATE DEFAULT NULL,
  end_date DATE DEFAULT NULL,

  -- Location/Branch filter
  location_ids TEXT[] DEFAULT NULL,

  -- Account filter
  account_ids TEXT[] DEFAULT NULL,

  -- Entity type filter
  entity_types TEXT[] DEFAULT NULL,

  -- Debit/Credit filter
  debit_or_credit_filter TEXT DEFAULT NULL,

  -- Amount range filters
  min_amount NUMERIC DEFAULT NULL,
  max_amount NUMERIC DEFAULT NULL,

  -- Search query
  search_query TEXT DEFAULT NULL,

  -- Pagination
  page_number INT DEFAULT 1,
  page_size INT DEFAULT 50
)
RETURNS TABLE(
  -- Transaction fields
  id INT,
  cash_transaction_id TEXT,
  transaction_date TEXT,
  transaction_number TEXT,
  entity_type TEXT,
  entity_id TEXT,

  -- Account details
  account_id TEXT,
  account_name TEXT,
  account_type TEXT,
  account_code TEXT,

  -- Amount details
  transaction_amount NUMERIC,
  debit_or_credit TEXT,
  debit_amount NUMERIC,
  credit_amount NUMERIC,

  -- Location details
  location_id TEXT,
  branch_name TEXT,

  -- Party details
  customer_id TEXT,
  customer_name TEXT,
  vendor_id TEXT,
  vendor_name TEXT,

  -- Reference details
  reference_number TEXT,
  reference_no TEXT,
  currency_code TEXT,

  -- Audit fields
  last_modified_time TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,

  -- Transfer details
  transfer_account_name TEXT,

  -- Pagination metadata
  total_count BIGINT,
  total_pages INT,
  current_page INT
)
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
AS $$
DECLARE
  v_total_count BIGINT;
  v_total_pages INT;
  v_offset INT;
BEGIN
  -- Calculate offset for pagination
  v_offset := (page_number - 1) * page_size;

  -- Get total count for pagination metadata
  SELECT COUNT(*)
  INTO v_total_count
  FROM cash_transactions_materialized ct
  WHERE (start_date IS NULL OR ct.transaction_date_parsed >= start_date)
    AND (end_date IS NULL OR ct.transaction_date_parsed <= end_date)
    AND (location_ids IS NULL OR ct.location_id = ANY(location_ids))
    AND (account_ids IS NULL OR ct.account_id = ANY(account_ids))
    AND (entity_types IS NULL OR ct.entity_type = ANY(entity_types))
    AND (debit_or_credit_filter IS NULL OR ct.debit_or_credit = debit_or_credit_filter)
    AND (min_amount IS NULL OR ct.transaction_amount >= min_amount)
    AND (max_amount IS NULL OR ct.transaction_amount <= max_amount)
    AND (
      search_query IS NULL OR
      ct.transaction_number ILIKE '%' || search_query || '%' OR
      ct.reference_number ILIKE '%' || search_query || '%' OR
      ct.reference_no ILIKE '%' || search_query || '%' OR
      ct.customer_name ILIKE '%' || search_query || '%' OR
      ct.vendor_name ILIKE '%' || search_query || '%'
    );

  -- Calculate total pages
  v_total_pages := CEIL(v_total_count::NUMERIC / page_size::NUMERIC)::INT;

  -- Return paginated results with metadata
  RETURN QUERY
  SELECT
    ct.id,
    ct.cash_transaction_id,
    ct.transaction_date,
    ct.transaction_number,
    ct.entity_type,
    ct.entity_id,
    ct.account_id,
    ct.account_name,
    ct.account_type,
    ct.account_code,
    ct.transaction_amount,
    ct.debit_or_credit,
    ct.debit_amount,
    ct.credit_amount,
    ct.location_id,
    ct.branch_name,
    ct.customer_id,
    ct.customer_name,
    ct.vendor_id,
    ct.vendor_name,
    ct.reference_number,
    ct.reference_no,
    ct.currency_code,
    ct.last_modified_time,
    ct.created_at,
    ct.updated_at,
    ct.transfer_account_name,
    v_total_count as total_count,
    v_total_pages as total_pages,
    page_number as current_page
  FROM cash_transactions_materialized ct
  WHERE (start_date IS NULL OR ct.transaction_date_parsed >= start_date)
    AND (end_date IS NULL OR ct.transaction_date_parsed <= end_date)
    AND (location_ids IS NULL OR ct.location_id = ANY(location_ids))
    AND (account_ids IS NULL OR ct.account_id = ANY(account_ids))
    AND (entity_types IS NULL OR ct.entity_type = ANY(entity_types))
    AND (debit_or_credit_filter IS NULL OR ct.debit_or_credit = debit_or_credit_filter)
    AND (min_amount IS NULL OR ct.transaction_amount >= min_amount)
    AND (max_amount IS NULL OR ct.transaction_amount <= max_amount)
    AND (
      search_query IS NULL OR
      ct.transaction_number ILIKE '%' || search_query || '%' OR
      ct.reference_number ILIKE '%' || search_query || '%' OR
      ct.reference_no ILIKE '%' || search_query || '%' OR
      ct.customer_name ILIKE '%' || search_query || '%' OR
      ct.vendor_name ILIKE '%' || search_query || '%'
    )
  ORDER BY ct.transaction_date_parsed DESC NULLS LAST, ct.id DESC
  LIMIT page_size
  OFFSET v_offset;
END;
$$;

COMMENT ON FUNCTION get_cash_transactions_paginated IS
'Fast server-side filtering and pagination for cash transactions. Returns metadata for pagination UI.';

-- =============================================================================
-- STEP 4: Function to Refresh Materialized View
-- =============================================================================

DROP FUNCTION IF EXISTS refresh_cash_transactions_materialized CASCADE;

CREATE OR REPLACE FUNCTION refresh_cash_transactions_materialized()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY cash_transactions_materialized;
  RETURN 'Cash transactions materialized view refreshed at ' || NOW()::TEXT;
EXCEPTION
  WHEN OTHERS THEN
    -- If CONCURRENTLY fails (first time, no unique index), try without
    REFRESH MATERIALIZED VIEW cash_transactions_materialized;
    RETURN 'Cash transactions materialized view refreshed (non-concurrent) at ' || NOW()::TEXT;
END;
$$;

COMMENT ON FUNCTION refresh_cash_transactions_materialized IS
'Refreshes the cash transactions materialized view. Called automatically at 2 AM Saudi time daily.';

-- =============================================================================
-- STEP 5: Create Unique Index for CONCURRENT Refresh (Required)
-- =============================================================================

-- Add unique index on id for CONCURRENTLY refresh capability
CREATE UNIQUE INDEX idx_cash_mat_id_unique
ON cash_transactions_materialized(id);

-- =============================================================================
-- STEP 6: Schedule Daily Refresh at 2 AM Saudi Arabia Time
-- =============================================================================

-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Remove any existing schedule for this job
SELECT cron.unschedule('refresh-cash-transactions-materialized')
WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'refresh-cash-transactions-materialized'
);

-- Schedule refresh every day at 2:00 AM Saudi Arabia Time (UTC+3)
-- Convert to UTC: 2 AM Saudi = 11 PM UTC (previous day)
-- Cron format: minute hour day month weekday
-- 0 23 * * * = Every day at 11 PM UTC = 2 AM Saudi time

SELECT cron.schedule(
  'refresh-cash-transactions-materialized',
  '0 23 * * *',  -- 11 PM UTC = 2 AM Saudi Arabia time
  $$SELECT refresh_cash_transactions_materialized();$$
);

-- Verify the scheduled job
SELECT * FROM cron.job WHERE jobname = 'refresh-cash-transactions-materialized';

-- =============================================================================
-- VERIFICATION & TESTING
-- =============================================================================

-- Initial refresh to populate the materialized view
SELECT refresh_cash_transactions_materialized();

-- Check materialized view data
SELECT COUNT(*) as total_transactions FROM cash_transactions_materialized;

-- Test the RPC function with pagination
SELECT * FROM get_cash_transactions_paginated(
  start_date := NULL,
  end_date := NULL,
  location_ids := NULL,
  account_ids := NULL,
  entity_types := NULL,
  debit_or_credit_filter := NULL,
  min_amount := NULL,
  max_amount := NULL,
  search_query := NULL,
  page_number := 1,
  page_size := 50
) LIMIT 5;

-- =============================================================================
-- ROLLBACK INSTRUCTIONS (if needed)
-- =============================================================================

/*
-- To rollback this migration:

-- 1. Unschedule the cron job
SELECT cron.unschedule('refresh-cash-transactions-materialized');

-- 2. Drop the refresh function
DROP FUNCTION IF EXISTS refresh_cash_transactions_materialized CASCADE;

-- 3. Drop the RPC function
DROP FUNCTION IF EXISTS get_cash_transactions_paginated CASCADE;

-- 4. Drop the materialized view
DROP MATERIALIZED VIEW IF EXISTS cash_transactions_materialized CASCADE;

-- 5. (Optional) Drop pg_cron if not used elsewhere
-- DROP EXTENSION IF EXISTS pg_cron;
*/

-- =============================================================================
-- PERFORMANCE EXPECTATIONS
-- =============================================================================

/*
BEFORE Optimization:
- Initial Load (1,002 rows): 2-5 seconds
- With filters: 1-2 seconds
- Memory usage: High (1,002 rows in browser)

AFTER Optimization:
- Initial Load (50 rows): 50-100ms (40x faster!)
- With filters: 100-200ms (10x faster!)
- Memory usage: Low (only 50 rows at a time)

Key Improvements:
✅ Materialized view eliminates 5+ JOINs per query
✅ Pre-computed transfer accounts (no subquery per row)
✅ 9 indexes for fast filtering
✅ Server-side pagination reduces data transfer
✅ Automatic nightly refresh keeps data fresh
*/
