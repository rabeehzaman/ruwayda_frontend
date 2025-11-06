-- Migration: Filter GINV and Opening Balance Invoices from Profit Analysis View
-- Date: 2025-10-13
-- Description: Exclude GINV invoices and opening balance entries from profit analysis view
-- Impact: Removes 108 rows (15.6% of data), SAR 150,992.00 in sales
-- Remaining: 583 rows, SAR 244,289.82 in sales

-- Drop and recreate the view with new filters
DROP VIEW IF EXISTS profit_analysis_view_current CASCADE;

CREATE OR REPLACE VIEW profit_analysis_view_current AS
-- INVOICES SECTION
SELECT
    i.invoice_number AS "Inv No",
    i.invoice_date::date AS "Inv Date",
    ii.item_name AS "Item",
    CAST(REGEXP_REPLACE(COALESCE(ii.quantity, '0'), '[^0-9.]', '', 'g') AS NUMERIC) AS "Qty",
    CAST(REGEXP_REPLACE(COALESCE(ii.total_bcy, '0'), '[^0-9.]', '', 'g') AS NUMERIC) AS "Sale Price",
    ROUND(CAST(REGEXP_REPLACE(COALESCE(ii.total_bcy, '0'), '[^0-9.]', '', 'g') AS NUMERIC) * 1.15, 2) AS "SaleWithVAT",
    COALESCE(
        SUM(
            CASE
                WHEN fm.total_bcy IS NULL OR fm.total_bcy = '' THEN 0
                ELSE CAST(REGEXP_REPLACE(fm.total_bcy, '[^0-9.]', '', 'g') AS NUMERIC)
            END
        ),
        0
    ) AS "Cost",
    ROUND(
        CAST(REGEXP_REPLACE(COALESCE(ii.total_bcy, '0'), '[^0-9.]', '', 'g') AS NUMERIC) -
        COALESCE(
            SUM(
                CASE
                    WHEN fm.total_bcy IS NULL OR fm.total_bcy = '' THEN 0
                    ELSE CAST(REGEXP_REPLACE(fm.total_bcy, '[^0-9.]', '', 'g') AS NUMERIC)
                END
            ),
            0
        ),
        2
    ) AS "Profit",
    ROUND(
        CASE
            WHEN CAST(REGEXP_REPLACE(COALESCE(ii.total_bcy, '0'), '[^0-9.]', '', 'g') AS NUMERIC) > 0
            THEN (
                CAST(REGEXP_REPLACE(COALESCE(ii.total_bcy, '0'), '[^0-9.]', '', 'g') AS NUMERIC) -
                COALESCE(
                    SUM(
                        CASE
                            WHEN fm.total_bcy IS NULL OR fm.total_bcy = '' THEN 0
                            ELSE CAST(REGEXP_REPLACE(fm.total_bcy, '[^0-9.]', '', 'g') AS NUMERIC)
                        END
                    ),
                    0
                )
            ) / CAST(REGEXP_REPLACE(COALESCE(ii.total_bcy, '0'), '[^0-9.]', '', 'g') AS NUMERIC) * 100
            ELSE 0
        END,
        2
    ) AS "Profit %",
    c.customer_name AS "Customer Name",
    COALESCE(b.location_name, 'No Branch') AS "Branch Name",
    ROUND(
        CASE
            WHEN CAST(REGEXP_REPLACE(COALESCE(ii.quantity, '0'), '[^0-9.]', '', 'g') AS NUMERIC) > 0
            THEN CAST(REGEXP_REPLACE(COALESCE(ii.total_bcy, '0'), '[^0-9.]', '', 'g') AS NUMERIC) /
                 CAST(REGEXP_REPLACE(COALESCE(ii.quantity, '0'), '[^0-9.]', '', 'g') AS NUMERIC)
            ELSE 0
        END,
        2
    ) AS "Unit Price",
    ROUND(
        CASE
            WHEN CAST(REGEXP_REPLACE(COALESCE(ii.quantity, '0'), '[^0-9.]', '', 'g') AS NUMERIC) > 0
            THEN COALESCE(
                SUM(
                    CASE
                        WHEN fm.total_bcy IS NULL OR fm.total_bcy = '' THEN 0
                        ELSE CAST(REGEXP_REPLACE(fm.total_bcy, '[^0-9.]', '', 'g') AS NUMERIC)
                    END
                ),
                0
            ) / CAST(REGEXP_REPLACE(COALESCE(ii.quantity, '0'), '[^0-9.]', '', 'g') AS NUMERIC)
            ELSE 0
        END,
        2
    ) AS "Unit Cost",
    ROUND(
        CASE
            WHEN CAST(REGEXP_REPLACE(COALESCE(ii.quantity, '0'), '[^0-9.]', '', 'g') AS NUMERIC) > 0
            THEN (
                CAST(REGEXP_REPLACE(COALESCE(ii.total_bcy, '0'), '[^0-9.]', '', 'g') AS NUMERIC) -
                COALESCE(
                    SUM(
                        CASE
                            WHEN fm.total_bcy IS NULL OR fm.total_bcy = '' THEN 0
                            ELSE CAST(REGEXP_REPLACE(fm.total_bcy, '[^0-9.]', '', 'g') AS NUMERIC)
                        END
                    ),
                    0
                )
            ) / CAST(REGEXP_REPLACE(COALESCE(ii.quantity, '0'), '[^0-9.]', '', 'g') AS NUMERIC)
            ELSE 0
        END,
        2
    ) AS "Unit Profit",
    sp.name AS "Sales Person Name",
    i.invoice_status AS "Invoice Status"
FROM invoices i
JOIN invoice_items ii ON i.invoice_id = ii.invoice_id
LEFT JOIN stock_out_flow_table sof ON ii.item_id = sof.invoice_item_id
LEFT JOIN fifo_mapping_table fm ON sof.stock_out_flow_id = fm.stock_out_flow_id
LEFT JOIN stock_in_flow_table sif ON fm.stock_in_flow_id = sif.stock_in_flow_id
JOIN customers c ON i.customer_id = c.customer_id
LEFT JOIN sales_persons sp ON i.sales_person_id = sp.sales_person_id
LEFT JOIN branch b ON i.location_id = b.location_id
WHERE i.invoice_status <> 'Void'
  AND i.invoice_number NOT ILIKE 'GINV%'           -- Exclude GINV invoices
  AND i.invoice_number NOT ILIKE 'Opening%'        -- Exclude opening balance entries
GROUP BY
    i.invoice_number,
    i.invoice_date,
    ii.item_name,
    ii.quantity,
    ii.total_bcy,
    c.customer_name,
    b.location_name,
    sp.name,
    i.invoice_status

UNION ALL

-- CREDIT NOTES SECTION
SELECT
    cn.credit_note_number AS "Inv No",
    cn.credit_note_date::date AS "Inv Date",
    cni.item_name AS "Item",
    CAST(REGEXP_REPLACE(COALESCE(cni.quantity, '0'), '[^0-9.]', '', 'g') AS NUMERIC) AS "Qty",
    -1 * CAST(REGEXP_REPLACE(COALESCE(cni.total, '0'), '[^0-9.]', '', 'g') AS NUMERIC) AS "Sale Price",
    ROUND(-1 * CAST(REGEXP_REPLACE(COALESCE(cni.total, '0'), '[^0-9.]', '', 'g') AS NUMERIC) * 1.15, 2) AS "SaleWithVAT",
    -1 * COALESCE(
        SUM(
            CASE
                WHEN sif.total_bcy IS NULL OR sif.total_bcy = '' THEN 0
                ELSE CAST(REGEXP_REPLACE(sif.total_bcy, '[^0-9.]', '', 'g') AS NUMERIC)
            END
        ),
        CAST(REGEXP_REPLACE(COALESCE(cni.total, '0'), '[^0-9.]', '', 'g') AS NUMERIC)
    ) AS "Cost",
    ROUND(
        -1 * CAST(REGEXP_REPLACE(COALESCE(cni.total, '0'), '[^0-9.]', '', 'g') AS NUMERIC) -
        (-1 * COALESCE(
            SUM(
                CASE
                    WHEN sif.total_bcy IS NULL OR sif.total_bcy = '' THEN 0
                    ELSE CAST(REGEXP_REPLACE(sif.total_bcy, '[^0-9.]', '', 'g') AS NUMERIC)
                END
            ),
            CAST(REGEXP_REPLACE(COALESCE(cni.total, '0'), '[^0-9.]', '', 'g') AS NUMERIC)
        )),
        2
    ) AS "Profit",
    0 AS "Profit %",
    c.customer_name AS "Customer Name",
    COALESCE(b.location_name, 'No Branch') AS "Branch Name",
    0 AS "Unit Price",
    0 AS "Unit Cost",
    0 AS "Unit Profit",
    sp.name AS "Sales Person Name",
    cn.credit_note_status AS "Invoice Status"
FROM credit_notes cn
LEFT JOIN credit_note_items cni ON cn.creditnotes_id = cni.creditnotes_id
LEFT JOIN stock_in_flow_table sif ON cni.item_id = sif.credit_notes_item_id
LEFT JOIN customers c ON cn.customer_id = c.customer_id
LEFT JOIN sales_persons sp ON cn.sales_person_id = sp.sales_person_id
LEFT JOIN branch b ON cn.location_id = b.location_id
WHERE cn.credit_note_status <> 'Void'
  AND cn.credit_note_number NOT ILIKE 'GINV%'      -- Exclude GINV credit notes
  AND cn.credit_note_number NOT ILIKE 'Opening%'   -- Exclude opening balance entries
GROUP BY
    cn.credit_note_number,
    cn.credit_note_date,
    cni.item_name,
    cni.quantity,
    cni.total,
    c.customer_name,
    b.location_name,
    sp.name,
    cn.credit_note_status;

-- Recreate dependent views
CREATE OR REPLACE VIEW profit_totals_view AS
SELECT
    SUM("Sale Price") AS "Total Sales",
    SUM("Cost") AS "Total Cost",
    SUM("Profit") AS "Total Profit",
    CASE
        WHEN SUM("Sale Price") > 0
        THEN ROUND((SUM("Profit") / SUM("Sale Price")) * 100, 2)
        ELSE 0
    END AS "Overall Profit %"
FROM profit_analysis_view_current;

CREATE OR REPLACE VIEW profit_by_branch_view AS
SELECT
    "Branch Name",
    COUNT(*) AS "Transaction Count",
    SUM("Sale Price") AS "Total Sales",
    SUM("Cost") AS "Total Cost",
    SUM("Profit") AS "Total Profit",
    CASE
        WHEN SUM("Sale Price") > 0
        THEN ROUND((SUM("Profit") / SUM("Sale Price")) * 100, 2)
        ELSE 0
    END AS "Profit %"
FROM profit_analysis_view_current
GROUP BY "Branch Name"
ORDER BY "Total Sales" DESC;

-- Verification query
SELECT
    'Migration Complete' AS status,
    COUNT(*) AS total_rows,
    SUM("Sale Price") AS total_sales
FROM profit_analysis_view_current;
