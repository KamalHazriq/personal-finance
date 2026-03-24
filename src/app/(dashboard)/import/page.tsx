"use client";

import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { getImports } from "@/lib/actions/import";
import { getActiveAccounts } from "@/lib/actions/accounts";
import { ImportManager } from "@/components/import/import-manager";
import type { Import, Account } from "@/types/database";

function ImportSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-36" />
        <Skeleton className="mt-1 h-4 w-64" />
      </div>
      <Skeleton className="h-40 w-full rounded-xl" />
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} className="h-16 w-full rounded-xl" />
      ))}
    </div>
  );
}

export default function ImportPage() {
  const [imports, setImports] = useState<Import[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [importsData, accountsData] = await Promise.all([
          getImports(),
          getActiveAccounts(),
        ]);
        setImports(importsData);
        setAccounts(accountsData);
      } catch (err) {
        console.error("Failed to fetch import data:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) return <ImportSkeleton />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Import Data</h1>
        <p className="text-sm text-muted-foreground">
          Import monthly values from spreadsheets.
        </p>
      </div>
      <ImportManager imports={imports} accounts={accounts} />
    </div>
  );
}
