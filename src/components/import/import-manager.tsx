"use client";

import { useState, useCallback, useTransition, useRef } from "react";
import * as XLSX from "xlsx";
import Papa from "papaparse";
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Loader2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createImport, commitImport } from "@/lib/actions/import";
import { formatMonth } from "@/lib/format";
import type { Import, Account } from "@/types/database";

interface ImportManagerProps {
  imports: Import[];
  accounts: Account[];
}

type Step = 1 | 2 | 3 | 4;

interface ColumnMapping {
  columnIndex: number;
  columnName: string;
  accountId: string; // "" means skip
}

interface ParsedRow {
  monthDate: string;
  values: Record<string, number>; // accountId -> value
  raw: Record<string, unknown>;
  isDuplicate: boolean;
  isInvalid: boolean;
  skip: boolean;
}

export function ImportManager({ imports, accounts }: ImportManagerProps) {
  const [step, setStep] = useState<Step>(1);
  const [fileName, setFileName] = useState("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rawData, setRawData] = useState<string[][]>([]);
  const [mappings, setMappings] = useState<ColumnMapping[]>([]);
  const [monthColumn, setMonthColumn] = useState(0);
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [importId, setImportId] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<{
    processed: number;
    failed: number;
    skipped: number;
  } | null>(null);
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Step 1: File Upload ---

  function parseFile(file: File) {
    setFileName(file.name);

    if (file.name.endsWith(".csv")) {
      Papa.parse(file, {
        complete(results) {
          const data = results.data as string[][];
          if (data.length > 0) {
            setHeaders(data[0]);
            setRawData(data.slice(1).filter((row) => row.some((cell) => cell)));
            initMappings(data[0]);
            setStep(2);
          }
        },
        error() {
          toast.error("Failed to parse CSV file");
        },
      });
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const workbook = XLSX.read(e.target?.result, { type: "array" });
          const sheet = workbook.Sheets[workbook.SheetNames[0]];
          const data = XLSX.utils.sheet_to_json<string[]>(sheet, {
            header: 1,
          });
          if (data.length > 0) {
            const headerRow = data[0].map(String);
            setHeaders(headerRow);
            setRawData(
              data.slice(1).filter((row) => row.some((cell) => cell)) as string[][]
            );
            initMappings(headerRow);
            setStep(2);
          }
        } catch {
          toast.error("Failed to parse spreadsheet file");
        }
      };
      reader.readAsArrayBuffer(file);
    }
  }

  function initMappings(headerRow: string[]) {
    const maps: ColumnMapping[] = headerRow.map((name, i) => ({
      columnIndex: i,
      columnName: name,
      accountId: "",
    }));
    setMappings(maps);
    setMonthColumn(0);
  }

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) parseFile(file);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) parseFile(file);
  };

  // --- Step 2: Column Mapping ---

  function updateMapping(colIndex: number, accountId: string) {
    setMappings((prev) =>
      prev.map((m) =>
        m.columnIndex === colIndex ? { ...m, accountId } : m
      )
    );
  }

  // --- Step 3: Preview ---

  function buildPreview() {
    const activeMappings = mappings.filter((m) => m.accountId && m.columnIndex !== monthColumn);

    const rows: ParsedRow[] = rawData
      .map((row) => {
        const rawMonthVal = row[monthColumn];
        const monthDate = parseMonthDate(rawMonthVal);
        const values: Record<string, number> = {};
        let isInvalid = !monthDate;

        for (const m of activeMappings) {
          const rawVal = row[m.columnIndex];
          const num = parseFloat(String(rawVal ?? "").replace(/,/g, ""));
          if (isNaN(num)) {
            isInvalid = true;
          } else {
            values[m.accountId] = num;
          }
        }

        return {
          monthDate: monthDate || "",
          values,
          raw: Object.fromEntries(headers.map((h, i) => [h, row[i]])),
          isDuplicate: false,
          isInvalid,
          skip: isInvalid,
        };
      })
      .filter((r) => r.monthDate || Object.keys(r.values).length > 0);

    setParsedRows(rows);
    setStep(3);
  }

  function parseMonthDate(val: unknown): string | null {
    if (!val) return null;
    const str = String(val).trim();

    // Try YYYY-MM-DD or YYYY-MM-01
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
      return str.substring(0, 7) + "-01";
    }
    // Try YYYY-MM
    if (/^\d{4}-\d{2}$/.test(str)) {
      return str + "-01";
    }
    // Try "Jan 2025", "January 2025", etc.
    const dateAttempt = new Date(str);
    if (!isNaN(dateAttempt.getTime())) {
      const y = dateAttempt.getFullYear();
      const m = String(dateAttempt.getMonth() + 1).padStart(2, "0");
      if (y > 2000 && y < 2100) return `${y}-${m}-01`;
    }
    return null;
  }

  function toggleRowSkip(index: number) {
    setParsedRows((prev) =>
      prev.map((r, i) => (i === index ? { ...r, skip: !r.skip } : r))
    );
  }

  // --- Step 4: Confirm & Import ---

  function handleImport() {
    const activeMappings = mappings.filter((m) => m.accountId && m.columnIndex !== monthColumn);
    const validRows = parsedRows.filter((r) => !r.skip && !r.isInvalid);

    // Flatten: each parsed row can have multiple account values
    const importRows: {
      raw_data: Record<string, unknown>;
      month_date: string;
      value: number;
      resolved_account_id: string;
    }[] = [];

    for (const row of validRows) {
      for (const [accountId, value] of Object.entries(row.values)) {
        importRows.push({
          raw_data: row.raw,
          month_date: row.monthDate,
          value,
          resolved_account_id: accountId,
        });
      }
    }

    const mappingJson: Record<string, unknown> = {
      monthColumn: headers[monthColumn],
      columns: activeMappings.map((m) => ({
        column: m.columnName,
        accountId: m.accountId,
      })),
    };

    startTransition(async () => {
      const createResult = await createImport(fileName, importRows, mappingJson);
      if (createResult?.error) {
        toast.error(createResult.error);
        return;
      }

      const id = createResult.importId!;
      setImportId(id);

      const commitResult = await commitImport(id);
      if (commitResult?.error) {
        toast.error(commitResult.error);
        return;
      }

      setImportResult({
        processed: commitResult.processed ?? 0,
        failed: commitResult.failed ?? 0,
        skipped: commitResult.skipped ?? 0,
      });
      toast.success("Import completed successfully");
      setStep(4);
    });
  }

  function resetImport() {
    setStep(1);
    setFileName("");
    setHeaders([]);
    setRawData([]);
    setMappings([]);
    setParsedRows([]);
    setImportId(null);
    setImportResult(null);
  }

  // --- Summary stats ---
  const validCount = parsedRows.filter((r) => !r.skip && !r.isInvalid).length;
  const invalidCount = parsedRows.filter((r) => r.isInvalid).length;
  const skippedCount = parsedRows.filter((r) => r.skip && !r.isInvalid).length;

  return (
    <div className="space-y-6">
      {/* Steps Indicator */}
      <div className="flex items-center gap-2 text-sm">
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`flex size-7 items-center justify-center rounded-full text-xs font-medium ${
                step >= s
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {s}
            </div>
            <span
              className={`hidden sm:inline ${
                step === s ? "font-medium text-foreground" : "text-muted-foreground"
              }`}
            >
              {s === 1
                ? "Upload"
                : s === 2
                ? "Map Columns"
                : s === 3
                ? "Preview"
                : "Done"}
            </span>
            {s < 4 && (
              <div className="hidden h-px w-8 bg-border sm:block" />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Upload */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Upload Spreadsheet</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border p-12 transition-colors hover:border-primary/50"
            >
              <Upload className="mb-4 size-10 text-muted-foreground/50" />
              <p className="mb-2 text-sm font-medium">
                Drag and drop your file here
              </p>
              <p className="mb-4 text-xs text-muted-foreground">
                Supports .csv and .xlsx files
              </p>
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
              >
                <FileSpreadsheet className="size-4" />
                Choose File
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileInput}
                className="hidden"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Column Mapping */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Map Columns to Accounts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              File: <span className="font-medium text-foreground">{fileName}</span>{" "}
              ({rawData.length} rows, {headers.length} columns)
            </p>

            {/* Month Column Selector */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Which column contains the month/date?
              </label>
              <select
                value={monthColumn}
                onChange={(e) => setMonthColumn(Number(e.target.value))}
                className="flex h-9 w-full max-w-xs rounded-lg border border-border bg-background px-3 py-1 text-sm"
              >
                {headers.map((h, i) => (
                  <option key={i} value={i}>
                    {h}
                  </option>
                ))}
              </select>
            </div>

            {/* Column Mappings */}
            <div className="space-y-3">
              <p className="text-sm font-medium">
                Map each data column to an account (or skip):
              </p>
              {mappings
                .filter((m) => m.columnIndex !== monthColumn)
                .map((m) => (
                  <div
                    key={m.columnIndex}
                    className="flex flex-col gap-2 rounded-lg border border-border p-3 sm:flex-row sm:items-center"
                  >
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">
                      {m.columnName}
                    </span>
                    <select
                      value={m.accountId}
                      onChange={(e) =>
                        updateMapping(m.columnIndex, e.target.value)
                      }
                      className="flex h-9 w-full rounded-lg border border-border bg-background px-3 py-1 text-sm sm:w-64"
                    >
                      <option value="">Skip this column</option>
                      {accounts.map((acc) => (
                        <option key={acc.id} value={acc.id}>
                          {acc.name}
                          {acc.category ? ` (${acc.category.name})` : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
            </div>

            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={() => setStep(1)}>
                <ArrowLeft className="size-4" />
                Back
              </Button>
              <Button
                onClick={buildPreview}
                disabled={
                  !mappings.some(
                    (m) => m.accountId && m.columnIndex !== monthColumn
                  )
                }
              >
                Preview Import
                <ArrowRight className="size-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Preview */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Preview & Validate</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Summary */}
            <div className="flex flex-wrap gap-3">
              <Badge variant="success">
                <CheckCircle2 className="mr-1 size-3" />
                {validCount} rows to import
              </Badge>
              {invalidCount > 0 && (
                <Badge variant="destructive">
                  <AlertTriangle className="mr-1 size-3" />
                  {invalidCount} invalid
                </Badge>
              )}
              {skippedCount > 0 && (
                <Badge variant="secondary">
                  {skippedCount} skipped
                </Badge>
              )}
            </div>

            {/* Preview Table */}
            <div className="max-h-96 overflow-auto rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-muted">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium">
                      Status
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium">
                      Month
                    </th>
                    {mappings
                      .filter((m) => m.accountId && m.columnIndex !== monthColumn)
                      .map((m) => (
                        <th
                          key={m.columnIndex}
                          className="px-3 py-2 text-right text-xs font-medium"
                        >
                          {accounts.find((a) => a.id === m.accountId)?.name ??
                            m.columnName}
                        </th>
                      ))}
                    <th className="px-3 py-2 text-center text-xs font-medium">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {parsedRows.map((row, i) => {
                    const activeMappings = mappings.filter(
                      (m) => m.accountId && m.columnIndex !== monthColumn
                    );
                    return (
                      <tr
                        key={i}
                        className={`border-t border-border/50 ${
                          row.skip || row.isInvalid ? "opacity-40" : ""
                        }`}
                      >
                        <td className="px-3 py-2">
                          {row.isInvalid ? (
                            <AlertTriangle className="size-4 text-red-500" />
                          ) : row.skip ? (
                            <X className="size-4 text-muted-foreground" />
                          ) : (
                            <CheckCircle2 className="size-4 text-emerald-500" />
                          )}
                        </td>
                        <td className="px-3 py-2 text-xs">
                          {row.monthDate
                            ? formatMonth(row.monthDate)
                            : "Invalid"}
                        </td>
                        {activeMappings.map((m) => (
                          <td
                            key={m.columnIndex}
                            className="px-3 py-2 text-right text-xs tabular-nums"
                          >
                            {row.values[m.accountId] !== undefined
                              ? row.values[m.accountId].toLocaleString("en-MY", {
                                  minimumFractionDigits: 2,
                                })
                              : "-"}
                          </td>
                        ))}
                        <td className="px-3 py-2 text-center">
                          {!row.isInvalid && (
                            <button
                              onClick={() => toggleRowSkip(i)}
                              className="text-xs text-primary hover:underline"
                            >
                              {row.skip ? "Include" : "Skip"}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={() => setStep(2)}>
                <ArrowLeft className="size-4" />
                Back
              </Button>
              <Button
                onClick={handleImport}
                disabled={isPending || validCount === 0}
              >
                {isPending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    Confirm Import ({validCount} rows)
                    <ArrowRight className="size-4" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Done */}
      {step === 4 && importResult && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CheckCircle2 className="mb-4 size-12 text-emerald-500" />
            <h3 className="mb-1 text-lg font-semibold">Import Complete</h3>
            <div className="mb-6 space-y-1 text-center text-sm text-muted-foreground">
              <p>
                <span className="font-medium text-foreground">
                  {importResult.processed}
                </span>{" "}
                rows imported successfully
              </p>
              {importResult.failed > 0 && (
                <p>
                  <span className="font-medium text-red-500">
                    {importResult.failed}
                  </span>{" "}
                  rows failed
                </p>
              )}
              {importResult.skipped > 0 && (
                <p>
                  <span className="font-medium text-muted-foreground">
                    {importResult.skipped}
                  </span>{" "}
                  rows skipped
                </p>
              )}
            </div>
            <Button onClick={resetImport}>Import Another File</Button>
          </CardContent>
        </Card>
      )}

      {/* Import History */}
      {imports.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Import History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="pb-3 text-left text-xs font-medium text-muted-foreground">
                      File
                    </th>
                    <th className="pb-3 text-left text-xs font-medium text-muted-foreground">
                      Status
                    </th>
                    <th className="pb-3 text-right text-xs font-medium text-muted-foreground">
                      Total
                    </th>
                    <th className="pb-3 text-right text-xs font-medium text-muted-foreground">
                      Success
                    </th>
                    <th className="pb-3 text-right text-xs font-medium text-muted-foreground">
                      Failed
                    </th>
                    <th className="pb-3 text-right text-xs font-medium text-muted-foreground hidden sm:table-cell">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {imports.map((imp) => (
                    <tr
                      key={imp.id}
                      className="border-b border-border/50 last:border-0"
                    >
                      <td className="py-3 font-medium">{imp.filename}</td>
                      <td className="py-3">
                        <Badge
                          variant={
                            imp.import_status === "completed"
                              ? "success"
                              : imp.import_status === "failed"
                              ? "destructive"
                              : "secondary"
                          }
                        >
                          {imp.import_status}
                        </Badge>
                      </td>
                      <td className="py-3 text-right">{imp.total_rows}</td>
                      <td className="py-3 text-right">{imp.success_rows}</td>
                      <td className="py-3 text-right">{imp.failed_rows}</td>
                      <td className="py-3 text-right text-muted-foreground hidden sm:table-cell">
                        {new Date(imp.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
