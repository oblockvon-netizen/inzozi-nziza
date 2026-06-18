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

interface AdminKpiGridProps {
  kpis: AdminKpis;
}

export function AdminKpiGrid({ kpis }: AdminKpiGridProps) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{ visible: { transition: { staggerChildren: 0.07 } } }}
      className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5"
    >
      <StatCard
        title="Total members"
        value={kpis.totalMembers}
        icon={Users}
        index={0}
        accent="navy"
      />
      <StatCard
        title="Pending approvals"
        value={kpis.pendingApprovals}
        subtitle="Awaiting activation"
        icon={UserCheck}
        index={1}
        accent="gold"
      />
      <StatCard
        title="Active loans"
        value={kpis.activeLoans}
        subtitle="Approved & repaying"
        icon={CreditCard}
        index={2}
        accent="emerald"
      />
      <StatCard
        title="Total contributions"
        value={`${(kpis.totalContributions / 1000000).toFixed(1)}M`}
        subtitle={`${kpis.totalContributions.toLocaleString()} RWF`}
        icon={DollarSign}
        index={3}
        accent="emerald"
      />
      <StatCard
        title="Outstanding debt"
        value={`${(kpis.outstandingDebt / 1000).toFixed(0)}K`}
        subtitle={`${kpis.outstandingDebt.toLocaleString()} RWF`}
        icon={AlertTriangle}
        index={4}
        accent="gold"
      />
    </motion.div>
  );
}
