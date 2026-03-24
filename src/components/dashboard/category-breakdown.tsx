"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatCurrencyCompact } from "@/lib/format";
import type { Account, AccountCategory } from "@/types/database";

interface CategoryBreakdownProps {
  accounts: Account[];
  categories: AccountCategory[];
}

const COLORS = [
  "#3b82f6", // blue
  "#10b981", // emerald
  "#a855f7", // purple
  "#f59e0b", // amber
  "#ef4444", // red
  "#06b6d4", // cyan
  "#f97316", // orange
  "#8b5cf6", // violet
  "#14b8a6", // teal
  "#ec4899", // pink
];

interface BarDataPoint {
  name: string;
  value: number;
  color: string;
  type: string;
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: BarDataPoint }>;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const data = payload[0].payload;

  return (
    <div className="rounded-lg border border-border bg-card px-4 py-3 shadow-lg">
      <p className="text-xs font-medium text-muted-foreground">{data.name}</p>
      <p className="mt-1 text-sm font-bold">{formatCurrency(data.value)}</p>
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
        {data.type}
      </p>
    </div>
  );
}

export function CategoryBreakdown({
  accounts,
  categories,
}: CategoryBreakdownProps) {
  // Group accounts by category and sum placeholder values
  // Since we don't have per-account monthly values here,
  // show category list with account count for now.
  // This component is designed to be enhanced when account values are available.

  const categoryData: BarDataPoint[] = categories
    .filter((cat) => cat.type === "asset")
    .map((cat, idx) => {
      const categoryAccounts = accounts.filter(
        (acc) => acc.category_id === cat.id
      );
      return {
        name: cat.name,
        value: categoryAccounts.length,
        color: COLORS[idx % COLORS.length],
        type: cat.type,
      };
    })
    .filter((d) => d.value > 0);

  if (categoryData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Asset Categories</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-32 items-center justify-center rounded-lg border border-dashed border-border">
            <p className="text-sm text-muted-foreground">
              No asset categories configured yet.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Asset Categories</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {categories
            .filter((cat) => cat.type === "asset")
            .map((cat, idx) => {
              const categoryAccounts = accounts.filter(
                (acc) => acc.category_id === cat.id
              );
              if (categoryAccounts.length === 0) return null;
              const color = COLORS[idx % COLORS.length];

              return (
                <div key={cat.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-block size-2.5 rounded-full"
                        style={{ backgroundColor: color }}
                      />
                      <span className="font-medium">{cat.name}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {categoryAccounts.length} account{categoryAccounts.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        backgroundColor: color,
                        width: `${Math.min(
                          (categoryAccounts.length /
                            Math.max(accounts.length, 1)) *
                            100,
                          100
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
        </div>
      </CardContent>
    </Card>
  );
}
