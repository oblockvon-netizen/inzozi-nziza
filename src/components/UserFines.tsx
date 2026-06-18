import { useState, useEffect } from "react";
import { AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { finesApi, toNumber, ApiError } from "@/lib/api";
import type { Fine } from "@/types/api";

function UserFines() {
  const [fines, setFines] = useState<Fine[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadFines();
  }, []);

  const loadFines = async () => {
    try {
      const { fines: data } = await finesApi.mine();
      setFines(data);
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Failed to load fines";
      toast({ title: "Error loading fines", description: message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const getRemainingAmount = (fine: Fine) => {
    if (fine.remaining != null) return toNumber(fine.remaining);
    return toNumber(fine.amount) - toNumber(fine.amountPaid);
  };

  const totalPendingAmount = fines
    .filter((fine) => fine.status === "PENDING")
    .reduce((sum, fine) => sum + getRemainingAmount(fine), 0);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted border-t-accent" />
        Loading fines...
      </div>
    );
  }

  if (fines.length === 0) {
    return <p className="text-sm text-muted-foreground">No fines on your account</p>;
  }

  return (
    <div>
      {totalPendingAmount > 0 && (
        <div className="mb-4 flex items-start gap-3 rounded-lg border border-destructive/20 bg-destructive/5 p-4">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
          <p className="text-sm text-muted-foreground">
            You have pending fines totaling{" "}
            <span className="font-semibold tabular-nums text-destructive">
              {totalPendingAmount.toLocaleString()} RWF
            </span>
          </p>
        </div>
      )}
      <div className="space-y-3">
        {fines.map((fine) => (
          <div
            key={fine.id}
            className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/30 px-4 py-3"
          >
            <div>
              <p className="font-medium tabular-nums">
                {getRemainingAmount(fine).toLocaleString()} RWF
              </p>
              <p className="text-sm text-muted-foreground">{fine.reason}</p>
              <p className="text-xs text-muted-foreground">
                Issued: {new Date(fine.issuedAt).toLocaleDateString()}
              </p>
            </div>
            <StatusBadge status={fine.status} />
          </div>
        ))}
      </div>
    </div>
  );
}

export default UserFines;
