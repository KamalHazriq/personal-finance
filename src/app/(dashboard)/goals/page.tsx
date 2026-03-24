import { getAllGoals } from "@/lib/actions/goals";
import { getLatestSnapshot } from "@/lib/actions/monthly-values";
import { getActiveAccounts, getCategories } from "@/lib/actions/accounts";
import { GoalsList } from "@/components/goals/goals-list";

export default async function GoalsPage() {
  const [goals, snapshot, accounts, categories] = await Promise.all([
    getAllGoals(),
    getLatestSnapshot(),
    getActiveAccounts(),
    getCategories(),
  ]);

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
