import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fadeUp, viewportOnce } from "./motion";

export function CtaSection() {
  return (
    <section className="px-4 py-24 sm:py-32">
      <div className="container">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={fadeUp}
          className="relative overflow-hidden rounded-3xl border border-accent/20 bg-gradient-to-br from-accent/20 via-[#111827] to-[#0a0f1a] px-8 py-16 sm:px-16 sm:py-20"
        >
          <div className="pointer-events-none absolute inset-0 landing-grid opacity-30" />
          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-accent/20 blur-[80px]" />
          <div className="pointer-events-none absolute -bottom-10 -left-10 h-48 w-48 rounded-full bg-gold/15 blur-[60px]" />

          <div className="relative mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
              Ready to start saving with your community?
            </h2>
            <p className="mt-5 text-lg text-white/60">
              Join Inzozi Nziza today. Sign up, get approved, and begin your
              journey toward shared financial growth.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button
                asChild
                size="lg"
                className="h-12 gap-2 bg-white px-8 text-base text-[#0a0f1a] shadow-xl hover:bg-white/90"
              >
                <Link to="/auth">
                  Get started free
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="h-12 border-white/20 bg-white/5 px-8 text-base text-white hover:bg-white/10"
              >
                <Link to="/auth">Sign in to your account</Link>
              </Button>
            </div>
            <p className="mt-8 text-sm text-white/40">
              No hidden fees · Admin-approved membership · Secure by design
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
