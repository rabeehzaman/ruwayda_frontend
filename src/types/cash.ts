// Types for Cash Transactions feature

export interface CashTransaction {
  id: number;
  cash_transaction_id: string;
  transaction_date: string;
  transaction_number: string;
  entity_type: string;
  entity_id: string;

  // Account details
  account_id: string;
  account_name: string;
  account_type: 'Cash' | 'Bank';
  account_code: string | null;

  // Amount details
  transaction_amount: number;
  debit_or_credit: 'debit' | 'credit';
  debit_amount: number;
  credit_amount: number;

  // Branch details
  location_id: string;
  branch_name: string | null;

  // Party details
  customer_id: string | null;
  customer_name: string | null;
  vendor_id: string | null;
  vendor_name: string | null;

  // Reference details
  reference_number: string | null;
  reference_no: string | null;
  currency_code: string;

  // Audit fields
  last_modified_time: string | null;
  created_at: string;
  updated_at: string;

  // Transfer details (for transfer_fund transactions)
  transfer_account_name: string | null;

  // Expense details (for expense transactions)
  expense_account_name: string | null;

  // Journal details (for journal transactions)
  journal_account_name: string | null;
}

export interface CashKPIs {
  total_debits: number;
  total_credits: number;
  net_cash_flow: number;
  transaction_count: number;
  bank_total: number;
  cash_total: number;
  bank_transactions: number;
  cash_transactions: number;
  largest_debit: number;
  largest_credit: number;
  average_transaction: number;
}

export interface CashFilters {
  startDate?: string;
  endDate?: string;
  locationIds?: string[];
  accountIds?: string[];
  entityTypes?: string[];
  debitOrCredit?: 'debit' | 'credit';
  searchQuery?: string;
  minAmount?: number;
  maxAmount?: number;
}

export interface CashAccount {
  account_id: string;
  account_name: string;
  account_type: 'Cash' | 'Bank';
  account_code: string | null;
  transaction_count: number;
}

export type EntityType =
  | 'invoice_payment'
  | 'bill_payment'
  | 'transfer_fund'
  | 'customer_payment'
  | 'expense'
  | 'vendor_payment'
  | 'journal'
  | 'other_income'
  | 'deposit';

// Translation key mapping for entity types
export const ENTITY_TYPE_TRANSLATION_KEYS: Record<string, string> = {
  invoice: 'pages.cash.entity_types.invoice',
  bill: 'pages.cash.entity_types.bill',
  credit_note: 'pages.cash.entity_types.credit_note',
  expense: 'pages.cash.entity_types.expense',
  transfer_fund: 'pages.cash.entity_types.transfer_fund',
  opening_balance: 'pages.cash.entity_types.opening_balance',
  journal: 'pages.cash.entity_types.journal',
  vendor_payment: 'pages.cash.entity_types.vendor_payment',
  customer_payment: 'pages.cash.entity_types.customer_payment',
};

// Legacy: Keep for backwards compatibility, but prefer using translation keys
export const ENTITY_TYPE_LABELS: Record<EntityType, string> = {
  invoice_payment: 'Invoice Payment',
  bill_payment: 'Bill Payment',
  transfer_fund: 'Transfer Fund',
  customer_payment: 'Customer Payment',
  expense: 'Expense',
  vendor_payment: 'Vendor Payment',
  journal: 'Journal Entry',
  other_income: 'Other Income',
  deposit: 'Deposit',
};

export const ENTITY_TYPE_COLORS: Record<EntityType, string> = {
  invoice_payment: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  bill_payment: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  transfer_fund: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  customer_payment: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  expense: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  vendor_payment: 'bg-secondary/20 text-secondary-foreground dark:bg-secondary/30 dark:text-secondary-foreground',
  journal: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
  other_income: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300',
  deposit: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-300',
};
