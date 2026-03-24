"use client";

import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { getAccounts, getCategories } from "@/lib/actions/accounts";
import { CategoryList } from "@/components/accounts/category-list";
import type { Account, AccountCategory } from "@/types/database";

function CategoriesSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-36" />
        <Skeleton className="mt-1 h-4 w-64" />
      </div>
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-16 w-full rounded-xl" />
      ))}
    </div>
  );
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<AccountCategory[]>([]);
  const [accountCountMap, setAccountCountMap] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [categoriesData, accountsData] = await Promise.all([
          getCategories(),
          getAccounts(),
        ]);

        // Calculate account count per category
        const countMap: Record<string, number> = {};
        for (const account of accountsData) {
          countMap[account.category_id] =
            (countMap[account.category_id] ?? 0) + 1;
        }

        setCategories(categoriesData);
        setAccountCountMap(countMap);
      } catch (err) {
        console.error("Failed to fetch categories data:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) return <CategoriesSkeleton />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Categories</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Organize your accounts into categories by type.
        </p>
      </div>

      <CategoryList
        categories={categories}
        accountCountMap={accountCountMap}
      />
    </div>
  );
}
