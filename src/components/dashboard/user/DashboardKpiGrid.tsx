import { motion } from "framer-motion";
import {
  TrendingUp,
  Wallet,
  CreditCard,
  AlertTriangle,
} from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { staggerContainer } from "@/lib/motion";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { motionVariants } from "@/lib/motion";

interface DashboardKpiGridProps {
  progressPercent: number;
  totalContributed: number;
  activeLoans: number;
  outstandingFines: number;
}

export function DashboardKpiGrid({
  progressPercent,
  totalContributed,
  activeLoans,
  outstandingFines,
}: DashboardKpiGridProps) {
  const reduced = useReducedMotion();
  const capped = Math.min(progressPercent, 100);

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={motionVariants(reduced, staggerContainer)}
      className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
    >
      <StatCard
        title="Monthly progress"
        value={`${capped.toFixed(0)}%`}
        countUp={capped}
        countUpFormatter={(n) => `${Math.round(n)}`}
        countUpSuffix="%"
        subtitle="Of 105,000 RWF target"
        icon={TrendingUp}
        index={0}
        accent="emerald"
      />
      <StatCard
        title="Total contributed"
        value={`${(totalContributed / 1000).toFixed(0)}K`}
        countUp={totalContributed / 1000}
        countUpFormatter={(n) => `${Math.round(n)}`}
        countUpSuffix="K"
        subtitle={`${totalContributed.toLocaleString()} RWF all time`}
        icon={Wallet}
        index={1}
        accent="navy"
      />
      <StatCard
        title="Active loans"
        value={activeLoans}
        countUp={activeLoans}
        subtitle="Approved & in repayment"
        icon={CreditCard}
        index={2}
        accent="gold"
      />
      <StatCard
        title="Outstanding fines"
        value={`${(outstandingFines / 1000).toFixed(outstandingFines >= 1000 ? 0 : 1)}K`}
        countUp={outstandingFines / 1000}
        countUpFormatter={(n) =>
          outstandingFines >= 1000 ? `${Math.round(n)}` : n.toFixed(1)
        }
        countUpSuffix="K"
        subtitle={
          outstandingFines > 0
            ? `${outstandingFines.toLocaleString()} RWF pending`
            : "No pending fines"
        }
        icon={AlertTriangle}
        index={3}
        accent={outstandingFines > 0 ? "gold" : "default"}
      />
    </motion.div>
  );
}
