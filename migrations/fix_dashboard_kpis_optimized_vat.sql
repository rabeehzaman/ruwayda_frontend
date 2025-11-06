-- ============================================================================
-- FIX: Dashboard KPIs Optimized VAT Calculation - M/K Suffix & Opening Balance
-- ============================================================================
-- Issue: get_dashboard_kpis_2025_optimized() (used by frontend) has same bugs:
--   1. Missing 'M' (millions) suffix handling in bill/invoice amounts
--   2. Missing 'K' (thousands) suffix handling
--   3. Opening Balance bills not excluded
--   4. Credit notes VAT not deducted
--
-- Date: 2025-10-13
-- Related: fix_dashboard_kpis_vat_calculation_v2.sql (same fixes, different function)
-- ============================================================================

DROP FUNCTION IF EXISTS public.get_dashboard_kpis_2025_optimized(date, date, text[]);

CREATE OR REPLACE FUNCTION get_dashboard_kpis_2025_optimized(
    start_date DATE DEFAULT NULL,
    end_date DATE DEFAULT NULL,
    location_ids TEXT[] DEFAULT NULL
)
RETURNS JSON AS $$
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
            AND i.invoice_number NOT LIKE 'Opening Balance%'
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
            AND i.invoice_number NOT LIKE 'Opening Balance%'
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
            AND cn.credit_note_number NOT ILIKE '%opening%'
            AND cn.credit_note_number != 'Opening Balance'
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
            AND b.bill_number NOT ILIKE '%opening%'
            AND b.bill_number != 'Opening Balance'
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
$$ LANGUAGE plpgsql;

-- ============================================================================
-- VERIFICATION TEST
-- ============================================================================
DO $$
DECLARE
    v_test_result JSON;
    v_net_vat NUMERIC;
    v_vat_return_result JSON;
    v_vat_return_net NUMERIC;
    v_difference NUMERIC;
BEGIN
    -- Test with October 2025 data (all locations)
    SELECT get_dashboard_kpis_2025_optimized('2025-10-01'::date, '2025-10-31'::date, NULL::text[])
    INTO v_test_result;

    v_net_vat := (v_test_result->>'netVatPayable')::NUMERIC;
    RAISE NOTICE 'Dashboard KPIs Optimized Test - October 2025 Net VAT Payable: %', v_net_vat;

    -- Compare with get_vat_return to ensure consistency
    SELECT get_vat_return('2025-10-01'::text, '2025-10-31'::text, NULL::text[])
    INTO v_vat_return_result;

    v_vat_return_net := ((v_vat_return_result->>'summary')::json->>'net_vat_payable')::NUMERIC;
    RAISE NOTICE 'VAT Return Net VAT Payable (for comparison): %', v_vat_return_net;

    v_difference := ABS(v_net_vat - v_vat_return_net);
    RAISE NOTICE 'Difference: % SAR', v_difference;

    -- Verify values are in reasonable range and match
    IF v_difference > 1 THEN
        RAISE WARNING 'Dashboard KPIs Optimized and VAT Return do not match! Difference: % SAR', v_difference;
        RAISE WARNING '  Dashboard KPIs Optimized: % SAR', v_net_vat;
        RAISE WARNING '  VAT Return:               % SAR', v_vat_return_net;
        RAISE WARNING '  Error Percentage: %', ROUND((v_difference / NULLIF(v_vat_return_net, 0)) * 100, 2);
    ELSIF v_net_vat > 1000000 THEN
        RAISE WARNING 'Dashboard KPIs Optimized VAT may still be incorrect - value is too high: %', v_net_vat;
    ELSIF v_net_vat < -1000000 THEN
        RAISE WARNING 'Dashboard KPIs Optimized VAT may be incorrect - refundable amount is very high: %', v_net_vat;
    ELSE
        RAISE NOTICE '✓ Dashboard KPIs Optimized VAT calculation is correct';
        RAISE NOTICE '✓ Values match VAT Return page (difference < 1 SAR)';
        RAISE NOTICE '✓ Frontend will now display correct VAT values';
    END IF;
END $$;
