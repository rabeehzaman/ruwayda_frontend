-- Migration: Create get_invoice_items_with_profit Function
-- Created: 2025-11-06
-- Purpose: Add function to fetch invoice items with profit calculations for Financials page

CREATE OR REPLACE FUNCTION public.get_invoice_items_with_profit(invoice_number text)
 RETURNS TABLE(item_name text, quantity numeric, unit_price numeric, sale_price numeric, unit_cost numeric, cost numeric, unit_profit numeric, profit numeric, profit_percentage numeric)
 LANGUAGE plpgsql
 STABLE
AS $function$
BEGIN
  RETURN QUERY
  WITH item_fifo_costs AS (
    SELECT
      ii.item_id,
      ii.item_name::TEXT,
      ii.quantity,
      ii.sub_total_bcy as item_total_price,
      ii.total_bcy as item_total_with_vat,
      COALESCE(
        SUM(
          CAST(
            REGEXP_REPLACE(
              COALESCE(fm.total_bcy, '0'),
              '[^0-9.]',
              '',
              'g'
            ) AS NUMERIC
          )
        ),
        0
      ) as total_cost
    FROM invoice_items ii
    JOIN invoices i ON ii.invoice_id = i.invoice_id
    LEFT JOIN stock_out_flow_table sof ON ii.item_id = sof.invoice_item_id
    LEFT JOIN fifo_mapping_table fm ON sof.stock_out_flow_id = fm.stock_out_flow_id
    WHERE i.invoice_number = get_invoice_items_with_profit.invoice_number
    GROUP BY
      ii.item_id,
      ii.item_name,
      ii.quantity,
      ii.sub_total_bcy,
      ii.total_bcy
  )
  SELECT
    ifc.item_name::TEXT,
    CAST(
      REGEXP_REPLACE(
        COALESCE(ifc.quantity::TEXT, '0'),
        '[^0-9.]',
        '',
        'g'
      ) AS NUMERIC
    ) as quantity,
    -- Unit price = total price / quantity
    ROUND(
      CASE
        WHEN CAST(REGEXP_REPLACE(COALESCE(ifc.quantity::TEXT, '0'), '[^0-9.]', '', 'g') AS NUMERIC) > 0
        THEN CAST(REGEXP_REPLACE(COALESCE(ifc.item_total_price, '0'), '[^0-9.]', '', 'g') AS NUMERIC) /
             CAST(REGEXP_REPLACE(COALESCE(ifc.quantity::TEXT, '0'), '[^0-9.]', '', 'g') AS NUMERIC)
        ELSE 0
      END,
      2
    ) as unit_price,
    -- Sale price (total) - renamed from total_price
    CAST(
      REGEXP_REPLACE(
        COALESCE(ifc.item_total_price, '0'),
        '[^0-9.]',
        '',
        'g'
      ) AS NUMERIC
    ) as sale_price,
    -- Unit cost = total cost / quantity
    ROUND(
      CASE
        WHEN CAST(REGEXP_REPLACE(COALESCE(ifc.quantity::TEXT, '0'), '[^0-9.]', '', 'g') AS NUMERIC) > 0
        THEN ifc.total_cost / CAST(REGEXP_REPLACE(COALESCE(ifc.quantity::TEXT, '0'), '[^0-9.]', '', 'g') AS NUMERIC)
        ELSE 0
      END,
      2
    ) as unit_cost,
    -- Cost (total)
    ifc.total_cost as cost,
    -- Unit profit = unit price - unit cost
    ROUND(
      CASE
        WHEN CAST(REGEXP_REPLACE(COALESCE(ifc.quantity::TEXT, '0'), '[^0-9.]', '', 'g') AS NUMERIC) > 0
        THEN (CAST(REGEXP_REPLACE(COALESCE(ifc.item_total_price, '0'), '[^0-9.]', '', 'g') AS NUMERIC) /
              CAST(REGEXP_REPLACE(COALESCE(ifc.quantity::TEXT, '0'), '[^0-9.]', '', 'g') AS NUMERIC)) -
             (ifc.total_cost / CAST(REGEXP_REPLACE(COALESCE(ifc.quantity::TEXT, '0'), '[^0-9.]', '', 'g') AS NUMERIC))
        ELSE 0
      END,
      2
    ) as unit_profit,
    -- Profit (total) = sale price - cost
    (CAST(REGEXP_REPLACE(COALESCE(ifc.item_total_price, '0'), '[^0-9.]', '', 'g') AS NUMERIC) - ifc.total_cost) as profit,
    -- Profit percentage = (profit / sale price) * 100
    CASE
      WHEN CAST(REGEXP_REPLACE(COALESCE(ifc.item_total_price, '0'), '[^0-9.]', '', 'g') AS NUMERIC) > 0
      THEN ROUND(
        ((CAST(REGEXP_REPLACE(COALESCE(ifc.item_total_price, '0'), '[^0-9.]', '', 'g') AS NUMERIC) - ifc.total_cost) /
         CAST(REGEXP_REPLACE(COALESCE(ifc.item_total_price, '0'), '[^0-9.]', '', 'g') AS NUMERIC)) * 100,
        2
      )
      ELSE 0
    END as profit_percentage
  FROM item_fifo_costs ifc
  ORDER BY ifc.item_name;
END;
$function$;

-- Add comment
COMMENT ON FUNCTION public.get_invoice_items_with_profit(text) IS 'Returns invoice items with FIFO cost calculations and profit margins';

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.get_invoice_items_with_profit(text) TO anon, authenticated;
