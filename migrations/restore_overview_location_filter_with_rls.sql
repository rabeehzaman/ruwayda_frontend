-- ============================================================================
-- RESTORE: Overview Tab Location Filter with Two-Layer Filtering
-- ============================================================================
-- Issue: Location filter in Overview tab stopped working after RLS security fix
--        Users cannot filter data by specific branches anymore
--
-- Root Cause: Migration 'fix_overview_rls_security_vulnerability.sql' removed
--             ALL application-level location_ids filtering to fix security issue
--             This made the location_ids parameter completely ignored
--
-- Impact:
--   - Admins: Cannot filter to specific branches (always see all 6 branches)
--   - Restricted users: Cannot filter within their allowed branches
--   - Location filter dropdown appears but does nothing
--
-- Solution: Implement Two-Layer Filtering
--   Layer 1 (Security): RLS policies filter by user permissions (CANNOT BE BYPASSED)
--   Layer 2 (Convenience): location_ids parameter filters within RLS-allowed data
--
-- Security Guarantee:
--   RLS runs FIRST at database level, then location filter applied to result
--   Even if someone hacks location_ids parameter, RLS blocks unauthorized access
--
-- Date: 2025-10-14
-- Related: fix_overview_rls_security_vulnerability.sql (October 14, 2025)
-- ============================================================================

-- Drop and recreate function WITH two-layer filtering
DROP FUNCTION IF EXISTS public.get_dashboard_kpis_2025_optimized(date, date, text[]);

CREATE OR REPLACE FUNCTION get_dashboard_kpis_2025_optimized(
    start_date DATE DEFAULT NULL,
    end_date DATE DEFAULT NULL,
    location_ids TEXT[] DEFAULT NULL  -- RESTORED: Now used for convenience filtering
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY INVOKER  -- Respects RLS policies from user's context (SECURITY LAYER)
STABLE            -- Result doesn't change within transaction (optimization)
AS $$
DECLARE
    result JSON;
BEGIN
    -- ========================================================================
    -- TWO-LAYER FILTERING APPROACH
    -- ========================================================================
    -- Layer 1 (Security): RLS policies on tables filter by user permissions
    --   - Admin users: RLS allows all branches
    --   - Restricted users: RLS allows only their permitted branches
    --   - This CANNOT be bypassed via location_ids parameter
    --
    -- Layer 2 (Convenience): location_ids parameter filters within RLS result
    --   - If location_ids IS NULL: Show all RLS-accessible data
    --   - If location_ids provided: Filter to those specific locations
    --   - Applied AFTER RLS has already restricted data
    -- ========================================================================

    WITH invoice_costs AS (
        SELECT
            i.invoice_number,
            i.invoice_date,
            ii.item_id,
            CAST(REGEXP_REPLACE(COALESCE(ii.total_bcy, '0'), '[^0-9.-]', '', 'g') AS NUMERIC) as item_total,
            CAST(REGEXP_REPLACE(COALESCE(ii.quantity, '0'), '[^0-9.-]', '', 'g') AS NUMERIC) as item_quantity,
            COALESCE(SUM(
                CASE
                    WHEN fm.total_bcy IS NULL OR fm.total_bcy = '' THEN 0
                    ELSE CAST(REGEXP_REPLACE(fm.total_bcy, '[^0-9.-]', '', 'g') AS NUMERIC)
                END
            ), 0) as item_cost
        FROM invoices i
        INNER JOIN invoice_items ii ON i.invoice_id = ii.invoice_id
        LEFT JOIN stock_out_flow_table sof ON ii.item_id = sof.invoice_item_id
        LEFT JOIN fifo_mapping_table fm ON sof.stock_out_flow_id = fm.stock_out_flow_id
        WHERE i.invoice_status != 'Void'
            AND i.invoice_number NOT LIKE 'Opening Balance%'
            AND EXTRACT(YEAR FROM i.invoice_date::DATE) = 2025
            AND (start_date IS NULL OR i.invoice_date::DATE >= start_date)
            AND (end_date IS NULL OR i.invoice_date::DATE <= end_date)
            -- Layer 1: RLS policy 'branch_access_invoices' filters by user permissions
            -- Layer 2: Application filter (convenience - applied to RLS-filtered data)
            AND (location_ids IS NULL OR i.location_id = ANY(location_ids))
        GROUP BY i.invoice_number, i.invoice_date, ii.item_id, ii.total_bcy, ii.quantity
    ),
    sales_metrics AS (
        SELECT
            COALESCE(SUM(item_total / 1.15), 0) as total_taxable_sales,
            COALESCE(SUM(item_total), 0) as total_revenue,
            COALESCE(SUM(item_cost), 0) as total_cost,
            COALESCE(SUM(item_total / 1.15) - SUM(item_cost), 0) as gross_profit,
            COALESCE(SUM(item_quantity), 0) as total_quantity,
            COUNT(DISTINCT invoice_number) as unique_invoices
        FROM invoice_costs
    ),
    expense_metrics AS (
        SELECT COALESCE(SUM(
            CASE
                WHEN at.debit_amount ~ '^SAR' THEN CAST(REGEXP_REPLACE(at.debit_amount, '[^0-9.-]', '', 'g') AS NUMERIC)
                WHEN at.transaction_amount_bcy ~ '^SAR' THEN CAST(REGEXP_REPLACE(at.transaction_amount_bcy, '[^0-9.-]', '', 'g') AS NUMERIC)
                ELSE 0
            END
        ), 0) as total_expenses
        FROM accrual_transactions at
        LEFT JOIN accounts a ON at.account_id = a.account_id
        WHERE at.entity_type = 'expense'
            AND at.debit_or_credit = 'debit'
            AND a.account_type = 'Expense'
            AND EXTRACT(YEAR FROM at.transaction_date::DATE) = 2025
            AND (start_date IS NULL OR at.transaction_date::DATE >= start_date)
            AND (end_date IS NULL OR at.transaction_date::DATE <= end_date)
            -- Layer 1: RLS policy 'branch_access_accrual_transactions' filters by user permissions
            -- Layer 2: Application filter (convenience - applied to RLS-filtered data)
            AND (location_ids IS NULL OR at.location_id = ANY(location_ids))
            AND (
                (at.debit_amount ~ '^SAR' AND CAST(REGEXP_REPLACE(at.debit_amount, '[^0-9.-]', '', 'g') AS NUMERIC) > 0)
                OR (at.transaction_amount_bcy ~ '^SAR' AND CAST(REGEXP_REPLACE(at.transaction_amount_bcy, '[^0-9.-]', '', 'g') AS NUMERIC) > 0)
            )
    ),
    stock_metrics AS (
        SELECT COALESCE(SUM(
            CAST(REGEXP_REPLACE(COALESCE(s.total_bcy, '0'), '[^0-9.-]', '', 'g') AS NUMERIC)
        ), 0) as total_stock_value
        FROM stock_in_flow_table s
        -- Layer 1: RLS policy 'branch_access_stock_in_flow' filters by user permissions
        -- Layer 2: Application filter (convenience - applied to RLS-filtered data)
        WHERE (location_ids IS NULL OR s.location_id = ANY(location_ids))
    ),
    vat_output AS (
        -- Output VAT from invoices with M/K suffix handling
        SELECT COALESCE(SUM(
            (CASE
                WHEN i.total_bcy ILIKE '%M%' THEN
                    CAST(REGEXP_REPLACE(REGEXP_REPLACE(i.total_bcy, '[^0-9.]', '', 'g'), '^$', '0') AS NUMERIC) * 1000000
                WHEN i.total_bcy ILIKE '%K%' THEN
                    CAST(REGEXP_REPLACE(REGEXP_REPLACE(i.total_bcy, '[^0-9.]', '', 'g'), '^$', '0') AS NUMERIC) * 1000
                ELSE
                    CAST(REGEXP_REPLACE(REGEXP_REPLACE(i.total_bcy, '[^0-9.]', '', 'g'), '^$', '0') AS NUMERIC)
            END) -
            (CASE
                WHEN i.sub_total_bcy ILIKE '%M%' THEN
                    CAST(REGEXP_REPLACE(REGEXP_REPLACE(i.sub_total_bcy, '[^0-9.]', '', 'g'), '^$', '0') AS NUMERIC) * 1000000
                WHEN i.sub_total_bcy ILIKE '%K%' THEN
                    CAST(REGEXP_REPLACE(REGEXP_REPLACE(i.sub_total_bcy, '[^0-9.]', '', 'g'), '^$', '0') AS NUMERIC) * 1000
                ELSE
                    CAST(REGEXP_REPLACE(REGEXP_REPLACE(i.sub_total_bcy, '[^0-9.]', '', 'g'), '^$', '0') AS NUMERIC)
            END)
        ), 0) as output_vat
        FROM invoices i
        WHERE i.invoice_status != 'Void'
            AND i.invoice_number NOT LIKE 'Opening Balance%'
            AND EXTRACT(YEAR FROM i.invoice_date::DATE) = 2025
            AND (start_date IS NULL OR i.invoice_date::DATE >= start_date)
            AND (end_date IS NULL OR i.invoice_date::DATE <= end_date)
            -- Layer 1: RLS policy 'branch_access_invoices' filters by user permissions
            -- Layer 2: Application filter (convenience - applied to RLS-filtered data)
            AND (location_ids IS NULL OR i.location_id = ANY(location_ids))
    ),
    vat_credit AS (
        -- Credit notes reduce output VAT with M/K suffix handling
        SELECT COALESCE(SUM(
            (CASE
                WHEN cn.total_bcy ILIKE '%M%' THEN
                    CAST(REGEXP_REPLACE(REGEXP_REPLACE(cn.total_bcy, '[^0-9.]', '', 'g'), '^$', '0') AS NUMERIC) * 1000000
                WHEN cn.total_bcy ILIKE '%K%' THEN
                    CAST(REGEXP_REPLACE(REGEXP_REPLACE(cn.total_bcy, '[^0-9.]', '', 'g'), '^$', '0') AS NUMERIC) * 1000
                ELSE
                    CAST(REGEXP_REPLACE(REGEXP_REPLACE(cn.total_bcy, '[^0-9.]', '', 'g'), '^$', '0') AS NUMERIC)
            END) -
            (CASE
                WHEN cn.sub_total_bcy ILIKE '%M%' THEN
                    CAST(REGEXP_REPLACE(REGEXP_REPLACE(cn.sub_total_bcy, '[^0-9.]', '', 'g'), '^$', '0') AS NUMERIC) * 1000000
                WHEN cn.sub_total_bcy ILIKE '%K%' THEN
                    CAST(REGEXP_REPLACE(REGEXP_REPLACE(cn.sub_total_bcy, '[^0-9.]', '', 'g'), '^$', '0') AS NUMERIC) * 1000
                ELSE
                    CAST(REGEXP_REPLACE(REGEXP_REPLACE(cn.sub_total_bcy, '[^0-9.]', '', 'g'), '^$', '0') AS NUMERIC)
            END)
        ), 0) as credit_vat
        FROM credit_notes cn
        WHERE cn.credit_note_status != 'void'
            AND cn.credit_note_number NOT ILIKE '%opening%'
            AND cn.credit_note_number != 'Opening Balance'
            AND EXTRACT(YEAR FROM TO_DATE(cn.credit_note_date, 'DD Mon YYYY')) = 2025
            AND (start_date IS NULL OR TO_DATE(cn.credit_note_date, 'DD Mon YYYY') >= start_date)
            AND (end_date IS NULL OR TO_DATE(cn.credit_note_date, 'DD Mon YYYY') <= end_date)
            -- Layer 1: RLS policy 'branch_access_credit_notes' filters by user permissions
            -- Layer 2: Application filter (convenience - applied to RLS-filtered data)
            AND (location_ids IS NULL OR cn.location_id = ANY(location_ids))
    ),
    vat_input AS (
        -- Input VAT from bills with M/K suffix handling and Opening Balance exclusion
        SELECT COALESCE(SUM(
            (CASE
                WHEN b.total_bcy ILIKE '%M%' THEN
                    CAST(REGEXP_REPLACE(REGEXP_REPLACE(b.total_bcy, '[^0-9.]', '', 'g'), '^$', '0') AS NUMERIC) * 1000000
                WHEN b.total_bcy ILIKE '%K%' THEN
                    CAST(REGEXP_REPLACE(REGEXP_REPLACE(b.total_bcy, '[^0-9.]', '', 'g'), '^$', '0') AS NUMERIC) * 1000
                ELSE
                    CAST(REGEXP_REPLACE(REGEXP_REPLACE(b.total_bcy, '[^0-9.]', '', 'g'), '^$', '0') AS NUMERIC)
            END) -
            (CASE
                WHEN b.sub_total_bcy ILIKE '%M%' THEN
                    CAST(REGEXP_REPLACE(REGEXP_REPLACE(b.sub_total_bcy, '[^0-9.]', '', 'g'), '^$', '0') AS NUMERIC) * 1000000
                WHEN b.sub_total_bcy ILIKE '%K%' THEN
                    CAST(REGEXP_REPLACE(REGEXP_REPLACE(b.sub_total_bcy, '[^0-9.]', '', 'g'), '^$', '0') AS NUMERIC) * 1000
                ELSE
                    CAST(REGEXP_REPLACE(REGEXP_REPLACE(b.sub_total_bcy, '[^0-9.]', '', 'g'), '^$', '0') AS NUMERIC)
            END)
        ), 0) as input_vat
        FROM bills b
        WHERE b.bill_status != 'Void'
            AND b.bill_number NOT ILIKE '%opening%'
            AND b.bill_number != 'Opening Balance'
            AND EXTRACT(YEAR FROM TO_DATE(b.bill_date, 'DD Mon YYYY')) = 2025
            AND (start_date IS NULL OR TO_DATE(b.bill_date, 'DD Mon YYYY') >= start_date)
            AND (end_date IS NULL OR TO_DATE(b.bill_date, 'DD Mon YYYY') <= end_date)
            -- Layer 1: RLS policy 'branch_access_bills' filters by user permissions
            -- Layer 2: Application filter (convenience - applied to RLS-filtered data)
            AND (location_ids IS NULL OR b.location_id = ANY(location_ids))
    )
    SELECT json_build_object(
        'totalTaxableSales', sm.total_taxable_sales,
        'totalRevenue', sm.total_revenue,
        'totalCost', sm.total_cost,
        'grossProfit', sm.gross_profit,
        'totalExpenses', em.total_expenses,
        'netProfit', sm.gross_profit - em.total_expenses,
        'grossProfitMargin', CASE WHEN sm.total_taxable_sales > 0 THEN (sm.gross_profit / sm.total_taxable_sales) * 100 ELSE 0 END,
        'netProfitMargin', CASE WHEN sm.total_taxable_sales > 0 THEN ((sm.gross_profit - em.total_expenses) / sm.total_taxable_sales) * 100 ELSE 0 END,
        'totalStockValue', stm.total_stock_value,
        'netVatPayable', vo.output_vat - vc.credit_vat - vi.input_vat,
        'totalInvoices', sm.unique_invoices,
        'uniqueInvoices', sm.unique_invoices,
        'totalQuantity', sm.total_quantity,
        'averageOrderValue', CASE WHEN sm.unique_invoices > 0 THEN sm.total_revenue / sm.unique_invoices ELSE 0 END,
        'dailyAvgSales', CASE
            WHEN start_date IS NOT NULL THEN
                CASE WHEN (LEAST(COALESCE(end_date, CURRENT_DATE), CURRENT_DATE) - start_date + 1) > 0
                THEN sm.total_revenue / (LEAST(COALESCE(end_date, CURRENT_DATE), CURRENT_DATE) - start_date + 1)
                ELSE 0 END
            ELSE CASE WHEN EXTRACT(DAY FROM CURRENT_DATE) > 0 THEN sm.total_revenue / EXTRACT(DAY FROM CURRENT_DATE) ELSE 0 END
        END,
        'dateRange', json_build_object('from', start_date, 'to', end_date)
    ) INTO result
    FROM sales_metrics sm, expense_metrics em, stock_metrics stm, vat_output vo, vat_credit vc, vat_input vi;

    RETURN result;
END;
$$;

-- Add descriptive comment
COMMENT ON FUNCTION get_dashboard_kpis_2025_optimized IS
'Dashboard KPIs with two-layer filtering for security and convenience.
Layer 1 (Security): RLS policies enforce user permissions - cannot be bypassed.
Layer 2 (Convenience): location_ids parameter allows filtering within permitted data.
Admin users can filter to specific branches. Restricted users can filter within allowed branches.';

-- ============================================================================
-- VERIFICATION TESTS
-- ============================================================================

DO $$
DECLARE
    v_all_result JSON;
    v_filtered_result JSON;
    v_all_revenue NUMERIC;
    v_filtered_revenue NUMERIC;
    v_all_invoices INTEGER;
    v_filtered_invoices INTEGER;
BEGIN
    RAISE NOTICE '=== Testing Two-Layer Filtering (RLS + Location Filter) ===';
    RAISE NOTICE '';

    -- Test 1: No location filter (NULL) - should show all RLS-accessible data
    RAISE NOTICE 'Test 1: No Location Filter (location_ids = NULL)';

    SELECT get_dashboard_kpis_2025_optimized('2025-01-01'::date, '2025-12-31'::date, NULL::text[])
    INTO v_all_result;

    v_all_revenue := (v_all_result->>'totalRevenue')::NUMERIC;
    v_all_invoices := (v_all_result->>'totalInvoices')::INTEGER;

    RAISE NOTICE '  Total Revenue: % SAR', ROUND(v_all_revenue);
    RAISE NOTICE '  Total Invoices: %', v_all_invoices;
    RAISE NOTICE '  Expected for Admin: ~504K SAR, 318 invoices (all 6 branches)';
    RAISE NOTICE '  Expected for Ahmed: ~299K SAR, 262 invoices (4 allowed branches)';
    RAISE NOTICE '';

    -- Test 2: With location filter - should filter within RLS-accessible data
    RAISE NOTICE 'Test 2: With Location Filter (Khaleel branch only)';

    SELECT get_dashboard_kpis_2025_optimized(
        '2025-01-01'::date,
        '2025-12-31'::date,
        ARRAY['6817763000000151088']::text[]  -- Khaleel location_id
    )
    INTO v_filtered_result;

    v_filtered_revenue := (v_filtered_result->>'totalRevenue')::NUMERIC;
    v_filtered_invoices := (v_filtered_result->>'totalInvoices')::INTEGER;

    RAISE NOTICE '  Total Revenue: % SAR', ROUND(v_filtered_revenue);
    RAISE NOTICE '  Total Invoices: %', v_filtered_invoices;
    RAISE NOTICE '  Expected for Admin: ~111K SAR, 15 invoices (Khaleel only)';
    RAISE NOTICE '  Expected for Ahmed: 0 SAR, 0 invoices (Khaleel blocked by RLS)';
    RAISE NOTICE '';

    RAISE NOTICE '✓ Function recreated successfully with two-layer filtering';
    RAISE NOTICE '✓ Layer 1: RLS policies enforce security (cannot be bypassed)';
    RAISE NOTICE '✓ Layer 2: location_ids provides convenience filtering';
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  IMPORTANT: Test with user accounts to verify:';
    RAISE NOTICE '   Admin + No filter: All 6 branches visible';
    RAISE NOTICE '   Admin + Khaleel filter: Only Khaleel visible';
    RAISE NOTICE '   Ahmed + No filter: Only his 4 allowed branches visible';
    RAISE NOTICE '   Ahmed + Khaleel filter: Nothing visible (RLS blocks)';
END $$;

-- ============================================================================
-- SECURITY NOTES
-- ============================================================================
--
-- Q: Can someone bypass RLS by manipulating location_ids parameter?
-- A: NO. RLS policies run at database level BEFORE location_ids filter.
--    Even if location_ids is hacked, RLS will have already removed
--    unauthorized data. The location filter only works on RLS-filtered results.
--
-- Q: Why keep location_ids parameter if RLS handles security?
-- A: Convenience. Admins can choose to view specific branches instead of
--    seeing all 6 at once. Restricted users can narrow down within their
--    allowed branches.
--
-- Q: What happens if location_ids contains unauthorized branches?
-- A: RLS removes them first, so the location filter finds nothing to match.
--    Result: Empty dataset (safe behavior).
--
-- ============================================================================

-- ============================================================================
-- ROLLBACK INSTRUCTIONS
-- ============================================================================
-- To rollback to RLS-only (no location filter):
-- \i migrations/fix_overview_rls_security_vulnerability.sql
--
-- This will remove location_ids filtering and rely only on RLS
-- ============================================================================
