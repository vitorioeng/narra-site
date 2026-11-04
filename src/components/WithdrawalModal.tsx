import { useState } from 'react';
import type { FormEvent } from 'react';
import ModalShell from '@/components/ModalShell';
import { formatCurrencyBRL, parseAmountInput } from '@/lib/format';
import { useNarra } from '@/state/useNarra';

const REQUEST_ERROR_MESSAGE = 'Não foi possível solicitar o saque. Tente novamente.';

interface WithdrawalModalProps {
  available: number;
  onClose: () => void;
}

export default function WithdrawalModal({ available, onClose }: WithdrawalModalProps) {
  const { requestWithdrawal } = useNarra();
  const [amountInput, setAmountInput] = useState('');
  const [pixKey, setPixKey] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;

    const amount = parseAmountInput(amountInput);
    const trimmedPix = pixKey.trim();
    if (amount === null) {
      setErrorMessage('Informe um valor maior que zero, com até duas casas decimais.');
      return;
    }
    if (amount > available + 1e-9) {
      setErrorMessage('O valor não pode ser maior que o saldo disponível.');
      return;
    }
    if (trimmedPix.length < 3) {
      setErrorMessage('Informe a sua chave PIX.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await requestWithdrawal(amount, trimmedPix);
      onClose();
    } catch {
      setErrorMessage(REQUEST_ERROR_MESSAGE);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModalShell title="Solicitar saque" subtitle="O valor sai do saldo assim que você solicitar." onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label htmlFor="withdrawal-amount" className="text-sm font-medium text-zinc-200">
              Valor
            </label>
            <button
              type="button"
              onClick={() => setAmountInput(available.toFixed(2).replace('.', ','))}
              disabled={available <= 0}
              className="text-xs font-semibold text-primary-300 transition hover:text-primary-200 disabled:opacity-40"
            >
              Usar saldo total
            </button>
          </div>
          <input
            id="withdrawal-amount"
            type="text"
            inputMode="decimal"
            value={amountInput}
            onChange={(event) => setAmountInput(event.target.value)}
            placeholder="0,00"
            className="h-12 w-full rounded-xl border border-line bg-elevated px-4 text-sm text-zinc-100 placeholder:text-zinc-500 outline-none transition focus:border-primary-500/50 focus:ring-2 focus:ring-primary-500/20"
          />
          <p className="text-xs text-zinc-500">Disponível: {formatCurrencyBRL(available)}</p>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="withdrawal-pix" className="text-sm font-medium text-zinc-200">
            Chave PIX
          </label>
          <input
            id="withdrawal-pix"
            type="text"
            value={pixKey}
            maxLength={100}
            onChange={(event) => setPixKey(event.target.value)}
            placeholder="CPF, e-mail, telefone ou chave aleatória"
            className="h-12 w-full rounded-xl border border-line bg-elevated px-4 text-sm text-zinc-100 placeholder:text-zinc-500 outline-none transition focus:border-primary-500/50 focus:ring-2 focus:ring-primary-500/20"
          />
        </div>

        {errorMessage && (
          <p role="alert" className="rounded-xl border border-error-500/30 bg-error-500/10 px-4 py-3 text-sm text-error-400">
            {errorMessage}
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="flex h-12 items-center justify-center rounded-xl bg-primary-500 text-sm font-semibold text-zinc-950 transition hover:bg-primary-400 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? 'Enviando...' : 'Confirmar saque'}
        </button>
      </form>
    </ModalShell>
  );
}
