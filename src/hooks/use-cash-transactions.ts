"use client"

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { CashTransaction, CashFilters } from '@/types/cash';

interface PaginationMeta {
  totalCount: number;
  totalPages: number;
  currentPage: number;
}

export function useCashTransactions(filters?: CashFilters, page = 1, pageSize = 50) {
  const [data, setData] = useState<CashTransaction[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    totalCount: 0,
    totalPages: 0,
    currentPage: 1,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTransactions() {
      try {
        setIsLoading(true);
        setError(null);

        // Use RPC function for server-side filtering and pagination
        const { data: transactions, error: fetchError } = await supabase.rpc(
          'get_cash_transactions_paginated',
          {
            start_date: filters?.startDate || null,
            end_date: filters?.endDate || null,
            location_ids: filters?.locationIds || null,
            account_ids: filters?.accountIds || null,
            entity_types: filters?.entityTypes || null,
            debit_or_credit_filter: filters?.debitOrCredit || null,
            min_amount: filters?.minAmount || null,
            max_amount: filters?.maxAmount || null,
            search_query: filters?.searchQuery || null,
            page_number: page,
            page_size: pageSize,
          }
        );

        if (fetchError) {
          console.error('Error fetching cash transactions:', fetchError);
          setError(fetchError.message);
          return;
        }

        if (transactions && transactions.length > 0) {
          // Extract pagination metadata from first row
          const firstRow = transactions[0];
          setPagination({
            totalCount: Number(firstRow.total_count),
            totalPages: Number(firstRow.total_pages),
            currentPage: Number(firstRow.current_page),
          });

          // Set transaction data (without pagination metadata)
          setData(transactions as CashTransaction[]);
        } else {
          setData([]);
          setPagination({
            totalCount: 0,
            totalPages: 0,
            currentPage: 1,
          });
        }
      } catch (err) {
        console.error('Error in fetchTransactions:', err);
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    }

    fetchTransactions();
  }, [
    filters?.startDate,
    filters?.endDate,
    filters?.locationIds?.join(','),
    filters?.accountIds?.join(','),
    filters?.entityTypes?.join(','),
    filters?.debitOrCredit,
    filters?.minAmount,
    filters?.maxAmount,
    filters?.searchQuery,
    page,
    pageSize,
  ]);

  return { data, pagination, isLoading, error };
}

export function useCashAccounts() {
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAccounts() {
      try {
        setIsLoading(true);
        setError(null);

        const { data: accounts, error: fetchError } = await supabase
          .from('accounts')
          .select('account_id, account_name, account_type, account_code')
          .in('account_type', ['Cash', 'Bank'])
          .order('account_name');

        if (fetchError) {
          console.error('Error fetching cash accounts:', fetchError);
          setError(fetchError.message);
          return;
        }

        setData(accounts || []);
      } catch (err) {
        console.error('Error in fetchAccounts:', err);
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    }

    fetchAccounts();
  }, []);

  return { data, isLoading, error };
}
