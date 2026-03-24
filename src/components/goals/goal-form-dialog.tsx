"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createGoal, updateGoal } from "@/lib/actions/goals";
import { getCurrentMonth } from "@/lib/format";
import type { Goal, Account, AccountCategory, GoalType } from "@/types/database";

interface GoalFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goal: Goal | null;
  accounts: Account[];
  categories: AccountCategory[];
}

const goalTypeLabels: Record<GoalType, string> = {
  net_worth: "Net Worth",
  net_worth_ex_locked: "Net Worth (Excl. Locked)",
  category_total: "Category Total",
  account_value: "Account Value",
};

export function GoalFormDialog({
  open,
  onOpenChange,
  goal,
  accounts,
  categories,
}: GoalFormDialogProps) {
  const isEditing = !!goal;
  const [isPending, startTransition] = useTransition();

  const [title, setTitle] = useState("");
  const [goalType, setGoalType] = useState<GoalType>("net_worth");
  const [targetValue, setTargetValue] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [startValue, setStartValue] = useState("");
  const [startDate, setStartDate] = useState("");
  const [targetAccountId, setTargetAccountId] = useState("");
  const [targetCategoryId, setTargetCategoryId] = useState("");

  useEffect(() => {
    if (open) {
      if (goal) {
        setTitle(goal.title);
        setGoalType(goal.goal_type);
        setTargetValue(goal.target_value.toString());
        setTargetDate(goal.target_date);
        setStartValue(goal.start_value.toString());
        setStartDate(goal.start_date);
        setTargetAccountId(goal.target_account_id ?? "");
        setTargetCategoryId(goal.target_category_id ?? "");
      } else {
        setTitle("");
        setGoalType("net_worth");
        setTargetValue("");
        setTargetDate("");
        setStartValue("0");
        setStartDate(getCurrentMonth());
        setTargetAccountId("");
        setTargetCategoryId("");
      }
    }
  }, [open, goal]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const formData = new FormData();
    formData.set("title", title);
    formData.set("goal_type", goalType);
    formData.set("target_value", targetValue);
    formData.set("target_date", targetDate);
    formData.set("start_value", startValue || "0");
    formData.set("start_date", startDate);
    formData.set("target_account_id", targetAccountId);
    formData.set("target_category_id", targetCategoryId);

    startTransition(async () => {
      const result = isEditing
        ? await updateGoal(goal.id, formData)
        : await createGoal(formData);

      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success(isEditing ? "Goal updated" : "Goal created");
        onOpenChange(false);
      }
    });
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{isEditing ? "Edit Goal" : "Add Goal"}</SheetTitle>
          <SheetDescription>
            {isEditing
              ? "Update your financial goal."
              : "Set a new financial target to work towards."}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="goal-title">Title</Label>
            <Input
              id="goal-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Reach RM 500K Net Worth"
              required
            />
          </div>

          {/* Goal Type */}
          <div className="space-y-2">
            <Label htmlFor="goal-type">Goal Type</Label>
            <select
              id="goal-type"
              value={goalType}
              onChange={(e) => setGoalType(e.target.value as GoalType)}
              className="flex h-9 w-full rounded-lg border border-border bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {(Object.keys(goalTypeLabels) as GoalType[]).map((type) => (
                <option key={type} value={type}>
                  {goalTypeLabels[type]}
                </option>
              ))}
            </select>
          </div>

          {/* Conditional: Category */}
          {goalType === "category_total" && (
            <div className="space-y-2">
              <Label htmlFor="goal-category">Category</Label>
              <select
                id="goal-category"
                value={targetCategoryId}
                onChange={(e) => setTargetCategoryId(e.target.value)}
                className="flex h-9 w-full rounded-lg border border-border bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                required
              >
                <option value="">Select a category...</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Conditional: Account */}
          {goalType === "account_value" && (
            <div className="space-y-2">
              <Label htmlFor="goal-account">Account</Label>
              <select
                id="goal-account"
                value={targetAccountId}
                onChange={(e) => setTargetAccountId(e.target.value)}
                className="flex h-9 w-full rounded-lg border border-border bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                required
              >
                <option value="">Select an account...</option>
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name}
                    {acc.category ? ` (${acc.category.name})` : ""}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Target Value */}
          <div className="space-y-2">
            <Label htmlFor="goal-target">Target Value (RM)</Label>
            <Input
              id="goal-target"
              type="number"
              step="0.01"
              value={targetValue}
              onChange={(e) => setTargetValue(e.target.value)}
              placeholder="500000"
              required
            />
          </div>

          {/* Target Date */}
          <div className="space-y-2">
            <Label htmlFor="goal-target-date">Target Date</Label>
            <Input
              id="goal-target-date"
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              required
            />
          </div>

          {/* Start Value */}
          <div className="space-y-2">
            <Label htmlFor="goal-start-value">Start Value (RM)</Label>
            <Input
              id="goal-start-value"
              type="number"
              step="0.01"
              value={startValue}
              onChange={(e) => setStartValue(e.target.value)}
              placeholder="0"
            />
          </div>

          {/* Start Date */}
          <div className="space-y-2">
            <Label htmlFor="goal-start-date">Start Date</Label>
            <Input
              id="goal-start-date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={isPending} className="flex-1">
              {isPending
                ? "Saving..."
                : isEditing
                ? "Update Goal"
                : "Create Goal"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
