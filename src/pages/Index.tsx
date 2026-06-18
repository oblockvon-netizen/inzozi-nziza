import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { MarketingLayout } from "@/components/layout/MarketingLayout";
import { Link } from "react-router-dom";
import { ArrowRight, Shield, TrendingUp, Users } from "lucide-react";

const features = [
  {
    icon: Users,
    title: "Community savings",
    description: "Members contribute 105,000 RWF monthly toward shared financial goals.",
  },
  {
    icon: TrendingUp,
    title: "Transparent loans",
    description: "Apply for loans with clear terms, installment schedules, and admin oversight.",
  },
  {
    icon: Shield,
    title: "Accountability",
    description: "Role-based access, audit trails, and admin approval for every member.",
  },
];

const Index = () => {
  return (
    <MarketingLayout>
      <div className="flex min-h-screen flex-col">
        <section className="flex flex-1 flex-col items-center justify-center px-4 py-20 sm:py-28">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mx-auto max-w-3xl text-center"
          >
            <p className="mb-4 text-sm font-medium uppercase tracking-wider text-accent">
              Rwanda community finance
            </p>
            <h1 className="text-balance text-4xl font-semibold tracking-tight text-foreground sm:text-6xl">
              Inzozi Nziza
            </h1>
            <p className="mt-4 text-xl text-muted-foreground sm:text-2xl">
              Community savings & loans platform
            </p>
            <p className="mx-auto mt-6 max-w-2xl text-balance text-base leading-relaxed text-muted-foreground sm:text-lg">
              Build dreams together. Contribute, save, and access loans with full
              transparency and admin-managed approvals.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button asChild size="lg" className="h-12 gap-2 px-8 bg-accent hover:bg-accent/90">
                <Link to="/auth">
                  Get started
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="h-12 px-8">
                <Link to="/auth">Sign in</Link>
              </Button>
            </div>
          </motion.div>
        </section>

        <section className="border-t border-border/60 bg-card/30 px-4 py-16 backdrop-blur-sm">
          <div className="container mx-auto grid max-w-5xl gap-6 sm:grid-cols-3">
            {features.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + i * 0.1, duration: 0.4 }}
                  className="rounded-xl border border-border/60 bg-card p-6"
                >
                  <div className="mb-4 inline-flex rounded-lg bg-accent/10 p-2.5 text-accent">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-semibold text-foreground">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {feature.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </section>
      </div>
    </MarketingLayout>
  );
};

export default Index;
