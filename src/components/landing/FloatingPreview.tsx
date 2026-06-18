import { motion } from "framer-motion";
import { TrendingUp, Users, Wallet, Shield } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const floatTransition = {
  duration: 4,
  repeat: Infinity,
  ease: "easeInOut" as const,
};

export function FloatingPreview() {
  return (
    <div className="relative mx-auto h-[420px] w-full max-w-md lg:mx-0 lg:max-w-none">
      {/* Glow */}
      <div className="absolute inset-0 rounded-3xl bg-accent/10 blur-3xl" />
      <div className="absolute -right-8 top-12 h-32 w-32 rounded-full bg-gold/10 blur-2xl" />

      {/* Main dashboard card */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.2 }}
        className="absolute left-0 right-0 top-8 z-10 rounded-2xl border border-white/10 bg-[#111827]/90 p-6 shadow-2xl shadow-black/40 backdrop-blur-xl"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-white/40">
              Monthly contribution
            </p>
            <p className="mt-1 font-display text-2xl font-bold text-white">
              105,000 <span className="text-sm font-medium text-white/50">RWF</span>
            </p>
          </div>
          <div className="rounded-xl bg-accent/15 p-2.5">
            <Wallet className="h-5 w-5 text-accent" />
          </div>
        </div>
        <div className="mt-5">
          <div className="mb-2 flex justify-between text-xs">
            <span className="text-white/50">Progress this month</span>
            <span className="font-medium text-accent">87%</span>
          </div>
          <Progress value={87} className="h-2 bg-white/10 [&>div]:bg-accent" />
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-white/[0.04] p-3 ring-1 ring-white/[0.06]">
            <p className="text-[10px] uppercase tracking-wider text-white/40">Balance</p>
            <p className="mt-0.5 text-sm font-semibold text-white">2.1M RWF</p>
          </div>
          <div className="rounded-xl bg-white/[0.04] p-3 ring-1 ring-white/[0.06]">
            <p className="text-[10px] uppercase tracking-wider text-white/40">Active loan</p>
            <p className="mt-0.5 text-sm font-semibold text-gold">450K RWF</p>
          </div>
        </div>
      </motion.div>

      {/* Floating card — members */}
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ ...floatTransition, delay: 0 }}
        className="absolute -left-4 top-0 z-20 rounded-xl border border-white/10 bg-[#1a2332]/95 px-4 py-3 shadow-xl backdrop-blur-xl"
      >
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-accent/15 p-2">
            <Users className="h-4 w-4 text-accent" />
          </div>
          <div>
            <p className="text-xs text-white/50">Members</p>
            <p className="text-sm font-semibold text-white">524 active</p>
          </div>
        </div>
      </motion.div>

      {/* Floating card — growth */}
      <motion.div
        animate={{ y: [0, -12, 0] }}
        transition={{ ...floatTransition, delay: 1.2 }}
        className="absolute -right-2 bottom-16 z-20 rounded-xl border border-white/10 bg-[#1a2332]/95 px-4 py-3 shadow-xl backdrop-blur-xl"
      >
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-gold/15 p-2">
            <TrendingUp className="h-4 w-4 text-gold" />
          </div>
          <div>
            <p className="text-xs text-white/50">Repayment rate</p>
            <p className="text-sm font-semibold text-gold">98.2%</p>
          </div>
        </div>
      </motion.div>

      {/* Floating card — security */}
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ ...floatTransition, delay: 2 }}
        className="absolute bottom-0 left-8 z-20 rounded-xl border border-accent/20 bg-accent/10 px-4 py-3 shadow-xl backdrop-blur-xl"
      >
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-accent" />
          <p className="text-xs font-medium text-accent">RBAC & audit logs enabled</p>
        </div>
      </motion.div>
    </div>
  );
}
