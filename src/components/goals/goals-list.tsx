"use client";

import { useState, useMemo } from "react";
import {
  Target,
  Plus,
  Pencil,
  Archive,
  ArchiveRestore,
  ChevronDown,
  ChevronRight,
  CalendarClock,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { formatCurrency, formatPercent } from "@/lib/format";
import { archiveGoal, unarchiveGoal } from "@/lib/actions/goals";
import { GoalFormDialog } from "@/components/goals/goal-form-dialog";
import type {
  Goal,
  MonthlySnapshot,
  Account,
  AccountCategory,
  GoalProgress,
} from "@/types/database";

interface GoalsListProps {
  goals: Goal[];
  snapshot: MonthlySnapshot | null;
  accounts: Account[];
  categories: AccountCategory[];
}

function computeGoalProgress(
  goal: Goal,
  snapshot: MonthlySnapshot | null
): GoalProgress {
  let currentValue = 0;

  if (snapshot) {
    switch (goal.goal_type) {
      case "net_worth":
        currentValue = snapshot.net_worth;
        break;
      case "net_worth_ex_locked":
        currentValue = snapshot.net_worth_ex_locked;
        break;
      default:
        currentValue = goal.start_value;
        break;
    }
  }

  const totalRange = goal.target_value - goal.start_value;
  const currentProgress = currentValue - goal.start_value;
  const progressPct =
    totalRange > 0 ? Math.min((currentProgress / totalRange) * 100, 100) : 0;
  const remainingAmount = Math.max(goal.target_value - currentValue, 0);

  const now = new Date();
  const targetDate = new Date(goal.target_date + "T00:00:00");
  const monthsRemaining = Math.max(
    0,
    (targetDate.getFullYear() - now.getFullYear()) * 12 +
      (targetDate.getMonth() - now.getMonth())
  );

  const requiredMonthlyPace =
    monthsRemaining > 0 ? remainingAmount / monthsRemaining : remainingAmount;

  // Estimate monthly pace from start to now
  const startDate = new Date(goal.start_date + "T00:00:00");
  const monthsElapsed = Math.max(
    1,
    (now.getFullYear() - startDate.getFullYear()) * 12 +
      (now.getMonth() - startDate.getMonth())
  );
  const actualMonthlyPace =
    monthsElapsed > 0 ? currentProgress / monthsElapsed : 0;

  const isOnTrack =
    progressPct >= 100 ||
    (actualMonthlyPace > 0 && actualMonthlyPace >= requiredMonthlyPace * 0.9);

  return {
    goal,
    currentValue,
    progressPct: Math.max(0, progressPct),
    remainingAmount,
    monthsRemaining,
    requiredMonthlyPace,
    projectedDate: null,
    isOnTrack,
  };
}

export function GoalsList({
  goals,
  snapshot,
  accounts,
  categories,
}: GoalsListProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [showArchived, setShowArchived] = useState(false);

  const activeGoals = useMemo(
    () => goals.filter((g) => !g.is_archived),
    [goals]
  );
  const archivedGoals = useMemo(
    () => goals.filter((g) => g.is_archived),
    [goals]
  );

  function handleEdit(goal: Goal) {
    setEditingGoal(goal);
    setDialogOpen(true);
  }

  function handleAdd() {
    setEditingGoal(null);
    setDialogOpen(true);
  }

  async function handleArchive(id: string) {
    const result = await archiveGoal(id);
    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success("Goal archived");
    }
  }

  async function handleUnarchive(id: string) {
    const result = await unarchiveGoal(id);
    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success("Goal restored");
    }
  }

  if (activeGoals.length === 0 && archivedGoals.length === 0) {
    return (
      <>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Target className="mb-4 size-12 text-muted-foreground/50" />
            <h3 className="mb-1 text-lg font-semibold">No goals yet</h3>
            <p className="mb-4 text-sm text-muted-foreground">
              Set your first financial goal to start tracking your progress.
            </p>
            <Button onClick={handleAdd}>
              <Plus className="size-4" />
              Add Goal
            </Button>
          </CardContent>
        </Card>
        <GoalFormDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          goal={editingGoal}
          accounts={accounts}
          categories={categories}
        />
      </>
    );
  }

  return (
    <>
      <div className="flex items-center justify-end">
        <Button onClick={handleAdd}>
          <Plus className="size-4" />
          Add Goal
        </Button>
      </div>

      {/* Active Goals Grid */}
      <div className="grid gap-4 sm:grid-cols-2">
        {activeGoals.map((goal) => {
          const progress = computeGoalProgress(goal, snapshot);
          const targetDate = new Date(goal.target_date + "T00:00:00");
          const targetDateStr = targetDate.toLocaleDateString("en-US", {
            month: "short",
            year: "numeric",
          });

          return (
            <Card key={goal.id} className="relative overflow-hidden">
              <CardContent className="p-5">
                <div className="mb-3 flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-semibold">{goal.title}</h3>
                    <p className="text-xs text-muted-foreground">
                      {goal.goal_type === "net_worth"
                        ? "Net Worth"
                        : goal.goal_type === "net_worth_ex_locked"
                        ? "Net Worth (Excl. Locked)"
                        : goal.goal_type === "category_total"
                        ? "Category Total"
                        : "Account Value"}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Badge variant={progress.isOnTrack ? "success" : "warning"}>
                      {progress.isOnTrack ? "On Track" : "Behind"}
                    </Badge>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-3">
                  <div className="mb-1 flex items-baseline justify-between text-xs">
                    <span className="font-medium">
                      {formatCurrency(progress.currentValue)}
                    </span>
                    <span className="text-muted-foreground">
                      {formatCurrency(goal.target_value)}
                    </span>
                  </div>
                  <Progress
                    value={progress.progressPct}
                    indicatorClassName={
                      progress.isOnTrack ? "bg-emerald-500" : "bg-amber-500"
                    }
                  />
                  <p className="mt-1 text-right text-xs text-muted-foreground">
                    {formatPercent(progress.progressPct).replace("+", "")} complete
                  </p>
                </div>

                {/* Details */}
                <div className="mb-3 space-y-1 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <CalendarClock className="size-3" />
                    <span>Target: {targetDateStr}</span>
                    <span className="ml-auto">
                      {progress.monthsRemaining > 0
                        ? `${progress.monthsRemaining} months left`
                        : "Past due"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Required monthly pace</span>
                    <span className="font-medium text-foreground">
                      {formatCurrency(progress.requiredMonthlyPace)}/mo
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 border-t border-border pt-3">
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => handleEdit(goal)}
                  >
                    <Pencil className="size-3" />
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => handleArchive(goal.id)}
                  >
                    <Archive className="size-3" />
                    Archive
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Archived Goals */}
      {archivedGoals.length > 0 && (
        <div>
          <button
            onClick={() => setShowArchived(!showArchived)}
            className="mb-3 flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            {showArchived ? (
              <ChevronDown className="size-4" />
            ) : (
              <ChevronRight className="size-4" />
            )}
            Archived Goals ({archivedGoals.length})
          </button>
          {showArchived && (
            <div className="grid gap-4 sm:grid-cols-2">
              {archivedGoals.map((goal) => (
                <Card key={goal.id} className="opacity-60">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold">{goal.title}</h3>
                        <p className="text-xs text-muted-foreground">
                          Target: {formatCurrency(goal.target_value)}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => handleUnarchive(goal.id)}
                      >
                        <ArchiveRestore className="size-3" />
                        Restore
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      <GoalFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        goal={editingGoal}
        accounts={accounts}
        categories={categories}
      />
    </>
  );
}
