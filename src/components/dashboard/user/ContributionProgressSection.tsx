import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ContributionProgress } from "@/components/dashboard/ContributionProgress";
import { DollarSign } from "lucide-react";

interface ContributionProgressSectionProps {
  current: number;
  required: number;
  progressPercent: number;
  monthLabel: string;
}

export function ContributionProgressSection({
  current,
  required,
  progressPercent,
  monthLabel,
}: ContributionProgressSectionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15, duration: 0.4 }}
    >
      <Card className="h-full border-border/60 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <DollarSign className="h-5 w-5 text-accent" />
            Contribution progress
          </CardTitle>
          <CardDescription>
            {monthLabel} · Required {required.toLocaleString()} RWF / month
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ContributionProgress
            current={current}
            required={required}
            progressPercent={progressPercent}
            monthLabel={monthLabel}
          />
        </CardContent>
      </Card>
    </motion.div>
  );
}
