"use client";

import { LazyMotion, domAnimation, m, type HTMLMotionProps } from "framer-motion";

/**
 * Lightweight viewport-triggered fade-in wrapper used by section blocks so
 * each section gracefully enters as the user scrolls. Respects
 * `prefers-reduced-motion` because Framer Motion does so internally.
 *
 * Uses Framer's `LazyMotion` + `m` primitive: the full animation bundle
 * (~25kb) is only loaded once per page-tree the first time a motion node
 * mounts. The static `m` component pays no upfront bundle cost.
 */
type MotionFadeProps = HTMLMotionProps<"div"> & {
  delay?: number;
  y?: number;
};

export function MotionFade({ children, delay = 0, y = 16, ...rest }: MotionFadeProps) {
  return (
    <LazyMotion features={domAnimation} strict>
      <m.div
        initial={{ opacity: 0, y }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "0px 0px -10% 0px" }}
        transition={{ duration: 0.45, delay, ease: [0.16, 1, 0.3, 1] }}
        {...rest}
      >
        {children}
      </m.div>
    </LazyMotion>
  );
}
