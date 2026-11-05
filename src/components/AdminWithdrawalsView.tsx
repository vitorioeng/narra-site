import { useCallback, useEffect, useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { formatCurrencyBRL, formatShortDateTime } from '@/lib/format';
import { fetchPendingWithdrawals } from '@/lib/narraApi';
import { useNarra } from '@/state/useNarra';
import type { Withdrawal } from '@/types/narra';

const LOAD_ERROR_MESSAGE = 'Não foi possível carregar os saques. Tente novamente.';
const DECISION_ERROR_MESSAGE = 'Não foi possível registrar a decisão. Tente novamente.';

export default function AdminWithdrawalsView() {
  const { decideWithdrawal } = useNarra();
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadWithdrawals = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      setWithdrawals(await fetchPendingWithdrawals());
    } catch {
      setLoadError(LOAD_ERROR_MESSAGE);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWithdrawals();
  }, [loadWithdrawals]);

  const handleDecision = async (withdrawal: Withdrawal, approve: boolean) => {
    setBusyId(withdrawal.id);
    setActionError(null);
    try {
      await decideWithdrawal(withdrawal.id, approve);
      setWithdrawals((current) => current.filter((item) => item.id !== withdrawal.id));
    } catch {
      setActionError(DECISION_ERROR_MESSAGE);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className="pt-8 animate-fade-in">
      <div className="flex items-center gap-2 text-primary-300">
        <ShieldCheck size={20} />
        <span className="text-xs font-semibold uppercase tracking-wider">Admin</span>
      </div>
      <h2 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-50">Saques pendentes</h2>
      <p className="mt-1 text-sm text-zinc-400">Aprove ou recuse os pedidos de saque dos criadores.</p>

      {actionError && (
        <p role="alert" className="mt-4 rounded-xl border border-error-500/30 bg-error-500/10 px-4 py-3 text-sm text-error-400">
          {actionError}
        </p>
      )}

      {isLoading ? (
        <p className="mt-10 text-center text-sm text-zinc-500">Carregando saques...</p>
      ) : loadError ? (
        <div className="mt-6 rounded-3xl border border-error-500/30 bg-error-500/10 p-6 text-center">
          <p className="text-sm text-error-400">{loadError}</p>
          <button
            type="button"
            onClick={loadWithdrawals}
            className="mt-4 h-9 rounded-xl border border-line px-4 text-xs font-semibold text-zinc-200 transition hover:bg-white/5"
          >
            Tentar novamente
          </button>
        </div>
      ) : withdrawals.length === 0 ? (
        <div className="mt-6 rounded-3xl border border-dashed border-line bg-surface p-8 text-center">
          <p className="text-sm font-medium text-zinc-200">Nenhum saque aguardando aprovação</p>
          <p className="mt-1 text-xs text-zinc-500">Novos pedidos de saque aparecem aqui.</p>
        </div>
      ) : (
        <ul className="mt-6 flex flex-col gap-4">
          {withdrawals.map((withdrawal) => {
            const isBusy = busyId === withdrawal.id;
            return (
              <li key={withdrawal.id} className="rounded-3xl border border-line bg-surface p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-zinc-50">{withdrawal.creatorName || 'Criador'}</p>
                    <p className="mt-0.5 text-xs text-zinc-500">{formatShortDateTime(withdrawal.createdAt)}</p>
                  </div>
                  <p className="shrink-0 text-lg font-semibold tabular-nums text-primary-300">
                    {formatCurrencyBRL(withdrawal.amount)}
                  </p>
                </div>

                <div className="mt-4 rounded-2xl border border-line bg-elevated px-4 py-3">
                  <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">Chave PIX</p>
                  <p className="mt-1 break-all text-sm text-zinc-100">{withdrawal.pixKey}</p>
                </div>

                <div className="mt-4 flex justify-end gap-2 border-t border-line pt-4">
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() => handleDecision(withdrawal, false)}
                    className="h-9 rounded-xl border border-line px-3 text-xs font-semibold text-zinc-300 transition hover:border-error-500/40 hover:text-error-400 disabled:opacity-50"
                  >
                    Recusar
                  </button>
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() => handleDecision(withdrawal, true)}
                    className="h-9 rounded-xl bg-primary-500 px-3 text-xs font-semibold text-zinc-950 transition hover:bg-primary-400 disabled:opacity-50"
                  >
                    Aprovar
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
