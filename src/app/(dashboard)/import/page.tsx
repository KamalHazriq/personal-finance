import { getImports } from "@/lib/actions/import";
import { getActiveAccounts } from "@/lib/actions/accounts";
import { ImportManager } from "@/components/import/import-manager";

export default async function ImportPage() {
  const [imports, accounts] = await Promise.all([
    getImports(),
    getActiveAccounts(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Import Data</h1>
        <p className="text-sm text-muted-foreground">
          Import monthly values from spreadsheets.
        </p>
      </div>
      <ImportManager imports={imports} accounts={accounts} />
    </div>
  );
}
