import { AudioWaveform, Pause, SkipBack, SkipForward } from 'lucide-react';

export default function PlayerBar() {
  return (
    <div className="fixed inset-x-0 bottom-16 z-40 px-3">
      <div className="relative mx-auto flex max-w-md items-center gap-3 overflow-hidden rounded-2xl border border-line bg-elevated/95 p-3 shadow-2xl shadow-black/60 backdrop-blur-xl md:max-w-xl">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-900 to-zinc-900 text-primary-400">
          <AudioWaveform size={20} />
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-zinc-50">Leitor 01 · Amostra</p>
          <p className="truncate text-xs text-zinc-400">Calma e próxima · 0:24 / 1:00</p>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            aria-label="Voltar"
            className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-400 transition hover:text-zinc-100"
          >
            <SkipBack size={16} className="fill-current" />
          </button>
          <button
            type="button"
            aria-label="Pausar"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-500 text-zinc-950 transition hover:bg-primary-400 active:scale-95"
          >
            <Pause size={16} className="fill-current" />
          </button>
          <button
            type="button"
            aria-label="Avançar"
            className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-400 transition hover:text-zinc-100"
          >
            <SkipForward size={16} className="fill-current" />
          </button>
        </div>

        <div className="absolute inset-x-0 bottom-0 h-0.5 bg-white/5">
          <div className="h-full w-[35%] bg-primary-500" />
        </div>
      </div>
    </div>
  );
}
