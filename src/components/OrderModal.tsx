import { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import ModalShell from '@/components/ModalShell';
import OrderForm from '@/components/OrderForm';
import { formatCurrencyBRL } from '@/lib/format';
import { ORDER_STATUS_LABEL } from '@/lib/orders';
import { useNarra } from '@/state/useNarra';
import type { Creator, Order, OrderDraft } from '@/types/narra';

const SEND_ERROR_MESSAGE = 'Não foi possível enviar o pedido. Tente novamente.';

interface OrderModalProps {
  creator: Creator;
  onClose: () => void;
}

export default function OrderModal({ creator, onClose }: OrderModalProps) {
  const { placeOrder } = useNarra();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);

  const handleSubmit = async (draft: OrderDraft) => {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      setConfirmedOrder(await placeOrder(creator.id, draft));
    } catch {
      setErrorMessage(SEND_ERROR_MESSAGE);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (confirmedOrder) {
    return (
      <ModalShell title="Pedido enviado" onClose={onClose}>
        <div className="flex flex-col items-center gap-5 py-4 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-500/15 text-primary-300">
            <CheckCircle2 size={28} />
          </span>
          <div>
            <p className="text-base font-semibold tracking-tight text-zinc-50">Pedido enviado para {creator.name}</p>
            <p className="mt-1 text-sm text-zinc-400">
              Status: {ORDER_STATUS_LABEL[confirmedOrder.status]} · Total {formatCurrencyBRL(confirmedOrder.total)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-11 w-full rounded-xl bg-primary-500 text-sm font-semibold text-zinc-950 transition hover:bg-primary-400"
          >
            Fechar
          </button>
        </div>
      </ModalShell>
    );
  }

  return (
    <ModalShell
      title="Fazer pedido"
      subtitle={`com ${creator.name}`}
      onClose={onClose}
    >
      <OrderForm
        creator={creator}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        errorMessage={errorMessage}
      />
    </ModalShell>
  );
}
