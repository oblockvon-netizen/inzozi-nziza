import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SectionHeader } from "@/components/dashboard/SectionHeader";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Download, Wallet, History } from "lucide-react";

interface FinePayment {
  id: string;
  amount: number;
  paid_at: string;
}

interface Fine {
  id: string;
  user_id: string;
  amount: number;
  amount_paid: number;
  reason: string;
  status: "pending" | "paid" | "cancelled";
  issued_at: string;
  paid_at: string | null;
  payments?: FinePayment[];
}

interface FineDialogData {
  userId: string;
  userName: string;
}

interface PaymentDialogData {
  fineId: string;
  totalAmount: number;
  amountPaid: number;
  userName: string;
}

interface FinesManagementProps {
  users: Array<{
    user_id: string;
    full_name: string;
  }>;
  onUpdate: () => void;
}

export default function FinesManagement({
  users,
  onUpdate,
}: FinesManagementProps) {
  const [fines, setFines] = useState<Fine[]>([]);
  const [showFineDialog, setShowFineDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showPaymentHistoryDialog, setShowPaymentHistoryDialog] =
    useState(false);
  const [selectedFine, setSelectedFine] = useState<Fine | null>(null);
  const [fineData, setFineData] = useState<FineDialogData | null>(null);
  const [paymentData, setPaymentData] = useState<PaymentDialogData | null>(
    null
  );
  const [amount, setAmount] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [reason, setReason] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    loadFines();
    const refreshInterval = setInterval(loadFines, 5000);
    return () => clearInterval(refreshInterval);
  }, []);

  const loadFines = async () => {
    try {
      // Fetch fines
      const { data: finesData, error: finesError } = await supabase
        .from("fines")
        .select("*")
        .order("issued_at", { ascending: false });

      if (finesError) throw finesError;

      // Fetch payments for each fine
      const finesWithPayments = await Promise.all(
        (finesData || []).map(async (fine) => {
          const { data: payments, error: paymentsError } = await supabase
            .from("fine_payments")
            .select("*")
            .eq("fine_id", fine.id)
            .order("paid_at", { ascending: false });

          if (paymentsError) throw paymentsError;

          return {
            ...fine,
            payments: payments || [],
          };
        })
      );

      setFines(finesWithPayments);
    } catch (error: any) {
      toast({
        title: "Error loading fines",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleAddFine = async () => {
    if (!fineData) return;

    try {
      const fineAmount = parseFloat(amount);
      if (isNaN(fineAmount) || fineAmount <= 0) {
        throw new Error("Please enter a valid amount");
      }

      if (!reason.trim()) {
        throw new Error("Please enter a reason for the fine");
      }

      const { error } = await supabase.from("fines").insert({
        user_id: fineData.userId,
        amount: fineAmount,
        amount_paid: 0,
        reason: reason.trim(),
        status: "pending",
      });

      if (error) throw error;

      toast({
        title: "Fine Added",
        description: `Fine of ${fineAmount.toLocaleString()} RWF has been added for ${
          fineData.userName
        }`,
      });

      setAmount("");
      setReason("");
      setShowFineDialog(false);
      setFineData(null);
      loadFines();
      onUpdate();
    } catch (error: any) {
      toast({
        title: "Error adding fine",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handlePayment = async () => {
    if (!paymentData) return;

    try {
      const payAmount = parseFloat(paymentAmount);
      if (isNaN(payAmount) || payAmount <= 0) {
        throw new Error("Please enter a valid payment amount");
      }

      const remainingAmount = paymentData.totalAmount - paymentData.amountPaid;
      if (payAmount > remainingAmount) {
        throw new Error("Payment amount cannot exceed the remaining balance");
      }

      // Insert the payment record
      const { error: paymentError } = await supabase
        .from("fine_payments")
        .insert({
          fine_id: paymentData.fineId,
          amount: payAmount,
        });

      if (paymentError) throw paymentError;

      // Update the fine's amount_paid
      const newAmountPaid = paymentData.amountPaid + payAmount;
      const newStatus = newAmountPaid >= paymentData.totalAmount ? "paid" : "pending";
      
      const { error: updateError } = await supabase
        .from("fines")
        .update({ 
          amount_paid: newAmountPaid,
          status: newStatus,
          paid_at: newStatus === "paid" ? new Date().toISOString() : null
        })
        .eq("id", paymentData.fineId);

      if (updateError) throw updateError;

      toast({
        title: "Payment Recorded",
        description: `Payment of ${payAmount.toLocaleString()} RWF has been recorded.`,
      });

      setShowPaymentDialog(false);
      setPaymentData(null);
      setPaymentAmount("");
      loadFines();
      onUpdate();
    } catch (error: any) {
      toast({
        title: "Error recording payment",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleCancelFine = async (fineId: string) => {
    try {
      const { error } = await supabase
        .from("fines")
        .update({ status: "cancelled" })
        .eq("id", fineId);

      if (error) throw error;

      toast({
        title: "Fine Cancelled",
        description: "The fine has been cancelled successfully.",
      });

      loadFines();
      onUpdate();
    } catch (error: any) {
      toast({
        title: "Error cancelling fine",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const downloadFinesReport = () => {
    const csvData = fines.map((fine) => {
      const user = users.find((u) => u.user_id === fine.user_id);
      return {
        "User Name": user?.full_name || "Unknown",
        "Amount (RWF)": fine.amount,
        "Amount Paid (RWF)": fine.amount_paid,
        "Remaining (RWF)": fine.amount - fine.amount_paid,
        Reason: fine.reason,
        Status: fine.status,
        "Issued Date": new Date(fine.issued_at).toLocaleDateString(),
        "Paid Date": fine.paid_at
          ? new Date(fine.paid_at).toLocaleDateString()
          : "-",
      };
    });

    const headers = Object.keys(csvData[0]);
    const csvString = [
      headers.join(","),
      ...csvData.map((row) =>
        headers.map((header) => `"${row[header]}"`).join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `fines_report_${
      new Date().toISOString().split("T")[0]
    }.csv`;
    link.click();
  };

  return (
    <div className="space-y-4">
      <SectionHeader
        title="Fines management"
        description="Issue fines and record member payments"
        action={
          <Button onClick={downloadFinesReport} variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Download report
          </Button>
        }
      />

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Paid</TableHead>
            <TableHead>Remaining</TableHead>
            <TableHead>Reason</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Issued</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {fines.map((fine) => {
            const user = users.find((u) => u.user_id === fine.user_id);
            const remainingAmount = fine.amount - fine.amount_paid;
            return (
              <TableRow key={fine.id}>
                <TableCell>{user?.full_name || "Unknown"}</TableCell>
                <TableCell>{fine.amount.toLocaleString()} RWF</TableCell>
                <TableCell>{fine.amount_paid.toLocaleString()} RWF</TableCell>
                <TableCell>{remainingAmount.toLocaleString()} RWF</TableCell>
                <TableCell className="max-w-[300px] truncate">
                  {fine.reason}
                </TableCell>
                <TableCell>
                  <StatusBadge status={fine.status} />
                </TableCell>
                <TableCell>
                  {new Date(fine.issued_at).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    {fine.status === "pending" && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setPaymentData({
                              fineId: fine.id,
                              totalAmount: fine.amount,
                              amountPaid: fine.amount_paid,
                              userName: user?.full_name || "Unknown",
                            });
                            setShowPaymentDialog(true);
                          }}
                        >
                          <Wallet className="h-4 w-4 mr-1" />
                          Pay
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedFine(fine);
                            setShowPaymentHistoryDialog(true);
                          }}
                        >
                          <History className="h-4 w-4 mr-1" />
                          History
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCancelFine(fine.id)}
                        >
                          Cancel
                        </Button>
                      </>
                    )}
                    {(fine.status === "paid" ||
                      fine.status === "cancelled") && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedFine(fine);
                          setShowPaymentHistoryDialog(true);
                        }}
                      >
                        <History className="h-4 w-4 mr-1" />
                        History
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2">
        {users.map((user) => (
          <Button
            key={user.user_id}
            variant="outline"
            size="sm"
            onClick={() => {
              setFineData({
                userId: user.user_id,
                userName: user.full_name,
              });
              setShowFineDialog(true);
            }}
          >
            Fine {user.full_name}
          </Button>
        ))}
      </div>

      {/* Add Fine Dialog */}
      <Dialog open={showFineDialog} onOpenChange={setShowFineDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Fine</DialogTitle>
            <DialogDescription>
              Add a fine for {fineData?.userName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (RWF)</Label>
              <Input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount in RWF"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reason">Reason</Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Enter reason for the fine"
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFineDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddFine}>Add Fine</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>
              Record a payment for {paymentData?.userName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm mb-2">
                <span>
                  Total Amount: {paymentData?.totalAmount.toLocaleString()} RWF
                </span>
                <span>
                  Already Paid: {paymentData?.amountPaid.toLocaleString()} RWF
                </span>
              </div>
              <div className="bg-secondary/20 p-3 rounded-md mb-4">
                <p className="text-sm font-medium">
                  Remaining Balance:{" "}
                  {paymentData
                    ? (
                        paymentData.totalAmount - paymentData.amountPaid
                      ).toLocaleString()
                    : 0}{" "}
                  RWF
                </p>
              </div>
              <Label htmlFor="paymentAmount">Payment Amount (RWF)</Label>
              <Input
                id="paymentAmount"
                type="number"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder="Enter payment amount in RWF"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowPaymentDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={handlePayment}>Record Payment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment History Dialog */}
      <Dialog
        open={showPaymentHistoryDialog}
        onOpenChange={setShowPaymentHistoryDialog}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Payment History</DialogTitle>
            <DialogDescription>Payment history for fine</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedFine?.payments?.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No payments recorded yet.
              </p>
            ) : (
              <div className="space-y-2">
                {selectedFine?.payments?.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex justify-between items-center border-b pb-2"
                  >
                    <div>
                      <p className="font-medium">
                        {payment.amount.toLocaleString()} RWF
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(payment.paid_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
                <div className="mt-4 pt-4 border-t">
                  <div className="flex justify-between text-sm font-medium">
                    <span>Total Paid:</span>
                    <span>
                      {selectedFine?.amount_paid.toLocaleString()} RWF
                    </span>
                  </div>
                  <div className="flex justify-between text-sm font-medium mt-1">
                    <span>Remaining:</span>
                    <span>
                      {selectedFine
                        ? (
                            selectedFine.amount - selectedFine.amount_paid
                          ).toLocaleString()
                        : 0}{" "}
                      RWF
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setShowPaymentHistoryDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
