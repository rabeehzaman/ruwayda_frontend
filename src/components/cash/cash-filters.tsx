'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, X } from 'lucide-react';
import type { CashFilters } from '@/types/cash';
import { ENTITY_TYPE_LABELS, ENTITY_TYPE_TRANSLATION_KEYS } from '@/types/cash';
import { useCashAccounts } from '@/hooks/use-cash-transactions';
import { supabase } from '@/lib/supabase';
import { useLocale } from '@/i18n/locale-provider';

interface CashFiltersProps {
  filters: CashFilters;
  onFiltersChange: (filters: CashFilters) => void;
}

export function CashFiltersComponent({ filters, onFiltersChange }: CashFiltersProps) {
  const { t } = useLocale();
  const { data: accounts = [], isLoading: isLoadingAccounts } = useCashAccounts();
  const [branches, setBranches] = useState<Array<{location_id: string; location_name: string}>>([]);
  const [isLoadingBranches, setIsLoadingBranches] = useState(true);

  const [localSearch, setLocalSearch] = useState(filters.searchQuery || '');

  useEffect(() => {
    async function fetchBranches() {
      try {
        const { data, error } = await supabase
          .from('branch')
          .select('location_id, location_name')
          .order('location_name');

        if (error) {
          console.error('Error fetching branches:', error);
        } else {
          setBranches(data || []);
        }
      } catch (err) {
        console.error('Error in fetchBranches:', err);
      } finally {
        setIsLoadingBranches(false);
      }
    }

    fetchBranches();
  }, []);

  const handleSearchChange = (value: string) => {
    setLocalSearch(value);
    onFiltersChange({ ...filters, searchQuery: value || undefined });
  };

  const handleClearFilters = () => {
    setLocalSearch('');
    onFiltersChange({});
  };

  const hasActiveFilters =
    filters.startDate ||
    filters.endDate ||
    filters.locationIds?.length ||
    filters.accountIds?.length ||
    filters.entityTypes?.length ||
    filters.debitOrCredit ||
    filters.searchQuery ||
    filters.minAmount !== undefined ||
    filters.maxAmount !== undefined;

  return (
    <div className="rounded-lg border bg-card p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{t("pages.cash.filters.title")}</h3>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={handleClearFilters}>
            <X className="h-4 w-4 mr-1" />
            {t("pages.cash.filters.clear_filters")}
          </Button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Date Range */}
        <div className="space-y-2">
          <Label htmlFor="start-date">{t("common.date")} ({t("common.from")})</Label>
          <Input
            id="start-date"
            type="date"
            value={filters.startDate || ''}
            onChange={(e) =>
              onFiltersChange({ ...filters, startDate: e.target.value || undefined })
            }
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="end-date">{t("common.date")} ({t("common.to")})</Label>
          <Input
            id="end-date"
            type="date"
            value={filters.endDate || ''}
            onChange={(e) =>
              onFiltersChange({ ...filters, endDate: e.target.value || undefined })
            }
          />
        </div>

        {/* Account Filter */}
        <div className="space-y-2">
          <Label htmlFor="account">{t("pages.cash.filters.account")}</Label>
          <Select
            value={filters.accountIds?.[0] || 'all'}
            onValueChange={(value) =>
              onFiltersChange({
                ...filters,
                accountIds: value === 'all' ? undefined : [value],
              })
            }
          >
            <SelectTrigger id="account">
              <SelectValue placeholder={t("pages.cash.filters.all_accounts")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("pages.cash.filters.all_accounts")}</SelectItem>
              {!isLoadingAccounts && (
                <>
                  <SelectItem value="bank" disabled className="font-semibold">
                    🏦 {t("pages.cash.kpis.bank_accounts")}
                  </SelectItem>
                  {accounts
                    .filter((a) => a.account_type === 'Bank')
                    .map((account) => (
                      <SelectItem key={account.account_id} value={account.account_id}>
                        &nbsp;&nbsp;{account.account_name}
                      </SelectItem>
                    ))}
                  <SelectItem value="cash" disabled className="font-semibold">
                    💵 {t("pages.cash.kpis.cash_accounts")}
                  </SelectItem>
                  {accounts
                    .filter((a) => a.account_type === 'Cash')
                    .map((account) => (
                      <SelectItem key={account.account_id} value={account.account_id}>
                        &nbsp;&nbsp;{account.account_name}
                      </SelectItem>
                    ))}
                </>
              )}
            </SelectContent>
          </Select>
        </div>

        {/* Branch Filter */}
        <div className="space-y-2">
          <Label htmlFor="branch">{t("pages.cash.filters.branch")}</Label>
          <Select
            value={filters.locationIds?.[0] || 'all'}
            onValueChange={(value) =>
              onFiltersChange({
                ...filters,
                locationIds: value === 'all' ? undefined : [value],
              })
            }
          >
            <SelectTrigger id="branch">
              <SelectValue placeholder={t("pages.cash.filters.all_branches")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("pages.cash.filters.all_branches")}</SelectItem>
              {!isLoadingBranches &&
                branches.map((branch) => (
                  <SelectItem key={branch.location_id} value={branch.location_id}>
                    {branch.location_name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>

        {/* Transaction Type Filter */}
        <div className="space-y-2">
          <Label htmlFor="type">{t("pages.cash.filters.transaction_type")}</Label>
          <Select
            value={filters.entityTypes?.[0] || 'all'}
            onValueChange={(value) =>
              onFiltersChange({
                ...filters,
                entityTypes: value === 'all' ? undefined : [value],
              })
            }
          >
            <SelectTrigger id="type">
              <SelectValue placeholder={t("pages.cash.filters.all_types")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("pages.cash.filters.all_types")}</SelectItem>
              {Object.entries(ENTITY_TYPE_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {ENTITY_TYPE_TRANSLATION_KEYS[key]
                    ? t(ENTITY_TYPE_TRANSLATION_KEYS[key])
                    : label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Debit/Credit Filter */}
        <div className="space-y-2">
          <Label htmlFor="direction">{t("pages.cash.filters.direction")}</Label>
          <Select
            value={filters.debitOrCredit || 'all'}
            onValueChange={(value) =>
              onFiltersChange({
                ...filters,
                debitOrCredit: value === 'all' ? undefined : (value as 'debit' | 'credit'),
              })
            }
          >
            <SelectTrigger id="direction">
              <SelectValue placeholder={t("pages.cash.filters.all_directions")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("pages.cash.filters.all_directions")}</SelectItem>
              <SelectItem value="debit">{t("pages.cash.filters.debit")}</SelectItem>
              <SelectItem value="credit">{t("pages.cash.filters.credit")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Min Amount */}
        <div className="space-y-2">
          <Label htmlFor="min-amount">{t("common.amount")} ({t("common.from")}) (SAR)</Label>
          <Input
            id="min-amount"
            type="number"
            placeholder="0"
            value={filters.minAmount || ''}
            onChange={(e) =>
              onFiltersChange({
                ...filters,
                minAmount: e.target.value ? parseFloat(e.target.value) : undefined,
              })
            }
          />
        </div>

        {/* Max Amount */}
        <div className="space-y-2">
          <Label htmlFor="max-amount">{t("common.amount")} ({t("common.to")}) (SAR)</Label>
          <Input
            id="max-amount"
            type="number"
            placeholder="∞"
            value={filters.maxAmount || ''}
            onChange={(e) =>
              onFiltersChange({
                ...filters,
                maxAmount: e.target.value ? parseFloat(e.target.value) : undefined,
              })
            }
          />
        </div>
      </div>

      {/* Search */}
      <div className="space-y-2">
        <Label htmlFor="search">{t("pages.cash.filters.search")}</Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="search"
            type="text"
            placeholder={t("pages.cash.filters.search_placeholder")}
            value={localSearch}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>
    </div>
  );
}
