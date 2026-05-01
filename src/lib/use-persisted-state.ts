import { useEffect, useState } from "react";

// State that survives page reloads via localStorage.
//
// On mount: starts with `initial`, then reads the stored value (if any) and
// replaces it. This causes a one-frame flash on first paint, but avoids the
// SSR/CSR hydration mismatch you'd get from reading localStorage during
// initial render.
export function usePersistedState<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(initial);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(key);
      if (raw !== null) setValue(JSON.parse(raw) as T);
    } catch {
      // corrupt entry — ignore and keep initial
    }
    setHydrated(true);
  }, [key]);

  useEffect(() => {
    if (!hydrated) return;
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // quota exceeded or storage disabled — best-effort
    }
  }, [key, value, hydrated]);

  return [value, setValue, hydrated] as const;
}
