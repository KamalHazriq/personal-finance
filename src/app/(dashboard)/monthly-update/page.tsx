"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { getActiveAccounts, getCategories } from "@/lib/actions/accounts";
import { getMonthlyValuesWithPrevious } from "@/lib/actions/monthly-values";
import { getCurrentMonth, getPreviousMonth } from "@/lib/format";
import { MonthlyUpdateForm } from "@/components/monthly-update/monthly-update-form";
import type { Account, AccountCategory, MonthlyAccountValue } from "@/types/database";

function MonthlyUpdateSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-48" />
        <Skeleton className="mt-1 h-4 w-72" />
      </div>
      <Skeleton className="h-12 w-full rounded-lg" />
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-14 w-full rounded-xl" />
      ))}
      <Skeleton className="h-10 w-32 rounded-lg" />
    </div>
  );
}

export default function MonthlyUpdatePage() {
  const searchParams = useSearchParams();
  const month = searchParams.get("month");
  const currentMonth = month || getCurrentMonth();
  const prevMonth = getPreviousMonth(currentMonth);

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<AccountCategory[]>([]);
  const [monthlyData, setMonthlyData] = useState<{
    current: MonthlyAccountValue[];
    previous: MonthlyAccountValue[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [accountsData, categoriesData, monthlyDataResult] =
          await Promise.all([
            getActiveAccounts(),
            getCategories(),
            getMonthlyValuesWithPrevious(currentMonth, prevMonth),
          ]);
        setAccounts(accountsData);
        setCategories(categoriesData);
        setMonthlyData(monthlyDataResult);
      } catch (err) {
        console.error("Failed to fetch monthly update data:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [currentMonth, prevMonth]);

  if (loading || !monthlyData) return <MonthlyUpdateSkeleton />;

  return (
    <MonthlyUpdateForm
      currentMonth={currentMonth}
      categories={categories}
      accounts={accounts}
      currentValues={monthlyData.current}
      previousValues={monthlyData.previous}
    />
  );
}
