-- Migration: Add expense_account_name to cash transactions view and function
-- Date: 2025-11-04
-- Description: Adds expense account name to the party column for expense transactions

-- Step 1: Drop the materialized view first (if it exists)
DROP MATERIALIZED VIEW IF EXISTS cash_transactions_materialized CASCADE;

-- Step 2: Drop and recreate the cash_transactions_view with expense_account_name
DROP VIEW IF EXISTS cash_transactions_view CASCADE;

CREATE OR REPLACE VIEW cash_transactions_view AS
SELECT
  ct.id,
  ct.cash_transaction_id,
  ct.transaction_date,
  ct.transaction_number,
  ct.entity_type,
  ct.entity_id,
  a.account_id,
  a.account_name,
  a.account_type,
  a.account_code,
  CAST(REGEXP_REPLACE(COALESCE(ct.transaction_amount_bcy, '0'), '[^0-9.]', '', 'g') AS NUMERIC) AS transaction_amount,
  ct.debit_or_credit,
  CASE
    WHEN ct.debit_or_credit = 'debit'
    THEN CAST(REGEXP_REPLACE(COALESCE(ct.transaction_amount_bcy, '0'), '[^0-9.]', '', 'g') AS NUMERIC)
    ELSE 0
  END AS debit_amount,
  CASE
    WHEN ct.debit_or_credit = 'credit'
    THEN CAST(REGEXP_REPLACE(COALESCE(ct.transaction_amount_bcy, '0'), '[^0-9.]', '', 'g') AS NUMERIC)
    ELSE 0
  END AS credit_amount,
  ct.location_id,
  b.location_name AS branch_name,
  ct.customer_id,
  c.customer_name,
  ct.vendor_id,
  v.vendor_name,
  ct.reference_number,
  ct.reference_no,
  ct.currency_code,
  ct.last_modified_time,
  ct.created_at,
  ct.updated_at,
  -- Transfer account name (for transfer_fund transactions)
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
  END AS transfer_account_name,
  -- Expense account name (for expense transactions)
  CASE
    WHEN ct.entity_type = 'expense' THEN (
      SELECT a3.account_name
      FROM accrual_transactions at
      JOIN accounts a3 ON at.account_id = a3.account_id
      WHERE at.entity_id = ct.entity_id
        AND at.entity_type = 'expense'
        AND at.account_id != ct.account_id
        AND a3.account_type = 'Expense'
      LIMIT 1
    )
    ELSE NULL
  END AS expense_account_name
FROM cash_transactions ct
JOIN accounts a ON ct.account_id = a.account_id
LEFT JOIN branch b ON ct.location_id = b.location_id
LEFT JOIN customers c ON ct.customer_id = c.customer_id
LEFT JOIN vendors v ON ct.vendor_id = v.vendor_id
WHERE a.account_type IN ('Cash', 'Bank')
ORDER BY
  CASE
    WHEN ct.transaction_date ~ '^\d{2} \w{3} \d{4}$'
    THEN TO_DATE(ct.transaction_date, 'DD Mon YYYY')
    ELSE NULL
  END DESC NULLS LAST,
  ct.id DESC;

-- Step 3: Recreate the materialized view with the new column
CREATE MATERIALIZED VIEW cash_transactions_materialized AS
SELECT
  ctv.*,
  CASE
    WHEN ctv.transaction_date ~ '^\d{2} \w{3} \d{4}$'
    THEN TO_DATE(ctv.transaction_date, 'DD Mon YYYY')
    ELSE NULL
  END AS transaction_date_parsed
FROM cash_transactions_view ctv;

-- Step 4: Create indexes on the materialized view
CREATE INDEX idx_cash_trans_mat_date ON cash_transactions_materialized(transaction_date_parsed DESC NULLS LAST);
CREATE INDEX idx_cash_trans_mat_location ON cash_transactions_materialized(location_id);
CREATE INDEX idx_cash_trans_mat_account ON cash_transactions_materialized(account_id);
CREATE INDEX idx_cash_trans_mat_entity_type ON cash_transactions_materialized(entity_type);
CREATE INDEX idx_cash_trans_mat_debit_credit ON cash_transactions_materialized(debit_or_credit);
CREATE INDEX idx_cash_trans_mat_trans_num ON cash_transactions_materialized(transaction_number);

-- Step 5: Drop and recreate the get_cash_transactions_paginated function to include expense_account_name
DROP FUNCTION IF EXISTS get_cash_transactions_paginated(date, date, text[], text[], text[], text, numeric, numeric, text, integer, integer);

CREATE OR REPLACE FUNCTION get_cash_transactions_paginated(
  start_date DATE DEFAULT NULL,
  end_date DATE DEFAULT NULL,
  location_ids TEXT[] DEFAULT NULL,
  account_ids TEXT[] DEFAULT NULL,
  entity_types TEXT[] DEFAULT NULL,
  debit_or_credit_filter TEXT DEFAULT NULL,
  min_amount NUMERIC DEFAULT NULL,
  max_amount NUMERIC DEFAULT NULL,
  search_query TEXT DEFAULT NULL,
  page_number INT DEFAULT 1,
  page_size INT DEFAULT 50
)
RETURNS TABLE(
  id INT,
  cash_transaction_id TEXT,
  transaction_date TEXT,
  transaction_number TEXT,
  entity_type TEXT,
  entity_id TEXT,
  account_id TEXT,
  account_name TEXT,
  account_type TEXT,
  account_code TEXT,
  transaction_amount NUMERIC,
  debit_or_credit TEXT,
  debit_amount NUMERIC,
  credit_amount NUMERIC,
  location_id TEXT,
  branch_name TEXT,
  customer_id TEXT,
  customer_name TEXT,
  vendor_id TEXT,
  vendor_name TEXT,
  reference_number TEXT,
  reference_no TEXT,
  currency_code TEXT,
  last_modified_time TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  transfer_account_name TEXT,
  expense_account_name TEXT,  -- NEW FIELD
  total_count BIGINT,
  total_pages INT,
  current_page INT
)
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_total_count BIGINT;
  v_total_pages INT;
  v_offset INT;
BEGIN
  v_offset := (page_number - 1) * page_size;

  SELECT COUNT(*) INTO v_total_count
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

  v_total_pages := CEIL(v_total_count::NUMERIC / page_size::NUMERIC)::INT;

  RETURN QUERY
  SELECT
    ct.id, ct.cash_transaction_id, ct.transaction_date, ct.transaction_number,
    ct.entity_type, ct.entity_id, ct.account_id, ct.account_name,
    ct.account_type, ct.account_code, ct.transaction_amount, ct.debit_or_credit,
    ct.debit_amount, ct.credit_amount, ct.location_id, ct.branch_name,
    ct.customer_id, ct.customer_name, ct.vendor_id, ct.vendor_name,
    ct.reference_number, ct.reference_no, ct.currency_code,
    ct.last_modified_time, ct.created_at, ct.updated_at,
    ct.transfer_account_name,
    ct.expense_account_name,  -- NEW FIELD
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
  LIMIT page_size OFFSET v_offset;
END;
$$;

-- Step 6: Refresh the materialized view
REFRESH MATERIALIZED VIEW cash_transactions_materialized;

-- Verification queries
-- SELECT COUNT(*) FROM cash_transactions_materialized WHERE entity_type = 'expense' AND expense_account_name IS NOT NULL;
-- SELECT transaction_number, entity_type, account_name, expense_account_name FROM cash_transactions_materialized WHERE entity_type = 'expense' LIMIT 10;
