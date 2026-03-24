import { getAccounts, getCategories } from "@/lib/actions/accounts";
import { CategoryList } from "@/components/accounts/category-list";

export const metadata = {
  title: "Categories | Wealth Tracker",
};

export default async function CategoriesPage() {
  const [categories, accounts] = await Promise.all([
    getCategories(),
    getAccounts(),
  ]);

  // Calculate account count per category
  const accountCountMap: Record<string, number> = {};
  for (const account of accounts) {
    accountCountMap[account.category_id] =
      (accountCountMap[account.category_id] ?? 0) + 1;
  }

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
