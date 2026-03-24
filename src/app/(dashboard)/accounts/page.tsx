"use client";

import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { getAccounts, getCategories } from "@/lib/actions/accounts";
import { AccountList } from "@/components/accounts/account-list";
import type { Account, AccountCategory } from "@/types/database";

function AccountsSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-32" />
        <Skeleton className="mt-1 h-4 w-64" />
      </div>
      <Skeleton className="h-10 w-full rounded-lg" />
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-16 w-full rounded-xl" />
      ))}
    </div>
  );
}

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<AccountCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [accountsData, categoriesData] = await Promise.all([
          getAccounts(),
          getCategories(),
        ]);
        setAccounts(accountsData);
        setCategories(categoriesData);
      } catch (err) {
        console.error("Failed to fetch accounts data:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) return <AccountsSkeleton />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Accounts</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your financial accounts across all categories.
        </p>
      </div>

      <AccountList accounts={accounts} categories={categories} />
    </div>
  );
}
