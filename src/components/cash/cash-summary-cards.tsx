'use client';

import { ArrowDown, ArrowUp, Banknote, Building2 } from 'lucide-react';
import type { CashKPIs } from '@/types/cash';
import { formatCurrency } from '@/lib/formatting';
import { useLocale } from '@/i18n/locale-provider';

interface CashSummaryCardsProps {
  kpis: CashKPIs | undefined;
  isLoading: boolean;
}

export function CashSummaryCards({ kpis, isLoading }: CashSummaryCardsProps) {
  const { t } = useLocale();
  if (isLoading || !kpis) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="rounded-lg border bg-card p-6">
              <div className="h-4 bg-muted rounded w-1/2 mb-2"></div>
              <div className="h-8 bg-muted rounded w-3/4"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const netCashFlowPositive = kpis.net_cash_flow >= 0;
  const bankPercentage = kpis.bank_total + kpis.cash_total > 0
    ? (kpis.bank_total / (kpis.bank_total + kpis.cash_total)) * 100
    : 0;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Total Debits */}
      <div className="rounded-lg border bg-card">
        <div className="p-6">
          <div className="flex items-center justify-between space-x-2">
            <p className="text-sm font-medium text-muted-foreground">{t("pages.cash.kpis.total_debits")}</p>
            <ArrowDown className="h-4 w-4 text-green-500" />
          </div>
          <div className="mt-2">
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(kpis.total_debits)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {t("pages.cash.kpis.money_in")}
            </p>
          </div>
        </div>
      </div>

      {/* Total Credits */}
      <div className="rounded-lg border bg-card">
        <div className="p-6">
          <div className="flex items-center justify-between space-x-2">
            <p className="text-sm font-medium text-muted-foreground">{t("pages.cash.kpis.total_credits")}</p>
            <ArrowUp className="h-4 w-4 text-red-500" />
          </div>
          <div className="mt-2">
            <p className="text-2xl font-bold text-red-600">
              {formatCurrency(kpis.total_credits)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {t("pages.cash.kpis.money_out")}
            </p>
          </div>
        </div>
      </div>

      {/* Net Cash Flow */}
      <div className="rounded-lg border bg-card">
        <div className="p-6">
          <div className="flex items-center justify-between space-x-2">
            <p className="text-sm font-medium text-muted-foreground">{t("pages.cash.kpis.net_cash_flow")}</p>
            {netCashFlowPositive ? (
              <ArrowUp className="h-4 w-4 text-red-500" />
            ) : (
              <ArrowDown className="h-4 w-4 text-green-500" />
            )}
          </div>
          <div className="mt-2">
            <p className={`text-2xl font-bold ${netCashFlowPositive ? 'text-red-600' : 'text-green-600'}`}>
              {formatCurrency(Math.abs(kpis.net_cash_flow))}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {netCashFlowPositive ? t("pages.cash.kpis.deficit") : t("pages.cash.kpis.surplus")}
            </p>
          </div>
        </div>
      </div>

      {/* Transactions */}
      <div className="rounded-lg border bg-card">
        <div className="p-6">
          <div className="flex items-center justify-between space-x-2">
            <p className="text-sm font-medium text-muted-foreground">{t("pages.cash.kpis.transactions")}</p>
            <Banknote className="h-4 w-4 text-blue-500" />
          </div>
          <div className="mt-2">
            <p className="text-2xl font-bold">{kpis.transaction_count.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {t("pages.cash.kpis.total_records")}
            </p>
          </div>
        </div>
      </div>

      {/* Bank Total - Spans 2 columns on large screens */}
      <div className="rounded-lg border bg-card lg:col-span-2">
        <div className="p-6">
          <div className="flex items-center justify-between space-x-2">
            <p className="text-sm font-medium text-muted-foreground">{t("pages.cash.kpis.bank_accounts")}</p>
            <Building2 className="h-4 w-4 text-blue-500" />
          </div>
          <div className="mt-2 flex items-end justify-between">
            <div>
              <p className="text-2xl font-bold">{formatCurrency(kpis.bank_total)}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {kpis.bank_transactions.toLocaleString()} {t("pages.cash.table.transactions_count")} ({bankPercentage.toFixed(1)}%)
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Cash Total - Spans 2 columns on large screens */}
      <div className="rounded-lg border bg-card lg:col-span-2">
        <div className="p-6">
          <div className="flex items-center justify-between space-x-2">
            <p className="text-sm font-medium text-muted-foreground">{t("pages.cash.kpis.cash_accounts")}</p>
            <Banknote className="h-4 w-4 text-green-500" />
          </div>
          <div className="mt-2 flex items-end justify-between">
            <div>
              <p className="text-2xl font-bold">{formatCurrency(kpis.cash_total)}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {kpis.cash_transactions.toLocaleString()} {t("pages.cash.table.transactions_count")} ({(100 - bankPercentage).toFixed(1)}%)
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
