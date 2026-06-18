import { Badge } from "@/components/ui/badge";
import { AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { useState, useEffect } from "react";

interface Fine {
  id: string;
  user_id: string;
  amount: number;
  reason: string;
  status: "pending" | "paid" | "cancelled";
  issued_at: string;
  paid_at: string | null;
  admin_notes: string | null;
  created_at: string;
  fine_payments: {
    amount: number;
  }[];
}

interface UserFinesProps {
  userId: string;
}

function UserFines({ userId }: UserFinesProps) {
  const [fines, setFines] = useState<Fine[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadFines();
  }, [userId]);

  const loadFines = async () => {
    try {
      const { data, error } = await supabase
        .from("fines")
        .select(
          `
          *,
          fine_payments (
            amount
          )
        `
        )
        .eq("user_id", userId)
        .order("issued_at", { ascending: false });

      if (error) throw error;
      setFines(data || []);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "An error occurred while loading fines";
      toast({
        title: "Error loading fines",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getRemainingAmount = (fine: Fine) => {
    const totalPaid =
      fine.fine_payments?.reduce((sum, payment) => sum + payment.amount, 0) ||
      0;
    return fine.amount - totalPaid;
  };

  const totalPendingAmount = fines
    .filter((fine) => fine.status === "pending")
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
    return (
      <p className="text-sm text-muted-foreground">No fines on your account</p>
    );
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
        {fines.map((fine) => {
          const remainingAmount = getRemainingAmount(fine);
          return (
            <div
              key={fine.id}
              className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/30 px-4 py-3"
            >
              <div>
                <p className="font-medium tabular-nums">
                  {remainingAmount.toLocaleString()} RWF
                </p>
                <p className="text-sm text-muted-foreground">{fine.reason}</p>
                <p className="text-xs text-muted-foreground">
                  Issued: {new Date(fine.issued_at).toLocaleDateString()}
                </p>
              </div>
              <StatusBadge status={fine.status} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default UserFines;
