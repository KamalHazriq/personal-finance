"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatMonth, getPreviousMonth, getNextMonth, getCurrentMonth } from "@/lib/format";

interface MonthSelectorProps {
  currentMonth: string;
}

export function MonthSelector({ currentMonth }: MonthSelectorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const navigateToMonth = (month: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("month", month);
    router.push(`/monthly-update?${params.toString()}`);
  };

  const prevMonth = getPreviousMonth(currentMonth);
  const nextMonth = getNextMonth(currentMonth);
  const isCurrentMonth = currentMonth === getCurrentMonth();
  const isFutureMonth =
    new Date(nextMonth + "T00:00:00") > new Date(getCurrentMonth() + "T00:00:00");

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="icon"
        onClick={() => navigateToMonth(prevMonth)}
        aria-label="Previous month"
      >
        <ChevronLeft className="size-4" />
      </Button>

      <div className="flex min-w-[160px] items-center justify-center gap-2 text-center">
        <Calendar className="size-4 text-muted-foreground" />
        <span className="text-sm font-semibold sm:text-base">
          {formatMonth(currentMonth)}
        </span>
      </div>

      <Button
        variant="outline"
        size="icon"
        onClick={() => navigateToMonth(nextMonth)}
        disabled={isFutureMonth}
        aria-label="Next month"
      >
        <ChevronRight className="size-4" />
      </Button>

      {!isCurrentMonth && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigateToMonth(getCurrentMonth())}
          className="ml-1 text-xs text-muted-foreground"
        >
          Today
        </Button>
      )}
    </div>
  );
}
