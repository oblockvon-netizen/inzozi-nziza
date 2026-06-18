import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { fadeUp, staggerContainer, viewportOnce } from "./motion";

const testimonials = [
  {
    quote:
      "Inzozi Nziza transformed how our group saves. Every contribution is visible, and loan approvals happen in days — not weeks.",
    name: "Marie Uwimana",
    role: "Group treasurer, Kigali",
    initials: "MU",
    accent: "from-accent/30 to-accent/10",
  },
  {
    quote:
      "I used my first community loan to expand my shop. Clear installments and no surprises — exactly what small businesses need.",
    name: "Jean-Paul Mugisha",
    role: "Small business owner",
    initials: "JM",
    accent: "from-gold/30 to-gold/10",
  },
  {
    quote:
      "As an admin, the dashboard gives me full control — approve members, track fines, and audit every action. It's built for accountability.",
    name: "Grace Kabano",
    role: "Community coordinator",
    initials: "GK",
    accent: "from-accent/30 to-gold/10",
  },
];

export function TestimonialsSection() {
  return (
    <section id="testimonials" className="px-4 py-24 sm:py-32">
      <div className="container">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={fadeUp}
          className="mx-auto max-w-2xl text-center"
        >
          <p className="text-sm font-semibold uppercase tracking-wider text-accent">
            Testimonials
          </p>
          <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Trusted by community leaders
          </h2>
          <p className="mt-4 text-lg text-white/50">
            Real stories from members building financial security together.
          </p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={staggerContainer}
          className="mt-16 grid gap-6 md:grid-cols-3"
        >
          {testimonials.map((item) => (
            <motion.div
              key={item.name}
              variants={fadeUp}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="flex flex-col rounded-2xl border border-white/[0.08] bg-[#111827]/50 p-8 transition-colors hover:border-white/15"
            >
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className="h-4 w-4 fill-gold text-gold"
                  />
                ))}
              </div>
              <blockquote className="mt-5 flex-1 text-base leading-relaxed text-white/70">
                &ldquo;{item.quote}&rdquo;
              </blockquote>
              <div className="mt-6 flex items-center gap-3 border-t border-white/[0.06] pt-6">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br ${item.accent} text-sm font-semibold text-white`}
                >
                  {item.initials}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{item.name}</p>
                  <p className="text-xs text-white/50">{item.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
