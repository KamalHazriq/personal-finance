"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { MonthlyAccountValue, MonthlySnapshot } from "@/types/database";

/**
 * Get all monthly values for a specific month
 */
export async function getMonthlyValues(monthDate: string): Promise<MonthlyAccountValue[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("monthly_account_values")
    .select("*, account:accounts(*, category:account_categories(*))")
    .eq("month_date", monthDate)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);
  return data ?? [];
}

/**
 * Get monthly values for two months (current and previous) for comparison
 */
export async function getMonthlyValuesWithPrevious(
  monthDate: string,
  previousMonthDate: string
): Promise<{
  current: MonthlyAccountValue[];
  previous: MonthlyAccountValue[];
}> {
  const supabase = await createClient();

  const [currentResult, previousResult] = await Promise.all([
    supabase
      .from("monthly_account_values")
      .select("*")
      .eq("month_date", monthDate),
    supabase
      .from("monthly_account_values")
      .select("*")
      .eq("month_date", previousMonthDate),
  ]);

  if (currentResult.error) throw new Error(currentResult.error.message);
  if (previousResult.error) throw new Error(previousResult.error.message);

  return {
    current: currentResult.data ?? [],
    previous: previousResult.data ?? [],
  };
}

/**
 * Save monthly values in bulk (upsert).
 * This is the core function for the Monthly Update page.
 */
export async function saveMonthlyValues(
  monthDate: string,
  entries: { accountId: string; value: number; notes?: string }[]
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Build upsert payload
  const records = entries.map((entry) => ({
    user_id: user.id,
    account_id: entry.accountId,
    month_date: monthDate,
    value: entry.value,
    source: "manual" as const,
    notes: entry.notes || null,
  }));

  const { error } = await supabase
    .from("monthly_account_values")
    .upsert(records, {
      onConflict: "user_id,account_id,month_date",
    });

  if (error) return { error: error.message };

  // Recalculate snapshot for this month
  await recalculateSnapshot(monthDate);

  revalidatePath("/monthly-update");
  revalidatePath("/dashboard");
  revalidatePath("/history");
  return { success: true };
}

/**
 * Copy values from one month to another
 */
export async function copyPreviousMonthValues(
  sourceMonth: string,
  targetMonth: string
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Get source month values
  const { data: sourceValues, error: fetchError } = await supabase
    .from("monthly_account_values")
    .select("account_id, value, notes")
    .eq("month_date", sourceMonth)
    .eq("user_id", user.id);

  if (fetchError) return { error: fetchError.message };
  if (!sourceValues || sourceValues.length === 0) {
    return { error: "No values found for the source month" };
  }

  // Check which accounts already have values in target month
  const { data: existingValues } = await supabase
    .from("monthly_account_values")
    .select("account_id")
    .eq("month_date", targetMonth)
    .eq("user_id", user.id);

  const existingAccountIds = new Set(
    (existingValues ?? []).map((v) => v.account_id)
  );

  // Only copy values for accounts that don't already have target month values
  const newRecords = sourceValues
    .filter((v) => !existingAccountIds.has(v.account_id))
    .map((v) => ({
      user_id: user.id,
      account_id: v.account_id,
      month_date: targetMonth,
      value: v.value,
      source: "manual" as const,
      notes: null,
    }));

  if (newRecords.length === 0) {
    return { error: "All accounts already have values for the target month" };
  }

  const { error: insertError } = await supabase
    .from("monthly_account_values")
    .insert(newRecords);

  if (insertError) return { error: insertError.message };

  revalidatePath("/monthly-update");
  return { success: true, copied: newRecords.length };
}

/**
 * Recalculate the monthly snapshot for a given month.
 * Calls the database function.
 */
export async function recalculateSnapshot(monthDate: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase.rpc("recalculate_snapshot", {
    p_user_id: user.id,
    p_month_date: monthDate,
  });

  if (error) {
    console.error("Snapshot recalculation failed:", error.message);
    return { error: error.message };
  }

  revalidatePath("/dashboard");
  revalidatePath("/history");
  return { success: true };
}

/**
 * Get all monthly snapshots for charting and history
 */
export async function getSnapshots(
  limit?: number
): Promise<MonthlySnapshot[]> {
  const supabase = await createClient();
  let query = supabase
    .from("monthly_snapshots")
    .select("*")
    .order("month_date", { ascending: true });

  if (limit) {
    query = query.limit(limit);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data ?? [];
}

/**
 * Get the latest snapshot
 */
export async function getLatestSnapshot(): Promise<MonthlySnapshot | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("monthly_snapshots")
    .select("*")
    .order("month_date", { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== "PGRST116") throw new Error(error.message);
  return data;
}

/**
 * Get snapshot for a specific month
 */
export async function getSnapshotForMonth(
  monthDate: string
): Promise<MonthlySnapshot | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("monthly_snapshots")
    .select("*")
    .eq("month_date", monthDate)
    .single();

  if (error && error.code !== "PGRST116") throw new Error(error.message);
  return data;
}
