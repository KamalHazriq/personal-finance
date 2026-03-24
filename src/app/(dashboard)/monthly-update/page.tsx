import { getActiveAccounts, getCategories } from "@/lib/actions/accounts";
import { getMonthlyValuesWithPrevious } from "@/lib/actions/monthly-values";
import { getCurrentMonth, getPreviousMonth } from "@/lib/format";
import { MonthlyUpdateForm } from "@/components/monthly-update/monthly-update-form";

export const metadata = {
  title: "Monthly Update | Wealth Tracker",
};

export default async function MonthlyUpdatePage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const params = await searchParams;
  const currentMonth = params.month || getCurrentMonth();
  const prevMonth = getPreviousMonth(currentMonth);

  // Fetch all data in parallel
  const [accounts, categories, monthlyData] = await Promise.all([
    getActiveAccounts(),
    getCategories(),
    getMonthlyValuesWithPrevious(currentMonth, prevMonth),
  ]);

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
