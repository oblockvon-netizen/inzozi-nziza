import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AnimatedProgress } from "@/components/dashboard/AnimatedProgress";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { CreditCard, Plus } from "lucide-react";
import { toNumber } from "@/lib/api";
import type { Loan } from "@/types/api";

interface LoanOverviewSectionProps {
  loans: Loan[];
  onApplyLoan: () => void;
}

export function LoanOverviewSection({ loans, onApplyLoan }: LoanOverviewSectionProps) {
  const approved = loans.filter((l) => l.status.toUpperCase() === "APPROVED");
  const pending = loans.filter((l) => l.status.toUpperCase() === "PENDING");

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.4 }}
    >
      <Card className="border-border/60 shadow-sm">
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CreditCard className="h-5 w-5 text-gold" />
              Loan overview
            </CardTitle>
            <CardDescription>
              {approved.length} active · {pending.length} pending review
            </CardDescription>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={onApplyLoan}
            className="gap-1.5"
          >
            <Plus className="h-4 w-4" />
            New application
          </Button>
        </CardHeader>
        <CardContent>
          {loans.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/60 py-12 text-center">
              <CreditCard className="mb-3 h-10 w-10 text-muted-foreground/50" />
              <p className="font-medium text-muted-foreground">No loans yet</p>
              <p className="mt-1 text-sm text-muted-foreground/80">
                Apply for a community loan when you need support
              </p>
              <Button onClick={onApplyLoan} className="mt-4 gap-2 bg-accent hover:bg-accent/90">
                Apply for loan
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {loans.slice(0, 6).map((loan) => {
                const total =
                  toNumber(loan.totalWithInterest) || toNumber(loan.amount) * 1.05;
                const paid = toNumber(loan.amountPaid);
                const pct = total > 0 ? (paid / total) * 100 : 0;

                return (
                  <div
                    key={loan.id}
                    className="rounded-xl border border-border/60 bg-muted/20 p-4 transition-shadow hover:shadow-md"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate font-semibold tabular-nums">
                          {toNumber(loan.amount).toLocaleString()} RWF
                        </p>
                        <p className="mt-0.5 truncate text-sm text-muted-foreground">
                          {loan.purpose}
                        </p>
                      </div>
                      <StatusBadge status={loan.status} />
                    </div>
                    {loan.status.toUpperCase() === "APPROVED" && (
                      <div className="mt-4 space-y-2">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Repaid</span>
                          <span className="tabular-nums">
                            {paid.toLocaleString()} / {total.toLocaleString()} RWF
                          </span>
                        </div>
                        <AnimatedProgress value={pct} showLabel className="h-2" />
                      </div>
                    )}
                    <p className="mt-3 text-xs text-muted-foreground">
                      Applied {new Date(loan.appliedAt).toLocaleDateString()}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
