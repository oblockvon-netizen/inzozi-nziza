import { motion } from "framer-motion";
import {
  Users,
  UserCheck,
  CreditCard,
  DollarSign,
  AlertTriangle,
} from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import type { AdminKpis } from "@/lib/admin-analytics";
import { staggerContainer, motionVariants } from "@/lib/motion";
import { useReducedMotion } from "@/hooks/useReducedMotion";

interface AdminKpiGridProps {
  kpis: AdminKpis;
}

export function AdminKpiGrid({ kpis }: AdminKpiGridProps) {
  const reduced = useReducedMotion();

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={motionVariants(reduced, staggerContainer)}
      className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5"
    >
      <StatCard
        title="Total members"
        value={kpis.totalMembers}
        countUp={kpis.totalMembers}
        icon={Users}
        index={0}
        accent="navy"
      />
      <StatCard
        title="Pending approvals"
        value={kpis.pendingApprovals}
        countUp={kpis.pendingApprovals}
        subtitle="Awaiting activation"
        icon={UserCheck}
        index={1}
        accent="gold"
      />
      <StatCard
        title="Active loans"
        value={kpis.activeLoans}
        countUp={kpis.activeLoans}
        subtitle="Approved & repaying"
        icon={CreditCard}
        index={2}
        accent="emerald"
      />
      <StatCard
        title="Total contributions"
        value={`${(kpis.totalContributions / 1000000).toFixed(1)}M`}
        countUp={kpis.totalContributions / 1000000}
        countUpFormatter={(n) => n.toFixed(1)}
        countUpSuffix="M"
        subtitle={`${kpis.totalContributions.toLocaleString()} RWF`}
        icon={DollarSign}
        index={3}
        accent="emerald"
      />
      <StatCard
        title="Outstanding debt"
        value={`${(kpis.outstandingDebt / 1000).toFixed(0)}K`}
        countUp={kpis.outstandingDebt / 1000}
        countUpFormatter={(n) => `${Math.round(n)}`}
        countUpSuffix="K"
        subtitle={`${kpis.outstandingDebt.toLocaleString()} RWF`}
        icon={AlertTriangle}
        index={4}
        accent="gold"
      />
    </motion.div>
  );
}
