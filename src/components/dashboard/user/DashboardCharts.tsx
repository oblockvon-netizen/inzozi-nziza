import { motion } from "framer-motion";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BarChart3, LineChartIcon, TrendingUp } from "lucide-react";
import type {
  GrowthPoint,
  MonthlyTrendPoint,
  RepaymentChartPoint,
} from "@/lib/dashboard-analytics";

interface DashboardChartsProps {
  trends: MonthlyTrendPoint[];
  repayment: RepaymentChartPoint[];
  growth: GrowthPoint[];
}

function ChartTooltip({
  active,
  payload,
  label,
  formatter,
}: {
  active?: boolean;
  payload?: { value: number; name: string; color: string }[];
  label?: string;
  formatter?: (v: number) => string;
}) {
  if (!active || !payload?.length) return null;
  const fmt = formatter ?? ((v: number) => v.toLocaleString());

  return (
    <div className="rounded-lg border border-border/60 bg-card px-3 py-2 text-sm shadow-lg">
      <p className="mb-1 font-medium text-foreground">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} className="text-muted-foreground" style={{ color: entry.color }}>
          {entry.name}: {fmt(entry.value)} RWF
        </p>
      ))}
    </div>
  );
}

const gridStroke = "hsl(var(--border))";
const tickStyle = { fill: "hsl(var(--muted-foreground))", fontSize: 11 };

export function DashboardCharts({
  trends,
  repayment,
  growth,
}: DashboardChartsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25, duration: 0.4 }}
      className="grid gap-4 lg:grid-cols-3"
    >
      <Card className="border-border/60 shadow-sm lg:col-span-1">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="h-4 w-4 text-accent" />
            Contribution trends
          </CardTitle>
          <CardDescription>Monthly totals (last 6 months)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trends} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                <XAxis dataKey="label" tick={tickStyle} axisLine={false} tickLine={false} />
                <YAxis
                  tick={tickStyle}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                  width={36}
                />
                <Tooltip content={<ChartTooltip />} />
                <Area
                  type="monotone"
                  dataKey="amount"
                  name="Contributions"
                  stroke="hsl(var(--accent))"
                  fill="url(#trendFill)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/60 shadow-sm lg:col-span-1">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart3 className="h-4 w-4 text-gold" />
            Loan repayment
          </CardTitle>
          <CardDescription>Paid vs remaining balance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[220px] w-full">
            {repayment.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                No active loans to chart
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={repayment} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                  <XAxis dataKey="name" tick={tickStyle} axisLine={false} tickLine={false} />
                  <YAxis
                    tick={tickStyle}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                    width={36}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar
                    dataKey="paid"
                    name="Paid"
                    stackId="a"
                    fill="hsl(var(--accent))"
                    radius={[0, 0, 0, 0]}
                  />
                  <Bar
                    dataKey="remaining"
                    name="Remaining"
                    stackId="a"
                    fill="hsl(var(--gold))"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/60 shadow-sm lg:col-span-1">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <LineChartIcon className="h-4 w-4 text-accent" />
            Growth history
          </CardTitle>
          <CardDescription>Cumulative contributions over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[220px] w-full">
            {growth.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                No contribution history yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={growth} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={tickStyle}
                    axisLine={false}
                    tickLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    tick={tickStyle}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                    width={36}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="cumulative"
                    name="Total saved"
                    stroke="hsl(var(--accent))"
                    strokeWidth={2}
                    dot={{ fill: "hsl(var(--accent))", r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
