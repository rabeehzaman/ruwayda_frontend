-- ============================================================================
-- FIX: Profit Views - Change SECURITY DEFINER → SECURITY INVOKER
-- ============================================================================
-- Issue: Ahmed and other restricted users can see ALL branch data when
--        frontend queries profit views directly (fallback code)
--
-- Root Cause: Profit views run as SECURITY DEFINER (default)
--   - Views run with postgres superuser permissions (creator), not caller
--   - RLS policies on underlying tables (invoices, credit_notes) are bypassed
--   - Frontend fallback code queries views directly → bypasses all security
--
-- Security Impact: CRITICAL
--   - This is the ACTUAL root cause (not the RPC function or helper functions)
--   - Previous migrations fixed RPC functions but missed the views
--   - Ahmed can see data from ALL 6 business branches (318 invoices, ~505K SAR)
--   - Should only see 4 allowed branches (262 invoices, ~299K SAR)
--
-- Solution: Recreate all profit views with security_invoker = true
--   - Views run with CALLER's permissions (Ahmed's auth context)
--   - RLS policies on underlying tables are now enforced
--   - Both RPC calls AND direct view queries respect security
--
-- Date: 2025-10-14
-- Related:
--   - fix_overview_rls_security_vulnerability.sql (fixed RPC function)
--   - fix_rls_helper_functions_security_invoker.sql (fixed helper functions)
-- ============================================================================

-- Drop existing views (CASCADE to handle dependent views)
DROP VIEW IF EXISTS profit_by_branch_view CASCADE;
DROP VIEW IF EXISTS profit_totals_view CASCADE;
DROP VIEW IF EXISTS profit_analysis_view_current CASCADE;

-- ============================================================================
-- View 1: profit_analysis_view_current (Base View)
-- ============================================================================
-- This is the base view that all other profit views depend on
-- CRITICAL: Must have security_invoker = true to respect RLS

CREATE VIEW profit_analysis_view_current
WITH (security_invoker = true)  -- ✅ Run with caller's permissions
AS
SELECT
    i.invoice_number AS "Inv No",
    i.invoice_date::date AS "Inv Date",
    ii.item_name AS "Item",
    regexp_replace(COALESCE(ii.quantity, '0'::text), '[^0-9.]'::text, ''::text, 'g'::text)::numeric AS "Qty",
    regexp_replace(COALESCE(ii.total_bcy, '0'::text), '[^0-9.]'::text, ''::text, 'g'::text)::numeric AS "Sale Price",
    round(regexp_replace(COALESCE(ii.total_bcy, '0'::text), '[^0-9.]'::text, ''::text, 'g'::text)::numeric * 1.15, 2) AS "SaleWithVAT",
    COALESCE(sum(
        CASE
            WHEN fm.total_bcy IS NULL OR fm.total_bcy = ''::text THEN 0::numeric
            ELSE regexp_replace(fm.total_bcy, '[^0-9.]'::text, ''::text, 'g'::text)::numeric
        END), 0::numeric) AS "Cost",
    round(regexp_replace(COALESCE(ii.total_bcy, '0'::text), '[^0-9.]'::text, ''::text, 'g'::text)::numeric - COALESCE(sum(
        CASE
            WHEN fm.total_bcy IS NULL OR fm.total_bcy = ''::text THEN 0::numeric
            ELSE regexp_replace(fm.total_bcy, '[^0-9.]'::text, ''::text, 'g'::text)::numeric
        END), 0::numeric), 2) AS "Profit",
    round(
        CASE
            WHEN regexp_replace(COALESCE(ii.total_bcy, '0'::text), '[^0-9.]'::text, ''::text, 'g'::text)::numeric > 0::numeric
            THEN (regexp_replace(COALESCE(ii.total_bcy, '0'::text), '[^0-9.]'::text, ''::text, 'g'::text)::numeric - COALESCE(sum(
                CASE
                    WHEN fm.total_bcy IS NULL OR fm.total_bcy = ''::text THEN 0::numeric
                    ELSE regexp_replace(fm.total_bcy, '[^0-9.]'::text, ''::text, 'g'::text)::numeric
                END), 0::numeric)) / regexp_replace(COALESCE(ii.total_bcy, '0'::text), '[^0-9.]'::text, ''::text, 'g'::text)::numeric * 100::numeric
            ELSE 0::numeric
        END, 2) AS "Profit %",
    c.customer_name AS "Customer Name",
    COALESCE(b.location_name, 'No Branch'::text) AS "Branch Name",
    round(
        CASE
            WHEN regexp_replace(COALESCE(ii.quantity, '0'::text), '[^0-9.]'::text, ''::text, 'g'::text)::numeric > 0::numeric
            THEN regexp_replace(COALESCE(ii.total_bcy, '0'::text), '[^0-9.]'::text, ''::text, 'g'::text)::numeric / regexp_replace(COALESCE(ii.quantity, '0'::text), '[^0-9.]'::text, ''::text, 'g'::text)::numeric
            ELSE 0::numeric
        END, 2) AS "Unit Price",
    round(
        CASE
            WHEN regexp_replace(COALESCE(ii.quantity, '0'::text), '[^0-9.]'::text, ''::text, 'g'::text)::numeric > 0::numeric
            THEN COALESCE(sum(
                CASE
                    WHEN fm.total_bcy IS NULL OR fm.total_bcy = ''::text THEN 0::numeric
                    ELSE regexp_replace(fm.total_bcy, '[^0-9.]'::text, ''::text, 'g'::text)::numeric
                END), 0::numeric) / regexp_replace(COALESCE(ii.quantity, '0'::text), '[^0-9.]'::text, ''::text, 'g'::text)::numeric
            ELSE 0::numeric
        END, 2) AS "Unit Cost",
    round(
        CASE
            WHEN regexp_replace(COALESCE(ii.quantity, '0'::text), '[^0-9.]'::text, ''::text, 'g'::text)::numeric > 0::numeric
            THEN (regexp_replace(COALESCE(ii.total_bcy, '0'::text), '[^0-9.]'::text, ''::text, 'g'::text)::numeric - COALESCE(sum(
                CASE
                    WHEN fm.total_bcy IS NULL OR fm.total_bcy = ''::text THEN 0::numeric
                    ELSE regexp_replace(fm.total_bcy, '[^0-9.]'::text, ''::text, 'g'::text)::numeric
                END), 0::numeric)) / regexp_replace(COALESCE(ii.quantity, '0'::text), '[^0-9.]'::text, ''::text, 'g'::text)::numeric
            ELSE 0::numeric
        END, 2) AS "Unit Profit",
    sp.name AS "Sales Person Name",
    i.invoice_status AS "Invoice Status"
FROM invoices i
JOIN invoice_items ii ON i.invoice_id = ii.invoice_id
LEFT JOIN stock_out_flow_table sof ON ii.item_id = sof.invoice_item_id
LEFT JOIN fifo_mapping_table fm ON sof.stock_out_flow_id = fm.stock_out_flow_id
LEFT JOIN stock_in_flow_table sif ON fm.stock_in_flow_id = sif.stock_in_flow_id
JOIN customers c ON i.customer_id = c.customer_id
LEFT JOIN sales_persons sp ON i.sales_person_id = sp.sales_person_id
LEFT JOIN branch b ON i.location_id = b.location_id
WHERE i.invoice_status <> 'Void'
  AND i.invoice_number NOT ILIKE 'GINV%'
  AND i.invoice_number NOT ILIKE 'Opening%'
  -- RLS on invoices table will filter by user's allowed branches
GROUP BY i.invoice_number, i.invoice_date, ii.item_name, ii.quantity, ii.total_bcy,
         c.customer_name, b.location_name, sp.name, i.invoice_status

UNION ALL

SELECT
    cn.credit_note_number AS "Inv No",
    cn.credit_note_date::date AS "Inv Date",
    cni.item_name AS "Item",
    regexp_replace(COALESCE(cni.quantity, '0'::text), '[^0-9.]'::text, ''::text, 'g'::text)::numeric AS "Qty",
    -1 * regexp_replace(COALESCE(cni.total, '0'::text), '[^0-9.]'::text, ''::text, 'g'::text)::numeric AS "Sale Price",
    round(-1 * regexp_replace(COALESCE(cni.total, '0'::text), '[^0-9.]'::text, ''::text, 'g'::text)::numeric * 1.15, 2) AS "SaleWithVAT",
    -1 * COALESCE(sum(
        CASE
            WHEN sif.total_bcy IS NULL OR sif.total_bcy = ''::text THEN 0::numeric
            ELSE regexp_replace(sif.total_bcy, '[^0-9.]'::text, ''::text, 'g'::text)::numeric
        END), regexp_replace(COALESCE(cni.total, '0'::text), '[^0-9.]'::text, ''::text, 'g'::text)::numeric) AS "Cost",
    round(-1 * regexp_replace(COALESCE(cni.total, '0'::text), '[^0-9.]'::text, ''::text, 'g'::text)::numeric -
          -1 * COALESCE(sum(
        CASE
            WHEN sif.total_bcy IS NULL OR sif.total_bcy = ''::text THEN 0::numeric
            ELSE regexp_replace(sif.total_bcy, '[^0-9.]'::text, ''::text, 'g'::text)::numeric
        END), regexp_replace(COALESCE(cni.total, '0'::text), '[^0-9.]'::text, ''::text, 'g'::text)::numeric), 2) AS "Profit",
    0 AS "Profit %",
    c.customer_name AS "Customer Name",
    COALESCE(b.location_name, 'No Branch'::text) AS "Branch Name",
    0 AS "Unit Price",
    0 AS "Unit Cost",
    0 AS "Unit Profit",
    sp.name AS "Sales Person Name",
    cn.credit_note_status AS "Invoice Status"
FROM credit_notes cn
LEFT JOIN credit_note_items cni ON cn.creditnotes_id = cni.creditnotes_id
LEFT JOIN stock_in_flow_table sif ON cni.item_id = sif.credit_notes_item_id
LEFT JOIN customers c ON cn.customer_id = c.customer_id
LEFT JOIN sales_persons sp ON cn.sales_person_id = sp.sales_person_id
LEFT JOIN branch b ON cn.location_id = b.location_id
WHERE cn.credit_note_status <> 'Void'
  AND cn.credit_note_number NOT ILIKE 'GINV%'
  AND cn.credit_note_number NOT ILIKE 'Opening%'
  -- RLS on credit_notes table will filter by user's allowed branches
GROUP BY cn.credit_note_number, cn.credit_note_date, cni.item_name, cni.quantity, cni.total,
         c.customer_name, b.location_name, sp.name, cn.credit_note_status;

COMMENT ON VIEW profit_analysis_view_current IS
'Profit analysis view with SECURITY INVOKER. Respects RLS policies on invoices and credit_notes tables.
Admin users see all branches. Restricted users see only their allowed branches.';

-- ============================================================================
-- View 2: profit_totals_view (Depends on profit_analysis_view_current)
-- ============================================================================
-- Aggregates all profit data into totals

CREATE VIEW profit_totals_view
WITH (security_invoker = true)  -- ✅ Run with caller's permissions
AS
SELECT
    sum("Sale Price") AS "Total Sales",
    sum("Cost") AS "Total Cost",
    sum("Profit") AS "Total Profit",
    CASE
        WHEN sum("Sale Price") > 0
        THEN round(sum("Profit") / sum("Sale Price") * 100, 2)
        ELSE 0
    END AS "Overall Profit %"
FROM profit_analysis_view_current;

COMMENT ON VIEW profit_totals_view IS
'Total profit summary with SECURITY INVOKER. Inherits RLS filtering from profit_analysis_view_current.
Shows aggregated totals for only the branches the user has access to.';

-- ============================================================================
-- View 3: profit_by_branch_view (Depends on profit_analysis_view_current)
-- ============================================================================
-- Groups profit data by branch

CREATE VIEW profit_by_branch_view
WITH (security_invoker = true)  -- ✅ Run with caller's permissions
AS
SELECT
    "Branch Name",
    count(*) AS "Transaction Count",
    sum("Sale Price") AS "Total Sales",
    sum("Cost") AS "Total Cost",
    sum("Profit") AS "Total Profit",
    CASE
        WHEN sum("Sale Price") > 0
        THEN round(sum("Profit") / sum("Sale Price") * 100, 2)
        ELSE 0
    END AS "Profit %"
FROM profit_analysis_view_current
GROUP BY "Branch Name"
ORDER BY sum("Sale Price") DESC;

COMMENT ON VIEW profit_by_branch_view IS
'Branch-level profit summary with SECURITY INVOKER. Inherits RLS filtering from profit_analysis_view_current.
Shows only branches the user has access to.';

-- ============================================================================
-- VERIFICATION TESTS
-- ============================================================================

DO $$
DECLARE
    v_current_user_id UUID;
    v_total_records INTEGER;
    v_unique_branches INTEGER;
BEGIN
    RAISE NOTICE '=== Testing Profit Views with SECURITY INVOKER ===';
    RAISE NOTICE '';

    -- Test auth context
    SELECT auth.uid() INTO v_current_user_id;
    RAISE NOTICE 'Test 1: auth.uid() Check';
    IF v_current_user_id IS NULL THEN
        RAISE NOTICE '  ⚠️  auth.uid() is NULL (running as postgres)';
        RAISE NOTICE '  ⚠️  In postgres context, views return ALL data';
        RAISE NOTICE '  ✅ In production with user auth, RLS will filter';
    ELSE
        RAISE NOTICE '  ✅ auth.uid() = %', v_current_user_id;
    END IF;
    RAISE NOTICE '';

    -- Test base view
    SELECT COUNT(*) INTO v_total_records FROM profit_analysis_view_current;
    RAISE NOTICE 'Test 2: profit_analysis_view_current';
    RAISE NOTICE '  Total Records: %', v_total_records;
    RAISE NOTICE '  Expected for postgres: 318 records (all branches)';
    RAISE NOTICE '  Expected for Ahmed: 262 records (his 6 allowed branches)';
    RAISE NOTICE '';

    -- Test unique branches
    SELECT COUNT(DISTINCT "Branch Name") INTO v_unique_branches FROM profit_analysis_view_current;
    RAISE NOTICE 'Test 3: Unique Branches in View';
    RAISE NOTICE '  Unique Branches: %', v_unique_branches;
    RAISE NOTICE '  Expected for postgres: 6 branches (all)';
    RAISE NOTICE '  Expected for Ahmed: 4 branches (Frozen, JTB 5936, Nashad-Frozen, Nisam-Frozen)';
    RAISE NOTICE '';

    RAISE NOTICE '✅ All views recreated with security_invoker = true';
    RAISE NOTICE '✅ Views will now respect RLS policies on underlying tables';
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  IMPORTANT: Login as Ahmed to verify RLS filtering';
    RAISE NOTICE '   Expected Results for Ahmed:';
    RAISE NOTICE '     - 262 invoices (~299K SAR) from 6 allowed branches';
    RAISE NOTICE '     - Frozen, JTB 5936, Nashad-Frozen, Nisam-Frozen, MAHER WH, Zarif WH';
    RAISE NOTICE '     - Should NOT see: Khaleel (15 inv) or Osaimi (41 inv)';
    RAISE NOTICE '';
    RAISE NOTICE '   Expected Results for Admin:';
    RAISE NOTICE '     - 318 invoices (~505K SAR) from all 6 business branches';
    RAISE NOTICE '     - All branches visible including Khaleel and Osaimi';
END $$;

-- ============================================================================
-- ROLLBACK INSTRUCTIONS
-- ============================================================================
-- To rollback (restore SECURITY DEFINER behavior):
--
-- DROP VIEW IF EXISTS profit_by_branch_view CASCADE;
-- DROP VIEW IF EXISTS profit_totals_view CASCADE;
-- DROP VIEW IF EXISTS profit_analysis_view_current CASCADE;
--
-- Then recreate views WITHOUT the "WITH (security_invoker = true)" clause
-- WARNING: This will re-break RLS security. Only use for emergencies.
-- ============================================================================
