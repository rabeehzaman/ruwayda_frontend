-- Migration: Create zoho_stock_summary View
-- Created: 2025-11-06
-- Purpose: Add stock summary view for Financials page balance sheet

CREATE OR REPLACE VIEW public.zoho_stock_summary AS
SELECT
    i.item_name AS "Name",
    COALESCE(b.location_name, 'No Location'::text) AS "Warehouse",
    i.usage_unit AS "Unit",
    round(sum(
        CASE
            WHEN sif.quantity_available ~ '^-?[0-9]+\.?[0-9]*$'::text THEN sif.quantity_available::numeric(15,6)
            ELSE COALESCE(NULLIF(regexp_replace(sif.quantity_available, '[^0-9.-]'::text, ''::text, 'g'::text), ''::text)::numeric(15,6), 0::numeric)
        END), 2) AS "Stock Qty",
    round(sum(
        CASE
            WHEN sif.quantity_available ~ '^-?[0-9]+\.?[0-9]*$'::text THEN sif.quantity_available::numeric(15,6)
            ELSE COALESCE(NULLIF(regexp_replace(sif.quantity_available, '[^0-9.-]'::text, ''::text, 'g'::text), ''::text)::numeric(15,6), 0::numeric)
        END *
        CASE
            WHEN i.usage_unit ~ '[0-9]+'::text THEN regexp_replace(i.usage_unit, '[^0-9]'::text, ''::text, 'g'::text)::numeric
            WHEN i.usage_unit = 'DZN'::text THEN 12::numeric
            WHEN i.usage_unit = 'KG'::text THEN 1000::numeric
            ELSE 1::numeric
        END), 0) AS "Stock in Pieces",
    round(sum(
        CASE
            WHEN sif.price_bcy ~ '^-?[0-9]+\.?[0-9]*$'::text THEN sif.price_bcy::numeric(15,6)
            ELSE COALESCE(NULLIF(regexp_replace(sif.price_bcy, '[^0-9.-]'::text, ''::text, 'g'::text), ''::text)::numeric(15,6), 0::numeric)
        END *
        CASE
            WHEN sif.quantity_available ~ '^-?[0-9]+\.?[0-9]*$'::text THEN sif.quantity_available::numeric(15,6)
            ELSE COALESCE(NULLIF(regexp_replace(sif.quantity_available, '[^0-9.-]'::text, ''::text, 'g'::text), ''::text)::numeric(15,6), 0::numeric)
        END), 2) AS "Current Stock Value",
    round(sum(
        CASE
            WHEN sif.price_bcy ~ '^-?[0-9]+\.?[0-9]*$'::text THEN sif.price_bcy::numeric(15,6)
            ELSE COALESCE(NULLIF(regexp_replace(sif.price_bcy, '[^0-9.-]'::text, ''::text, 'g'::text), ''::text)::numeric(15,6), 0::numeric)
        END *
        CASE
            WHEN sif.quantity_available ~ '^-?[0-9]+\.?[0-9]*$'::text THEN sif.quantity_available::numeric(15,6)
            ELSE COALESCE(NULLIF(regexp_replace(sif.quantity_available, '[^0-9.-]'::text, ''::text, 'g'::text), ''::text)::numeric(15,6), 0::numeric)
        END) * 1.15, 2) AS "Stock Value with VAT"
FROM items i
JOIN stock_in_flow_table sif ON i.item_id = sif.product_id
LEFT JOIN branch b ON sif.location_id = b.location_id
WHERE i.status = 'Active'::text
GROUP BY i.item_name, i.usage_unit, b.location_name
ORDER BY i.item_name, b.location_name;

-- Add comment
COMMENT ON VIEW public.zoho_stock_summary IS 'Stock summary by item and warehouse with current values and VAT calculations';

-- Grant permissions
GRANT SELECT ON public.zoho_stock_summary TO anon, authenticated;
