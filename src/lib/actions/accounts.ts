"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { Account, AccountCategory } from "@/types/database";

// ─── Categories ───────────────────────────────────────────

export async function getCategories(): Promise<AccountCategory[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("account_categories")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createCategory(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase.from("account_categories").insert({
    user_id: user.id,
    name: formData.get("name") as string,
    type: formData.get("type") as string,
    sort_order: parseInt(formData.get("sort_order") as string) || 0,
  });

  if (error) return { error: error.message };
  revalidatePath("/categories");
  revalidatePath("/accounts");
  return { success: true };
}

export async function updateCategory(id: string, formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("account_categories")
    .update({
      name: formData.get("name") as string,
      type: formData.get("type") as string,
      sort_order: parseInt(formData.get("sort_order") as string) || 0,
    })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/categories");
  revalidatePath("/accounts");
  return { success: true };
}

export async function deleteCategory(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("account_categories")
    .delete()
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/categories");
  revalidatePath("/accounts");
  return { success: true };
}

// ─── Accounts ─────────────────────────────────────────────

export async function getAccounts(): Promise<Account[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("accounts")
    .select("*, category:account_categories(*)")
    .order("sort_order", { ascending: true });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getActiveAccounts(): Promise<Account[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("accounts")
    .select("*, category:account_categories(*)")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createAccount(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase.from("accounts").insert({
    user_id: user.id,
    category_id: formData.get("category_id") as string,
    name: formData.get("name") as string,
    account_type: formData.get("account_type") as string,
    institution: (formData.get("institution") as string) || null,
    currency: (formData.get("currency") as string) || "MYR",
    is_locked_fund: formData.get("is_locked_fund") === "true",
    is_active: true,
    notes: (formData.get("notes") as string) || null,
    sort_order: parseInt(formData.get("sort_order") as string) || 0,
  });

  if (error) return { error: error.message };
  revalidatePath("/accounts");
  revalidatePath("/monthly-update");
  return { success: true };
}

export async function updateAccount(id: string, formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("accounts")
    .update({
      category_id: formData.get("category_id") as string,
      name: formData.get("name") as string,
      account_type: formData.get("account_type") as string,
      institution: (formData.get("institution") as string) || null,
      currency: (formData.get("currency") as string) || "MYR",
      is_locked_fund: formData.get("is_locked_fund") === "true",
      is_active: formData.get("is_active") !== "false",
      notes: (formData.get("notes") as string) || null,
      sort_order: parseInt(formData.get("sort_order") as string) || 0,
    })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/accounts");
  revalidatePath("/monthly-update");
  return { success: true };
}

export async function deleteAccount(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("accounts")
    .delete()
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/accounts");
  return { success: true };
}

export async function toggleAccountActive(id: string, isActive: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("accounts")
    .update({ is_active: isActive })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/accounts");
  return { success: true };
}
