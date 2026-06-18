import { motion } from "framer-motion";
import {
  Bar,
  BarChart,
  Area,
  AreaChart,
  Pie,
  PieChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BarChart3, LineChartIcon, PieChartIcon } from "lucide-react";
import type { GrowthAreaPoint, MonthlyBarPoint, PieSlice } from "@/lib/admin-analytics";

interface AdminAnalyticsProps {
  contributionBars: MonthlyBarPoint[];
  growthArea: GrowthAreaPoint[];
  loanPie: PieSlice[];
}

const gridStroke = "hsl(var(--border))";
const tickStyle = { fill: "hsl(var(--muted-foreground))", fontSize: 11 };

function ChartTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: { value: number; name: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border/60 bg-card px-3 py-2 text-sm shadow-lg">
      <p className="mb-1 font-medium">{label}</p>
      {payload.map((e) => (
        <p key={e.name} className="text-muted-foreground">
          {e.name}: {e.value.toLocaleString()}
          {e.name !== "Loans" ? " RWF" : ""}
        </p>
      ))}
    </div>
  );
}

export function AdminAnalytics({
  contributionBars,
  growthArea,
  loanPie,
}: AdminAnalyticsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="grid gap-4 lg:grid-cols-3"
    >
      <Card className="border-border/60 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart3 className="h-4 w-4 text-accent" />
            Contributions by month
          </CardTitle>
          <CardDescription>Completed payments — last 6 months</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={contributionBars} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                <XAxis dataKey="label" tick={tickStyle} axisLine={false} tickLine={false} />
                <YAxis tick={tickStyle} axisLine={false} tickLine={false} width={36}
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="amount" name="Contributions" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/60 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <LineChartIcon className="h-4 w-4 text-gold" />
            Platform growth
          </CardTitle>
          <CardDescription>Cumulative contribution volume</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[220px]">
            {growthArea.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                No data yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={growthArea} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="adminGrowth" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--gold))" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="hsl(var(--gold))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                  <XAxis dataKey="label" tick={tickStyle} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                  <YAxis tick={tickStyle} axisLine={false} tickLine={false} width={36}
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip content={<ChartTooltip />} />
                  <Area type="monotone" dataKey="cumulative" name="Total" stroke="hsl(var(--gold))" fill="url(#adminGrowth)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/60 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <PieChartIcon className="h-4 w-4 text-accent" />
            Loan portfolio
          </CardTitle>
          <CardDescription>Applications by status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[220px]">
            {loanPie.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                No loans yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={loanPie} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={2}>
                    {loanPie.map((entry) => (
                      <Cell key={entry.name} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
