import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { AdminToolbar } from "./AdminToolbar";
import type { AdminUser, Loan } from "@/types/api";
import { isStatus, toNumber } from "@/lib/api";
import { CheckCircle2 } from "lucide-react";

interface LoansManagementProps {
  loans: Loan[];
  users: AdminUser[];
  search: string;
  onSearchChange: (v: string) => void;
  filter: string;
  onFilterChange: (v: string) => void;
  selected: Set<string>;
  onToggle: (loanId: string) => void;
  onToggleAll: (ids: string[]) => void;
  onReview: (loan: Loan) => void;
  onRecordPayment: (loan: Loan, userName: string) => void;
  onBulkApprove: () => void;
  onBulkDeny: () => void;
}

export function LoansManagement({
  loans,
  users,
  search,
  onSearchChange,
  filter,
  onFilterChange,
  selected,
  onToggle,
  onToggleAll,
  onReview,
  onRecordPayment,
  onBulkApprove,
  onBulkDeny,
}: LoansManagementProps) {
  const userMap = new Map(users.map((u) => [u.userId, u.fullName]));
  const allSelected = loans.length > 0 && loans.every((l) => selected.has(l.id));

  return (
    <div className="space-y-4">
      <AdminToolbar
        search={search}
        onSearchChange={onSearchChange}
        searchPlaceholder="Search loans..."
        filter={filter}
        onFilterChange={onFilterChange}
        filterOptions={[
          { value: "all", label: "All statuses" },
          { value: "pending", label: "Pending" },
          { value: "approved", label: "Approved" },
          { value: "denied", label: "Denied" },
        ]}
        selectedCount={selected.size}
        bulkActions={[
          { label: "Approve selected", onClick: onBulkApprove },
          { label: "Deny selected", onClick: onBulkDeny, variant: "destructive" },
        ]}
      />

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={() =>
                        onToggleAll(allSelected ? [] : loans.map((l) => l.id))
                      }
                      className="h-4 w-4 rounded border-border accent-accent"
                    />
                  </TableHead>
                  <TableHead>Member</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Purpose</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Applied</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loans.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                      No loans match your filters
                    </TableCell>
                  </TableRow>
                ) : (
                  loans.map((loan) => {
                    const name = userMap.get(loan.userId) ?? loan.userName ?? "Unknown";
                    const total = toNumber(loan.totalWithInterest) || toNumber(loan.amount) * 1.05;
                    const paid = toNumber(loan.amountPaid);
                    const isPaid = paid >= total;

                    return (
                      <TableRow key={loan.id}>
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={selected.has(loan.id)}
                            onChange={() => onToggle(loan.id)}
                            className="h-4 w-4 rounded border-border accent-accent"
                          />
                        </TableCell>
                        <TableCell>{name}</TableCell>
                        <TableCell className="tabular-nums">
                          {toNumber(loan.amount).toLocaleString()} RWF
                        </TableCell>
                        <TableCell className="max-w-[180px] truncate">{loan.purpose}</TableCell>
                        <TableCell>
                          <StatusBadge status={loan.status} />
                        </TableCell>
                        <TableCell>
                          {new Date(loan.appliedAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-2">
                            {isStatus(loan.status, "PENDING") && (
                              <Button size="sm" variant="outline" onClick={() => onReview(loan)}>
                                Review
                              </Button>
                            )}
                            {isStatus(loan.status, "APPROVED") && !isPaid && (
                              <Button size="sm" onClick={() => onRecordPayment(loan, name)}>
                                Record payment
                              </Button>
                            )}
                            {isStatus(loan.status, "APPROVED") && isPaid && (
                              <span className="flex items-center gap-1 text-xs text-accent">
                                <CheckCircle2 className="h-3 w-3" /> Paid
                              </span>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
