"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

const STORAGE_KEY = "corner_store_compare_ids";

type CompareContextValue = {
  compareIds: number[];
  toggleCompare: (id: number) => void;
  clearCompare: () => void;
  has: (id: number) => boolean;
};

const CompareContext = createContext<CompareContextValue | null>(null);

export function CompareProvider({ children }: { children: ReactNode }) {
  const [compareIds, setCompareIds] = useState<number[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        setCompareIds(JSON.parse(raw) as number[]);
      }
    } catch {
      setCompareIds([]);
    }
    setHydrated(true);
  }, []);

  const persist = useCallback((next: number[]) => {
    setCompareIds(next);
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
  }, [hydrated]);

  const toggleCompare = useCallback((id: number) => {
    setCompareIds((current) => {
      const next = current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id].slice(-4);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  const clearCompare = useCallback(() => {
    persist([]);
  }, [persist]);

  const has = useCallback((id: number) => compareIds.includes(id), [compareIds]);

  const value: CompareContextValue = {
    compareIds,
    toggleCompare,
    clearCompare,
    has,
  };

  return <CompareContext.Provider value={value}>{children}</CompareContext.Provider>;
}

export function useCompare() {
  const ctx = useContext(CompareContext);
  if (!ctx) throw new Error("useCompare must be used within CompareProvider");
  return ctx;
}
