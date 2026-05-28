'use client';

import { Search, SlidersHorizontal, LayoutGrid, List } from 'lucide-react';
import { useUIStore } from '../../store/uiStore';
import { PlatformId } from '../../types/orders';
import { cn } from '@/hooks/lib/utils';

interface OrderFiltersProps {
  platform: PlatformId;
}

export function OrderFilters({ platform }: OrderFiltersProps) {
  const { viewModes, setViewMode, activeFilters, setSearchFilter } = useUIStore();
  const currentViewMode = viewModes[platform];

  return (
    <div className="flex flex-col md:flex-row gap-4 mb-8">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" size={18} />
        <input
          type="text"
          placeholder="Buscar por ID, cliente o plato..."
          value={activeFilters.search}
          onChange={(e) => setSearchFilter(e.target.value)}
          className="w-full bg-white/5 border border-white/5 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/20 transition-colors"
        />
      </div>

      <div className="flex items-center gap-2">
        <div className="bg-white/5 p-1 rounded-xl border border-white/5 flex gap-1">
          <button
            onClick={() => setViewMode(platform, 'kanban')}
            className={cn(
              'p-2 rounded-lg transition-all',
              currentViewMode === 'kanban' ? 'bg-white/10 text-white shadow-lg' : 'text-white/40 hover:text-white/60'
            )}
            title="Vista Kanban"
          >
            <LayoutGrid size={18} />
          </button>
          <button
            onClick={() => setViewMode(platform, 'list')}
            className={cn(
              'p-2 rounded-lg transition-all',
              currentViewMode === 'list' ? 'bg-white/10 text-white shadow-lg' : 'text-white/40 hover:text-white/60'
            )}
            title="Vista Lista"
          >
            <List size={18} />
          </button>
        </div>

        <button className="bg-white/5 border border-white/5 px-4 py-2.5 rounded-xl text-white/40 hover:text-white flex items-center gap-2 transition-all">
          <SlidersHorizontal size={18} />
          <span className="text-sm font-bold uppercase tracking-widest">Filtros</span>
        </button>
      </div>
    </div>
  );
}
