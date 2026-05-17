"use client";

import { useEffect, useState } from "react";

/**
 * Debounce a rapidly-changing value (e.g. a search input). The returned value
 * lags behind the input by `delay` milliseconds and updates only after the
 * input has settled.
 */
export function useDebouncedValue<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}
