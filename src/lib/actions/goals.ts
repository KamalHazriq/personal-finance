import { createClient } from "@/lib/supabase/client";
import type { Goal } from "@/types/database";

export async function getGoals(): Promise<Goal[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("goals")
    .select("*")
    .eq("is_archived", false)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getGoals error:", error.message);
    return [];
  }
  return data ?? [];
}

export async function getAllGoals(): Promise<Goal[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("goals")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getAllGoals error:", error.message);
    return [];
  }
  return data ?? [];
}

export async function createGoal(
  formData: FormData
): Promise<{ error?: string }> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const title = formData.get("title") as string;
  const goalType = formData.get("goal_type") as string;
  const targetValue = parseFloat(formData.get("target_value") as string);
  const targetDate = formData.get("target_date") as string;
  const startValue = parseFloat(formData.get("start_value") as string) || 0;
  const startDate = formData.get("start_date") as string;
  const targetAccountId =
    (formData.get("target_account_id") as string) || null;
  const targetCategoryId =
    (formData.get("target_category_id") as string) || null;

  if (!title?.trim()) return { error: "Title is required" };
  if (!goalType) return { error: "Goal type is required" };
  if (isNaN(targetValue)) return { error: "Target value is required" };
  if (!targetDate) return { error: "Target date is required" };
  if (!startDate) return { error: "Start date is required" };

  const { error } = await supabase.from("goals").insert({
    user_id: user.id,
    title: title.trim(),
    goal_type: goalType,
    target_value: targetValue,
    target_date: targetDate,
    start_value: startValue,
    start_date: startDate,
    target_account_id: targetAccountId || null,
    target_category_id: targetCategoryId || null,
  });

  if (error) return { error: error.message };
  return {};
}

export async function updateGoal(
  id: string,
  formData: FormData
): Promise<{ error?: string }> {
  const supabase = createClient();

  const title = formData.get("title") as string;
  const goalType = formData.get("goal_type") as string;
  const targetValue = parseFloat(formData.get("target_value") as string);
  const targetDate = formData.get("target_date") as string;
  const startValue = parseFloat(formData.get("start_value") as string) || 0;
  const startDate = formData.get("start_date") as string;
  const targetAccountId =
    (formData.get("target_account_id") as string) || null;
  const targetCategoryId =
    (formData.get("target_category_id") as string) || null;

  if (!title?.trim()) return { error: "Title is required" };
  if (!goalType) return { error: "Goal type is required" };
  if (isNaN(targetValue)) return { error: "Target value is required" };
  if (!targetDate) return { error: "Target date is required" };
  if (!startDate) return { error: "Start date is required" };

  const { error } = await supabase
    .from("goals")
    .update({
      title: title.trim(),
      goal_type: goalType,
      target_value: targetValue,
      target_date: targetDate,
      start_value: startValue,
      start_date: startDate,
      target_account_id: targetAccountId || null,
      target_category_id: targetCategoryId || null,
    })
    .eq("id", id);

  if (error) return { error: error.message };
  return {};
}

export async function archiveGoal(
  id: string
): Promise<{ error?: string }> {
  const supabase = createClient();

  const { error } = await supabase
    .from("goals")
    .update({ is_archived: true })
    .eq("id", id);

  if (error) return { error: error.message };
  return {};
}

export async function unarchiveGoal(
  id: string
): Promise<{ error?: string }> {
  const supabase = createClient();

  const { error } = await supabase
    .from("goals")
    .update({ is_archived: false })
    .eq("id", id);

  if (error) return { error: error.message };
  return {};
}

export async function deleteGoal(
  id: string
): Promise<{ error?: string }> {
  const supabase = createClient();

  const { error } = await supabase
    .from("goals")
    .delete()
    .eq("id", id);

  if (error) return { error: error.message };
  return {};
}
