import { useState } from 'react';
import Avatar from '@/components/Avatar';
import { formatCurrencyBRL } from '@/lib/format';
import { ORDER_STATUS_LABEL } from '@/lib/orders';
import { useNarra } from '@/state/useNarra';
import type { OrderStatus } from '@/types/narra';

const STATUS_STYLE: Record<OrderStatus, string> = {
  pendente: 'border-accent-500/30 bg-accent-500/10 text-accent-300',
  em_gravacao: 'border-secondary-500/30 bg-secondary-500/10 text-secondary-300',
  entregue: 'border-primary-500/30 bg-primary-500/10 text-primary-300',
  concluido: 'border-primary-500/30 bg-primary-500/20 text-primary-200',
  recusado: 'border-error-500/30 bg-error-500/10 text-error-400',
};

const BRIEFING_LABEL = { texto: 'Texto', roteiro: 'Roteiro' } as const;
const ACTION_ERROR_MESSAGE = 'Não foi possível atualizar o pedido. Tente novamente.';

export default function OrdersView() {
  const { profile, orders, creators, currentCreator, setOrderStatus } = useNarra();
  const [busyOrderId, setBusyOrderId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  if (!profile) return null;

  const isCreator = profile.role === 'criador';
  const visibleOrders = isCreator
    ? orders.filter((order) => order.creatorId === currentCreator?.id && order.status !== 'recusado')
    : orders.filter((order) => order.clientId === profile.id);

  const creatorName = (creatorId: string) => creators.find((creator) => creator.id === creatorId)?.name ?? 'Criador';

  const changeStatus = async (orderId: string, status: OrderStatus) => {
    setBusyOrderId(orderId);
    setActionError(null);
    try {
      await setOrderStatus(orderId, status);
    } catch {
      setActionError(ACTION_ERROR_MESSAGE);
    } finally {
      setBusyOrderId(null);
    }
  };

  return (
    <section className="pt-8 animate-fade-in">
      <h2 className="text-2xl font-semibold tracking-tight text-zinc-50">
        {isCreator ? 'Pedidos recebidos' : 'Meus pedidos'}
      </h2>
      <p className="mt-1 text-sm text-zinc-400">
        {isCreator ? 'Aceite ou recuse os pedidos que chegam para você.' : 'Acompanhe o andamento das suas encomendas.'}
      </p>

      {actionError && (
        <p role="alert" className="mt-4 rounded-xl border border-error-500/30 bg-error-500/10 px-4 py-3 text-sm text-error-400">
          {actionError}
        </p>
      )}

      {visibleOrders.length === 0 ? (
        <div className="mt-6 rounded-3xl border border-dashed border-line bg-surface p-8 text-center">
          <p className="text-sm font-medium text-zinc-200">Nenhum pedido por enquanto</p>
          <p className="mt-1 text-xs text-zinc-500">
            {isCreator ? 'Novos pedidos aparecem aqui assim que chegarem.' : 'Escolha um criador na tela inicial para começar.'}
          </p>
        </div>
      ) : (
        <ul className="mt-6 flex flex-col gap-4">
          {visibleOrders.map((order) => {
            const isPending = order.status === 'pendente';
            const isBusy = busyOrderId === order.id;
            return (
              <li key={order.id} className="rounded-3xl border border-line bg-surface p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    {isCreator && (
                      <Avatar src={order.clientAvatarUrl} name={order.clientName || 'Cliente'} className="h-10 w-10 text-sm" />
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold tracking-tight text-zinc-50">
                        {isCreator ? order.clientName || 'Cliente' : creatorName(order.creatorId)}
                      </p>
                      <p className="mt-0.5 text-xs text-zinc-500">
                        {order.minutes} min · {order.style}
                      </p>
                    </div>
                  </div>
                  <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${STATUS_STYLE[order.status]}`}>
                    {ORDER_STATUS_LABEL[order.status]}
                  </span>
                </div>

                <p className="mt-4 line-clamp-3 text-sm leading-normal text-zinc-300">
                  <span className="text-xs font-medium text-zinc-500">{BRIEFING_LABEL[order.briefingType]}: </span>
                  {order.briefing}
                </p>

                <div className="mt-4 flex items-center justify-between gap-3 border-t border-line pt-4">
                  <p className="text-sm text-zinc-400">
                    Total <span className="font-semibold text-zinc-50">{formatCurrencyBRL(order.total)}</span>
                  </p>
                  {isCreator && isPending && (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => changeStatus(order.id, 'recusado')}
                        className="h-9 rounded-xl border border-line px-3 text-xs font-semibold text-zinc-300 transition hover:border-error-500/40 hover:text-error-400 disabled:opacity-50"
                      >
                        Recusar
                      </button>
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => changeStatus(order.id, 'em_gravacao')}
                        className="h-9 rounded-xl bg-primary-500 px-3 text-xs font-semibold text-zinc-950 transition hover:bg-primary-400 disabled:opacity-50"
                      >
                        Aceitar
                      </button>
                    </div>
                  )}
                  {isCreator && order.status === 'em_gravacao' && (
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => changeStatus(order.id, 'entregue')}
                      className="h-9 rounded-xl bg-primary-500 px-3 text-xs font-semibold text-zinc-950 transition hover:bg-primary-400 disabled:opacity-50"
                    >
                      Marcar como entregue
                    </button>
                  )}
                  {!isCreator && order.status === 'entregue' && (
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => changeStatus(order.id, 'concluido')}
                      className="h-9 rounded-xl bg-primary-500 px-3 text-xs font-semibold text-zinc-950 transition hover:bg-primary-400 disabled:opacity-50"
                    >
                      Aprovar entrega
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
