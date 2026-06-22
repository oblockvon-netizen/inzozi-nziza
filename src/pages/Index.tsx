import { LandingNav } from "@/components/landing/LandingNav";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { HeroSection } from "@/components/landing/HeroSection";
import { TrustMetricsSection } from "@/components/landing/TrustMetricsSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { TestimonialsSection } from "@/components/landing/TestimonialsSection";
import { CtaSection } from "@/components/landing/CtaSection";

const Index = () => {
  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <div className="pointer-events-none fixed inset-0 mesh-gradient opacity-70" />
      <div className="relative">
        <LandingNav />
        <main>
          <HeroSection />
          <TrustMetricsSection />
          <FeaturesSection />
          <HowItWorksSection />
          <TestimonialsSection />
          <CtaSection />
        </main>
        <LandingFooter />
      </div>
    </div>
  );
};

export default Index;
