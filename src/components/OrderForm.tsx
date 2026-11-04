import { useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import type { Creator, OrderDraft } from '@/types/narra';
import { formatCurrencyBRL } from '@/lib/format';
import { MAX_MINUTES, MIN_MINUTES, calculateOrderTotal } from '@/lib/orders';

const MAX_BRIEFING_LENGTH = 1200;
const NO_PRICE_LABEL = 'Preço a combinar';

interface OrderFormProps {
  creator: Creator;
  onSubmit: (draft: OrderDraft) => void;
  isSubmitting: boolean;
  errorMessage: string | null;
}

function SectionLabel({ children }: { children: ReactNode }) {
  return <span className="block text-sm font-medium text-zinc-200">{children}</span>;
}

function ChoiceChip({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`h-9 rounded-full border px-4 text-sm font-medium transition ${
        selected
          ? 'border-primary-500/60 bg-primary-500/15 text-primary-300'
          : 'border-line bg-elevated text-zinc-300 hover:border-white/20 hover:text-zinc-100'
      }`}
    >
      {children}
    </button>
  );
}

export default function OrderForm({ creator, onSubmit, isSubmitting, errorMessage }: OrderFormProps) {
  const [minutes, setMinutes] = useState(MIN_MINUTES);
  const [style, setStyle] = useState(creator.styles[0] ?? '');
  const [briefing, setBriefing] = useState('');

  const hasPrice = creator.pricePerMinute > 0;
  const total = calculateOrderTotal(minutes, creator.pricePerMinute);
  const isValid = briefing.trim().length > 0;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isValid || isSubmitting) return;
    onSubmit({ minutes, style, briefingType: 'texto', briefing: briefing.trim() });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div>
        <div className="flex items-end justify-between">
          <label htmlFor="order-minutes" className="text-sm font-medium text-zinc-200">
            Duração do áudio
          </label>
          <span className="text-2xl font-semibold tracking-tight text-zinc-50">
            {minutes} <span className="text-sm font-medium text-zinc-400">min</span>
          </span>
        </div>
        <input
          id="order-minutes"
          type="range"
          min={MIN_MINUTES}
          max={MAX_MINUTES}
          step={1}
          value={minutes}
          onChange={(event) => setMinutes(Number(event.target.value))}
          className="mt-4 h-2 w-full cursor-pointer appearance-none rounded-full bg-elevated accent-primary-500"
        />
        <div className="mt-2 flex justify-between text-[11px] text-zinc-500">
          <span>{MIN_MINUTES} min</span>
          <span>{MAX_MINUTES} min</span>
        </div>
      </div>

      <div>
        <SectionLabel>Estilo de voz</SectionLabel>
        <div className="mt-3 flex flex-wrap gap-2">
          {creator.styles.map((option) => (
            <ChoiceChip key={option} selected={style === option} onClick={() => setStyle(option)}>
              {option}
            </ChoiceChip>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <label htmlFor="order-briefing" className="text-sm font-medium text-zinc-200">
          O que você quer ouvir/ver?
        </label>
        <textarea
          id="order-briefing"
          rows={7}
          maxLength={MAX_BRIEFING_LENGTH}
          value={briefing}
          onChange={(event) => setBriefing(event.target.value)}
          placeholder="Ex: Quero uma mensagem carinhosa para a minha mãe, falando sobre saudade..."
          className="w-full resize-none rounded-xl border border-line bg-elevated p-4 text-sm leading-normal text-zinc-100 placeholder:text-zinc-500 outline-none transition focus:border-primary-500/50 focus:ring-2 focus:ring-primary-500/20"
        />
      </div>

      <div className="sticky bottom-0 -mx-6 -mb-6 flex flex-col gap-3 border-t border-line bg-surface px-6 pb-6 pt-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-zinc-300">Total</span>
          <span className="text-xl font-semibold tracking-tight text-zinc-50">
            {hasPrice ? formatCurrencyBRL(total) : NO_PRICE_LABEL}
          </span>
        </div>
        <button
          type="submit"
          disabled={!isValid || isSubmitting}
          className="flex h-12 items-center justify-center rounded-xl bg-primary-500 text-sm font-semibold text-zinc-950 transition hover:bg-primary-400 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-zinc-800 disabled:text-zinc-500"
        >
          {isSubmitting ? 'Enviando...' : 'Enviar pedido'}
        </button>
        {errorMessage && (
          <p role="alert" className="text-center text-xs text-error-400">
            {errorMessage}
          </p>
        )}
      </div>
    </form>
  );
}
