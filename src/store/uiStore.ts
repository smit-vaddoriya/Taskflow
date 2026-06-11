import { create } from 'zustand'

interface UIState {
  sidebarCollapsed: boolean
  activeModal: string | null
  selectedTaskId: string | null
  toggleSidebar: () => void
  setSidebarCollapsed: (v: boolean) => void
  openModal: (name: string) => void
  closeModal: () => void
  setSelectedTask: (id: string | null) => void
}

export const useUIStore = create<UIState>((set) => ({
  sidebarCollapsed: false,
  activeModal: null,
  selectedTaskId: null,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),
  openModal: (name) => set({ activeModal: name }),
  closeModal: () => set({ activeModal: null }),
  setSelectedTask: (id) => set({ selectedTaskId: id }),
}))