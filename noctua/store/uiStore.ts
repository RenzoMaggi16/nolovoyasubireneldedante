import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { PlatformId } from '../types/orders';

export type ViewMode = 'kanban' | 'list';
export type PlatformStatus = 'connected' | 'disconnected' | 'error';

interface UIState {
  viewModes: Record<PlatformId, ViewMode>;
  platformStatus: Record<PlatformId, PlatformStatus>;
  selectedPlatform: PlatformId | null;
  isFiltersOpen: boolean;
  activeFilters: {
    status: string[];
    search: string;
  };
  setViewMode: (platform: PlatformId, mode: ViewMode) => void;
  setPlatformStatus: (platform: PlatformId, status: PlatformStatus) => void;
  setSelectedPlatform: (platform: PlatformId | null) => void;
  toggleFilters: () => void;
  setSearchFilter: (search: string) => void;
  setStatusFilter: (status: string[]) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      viewModes: {
        pedidosya: 'kanban',
        rappi: 'kanban',
        glovo: 'kanban',
        ubereats: 'kanban',
      },
      platformStatus: {
        pedidosya: 'disconnected',
        rappi: 'disconnected',
        glovo: 'disconnected',
        ubereats: 'disconnected',
      },
      selectedPlatform: null,
      isFiltersOpen: false,
      activeFilters: {
        status: [],
        search: '',
      },
      setViewMode: (platform: PlatformId, mode: ViewMode) =>
        set((state: UIState) => ({
          viewModes: { ...state.viewModes, [platform]: mode },
        })),
      setPlatformStatus: (platform: PlatformId, status: PlatformStatus) =>
        set((state: UIState) => ({
          platformStatus: { ...state.platformStatus, [platform]: status },
        })),
      setSelectedPlatform: (platform: PlatformId | null) => set({ selectedPlatform: platform }),
      toggleFilters: () => set((state: UIState) => ({ isFiltersOpen: !state.isFiltersOpen })),
      setSearchFilter: (search: string) =>
        set((state: UIState) => ({
          activeFilters: { ...state.activeFilters, search },
        })),
      setStatusFilter: (status: string[]) =>
        set((state: UIState) => ({
          activeFilters: { ...state.activeFilters, status },
        })),
    }),
    {
      name: 'delivery-ui-storage',
      partialize: (state: UIState) => ({ viewModes: state.viewModes }),
    }
  )
);
