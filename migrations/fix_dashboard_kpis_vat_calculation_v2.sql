-- ============================================================================
-- FIX V2: Dashboard KPIs VAT Calculation - Invoice-Level VAT (Not Line-Item)
-- ============================================================================
-- Issue: get_dashboard_kpis_2025() calculates VAT from LINE ITEMS instead of INVOICES
--
--   Previous Issue (V1 fixed):
--   1. Missing 'M' (millions) suffix handling ✓ FIXED
--   2. Missing 'K' (thousands) suffix handling ✓ FIXED
--   3. Opening Balance bills not excluded ✓ FIXED
--
--   NEW Issue (V2 fixing):
--   4. Output VAT calculated from profit_analysis_view_current (356 line items)
--      instead of invoices table (125 invoices)
--
--   Example Bug: Invoice with 3 line items and 100 SAR total VAT
--     - WRONG (V1): Sums VAT from line items = 100 + 100 + 100 = 300 SAR
--     - CORRECT (V2): Calculates VAT once per invoice = 100 SAR
--
--   Result: Dashboard shows 20,789 SAR but should show 8,098 SAR (156% error)
--
-- Solution: Use invoices table directly (like get_vat_return() does)
--
-- Date: 2025-10-13 (V2)
-- Related: fix_vat_return_millions_suffix.sql
-- ============================================================================

-- Drop and recreate the function with proper invoice-level VAT calculation
DROP FUNCTION IF EXISTS public.get_dashboard_kpis_2025(date, date, text[]);

CREATE OR REPLACE FUNCTION get_dashboard_kpis_2025(
    start_date DATE DEFAULT NULL,
    end_date DATE DEFAULT NULL,
    branch_filters TEXT[] DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    result JSON;
    total_taxable_sales NUMERIC;
    total_revenue NUMERIC;
    total_cost NUMERIC;
    gross_profit NUMERIC;
    total_expenses NUMERIC;
    net_profit NUMERIC;
    gross_profit_margin NUMERIC;
    net_profit_margin NUMERIC;
    total_stock_value NUMERIC;
    net_vat_payable NUMERIC;
BEGIN
    -- Calculate sales and cost from profit_analysis_view_current (2025 data only)
    SELECT
        COALESCE(SUM("Sale Price"), 0),
        COALESCE(SUM("SaleWithVAT"), 0),
        COALESCE(SUM("Cost"), 0),
        COALESCE(SUM("Profit"), 0)
    INTO
        total_taxable_sales,
        total_revenue,
        total_cost,
        gross_profit
    FROM profit_analysis_view_current
    WHERE EXTRACT(YEAR FROM "Inv Date"::DATE) = 2025
        AND (start_date IS NULL OR "Inv Date" >= start_date)
        AND (end_date IS NULL OR "Inv Date" <= end_date)
        AND (branch_filters IS NULL OR "Branch Name" = ANY(branch_filters));

    -- Calculate total expenses from expense_details_view (2025 data only)
    SELECT COALESCE(SUM(amount), 0)
    INTO total_expenses
    FROM expense_details_view
    WHERE EXTRACT(YEAR FROM date::DATE) = 2025
        AND (start_date IS NULL OR date >= start_date)
        AND (end_date IS NULL OR date <= end_date)
        AND (branch_filters IS NULL OR branch_name = ANY(branch_filters));

    -- Calculate total stock value from stock_in_flow_table
    SELECT COALESCE(SUM(CAST(REGEXP_REPLACE(COALESCE(s.total_bcy, '0'), '[^0-9.-]', '', 'g') AS NUMERIC)), 0)
    INTO total_stock_value
    FROM stock_in_flow_table s
    LEFT JOIN branch b ON s.location_id = b.location_id
    WHERE (branch_filters IS NULL OR b.location_name = ANY(branch_filters));

    -- Calculate VAT payable (output VAT from invoices - input VAT from bills)
    -- V2 FIX: Use invoices table directly (invoice level), not profit_analysis_view_current (line-item level)
    WITH vat_output AS (
        -- Output VAT from invoices table (INVOICE LEVEL - one record per invoice)
        -- Same logic as get_vat_return() function
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
        LEFT JOIN branch br ON i.location_id = br.location_id
        WHERE EXTRACT(YEAR FROM TO_DATE(i.invoice_date, 'DD Mon YYYY')) = 2025
            AND i.invoice_status != 'void'
            AND i.invoice_number NOT ILIKE '%opening%'
            AND i.invoice_number != 'Opening Balance'
            AND (start_date IS NULL OR TO_DATE(i.invoice_date, 'DD Mon YYYY') >= start_date)
            AND (end_date IS NULL OR TO_DATE(i.invoice_date, 'DD Mon YYYY') <= end_date)
            AND (branch_filters IS NULL OR br.location_name = ANY(branch_filters))
    ),
    vat_credit AS (
        -- Credit notes reduce output VAT (from credit_notes table with proper parsing)
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
        LEFT JOIN branch br ON cn.location_id = br.location_id
        WHERE EXTRACT(YEAR FROM TO_DATE(cn.credit_note_date, 'DD Mon YYYY')) = 2025
            AND cn.credit_note_status != 'void'
            AND cn.credit_note_number NOT ILIKE '%opening%'
            AND cn.credit_note_number != 'Opening Balance'
            AND (start_date IS NULL OR TO_DATE(cn.credit_note_date, 'DD Mon YYYY') >= start_date)
            AND (end_date IS NULL OR TO_DATE(cn.credit_note_date, 'DD Mon YYYY') <= end_date)
            AND (branch_filters IS NULL OR br.location_name = ANY(branch_filters))
    ),
    vat_input AS (
        -- Input VAT from bills - Calculate from total - subtotal with M/K parsing
        SELECT COALESCE(SUM(
            (CASE
                WHEN bl.total_bcy ILIKE '%M%' THEN
                    CAST(REGEXP_REPLACE(REGEXP_REPLACE(bl.total_bcy, '[^0-9.]', '', 'g'), '^$', '0') AS NUMERIC) * 1000000
                WHEN bl.total_bcy ILIKE '%K%' THEN
                    CAST(REGEXP_REPLACE(REGEXP_REPLACE(bl.total_bcy, '[^0-9.]', '', 'g'), '^$', '0') AS NUMERIC) * 1000
                ELSE
                    CAST(REGEXP_REPLACE(REGEXP_REPLACE(bl.total_bcy, '[^0-9.]', '', 'g'), '^$', '0') AS NUMERIC)
            END) -
            (CASE
                WHEN bl.sub_total_bcy ILIKE '%M%' THEN
                    CAST(REGEXP_REPLACE(REGEXP_REPLACE(bl.sub_total_bcy, '[^0-9.]', '', 'g'), '^$', '0') AS NUMERIC) * 1000000
                WHEN bl.sub_total_bcy ILIKE '%K%' THEN
                    CAST(REGEXP_REPLACE(REGEXP_REPLACE(bl.sub_total_bcy, '[^0-9.]', '', 'g'), '^$', '0') AS NUMERIC) * 1000
                ELSE
                    CAST(REGEXP_REPLACE(REGEXP_REPLACE(bl.sub_total_bcy, '[^0-9.]', '', 'g'), '^$', '0') AS NUMERIC)
            END)
        ), 0) as input_vat
        FROM bills bl
        LEFT JOIN branch br ON bl.location_id = br.location_id
        WHERE EXTRACT(YEAR FROM TO_DATE(bl.bill_date, 'DD Mon YYYY')) = 2025
            AND bl.bill_status != 'void'
            AND bl.bill_number NOT ILIKE '%opening%'
            AND bl.bill_number != 'Opening Balance'
            AND (start_date IS NULL OR TO_DATE(bl.bill_date, 'DD Mon YYYY') >= start_date)
            AND (end_date IS NULL OR TO_DATE(bl.bill_date, 'DD Mon YYYY') <= end_date)
            AND (branch_filters IS NULL OR br.location_name = ANY(branch_filters))
    )
    SELECT (output_vat - credit_vat - input_vat) INTO net_vat_payable
    FROM vat_output, vat_credit, vat_input;

    -- Calculate net profit and margins
    net_profit := gross_profit - total_expenses;

    gross_profit_margin := CASE
        WHEN total_taxable_sales > 0 THEN (gross_profit / total_taxable_sales) * 100
        ELSE 0
    END;

    net_profit_margin := CASE
        WHEN total_taxable_sales > 0 THEN (net_profit / total_taxable_sales) * 100
        ELSE 0
    END;

    -- Build result JSON with aggregated data
    SELECT json_build_object(
        'totalTaxableSales', total_taxable_sales,
        'totalRevenue', total_revenue,
        'totalCost', total_cost,
        'grossProfit', gross_profit,
        'totalExpenses', total_expenses,
        'netProfit', net_profit,
        'grossProfitMargin', gross_profit_margin,
        'netProfitMargin', net_profit_margin,
        'totalStockValue', total_stock_value,
        'netVatPayable', net_vat_payable,
        'totalInvoices', COUNT(*),
        'uniqueInvoices', COUNT(DISTINCT "Inv No"),
        'totalQuantity', COALESCE(SUM("Qty"), 0),
        'averageOrderValue', CASE
            WHEN COUNT(DISTINCT "Inv No") > 0
            THEN total_revenue / COUNT(DISTINCT "Inv No")
            ELSE 0
        END,
        'dailyAvgSales', CASE
            WHEN start_date IS NOT NULL THEN
                CASE
                    WHEN (LEAST(COALESCE(end_date, CURRENT_DATE), CURRENT_DATE) - start_date + 1) > 0
                    THEN total_revenue / (LEAST(COALESCE(end_date, CURRENT_DATE), CURRENT_DATE) - start_date + 1)
                    ELSE 0
                END
            ELSE
                CASE
                    WHEN EXTRACT(DAY FROM CURRENT_DATE) > 0
                    THEN total_revenue / EXTRACT(DAY FROM CURRENT_DATE)
                    ELSE 0
                END
        END,
        'dateRange', json_build_object(
            'from', start_date,
            'to', end_date
        )
    ) INTO result
    FROM profit_analysis_view_current
    WHERE EXTRACT(YEAR FROM "Inv Date"::DATE) = 2025
        AND (start_date IS NULL OR "Inv Date" >= start_date)
        AND (end_date IS NULL OR "Inv Date" <= end_date)
        AND (branch_filters IS NULL OR "Branch Name" = ANY(branch_filters));

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
    -- Test with October 2025 data
    SELECT get_dashboard_kpis_2025('2025-10-01'::date, '2025-10-31'::date, NULL::text[])
    INTO v_test_result;

    v_net_vat := (v_test_result->>'netVatPayable')::NUMERIC;
    RAISE NOTICE 'Dashboard KPIs V2 Migration Test - October 2025 Net VAT Payable: %', v_net_vat;

    -- Compare with get_vat_return to ensure consistency
    SELECT get_vat_return('2025-10-01'::text, '2025-10-31'::text, NULL::text[])
    INTO v_vat_return_result;

    v_vat_return_net := ((v_vat_return_result->>'summary')::json->>'net_vat_payable')::NUMERIC;
    RAISE NOTICE 'VAT Return Net VAT Payable (for comparison): %', v_vat_return_net;

    v_difference := ABS(v_net_vat - v_vat_return_net);
    RAISE NOTICE 'Difference: % SAR', v_difference;

    -- Verify values are in reasonable range and match
    IF v_difference > 1 THEN
        RAISE WARNING 'Dashboard KPIs and VAT Return do not match! Difference: % SAR', v_difference;
        RAISE WARNING '  Dashboard KPIs: % SAR', v_net_vat;
        RAISE WARNING '  VAT Return:     % SAR', v_vat_return_net;
        RAISE WARNING '  Error Percentage: %', ROUND((v_difference / NULLIF(v_vat_return_net, 0)) * 100, 2);
    ELSIF v_net_vat > 1000000 THEN
        RAISE WARNING 'Dashboard KPIs VAT may still be incorrect - value is too high: %', v_net_vat;
    ELSIF v_net_vat < -1000000 THEN
        RAISE WARNING 'Dashboard KPIs VAT may be incorrect - refundable amount is very high: %', v_net_vat;
    ELSE
        RAISE NOTICE '✓ Dashboard KPIs VAT calculation is correct';
        RAISE NOTICE '✓ Values match VAT Return page (difference < 1 SAR)';
        RAISE NOTICE '✓ V2 Fix successful: Now using invoice-level VAT calculation';
    END IF;
END $$;
