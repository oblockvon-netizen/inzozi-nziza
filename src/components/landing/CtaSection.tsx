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
          className="relative overflow-hidden rounded-3xl border border-accent/20 bg-gradient-to-br from-accent/10 via-card to-muted px-8 py-16 sm:px-16 sm:py-20"
        >
          <div className="pointer-events-none absolute inset-0 landing-grid opacity-30" />
          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-accent/20 blur-[80px]" />
          <div className="pointer-events-none absolute -bottom-10 -left-10 h-48 w-48 rounded-full bg-gold/15 blur-[60px]" />

          <div className="relative mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
              Ready to start saving with your community?
            </h2>
            <p className="mt-5 text-lg text-muted-foreground">
              Join Inzozi Nziza today. Sign up, get approved, and begin your
              journey toward shared financial growth.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button
                asChild
                size="lg"
                className="h-12 gap-2 bg-accent px-8 text-base text-accent-foreground shadow-xl hover:bg-accent/90"
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
                className="h-12 border-border bg-background/80 px-8 text-base hover:bg-muted"
              >
                <Link to="/auth/login">Sign in to your account</Link>
              </Button>
            </div>
            <p className="mt-8 text-sm text-muted-foreground">
              No hidden fees · Admin-approved membership · Secure by design
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
