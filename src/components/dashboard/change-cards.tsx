"use client";

import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatChange, formatPercent } from "@/lib/format";
import type { MonthlySnapshot } from "@/types/database";

interface ChangeCardsProps {
  snapshot: MonthlySnapshot | null;
}

interface ChangeCardData {
  label: string;
  absoluteChange: number;
  percentChange: number;
}

function ChangeCard({ data }: { data: ChangeCardData }) {
  const isPositive = data.absoluteChange > 0;
  const isNegative = data.absoluteChange < 0;
  const isNeutral = data.absoluteChange === 0;

  const colorClass = isPositive
    ? "text-emerald-600 dark:text-emerald-400"
    : isNegative
      ? "text-red-600 dark:text-red-400"
      : "text-muted-foreground";

  const bgClass = isPositive
    ? "bg-emerald-500/10"
    : isNegative
      ? "bg-red-500/10"
      : "bg-muted";

  const Icon = isPositive ? ArrowUpRight : isNegative ? ArrowDownRight : Minus;

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardContent className="p-5">
        <div className="flex items-center gap-3">
          <div
            className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${bgClass}`}
          >
            <Icon className={`size-5 ${colorClass}`} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-muted-foreground">
              {data.label}
            </p>
            <p className={`mt-0.5 text-base font-bold tracking-tight ${colorClass}`}>
              {formatChange(data.absoluteChange)}
            </p>
            <p className={`text-xs font-medium ${colorClass}`}>
              {isNeutral ? "No change" : formatPercent(data.percentChange)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function ChangeCards({ snapshot }: ChangeCardsProps) {
  if (!snapshot) {
    return (
      <div className="grid grid-cols-2 gap-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-lg bg-muted animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-16 rounded bg-muted animate-pulse" />
                  <div className="h-5 w-24 rounded bg-muted animate-pulse" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const cards: ChangeCardData[] = [
    {
      label: "Month-over-Month",
      absoluteChange: snapshot.mom_change,
      percentChange: snapshot.mom_change_pct,
    },
    {
      label: "Year-over-Year",
      absoluteChange: snapshot.yoy_change,
      percentChange: snapshot.yoy_change_pct,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4">
      {cards.map((card) => (
        <ChangeCard key={card.label} data={card} />
      ))}
    </div>
  );
}
