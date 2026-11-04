import { useState } from 'react';
import type { Creator } from '@/types/narra';
import { useNarra } from '@/state/useNarra';

const SAVE_ERROR_MESSAGE = 'Não foi possível alterar a disponibilidade. Tente novamente.';

interface CreatorAvailabilityToggleProps {
  creator: Creator;
}

export default function CreatorAvailabilityToggle({ creator }: CreatorAvailabilityToggleProps) {
  const { saveCreatorAvailability } = useNarra();
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleToggle = async () => {
    setIsSaving(true);
    setErrorMessage(null);
    try {
      await saveCreatorAvailability(creator.id, !creator.isActive);
    } catch {
      setErrorMessage(SAVE_ERROR_MESSAGE);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="flex flex-col gap-4 rounded-3xl border border-line bg-surface p-5">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h3 className="text-base font-semibold tracking-tight text-zinc-50">Disponibilidade</h3>
          <p className="mt-1 text-xs text-zinc-500">
            {creator.isActive
              ? 'Ativo: você aparece no catálogo e recebe novos pedidos.'
              : 'Pausado: você sai do catálogo e não recebe novos pedidos.'}
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={creator.isActive}
          aria-label="Disponibilidade para pedidos"
          disabled={isSaving}
          onClick={handleToggle}
          className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-50 ${
            creator.isActive ? 'border-primary-500/40 bg-primary-500' : 'border-line bg-elevated'
          }`}
        >
          <span
            className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${
              creator.isActive ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {errorMessage && (
        <p role="alert" className="rounded-xl border border-error-500/30 bg-error-500/10 px-4 py-3 text-sm text-error-400">
          {errorMessage}
        </p>
      )}
    </section>
  );
}
