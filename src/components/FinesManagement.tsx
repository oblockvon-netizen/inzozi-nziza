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
import { finesApi, toNumber, isStatus, ApiError } from "@/lib/api";
import type { Fine } from "@/types/api";
import { Download, Wallet, History } from "lucide-react";

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

export default function FinesManagement({ users, onUpdate }: FinesManagementProps) {
  const [fines, setFines] = useState<Fine[]>([]);
  const [showFineDialog, setShowFineDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showPaymentHistoryDialog, setShowPaymentHistoryDialog] = useState(false);
  const [selectedFine, setSelectedFine] = useState<Fine | null>(null);
  const [fineData, setFineData] = useState<FineDialogData | null>(null);
  const [paymentData, setPaymentData] = useState<PaymentDialogData | null>(null);
  const [amount, setAmount] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [reason, setReason] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    loadFines();
    const refreshInterval = setInterval(loadFines, 5000);
    return () => clearInterval(refreshInterval);
  }, []);

  const getAmountPaid = (fine: Fine) => toNumber(fine.amountPaid);
  const getFineAmount = (fine: Fine) => toNumber(fine.amount);
  const getRemaining = (fine: Fine) =>
    fine.remaining != null ? toNumber(fine.remaining) : getFineAmount(fine) - getAmountPaid(fine);

  const loadFines = async () => {
    try {
      const { fines: data } = await finesApi.listAll();
      setFines(data);
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Failed to load fines";
      toast({ title: "Error loading fines", description: message, variant: "destructive" });
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

      await finesApi.issue({
        userId: fineData.userId,
        amount: fineAmount,
        reason: reason.trim(),
      });

      toast({
        title: "Fine Added",
        description: `Fine of ${fineAmount.toLocaleString()} RWF has been added for ${fineData.userName}`,
      });

      setAmount("");
      setReason("");
      setShowFineDialog(false);
      setFineData(null);
      loadFines();
      onUpdate();
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Failed to add fine";
      toast({ title: "Error adding fine", description: message, variant: "destructive" });
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

      await finesApi.recordPayment(paymentData.fineId, { amount: payAmount });

      toast({
        title: "Payment Recorded",
        description: `Payment of ${payAmount.toLocaleString()} RWF has been recorded.`,
      });

      setShowPaymentDialog(false);
      setPaymentData(null);
      setPaymentAmount("");
      loadFines();
      onUpdate();
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Payment failed";
      toast({ title: "Error recording payment", description: message, variant: "destructive" });
    }
  };

  const handleCancelFine = async (fineId: string) => {
    try {
      await finesApi.cancel(fineId);

      toast({
        title: "Fine Cancelled",
        description: "The fine has been cancelled successfully.",
      });

      loadFines();
      onUpdate();
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Cancel failed";
      toast({ title: "Error cancelling fine", description: message, variant: "destructive" });
    }
  };

  const downloadFinesReport = () => {
    if (fines.length === 0) return;

    const csvData = fines.map((fine) => {
      const user = users.find((u) => u.user_id === fine.userId);
      const amountPaid = getAmountPaid(fine);
      const fineAmount = getFineAmount(fine);
      return {
        "User Name": user?.full_name || fine.userName || "Unknown",
        "Amount (RWF)": fineAmount,
        "Amount Paid (RWF)": amountPaid,
        "Remaining (RWF)": getRemaining(fine),
        Reason: fine.reason,
        Status: fine.status,
        "Issued Date": new Date(fine.issuedAt).toLocaleDateString(),
        "Paid Date": fine.paidAt ? new Date(fine.paidAt).toLocaleDateString() : "-",
      };
    });

    const headers = Object.keys(csvData[0]);
    const csvString = [
      headers.join(","),
      ...csvData.map((row) =>
        headers.map((header) => `"${row[header as keyof typeof row]}"`).join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `fines_report_${new Date().toISOString().split("T")[0]}.csv`;
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
                  const user = users.find((u) => u.user_id === fine.userId);
                  const amountPaid = getAmountPaid(fine);
                  const fineAmount = getFineAmount(fine);
                  const remainingAmount = getRemaining(fine);
                  const userName = user?.full_name || fine.userName || "Unknown";

                  return (
                    <TableRow key={fine.id}>
                      <TableCell>{userName}</TableCell>
                      <TableCell>{fineAmount.toLocaleString()} RWF</TableCell>
                      <TableCell>{amountPaid.toLocaleString()} RWF</TableCell>
                      <TableCell>{remainingAmount.toLocaleString()} RWF</TableCell>
                      <TableCell className="max-w-[300px] truncate">{fine.reason}</TableCell>
                      <TableCell>
                        <StatusBadge status={fine.status} />
                      </TableCell>
                      <TableCell>{new Date(fine.issuedAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {isStatus(fine.status, "PENDING") && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setPaymentData({
                                    fineId: fine.id,
                                    totalAmount: fineAmount,
                                    amountPaid,
                                    userName,
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
                          {(isStatus(fine.status, "PAID") ||
                            isStatus(fine.status, "CANCELLED")) && (
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
              setFineData({ userId: user.user_id, userName: user.full_name });
              setShowFineDialog(true);
            }}
          >
            Fine {user.full_name}
          </Button>
        ))}
      </div>

      <Dialog open={showFineDialog} onOpenChange={setShowFineDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Fine</DialogTitle>
            <DialogDescription>Add a fine for {fineData?.userName}</DialogDescription>
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

      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>Record a payment for {paymentData?.userName}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm mb-2">
                <span>Total Amount: {paymentData?.totalAmount.toLocaleString()} RWF</span>
                <span>Already Paid: {paymentData?.amountPaid.toLocaleString()} RWF</span>
              </div>
              <div className="bg-secondary/20 p-3 rounded-md mb-4">
                <p className="text-sm font-medium">
                  Remaining Balance:{" "}
                  {paymentData
                    ? (paymentData.totalAmount - paymentData.amountPaid).toLocaleString()
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
            <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handlePayment}>Record Payment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showPaymentHistoryDialog} onOpenChange={setShowPaymentHistoryDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Payment History</DialogTitle>
            <DialogDescription>Payment history for fine</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {!selectedFine?.payments?.length ? (
              <p className="text-sm text-muted-foreground">No payments recorded yet.</p>
            ) : (
              <div className="space-y-2">
                {selectedFine.payments.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex justify-between items-center border-b pb-2"
                  >
                    <div>
                      <p className="font-medium">{toNumber(payment.amount).toLocaleString()} RWF</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(payment.paidAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
                <div className="mt-4 pt-4 border-t">
                  <div className="flex justify-between text-sm font-medium">
                    <span>Total Paid:</span>
                    <span>
                      {selectedFine ? getAmountPaid(selectedFine).toLocaleString() : 0} RWF
                    </span>
                  </div>
                  <div className="flex justify-between text-sm font-medium mt-1">
                    <span>Remaining:</span>
                    <span>
                      {selectedFine ? getRemaining(selectedFine).toLocaleString() : 0} RWF
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setShowPaymentHistoryDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
