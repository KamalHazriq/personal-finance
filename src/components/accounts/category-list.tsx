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
import { CategoryFormDialog } from "@/components/accounts/category-form-dialog";
import { deleteCategory } from "@/lib/actions/accounts";
import { toast } from "@/lib/toast";
import type { AccountCategory, CategoryType } from "@/types/database";
import { Plus, Pencil, Trash2, PackageOpen } from "lucide-react";

interface CategoryListProps {
  categories: AccountCategory[];
  accountCountMap: Record<string, number>;
}

const TYPE_BADGE_VARIANT: Record<CategoryType, "success" | "destructive" | "warning"> = {
  asset: "success",
  liability: "destructive",
  income: "warning",
};

function formatType(type: CategoryType): string {
  return type.charAt(0).toUpperCase() + type.slice(1);
}

export function CategoryList({
  categories,
  accountCountMap,
}: CategoryListProps) {
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingCategory, setEditingCategory] =
    React.useState<AccountCategory | null>(null);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  function handleAdd() {
    setEditingCategory(null);
    setDialogOpen(true);
  }

  function handleEdit(category: AccountCategory) {
    setEditingCategory(category);
    setDialogOpen(true);
  }

  async function handleDelete(id: string, accountCount: number) {
    if (accountCount > 0) {
      toast.error(
        `Cannot delete category with ${accountCount} account${accountCount > 1 ? "s" : ""}. Move or delete the accounts first.`
      );
      return;
    }

    if (!confirm("Are you sure you want to delete this category?")) return;

    setDeletingId(id);
    try {
      const result = await deleteCategory(id);
      if (result && "error" in result && result.error) {
        toast.error(result.error);
      } else {
        toast.success("Category deleted");
      }
    } catch {
      toast.error("Failed to delete category");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex justify-end">
        <Button onClick={handleAdd} size="default">
          <Plus className="size-4 mr-1" />
          Add Category
        </Button>
      </div>

      {/* Empty state */}
      {categories.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <PackageOpen className="size-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground">
              No categories yet
            </h3>
            <p className="text-sm text-muted-foreground/70 mt-1 max-w-sm">
              Create categories to organize your accounts (e.g. Bank Accounts,
              Investments, Credit Cards).
            </p>
            <Button onClick={handleAdd} variant="outline" className="mt-4">
              <Plus className="size-4 mr-1" />
              Add Category
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
                    <TableHead>Type</TableHead>
                    <TableHead className="text-center">Accounts</TableHead>
                    <TableHead className="text-center">Sort Order</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.map((category) => {
                    const count = accountCountMap[category.id] ?? 0;
                    return (
                      <TableRow key={category.id}>
                        <TableCell className="font-medium">
                          {category.name}
                        </TableCell>
                        <TableCell>
                          <Badge variant={TYPE_BADGE_VARIANT[category.type]}>
                            {formatType(category.type)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary">{count}</Badge>
                        </TableCell>
                        <TableCell className="text-center text-muted-foreground">
                          {category.sort_order}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => handleEdit(category)}
                            >
                              <Pencil className="size-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => handleDelete(category.id, count)}
                              disabled={deletingId === category.id}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Card>
          </div>

          {/* Mobile Cards */}
          <div className="grid gap-3 md:hidden">
            {categories.map((category) => {
              const count = accountCountMap[category.id] ?? 0;
              return (
                <Card key={category.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <CardTitle className="text-base">
                          {category.name}
                        </CardTitle>
                        <div className="flex items-center gap-2">
                          <Badge variant={TYPE_BADGE_VARIANT[category.type]}>
                            {formatType(category.type)}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {count} account{count !== 1 ? "s" : ""}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleEdit(category)}
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleDelete(category.id, count)}
                          disabled={deletingId === category.id}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </>
      )}

      {/* Form Dialog */}
      <CategoryFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        category={editingCategory}
      />
    </div>
  );
}
