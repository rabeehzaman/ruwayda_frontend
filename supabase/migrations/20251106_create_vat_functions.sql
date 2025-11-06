-- Migration: Create VAT Return Functions
-- Created: 2025-11-06
-- Purpose: Add get_vat_available_months and get_vat_return functions for VAT Return page

-- Function 1: Get available VAT months for current year
CREATE OR REPLACE FUNCTION public.get_vat_available_months()
 RETURNS jsonb
 LANGUAGE plpgsql
AS $function$
DECLARE
  result JSONB;
  current_year INT;
BEGIN
  current_year := EXTRACT(YEAR FROM CURRENT_DATE);

  WITH monthly_data AS (
    -- Invoices
    SELECT
      EXTRACT(MONTH FROM invoice_date::date) AS month_num,
      COUNT(*) AS transaction_count
    FROM invoices
    WHERE EXTRACT(YEAR FROM invoice_date::date) = current_year
      AND invoice_date IS NOT NULL
    GROUP BY EXTRACT(MONTH FROM invoice_date::date)

    UNION ALL

    -- Credit Notes
    SELECT
      EXTRACT(MONTH FROM credit_note_date::date) AS month_num,
      COUNT(*) AS transaction_count
    FROM credit_notes
    WHERE EXTRACT(YEAR FROM credit_note_date::date) = current_year
      AND credit_note_date IS NOT NULL
    GROUP BY EXTRACT(MONTH FROM credit_note_date::date)

    UNION ALL

    -- Bills
    SELECT
      EXTRACT(MONTH FROM bill_date::date) AS month_num,
      COUNT(*) AS transaction_count
    FROM bills
    WHERE EXTRACT(YEAR FROM bill_date::date) = current_year
      AND bill_date IS NOT NULL
    GROUP BY EXTRACT(MONTH FROM bill_date::date)
  ),
  aggregated AS (
    SELECT
      month_num::INTEGER,
      SUM(transaction_count)::INTEGER AS total_count
    FROM monthly_data
    GROUP BY month_num
    ORDER BY month_num
  )
  SELECT jsonb_agg(
    jsonb_build_object(
      'month', month_num,
      'year', current_year,
      'transactionCount', COALESCE(total_count, 0)
    )
  )
  INTO result
  FROM aggregated;

  RETURN COALESCE(result, '[]'::jsonb);
END;
$function$;

-- Function 2: Get VAT Return data (main function with branch_names array)
CREATE OR REPLACE FUNCTION public.get_vat_return(p_start_date text DEFAULT NULL::text, p_end_date text DEFAULT NULL::text, p_branch_names text[] DEFAULT NULL::text[])
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
    IF p_branch_names IS NOT NULL AND array_length(p_branch_names, 1) > 0 THEN
        SELECT array_agg(location_id) INTO v_location_ids FROM branch WHERE location_name = ANY(p_branch_names);
    END IF;

    SELECT COALESCE(json_agg(invoice_data), '[]'::json) INTO v_invoices
    FROM (
        SELECT i.invoice_number, i.invoice_date, i.invoice_id,
            COALESCE(c.customer_name, c.display_name) as customer_name,
            COALESCE(b.location_name, 'N/A') as branch_name,
            i.location_id as branch_id,
            CASE WHEN i.sub_total_bcy ILIKE '%M%' THEN CAST(REGEXP_REPLACE(REGEXP_REPLACE(i.sub_total_bcy, '[^0-9.]', '', 'g'), '^$', '0') AS NUMERIC) * 1000000
                 WHEN i.sub_total_bcy ILIKE '%K%' THEN CAST(REGEXP_REPLACE(REGEXP_REPLACE(i.sub_total_bcy, '[^0-9.]', '', 'g'), '^$', '0') AS NUMERIC) * 1000
                 ELSE CAST(REGEXP_REPLACE(REGEXP_REPLACE(i.sub_total_bcy, '[^0-9.]', '', 'g'), '^$', '0') AS NUMERIC) END as subtotal,
            CASE WHEN i.total_bcy ILIKE '%M%' THEN CAST(REGEXP_REPLACE(REGEXP_REPLACE(i.total_bcy, '[^0-9.]', '', 'g'), '^$', '0') AS NUMERIC) * 1000000
                 WHEN i.total_bcy ILIKE '%K%' THEN CAST(REGEXP_REPLACE(REGEXP_REPLACE(i.total_bcy, '[^0-9.]', '', 'g'), '^$', '0') AS NUMERIC) * 1000
                 ELSE CAST(REGEXP_REPLACE(REGEXP_REPLACE(i.total_bcy, '[^0-9.]', '', 'g'), '^$', '0') AS NUMERIC) END as total,
            (CASE WHEN i.total_bcy ILIKE '%M%' THEN CAST(REGEXP_REPLACE(REGEXP_REPLACE(i.total_bcy, '[^0-9.]', '', 'g'), '^$', '0') AS NUMERIC) * 1000000
                  WHEN i.total_bcy ILIKE '%K%' THEN CAST(REGEXP_REPLACE(REGEXP_REPLACE(i.total_bcy, '[^0-9.]', '', 'g'), '^$', '0') AS NUMERIC) * 1000
                  ELSE CAST(REGEXP_REPLACE(REGEXP_REPLACE(i.total_bcy, '[^0-9.]', '', 'g'), '^$', '0') AS NUMERIC) END) -
            (CASE WHEN i.sub_total_bcy ILIKE '%M%' THEN CAST(REGEXP_REPLACE(REGEXP_REPLACE(i.sub_total_bcy, '[^0-9.]', '', 'g'), '^$', '0') AS NUMERIC) * 1000000
                  WHEN i.sub_total_bcy ILIKE '%K%' THEN CAST(REGEXP_REPLACE(REGEXP_REPLACE(i.sub_total_bcy, '[^0-9.]', '', 'g'), '^$', '0') AS NUMERIC) * 1000
                  ELSE CAST(REGEXP_REPLACE(REGEXP_REPLACE(i.sub_total_bcy, '[^0-9.]', '', 'g'), '^$', '0') AS NUMERIC) END) as vat_amount
        FROM invoices i
        LEFT JOIN customers c ON i.customer_id = c.customer_id
        LEFT JOIN branch b ON i.location_id = b.location_id
        WHERE i.invoice_status != 'void' AND i.invoice_number NOT ILIKE '%opening%' AND i.invoice_number != 'Opening Balance'
            AND (p_start_date IS NULL OR TO_DATE(i.invoice_date, 'DD Mon YYYY') >= TO_DATE(p_start_date, 'YYYY-MM-DD'))
            AND (p_end_date IS NULL OR TO_DATE(i.invoice_date, 'DD Mon YYYY') <= TO_DATE(p_end_date, 'YYYY-MM-DD'))
            AND (v_location_ids IS NULL OR i.location_id = ANY(v_location_ids))
        ORDER BY TO_DATE(i.invoice_date, 'DD Mon YYYY') DESC
    ) invoice_data;

    SELECT COALESCE(json_agg(credit_note_data), '[]'::json) INTO v_credit_notes
    FROM (
        SELECT cn.credit_note_number, cn.credit_note_date, cn.creditnotes_id,
            COALESCE(c.customer_name, c.display_name) as customer_name,
            COALESCE(b.location_name, 'N/A') as branch_name,
            cn.location_id as branch_id,
            CASE WHEN cn.sub_total_bcy ILIKE '%M%' THEN CAST(REGEXP_REPLACE(REGEXP_REPLACE(cn.sub_total_bcy, '[^0-9.]', '', 'g'), '^$', '0') AS NUMERIC) * 1000000
                 WHEN cn.sub_total_bcy ILIKE '%K%' THEN CAST(REGEXP_REPLACE(REGEXP_REPLACE(cn.sub_total_bcy, '[^0-9.]', '', 'g'), '^$', '0') AS NUMERIC) * 1000
                 ELSE CAST(REGEXP_REPLACE(REGEXP_REPLACE(cn.sub_total_bcy, '[^0-9.]', '', 'g'), '^$', '0') AS NUMERIC) END as subtotal,
            CASE WHEN cn.total_bcy ILIKE '%M%' THEN CAST(REGEXP_REPLACE(REGEXP_REPLACE(cn.total_bcy, '[^0-9.]', '', 'g'), '^$', '0') AS NUMERIC) * 1000000
                 WHEN cn.total_bcy ILIKE '%K%' THEN CAST(REGEXP_REPLACE(REGEXP_REPLACE(cn.total_bcy, '[^0-9.]', '', 'g'), '^$', '0') AS NUMERIC) * 1000
                 ELSE CAST(REGEXP_REPLACE(REGEXP_REPLACE(cn.total_bcy, '[^0-9.]', '', 'g'), '^$', '0') AS NUMERIC) END as total,
            (CASE WHEN cn.total_bcy ILIKE '%M%' THEN CAST(REGEXP_REPLACE(REGEXP_REPLACE(cn.total_bcy, '[^0-9.]', '', 'g'), '^$', '0') AS NUMERIC) * 1000000
                  WHEN cn.total_bcy ILIKE '%K%' THEN CAST(REGEXP_REPLACE(REGEXP_REPLACE(cn.total_bcy, '[^0-9.]', '', 'g'), '^$', '0') AS NUMERIC) * 1000
                  ELSE CAST(REGEXP_REPLACE(REGEXP_REPLACE(cn.total_bcy, '[^0-9.]', '', 'g'), '^$', '0') AS NUMERIC) END) -
            (CASE WHEN cn.sub_total_bcy ILIKE '%M%' THEN CAST(REGEXP_REPLACE(REGEXP_REPLACE(cn.sub_total_bcy, '[^0-9.]', '', 'g'), '^$', '0') AS NUMERIC) * 1000000
                  WHEN cn.sub_total_bcy ILIKE '%K%' THEN CAST(REGEXP_REPLACE(REGEXP_REPLACE(cn.sub_total_bcy, '[^0-9.]', '', 'g'), '^$', '0') AS NUMERIC) * 1000
                  ELSE CAST(REGEXP_REPLACE(REGEXP_REPLACE(cn.sub_total_bcy, '[^0-9.]', '', 'g'), '^$', '0') AS NUMERIC) END) as vat_amount
        FROM credit_notes cn
        LEFT JOIN customers c ON cn.customer_id = c.customer_id
        LEFT JOIN branch b ON cn.location_id = b.location_id
        WHERE cn.credit_note_status != 'void' AND cn.credit_note_number NOT ILIKE '%opening%' AND cn.credit_note_number != 'Opening Balance'
            AND (p_start_date IS NULL OR TO_DATE(cn.credit_note_date, 'DD Mon YYYY') >= TO_DATE(p_start_date, 'YYYY-MM-DD'))
            AND (p_end_date IS NULL OR TO_DATE(cn.credit_note_date, 'DD Mon YYYY') <= TO_DATE(p_end_date, 'YYYY-MM-DD'))
            AND (v_location_ids IS NULL OR cn.location_id = ANY(v_location_ids))
        ORDER BY TO_DATE(cn.credit_note_date, 'DD Mon YYYY') DESC
    ) credit_note_data;

    SELECT COALESCE(json_agg(bill_data), '[]'::json) INTO v_bills
    FROM (
        SELECT bl.bill_number, bl.bill_date, bl.bill_id,
            COALESCE(v.vendor_name, v.display_name) as vendor_name,
            COALESCE(b.location_name, 'N/A') as branch_name,
            bl.location_id as branch_id,
            CASE WHEN bl.sub_total_bcy ILIKE '%M%' THEN CAST(REGEXP_REPLACE(REGEXP_REPLACE(bl.sub_total_bcy, '[^0-9.]', '', 'g'), '^$', '0') AS NUMERIC) * 1000000
                 WHEN bl.sub_total_bcy ILIKE '%K%' THEN CAST(REGEXP_REPLACE(REGEXP_REPLACE(bl.sub_total_bcy, '[^0-9.]', '', 'g'), '^$', '0') AS NUMERIC) * 1000
                 ELSE CAST(REGEXP_REPLACE(REGEXP_REPLACE(bl.sub_total_bcy, '[^0-9.]', '', 'g'), '^$', '0') AS NUMERIC) END as subtotal,
            CASE WHEN bl.total_bcy ILIKE '%M%' THEN CAST(REGEXP_REPLACE(REGEXP_REPLACE(bl.total_bcy, '[^0-9.]', '', 'g'), '^$', '0') AS NUMERIC) * 1000000
                 WHEN bl.total_bcy ILIKE '%K%' THEN CAST(REGEXP_REPLACE(REGEXP_REPLACE(bl.total_bcy, '[^0-9.]', '', 'g'), '^$', '0') AS NUMERIC) * 1000
                 ELSE CAST(REGEXP_REPLACE(REGEXP_REPLACE(bl.total_bcy, '[^0-9.]', '', 'g'), '^$', '0') AS NUMERIC) END as total,
            (CASE WHEN bl.total_bcy ILIKE '%M%' THEN CAST(REGEXP_REPLACE(REGEXP_REPLACE(bl.total_bcy, '[^0-9.]', '', 'g'), '^$', '0') AS NUMERIC) * 1000000
                  WHEN bl.total_bcy ILIKE '%K%' THEN CAST(REGEXP_REPLACE(REGEXP_REPLACE(bl.total_bcy, '[^0-9.]', '', 'g'), '^$', '0') AS NUMERIC) * 1000
                  ELSE CAST(REGEXP_REPLACE(REGEXP_REPLACE(bl.total_bcy, '[^0-9.]', '', 'g'), '^$', '0') AS NUMERIC) END) -
            (CASE WHEN bl.sub_total_bcy ILIKE '%M%' THEN CAST(REGEXP_REPLACE(REGEXP_REPLACE(bl.sub_total_bcy, '[^0-9.]', '', 'g'), '^$', '0') AS NUMERIC) * 1000000
                  WHEN bl.sub_total_bcy ILIKE '%K%' THEN CAST(REGEXP_REPLACE(REGEXP_REPLACE(bl.sub_total_bcy, '[^0-9.]', '', 'g'), '^$', '0') AS NUMERIC) * 1000
                  ELSE CAST(REGEXP_REPLACE(REGEXP_REPLACE(bl.sub_total_bcy, '[^0-9.]', '', 'g'), '^$', '0') AS NUMERIC) END) as vat_amount
        FROM bills bl
        LEFT JOIN vendors v ON bl.vendor_id = v.vendor_id
        LEFT JOIN branch b ON bl.location_id = b.location_id
        WHERE bl.bill_status != 'void' AND bl.bill_number NOT ILIKE '%opening%' AND bl.bill_number != 'Opening Balance'
            AND (p_start_date IS NULL OR TO_DATE(bl.bill_date, 'DD Mon YYYY') >= TO_DATE(p_start_date, 'YYYY-MM-DD'))
            AND (p_end_date IS NULL OR TO_DATE(bl.bill_date, 'DD Mon YYYY') <= TO_DATE(p_end_date, 'YYYY-MM-DD'))
            AND (v_location_ids IS NULL OR bl.location_id = ANY(v_location_ids))
        ORDER BY TO_DATE(bl.bill_date, 'DD Mon YYYY') DESC
    ) bill_data;

    SELECT COALESCE(SUM((data->>'vat_amount')::NUMERIC), 0) INTO v_total_output_vat FROM json_array_elements(v_invoices) data;
    SELECT COALESCE(SUM((data->>'vat_amount')::NUMERIC), 0) INTO v_total_credit_vat FROM json_array_elements(v_credit_notes) data;
    SELECT COALESCE(SUM((data->>'vat_amount')::NUMERIC), 0) INTO v_total_input_vat FROM json_array_elements(v_bills) data;

    v_net_output_vat := v_total_output_vat - v_total_credit_vat;
    v_net_vat_payable := v_net_output_vat - v_total_input_vat;

    v_result := json_build_object('invoices', v_invoices, 'credit_notes', v_credit_notes, 'bills', v_bills,
        'summary', json_build_object('total_output_vat', v_total_output_vat, 'total_credit_vat', v_total_credit_vat,
            'net_output_vat', v_net_output_vat, 'total_input_vat', v_total_input_vat, 'net_vat_payable', v_net_vat_payable));

    RETURN v_result;
END;
$function$;

-- Function 3: Get VAT Return data (wrapper for single branch_id)
CREATE OR REPLACE FUNCTION public.get_vat_return(p_start_date text DEFAULT NULL::text, p_end_date text DEFAULT NULL::text, p_branch_id text DEFAULT NULL::text)
 RETURNS json
 LANGUAGE plpgsql
AS $function$
DECLARE v_branch_array TEXT[];
BEGIN
    IF p_branch_id IS NOT NULL THEN v_branch_array := ARRAY[p_branch_id]; END IF;
    RETURN get_vat_return(p_start_date, p_end_date, v_branch_array);
END;
$function$;

-- Grant execute permissions to anon and authenticated users
GRANT EXECUTE ON FUNCTION public.get_vat_available_months() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_vat_return(text, text, text[]) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_vat_return(text, text, text) TO anon, authenticated;

-- Add comment
COMMENT ON FUNCTION public.get_vat_available_months() IS 'Returns available VAT months with transaction counts for current year';
COMMENT ON FUNCTION public.get_vat_return(text, text, text[]) IS 'Calculates VAT return data for specified date range and branches (array)';
COMMENT ON FUNCTION public.get_vat_return(text, text, text) IS 'Calculates VAT return data for specified date range and single branch';
