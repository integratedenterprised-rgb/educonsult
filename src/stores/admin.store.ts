/**
 * Admin-panel client state. Mostly form drafts and UI toggles; persistent data
 * always round-trips through the API.
 */
import { create } from "zustand";

interface AdminState {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
}

export const useAdminStore = create<AdminState>((set) => ({
  sidebarCollapsed: false,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
}));
