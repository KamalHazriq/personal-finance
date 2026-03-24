"use client";

import * as React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { AccountFormDialog } from "@/components/accounts/account-form-dialog";
import {
  toggleAccountActive,
  deleteAccount,
} from "@/lib/actions/accounts";
import { toast } from "@/lib/toast";
import type { Account, AccountCategory } from "@/types/database";
import {
  Plus,
  Pencil,
  Trash2,
  Lock,
  Building2,
  Wallet,
  PackageOpen,
} from "lucide-react";

interface AccountListProps {
  accounts: Account[];
  categories: AccountCategory[];
}

export function AccountList({ accounts, categories }: AccountListProps) {
  const [filterCategory, setFilterCategory] = React.useState<string>("all");
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingAccount, setEditingAccount] = React.useState<Account | null>(null);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  const filtered = React.useMemo(() => {
    if (filterCategory === "all") return accounts;
    return accounts.filter((a) => a.category_id === filterCategory);
  }, [accounts, filterCategory]);

  function handleEdit(account: Account) {
    setEditingAccount(account);
    setDialogOpen(true);
  }

  function handleAdd() {
    setEditingAccount(null);
    setDialogOpen(true);
  }

  async function handleToggleActive(id: string, current: boolean) {
    const result = await toggleAccountActive(id, !current);
    if (result && "error" in result && result.error) {
      toast.error(result.error);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this account? This cannot be undone.")) return;
    setDeletingId(id);
    try {
      const result = await deleteAccount(id);
      if (result && "error" in result && result.error) {
        toast.error(result.error);
      } else {
        toast.success("Account deleted");
      }
    } catch {
      toast.error("Failed to delete account");
    } finally {
      setDeletingId(null);
    }
  }

  function getCategoryName(categoryId: string): string {
    return categories.find((c) => c.id === categoryId)?.name ?? "Unknown";
  }

  function formatAccountType(type: string): string {
    return type.charAt(0).toUpperCase() + type.slice(1).replace(/_/g, " ");
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Select value={filterCategory} onValueChange={(v) => setFilterCategory(v ?? "all")}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={handleAdd} size="default">
          <Plus className="size-4 mr-1" />
          Add Account
        </Button>
      </div>

      {/* Empty state */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <PackageOpen className="size-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground">
              No accounts found
            </h3>
            <p className="text-sm text-muted-foreground/70 mt-1 max-w-sm">
              {filterCategory !== "all"
                ? "No accounts in this category. Try a different filter or add a new account."
                : "Get started by adding your first account."}
            </p>
            <Button onClick={handleAdd} variant="outline" className="mt-4">
              <Plus className="size-4 mr-1" />
              Add Account
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block">
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Institution</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-center">Active</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((account) => (
                    <TableRow
                      key={account.id}
                      className={!account.is_active ? "opacity-50" : ""}
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {account.name}
                          {account.is_locked_fund && (
                            <Badge variant="warning" className="gap-1">
                              <Lock className="size-3" />
                              Locked
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getCategoryName(account.category_id)}</TableCell>
                      <TableCell>{formatAccountType(account.account_type)}</TableCell>
                      <TableCell>
                        {account.institution ? (
                          <span className="flex items-center gap-1">
                            <Building2 className="size-3.5 text-muted-foreground" />
                            {account.institution}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={account.is_active ? "success" : "secondary"}>
                          {account.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Switch
                          checked={account.is_active}
                          onCheckedChange={() =>
                            handleToggleActive(account.id, account.is_active)
                          }
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => handleEdit(account)}
                          >
                            <Pencil className="size-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => handleDelete(account.id)}
                            disabled={deletingId === account.id}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </div>

          {/* Mobile Cards */}
          <div className="grid gap-3 md:hidden">
            {filtered.map((account) => (
              <Card
                key={account.id}
                className={!account.is_active ? "opacity-50" : ""}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1 min-w-0">
                      <CardTitle className="text-base flex items-center gap-2 flex-wrap">
                        {account.name}
                        {account.is_locked_fund && (
                          <Badge variant="warning" className="gap-1">
                            <Lock className="size-3" />
                            Locked
                          </Badge>
                        )}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {getCategoryName(account.category_id)} &middot;{" "}
                        {formatAccountType(account.account_type)}
                      </p>
                    </div>
                    <Switch
                      checked={account.is_active}
                      onCheckedChange={() =>
                        handleToggleActive(account.id, account.is_active)
                      }
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      {account.institution && (
                        <span className="flex items-center gap-1">
                          <Building2 className="size-3.5" />
                          {account.institution}
                        </span>
                      )}
                      {!account.institution && (
                        <span className="flex items-center gap-1">
                          <Wallet className="size-3.5" />
                          {account.currency}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleEdit(account)}
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleDelete(account.id)}
                        disabled={deletingId === account.id}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Form Dialog */}
      <AccountFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        account={editingAccount}
        categories={categories}
      />
    </div>
  );
}
