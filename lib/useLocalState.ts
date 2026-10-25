"use client";

import { useCallback, useEffect, useState } from "react";

/** localStorage-backed state that tolerates blocked/empty storage. */
export function useLocalState<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(initial);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) setValue(JSON.parse(raw) as T);
    } catch {}
    setReady(true);
  }, [key]);

  const update = useCallback(
    (next: T) => {
      setValue(next);
      try {
        localStorage.setItem(key, JSON.stringify(next));
      } catch {}
    },
    [key],
  );

  return [value, update, ready] as const;
}
