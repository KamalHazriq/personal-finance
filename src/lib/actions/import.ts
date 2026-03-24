"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { Import, ImportRow } from "@/types/database";

export async function getImports(): Promise<Import[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("imports")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getImportById(id: string): Promise<Import | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("imports")
    .select("*")
    .eq("id", id)
    .single();

  if (error && error.code !== "PGRST116") throw new Error(error.message);
  return data;
}

export async function getImportRows(importId: string): Promise<ImportRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("import_rows")
    .select("*")
    .eq("import_id", importId)
    .order("id", { ascending: true });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createImport(
  filename: string,
  rows: { raw_data: Record<string, unknown>; month_date?: string; value?: number; resolved_account_id?: string }[],
  mappingJson: Record<string, unknown>
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Create the import record
  const { data: importRecord, error: importError } = await supabase
    .from("imports")
    .insert({
      user_id: user.id,
      filename,
      import_status: "pending",
      total_rows: rows.length,
      mapping_json: mappingJson,
    })
    .select()
    .single();

  if (importError) return { error: importError.message };

  // Create import rows
  const importRows = rows.map((row) => ({
    import_id: importRecord.id,
    user_id: user.id,
    raw_data: row.raw_data,
    month_date: row.month_date || null,
    value: row.value ?? null,
    resolved_account_id: row.resolved_account_id || null,
    status: "pending" as const,
  }));

  const { error: rowsError } = await supabase
    .from("import_rows")
    .insert(importRows);

  if (rowsError) return { error: rowsError.message };

  revalidatePath("/import");
  return { success: true, importId: importRecord.id };
}

export async function commitImport(importId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Update import status
  await supabase
    .from("imports")
    .update({ import_status: "processing" })
    .eq("id", importId);

  // Get pending rows with resolved account and month_date
  const { data: rows, error: fetchError } = await supabase
    .from("import_rows")
    .select("*")
    .eq("import_id", importId)
    .eq("status", "pending")
    .not("resolved_account_id", "is", null)
    .not("month_date", "is", null);

  if (fetchError) return { error: fetchError.message };
  if (!rows || rows.length === 0) {
    await supabase
      .from("imports")
      .update({ import_status: "completed", success_rows: 0 })
      .eq("id", importId);
    return { success: true, processed: 0 };
  }

  let successCount = 0;
  let failCount = 0;
  let skipCount = 0;
  const monthsToRecalculate = new Set<string>();

  for (const row of rows) {
    if (!row.resolved_account_id || !row.month_date || row.value === null) {
      await supabase
        .from("import_rows")
        .update({ status: "skipped", error_message: "Missing required fields" })
        .eq("id", row.id);
      skipCount++;
      continue;
    }

    // Check for duplicates
    const { data: existing } = await supabase
      .from("monthly_account_values")
      .select("id")
      .eq("user_id", user.id)
      .eq("account_id", row.resolved_account_id)
      .eq("month_date", row.month_date)
      .single();

    if (existing) {
      // Overwrite existing value
      const { error: updateError } = await supabase
        .from("monthly_account_values")
        .update({ value: row.value, source: "import" })
        .eq("id", existing.id);

      if (updateError) {
        await supabase
          .from("import_rows")
          .update({ status: "failed", error_message: updateError.message })
          .eq("id", row.id);
        failCount++;
        continue;
      }
    } else {
      // Insert new value
      const { error: insertError } = await supabase
        .from("monthly_account_values")
        .insert({
          user_id: user.id,
          account_id: row.resolved_account_id,
          month_date: row.month_date,
          value: row.value,
          source: "import",
        });

      if (insertError) {
        await supabase
          .from("import_rows")
          .update({ status: "failed", error_message: insertError.message })
          .eq("id", row.id);
        failCount++;
        continue;
      }
    }

    await supabase
      .from("import_rows")
      .update({ status: "success" })
      .eq("id", row.id);
    successCount++;
    monthsToRecalculate.add(row.month_date);
  }

  // Recalculate snapshots for affected months
  for (const monthDate of monthsToRecalculate) {
    await supabase.rpc("recalculate_snapshot", {
      p_user_id: user.id,
      p_month_date: monthDate,
    });
  }

  // Update import record
  await supabase
    .from("imports")
    .update({
      import_status: "completed",
      success_rows: successCount,
      failed_rows: failCount,
      skipped_rows: skipCount,
    })
    .eq("id", importId);

  revalidatePath("/import");
  revalidatePath("/dashboard");
  revalidatePath("/history");
  return { success: true, processed: successCount, failed: failCount, skipped: skipCount };
}
