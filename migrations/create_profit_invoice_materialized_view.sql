-- ============================================
-- MIGRATION: Create Profit by Invoice Materialized View
-- ============================================
-- Purpose: Create pre-aggregated materialized view for blazing fast queries
-- Issue: Even after RLS optimization, view queries still timeout with location filters
-- Solution: Pre-aggregate data at invoice level, add indexes, query materialized view
-- Performance: Expected 90-95% improvement (10-30ms vs 150-300ms)
-- Date: 2025-11-02
-- ============================================

-- ============================================
-- STEP 1: Create Materialized View
-- ============================================

CREATE MATERIALIZED VIEW IF NOT EXISTS profit_by_invoice_materialized AS
SELECT
    i.invoice_id,
    i.invoice_number,
    i.invoice_date::DATE as invoice_date,
    i.customer_id,
    c.customer_name,
    i.location_id,
    COALESCE(b.location_name, 'No Branch') as branch_name,
    i.invoice_status,
    -- Pre-aggregated calculations from profit_analysis_view_current
    SUM(CASE
        WHEN ii.total_bcy IS NOT NULL
        THEN CAST(REGEXP_REPLACE(COALESCE(ii.total_bcy, '0'), '[^0-9.]', '', 'g') AS NUMERIC) * 1.15
        ELSE 0
    END) as sale_with_vat,
    SUM(CASE
        WHEN ii.total_bcy IS NOT NULL
        THEN CAST(REGEXP_REPLACE(COALESCE(ii.total_bcy, '0'), '[^0-9.]', '', 'g') AS NUMERIC)
        ELSE 0
    END) as sale_price,
    -- Calculate profit from existing view for accuracy
    COALESCE((
        SELECT SUM("Profit")
        FROM profit_analysis_view_current pav
        WHERE pav."Inv No" = i.invoice_number
    ), 0) as profit,
    -- Margin calculation
    CASE
        WHEN SUM(CASE
            WHEN ii.total_bcy IS NOT NULL
            THEN CAST(REGEXP_REPLACE(COALESCE(ii.total_bcy, '0'), '[^0-9.]', '', 'g') AS NUMERIC)
            ELSE 0
        END) > 0
        THEN (COALESCE((
            SELECT SUM("Profit")
            FROM profit_analysis_view_current pav
            WHERE pav."Inv No" = i.invoice_number
        ), 0) / SUM(CASE
            WHEN ii.total_bcy IS NOT NULL
            THEN CAST(REGEXP_REPLACE(COALESCE(ii.total_bcy, '0'), '[^0-9.]', '', 'g') AS NUMERIC)
            ELSE 0
        END)) * 100
        ELSE 0
    END as margin
FROM invoices i
LEFT JOIN invoice_items ii ON i.invoice_id = ii.invoice_id
LEFT JOIN customers c ON i.customer_id = c.customer_id
LEFT JOIN branch b ON i.location_id = b.location_id
WHERE i.invoice_status <> 'Void'
    AND i.invoice_number NOT ILIKE 'GINV%'
    AND i.invoice_number NOT ILIKE 'Opening%'
    AND EXTRACT(YEAR FROM i.invoice_date::DATE) = 2025
GROUP BY
    i.invoice_id,
    i.invoice_number,
    i.invoice_date,
    i.customer_id,
    c.customer_name,
    i.location_id,
    b.location_name,
    i.invoice_status;

-- ============================================
-- STEP 2: Create Indexes for Fast Filtering
-- ============================================

CREATE INDEX IF NOT EXISTS idx_profit_invoice_mat_date
    ON profit_by_invoice_materialized(invoice_date);

CREATE INDEX IF NOT EXISTS idx_profit_invoice_mat_location
    ON profit_by_invoice_materialized(location_id);

CREATE INDEX IF NOT EXISTS idx_profit_invoice_mat_branch_name
    ON profit_by_invoice_materialized(branch_name);

CREATE INDEX IF NOT EXISTS idx_profit_invoice_mat_customer
    ON profit_by_invoice_materialized(customer_name);

CREATE INDEX IF NOT EXISTS idx_profit_invoice_mat_invoice_num
    ON profit_by_invoice_materialized(invoice_number);

-- Composite index for common filter combinations
CREATE INDEX IF NOT EXISTS idx_profit_invoice_mat_date_location
    ON profit_by_invoice_materialized(invoice_date, location_id);

-- ============================================
-- STEP 3: Enable RLS on Materialized View
-- ============================================

ALTER MATERIALIZED VIEW profit_by_invoice_materialized OWNER TO postgres;

-- Note: Materialized views don't support RLS directly in PostgreSQL
-- We'll handle RLS in the function that queries this view

-- ============================================
-- STEP 4: Create Optimized Function Using Materialized View
-- ============================================

-- Backup current optimized function
CREATE OR REPLACE FUNCTION get_profit_by_invoice_2025_filtered_v1(
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
SECURITY INVOKER
AS $$
BEGIN
    -- V1 function (queries view directly)
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

-- New ultra-fast function using materialized view
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
SECURITY INVOKER
AS $$
DECLARE
    user_branches TEXT[];
    is_admin BOOLEAN;
BEGIN
    -- Get user permissions for RLS
    user_branches := get_user_branches();
    is_admin := is_admin_user();

    -- Query pre-aggregated materialized view (MUCH faster)
    RETURN QUERY
    SELECT
        pim.invoice_number,
        pim.invoice_date::TEXT as invoice_date,
        pim.customer_name,
        pim.branch_name,
        pim.sale_with_vat as sale_value,
        pim.profit,
        pim.margin
    FROM profit_by_invoice_materialized pim
    WHERE (start_date IS NULL OR pim.invoice_date >= start_date)
        AND (end_date IS NULL OR pim.invoice_date <= end_date)
        AND (branch_filters IS NULL OR pim.branch_name = ANY(branch_filters))
        AND (customer_filter IS NULL OR pim.customer_name ILIKE '%' || customer_filter || '%')
        -- RLS: Filter by user's allowed branches
        AND (is_admin OR pim.branch_name = ANY(user_branches))
    ORDER BY pim.invoice_date DESC, pim.invoice_number DESC;
END;
$$;

-- ============================================
-- STEP 5: Create Refresh Function
-- ============================================

CREATE OR REPLACE FUNCTION refresh_profit_by_invoice_materialized()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Refresh materialized view
    REFRESH MATERIALIZED VIEW profit_by_invoice_materialized;

    RAISE NOTICE '✅ Materialized view refreshed successfully';
    RAISE NOTICE 'Total invoices: %', (SELECT COUNT(*) FROM profit_by_invoice_materialized);
END;
$$;

-- Initial refresh
SELECT refresh_profit_by_invoice_materialized();

-- ============================================
-- STEP 6: Performance Verification
-- ============================================

RAISE NOTICE '';
RAISE NOTICE '✅✅✅ MATERIALIZED VIEW CREATED SUCCESSFULLY ✅✅✅';
RAISE NOTICE 'Total invoices in materialized view: %', (SELECT COUNT(*) FROM profit_by_invoice_materialized);
RAISE NOTICE 'Indexes created: 6';
RAISE NOTICE 'Expected query time: 10-30ms (down from 150-300ms)';
RAISE NOTICE '';
RAISE NOTICE '📝 IMPORTANT: Refresh the view regularly to keep data fresh';
RAISE NOTICE 'Manual refresh: SELECT refresh_profit_by_invoice_materialized();';
RAISE NOTICE 'Recommended: Schedule nightly refresh or trigger on data changes';

-- ============================================
-- ROLLBACK INSTRUCTIONS
-- ============================================

-- To rollback:
--
-- -- Restore V1 function
-- DROP FUNCTION IF EXISTS get_profit_by_invoice_2025_filtered(date, date, text[], text);
-- ALTER FUNCTION get_profit_by_invoice_2025_filtered_v1(date, date, text[], text)
--     RENAME TO get_profit_by_invoice_2025_filtered;
--
-- -- Drop materialized view and indexes
-- DROP MATERIALIZED VIEW IF EXISTS profit_by_invoice_materialized CASCADE;
-- DROP FUNCTION IF EXISTS refresh_profit_by_invoice_materialized();

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
