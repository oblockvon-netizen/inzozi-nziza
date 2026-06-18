import { motion } from "framer-motion";
import { CheckCircle2, XCircle, UserPlus, CreditCard } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { ApprovalItem } from "@/lib/admin-analytics";

interface ApprovalCenterProps {
  items: ApprovalItem[];
  onApproveUser: (userId: string) => void;
  onRejectUser: (userId: string) => void;
  onReviewLoan: (loanId: string) => void;
  onBulkApproveUsers: () => void;
  selectedUserIds: Set<string>;
  onToggleUser: (userId: string) => void;
}

export function ApprovalCenter({
  items,
  onApproveUser,
  onRejectUser,
  onReviewLoan,
  onBulkApproveUsers,
  selectedUserIds,
  onToggleUser,
}: ApprovalCenterProps) {
  const userItems = items.filter((i) => i.type === "user");
  const loanItems = items.filter((i) => i.type === "loan");

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
      <Card className="h-full border-border/60 shadow-sm">
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <div>
              <CardTitle className="text-lg">Approval center</CardTitle>
              <CardDescription>Members and loans awaiting your decision</CardDescription>
            </div>
            {selectedUserIds.size > 0 && (
              <Button size="sm" onClick={onBulkApproveUsers} className="gap-1 bg-accent hover:bg-accent/90">
                <CheckCircle2 className="h-4 w-4" />
                Approve {selectedUserIds.size}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <div className="mb-3 flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-gold" />
              <span className="text-sm font-medium">Members</span>
              <Badge variant="secondary">{userItems.length}</Badge>
            </div>
            {userItems.length === 0 ? (
              <p className="text-sm text-muted-foreground">No pending member approvals</p>
            ) : (
              <ul className="max-h-40 space-y-2 overflow-y-auto">
                {userItems.slice(0, 8).map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center gap-3 rounded-lg border border-border/60 bg-muted/20 px-3 py-2"
                  >
                    <input
                      type="checkbox"
                      checked={selectedUserIds.has(item.id)}
                      onChange={() => onToggleUser(item.id)}
                      className="h-4 w-4 rounded border-border accent-accent"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{item.title}</p>
                      <p className="truncate text-xs text-muted-foreground">{item.subtitle}</p>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-accent" onClick={() => onApproveUser(item.id)}>
                        <CheckCircle2 className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-destructive" onClick={() => onRejectUser(item.id)}>
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <div className="mb-3 flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-accent" />
              <span className="text-sm font-medium">Loans</span>
              <Badge variant="secondary">{loanItems.length}</Badge>
            </div>
            {loanItems.length === 0 ? (
              <p className="text-sm text-muted-foreground">No pending loan applications</p>
            ) : (
              <ul className="max-h-40 space-y-2 overflow-y-auto">
                {loanItems.slice(0, 8).map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-muted/20 px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{item.title}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {item.amount?.toLocaleString()} RWF · {item.subtitle}
                      </p>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => onReviewLoan(item.id)}>
                      Review
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
