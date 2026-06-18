import { Plus, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AdminToolbar } from "./AdminToolbar";
import type { AdminUser } from "@/types/api";

interface UsersManagementProps {
  users: AdminUser[];
  search: string;
  onSearchChange: (v: string) => void;
  filter: string;
  onFilterChange: (v: string) => void;
  selected: Set<string>;
  onToggle: (userId: string) => void;
  onToggleAll: (ids: string[]) => void;
  onApprove: (userId: string) => void;
  onAddContribution: (user: AdminUser) => void;
  onBulkApprove: () => void;
  onBulkReject: () => void;
}

export function UsersManagement({
  users,
  search,
  onSearchChange,
  filter,
  onFilterChange,
  selected,
  onToggle,
  onToggleAll,
  onApprove,
  onAddContribution,
  onBulkApprove,
  onBulkReject,
}: UsersManagementProps) {
  const allSelected = users.length > 0 && users.every((u) => selected.has(u.userId));

  return (
    <div className="space-y-4">
      <AdminToolbar
        search={search}
        onSearchChange={onSearchChange}
        searchPlaceholder="Search members..."
        filter={filter}
        onFilterChange={onFilterChange}
        filterOptions={[
          { value: "all", label: "All members" },
          { value: "pending", label: "Pending" },
          { value: "approved", label: "Approved" },
        ]}
        selectedCount={selected.size}
        bulkActions={[
          { label: "Approve selected", onClick: onBulkApprove },
          { label: "Reject selected", onClick: onBulkReject, variant: "destructive" },
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
                        onToggleAll(allSelected ? [] : users.map((u) => u.userId))
                      }
                      className="h-4 w-4 rounded border-border accent-accent"
                    />
                  </TableHead>
                  <TableHead>Member</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Contributions</TableHead>
                  <TableHead>Loans</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                      No members match your search
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={selected.has(u.userId)}
                          onChange={() => onToggle(u.userId)}
                          className="h-4 w-4 rounded border-border accent-accent"
                        />
                      </TableCell>
                      <TableCell>
                        <p className="font-medium">{u.fullName}</p>
                        <p className="text-xs text-muted-foreground">{u.email}</p>
                      </TableCell>
                      <TableCell>
                        <Badge variant={u.isApproved ? "default" : "secondary"}>
                          {u.isApproved ? "Approved" : "Pending"}
                        </Badge>
                      </TableCell>
                      <TableCell className="tabular-nums">
                        {u.totalContributions.toLocaleString()} RWF
                      </TableCell>
                      <TableCell>{u.loanCount}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-2">
                          <Button size="sm" variant="outline" onClick={() => onAddContribution(u)}>
                            <Plus className="mr-1 h-3 w-3" />
                            Contribute
                          </Button>
                          {!u.isApproved && (
                            <Button size="sm" onClick={() => onApprove(u.userId)}>
                              <CheckCircle2 className="mr-1 h-3 w-3" />
                              Approve
                            </Button>
                          )}
                        </div>
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
