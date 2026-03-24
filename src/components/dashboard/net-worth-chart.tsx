"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrencyCompact, formatCurrency, formatMonthShort } from "@/lib/format";
import type { MonthlySnapshot } from "@/types/database";

interface NetWorthChartProps {
  snapshots: MonthlySnapshot[];
}

interface ChartDataPoint {
  month: string;
  monthLabel: string;
  netWorth: number;
  netWorthExLocked: number;
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number; dataKey: string; color: string }>;
  label?: string;
}) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="rounded-lg border border-border bg-card px-4 py-3 shadow-lg">
      <p className="mb-2 text-xs font-medium text-muted-foreground">{label}</p>
      {payload.map((entry) => (
        <div key={entry.dataKey} className="flex items-center gap-2 text-sm">
          <span
            className="inline-block size-2.5 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-muted-foreground">
            {entry.dataKey === "netWorth" ? "Net Worth" : "Excl. Locked"}:
          </span>
          <span className="font-semibold">{formatCurrency(entry.value)}</span>
        </div>
      ))}
    </div>
  );
}

export function NetWorthChart({ snapshots }: NetWorthChartProps) {
  if (!snapshots || snapshots.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Net Worth Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-border">
            <p className="text-sm text-muted-foreground">
              No data yet. Add your first monthly snapshot to see trends.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const data: ChartDataPoint[] = snapshots.map((s) => ({
    month: s.month_date,
    monthLabel: formatMonthShort(s.month_date),
    netWorth: s.net_worth,
    netWorthExLocked: s.net_worth_ex_locked,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Net Worth Trend</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-72 w-full sm:h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
              <defs>
                <linearGradient id="gradientNetWorth" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradientExLocked" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a855f7" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                className="stroke-border"
              />
              <XAxis
                dataKey="monthLabel"
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                className="fill-muted-foreground"
              />
              <YAxis
                tickFormatter={(val: number) => formatCurrencyCompact(val)}
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                className="fill-muted-foreground"
                width={70}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="top"
                align="right"
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: "12px", paddingBottom: "8px" }}
                formatter={(value: string) =>
                  value === "netWorth" ? "Net Worth" : "Excl. Locked"
                }
              />
              <Area
                type="monotone"
                dataKey="netWorth"
                stroke="#3b82f6"
                strokeWidth={2.5}
                fill="url(#gradientNetWorth)"
                dot={false}
                activeDot={{ r: 4, strokeWidth: 2 }}
                name="netWorth"
              />
              <Area
                type="monotone"
                dataKey="netWorthExLocked"
                stroke="#a855f7"
                strokeWidth={2}
                strokeDasharray="6 3"
                fill="url(#gradientExLocked)"
                dot={false}
                activeDot={{ r: 4, strokeWidth: 2 }}
                name="netWorthExLocked"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
