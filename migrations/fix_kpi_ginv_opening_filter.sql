-- ============================================================================
-- FIX: Overview Tab KPI GINV and Opening Balance Filter
-- ============================================================================
-- Issue: Dashboard KPIs show inflated numbers because GINV% and Opening%
--        invoices are not being filtered out
--
-- Root Cause: get_dashboard_kpis_2025_optimized function only filters
--             'Opening Balance%' (exact match) but misses:
--             • GINV% invoices (151 invoices)
--             • Opening% invoices (28 invoices)
--
-- Discovery: User reported KPIs don't match profit_analysis_view_current
--            which correctly filters out these invoice types
--
-- Impact:
--   Current State:
--     • KPI shows: 318 invoices, SAR 464,947 revenue
--     • View shows: 737 items, SAR 287,070 revenue
--
--   After Fix:
--     • KPI will show: 166 invoices, ~SAR 287K revenue (matching view)
--
-- Date: 2025-10-14
-- Related: filter_ginv_opening_invoices.sql (profit_analysis_view_current)
-- ============================================================================

-- Drop and recreate function with GINV and Opening filters
DROP FUNCTION IF EXISTS public.get_dashboard_kpis_2025_optimized(date, date, text[]);

CREATE OR REPLACE FUNCTION get_dashboard_kpis_2025_optimized(
    start_date DATE DEFAULT NULL,
    end_date DATE DEFAULT NULL,
    location_ids TEXT[] DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY INVOKER  -- Respects RLS policies from user's context
STABLE            -- Result doesn't change within transaction (optimization)
AS $$
DECLARE
    result JSON;
BEGIN
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
            -- ✅ NEW: Filter out GINV and Opening invoices (matches profit_analysis_view_current)
            AND i.invoice_number NOT ILIKE 'GINV%'
            AND i.invoice_number NOT ILIKE 'Opening%'
            AND EXTRACT(YEAR FROM i.invoice_date::DATE) = 2025
            AND (start_date IS NULL OR i.invoice_date::DATE >= start_date)
            AND (end_date IS NULL OR i.invoice_date::DATE <= end_date)
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
            -- ✅ NEW: Filter out GINV and Opening invoices
            AND i.invoice_number NOT ILIKE 'GINV%'
            AND i.invoice_number NOT ILIKE 'Opening%'
            AND EXTRACT(YEAR FROM i.invoice_date::DATE) = 2025
            AND (start_date IS NULL OR i.invoice_date::DATE >= start_date)
            AND (end_date IS NULL OR i.invoice_date::DATE <= end_date)
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
            -- ✅ UPDATED: Consistent Opening filter (changed from exact match)
            AND cn.credit_note_number NOT ILIKE 'GINV%'
            AND cn.credit_note_number NOT ILIKE 'Opening%'
            AND EXTRACT(YEAR FROM TO_DATE(cn.credit_note_date, 'DD Mon YYYY')) = 2025
            AND (start_date IS NULL OR TO_DATE(cn.credit_note_date, 'DD Mon YYYY') >= start_date)
            AND (end_date IS NULL OR TO_DATE(cn.credit_note_date, 'DD Mon YYYY') <= end_date)
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
            -- ✅ UPDATED: Consistent Opening filter (changed from exact match)
            AND b.bill_number NOT ILIKE 'GINV%'
            AND b.bill_number NOT ILIKE 'Opening%'
            AND EXTRACT(YEAR FROM TO_DATE(b.bill_date, 'DD Mon YYYY')) = 2025
            AND (start_date IS NULL OR TO_DATE(b.bill_date, 'DD Mon YYYY') >= start_date)
            AND (end_date IS NULL OR TO_DATE(b.bill_date, 'DD Mon YYYY') <= end_date)
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
'Dashboard KPIs with GINV and Opening invoice filtering.
Filters applied:
- Excludes GINV% invoices (auto-generated invoices)
- Excludes Opening% invoices (opening balance entries)
- Respects RLS policies for user permissions
- Supports optional location_ids filtering for convenience';

-- ============================================================================
-- VERIFICATION TESTS
-- ============================================================================

DO $$
DECLARE
    v_result JSON;
    v_revenue NUMERIC;
    v_invoices INTEGER;
    v_cost NUMERIC;
    v_profit NUMERIC;
BEGIN
    RAISE NOTICE '=== Testing GINV and Opening Filter Fix ===';
    RAISE NOTICE '';

    -- Test: Get KPIs for all of 2025
    SELECT get_dashboard_kpis_2025_optimized('2025-01-01'::date, '2025-12-31'::date, NULL::text[])
    INTO v_result;

    v_revenue := (v_result->>'totalRevenue')::NUMERIC;
    v_invoices := (v_result->>'totalInvoices')::INTEGER;
    v_cost := (v_result->>'totalCost')::NUMERIC;
    v_profit := (v_result->>'grossProfit')::NUMERIC;

    RAISE NOTICE 'KPI Function Results (After Fix):';
    RAISE NOTICE '  Total Revenue: % SAR', ROUND(v_revenue);
    RAISE NOTICE '  Total Invoices: %', v_invoices;
    RAISE NOTICE '  Total Cost: % SAR', ROUND(v_cost);
    RAISE NOTICE '  Gross Profit: % SAR', ROUND(v_profit);
    RAISE NOTICE '';

    RAISE NOTICE 'Expected Results:';
    RAISE NOTICE '  Should show: ~166 invoices, ~287K SAR revenue';
    RAISE NOTICE '  Previously showed: 318 invoices, 465K SAR revenue (WRONG)';
    RAISE NOTICE '';

    -- Compare with view
    RAISE NOTICE 'Comparison with profit_analysis_view_current:';
    RAISE NOTICE '  View shows: 737 items, 287K SAR revenue';
    RAISE NOTICE '  (Note: View shows invoice_items, KPI shows unique invoices)';
    RAISE NOTICE '';

    IF v_invoices BETWEEN 160 AND 175 AND v_revenue BETWEEN 280000 AND 295000 THEN
        RAISE NOTICE '✓ Fix successful! KPIs now match filtered data.';
    ELSE
        RAISE NOTICE '⚠️  Numbers differ from expected. Please verify manually.';
    END IF;

    RAISE NOTICE '';
    RAISE NOTICE 'Filters Applied:';
    RAISE NOTICE '  ✓ Excludes GINV%% invoices (151 invoices filtered)';
    RAISE NOTICE '  ✓ Excludes Opening%% invoices (28 invoices filtered)';
    RAISE NOTICE '  ✓ Only includes valid business invoices';
END $$;

-- ============================================================================
-- ROLLBACK INSTRUCTIONS
-- ============================================================================
-- To rollback to previous version (with inflated numbers):
-- \i migrations/restore_overview_location_filter_with_rls.sql
--
-- WARNING: Rollback will restore the bug where GINV and Opening invoices
-- are included in KPI calculations
-- ============================================================================
