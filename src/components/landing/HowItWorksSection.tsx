import { motion } from "framer-motion";
import { fadeUp, staggerContainer, viewportOnce } from "./motion";

const steps = [
  {
    step: "01",
    title: "Join & verify",
    description:
      "Create your account, verify your email, and wait for admin approval to activate membership.",
  },
  {
    step: "02",
    title: "Contribute monthly",
    description:
      "Save 105,000 RWF each month. Track your progress and community totals on your dashboard.",
  },
  {
    step: "03",
    title: "Apply for loans",
    description:
      "Submit a loan request with your terms. Admins review and approve with full audit trails.",
  },
  {
    step: "04",
    title: "Grow together",
    description:
      "Repay on schedule, manage fines, and build collective creditworthiness as a community.",
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="px-4 py-24 sm:py-32">
      <div className="container">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={fadeUp}
          className="mx-auto max-w-2xl text-center"
        >
          <p className="text-sm font-semibold uppercase tracking-wider text-gold">
            How it works
          </p>
          <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            From signup to savings in four steps
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            A simple, transparent flow designed for community groups in Rwanda.
          </p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={staggerContainer}
          className="relative mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
        >
          {/* Connecting line — desktop only */}
          <div className="pointer-events-none absolute left-0 right-0 top-12 hidden h-px bg-gradient-to-r from-transparent via-border to-transparent lg:block" />

          {steps.map((item, index) => (
            <motion.div
              key={item.step}
              variants={fadeUp}
              custom={index}
              className="relative rounded-2xl border border-border/60 bg-card p-6 shadow-sm"
            >
              <div className="mb-5 inline-flex h-10 w-10 items-center justify-center rounded-full bg-gold/15 ring-2 ring-gold/30">
                <span className="text-xs font-bold text-gold">{item.step}</span>
              </div>
              <h3 className="text-lg font-semibold text-foreground">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {item.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
