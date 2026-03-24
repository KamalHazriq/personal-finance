"use client";

import {
  Landmark,
  CreditCard,
  TrendingUp,
  Unlock,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatPercent } from "@/lib/format";
import type { MonthlySnapshot } from "@/types/database";

interface SummaryCardsProps {
  snapshot: MonthlySnapshot | null;
  previousSnapshot: MonthlySnapshot | null;
}

interface SummaryCardData {
  label: string;
  value: number;
  icon: React.ElementType;
  accentColor: string;
  iconBg: string;
  change?: number;
  changePct?: number;
}

export function SummaryCards({ snapshot, previousSnapshot }: SummaryCardsProps) {
  if (!snapshot) {
    return (
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="relative overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-lg bg-muted animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-20 rounded bg-muted animate-pulse" />
                  <div className="h-6 w-28 rounded bg-muted animate-pulse" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const prevNetWorth = previousSnapshot?.net_worth ?? 0;
  const prevNetWorthExLocked = previousSnapshot?.net_worth_ex_locked ?? 0;

  const netWorthChange = prevNetWorth
    ? snapshot.net_worth - prevNetWorth
    : undefined;
  const netWorthChangePct =
    prevNetWorth && netWorthChange !== undefined
      ? (netWorthChange / Math.abs(prevNetWorth)) * 100
      : undefined;

  const netWorthExLockedChange = prevNetWorthExLocked
    ? snapshot.net_worth_ex_locked - prevNetWorthExLocked
    : undefined;
  const netWorthExLockedChangePct =
    prevNetWorthExLocked && netWorthExLockedChange !== undefined
      ? (netWorthExLockedChange / Math.abs(prevNetWorthExLocked)) * 100
      : undefined;

  const cards: SummaryCardData[] = [
    {
      label: "Total Assets",
      value: snapshot.total_assets,
      icon: Landmark,
      accentColor: "text-emerald-600 dark:text-emerald-400",
      iconBg: "bg-emerald-500/10",
    },
    {
      label: "Total Liabilities",
      value: snapshot.total_liabilities,
      icon: CreditCard,
      accentColor: "text-red-600 dark:text-red-400",
      iconBg: "bg-red-500/10",
    },
    {
      label: "Net Worth",
      value: snapshot.net_worth,
      icon: TrendingUp,
      accentColor: "text-blue-600 dark:text-blue-400",
      iconBg: "bg-blue-500/10",
      change: netWorthChange,
      changePct: netWorthChangePct,
    },
    {
      label: "Net Worth (Excl. Locked)",
      value: snapshot.net_worth_ex_locked,
      icon: Unlock,
      accentColor: "text-purple-600 dark:text-purple-400",
      iconBg: "bg-purple-500/10",
      change: netWorthExLockedChange,
      changePct: netWorthExLockedChangePct,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {cards.map((card) => (
        <Card
          key={card.label}
          className="group relative overflow-hidden transition-shadow hover:shadow-md"
        >
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium text-muted-foreground">
                  {card.label}
                </p>
                <p className={`mt-1.5 text-lg font-bold tracking-tight sm:text-xl ${card.accentColor}`}>
                  {formatCurrency(card.value)}
                </p>
                {card.changePct !== undefined && (
                  <div className="mt-2">
                    <Badge
                      variant={card.change && card.change >= 0 ? "success" : "destructive"}
                      className="text-[10px] font-semibold"
                    >
                      {formatPercent(card.changePct)} MoM
                    </Badge>
                  </div>
                )}
              </div>
              <div className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${card.iconBg}`}>
                <card.icon className={`size-5 ${card.accentColor}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
