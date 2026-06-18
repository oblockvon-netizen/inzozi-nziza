import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { motionTransition } from "@/lib/motion";
import { cn } from "@/lib/utils";

interface AnimatedCardProps {
  children: ReactNode;
  index?: number;
  className?: string;
  hover?: boolean;
}

export function AnimatedCard({
  children,
  index = 0,
  className,
  hover = true,
}: AnimatedCardProps) {
  const reduced = useReducedMotion();

  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={motionTransition(reduced, {
        delay: index * 0.07,
        duration: 0.4,
        ease: [0.25, 0.1, 0.25, 1],
      })}
      whileHover={
        reduced || !hover
          ? undefined
          : { y: -2, transition: { duration: 0.2 } }
      }
      className={cn(className)}
    >
      {children}
    </motion.div>
  );
}
