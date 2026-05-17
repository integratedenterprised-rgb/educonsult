/**
 * Global UI store — only ephemeral, client-side state belongs here.
 * Server-fetched data (nav, settings, theme) lives in React Server Components
 * and is never mirrored in Zustand.
 */
import { create } from "zustand";

interface UiState {
  mobileNavOpen: boolean;
  toggleMobileNav: () => void;
  closeMobileNav: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  mobileNavOpen: false,
  toggleMobileNav: () => set((s) => ({ mobileNavOpen: !s.mobileNavOpen })),
  closeMobileNav: () => set({ mobileNavOpen: false }),
}));
