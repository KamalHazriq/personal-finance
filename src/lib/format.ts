/**
 * Format a number as Malaysian Ringgit (RM).
 * Supports future multi-currency by accepting an optional currency code.
 */
export function formatCurrency(
  value: number | null | undefined,
  currency: string = 'MYR'
): string {
  if (value === null || value === undefined) return 'RM 0.00';

  const prefix = currency === 'MYR' ? 'RM' : currency;
  const isNegative = value < 0;
  const absVal = Math.abs(value);

  const formatted = absVal.toLocaleString('en-MY', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return `${isNegative ? '-' : ''}${prefix} ${formatted}`;
}

/**
 * Format a number as a compact currency (e.g., RM 12.5K)
 */
export function formatCurrencyCompact(value: number): string {
  const isNegative = value < 0;
  const absVal = Math.abs(value);

  let formatted: string;
  if (absVal >= 1_000_000) {
    formatted = `${(absVal / 1_000_000).toFixed(1)}M`;
  } else if (absVal >= 1_000) {
    formatted = `${(absVal / 1_000).toFixed(1)}K`;
  } else {
    formatted = absVal.toFixed(2);
  }

  return `${isNegative ? '-' : ''}RM ${formatted}`;
}

/**
 * Format a percentage with +/- sign
 */
export function formatPercent(value: number | null | undefined): string {
  if (value === null || value === undefined) return '0.00%';
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

/**
 * Format a change value with +/- and currency
 */
export function formatChange(value: number | null | undefined): string {
  if (value === null || value === undefined) return 'RM 0.00';
  const sign = value > 0 ? '+' : '';
  return `${sign}${formatCurrency(value)}`;
}

/**
 * Get month_date string (first day of month) from a Date or string
 */
export function toMonthDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}-01`;
}

/**
 * Format a month_date (YYYY-MM-01) to readable format
 */
export function formatMonth(monthDate: string): string {
  const d = new Date(monthDate + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

/**
 * Format a month_date to short format (e.g., "Mar 2025")
 */
export function formatMonthShort(monthDate: string): string {
  const d = new Date(monthDate + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

/**
 * Get the previous month's date string
 */
export function getPreviousMonth(monthDate: string): string {
  const d = new Date(monthDate + 'T00:00:00');
  d.setMonth(d.getMonth() - 1);
  return toMonthDate(d);
}

/**
 * Get the next month's date string
 */
export function getNextMonth(monthDate: string): string {
  const d = new Date(monthDate + 'T00:00:00');
  d.setMonth(d.getMonth() + 1);
  return toMonthDate(d);
}

/**
 * Get the same month from the previous year
 */
export function getSameMonthLastYear(monthDate: string): string {
  const d = new Date(monthDate + 'T00:00:00');
  d.setFullYear(d.getFullYear() - 1);
  return toMonthDate(d);
}

/**
 * Get the current month as a month_date string
 */
export function getCurrentMonth(): string {
  return toMonthDate(new Date());
}

/**
 * Parse a numeric value, returning 0 for invalid inputs
 */
export function parseNumericValue(val: string | number | null | undefined): number {
  if (val === null || val === undefined || val === '') return 0;
  const num = typeof val === 'string' ? parseFloat(val.replace(/,/g, '')) : val;
  return isNaN(num) ? 0 : num;
}
