"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { ArrowUpDown, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  formatCurrency,
  formatCurrencyCompact,
  formatChange,
  formatPercent,
  formatMonthShort,
} from "@/lib/format";
import type { MonthlySnapshot } from "@/types/database";

interface HistoryViewProps {
  snapshots: MonthlySnapshot[];
}

type SortField = "month_date" | "total_assets" | "total_liabilities" | "net_worth" | "net_worth_ex_locked" | "mom_change" | "mom_change_pct";
type SortDir = "asc" | "desc";

export function HistoryView({ snapshots }: HistoryViewProps) {
  const [sortField, setSortField] = useState<SortField>("month_date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const chartData = useMemo(
    () =>
      snapshots.map((s) => ({
        month: s.month_date,
        label: formatMonthShort(s.month_date),
        net_worth: s.net_worth,
        net_worth_ex_locked: s.net_worth_ex_locked,
      })),
    [snapshots]
  );

  const sortedSnapshots = useMemo(() => {
    const sorted = [...snapshots].sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortDir === "asc"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }
      return sortDir === "asc"
        ? (aVal as number) - (bVal as number)
        : (bVal as number) - (aVal as number);
    });
    return sorted;
  }, [snapshots, sortField, sortDir]);

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  }

  if (snapshots.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <TrendingUp className="mb-4 size-12 text-muted-foreground/50" />
          <h3 className="mb-1 text-lg font-semibold">No data yet</h3>
          <p className="mb-4 text-sm text-muted-foreground">
            Start tracking your net worth by entering your first monthly update.
          </p>
          <Link href="/monthly-update">
            <Button>Go to Monthly Update</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  const SortHeader = ({
    field,
    label,
    className,
  }: {
    field: SortField;
    label: string;
    className?: string;
  }) => (
    <th className={className}>
      <button
        onClick={() => toggleSort(field)}
        className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
      >
        {label}
        <ArrowUpDown className="size-3" />
      </button>
    </th>
  );

  return (
    <div className="space-y-6">
      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Net Worth Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="gradNw" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(221, 83%, 53%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(221, 83%, 53%)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradNwEx" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(262, 83%, 58%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(262, 83%, 58%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tickFormatter={(v: number) => formatCurrencyCompact(v)}
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  width={80}
                />
                <Tooltip
                  formatter={(value, name) => [
                    formatCurrency(Number(value ?? 0)),
                    String(name) === "net_worth" ? "Net Worth" : "Net Worth (Excl. Locked)",
                  ]}
                  labelFormatter={(label) => String(label)}
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid hsl(var(--border))",
                    backgroundColor: "hsl(var(--card))",
                    color: "hsl(var(--card-foreground))",
                  }}
                />
                <Legend
                  formatter={(value: string) =>
                    value === "net_worth" ? "Net Worth" : "Net Worth (Excl. Locked)"
                  }
                />
                <Area
                  type="monotone"
                  dataKey="net_worth"
                  stroke="hsl(221, 83%, 53%)"
                  strokeWidth={2}
                  fill="url(#gradNw)"
                />
                <Area
                  type="monotone"
                  dataKey="net_worth_ex_locked"
                  stroke="hsl(262, 83%, 58%)"
                  strokeWidth={2}
                  fill="url(#gradNwEx)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Monthly History Table */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <SortHeader field="month_date" label="Month" className="pb-3 text-left" />
                  <SortHeader field="total_assets" label="Total Assets" className="pb-3 text-right" />
                  <SortHeader field="total_liabilities" label="Total Liabilities" className="pb-3 text-right" />
                  <SortHeader field="net_worth" label="Net Worth" className="pb-3 text-right" />
                  <SortHeader field="net_worth_ex_locked" label="NW Ex Locked" className="pb-3 text-right hidden sm:table-cell" />
                  <SortHeader field="mom_change" label="MoM Change" className="pb-3 text-right hidden md:table-cell" />
                  <SortHeader field="mom_change_pct" label="MoM %" className="pb-3 text-right hidden md:table-cell" />
                </tr>
              </thead>
              <tbody>
                {sortedSnapshots.map((s) => (
                  <tr
                    key={s.id}
                    className="border-b border-border/50 last:border-0"
                  >
                    <td className="py-3 font-medium">
                      {formatMonthShort(s.month_date)}
                    </td>
                    <td className="py-3 text-right">
                      {formatCurrency(s.total_assets)}
                    </td>
                    <td className="py-3 text-right">
                      {formatCurrency(s.total_liabilities)}
                    </td>
                    <td className="py-3 text-right font-medium">
                      {formatCurrency(s.net_worth)}
                    </td>
                    <td className="py-3 text-right hidden sm:table-cell">
                      {formatCurrency(s.net_worth_ex_locked)}
                    </td>
                    <td
                      className={`py-3 text-right hidden md:table-cell font-medium ${
                        s.mom_change > 0
                          ? "text-emerald-600 dark:text-emerald-400"
                          : s.mom_change < 0
                          ? "text-red-600 dark:text-red-400"
                          : ""
                      }`}
                    >
                      {formatChange(s.mom_change)}
                    </td>
                    <td
                      className={`py-3 text-right hidden md:table-cell font-medium ${
                        s.mom_change_pct > 0
                          ? "text-emerald-600 dark:text-emerald-400"
                          : s.mom_change_pct < 0
                          ? "text-red-600 dark:text-red-400"
                          : ""
                      }`}
                    >
                      {formatPercent(s.mom_change_pct)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
