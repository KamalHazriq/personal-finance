export type CategoryType = 'asset' | 'liability' | 'income';
export type AccountType = 'bank' | 'investment' | 'liability' | 'income' | 'cash' | 'crypto' | 'retirement' | 'gold' | 'ewallet';
export type ValueSource = 'manual' | 'import';
export type ImportStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type ImportRowStatus = 'pending' | 'success' | 'failed' | 'skipped' | 'duplicate';
export type GoalType = 'net_worth' | 'net_worth_ex_locked' | 'category_total' | 'account_value';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  currency: string;
  created_at: string;
  updated_at: string;
}

export interface AccountCategory {
  id: string;
  user_id: string;
  name: string;
  type: CategoryType;
  sort_order: number;
  created_at: string;
}

export interface Account {
  id: string;
  user_id: string;
  category_id: string;
  name: string;
  account_type: AccountType;
  institution: string | null;
  currency: string;
  is_locked_fund: boolean;
  is_active: boolean;
  notes: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
  // Joined fields
  category?: AccountCategory;
}

export interface MonthlyAccountValue {
  id: string;
  user_id: string;
  account_id: string;
  month_date: string; // YYYY-MM-DD (first of month)
  value: number;
  source: ValueSource;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  account?: Account;
}

export interface MonthlySnapshot {
  id: string;
  user_id: string;
  month_date: string;
  total_assets: number;
  total_liabilities: number;
  net_worth: number;
  net_worth_ex_locked: number;
  total_locked_assets: number;
  mom_change: number;
  mom_change_pct: number;
  yoy_change: number;
  yoy_change_pct: number;
  created_at: string;
  updated_at: string;
}

export interface Goal {
  id: string;
  user_id: string;
  title: string;
  goal_type: GoalType;
  target_value: number;
  target_date: string;
  target_account_id: string | null;
  target_category_id: string | null;
  start_value: number;
  start_date: string;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface Import {
  id: string;
  user_id: string;
  filename: string;
  import_status: ImportStatus;
  total_rows: number;
  success_rows: number;
  failed_rows: number;
  skipped_rows: number;
  mapping_json: Record<string, unknown> | null;
  created_at: string;
}

export interface ImportRow {
  id: string;
  import_id: string;
  user_id: string;
  raw_data: Record<string, unknown>;
  status: ImportRowStatus;
  error_message: string | null;
  resolved_account_id: string | null;
  month_date: string | null;
  value: number | null;
}

// View types for the dashboard
export interface DashboardSummary {
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  netWorthExLocked: number;
  totalLockedAssets: number;
  momChange: number;
  momChangePct: number;
  yoyChange: number;
  yoyChangePct: number;
  currentMonth: string;
}

export interface CategoryBreakdown {
  categoryId: string;
  categoryName: string;
  categoryType: CategoryType;
  total: number;
  accounts: {
    accountId: string;
    accountName: string;
    value: number;
    isLockedFund: boolean;
    change: number;
  }[];
}

export interface MonthlyUpdateEntry {
  accountId: string;
  accountName: string;
  categoryId: string;
  categoryName: string;
  categoryType: CategoryType;
  isLockedFund: boolean;
  currentValue: number | null;
  previousValue: number | null;
  change: number | null;
  valueId: string | null; // existing monthly_account_values.id
}

export interface GoalProgress {
  goal: Goal;
  currentValue: number;
  progressPct: number;
  remainingAmount: number;
  monthsRemaining: number;
  requiredMonthlyPace: number;
  projectedDate: string | null;
  isOnTrack: boolean;
}
