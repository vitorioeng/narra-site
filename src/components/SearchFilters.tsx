import { Search, SlidersHorizontal, X } from 'lucide-react';

const filterChips = ['Preço', 'Prazo', 'Idioma'];

export default function SearchFilters() {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search
            size={18}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500"
          />
          <input
            type="text"
            placeholder="Buscar por criador, idioma ou estilo"
            className="h-12 w-full rounded-xl border border-line bg-surface pl-11 pr-4 text-sm text-zinc-100 placeholder:text-zinc-500 outline-none transition focus:border-primary-500/50 focus:ring-2 focus:ring-primary-500/20"
          />
        </div>
        <button
          type="button"
          aria-label="Mais filtros"
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-line bg-surface text-zinc-400 transition hover:border-white/20 hover:text-zinc-100"
        >
          <SlidersHorizontal size={18} />
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {filterChips.map((chip) => (
          <button
            key={chip}
            type="button"
            className="inline-flex h-8 items-center gap-1.5 rounded-full border border-line bg-surface px-3 text-xs font-medium text-zinc-300 transition hover:border-white/20 hover:text-zinc-100"
          >
            {chip}
            <X size={12} className="text-zinc-500" />
          </button>
        ))}
      </div>
    </div>
  );
}
