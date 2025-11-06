-- Migration: Fix VAT Return Calculation - Handle 'M' Suffix and Opening Balance
-- Date: 2025-10-13
-- Issue: Net VAT showing 53M instead of correct value due to:
--   1. Missing 'M' (millions) suffix handling - only handled 'K' (thousands)
--   2. Opening Balance bills not properly excluded
-- Impact: Opening Balance bill "SAR 1.08M" parsed as 1.08 instead of 1,080,000
--         causing VAT miscalculation of ~1,077,212 SAR

-- Drop both overloaded versions of the function
DROP FUNCTION IF EXISTS public.get_vat_return(text, text, text);
DROP FUNCTION IF EXISTS public.get_vat_return(text, text, text[]);

-- Recreate function with array parameter (supports multiple branches)
CREATE OR REPLACE FUNCTION public.get_vat_return(
    p_start_date text DEFAULT NULL::text,
    p_end_date text DEFAULT NULL::text,
    p_branch_names text[] DEFAULT NULL::text[]
)
RETURNS json
LANGUAGE plpgsql
AS $function$
DECLARE
    v_result JSON;
    v_invoices JSON;
    v_credit_notes JSON;
    v_bills JSON;
    v_total_output_vat NUMERIC := 0;
    v_total_credit_vat NUMERIC := 0;
    v_total_input_vat NUMERIC := 0;
    v_net_output_vat NUMERIC := 0;
    v_net_vat_payable NUMERIC := 0;
    v_location_ids TEXT[];
BEGIN
    -- Convert array of location_names to array of location_ids
    IF p_branch_names IS NOT NULL AND array_length(p_branch_names, 1) > 0 THEN
        SELECT array_agg(location_id)
        INTO v_location_ids
        FROM branch
        WHERE location_name = ANY(p_branch_names);
    END IF;

    -- Get invoice data (output VAT)
    SELECT COALESCE(json_agg(invoice_data), '[]'::json)
    INTO v_invoices
    FROM (
        SELECT
            i.invoice_number,
            i.invoice_date,
            i.invoice_id,
            COALESCE(c.customer_name, c.display_name) as customer_name,
            COALESCE(b.location_name, 'N/A') as branch_name,
            i.location_id as branch_id,
            -- Parse subtotal with M/K suffix handling
            CASE
                WHEN i.sub_total_bcy ILIKE '%M%' THEN
                    CAST(REGEXP_REPLACE(REGEXP_REPLACE(i.sub_total_bcy, '[^0-9.]', '', 'g'), '^$', '0') AS NUMERIC) * 1000000
                WHEN i.sub_total_bcy ILIKE '%K%' THEN
                    CAST(REGEXP_REPLACE(REGEXP_REPLACE(i.sub_total_bcy, '[^0-9.]', '', 'g'), '^$', '0') AS NUMERIC) * 1000
                ELSE
                    CAST(REGEXP_REPLACE(REGEXP_REPLACE(i.sub_total_bcy, '[^0-9.]', '', 'g'), '^$', '0') AS NUMERIC)
            END as subtotal,
            -- Parse total with M/K suffix handling
            CASE
                WHEN i.total_bcy ILIKE '%M%' THEN
                    CAST(REGEXP_REPLACE(REGEXP_REPLACE(i.total_bcy, '[^0-9.]', '', 'g'), '^$', '0') AS NUMERIC) * 1000000
                WHEN i.total_bcy ILIKE '%K%' THEN
                    CAST(REGEXP_REPLACE(REGEXP_REPLACE(i.total_bcy, '[^0-9.]', '', 'g'), '^$', '0') AS NUMERIC) * 1000
                ELSE
                    CAST(REGEXP_REPLACE(REGEXP_REPLACE(i.total_bcy, '[^0-9.]', '', 'g'), '^$', '0') AS NUMERIC)
            END as total,
            -- Calculate VAT with M/K suffix handling
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
            END) as vat_amount
        FROM invoices i
        LEFT JOIN customers c ON i.customer_id = c.customer_id
        LEFT JOIN branch b ON i.location_id = b.location_id
        WHERE i.invoice_status != 'void'
            AND i.invoice_number NOT ILIKE '%opening%'
            AND i.invoice_number != 'Opening Balance'
            AND (p_start_date IS NULL OR TO_DATE(i.invoice_date, 'DD Mon YYYY') >= TO_DATE(p_start_date, 'YYYY-MM-DD'))
            AND (p_end_date IS NULL OR TO_DATE(i.invoice_date, 'DD Mon YYYY') <= TO_DATE(p_end_date, 'YYYY-MM-DD'))
            AND (v_location_ids IS NULL OR i.location_id = ANY(v_location_ids))
        ORDER BY TO_DATE(i.invoice_date, 'DD Mon YYYY') DESC
    ) invoice_data;

    -- Get credit note data (reduces output VAT)
    SELECT COALESCE(json_agg(credit_note_data), '[]'::json)
    INTO v_credit_notes
    FROM (
        SELECT
            cn.credit_note_number,
            cn.credit_note_date,
            cn.creditnotes_id,
            COALESCE(c.customer_name, c.display_name) as customer_name,
            COALESCE(b.location_name, 'N/A') as branch_name,
            cn.location_id as branch_id,
            -- Parse subtotal with M/K suffix handling
            CASE
                WHEN cn.sub_total_bcy ILIKE '%M%' THEN
                    CAST(REGEXP_REPLACE(REGEXP_REPLACE(cn.sub_total_bcy, '[^0-9.]', '', 'g'), '^$', '0') AS NUMERIC) * 1000000
                WHEN cn.sub_total_bcy ILIKE '%K%' THEN
                    CAST(REGEXP_REPLACE(REGEXP_REPLACE(cn.sub_total_bcy, '[^0-9.]', '', 'g'), '^$', '0') AS NUMERIC) * 1000
                ELSE
                    CAST(REGEXP_REPLACE(REGEXP_REPLACE(cn.sub_total_bcy, '[^0-9.]', '', 'g'), '^$', '0') AS NUMERIC)
            END as subtotal,
            -- Parse total with M/K suffix handling
            CASE
                WHEN cn.total_bcy ILIKE '%M%' THEN
                    CAST(REGEXP_REPLACE(REGEXP_REPLACE(cn.total_bcy, '[^0-9.]', '', 'g'), '^$', '0') AS NUMERIC) * 1000000
                WHEN cn.total_bcy ILIKE '%K%' THEN
                    CAST(REGEXP_REPLACE(REGEXP_REPLACE(cn.total_bcy, '[^0-9.]', '', 'g'), '^$', '0') AS NUMERIC) * 1000
                ELSE
                    CAST(REGEXP_REPLACE(REGEXP_REPLACE(cn.total_bcy, '[^0-9.]', '', 'g'), '^$', '0') AS NUMERIC)
            END as total,
            -- Calculate VAT with M/K suffix handling
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
            END) as vat_amount
        FROM credit_notes cn
        LEFT JOIN customers c ON cn.customer_id = c.customer_id
        LEFT JOIN branch b ON cn.location_id = b.location_id
        WHERE cn.credit_note_status != 'void'
            AND cn.credit_note_number NOT ILIKE '%opening%'
            AND cn.credit_note_number != 'Opening Balance'
            AND (p_start_date IS NULL OR TO_DATE(cn.credit_note_date, 'DD Mon YYYY') >= TO_DATE(p_start_date, 'YYYY-MM-DD'))
            AND (p_end_date IS NULL OR TO_DATE(cn.credit_note_date, 'DD Mon YYYY') <= TO_DATE(p_end_date, 'YYYY-MM-DD'))
            AND (v_location_ids IS NULL OR cn.location_id = ANY(v_location_ids))
        ORDER BY TO_DATE(cn.credit_note_date, 'DD Mon YYYY') DESC
    ) credit_note_data;

    -- Get bill data (input VAT)
    SELECT COALESCE(json_agg(bill_data), '[]'::json)
    INTO v_bills
    FROM (
        SELECT
            bl.bill_number,
            bl.bill_date,
            bl.bill_id,
            COALESCE(v.vendor_name, v.display_name) as vendor_name,
            COALESCE(b.location_name, 'N/A') as branch_name,
            bl.location_id as branch_id,
            -- Parse subtotal with M/K suffix handling
            CASE
                WHEN bl.sub_total_bcy ILIKE '%M%' THEN
                    CAST(REGEXP_REPLACE(REGEXP_REPLACE(bl.sub_total_bcy, '[^0-9.]', '', 'g'), '^$', '0') AS NUMERIC) * 1000000
                WHEN bl.sub_total_bcy ILIKE '%K%' THEN
                    CAST(REGEXP_REPLACE(REGEXP_REPLACE(bl.sub_total_bcy, '[^0-9.]', '', 'g'), '^$', '0') AS NUMERIC) * 1000
                ELSE
                    CAST(REGEXP_REPLACE(REGEXP_REPLACE(bl.sub_total_bcy, '[^0-9.]', '', 'g'), '^$', '0') AS NUMERIC)
            END as subtotal,
            -- Parse total with M/K suffix handling
            CASE
                WHEN bl.total_bcy ILIKE '%M%' THEN
                    CAST(REGEXP_REPLACE(REGEXP_REPLACE(bl.total_bcy, '[^0-9.]', '', 'g'), '^$', '0') AS NUMERIC) * 1000000
                WHEN bl.total_bcy ILIKE '%K%' THEN
                    CAST(REGEXP_REPLACE(REGEXP_REPLACE(bl.total_bcy, '[^0-9.]', '', 'g'), '^$', '0') AS NUMERIC) * 1000
                ELSE
                    CAST(REGEXP_REPLACE(REGEXP_REPLACE(bl.total_bcy, '[^0-9.]', '', 'g'), '^$', '0') AS NUMERIC)
            END as total,
            -- Calculate VAT with M/K suffix handling
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
            END) as vat_amount
        FROM bills bl
        LEFT JOIN vendors v ON bl.vendor_id = v.vendor_id
        LEFT JOIN branch b ON bl.location_id = b.location_id
        WHERE bl.bill_status != 'void'
            AND bl.bill_number NOT ILIKE '%opening%'
            AND bl.bill_number != 'Opening Balance'
            AND (p_start_date IS NULL OR TO_DATE(bl.bill_date, 'DD Mon YYYY') >= TO_DATE(p_start_date, 'YYYY-MM-DD'))
            AND (p_end_date IS NULL OR TO_DATE(bl.bill_date, 'DD Mon YYYY') <= TO_DATE(p_end_date, 'YYYY-MM-DD'))
            AND (v_location_ids IS NULL OR bl.location_id = ANY(v_location_ids))
        ORDER BY TO_DATE(bl.bill_date, 'DD Mon YYYY') DESC
    ) bill_data;

    -- Calculate totals
    SELECT COALESCE(SUM((data->>'vat_amount')::NUMERIC), 0)
    INTO v_total_output_vat
    FROM json_array_elements(v_invoices) data;

    SELECT COALESCE(SUM((data->>'vat_amount')::NUMERIC), 0)
    INTO v_total_credit_vat
    FROM json_array_elements(v_credit_notes) data;

    SELECT COALESCE(SUM((data->>'vat_amount')::NUMERIC), 0)
    INTO v_total_input_vat
    FROM json_array_elements(v_bills) data;

    v_net_output_vat := v_total_output_vat - v_total_credit_vat;
    v_net_vat_payable := v_net_output_vat - v_total_input_vat;

    -- Build result JSON
    v_result := json_build_object(
        'invoices', v_invoices,
        'credit_notes', v_credit_notes,
        'bills', v_bills,
        'summary', json_build_object(
            'total_output_vat', v_total_output_vat,
            'total_credit_vat', v_total_credit_vat,
            'net_output_vat', v_net_output_vat,
            'total_input_vat', v_total_input_vat,
            'net_vat_payable', v_net_vat_payable
        )
    );

    RETURN v_result;
END;
$function$;

-- Create compatibility overload for single branch (text parameter)
CREATE OR REPLACE FUNCTION public.get_vat_return(
    p_start_date text DEFAULT NULL::text,
    p_end_date text DEFAULT NULL::text,
    p_branch_id text DEFAULT NULL::text
)
RETURNS json
LANGUAGE plpgsql
AS $function$
DECLARE
    v_branch_array TEXT[];
BEGIN
    -- Convert single branch to array and call the array version
    IF p_branch_id IS NOT NULL THEN
        v_branch_array := ARRAY[p_branch_id];
    END IF;

    RETURN get_vat_return(p_start_date, p_end_date, v_branch_array);
END;
$function$;

-- Verification: Test the fix
DO $$
DECLARE
    v_test_result JSON;
    v_net_vat NUMERIC;
BEGIN
    -- Test with October 2025 data
    SELECT get_vat_return('2025-10-01'::text, '2025-10-31'::text, NULL::text[])
    INTO v_test_result;

    v_net_vat := ((v_test_result->>'summary')::json->>'net_vat_payable')::NUMERIC;

    RAISE NOTICE 'Migration test - October 2025 Net VAT Payable: %', v_net_vat;

    -- Verify it's in reasonable range (not 53 million!)
    IF v_net_vat > 1000000 THEN
        RAISE WARNING 'VAT calculation may still be incorrect - value is too high: %', v_net_vat;
    ELSIF v_net_vat < -1000000 THEN
        RAISE WARNING 'VAT calculation may be incorrect - refundable amount is very high: %', v_net_vat;
    ELSE
        RAISE NOTICE 'VAT calculation appears correct ✓';
    END IF;
END $$;
