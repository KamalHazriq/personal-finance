import { getSnapshots } from "@/lib/actions/monthly-values";
import { HistoryView } from "@/components/charts/history-view";

export default async function HistoryPage() {
  const snapshots = await getSnapshots();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Net Worth History</h1>
        <p className="text-sm text-muted-foreground">
          Track your net worth progression over time.
        </p>
      </div>
      <HistoryView snapshots={snapshots} />
    </div>
  );
}
