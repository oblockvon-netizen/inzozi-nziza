import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FloatingPreview } from "./FloatingPreview";
import { fadeUp } from "./motion";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden px-4 pb-20 pt-16 sm:pb-28 sm:pt-20">
      <div className="pointer-events-none absolute inset-0 landing-grid opacity-40" />
      <div className="pointer-events-none absolute left-1/2 top-0 h-[600px] w-[800px] -translate-x-1/2 rounded-full bg-accent/8 blur-[120px]" />
      <div className="pointer-events-none absolute right-0 top-1/3 h-[300px] w-[300px] rounded-full bg-gold/8 blur-[100px]" />

      <div className="container relative">
        <div className="grid items-center gap-16 lg:grid-cols-2 lg:gap-12">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{
              visible: { transition: { staggerChildren: 0.12 } },
            }}
          >
            <motion.div variants={fadeUp}>
              <Badge className="mb-6 border-gold/30 bg-gold/10 px-3 py-1 text-gold hover:bg-gold/10">
                <Sparkles className="mr-1.5 h-3 w-3" />
                Rwanda community finance
              </Badge>
            </motion.div>

            <motion.h1
              variants={fadeUp}
              className="font-display text-balance text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl"
            >
              Build wealth{" "}
              <span className="bg-gradient-to-r from-accent to-emerald-300 bg-clip-text text-transparent">
                together
              </span>
              , transparently
            </motion.h1>

            <motion.p
              variants={fadeUp}
              className="mt-6 max-w-xl text-lg leading-relaxed text-white/60 sm:text-xl"
            >
              Inzozi Nziza helps communities save 105,000 RWF monthly, access
              fair loans, and stay accountable — with full admin oversight and
              real-time dashboards.
            </motion.p>

            <motion.div
              variants={fadeUp}
              className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center"
            >
              <Button
                asChild
                size="lg"
                className="h-12 gap-2 bg-accent px-8 text-base shadow-lg shadow-accent/25 hover:bg-accent/90"
              >
                <Link to="/auth/signup">
                  Get started free
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="h-12 border-white/15 bg-white/5 px-8 text-base text-white hover:bg-white/10 hover:text-white"
              >
                <a href="#how-it-works">See how it works</a>
              </Button>
            </motion.div>

            <motion.p variants={fadeUp} className="mt-6 text-sm text-white/40">
              No hidden fees · Admin-approved membership · Bank-grade security
            </motion.p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="relative"
          >
            <FloatingPreview />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
