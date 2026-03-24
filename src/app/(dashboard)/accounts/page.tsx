import { getAccounts, getCategories } from "@/lib/actions/accounts";
import { AccountList } from "@/components/accounts/account-list";

export const metadata = {
  title: "Accounts | Wealth Tracker",
};

export default async function AccountsPage() {
  const [accounts, categories] = await Promise.all([
    getAccounts(),
    getCategories(),
  ]);

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
