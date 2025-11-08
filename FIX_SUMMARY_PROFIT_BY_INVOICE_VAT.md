# Profit by Invoice VAT Fix Summary

## Issue Identified
The profit by invoice table was showing sales values **less than** the KPI revenue, causing user confusion.

### Root Cause
- **KPI "Total Revenue"**: 781,909.14 SAR (sales WITH 15% VAT)
- **Profit by Invoice "Sale Value"**: 679,920.99 SAR (sales WITHOUT VAT)
- **Discrepancy**: 101,989.40 SAR (the VAT amount)

The `get_profit_by_invoice_2025_filtered` function was returning `SUM("Sale Price")` (without VAT) while the KPI was displaying `totalRevenue` (with VAT).

## Solution Applied

### 1. Database Function Update (`fix_profit_by_invoice_include_vat` migration)

**File**: Applied via Supabase MCP
**Changes**:
- Updated `get_profit_by_invoice_2025_filtered` function to return:
  - `sale_value`: NOW contains sales **WITH VAT** (to match KPI)
  - `sale_without_vat`: NEW field with sales **WITHOUT VAT** (for detailed analysis)

**SQL Changes**:
```sql
-- Before:
SUM("Sale Price")::numeric as sale_value

-- After:
SUM("SaleWithVAT")::numeric as sale_value,        -- Changed: Now WITH VAT
SUM("Sale Price")::numeric as sale_without_vat    -- New: WITHOUT VAT
```

### 2. TypeScript Interface Update

**File**: `src/lib/database-optimized.ts`
**Changes**:
- Added `sale_without_vat: number` to `OptimizedInvoice` interface (line 108)

### 3. Data Mapping Logic Update

**File**: `src/lib/database-optimized.ts`
**Changes**: Updated the `getOptimizedProfitByInvoice` function mapping (lines 565-586)

**Before**:
```typescript
const saleWithVat = item.sale_value as number || 0
const taxableSales = saleWithVat / 1.15  // WRONG: Was dividing by 1.15
```

**After**:
```typescript
const saleWithVat = item.sale_value as number || 0  // NOW: Already WITH VAT
const saleWithoutVat = item.sale_without_vat as number || 0  // NEW field
```

## Verification Results

### Final Numbers:
- **KPI Total Revenue (WITH VAT)**: 781,909.14 SAR
- **Table Total (NOW WITH VAT)**: 781,910.39 SAR
- **Difference**: 1.25 SAR (0.0002%)

✅ **Status**: FIXED - Values now match within rounding tolerance

### What Changed for Users:
1. **Profit by Invoice Table** now shows the same total revenue as KPI
2. **Sales values** in the table now include VAT (matching KPI display)
3. **Export functionality** continues to work correctly
4. **No breaking changes** to existing functionality

## Files Modified

1. **Database**:
   - Migration: `fix_profit_by_invoice_include_vat`
   - Function: `get_profit_by_invoice_2025_filtered`

2. **Frontend**:
   - `src/lib/database-optimized.ts` (interface + mapping logic)

## Testing

### Database Level:
```sql
-- Test query confirms fix:
SELECT
  SUM(sale_value) as total_with_vat,
  SUM(sale_without_vat) as total_without_vat
FROM get_profit_by_invoice_2025_filtered(NULL, NULL, NULL, NULL);
-- Result: 781,910.39 SAR (with VAT) ✅
```

### Expected Behavior:
- Dashboard KPIs and Profit by Invoice table now show matching revenue totals
- The 101,989 SAR discrepancy is resolved
- Users see consistent numbers across all views

## Migration Applied

✅ Migration successfully applied via Supabase MCP
✅ TypeScript types updated
✅ Data mapping logic corrected
✅ Verification tests passed

---

**Date**: 2025-11-08
**Issue**: Profit by Invoice table showing sales less than KPI
**Resolution**: Updated function to return sales WITH VAT to match KPI display
**Status**: ✅ FIXED
