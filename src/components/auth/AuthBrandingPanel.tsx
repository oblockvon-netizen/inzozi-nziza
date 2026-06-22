import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { PiggyBank, ShieldCheck, TrendingUp, Users } from "lucide-react";
import { fadeUp, staggerContainer } from "@/components/landing/motion";

const benefits = [
  {
    icon: PiggyBank,
    title: "Monthly community savings",
    description: "Track 105,000 RWF contributions with full transparency.",
  },
  {
    icon: TrendingUp,
    title: "Fair, tracked loans",
    description: "Apply with clear terms and admin-approved workflows.",
  },
  {
    icon: ShieldCheck,
    title: "Enterprise-grade security",
    description: "RBAC, audit logs, and secure cookie-based sessions.",
  },
  {
    icon: Users,
    title: "Admin-approved membership",
    description: "Every member is verified before accessing the platform.",
  },
];

export function AuthBrandingPanel() {
  return (
    <div className="relative flex h-full flex-col justify-between overflow-hidden border-r border-border/60 bg-gradient-to-br from-muted/60 via-background to-accent/5 p-8 lg:p-12 xl:p-16 dark:from-card dark:via-background dark:to-accent/10">
      <div className="pointer-events-none absolute inset-0 landing-grid opacity-20 dark:opacity-30" />
      <div className="pointer-events-none absolute -left-20 top-0 h-80 w-80 rounded-full bg-accent/10 blur-[100px]" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-64 w-64 rounded-full bg-gold/10 blur-[80px]" />

      <motion.div
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
        className="relative"
      >
        <motion.div variants={fadeUp}>
          <Link to="/" className="inline-flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/15 ring-1 ring-accent/30">
              <span className="text-sm font-bold text-accent">IN</span>
            </div>
            <span className="font-display text-xl font-semibold text-foreground">
              Inzozi Nziza
            </span>
          </Link>
        </motion.div>

        <motion.h1
          variants={fadeUp}
          className="mt-10 font-display text-3xl font-bold leading-tight tracking-tight text-foreground xl:text-4xl"
        >
          Community finance,
          <br />
          <span className="bg-gradient-to-r from-accent to-emerald-600 bg-clip-text text-transparent dark:to-emerald-300">
            built for trust
          </span>
        </motion.h1>

        <motion.p
          variants={fadeUp}
          className="mt-4 max-w-md text-base leading-relaxed text-muted-foreground"
        >
          Join Rwanda&apos;s community savings platform — contribute monthly,
          access loans, and grow together with complete accountability.
        </motion.p>

        <motion.ul variants={staggerContainer} className="mt-10 space-y-5">
          {benefits.map((item) => {
            const Icon = item.icon;
            return (
              <motion.li
                key={item.title}
                variants={fadeUp}
                className="flex gap-4"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/10 ring-1 ring-border/60">
                  <Icon className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="font-medium text-foreground">{item.title}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">{item.description}</p>
                </div>
              </motion.li>
            );
          })}
        </motion.ul>
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="relative mt-12 text-sm text-muted-foreground/70"
      >
        Trusted by community groups across Rwanda
      </motion.p>
    </div>
  );
}
