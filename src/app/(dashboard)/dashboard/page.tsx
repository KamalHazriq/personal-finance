"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarDays, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getLatestSnapshot, getSnapshots } from "@/lib/actions/monthly-values";
import { getGoals } from "@/lib/actions/goals";
import { getActiveAccounts, getCategories } from "@/lib/actions/accounts";
import { formatMonth, getCurrentMonth } from "@/lib/format";
import { SummaryCards } from "@/components/dashboard/summary-cards";
import { NetWorthChart } from "@/components/dashboard/net-worth-chart";
import { ChangeCards } from "@/components/dashboard/change-cards";
import { GoalSummary } from "@/components/dashboard/goal-summary";
import { CategoryBreakdown } from "@/components/dashboard/category-breakdown";
import type { MonthlySnapshot, Goal, Account, AccountCategory } from "@/types/database";

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-40" />
        <Skeleton className="mt-1 h-4 w-56" />
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-80 rounded-xl" />
      <div className="grid grid-cols-2 gap-4">
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [latestSnapshot, setLatestSnapshot] = useState<MonthlySnapshot | null>(null);
  const [snapshots, setSnapshots] = useState<MonthlySnapshot[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<AccountCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [latestSnapshotData, snapshotsData, goalsData, accountsData, categoriesData] =
          await Promise.all([
            getLatestSnapshot(),
            getSnapshots(),
            getGoals(),
            getActiveAccounts(),
            getCategories(),
          ]);
        setLatestSnapshot(latestSnapshotData);
        setSnapshots(snapshotsData);
        setGoals(goalsData);
        setAccounts(accountsData);
        setCategories(categoriesData);
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) return <DashboardSkeleton />;

  const previousSnapshot =
    snapshots.length >= 2 ? snapshots[snapshots.length - 2] : null;

  const currentMonth = latestSnapshot
    ? formatMonth(latestSnapshot.month_date)
    : formatMonth(getCurrentMonth());

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {currentMonth} overview
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/monthly-update">
            <Button variant="default" size="sm" className="gap-1.5">
              <CalendarDays className="size-4" />
              Update This Month
            </Button>
          </Link>
          <Link href="/history">
            <Button variant="outline" size="sm" className="gap-1.5">
              <History className="size-4" />
              View Full History
            </Button>
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <SummaryCards
        snapshot={latestSnapshot}
        previousSnapshot={previousSnapshot}
      />

      {/* Net Worth Chart */}
      <NetWorthChart snapshots={snapshots} />

      {/* Change Cards */}
      <ChangeCards snapshot={latestSnapshot} />

      {/* Bottom Section: Category Breakdown + Goals */}
      <div className="grid gap-6 lg:grid-cols-2">
        <CategoryBreakdown accounts={accounts} categories={categories} />
        <GoalSummary goals={goals} snapshot={latestSnapshot} />
      </div>
    </div>
  );
}
