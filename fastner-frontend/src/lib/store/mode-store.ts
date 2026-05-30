/** The buyer's pricing mode — B2C (retail) or B2B (bulk). Persisted to
 *  localStorage so the choice sticks across the storefront and is the value
 *  sent when adding to cart. The server cart carries its own mode (one per
 *  cart); the cart page keeps the two in sync. */
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Mode = "b2c" | "b2b";

type ModeState = {
  mode: Mode;
  setMode: (mode: Mode) => void;
};

export const useModeStore = create<ModeState>()(
  persist(
    (set) => ({
      mode: "b2c",
      setMode: (mode) => set({ mode }),
    }),
    { name: "ibc-mode" },
  ),
);
