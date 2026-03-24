"use client";

import { Target, CheckCircle2, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { formatCurrency, formatPercent } from "@/lib/format";
import type { Goal, MonthlySnapshot } from "@/types/database";

interface GoalSummaryProps {
  goals: Goal[];
  snapshot: MonthlySnapshot | null;
}

function computeGoalProgress(goal: Goal, snapshot: MonthlySnapshot | null) {
  if (!snapshot) {
    return { currentValue: 0, progressPct: 0, isOnTrack: false };
  }

  let currentValue = 0;
  switch (goal.goal_type) {
    case "net_worth":
      currentValue = snapshot.net_worth;
      break;
    case "net_worth_ex_locked":
      currentValue = snapshot.net_worth_ex_locked;
      break;
    case "category_total":
    case "account_value":
      // For category/account goals, we would need account-level data.
      // Fall back to 0 if not available at snapshot level.
      currentValue = 0;
      break;
  }

  const totalNeeded = goal.target_value - goal.start_value;
  const totalProgress = currentValue - goal.start_value;
  const progressPct = totalNeeded > 0 ? (totalProgress / totalNeeded) * 100 : 0;
  const clampedPct = Math.min(Math.max(progressPct, 0), 100);

  // Check if on track based on time elapsed vs progress
  const startDate = new Date(goal.start_date + "T00:00:00");
  const targetDate = new Date(goal.target_date + "T00:00:00");
  const now = new Date();
  const totalDuration = targetDate.getTime() - startDate.getTime();
  const elapsed = now.getTime() - startDate.getTime();
  const timeProgressPct = totalDuration > 0 ? (elapsed / totalDuration) * 100 : 100;
  const isOnTrack = clampedPct >= timeProgressPct * 0.85; // 15% grace

  return {
    currentValue,
    progressPct: clampedPct,
    isOnTrack,
  };
}

function GoalCard({
  goal,
  snapshot,
}: {
  goal: Goal;
  snapshot: MonthlySnapshot | null;
}) {
  const { currentValue, progressPct, isOnTrack } = computeGoalProgress(
    goal,
    snapshot
  );

  const progressColor = progressPct >= 100
    ? "bg-emerald-500"
    : isOnTrack
      ? "bg-blue-500"
      : "bg-amber-500";

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <Target className="size-4 text-muted-foreground" />
            <h4 className="text-sm font-semibold leading-tight">{goal.title}</h4>
          </div>
          {progressPct >= 100 ? (
            <Badge variant="success" className="shrink-0 text-[10px]">
              <CheckCircle2 className="mr-0.5 size-3" />
              Achieved
            </Badge>
          ) : isOnTrack ? (
            <Badge variant="default" className="shrink-0 text-[10px]">
              On Track
            </Badge>
          ) : (
            <Badge variant="warning" className="shrink-0 text-[10px]">
              <AlertTriangle className="mr-0.5 size-3" />
              Behind
            </Badge>
          )}
        </div>

        <div className="mt-4">
          <Progress
            value={progressPct}
            className="h-2"
            indicatorClassName={progressColor}
          />
        </div>

        <div className="mt-3 flex items-end justify-between text-xs">
          <div>
            <span className="text-muted-foreground">Current: </span>
            <span className="font-semibold">{formatCurrency(currentValue)}</span>
          </div>
          <div className="text-right">
            <span className="text-muted-foreground">Target: </span>
            <span className="font-semibold">{formatCurrency(goal.target_value)}</span>
          </div>
        </div>

        <div className="mt-1 text-right">
          <span className="text-xs font-medium text-muted-foreground">
            {formatPercent(progressPct).replace("+", "")} complete
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

export function GoalSummary({ goals, snapshot }: GoalSummaryProps) {
  const activeGoals = goals.filter((g) => !g.is_archived).slice(0, 3);

  if (activeGoals.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Goals</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-32 items-center justify-center rounded-lg border border-dashed border-border">
            <div className="text-center">
              <Target className="mx-auto size-8 text-muted-foreground/50" />
              <p className="mt-2 text-sm text-muted-foreground">
                No active goals yet. Set a target to track your progress.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-base font-semibold">Goals</h3>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {activeGoals.map((goal) => (
          <GoalCard key={goal.id} goal={goal} snapshot={snapshot} />
        ))}
      </div>
    </div>
  );
}
