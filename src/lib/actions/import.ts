import { createClient } from "@/lib/supabase/client";
import type { Import, ImportRow } from "@/types/database";

export async function getImports(): Promise<Import[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("imports")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getImports error:", error.message);
    return [];
  }
  return data ?? [];
}

export async function getImportById(
  id: string
): Promise<Import | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("imports")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("getImportById error:", error.message);
    return null;
  }
  return data;
}

export async function getImportRows(
  importId: string
): Promise<ImportRow[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("import_rows")
    .select("*")
    .eq("import_id", importId)
    .order("id", { ascending: true });

  if (error) {
    console.error("getImportRows error:", error.message);
    return [];
  }
  return data ?? [];
}

export async function createImport(
  filename: string,
  rows: {
    raw_data: Record<string, unknown>;
    month_date: string;
    value: number;
    resolved_account_id: string;
  }[],
  mappingJson: Record<string, unknown>
): Promise<{ error?: string; importId?: string }> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Create the import record
  const { data: importData, error: importError } = await supabase
    .from("imports")
    .insert({
      user_id: user.id,
      filename,
      import_status: "pending" as const,
      total_rows: rows.length,
      success_rows: 0,
      failed_rows: 0,
      skipped_rows: 0,
      mapping_json: mappingJson,
    })
    .select("id")
    .single();

  if (importError) return { error: importError.message };
  if (!importData) return { error: "Failed to create import record" };

  const importId = importData.id;

  // Insert import rows
  const importRows = rows.map((row) => ({
    import_id: importId,
    user_id: user.id,
    raw_data: row.raw_data,
    status: "pending" as const,
    resolved_account_id: row.resolved_account_id,
    month_date: row.month_date,
    value: row.value,
  }));

  const { error: rowsError } = await supabase
    .from("import_rows")
    .insert(importRows);

  if (rowsError) return { error: rowsError.message };

  return { importId };
}

export async function commitImport(
  importId: string
): Promise<{
  error?: string;
  processed?: number;
  failed?: number;
  skipped?: number;
}> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Update import status to processing
  await supabase
    .from("imports")
    .update({ import_status: "processing" })
    .eq("id", importId);

  // Fetch all pending rows
  const { data: rows, error: fetchError } = await supabase
    .from("import_rows")
    .select("*")
    .eq("import_id", importId)
    .eq("status", "pending");

  if (fetchError) return { error: fetchError.message };
  if (!rows || rows.length === 0) return { error: "No rows to process" };

  let processed = 0;
  let failed = 0;
  let skipped = 0;

  for (const row of rows) {
    if (!row.resolved_account_id || !row.month_date || row.value === null) {
      // Mark as skipped
      await supabase
        .from("import_rows")
        .update({ status: "skipped" })
        .eq("id", row.id);
      skipped++;
      continue;
    }

    // Upsert the monthly account value
    const { error: upsertError } = await supabase
      .from("monthly_account_values")
      .upsert(
        {
          user_id: user.id,
          account_id: row.resolved_account_id,
          month_date: row.month_date,
          value: row.value,
          source: "import" as const,
        },
        {
          onConflict: "user_id,account_id,month_date",
        }
      );

    if (upsertError) {
      await supabase
        .from("import_rows")
        .update({
          status: "failed",
          error_message: upsertError.message,
        })
        .eq("id", row.id);
      failed++;
    } else {
      await supabase
        .from("import_rows")
        .update({ status: "success" })
        .eq("id", row.id);
      processed++;

      // Recalculate snapshot for this month
      await supabase.rpc("recalculate_snapshot", {
        target_month: row.month_date,
      });
    }
  }

  // Update import record with final counts
  const finalStatus = failed === rows.length ? "failed" : "completed";
  await supabase
    .from("imports")
    .update({
      import_status: finalStatus,
      success_rows: processed,
      failed_rows: failed,
      skipped_rows: skipped,
    })
    .eq("id", importId);

  return { processed, failed, skipped };
}
