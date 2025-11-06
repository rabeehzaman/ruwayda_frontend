-- Migration: fix_invoice_items_drop_and_recreate
-- Date: 2025-10-18
-- Description: Fix duplicate invoice items caused by multiple FIFO mappings
-- Issue: Invoice GAS-787 shows 11 items instead of 10 - "FF 6X6 PEPIZO" duplicated
-- Root Cause: LEFT JOIN with fifo_mapping_table creates cartesian product when item has multiple FIFO records
-- Solution: Drop old function and recreate with GROUP BY aggregation to sum FIFO costs per item

-- Step 1: Drop the existing function
DROP FUNCTION IF EXISTS get_invoice_items_with_profit(TEXT);

-- Step 2: Create new function with proper parameter naming and aggregation
CREATE OR REPLACE FUNCTION get_invoice_items_with_profit(p_invoice_number TEXT)
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
              COALESCE(fm.total_fifo_cost_bcy, '0'),
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
    WHERE i.invoice_number = p_invoice_number
    GROUP BY
      ii.item_id,
      ii.item_name,
      ii.quantity,
      ii.sub_total_bcy,
      ii.total_bcy
  )
  SELECT
    ifc.item_name::TEXT,
    ifc.quantity,
    -- Unit price = total price / quantity
    ROUND(
      CASE
        WHEN ifc.quantity > 0 THEN ifc.item_total_price / ifc.quantity
        ELSE 0
      END,
      2
    ) as unit_price,
    ifc.item_total_price as total_price,
    ifc.total_cost as cost,
    -- Unit cost = total cost / quantity
    ROUND(
      CASE
        WHEN ifc.quantity > 0 THEN ifc.total_cost / ifc.quantity
        ELSE 0
      END,
      2
    ) as unit_cost,
    -- Profit = total price - total cost
    (ifc.item_total_price - ifc.total_cost) as profit,
    -- Profit percentage = (profit / total price) * 100
    CASE
      WHEN ifc.item_total_price > 0
      THEN ROUND(((ifc.item_total_price - ifc.total_cost) / ifc.item_total_price) * 100, 2)
      ELSE 0
    END as profit_percentage
  FROM item_fifo_costs ifc
  ORDER BY ifc.item_name;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_invoice_items_with_profit(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_invoice_items_with_profit(TEXT) TO anon;

-- Verification query (commented out - run manually to test):
-- SELECT * FROM get_invoice_items_with_profit('GAS-787');
-- Expected: 10 items (not 11)
-- Item "FF 6X6 PEPIZO 4X25KG" should appear once with aggregated cost

COMMENT ON FUNCTION get_invoice_items_with_profit(TEXT) IS
'Returns invoice items with profit calculations, aggregating multiple FIFO mappings per item to prevent duplicates';
