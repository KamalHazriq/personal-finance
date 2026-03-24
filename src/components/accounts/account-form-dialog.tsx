"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { createAccount, updateAccount } from "@/lib/actions/accounts";
import { toast } from "@/lib/toast";
import type { Account, AccountCategory, AccountType } from "@/types/database";

const ACCOUNT_TYPES: { value: AccountType; label: string }[] = [
  { value: "bank", label: "Bank" },
  { value: "investment", label: "Investment" },
  { value: "retirement", label: "Retirement" },
  { value: "crypto", label: "Crypto" },
  { value: "gold", label: "Gold" },
  { value: "ewallet", label: "E-Wallet" },
  { value: "cash", label: "Cash" },
  { value: "liability", label: "Liability" },
  { value: "income", label: "Income" },
];

interface AccountFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account?: Account | null;
  categories: AccountCategory[];
}

export function AccountFormDialog({
  open,
  onOpenChange,
  account,
  categories,
}: AccountFormDialogProps) {
  const isEditing = !!account;
  const [isPending, setIsPending] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const [name, setName] = React.useState("");
  const [categoryId, setCategoryId] = React.useState("");
  const [accountType, setAccountType] = React.useState<string>("bank");
  const [institution, setInstitution] = React.useState("");
  const [currency, setCurrency] = React.useState("MYR");
  const [isLockedFund, setIsLockedFund] = React.useState(false);
  const [notes, setNotes] = React.useState("");
  const [sortOrder, setSortOrder] = React.useState("0");

  // Reset form when dialog opens or account changes
  React.useEffect(() => {
    if (open) {
      if (account) {
        setName(account.name);
        setCategoryId(account.category_id);
        setAccountType(account.account_type);
        setInstitution(account.institution ?? "");
        setCurrency(account.currency);
        setIsLockedFund(account.is_locked_fund);
        setNotes(account.notes ?? "");
        setSortOrder(String(account.sort_order));
      } else {
        setName("");
        setCategoryId(categories[0]?.id ?? "");
        setAccountType("bank");
        setInstitution("");
        setCurrency("MYR");
        setIsLockedFund(false);
        setNotes("");
        setSortOrder("0");
      }
      setErrors({});
    }
  }, [open, account, categories]);

  function validate(): boolean {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = "Name is required";
    if (!categoryId) newErrors.category_id = "Category is required";
    if (!accountType) newErrors.account_type = "Account type is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setIsPending(true);
    try {
      const formData = new FormData();
      formData.set("name", name.trim());
      formData.set("category_id", categoryId);
      formData.set("account_type", accountType);
      formData.set("institution", institution.trim());
      formData.set("currency", currency.trim() || "MYR");
      formData.set("is_locked_fund", String(isLockedFund));
      formData.set("notes", notes.trim());
      formData.set("sort_order", sortOrder);

      const result = isEditing
        ? await updateAccount(account.id, formData)
        : await createAccount(formData);

      if (result && "error" in result && result.error) {
        toast.error(result.error);
      } else {
        toast.success(isEditing ? "Account updated" : "Account created");
        onOpenChange(false);
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Account" : "Add Account"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update account details below."
              : "Fill in the details to create a new account."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="account-name">Name *</Label>
            <Input
              id="account-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. CIMB Savings"
              aria-invalid={!!errors.name}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name}</p>
            )}
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label>Category *</Label>
            <Select value={categoryId} onValueChange={(v) => setCategoryId(v ?? "")}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.category_id && (
              <p className="text-xs text-destructive">{errors.category_id}</p>
            )}
          </div>

          {/* Account Type */}
          <div className="space-y-2">
            <Label>Account Type *</Label>
            <Select value={accountType} onValueChange={(v) => setAccountType(v ?? "")}>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {ACCOUNT_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.account_type && (
              <p className="text-xs text-destructive">{errors.account_type}</p>
            )}
          </div>

          {/* Institution & Currency row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="account-institution">Institution</Label>
              <Input
                id="account-institution"
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                placeholder="e.g. CIMB Bank"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="account-currency">Currency</Label>
              <Input
                id="account-currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                placeholder="MYR"
              />
            </div>
          </div>

          {/* Locked Fund checkbox */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="account-locked-fund"
              checked={isLockedFund}
              onChange={(e) => setIsLockedFund(e.target.checked)}
              className="size-4 rounded border border-input accent-primary"
            />
            <Label htmlFor="account-locked-fund" className="font-normal">
              Locked fund (excluded from liquid net worth)
            </Label>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="account-notes">Notes</Label>
            <Input
              id="account-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes"
            />
          </div>

          {/* Sort Order */}
          <div className="space-y-2">
            <Label htmlFor="account-sort-order">Sort Order</Label>
            <Input
              id="account-sort-order"
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
            />
          </div>

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending
                ? isEditing
                  ? "Saving..."
                  : "Creating..."
                : isEditing
                  ? "Save Changes"
                  : "Create Account"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
