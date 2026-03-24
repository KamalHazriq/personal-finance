"use client";

import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { getAllGoals } from "@/lib/actions/goals";
import { getLatestSnapshot } from "@/lib/actions/monthly-values";
import { getActiveAccounts, getCategories } from "@/lib/actions/accounts";
import { GoalsList } from "@/components/goals/goals-list";
import type { Goal, MonthlySnapshot, Account, AccountCategory } from "@/types/database";

function GoalsSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-24" />
        <Skeleton className="mt-1 h-4 w-64" />
      </div>
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} className="h-32 w-full rounded-xl" />
      ))}
    </div>
  );
}

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [snapshot, setSnapshot] = useState<MonthlySnapshot | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<AccountCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [goalsData, snapshotData, accountsData, categoriesData] =
          await Promise.all([
            getAllGoals(),
            getLatestSnapshot(),
            getActiveAccounts(),
            getCategories(),
          ]);
        setGoals(goalsData);
        setSnapshot(snapshotData);
        setAccounts(accountsData);
        setCategories(categoriesData);
      } catch (err) {
        console.error("Failed to fetch goals data:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) return <GoalsSkeleton />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Goals</h1>
        <p className="text-sm text-muted-foreground">
          Set financial targets and track your progress.
        </p>
      </div>
      <GoalsList
        goals={goals}
        snapshot={snapshot}
        accounts={accounts}
        categories={categories}
      />
    </div>
  );
}
