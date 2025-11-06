-- ============================================
-- MIGRATION: Schedule Nightly Materialized View Refresh
-- ============================================
-- Purpose: Auto-refresh profit_by_invoice_materialized every night at 2 AM Saudi time
-- Strategy: Option A - Using pg_cron extension
-- Schedule: 2:00 AM Saudi Arabia Time (AST = UTC+3)
-- UTC Time: 23:00 (11:00 PM UTC = 2:00 AM AST next day)
-- Date: 2025-11-02
-- ============================================

-- ============================================
-- STEP 1: Enable pg_cron Extension
-- ============================================

CREATE EXTENSION IF NOT EXISTS pg_cron;

-- ============================================
-- STEP 2: Schedule Nightly Refresh at 2 AM Saudi Time
-- ============================================

-- Remove existing schedule if it exists (idempotent)
SELECT cron.unschedule('refresh-profit-invoice-mat-view')
WHERE EXISTS (
    SELECT 1 FROM cron.job WHERE jobname = 'refresh-profit-invoice-mat-view'
);

-- Schedule refresh at 23:00 UTC (2:00 AM Saudi Arabia Time)
-- Cron format: minute hour day month weekday
-- 0 23 * * * = Every day at 23:00 UTC
SELECT cron.schedule(
    'refresh-profit-invoice-mat-view',  -- Job name
    '0 23 * * *',                        -- Cron expression: 23:00 UTC = 2 AM Saudi time
    $$SELECT refresh_profit_by_invoice_materialized()$$  -- SQL command to execute
);

-- ============================================
-- STEP 3: Create Monitoring Metadata Table
-- ============================================

CREATE TABLE IF NOT EXISTS materialized_view_metadata (
    view_name TEXT PRIMARY KEY,
    last_refreshed TIMESTAMP,
    record_count INTEGER,
    refresh_duration_ms INTEGER,
    last_error TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- STEP 4: Update Refresh Function with Monitoring
-- ============================================

CREATE OR REPLACE FUNCTION refresh_profit_by_invoice_materialized()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    start_time TIMESTAMP;
    end_time TIMESTAMP;
    record_cnt INTEGER;
    duration_ms INTEGER;
    error_msg TEXT;
BEGIN
    start_time := CLOCK_TIMESTAMP();

    BEGIN
        -- Refresh materialized view
        REFRESH MATERIALIZED VIEW profit_by_invoice_materialized;

        end_time := CLOCK_TIMESTAMP();

        -- Get record count
        SELECT COUNT(*) INTO record_cnt FROM profit_by_invoice_materialized;

        -- Calculate duration in milliseconds
        duration_ms := EXTRACT(MILLISECONDS FROM (end_time - start_time))::INTEGER;

        -- Log successful refresh metadata
        INSERT INTO materialized_view_metadata (
            view_name,
            last_refreshed,
            record_count,
            refresh_duration_ms,
            last_error,
            updated_at
        )
        VALUES (
            'profit_by_invoice_materialized',
            end_time,
            record_cnt,
            duration_ms,
            NULL,
            NOW()
        )
        ON CONFLICT (view_name)
        DO UPDATE SET
            last_refreshed = EXCLUDED.last_refreshed,
            record_count = EXCLUDED.record_count,
            refresh_duration_ms = EXCLUDED.refresh_duration_ms,
            last_error = NULL,
            updated_at = NOW();

        RAISE NOTICE '✅ Refreshed profit_by_invoice_materialized: % invoices in %ms',
                     record_cnt, duration_ms;

    EXCEPTION WHEN OTHERS THEN
        -- Capture error
        GET STACKED DIAGNOSTICS error_msg = MESSAGE_TEXT;

        -- Log failed refresh
        INSERT INTO materialized_view_metadata (
            view_name,
            last_refreshed,
            last_error,
            updated_at
        )
        VALUES (
            'profit_by_invoice_materialized',
            NOW(),
            error_msg,
            NOW()
        )
        ON CONFLICT (view_name)
        DO UPDATE SET
            last_refreshed = NOW(),
            last_error = EXCLUDED.last_error,
            updated_at = NOW();

        RAISE WARNING '❌ Failed to refresh profit_by_invoice_materialized: %', error_msg;
        RAISE;
    END;
END;
$$;

-- ============================================
-- STEP 5: Initial Refresh & Verification
-- ============================================

-- Perform initial refresh to test
SELECT refresh_profit_by_invoice_materialized();

-- Verify scheduled job was created
DO $$
DECLARE
    job_count INTEGER;
    job_schedule TEXT;
BEGIN
    SELECT COUNT(*), MAX(schedule)
    INTO job_count, job_schedule
    FROM cron.job
    WHERE jobname = 'refresh-profit-invoice-mat-view';

    IF job_count = 1 THEN
        RAISE NOTICE '';
        RAISE NOTICE '✅✅✅ SCHEDULED REFRESH CONFIGURED SUCCESSFULLY ✅✅✅';
        RAISE NOTICE 'Job Name: refresh-profit-invoice-mat-view';
        RAISE NOTICE 'Schedule: % (23:00 UTC = 2:00 AM Saudi Arabia Time)', job_schedule;
        RAISE NOTICE 'Target: profit_by_invoice_materialized';
        RAISE NOTICE 'Frequency: Daily at 2:00 AM AST';
        RAISE NOTICE '';
    ELSE
        RAISE EXCEPTION '❌ Failed to create scheduled job';
    END IF;
END $$;

-- Show current metadata
SELECT
    view_name,
    last_refreshed,
    record_count || ' invoices' as records,
    refresh_duration_ms || ' ms' as duration,
    CASE
        WHEN last_error IS NULL THEN '✅ Success'
        ELSE '❌ ' || last_error
    END as status
FROM materialized_view_metadata
WHERE view_name = 'profit_by_invoice_materialized';

-- ============================================
-- STEP 6: Usage Instructions
-- ============================================

RAISE NOTICE '';
RAISE NOTICE '📋 USAGE INSTRUCTIONS';
RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
RAISE NOTICE '';
RAISE NOTICE '✅ Automatic Refresh: Every day at 2:00 AM Saudi Arabia Time';
RAISE NOTICE '';
RAISE NOTICE '📊 Check Last Refresh:';
RAISE NOTICE '   SELECT * FROM materialized_view_metadata';
RAISE NOTICE '   WHERE view_name = ''profit_by_invoice_materialized'';';
RAISE NOTICE '';
RAISE NOTICE '🔄 Manual Refresh (if needed):';
RAISE NOTICE '   SELECT refresh_profit_by_invoice_materialized();';
RAISE NOTICE '';
RAISE NOTICE '📅 View Scheduled Jobs:';
RAISE NOTICE '   SELECT * FROM cron.job WHERE jobname = ''refresh-profit-invoice-mat-view'';';
RAISE NOTICE '';
RAISE NOTICE '📜 View Job History:';
RAISE NOTICE '   SELECT * FROM cron.job_run_details';
RAISE NOTICE '   WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = ''refresh-profit-invoice-mat-view'')';
RAISE NOTICE '   ORDER BY start_time DESC LIMIT 10;';
RAISE NOTICE '';
RAISE NOTICE '⏸️  Disable Scheduled Refresh:';
RAISE NOTICE '   SELECT cron.unschedule(''refresh-profit-invoice-mat-view'');';
RAISE NOTICE '';
RAISE NOTICE '▶️  Re-enable Scheduled Refresh:';
RAISE NOTICE '   SELECT cron.schedule(''refresh-profit-invoice-mat-view'', ''0 23 * * *'',';
RAISE NOTICE '       $$SELECT refresh_profit_by_invoice_materialized()$$);';
RAISE NOTICE '';
RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';

-- ============================================
-- ROLLBACK INSTRUCTIONS
-- ============================================

-- To remove scheduled refresh:
--
-- -- Unschedule the job
-- SELECT cron.unschedule('refresh-profit-invoice-mat-view');
--
-- -- Drop monitoring table (optional)
-- DROP TABLE IF EXISTS materialized_view_metadata;
--
-- -- Revert refresh function to simple version
-- CREATE OR REPLACE FUNCTION refresh_profit_by_invoice_materialized()
-- RETURNS void LANGUAGE plpgsql SECURITY DEFINER
-- AS $$
-- BEGIN
--     REFRESH MATERIALIZED VIEW profit_by_invoice_materialized;
--     RAISE NOTICE '✅ Materialized view refreshed successfully';
-- END;
-- $$;

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
