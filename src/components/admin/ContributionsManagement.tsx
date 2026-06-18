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
import type { AdminUser, Contribution } from "@/types/api";
import { toNumber } from "@/lib/api";

interface ContributionsManagementProps {
  contributions: Contribution[];
  users: AdminUser[];
  search: string;
  onSearchChange: (v: string) => void;
  filter: string;
  onFilterChange: (v: string) => void;
}

export function ContributionsManagement({
  contributions,
  users,
  search,
  onSearchChange,
  filter,
  onFilterChange,
}: ContributionsManagementProps) {
  const userMap = new Map(users.map((u) => [u.userId, u.fullName]));

  return (
    <div className="space-y-4">
      <AdminToolbar
        search={search}
        onSearchChange={onSearchChange}
        searchPlaceholder="Search by member..."
        filter={filter}
        onFilterChange={onFilterChange}
        filterOptions={[
          { value: "all", label: "All statuses" },
          { value: "completed", label: "Completed" },
          { value: "pending", label: "Pending" },
          { value: "failed", label: "Failed" },
        ]}
      />

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Reference</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contributions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                      No contributions match your filters
                    </TableCell>
                  </TableRow>
                ) : (
                  contributions.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">
                        {userMap.get(c.userId) ?? c.userName ?? "Unknown"}
                      </TableCell>
                      <TableCell className="tabular-nums">
                        {toNumber(c.amount).toLocaleString()} RWF
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={c.status} />
                      </TableCell>
                      <TableCell>
                        {new Date(c.paymentDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {c.referenceNumber ?? "—"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
