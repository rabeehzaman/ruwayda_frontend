"use client"

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { CashKPIs, CashFilters } from '@/types/cash';

export function useCashKPIs(filters?: CashFilters) {
  const [data, setData] = useState<CashKPIs | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchKPIs() {
      try {
        setIsLoading(true);
        setError(null);

        const { data: kpis, error: fetchError } = await supabase.rpc('get_cash_kpis', {
          start_date: filters?.startDate || null,
          end_date: filters?.endDate || null,
          location_ids: filters?.locationIds || null,
          account_ids: filters?.accountIds || null,
          entity_types: filters?.entityTypes || null,
          debit_or_credit_filter: filters?.debitOrCredit || null,
        });

        if (fetchError) {
          console.error('Error fetching cash KPIs:', fetchError);
          setError(fetchError.message);
          return;
        }

        setData(kpis as CashKPIs);
      } catch (err) {
        console.error('Error in fetchKPIs:', err);
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    }

    fetchKPIs();
  }, [
    filters?.startDate,
    filters?.endDate,
    filters?.locationIds?.join(','),
    filters?.accountIds?.join(','),
    filters?.entityTypes?.join(','),
    filters?.debitOrCredit,
  ]);

  return { data, isLoading, error };
}
