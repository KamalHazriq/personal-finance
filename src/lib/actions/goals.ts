"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { Goal } from "@/types/database";

export async function getGoals(): Promise<Goal[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("goals")
    .select("*")
    .eq("is_archived", false)
    .order("target_date", { ascending: true });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getAllGoals(): Promise<Goal[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("goals")
    .select("*")
    .order("target_date", { ascending: true });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createGoal(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const goalType = formData.get("goal_type") as string;
  const { error } = await supabase.from("goals").insert({
    user_id: user.id,
    title: formData.get("title") as string,
    goal_type: goalType,
    target_value: parseFloat(formData.get("target_value") as string),
    target_date: formData.get("target_date") as string,
    target_account_id: goalType === "account_value"
      ? (formData.get("target_account_id") as string) || null
      : null,
    target_category_id: goalType === "category_total"
      ? (formData.get("target_category_id") as string) || null
      : null,
    start_value: parseFloat(formData.get("start_value") as string) || 0,
    start_date: formData.get("start_date") as string,
  });

  if (error) return { error: error.message };
  revalidatePath("/goals");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function updateGoal(id: string, formData: FormData) {
  const supabase = await createClient();
  const goalType = formData.get("goal_type") as string;

  const { error } = await supabase
    .from("goals")
    .update({
      title: formData.get("title") as string,
      goal_type: goalType,
      target_value: parseFloat(formData.get("target_value") as string),
      target_date: formData.get("target_date") as string,
      target_account_id: goalType === "account_value"
        ? (formData.get("target_account_id") as string) || null
        : null,
      target_category_id: goalType === "category_total"
        ? (formData.get("target_category_id") as string) || null
        : null,
      start_value: parseFloat(formData.get("start_value") as string) || 0,
      start_date: formData.get("start_date") as string,
    })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/goals");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function archiveGoal(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("goals")
    .update({ is_archived: true })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/goals");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function unarchiveGoal(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("goals")
    .update({ is_archived: false })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/goals");
  return { success: true };
}

export async function deleteGoal(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("goals").delete().eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/goals");
  return { success: true };
}
