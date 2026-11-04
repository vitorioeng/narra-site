import { useState } from 'react';
import type { FormEvent } from 'react';
import { DEADLINE_OPTIONS, STYLE_OPTIONS } from '@/lib/catalog';
import { useNarra } from '@/state/useNarra';
import type { Creator } from '@/types/narra';

const MAX_PRICE_PER_MINUTE = 10000;
const SAVE_ERROR_MESSAGE = 'Não foi possível salvar. Tente novamente.';

function toggleItem(list: string[], item: string): string[] {
  return list.includes(item) ? list.filter((current) => current !== item) : [...list, item];
}

interface CreatorProfileFormProps {
  creator: Creator;
}

interface Feedback {
  tone: 'success' | 'error';
  text: string;
}

export default function CreatorProfileForm({ creator }: CreatorProfileFormProps) {
  const { saveCreator } = useNarra();
  const [price, setPrice] = useState(String(creator.pricePerMinute));
  const [deadlines, setDeadlines] = useState<string[]>(creator.deadlines);
  const [styles, setStyles] = useState<string[]>(creator.styles);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  const pricePerMinute = Number(price.replace(',', '.'));
  const isPriceValid = Number.isFinite(pricePerMinute) && pricePerMinute > 0 && pricePerMinute <= MAX_PRICE_PER_MINUTE;
  const canSave = isPriceValid && deadlines.length > 0 && styles.length > 0 && !isSaving;
  const styleOptions = STYLE_OPTIONS[creator.mode];

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSave) return;
    setIsSaving(true);
    setFeedback(null);
    try {
      await saveCreator(creator.id, { pricePerMinute, deadlines, styles });
      setFeedback({ tone: 'success', text: 'Alterações salvas. Já aparecem para os clientes.' });
    } catch {
      setFeedback({ tone: 'error', text: SAVE_ERROR_MESSAGE });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 rounded-3xl border border-line bg-surface p-5">
      <div>
        <h3 className="text-base font-semibold tracking-tight text-zinc-50">Meu perfil de criador</h3>
        <p className="mt-1 text-xs text-zinc-500">Essas informações definem o que os clientes veem e podem pedir.</p>
      </div>

      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium text-zinc-200">Preço por minuto (R$)</span>
        <input
          type="number"
          inputMode="decimal"
          min={1}
          max={MAX_PRICE_PER_MINUTE}
          step="0.5"
          value={price}
          onChange={(event) => setPrice(event.target.value)}
          className="h-12 w-full rounded-xl border border-line bg-elevated px-4 text-sm text-zinc-100 outline-none transition focus:border-primary-500/50 focus:ring-2 focus:ring-primary-500/20"
        />
        {!isPriceValid && <span className="text-xs text-error-400">Informe um valor maior que zero.</span>}
      </label>

      <fieldset className="flex flex-col gap-3">
        <legend className="text-sm font-medium text-zinc-200">Prazos aceitos</legend>
        <div className="flex flex-wrap gap-2">
          {DEADLINE_OPTIONS.map((option) => (
            <ToggleChip
              key={option}
              selected={deadlines.includes(option)}
              onClick={() => setDeadlines(toggleItem(deadlines, option))}
            >
              {option}
            </ToggleChip>
          ))}
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-3">
        <legend className="text-sm font-medium text-zinc-200">Estilos de voz</legend>
        <div className="flex flex-wrap gap-2">
          {styleOptions.map((option) => (
            <ToggleChip key={option} selected={styles.includes(option)} onClick={() => setStyles(toggleItem(styles, option))}>
              {option}
            </ToggleChip>
          ))}
        </div>
      </fieldset>

      {(deadlines.length === 0 || styles.length === 0) && (
        <p className="text-xs text-warning-400">Escolha pelo menos um prazo e um estilo.</p>
      )}

      {feedback && (
        <p
          role={feedback.tone === 'error' ? 'alert' : 'status'}
          className={`rounded-xl border px-4 py-3 text-sm ${
            feedback.tone === 'error'
              ? 'border-error-500/30 bg-error-500/10 text-error-400'
              : 'border-primary-500/30 bg-primary-500/10 text-primary-300'
          }`}
        >
          {feedback.text}
        </p>
      )}

      <button
        type="submit"
        disabled={!canSave}
        className="flex h-12 items-center justify-center rounded-xl bg-primary-500 text-sm font-semibold text-zinc-950 transition hover:bg-primary-400 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-zinc-800 disabled:text-zinc-500"
      >
        {isSaving ? 'Salvando...' : 'Salvar perfil'}
      </button>
    </form>
  );
}

function ToggleChip({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: string }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`h-9 rounded-full border px-4 text-sm font-medium transition ${
        selected
          ? 'border-primary-500/60 bg-primary-500/15 text-primary-300'
          : 'border-line bg-elevated text-zinc-400 hover:border-white/20 hover:text-zinc-100'
      }`}
    >
      {children}
    </button>
  );
}
