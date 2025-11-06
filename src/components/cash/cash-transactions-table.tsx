'use client';

import { useState } from 'react';
import type { CashTransaction } from '@/types/cash';
import { ENTITY_TYPE_LABELS, ENTITY_TYPE_COLORS, ENTITY_TYPE_TRANSLATION_KEYS } from '@/types/cash';
import { formatCurrency } from '@/lib/formatting';
import { useLocale } from '@/i18n/locale-provider';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowDown, ArrowUp, Banknote, Building2 } from 'lucide-react';

interface PaginationMeta {
  totalCount: number;
  totalPages: number;
  currentPage: number;
}

interface CashTransactionsTableProps {
  transactions: CashTransaction[];
  isLoading: boolean;
  pagination?: PaginationMeta;
  onPageChange?: (page: number) => void;
}

export function CashTransactionsTable({
  transactions,
  isLoading,
  pagination,
  onPageChange
}: CashTransactionsTableProps) {
  const { t } = useLocale();

  // Use server-side pagination if available, otherwise fallback to client-side
  const totalPages = pagination?.totalPages || Math.ceil(transactions.length / 50);
  const currentPage = pagination?.currentPage || 1;
  const totalCount = pagination?.totalCount || transactions.length;

  if (isLoading) {
    return (
      <div className="rounded-lg border bg-card">
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="h-12 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="rounded-lg border bg-card">
        <div className="p-12 text-center">
          <Banknote className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">{t("pages.cash.table.no_transactions")}</h3>
          <p className="text-sm text-muted-foreground">
            {t("pages.cash.table.adjust_filters")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">
            {t("pages.cash.kpis.transactions")} ({totalCount.toLocaleString()} {t("pages.cash.table.records_count")})
          </h3>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              {t("pages.cash.table.export_excel")}
            </Button>
            <Button variant="outline" size="sm">
              {t("pages.cash.table.export_csv")}
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("pages.cash.table.date")}</TableHead>
                <TableHead>{t("pages.cash.table.trans_number")}</TableHead>
                <TableHead>{t("pages.cash.table.account")}</TableHead>
                <TableHead>{t("pages.cash.table.type")}</TableHead>
                <TableHead>{t("pages.cash.table.party")}</TableHead>
                <TableHead>{t("pages.cash.table.branch")}</TableHead>
                <TableHead className="text-right">{t("pages.cash.table.debit_in")}</TableHead>
                <TableHead className="text-right">{t("pages.cash.table.credit_out")}</TableHead>
                <TableHead>{t("pages.cash.table.reference")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((transaction) => {
                const entityType = transaction.entity_type as keyof typeof ENTITY_TYPE_LABELS;

                // Determine party name based on transaction type
                let partyName = '-';
                if (transaction.entity_type === 'transfer_fund' && transaction.transfer_account_name) {
                  partyName = transaction.debit_or_credit === 'debit'
                    ? `${t("pages.cash.table.from")} ${transaction.transfer_account_name}`
                    : `${t("pages.cash.table.to_transfer")} ${transaction.transfer_account_name}`;
                } else if (transaction.entity_type === 'expense' && transaction.expense_account_name) {
                  partyName = transaction.expense_account_name;
                } else if (transaction.entity_type === 'journal' && transaction.journal_account_name) {
                  partyName = transaction.journal_account_name;
                } else {
                  partyName = transaction.customer_name || transaction.vendor_name || '-';
                }

                // Determine reference display (enhanced for journal entries)
                let referenceDisplay = transaction.reference_no || transaction.reference_number || '-';
                // For journal entries with loan accounts, append "EMI" if reference looks like a month/year pattern
                if (transaction.entity_type === 'journal' &&
                    transaction.journal_account_name?.toUpperCase().includes('LOAN') &&
                    transaction.reference_no &&
                    /\w+\s+\d{4}/i.test(transaction.reference_no)) {
                  referenceDisplay = `${transaction.reference_no} EMI`;
                }

                return (
                  <TableRow key={transaction.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium whitespace-nowrap">
                      {transaction.transaction_date}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {transaction.transaction_number}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {transaction.account_type === 'Bank' ? (
                          <Building2 className="h-4 w-4 text-blue-500 flex-shrink-0" />
                        ) : (
                          <Banknote className="h-4 w-4 text-green-500 flex-shrink-0" />
                        )}
                        <span className="truncate" title={transaction.account_name}>
                          {transaction.account_name}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={ENTITY_TYPE_COLORS[entityType]}>
                        {ENTITY_TYPE_TRANSLATION_KEYS[transaction.entity_type]
                          ? t(ENTITY_TYPE_TRANSLATION_KEYS[transaction.entity_type])
                          : (ENTITY_TYPE_LABELS[entityType] || transaction.entity_type)}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate" title={partyName}>
                      {partyName}
                    </TableCell>
                    <TableCell className="max-w-[150px] truncate" title={transaction.branch_name || '-'}>
                      {transaction.branch_name || '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      {transaction.debit_amount > 0 ? (
                        <span className="text-green-600 font-medium flex items-center justify-end gap-1">
                          <ArrowDown className="h-3 w-3" />
                          {formatCurrency(transaction.debit_amount)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {transaction.credit_amount > 0 ? (
                        <span className="text-red-600 font-medium flex items-center justify-end gap-1">
                          <ArrowUp className="h-3 w-3" />
                          {formatCurrency(transaction.credit_amount)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="max-w-[150px] truncate" title={referenceDisplay}>
                      {referenceDisplay}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">
              {t("pages.cash.table.showing")} {((currentPage - 1) * 50) + 1} {t("pages.cash.table.to")} {Math.min(currentPage * 50, totalCount)} {t("pages.cash.table.of")}{' '}
              {totalCount} {t("pages.cash.table.transactions_count")}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange?.(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                {t("pages.cash.table.previous")}
              </Button>
              <div className="text-sm">
                {t("pages.cash.table.page")} {currentPage} {t("pages.cash.table.of")} {totalPages}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange?.(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
              >
                {t("pages.cash.table.next")}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
