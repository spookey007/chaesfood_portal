"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

const STORAGE_KEY = "chaesfood_storefront_cart_v1";

export type StorefrontCartLine = {
  productSku: string;
  productName: string;
  quantity: number;
  unitPriceCents: number;
};

type Stored = { v: 1; lines: StorefrontCartLine[] };

function loadFromStorage(): StorefrontCartLine[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Stored;
    if (parsed?.v !== 1 || !Array.isArray(parsed.lines)) return [];
    return parsed.lines.filter(
      (l) =>
        l &&
        typeof l.productSku === "string" &&
        typeof l.productName === "string" &&
        typeof l.quantity === "number" &&
        typeof l.unitPriceCents === "number" &&
        l.quantity >= 1 &&
        l.quantity <= 99 &&
        l.unitPriceCents > 0 &&
        l.unitPriceCents < 100_000_000,
    );
  } catch {
    return [];
  }
}

function persist(lines: StorefrontCartLine[]) {
  try {
    if (lines.length === 0) {
      localStorage.removeItem(STORAGE_KEY);
    } else {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ v: 1, lines } satisfies Stored));
    }
  } catch {
    /* ignore quota */
  }
}

function bumpCartChanged() {
  window.dispatchEvent(new Event("chaesfood-cart-changed"));
}

type Ctx = {
  /** false only before localStorage is read on the client */
  hydrated: boolean;
  lines: StorefrontCartLine[];
  itemCount: number;
  totalCents: number;
  addLine: (productSku: string, productName: string, unitPriceCents: number, quantity?: number) => void;
  setLineQuantity: (productSku: string, quantity: number) => void;
  removeLine: (productSku: string) => void;
  replaceLines: (lines: StorefrontCartLine[]) => void;
  clear: () => void;
};

const StorefrontCartContext = createContext<Ctx | null>(null);

export function StorefrontCartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<StorefrontCartLine[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setLines(loadFromStorage());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    persist(lines);
  }, [lines, hydrated]);

  const itemCount = useMemo(() => lines.reduce((s, l) => s + l.quantity, 0), [lines]);
  const totalCents = useMemo(
    () => lines.reduce((s, l) => s + l.unitPriceCents * l.quantity, 0),
    [lines],
  );

  const addLine = useCallback((productSku: string, productName: string, unitPriceCents: number, quantity = 1) => {
    const q = Math.min(99, Math.max(1, Math.floor(quantity)));
    setLines((prev) => {
      const i = prev.findIndex((l) => l.productSku === productSku);
      if (i === -1) {
        return [...prev, { productSku, productName, quantity: q, unitPriceCents }];
      }
      const next = [...prev];
      const merged = Math.min(99, next[i].quantity + q);
      next[i] = { ...next[i], quantity: merged };
      return next;
    });
    bumpCartChanged();
  }, []);

  const setLineQuantity = useCallback((productSku: string, quantity: number) => {
    if (quantity <= 0) {
      setLines((prev) => prev.filter((l) => l.productSku !== productSku));
    } else {
      const q = Math.min(99, Math.floor(quantity));
      setLines((prev) =>
        prev.map((l) => (l.productSku === productSku ? { ...l, quantity: q } : l)),
      );
    }
    bumpCartChanged();
  }, []);

  const removeLine = useCallback((productSku: string) => {
    setLines((prev) => prev.filter((l) => l.productSku !== productSku));
    bumpCartChanged();
  }, []);

  const replaceLines = useCallback((next: StorefrontCartLine[]) => {
    setLines(next);
    bumpCartChanged();
  }, []);

  const clear = useCallback(() => {
    setLines([]);
    bumpCartChanged();
  }, []);

  const value = useMemo(
    () => ({
      hydrated,
      lines,
      itemCount,
      totalCents,
      addLine,
      setLineQuantity,
      removeLine,
      replaceLines,
      clear,
    }),
    [hydrated, lines, itemCount, totalCents, addLine, setLineQuantity, removeLine, replaceLines, clear],
  );

  return <StorefrontCartContext.Provider value={value}>{children}</StorefrontCartContext.Provider>;
}

export function useStorefrontCart() {
  const ctx = useContext(StorefrontCartContext);
  if (!ctx) {
    throw new Error("useStorefrontCart must be used within StorefrontCartProvider");
  }
  return ctx;
}
