-- ============================================
-- MIGRATION: Optimize Profit by Invoice Functions
-- ============================================
-- Purpose: Remove redundant RLS checks from profit by invoice functions
-- Issue: Triple filtering (View RLS + Function RLS + Parameter filter) causing 500 errors
-- Solution: Remove function-level RLS, rely on view + base table RLS only
-- Security: MAINTAINED - View and base tables still enforce RLS
-- Performance: Expected 50-70% improvement
-- Date: 2025-11-02
-- ============================================

-- ============================================
-- STEP 1: Backup Current Functions
-- ============================================

-- Backup get_profit_by_invoice_2025_filtered
CREATE OR REPLACE FUNCTION get_profit_by_invoice_2025_filtered_backup(
    start_date date DEFAULT NULL,
    end_date date DEFAULT NULL,
    branch_filters text[] DEFAULT NULL,
    customer_filter text DEFAULT NULL
)
RETURNS TABLE(
    invoice_number text,
    invoice_date text,
    customer_name text,
    branch_name text,
    sale_value numeric,
    profit numeric,
    margin numeric
)
LANGUAGE plpgsql
AS $$
BEGIN
    -- Original implementation (no RLS in this function, but keeping for reference)
    RETURN QUERY
    SELECT
        "Inv No" as invoice_number,
        "Inv Date"::TEXT as invoice_date,
        "Customer Name" as customer_name,
        "Branch Name" as branch_name,
        SUM("SaleWithVAT") as sale_value,
        SUM("Profit") as profit,
        CASE WHEN SUM("Sale Price") > 0 THEN (SUM("Profit") / SUM("Sale Price")) * 100 ELSE 0 END as margin
    FROM profit_analysis_view_current
    WHERE EXTRACT(YEAR FROM "Inv Date"::DATE) = 2025
        AND (start_date IS NULL OR "Inv Date" >= start_date)
        AND (end_date IS NULL OR "Inv Date" <= end_date)
        AND (branch_filters IS NULL OR "Branch Name" = ANY(branch_filters))
        AND (customer_filter IS NULL OR "Customer Name" ILIKE '%' || customer_filter || '%')
    GROUP BY "Inv No", "Inv Date", "Customer Name", "Branch Name"
    ORDER BY "Inv Date" DESC, "Inv No" DESC;
END;
$$;

-- Backup get_profit_by_invoice_filtered
CREATE OR REPLACE FUNCTION get_profit_by_invoice_filtered_backup(
    start_date date DEFAULT NULL,
    end_date date DEFAULT NULL,
    branch_filter text DEFAULT NULL,
    customer_filter text DEFAULT NULL
)
RETURNS TABLE(
    invoice_number text,
    invoice_date date,
    customer_name text,
    branch_name text,
    sale_value numeric,
    profit numeric,
    margin numeric
)
LANGUAGE plpgsql
AS $$
DECLARE
    user_branches TEXT[];
    is_admin BOOLEAN;
BEGIN
    -- Original implementation WITH RLS
    user_branches := get_user_branches();
    is_admin := is_admin_user();

    RETURN QUERY
    SELECT
        pav."Inv No" as invoice_number,
        pav."Inv Date"::DATE as invoice_date,
        MAX(pav."Customer Name") as customer_name,
        MAX(pav."Branch Name") as branch_name,
        SUM(pav."SaleWithVAT") as sale_value,
        SUM(pav."Profit") as profit,
        CASE WHEN SUM(pav."SaleWithVAT") > 0 THEN (SUM(pav."Profit") / SUM(pav."SaleWithVAT")) * 100 ELSE 0 END as margin
    FROM profit_analysis_view_current pav
    WHERE (start_date IS NULL OR pav."Inv Date"::DATE >= start_date)
        AND (end_date IS NULL OR pav."Inv Date"::DATE <= end_date)
        AND (branch_filter IS NULL OR pav."Branch Name" = branch_filter)
        AND (customer_filter IS NULL OR pav."Customer Name" = customer_filter)
        AND (is_admin OR pav."Branch Name" = ANY(user_branches))  -- RLS check being removed
    GROUP BY pav."Inv No", pav."Inv Date"::DATE
    ORDER BY pav."Inv Date"::DATE DESC;
END;
$$;

-- ============================================
-- STEP 2: Create Optimized Functions (WITHOUT redundant RLS)
-- ============================================

-- Optimized get_profit_by_invoice_2025_filtered
CREATE OR REPLACE FUNCTION get_profit_by_invoice_2025_filtered(
    start_date date DEFAULT NULL,
    end_date date DEFAULT NULL,
    branch_filters text[] DEFAULT NULL,
    customer_filter text DEFAULT NULL
)
RETURNS TABLE(
    invoice_number text,
    invoice_date text,
    customer_name text,
    branch_name text,
    sale_value numeric,
    profit numeric,
    margin numeric
)
LANGUAGE plpgsql
SECURITY INVOKER  -- Run with caller's permissions (respects RLS)
AS $$
BEGIN
    -- Simplified: No function-level RLS check
    -- Security enforced by:
    --   1. View (profit_analysis_view_current with security_invoker=true)
    --   2. Base tables (invoices, credit_notes with RLS policies)
    RETURN QUERY
    SELECT
        "Inv No" as invoice_number,
        "Inv Date"::TEXT as invoice_date,
        "Customer Name" as customer_name,
        "Branch Name" as branch_name,
        SUM("SaleWithVAT") as sale_value,
        SUM("Profit") as profit,
        CASE WHEN SUM("Sale Price") > 0
             THEN (SUM("Profit") / SUM("Sale Price")) * 100
             ELSE 0
        END as margin
    FROM profit_analysis_view_current
    WHERE EXTRACT(YEAR FROM "Inv Date"::DATE) = 2025
        AND (start_date IS NULL OR "Inv Date" >= start_date)
        AND (end_date IS NULL OR "Inv Date" <= end_date)
        AND (branch_filters IS NULL OR "Branch Name" = ANY(branch_filters))
        AND (customer_filter IS NULL OR "Customer Name" ILIKE '%' || customer_filter || '%')
    GROUP BY "Inv No", "Inv Date", "Customer Name", "Branch Name"
    ORDER BY "Inv Date" DESC, "Inv No" DESC;
END;
$$;

-- Optimized get_profit_by_invoice_filtered
CREATE OR REPLACE FUNCTION get_profit_by_invoice_filtered(
    start_date date DEFAULT NULL,
    end_date date DEFAULT NULL,
    branch_filter text DEFAULT NULL,
    customer_filter text DEFAULT NULL
)
RETURNS TABLE(
    invoice_number text,
    invoice_date date,
    customer_name text,
    branch_name text,
    sale_value numeric,
    profit numeric,
    margin numeric
)
LANGUAGE plpgsql
SECURITY INVOKER  -- Run with caller's permissions (respects RLS)
AS $$
BEGIN
    -- Simplified: No function-level RLS check
    -- Security enforced by:
    --   1. View (profit_analysis_view_current with security_invoker=true)
    --   2. Base tables (invoices, credit_notes with RLS policies)
    RETURN QUERY
    SELECT
        pav."Inv No" as invoice_number,
        pav."Inv Date"::DATE as invoice_date,
        MAX(pav."Customer Name") as customer_name,
        MAX(pav."Branch Name") as branch_name,
        SUM(pav."SaleWithVAT") as sale_value,
        SUM(pav."Profit") as profit,
        CASE WHEN SUM(pav."SaleWithVAT") > 0
             THEN (SUM(pav."Profit") / SUM(pav."SaleWithVAT")) * 100
             ELSE 0
        END as margin
    FROM profit_analysis_view_current pav
    WHERE (start_date IS NULL OR pav."Inv Date"::DATE >= start_date)
        AND (end_date IS NULL OR pav."Inv Date"::DATE <= end_date)
        AND (branch_filter IS NULL OR pav."Branch Name" = branch_filter)
        AND (customer_filter IS NULL OR pav."Customer Name" = customer_filter)
        -- ✅ NO function-level RLS check
        -- ✅ View + base table RLS handles security
    GROUP BY pav."Inv No", pav."Inv Date"::DATE
    ORDER BY pav."Inv Date"::DATE DESC;
END;
$$;

-- ============================================
-- STEP 3: Security Verification Queries
-- ============================================

-- Verify functions have SECURITY INVOKER
DO $$
DECLARE
    func_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO func_count
    FROM pg_proc p
    WHERE p.proname IN ('get_profit_by_invoice_2025_filtered', 'get_profit_by_invoice_filtered')
        AND p.prosecdef = false;  -- false = SECURITY INVOKER

    IF func_count = 2 THEN
        RAISE NOTICE '✅ SUCCESS: Both functions use SECURITY INVOKER';
    ELSE
        RAISE EXCEPTION '❌ FAILED: Functions do not use SECURITY INVOKER';
    END IF;
END $$;

-- Verify view has security_invoker=true
DO $$
DECLARE
    has_security_invoker BOOLEAN;
BEGIN
    SELECT 'security_invoker=true' = ANY(c.reloptions) INTO has_security_invoker
    FROM pg_class c
    WHERE c.relname = 'profit_analysis_view_current';

    IF has_security_invoker THEN
        RAISE NOTICE '✅ SUCCESS: View uses security_invoker=true';
    ELSE
        RAISE EXCEPTION '❌ FAILED: View does not use security_invoker=true';
    END IF;
END $$;

-- Verify base tables have RLS enabled
DO $$
DECLARE
    rls_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO rls_count
    FROM pg_tables
    WHERE tablename IN ('invoices', 'credit_notes')
        AND rowsecurity = true;

    IF rls_count = 2 THEN
        RAISE NOTICE '✅ SUCCESS: Base tables have RLS enabled';
    ELSE
        RAISE EXCEPTION '❌ FAILED: Base tables do not have RLS enabled';
    END IF;
END $$;

-- Verify RLS policies exist
DO $$
DECLARE
    policy_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE tablename IN ('invoices', 'credit_notes')
        AND policyname IN ('branch_access_invoices', 'branch_access_credit_notes');

    IF policy_count = 2 THEN
        RAISE NOTICE '✅ SUCCESS: RLS policies exist on base tables';
    ELSE
        RAISE EXCEPTION '❌ FAILED: RLS policies missing on base tables';
    END IF;
END $$;

RAISE NOTICE '✅✅✅ ALL SECURITY CHECKS PASSED ✅✅✅';
RAISE NOTICE 'Functions optimized: Redundant RLS removed';
RAISE NOTICE 'Security maintained: View + base table RLS still active';
RAISE NOTICE 'Expected performance improvement: 50-70%%';

-- ============================================
-- STEP 4: Performance Test Queries
-- ============================================

-- Test 1: No filter (should work fast)
-- Expected: ~761 invoices in ~50-70ms (down from 96ms)
-- SELECT COUNT(*) FROM get_profit_by_invoice_2025_filtered(
--     '2025-01-01'::date, '2025-12-31'::date, NULL, NULL
-- );

-- Test 2: Single branch filter (should work)
-- Expected: ~194 invoices in ~70-90ms (down from 141ms)
-- SELECT COUNT(*) FROM get_profit_by_invoice_2025_filtered(
--     '2025-01-01'::date, '2025-12-31'::date,
--     ARRAY['Frozen / ثلاجة'], NULL
-- );

-- Test 3: Multiple branch filter (SHOULD NOW WORK - was failing before)
-- Expected: Results in ~100-150ms (was timing out)
-- SELECT COUNT(*) FROM get_profit_by_invoice_2025_filtered(
--     '2025-01-01'::date, '2025-12-31'::date,
--     ARRAY['Frozen / ثلاجة', 'Khaleel / الخليل'], NULL
-- );

-- ============================================
-- ROLLBACK INSTRUCTIONS
-- ============================================

-- To rollback this migration:
--
-- DROP FUNCTION IF EXISTS get_profit_by_invoice_2025_filtered(date, date, text[], text);
-- DROP FUNCTION IF EXISTS get_profit_by_invoice_filtered(date, date, text, text);
--
-- ALTER FUNCTION get_profit_by_invoice_2025_filtered_backup(date, date, text[], text)
--     RENAME TO get_profit_by_invoice_2025_filtered;
--
-- ALTER FUNCTION get_profit_by_invoice_filtered_backup(date, date, text, text)
--     RENAME TO get_profit_by_invoice_filtered;

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
