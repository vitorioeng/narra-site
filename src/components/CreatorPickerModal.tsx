import { ChevronRight } from 'lucide-react';
import Avatar from '@/components/Avatar';
import ModalShell from '@/components/ModalShell';
import { formatCurrencyBRL } from '@/lib/format';
import type { Creator } from '@/types/narra';

interface CreatorPickerModalProps {
  creators: Creator[];
  onSelect: (creator: Creator) => void;
  onClose: () => void;
}

export default function CreatorPickerModal({ creators, onSelect, onClose }: CreatorPickerModalProps) {
  return (
    <ModalShell title="Novo pedido" subtitle="Escolha quem vai gravar para você" onClose={onClose}>
      {creators.length === 0 ? (
        <p className="py-8 text-center text-sm text-zinc-500">Nenhum criador disponível nesta categoria ainda.</p>
      ) : (
        <ul className="-mx-2 flex flex-col gap-1">
          {creators.map((creator) => (
            <li key={creator.id}>
              <button
                type="button"
                onClick={() => onSelect(creator)}
                className="flex w-full items-center gap-3 rounded-2xl px-2 py-3 text-left transition hover:bg-white/5"
              >
                <Avatar src={creator.avatarUrl} name={creator.name} className="h-11 w-11 text-sm" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-zinc-50">{creator.name}</span>
                  <span className="block text-xs text-zinc-500">{formatCurrencyBRL(creator.pricePerMinute)} por minuto</span>
                </span>
                <ChevronRight size={16} className="shrink-0 text-zinc-500" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </ModalShell>
  );
}
