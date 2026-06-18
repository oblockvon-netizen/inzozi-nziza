import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { cn } from "@/lib/utils";

interface CountUpProps {
  value: number;
  duration?: number;
  formatter?: (value: number) => string;
  className?: string;
  suffix?: string;
  prefix?: string;
}

export function CountUp({
  value,
  duration = 900,
  formatter = (n) => n.toLocaleString(),
  className,
  suffix = "",
  prefix = "",
}: CountUpProps) {
  const reduced = useReducedMotion();
  const [display, setDisplay] = useState(reduced ? value : 0);
  const previous = useRef(value);

  useEffect(() => {
    if (reduced) {
      setDisplay(value);
      previous.current = value;
      return;
    }

    const from = previous.current;
    const start = performance.now();
    let frame = 0;

    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(from + (value - from) * eased);
      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      } else {
        previous.current = value;
      }
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, duration, reduced]);

  const rounded = Math.round(display);
  return (
    <span className={cn("tabular-nums", className)} aria-live="off">
      {prefix}
      {formatter(rounded)}
      {suffix}
    </span>
  );
}
