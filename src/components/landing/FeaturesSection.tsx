import { motion } from "framer-motion";
import {
  PiggyBank,
  Landmark,
  Scale,
  ShieldCheck,
  ArrowUpRight,
} from "lucide-react";
import { fadeUp, staggerContainer, viewportOnce } from "./motion";

const features = [
  {
    icon: PiggyBank,
    title: "Community savings",
    description:
      "Track 105,000 RWF monthly contributions with progress bars, history, and shared goals.",
    className: "lg:col-span-1",
    iconClass: "bg-accent/15 text-accent",
  },
  {
    icon: Landmark,
    title: "Smart loans",
    description:
      "Apply for loans with clear installment schedules, interest rates, and admin approval workflows.",
    className: "lg:col-span-1",
    iconClass: "bg-gold/15 text-gold",
  },
  {
    icon: Scale,
    title: "Fine management",
    description:
      "Keep members accountable with issued fines, payment tracking, and transparent records.",
    className: "lg:col-span-1",
    iconClass: "bg-accent/15 text-accent",
  },
  {
    icon: ShieldCheck,
    title: "Enterprise-grade security",
    description:
      "Role-based access control, CSRF protection, audit logs, rate limiting, and HttpOnly cookie auth — built for trust at scale.",
    className: "lg:col-span-3",
    iconClass: "bg-gold/15 text-gold",
    wide: true,
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="px-4 py-24 sm:py-32">
      <div className="container">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={fadeUp}
          className="mx-auto max-w-2xl text-center"
        >
          <p className="text-sm font-semibold uppercase tracking-wider text-accent">
            Features
          </p>
          <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Everything your community needs to save and lend
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            From contributions to loan approvals — one platform, full transparency.
          </p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={staggerContainer}
          className="mt-16 grid gap-5 lg:grid-cols-3"
        >
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                variants={fadeUp}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className={`group rounded-2xl border border-border/60 bg-card p-8 shadow-sm transition-colors hover:border-accent/30 hover:shadow-md ${feature.className}`}
              >
                <div className="flex items-start justify-between">
                  <div
                    className={`inline-flex rounded-xl p-3 ${feature.iconClass}`}
                  >
                    <Icon className="h-6 w-6" />
                  </div>
                  {feature.wide && (
                    <ArrowUpRight className="h-5 w-5 text-muted-foreground/50 transition-colors group-hover:text-accent" />
                  )}
                </div>
                <h3 className="mt-6 text-xl font-semibold text-foreground">
                  {feature.title}
                </h3>
                <p className="mt-3 leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
