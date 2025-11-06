-- Migration: Fix expense account name to include liability accounts and exclude VAT
-- Date: 2025-11-04
-- Description: Updates expense_account_name logic to show salary payable and other liability accounts,
--              and excludes VAT accounts from showing as the expense account

-- Step 1: Drop the materialized view
DROP MATERIALIZED VIEW IF EXISTS cash_transactions_materialized CASCADE;

-- Step 2: Drop and recreate the cash_transactions_view with updated expense_account_name logic
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
  -- Updated logic: Include Expense and Liability accounts, exclude VAT and Cash/Bank
  CASE
    WHEN ct.entity_type = 'expense' THEN (
      SELECT a3.account_name
      FROM accrual_transactions at
      JOIN accounts a3 ON at.account_id = a3.account_id
      WHERE at.entity_id = ct.entity_id
        AND at.entity_type = 'expense'
        AND at.debit_or_credit = 'debit'  -- Expenses are debited
        AND at.account_id != ct.account_id  -- Exclude the cash/bank account
        AND a3.account_type NOT IN ('Cash', 'Bank')  -- Exclude cash/bank accounts
        AND a3.account_name NOT ILIKE '%VAT%'  -- Exclude VAT accounts
        AND a3.account_name NOT ILIKE '%TAX%'  -- Exclude tax accounts
      ORDER BY
        -- Prioritize Expense type accounts, then Liability accounts
        CASE
          WHEN a3.account_type = 'Expense' THEN 1
          WHEN a3.account_type LIKE '%Liability%' THEN 2
          ELSE 3
        END,
        a3.account_name
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

-- Step 3: Recreate the materialized view
CREATE MATERIALIZED VIEW cash_transactions_materialized AS
SELECT
  ctv.*,
  CASE
    WHEN ctv.transaction_date ~ '^\d{2} \w{3} \d{4}$'
    THEN TO_DATE(ctv.transaction_date, 'DD Mon YYYY')
    ELSE NULL
  END AS transaction_date_parsed
FROM cash_transactions_view ctv;

-- Step 4: Recreate indexes on the materialized view
CREATE INDEX idx_cash_trans_mat_date ON cash_transactions_materialized(transaction_date_parsed DESC NULLS LAST);
CREATE INDEX idx_cash_trans_mat_location ON cash_transactions_materialized(location_id);
CREATE INDEX idx_cash_trans_mat_account ON cash_transactions_materialized(account_id);
CREATE INDEX idx_cash_trans_mat_entity_type ON cash_transactions_materialized(entity_type);
CREATE INDEX idx_cash_trans_mat_debit_credit ON cash_transactions_materialized(debit_or_credit);
CREATE INDEX idx_cash_trans_mat_trans_num ON cash_transactions_materialized(transaction_number);

-- Step 5: Refresh the materialized view
REFRESH MATERIALIZED VIEW cash_transactions_materialized;

-- Verification queries
-- SELECT COUNT(*) FROM cash_transactions_materialized WHERE entity_type = 'expense' AND expense_account_name IS NOT NULL;
-- SELECT transaction_number, entity_type, account_name, expense_account_name FROM cash_transactions_materialized WHERE entity_type = 'expense' ORDER BY transaction_number DESC LIMIT 20;
-- SELECT transaction_number, entity_type, account_name, expense_account_name FROM cash_transactions_materialized WHERE transaction_number = '91';
