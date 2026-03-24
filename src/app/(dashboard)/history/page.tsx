"use client";

import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { getSnapshots } from "@/lib/actions/monthly-values";
import { HistoryView } from "@/components/charts/history-view";
import type { MonthlySnapshot } from "@/types/database";

function HistorySkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-48" />
        <Skeleton className="mt-1 h-4 w-64" />
      </div>
      <Skeleton className="h-80 w-full rounded-xl" />
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  );
}

export default function HistoryPage() {
  const [snapshots, setSnapshots] = useState<MonthlySnapshot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await getSnapshots();
        setSnapshots(data);
      } catch (err) {
        console.error("Failed to fetch history data:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) return <HistorySkeleton />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Net Worth History</h1>
        <p className="text-sm text-muted-foreground">
          Track your net worth progression over time.
        </p>
      </div>
      <HistoryView snapshots={snapshots} />
    </div>
  );
}
