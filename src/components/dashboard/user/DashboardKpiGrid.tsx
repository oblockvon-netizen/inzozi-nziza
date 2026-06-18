import { motion } from "framer-motion";
import {
  TrendingUp,
  Wallet,
  CreditCard,
  AlertTriangle,
} from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";

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
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        visible: { transition: { staggerChildren: 0.08 } },
      }}
      className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
    >
      <StatCard
        title="Monthly progress"
        value={`${Math.min(progressPercent, 100).toFixed(0)}%`}
        subtitle="Of 105,000 RWF target"
        icon={TrendingUp}
        index={0}
        accent="emerald"
      />
      <StatCard
        title="Total contributed"
        value={`${(totalContributed / 1000).toFixed(0)}K`}
        subtitle={`${totalContributed.toLocaleString()} RWF all time`}
        icon={Wallet}
        index={1}
        accent="navy"
      />
      <StatCard
        title="Active loans"
        value={activeLoans}
        subtitle="Approved & in repayment"
        icon={CreditCard}
        index={2}
        accent="gold"
      />
      <StatCard
        title="Outstanding fines"
        value={`${(outstandingFines / 1000).toFixed(outstandingFines >= 1000 ? 0 : 1)}K`}
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
