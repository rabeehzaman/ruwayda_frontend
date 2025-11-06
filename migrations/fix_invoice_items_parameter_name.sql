-- Migration: fix_invoice_items_parameter_name
-- Date: 2025-10-18
-- Description: Fix parameter name mismatch causing "no items found" errors
-- Issue: Frontend calls with 'invoice_number' but function expects 'p_invoice_number'
-- Solution: Rename parameter back to 'invoice_number' and use qualified names to avoid ambiguity

-- Drop and recreate with correct parameter name
DROP FUNCTION IF EXISTS get_invoice_items_with_profit(TEXT);

CREATE OR REPLACE FUNCTION get_invoice_items_with_profit(invoice_number TEXT)
RETURNS TABLE (
  item_name TEXT,
  quantity NUMERIC,
  unit_price NUMERIC,
  total_price NUMERIC,
  cost NUMERIC,
  unit_cost NUMERIC,
  profit NUMERIC,
  profit_percentage NUMERIC
)
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
AS $$
BEGIN
  RETURN QUERY
  WITH item_fifo_costs AS (
    -- Aggregate all FIFO mapping costs for each invoice item
    -- This prevents duplicate rows when one item has multiple FIFO mappings
    -- Example: FF 6X6 PEPIZO has 2 FIFO mappings (6 units @ 318 SAR + 14 units @ 742 SAR = 1,060 SAR)
    SELECT
      ii.item_id,
      ii.item_name::TEXT,
      ii.quantity,
      ii.sub_total_bcy as item_total_price,
      ii.total_bcy as item_total_with_vat,
      -- Sum all FIFO costs for this item across all stock batches
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
    -- Use function-qualified parameter name to avoid ambiguity with i.invoice_number column
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
    CAST(
      REGEXP_REPLACE(
        COALESCE(ifc.item_total_price, '0'),
        '[^0-9.]',
        '',
        'g'
      ) AS NUMERIC
    ) as total_price,
    ifc.total_cost as cost,
    -- Unit cost = total cost / quantity
    ROUND(
      CASE
        WHEN CAST(REGEXP_REPLACE(COALESCE(ifc.quantity::TEXT, '0'), '[^0-9.]', '', 'g') AS NUMERIC) > 0
        THEN ifc.total_cost / CAST(REGEXP_REPLACE(COALESCE(ifc.quantity::TEXT, '0'), '[^0-9.]', '', 'g') AS NUMERIC)
        ELSE 0
      END,
      2
    ) as unit_cost,
    -- Profit = total price - total cost
    (CAST(REGEXP_REPLACE(COALESCE(ifc.item_total_price, '0'), '[^0-9.]', '', 'g') AS NUMERIC) - ifc.total_cost) as profit,
    -- Profit percentage = (profit / total price) * 100
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
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_invoice_items_with_profit(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_invoice_items_with_profit(TEXT) TO anon;

COMMENT ON FUNCTION get_invoice_items_with_profit(TEXT) IS
'Returns invoice items with profit calculations, aggregating multiple FIFO mappings per item to prevent duplicates. Parameter: invoice_number (matches frontend call)';
