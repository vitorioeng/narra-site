import { Mic, Video } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { MarketMode } from '@/types/narra';

const OPTIONS: { value: MarketMode; label: string; icon: LucideIcon }[] = [
  { value: 'audio', label: 'Áudio Personalizado', icon: Mic },
  { value: 'video', label: 'Vídeo Personalizado', icon: Video },
];

interface ModeSwitchProps {
  mode: MarketMode;
  onChange: (mode: MarketMode) => void;
}

export default function ModeSwitch({ mode, onChange }: ModeSwitchProps) {
  return (
    <div role="tablist" aria-label="Tipo de conteúdo" className="grid grid-cols-2 gap-1 rounded-2xl border border-line bg-surface p-1">
      {OPTIONS.map(({ value, label, icon: Icon }) => {
        const selected = mode === value;
        return (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(value)}
            className={`flex h-10 items-center justify-center gap-2 rounded-xl text-sm font-medium transition duration-300 ${
              selected ? 'bg-elevated text-zinc-50 shadow-sm' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Icon size={15} className={selected ? 'text-primary-400' : ''} />
            {label}
          </button>
        );
      })}
    </div>
  );
}
