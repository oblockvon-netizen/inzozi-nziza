import { motion } from "framer-motion";
import { fadeUp, staggerContainer, viewportOnce } from "./motion";

const metrics = [
  { value: "105K", suffix: " RWF", label: "Monthly contribution", accent: "text-accent" },
  { value: "500+", suffix: "", label: "Active members", accent: "text-foreground" },
  { value: "98%", suffix: "", label: "On-time repayments", accent: "text-gold" },
  { value: "24/7", suffix: "", label: "Platform availability", accent: "text-foreground" },
];

export function TrustMetricsSection() {
  return (
    <section className="px-4 py-16 sm:py-20">
      <div className="container">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={staggerContainer}
          className="rounded-2xl border border-border/60 bg-card/80 p-8 shadow-sm backdrop-blur-xl sm:p-10"
        >
          <div className="grid grid-cols-2 gap-8 lg:grid-cols-4 lg:gap-6">
            {metrics.map((metric) => (
              <motion.div
                key={metric.label}
                variants={fadeUp}
                className="text-center lg:text-left"
              >
                <p className={`font-display text-3xl font-bold sm:text-4xl ${metric.accent}`}>
                  {metric.value}
                  {metric.suffix && (
                    <span className="text-lg font-semibold text-muted-foreground">{metric.suffix}</span>
                  )}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">{metric.label}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
