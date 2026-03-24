"use client";

import { useState, useCallback, useMemo, useRef, useTransition } from "react";
import {
  Save,
  Copy,
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronDown,
  ChevronRight,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { MonthSelector } from "./month-selector";
import {
  formatCurrency,
  formatChange,
  formatMonth,
  getPreviousMonth,
  parseNumericValue,
} from "@/lib/format";
import { saveMonthlyValues, copyPreviousMonthValues } from "@/lib/actions/monthly-values";
import type { Account, AccountCategory, MonthlyAccountValue, CategoryType } from "@/types/database";

// ─── Types ───────────────────────────────────────────────

interface CategoryGroup {
  category: AccountCategory;
  accounts: Account[];
}

interface MonthlyUpdateFormProps {
  currentMonth: string;
  categories: AccountCategory[];
  accounts: Account[];
  currentValues: MonthlyAccountValue[];
  previousValues: MonthlyAccountValue[];
}

// ─── Toast state ─────────────────────────────────────────

type ToastType = "success" | "error" | null;

interface ToastState {
  type: ToastType;
  message: string;
}

// ─── Component ───────────────────────────────────────────

export function MonthlyUpdateForm({
  currentMonth,
  categories,
  accounts,
  currentValues,
  previousValues,
}: MonthlyUpdateFormProps) {
  // Build lookup maps from server data
  const currentValueMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const v of currentValues) {
      map.set(v.account_id, v.value);
    }
    return map;
  }, [currentValues]);

  const previousValueMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const v of previousValues) {
      map.set(v.account_id, v.value);
    }
    return map;
  }, [previousValues]);

  // State: raw string values per account (what the user types)
  const [values, setValues] = useState<Map<string, string>>(() => {
    const map = new Map<string, string>();
    for (const v of currentValues) {
      map.set(v.account_id, String(v.value));
    }
    return map;
  });

  // Track which fields have been modified by the user
  const [dirtyFields, setDirtyFields] = useState<Set<string>>(new Set());

  // Collapsed category sections (mobile)
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());

  // Toast notification
  const [toast, setToast] = useState<ToastState>({ type: null, message: "" });

  // Saving state
  const [isSaving, startSaveTransition] = useTransition();
  const [isCopying, startCopyTransition] = useTransition();

  // Refs for tab navigation
  const inputRefs = useRef<Map<string, HTMLInputElement>>(new Map());

  // Group accounts by category
  const categoryGroups = useMemo<CategoryGroup[]>(() => {
    const catMap = new Map<string, CategoryGroup>();
    for (const cat of categories) {
      catMap.set(cat.id, { category: cat, accounts: [] });
    }
    for (const acct of accounts) {
      const group = catMap.get(acct.category_id);
      if (group) {
        group.accounts.push(acct);
      }
    }
    // Filter out empty groups and sort by category sort_order
    return Array.from(catMap.values())
      .filter((g) => g.accounts.length > 0)
      .sort((a, b) => a.category.sort_order - b.category.sort_order);
  }, [categories, accounts]);

  // Ordered list of account IDs for tab navigation
  const orderedAccountIds = useMemo(() => {
    return categoryGroups.flatMap((g) => g.accounts.map((a) => a.id));
  }, [categoryGroups]);

  // ─── Helpers ─────────────────────────────────────────────

  const getNumericValue = useCallback(
    (accountId: string): number | null => {
      const raw = values.get(accountId);
      if (raw === undefined || raw === "") return null;
      return parseNumericValue(raw);
    },
    [values]
  );

  const getChange = useCallback(
    (accountId: string): number | null => {
      const current = getNumericValue(accountId);
      const prev = previousValueMap.get(accountId);
      if (current === null) return null;
      if (prev === undefined) return null;
      return current - prev;
    },
    [getNumericValue, previousValueMap]
  );

  const showToast = useCallback((type: ToastType, message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast({ type: null, message: "" }), 4000);
  }, []);

  // ─── Value update ────────────────────────────────────────

  const handleValueChange = useCallback(
    (accountId: string, rawValue: string) => {
      // Strip commas and whitespace for storage, keep as string for input control
      const cleaned = rawValue.replace(/,/g, "");
      setValues((prev) => {
        const next = new Map(prev);
        next.set(accountId, cleaned);
        return next;
      });
      setDirtyFields((prev) => {
        const next = new Set(prev);
        // Compare against original server value
        const originalValue = currentValueMap.get(accountId);
        const numericCleaned = parseNumericValue(cleaned);
        if (
          (originalValue === undefined && cleaned === "") ||
          (originalValue !== undefined && numericCleaned === originalValue)
        ) {
          next.delete(accountId);
        } else {
          next.add(accountId);
        }
        return next;
      });
    },
    [currentValueMap]
  );

  // ─── Focus and select on click ───────────────────────────

  const handleFocus = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    e.target.select();
  }, []);

  // ─── Compute totals ─────────────────────────────────────

  const totals = useMemo(() => {
    let totalAssets = 0;
    let totalLiabilities = 0;
    let prevTotalAssets = 0;
    let prevTotalLiabilities = 0;

    for (const group of categoryGroups) {
      for (const acct of group.accounts) {
        const val = getNumericValue(acct.id);
        const prevVal = previousValueMap.get(acct.id) ?? 0;

        if (group.category.type === "asset") {
          totalAssets += val ?? 0;
          prevTotalAssets += prevVal;
        } else if (group.category.type === "liability") {
          totalLiabilities += val ?? 0;
          prevTotalLiabilities += prevVal;
        }
      }
    }

    const netWorth = totalAssets - totalLiabilities;
    const prevNetWorth = prevTotalAssets - prevTotalLiabilities;

    return {
      totalAssets,
      totalLiabilities,
      netWorth,
      assetChange: totalAssets - prevTotalAssets,
      liabilityChange: totalLiabilities - prevTotalLiabilities,
      netWorthChange: netWorth - prevNetWorth,
    };
  }, [categoryGroups, getNumericValue, previousValueMap]);

  // Category subtotals
  const getCategoryTotal = useCallback(
    (group: CategoryGroup) => {
      let total = 0;
      let prevTotal = 0;
      for (const acct of group.accounts) {
        total += getNumericValue(acct.id) ?? 0;
        prevTotal += previousValueMap.get(acct.id) ?? 0;
      }
      return { total, change: total - prevTotal };
    },
    [getNumericValue, previousValueMap]
  );

  // ─── Save ────────────────────────────────────────────────

  const dirtyCount = dirtyFields.size;

  const handleSave = useCallback(() => {
    startSaveTransition(async () => {
      // Collect all accounts that have values (dirty or not)
      const entries: { accountId: string; value: number }[] = [];
      for (const [accountId, raw] of values) {
        if (raw !== "" && raw !== undefined) {
          entries.push({
            accountId,
            value: parseNumericValue(raw),
          });
        }
      }

      if (entries.length === 0) {
        showToast("error", "No values to save.");
        return;
      }

      const result = await saveMonthlyValues(currentMonth, entries);

      if (result?.error) {
        showToast("error", `Save failed: ${result.error}`);
      } else {
        setDirtyFields(new Set());
        showToast("success", `Saved ${entries.length} account values.`);
      }
    });
  }, [values, currentMonth, showToast]);

  // ─── Copy previous month ─────────────────────────────────

  const handleCopyPrevious = useCallback(() => {
    startCopyTransition(async () => {
      const prevMonth = getPreviousMonth(currentMonth);
      const result = await copyPreviousMonthValues(prevMonth, currentMonth);

      if (result && "error" in result && result.error) {
        showToast("error", result.error);
      } else if (result && "copied" in result) {
        // Update local state with copied values
        const copiedCount = result.copied;
        // Reload by updating values from previousValueMap for accounts without current values
        setValues((prev) => {
          const next = new Map(prev);
          for (const [accountId, value] of previousValueMap) {
            if (!next.has(accountId) || next.get(accountId) === "") {
              next.set(accountId, String(value));
            }
          }
          return next;
        });
        showToast("success", `Copied ${copiedCount} values from previous month.`);
      }
    });
  }, [currentMonth, previousValueMap, showToast]);

  // ─── Toggle category collapse (mobile) ───────────────────

  const toggleCategory = useCallback((categoryId: string) => {
    setCollapsedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  }, []);

  // ─── Change indicator ────────────────────────────────────

  const ChangeIndicator = ({ value }: { value: number | null }) => {
    if (value === null || value === 0) {
      return (
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <Minus className="size-3" />
          <span>No change</span>
        </span>
      );
    }
    if (value > 0) {
      return (
        <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
          <TrendingUp className="size-3" />
          <span>{formatChange(value)}</span>
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 text-xs text-red-600 dark:text-red-400">
        <TrendingDown className="size-3" />
        <span>{formatChange(value)}</span>
      </span>
    );
  };

  // ─── Category type badge ─────────────────────────────────

  const categoryTypeBadge = (type: CategoryType) => {
    switch (type) {
      case "asset":
        return <Badge variant="success">Asset</Badge>;
      case "liability":
        return <Badge variant="destructive">Liability</Badge>;
      default:
        return <Badge variant="secondary">{type}</Badge>;
    }
  };

  // ─── Desktop Table Row ───────────────────────────────────

  const renderDesktopRow = (acct: Account, group: CategoryGroup) => {
    const prevValue = previousValueMap.get(acct.id);
    const rawValue = values.get(acct.id) ?? "";
    const change = getChange(acct.id);
    const isDirty = dirtyFields.has(acct.id);

    return (
      <tr
        key={acct.id}
        className={`border-b border-border/50 transition-colors ${
          isDirty ? "bg-amber-50/50 dark:bg-amber-950/20" : "hover:bg-muted/30"
        }`}
      >
        <td className="px-4 py-2.5">
          <div className="flex items-center gap-2">
            <span className="text-sm">{acct.name}</span>
            {acct.is_locked_fund && (
              <Badge variant="outline" className="text-[10px] px-1 py-0">
                Locked
              </Badge>
            )}
          </div>
          {acct.institution && (
            <span className="text-xs text-muted-foreground">{acct.institution}</span>
          )}
        </td>
        <td className="px-4 py-2.5 text-right text-sm text-muted-foreground tabular-nums">
          {prevValue !== undefined ? formatCurrency(prevValue) : "-"}
        </td>
        <td className="px-4 py-2.5">
          <input
            ref={(el) => {
              if (el) inputRefs.current.set(acct.id, el);
            }}
            type="number"
            step="0.01"
            value={rawValue}
            onChange={(e) => handleValueChange(acct.id, e.target.value)}
            onFocus={handleFocus}
            placeholder="0.00"
            className={`w-full rounded-md border bg-transparent px-3 py-1.5 text-right text-sm tabular-nums transition-colors focus:outline-none focus:ring-2 focus:ring-ring/50 ${
              isDirty
                ? "border-amber-400 dark:border-amber-600"
                : "border-input"
            }`}
            aria-label={`Current value for ${acct.name}`}
          />
        </td>
        <td className="px-4 py-2.5 text-right">
          <ChangeIndicator value={change} />
        </td>
      </tr>
    );
  };

  // ─── Desktop Category Subtotal Row ───────────────────────

  const renderDesktopCategorySubtotal = (group: CategoryGroup) => {
    const { total, change } = getCategoryTotal(group);

    return (
      <tr key={`subtotal-${group.category.id}`} className="border-b border-border bg-muted/30">
        <td className="px-4 py-2 text-right text-xs font-medium text-muted-foreground" colSpan={2}>
          {group.category.name} Total
        </td>
        <td className="px-4 py-2 text-right text-sm font-semibold tabular-nums">
          {formatCurrency(total)}
        </td>
        <td className="px-4 py-2 text-right">
          <ChangeIndicator value={change} />
        </td>
      </tr>
    );
  };

  // ─── Mobile Card ─────────────────────────────────────────

  const renderMobileCard = (acct: Account) => {
    const prevValue = previousValueMap.get(acct.id);
    const rawValue = values.get(acct.id) ?? "";
    const change = getChange(acct.id);
    const isDirty = dirtyFields.has(acct.id);

    return (
      <div
        key={acct.id}
        className={`rounded-lg border p-3 transition-colors ${
          isDirty
            ? "border-amber-400 bg-amber-50/50 dark:border-amber-600 dark:bg-amber-950/20"
            : "border-border"
        }`}
      >
        <div className="mb-2 flex items-center justify-between">
          <div>
            <span className="text-sm font-medium">{acct.name}</span>
            {acct.is_locked_fund && (
              <Badge variant="outline" className="ml-2 text-[10px] px-1 py-0">
                Locked
              </Badge>
            )}
          </div>
          <ChangeIndicator value={change} />
        </div>

        <div className="mb-2 text-xs text-muted-foreground">
          Previous: {prevValue !== undefined ? formatCurrency(prevValue) : "-"}
        </div>

        <input
          type="number"
          step="0.01"
          inputMode="decimal"
          value={rawValue}
          onChange={(e) => handleValueChange(acct.id, e.target.value)}
          onFocus={handleFocus}
          placeholder="0.00"
          className={`w-full rounded-md border bg-transparent px-3 py-2.5 text-right text-base tabular-nums transition-colors focus:outline-none focus:ring-2 focus:ring-ring/50 ${
            isDirty
              ? "border-amber-400 dark:border-amber-600"
              : "border-input"
          }`}
          aria-label={`Current value for ${acct.name}`}
        />
      </div>
    );
  };

  // ─── Render ──────────────────────────────────────────────

  const prevMonth = getPreviousMonth(currentMonth);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold sm:text-2xl">Monthly Update</h1>
          <p className="text-sm text-muted-foreground">
            Enter account values for {formatMonth(currentMonth)}
          </p>
        </div>
        <MonthSelector currentMonth={currentMonth} />
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopyPrevious}
          disabled={isCopying}
        >
          {isCopying ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Copy className="size-4" />
          )}
          <span className="ml-1.5">Copy Previous Month</span>
        </Button>

        {accounts.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No active accounts found. Add accounts first.
          </p>
        )}
      </div>

      {/* Toast notification */}
      {toast.type && (
        <div
          className={`flex items-center gap-2 rounded-lg border px-4 py-3 text-sm animate-in fade-in slide-in-from-top-1 ${
            toast.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300"
              : "border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950/50 dark:text-red-300"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="size-4 shrink-0" />
          ) : (
            <AlertCircle className="size-4 shrink-0" />
          )}
          {toast.message}
        </div>
      )}

      {/* ─── Desktop Table (md+) ────────────────────────── */}
      <div className="hidden md:block">
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Account
                    </th>
                    <th className="w-[160px] px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      {formatMonth(prevMonth)}
                    </th>
                    <th className="w-[180px] px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      {formatMonth(currentMonth)}
                    </th>
                    <th className="w-[140px] px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Change
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {categoryGroups.map((group) => (
                    <>
                      {/* Category header row */}
                      <tr
                        key={`header-${group.category.id}`}
                        className="border-b border-border bg-muted/20"
                      >
                        <td
                          colSpan={4}
                          className="px-4 py-2"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold">
                              {group.category.name}
                            </span>
                            {categoryTypeBadge(group.category.type)}
                          </div>
                        </td>
                      </tr>
                      {/* Account rows */}
                      {group.accounts.map((acct) =>
                        renderDesktopRow(acct, group)
                      )}
                      {/* Subtotal */}
                      {renderDesktopCategorySubtotal(group)}
                    </>
                  ))}
                </tbody>

                {/* Grand totals */}
                <tfoot>
                  <tr className="border-b border-border bg-muted/40">
                    <td className="px-4 py-3 text-sm font-semibold" colSpan={2}>
                      Total Assets
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(totals.totalAssets)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <ChangeIndicator value={totals.assetChange} />
                    </td>
                  </tr>
                  <tr className="border-b border-border bg-muted/40">
                    <td className="px-4 py-3 text-sm font-semibold" colSpan={2}>
                      Total Liabilities
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-bold tabular-nums text-red-600 dark:text-red-400">
                      {formatCurrency(totals.totalLiabilities)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <ChangeIndicator value={totals.liabilityChange} />
                    </td>
                  </tr>
                  <tr className="bg-primary/5">
                    <td className="px-4 py-3 text-base font-bold" colSpan={2}>
                      Net Worth
                    </td>
                    <td className="px-4 py-3 text-right text-base font-bold tabular-nums">
                      {formatCurrency(totals.netWorth)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <ChangeIndicator value={totals.netWorthChange} />
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ─── Mobile Card Layout (< md) ──────────────────── */}
      <div className="space-y-3 md:hidden">
        {categoryGroups.map((group) => {
          const isCollapsed = collapsedCategories.has(group.category.id);
          const { total, change } = getCategoryTotal(group);

          return (
            <Card key={group.category.id}>
              <button
                type="button"
                onClick={() => toggleCategory(group.category.id)}
                className="flex w-full items-center justify-between p-4"
              >
                <div className="flex items-center gap-2">
                  {isCollapsed ? (
                    <ChevronRight className="size-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="size-4 text-muted-foreground" />
                  )}
                  <span className="text-sm font-semibold">{group.category.name}</span>
                  {categoryTypeBadge(group.category.type)}
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold tabular-nums">
                    {formatCurrency(total)}
                  </div>
                  <ChangeIndicator value={change} />
                </div>
              </button>

              {!isCollapsed && (
                <CardContent className="space-y-2 pt-0">
                  {group.accounts.map((acct) => renderMobileCard(acct))}
                </CardContent>
              )}
            </Card>
          );
        })}

        {/* Mobile totals */}
        <Card className="border-2 border-primary/20">
          <CardContent className="space-y-3 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Total Assets</span>
              <div className="text-right">
                <div className="text-sm font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(totals.totalAssets)}
                </div>
                <ChangeIndicator value={totals.assetChange} />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Total Liabilities</span>
              <div className="text-right">
                <div className="text-sm font-semibold tabular-nums text-red-600 dark:text-red-400">
                  {formatCurrency(totals.totalLiabilities)}
                </div>
                <ChangeIndicator value={totals.liabilityChange} />
              </div>
            </div>
            <div className="border-t border-border pt-3">
              <div className="flex items-center justify-between">
                <span className="text-base font-bold">Net Worth</span>
                <div className="text-right">
                  <div className="text-base font-bold tabular-nums">
                    {formatCurrency(totals.netWorth)}
                  </div>
                  <ChangeIndicator value={totals.netWorthChange} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ─── Save Button ────────────────────────────────── */}
      {/* Desktop: normal flow. Mobile: sticky bottom */}
      <div className="hidden md:flex md:items-center md:justify-between md:gap-4">
        <div className="text-sm text-muted-foreground">
          {dirtyCount > 0 ? (
            <span className="text-amber-600 dark:text-amber-400">
              {dirtyCount} unsaved {dirtyCount === 1 ? "change" : "changes"}
            </span>
          ) : (
            <span>All changes saved</span>
          )}
        </div>
        <Button
          size="lg"
          onClick={handleSave}
          disabled={isSaving || dirtyCount === 0}
          className="min-w-[140px]"
        >
          {isSaving ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Save className="size-4" />
          )}
          <span className="ml-1.5">
            {isSaving ? "Saving..." : dirtyCount > 0 ? `Save ${dirtyCount} Changes` : "Save All"}
          </span>
        </Button>
      </div>

      {/* Mobile sticky save */}
      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 p-3 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:hidden">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
          <div className="text-sm">
            {dirtyCount > 0 ? (
              <span className="text-amber-600 dark:text-amber-400">
                {dirtyCount} unsaved
              </span>
            ) : (
              <span className="text-muted-foreground">Up to date</span>
            )}
          </div>
          <Button
            size="lg"
            onClick={handleSave}
            disabled={isSaving || dirtyCount === 0}
            className="flex-1 max-w-[200px]"
          >
            {isSaving ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Save className="size-4" />
            )}
            <span className="ml-1.5">
              {isSaving ? "Saving..." : dirtyCount > 0 ? `Save (${dirtyCount})` : "Save"}
            </span>
          </Button>
        </div>
      </div>

      {/* Bottom spacer for mobile sticky bar */}
      <div className="h-20 md:hidden" />
    </div>
  );
}
