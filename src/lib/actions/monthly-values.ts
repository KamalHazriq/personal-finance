import { createClient } from "@/lib/supabase/client";
import type { MonthlyAccountValue, MonthlySnapshot } from "@/types/database";

// ─── Monthly Account Values ─────────────────────────────

export async function getMonthlyValues(
  monthDate: string
): Promise<MonthlyAccountValue[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("monthly_account_values")
    .select("*, account:accounts(*)")
    .eq("month_date", monthDate)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("getMonthlyValues error:", error.message);
    return [];
  }
  return data ?? [];
}

export async function getMonthlyValuesWithPrevious(
  monthDate: string,
  prevMonthDate: string
): Promise<{
  current: MonthlyAccountValue[];
  previous: MonthlyAccountValue[];
}> {
  const supabase = createClient();

  const [currentResult, previousResult] = await Promise.all([
    supabase
      .from("monthly_account_values")
      .select("*, account:accounts(*)")
      .eq("month_date", monthDate)
      .order("created_at", { ascending: true }),
    supabase
      .from("monthly_account_values")
      .select("*, account:accounts(*)")
      .eq("month_date", prevMonthDate)
      .order("created_at", { ascending: true }),
  ]);

  if (currentResult.error) {
    console.error("getMonthlyValuesWithPrevious current error:", currentResult.error.message);
  }
  if (previousResult.error) {
    console.error("getMonthlyValuesWithPrevious previous error:", previousResult.error.message);
  }

  return {
    current: currentResult.data ?? [],
    previous: previousResult.data ?? [],
  };
}

export async function saveMonthlyValues(
  monthDate: string,
  entries: { accountId: string; value: number }[]
): Promise<{ error?: string }> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Upsert all entries
  const rows = entries.map((entry) => ({
    user_id: user.id,
    account_id: entry.accountId,
    month_date: monthDate,
    value: entry.value,
    source: "manual" as const,
  }));

  const { error } = await supabase
    .from("monthly_account_values")
    .upsert(rows, {
      onConflict: "user_id,account_id,month_date",
    });

  if (error) return { error: error.message };

  // Recalculate snapshot after saving
  const snapshotResult = await recalculateSnapshot(monthDate);
  if (snapshotResult.error) {
    console.error("Snapshot recalculation error:", snapshotResult.error);
  }

  return {};
}

export async function copyPreviousMonthValues(
  sourceMonth: string,
  targetMonth: string
): Promise<{ error?: string; copied?: number }> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Fetch source month values
  const { data: sourceValues, error: fetchError } = await supabase
    .from("monthly_account_values")
    .select("account_id, value")
    .eq("month_date", sourceMonth)
    .eq("user_id", user.id);

  if (fetchError) return { error: fetchError.message };
  if (!sourceValues || sourceValues.length === 0) {
    return { error: "No values found for previous month" };
  }

  // Check which accounts already have values in target month
  const { data: existingValues } = await supabase
    .from("monthly_account_values")
    .select("account_id")
    .eq("month_date", targetMonth)
    .eq("user_id", user.id);

  const existingAccountIds = new Set(
    (existingValues ?? []).map((v: { account_id: string }) => v.account_id)
  );

  // Only copy values for accounts that don't already have target month values
  const newRows = sourceValues
    .filter((v: { account_id: string }) => !existingAccountIds.has(v.account_id))
    .map((v: { account_id: string; value: number }) => ({
      user_id: user.id,
      account_id: v.account_id,
      month_date: targetMonth,
      value: v.value,
      source: "manual" as const,
    }));

  if (newRows.length === 0) {
    return { copied: 0 };
  }

  const { error: insertError } = await supabase
    .from("monthly_account_values")
    .insert(newRows);

  if (insertError) return { error: insertError.message };

  // Recalculate snapshot after copying
  const snapshotResult = await recalculateSnapshot(targetMonth);
  if (snapshotResult.error) {
    console.error("Snapshot recalculation error:", snapshotResult.error);
  }

  return { copied: newRows.length };
}

// ─── Snapshots ──────────────────────────────────────────

export async function recalculateSnapshot(
  monthDate: string
): Promise<{ error?: string }> {
  const supabase = createClient();

  const { error } = await supabase.rpc("recalculate_snapshot", {
    target_month: monthDate,
  });

  if (error) return { error: error.message };
  return {};
}

export async function getSnapshots(
  limit: number = 24
): Promise<MonthlySnapshot[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("monthly_snapshots")
    .select("*")
    .order("month_date", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("getSnapshots error:", error.message);
    return [];
  }
  return data ?? [];
}

export async function getLatestSnapshot(): Promise<MonthlySnapshot | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("monthly_snapshots")
    .select("*")
    .order("month_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("getLatestSnapshot error:", error.message);
    return null;
  }
  return data;
}

export async function getSnapshotForMonth(
  monthDate: string
): Promise<MonthlySnapshot | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("monthly_snapshots")
    .select("*")
    .eq("month_date", monthDate)
    .maybeSingle();

  if (error) {
    console.error("getSnapshotForMonth error:", error.message);
    return null;
  }
  return data;
}
