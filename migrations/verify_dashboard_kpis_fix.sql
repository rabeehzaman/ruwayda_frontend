-- ============================================================================
-- VERIFICATION: Dashboard KPIs VAT Calculation Fix
-- ============================================================================
-- Run this after applying fix_dashboard_kpis_vat_calculation.sql
-- to verify the fix is working correctly
-- ============================================================================

-- Test 1: October 2025 Net VAT Payable from Dashboard KPIs
SELECT
    'Dashboard KPIs (October 2025)' as source,
    (get_dashboard_kpis_2025('2025-10-01'::date, '2025-10-31'::date, NULL::text[])->>'netVatPayable')::NUMERIC as net_vat_payable;

-- Test 2: October 2025 Net VAT Payable from VAT Return
SELECT
    'VAT Return (October 2025)' as source,
    ((get_vat_return('2025-10-01'::text, '2025-10-31'::text, NULL::text[])->>'summary')::json->>'net_vat_payable')::NUMERIC as net_vat_payable;

-- Test 3: Compare both values side by side
WITH dashboard_vat AS (
    SELECT (get_dashboard_kpis_2025('2025-10-01'::date, '2025-10-31'::date, NULL::text[])->>'netVatPayable')::NUMERIC as net_vat
),
vat_return AS (
    SELECT ((get_vat_return('2025-10-01'::text, '2025-10-31'::text, NULL::text[])->>'summary')::json->>'net_vat_payable')::NUMERIC as net_vat
)
SELECT
    'Comparison' as test,
    d.net_vat as dashboard_kpis_vat,
    v.net_vat as vat_return_vat,
    ABS(d.net_vat - v.net_vat) as difference,
    CASE
        WHEN ABS(d.net_vat - v.net_vat) < 1 THEN '✓ PASS - Values match'
        WHEN d.net_vat > 1000000 THEN '✗ FAIL - Dashboard VAT too high (>1M)'
        WHEN v.net_vat > 1000000 THEN '✗ FAIL - VAT Return too high (>1M)'
        ELSE '⚠ WARNING - Values do not match'
    END as result
FROM dashboard_vat d, vat_return v;

-- Test 4: All-time data (should still work)
SELECT
    'Dashboard KPIs (All-time)' as source,
    (get_dashboard_kpis_2025(NULL::date, NULL::date, NULL::text[])->>'netVatPayable')::NUMERIC as net_vat_payable;
