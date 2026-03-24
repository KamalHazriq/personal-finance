import { createClient } from "@/lib/supabase/client";
import type { AccountCategory, Account } from "@/types/database";

// ─── Categories ─────────────────────────────────────────

export async function getCategories(): Promise<AccountCategory[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("account_categories")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("getCategories error:", error.message);
    return [];
  }
  return data ?? [];
}

export async function createCategory(
  formData: FormData
): Promise<{ error?: string }> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const name = formData.get("name") as string;
  const type = formData.get("type") as string;
  const sortOrder = parseInt(formData.get("sort_order") as string, 10) || 0;

  if (!name?.trim()) return { error: "Name is required" };
  if (!type) return { error: "Type is required" };

  const { error } = await supabase.from("account_categories").insert({
    user_id: user.id,
    name: name.trim(),
    type,
    sort_order: sortOrder,
  });

  if (error) return { error: error.message };
  return {};
}

export async function updateCategory(
  id: string,
  formData: FormData
): Promise<{ error?: string }> {
  const supabase = createClient();

  const name = formData.get("name") as string;
  const type = formData.get("type") as string;
  const sortOrder = parseInt(formData.get("sort_order") as string, 10) || 0;

  if (!name?.trim()) return { error: "Name is required" };
  if (!type) return { error: "Type is required" };

  const { error } = await supabase
    .from("account_categories")
    .update({
      name: name.trim(),
      type,
      sort_order: sortOrder,
    })
    .eq("id", id);

  if (error) return { error: error.message };
  return {};
}

export async function deleteCategory(
  id: string
): Promise<{ error?: string }> {
  const supabase = createClient();

  const { error } = await supabase
    .from("account_categories")
    .delete()
    .eq("id", id);

  if (error) return { error: error.message };
  return {};
}

// ─── Accounts ───────────────────────────────────────────

export async function getAccounts(): Promise<Account[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("accounts")
    .select("*, category:account_categories(*)")
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("getAccounts error:", error.message);
    return [];
  }
  return data ?? [];
}

export async function getActiveAccounts(): Promise<Account[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("accounts")
    .select("*, category:account_categories(*)")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("getActiveAccounts error:", error.message);
    return [];
  }
  return data ?? [];
}

export async function createAccount(
  formData: FormData
): Promise<{ error?: string }> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const name = formData.get("name") as string;
  const categoryId = formData.get("category_id") as string;
  const accountType = formData.get("account_type") as string;
  const institution = (formData.get("institution") as string) || null;
  const currency = (formData.get("currency") as string) || "MYR";
  const isLockedFund = formData.get("is_locked_fund") === "true";
  const notes = (formData.get("notes") as string) || null;
  const sortOrder = parseInt(formData.get("sort_order") as string, 10) || 0;

  if (!name?.trim()) return { error: "Name is required" };
  if (!categoryId) return { error: "Category is required" };
  if (!accountType) return { error: "Account type is required" };

  const { error } = await supabase.from("accounts").insert({
    user_id: user.id,
    name: name.trim(),
    category_id: categoryId,
    account_type: accountType,
    institution: institution?.trim() || null,
    currency: currency.trim(),
    is_locked_fund: isLockedFund,
    notes: notes?.trim() || null,
    sort_order: sortOrder,
  });

  if (error) return { error: error.message };
  return {};
}

export async function updateAccount(
  id: string,
  formData: FormData
): Promise<{ error?: string }> {
  const supabase = createClient();

  const name = formData.get("name") as string;
  const categoryId = formData.get("category_id") as string;
  const accountType = formData.get("account_type") as string;
  const institution = (formData.get("institution") as string) || null;
  const currency = (formData.get("currency") as string) || "MYR";
  const isLockedFund = formData.get("is_locked_fund") === "true";
  const notes = (formData.get("notes") as string) || null;
  const sortOrder = parseInt(formData.get("sort_order") as string, 10) || 0;

  if (!name?.trim()) return { error: "Name is required" };
  if (!categoryId) return { error: "Category is required" };
  if (!accountType) return { error: "Account type is required" };

  const { error } = await supabase
    .from("accounts")
    .update({
      name: name.trim(),
      category_id: categoryId,
      account_type: accountType,
      institution: institution?.trim() || null,
      currency: currency.trim(),
      is_locked_fund: isLockedFund,
      notes: notes?.trim() || null,
      sort_order: sortOrder,
    })
    .eq("id", id);

  if (error) return { error: error.message };
  return {};
}

export async function deleteAccount(
  id: string
): Promise<{ error?: string }> {
  const supabase = createClient();

  const { error } = await supabase
    .from("accounts")
    .delete()
    .eq("id", id);

  if (error) return { error: error.message };
  return {};
}

export async function toggleAccountActive(
  id: string,
  isActive: boolean
): Promise<{ error?: string }> {
  const supabase = createClient();

  const { error } = await supabase
    .from("accounts")
    .update({ is_active: isActive })
    .eq("id", id);

  if (error) return { error: error.message };
  return {};
}
