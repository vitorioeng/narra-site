import { useState } from 'react';
import { Wallet } from 'lucide-react';
import WithdrawalModal from '@/components/WithdrawalModal';
import { formatCurrencyBRL, formatShortDateTime } from '@/lib/format';
import { useNarra } from '@/state/useNarra';
import type { WithdrawalStatus } from '@/types/narra';

const WITHDRAWAL_STATUS_LABEL: Record<WithdrawalStatus, string> = {
  pendente: 'Pendente de aprovação',
  aprovado: 'Aprovado',
  recusado: 'Recusado',
};

const WITHDRAWAL_STATUS_STYLE: Record<WithdrawalStatus, string> = {
  pendente: 'border-accent-500/30 bg-accent-500/10 text-accent-300',
  aprovado: 'border-primary-500/30 bg-primary-500/10 text-primary-300',
  recusado: 'border-error-500/30 bg-error-500/10 text-error-400',
};

export default function WalletView() {
  const { wallet } = useNarra();
  const [isWithdrawalOpen, setIsWithdrawalOpen] = useState(false);

  if (!wallet) {
    return <p className="py-16 text-center text-sm text-zinc-500">Carregando carteira...</p>;
  }

  return (
    <section className="pt-8 animate-fade-in">
      <h2 className="text-2xl font-semibold tracking-tight text-zinc-50">Carteira</h2>
      <p className="mt-1 text-sm text-zinc-400">Acompanhe seus ganhos e solicite saques.</p>

      <div className="mt-6 rounded-3xl border border-primary-500/25 bg-gradient-to-br from-primary-500/15 via-surface to-surface p-6">
        <div className="flex items-center gap-2 text-sm font-medium text-primary-200">
          <Wallet size={16} />
          Saldo disponível
        </div>
        <p className="mt-3 text-4xl font-semibold tracking-tight text-primary-300 tabular-nums">
          {formatCurrencyBRL(wallet.available)}
        </p>
        <p className="mt-2 text-sm text-zinc-400">
          Em andamento: <span className="font-medium text-zinc-200">{formatCurrencyBRL(wallet.pending)}</span>
        </p>

        <button
          type="button"
          onClick={() => setIsWithdrawalOpen(true)}
          disabled={wallet.available <= 0}
          className="mt-6 flex h-12 w-full items-center justify-center rounded-xl bg-primary-500 text-sm font-semibold text-zinc-950 transition hover:bg-primary-400 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
        >
          Solicitar saque
        </button>
      </div>

      {wallet.withdrawals.length > 0 && (
        <div className="mt-8">
          <h3 className="text-sm font-semibold text-zinc-200">Saques</h3>
          <ul className="mt-3 flex flex-col gap-3">
            {wallet.withdrawals.map((withdrawal) => (
              <li key={withdrawal.id} className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-surface px-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-zinc-100">{formatCurrencyBRL(withdrawal.amount)}</p>
                  <p className="mt-0.5 text-xs text-zinc-500">{formatShortDateTime(withdrawal.createdAt)}</p>
                </div>
                <span
                  className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${WITHDRAWAL_STATUS_STYLE[withdrawal.status]}`}
                >
                  {WITHDRAWAL_STATUS_LABEL[withdrawal.status]}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-8">
        <h3 className="text-sm font-semibold text-zinc-200">Movimentações</h3>
        {wallet.entries.length === 0 ? (
          <div className="mt-3 rounded-3xl border border-dashed border-line bg-surface p-6 text-center">
            <p className="text-sm font-medium text-zinc-200">Nenhuma movimentação ainda</p>
            <p className="mt-1 text-xs text-zinc-500">Os valores aparecem aqui quando um cliente aprovar uma entrega.</p>
          </div>
        ) : (
          <ul className="mt-3 flex flex-col divide-y divide-line rounded-3xl border border-line bg-surface">
            {wallet.entries.map((entry) => {
              const isCredit = entry.amount > 0;
              return (
                <li key={entry.id} className="flex items-center justify-between gap-3 px-5 py-4">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-zinc-100">{entry.description}</p>
                    <p className="mt-0.5 text-xs text-zinc-500">{formatShortDateTime(entry.createdAt)}</p>
                  </div>
                  <p className={`shrink-0 text-sm font-semibold tabular-nums ${isCredit ? 'text-primary-300' : 'text-zinc-300'}`}>
                    {isCredit ? '+' : '-'}
                    {formatCurrencyBRL(Math.abs(entry.amount))}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {isWithdrawalOpen && (
        <WithdrawalModal available={wallet.available} onClose={() => setIsWithdrawalOpen(false)} />
      )}
    </section>
  );
}
