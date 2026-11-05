import { useEffect, useState } from 'react';
import { CheckCircle2, ClipboardList, Home, LogIn, ShieldCheck, UserRound, Wallet, X } from 'lucide-react';
import AdminWithdrawalsView from '@/components/AdminWithdrawalsView';
import AuthModal from '@/components/AuthModal';
import BottomNav from '@/components/BottomNav';
import type { NavTab } from '@/components/BottomNav';
import CreatorCard from '@/components/CreatorCard';
import CreatorPickerModal from '@/components/CreatorPickerModal';
import FloatingAddButton from '@/components/FloatingAddButton';
import HeroIntro from '@/components/HeroIntro';
import ModeSwitch from '@/components/ModeSwitch';
import OrderModal from '@/components/OrderModal';
import OrdersView from '@/components/OrdersView';
import PlayerBar from '@/components/PlayerBar';
import ProfileView from '@/components/ProfileView';
import SearchFilters from '@/components/SearchFilters';
import Topbar from '@/components/Topbar';
import WalletView from '@/components/WalletView';
import { useNarra } from '@/state/useNarra';
import type { Creator, MarketMode } from '@/types/narra';

type TabId = 'inicio' | 'pedidos' | 'carteira' | 'conta' | 'admin' | 'entrar';

const PAYMENT_NOTICES: Record<string, string> = {
  sucesso: 'Recebemos o seu pagamento. Se o pedido ainda aparecer como aguardando pagamento, atualize a página em instantes.',
  cancelado: 'Pagamento cancelado. Você pode pagar o pedido depois na sua lista de pedidos.',
};

function App() {
  const { authReady, profile, creators, orders, loadError, currentCreator, isAdmin } = useNarra();
  const [paymentReturn, setPaymentReturn] = useState<string | null>(() => new URLSearchParams(window.location.search).get('pagamento'));
  const [tab, setTab] = useState<TabId>(() => (paymentReturn ? 'pedidos' : 'inicio'));
  const [mode, setMode] = useState<MarketMode>('audio');
  const [orderingCreator, setOrderingCreator] = useState<Creator | null>(null);
  const [isPickingCreator, setIsPickingCreator] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);

  const isCreator = profile?.role === 'criador';
  const activeTab: TabId = profile ? tab : 'inicio';
  const visibleCreators = creators.filter((creator) => creator.mode === mode);

  useEffect(() => {
    if (paymentReturn) window.history.replaceState(null, '', window.location.pathname);
  }, [paymentReturn]);

  const pendingCount = profile
    ? orders.filter(
        (order) =>
          order.status === 'pendente' &&
          (isCreator ? order.creatorId === currentCreator?.id : order.clientId === profile.id)
      ).length
    : 0;

  const accountInitial = profile ? profile.name.trim().charAt(0).toUpperCase() || '?' : null;

  const tabs: NavTab[] = profile
    ? [
        { id: 'inicio', label: 'Início', icon: Home },
        { id: 'pedidos', label: 'Meus Pedidos', icon: ClipboardList },
        ...(isCreator ? [{ id: 'carteira', label: 'Carteira', icon: Wallet }] : []),
        { id: 'conta', label: isCreator ? 'Meu Perfil' : 'Perfil', icon: UserRound },
        ...(isAdmin ? [{ id: 'admin', label: 'Admin', icon: ShieldCheck }] : []),
      ]
    : [
        { id: 'inicio', label: 'Início', icon: Home },
        { id: 'entrar', label: 'Entrar', icon: LogIn },
      ];

  const handleNavSelect = (id: string) => {
    if (id === 'entrar') setAuthOpen(true);
    else setTab(id as TabId);
  };

  const handleOrder = (creator: Creator) => {
    if (profile) setOrderingCreator(creator);
    else setAuthOpen(true);
  };

  return (
    <div className="min-h-screen bg-background text-zinc-100">
      <Topbar
        notificationCount={pendingCount}
        accountInitial={accountInitial}
        onNotificationsClick={() => (profile ? setTab('pedidos') : setAuthOpen(true))}
        onAccountClick={() => (profile ? setTab('conta') : setAuthOpen(true))}
      />

      <main className="mx-auto max-w-md px-4 pb-60 pt-2">
        {!authReady && <p className="py-16 text-center text-sm text-zinc-500">Carregando...</p>}

        {paymentReturn && PAYMENT_NOTICES[paymentReturn] && (
          <div role="status" className="mt-4 flex items-start gap-3 rounded-xl border border-primary-500/30 bg-primary-500/10 px-4 py-3 text-sm text-primary-200">
            <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
            <p className="flex-1 leading-normal">{PAYMENT_NOTICES[paymentReturn]}</p>
            <button type="button" aria-label="Fechar aviso" onClick={() => setPaymentReturn(null)} className="shrink-0 text-primary-300 transition hover:text-primary-100">
              <X size={18} />
            </button>
          </div>
        )}

        {loadError && (
          <p role="alert" className="mt-4 rounded-xl border border-error-500/30 bg-error-500/10 px-4 py-3 text-sm text-error-400">
            {loadError}
          </p>
        )}

        {activeTab === 'inicio' && (
          <>
            <HeroIntro mode={mode} />
            <ModeSwitch mode={mode} onChange={setMode} />
            <div className="mt-4">
              <SearchFilters />
            </div>
            {visibleCreators.length === 0 ? (
              <p className="mt-10 text-center text-sm text-zinc-500">Nenhum criador disponível nesta categoria ainda.</p>
            ) : (
              <div key={mode} className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {visibleCreators.map((creator) => (
                  <CreatorCard
                    key={creator.id}
                    creator={creator}
                    onOrder={isCreator ? undefined : handleOrder}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === 'pedidos' && <OrdersView />}
        {activeTab === 'carteira' && isCreator && <WalletView />}
        {activeTab === 'conta' && <ProfileView />}
        {activeTab === 'admin' && isAdmin && <AdminWithdrawalsView />}
      </main>

      {activeTab === 'inicio' && (
        <>
          <PlayerBar />
          {!isCreator && <FloatingAddButton onClick={() => setIsPickingCreator(true)} />}
        </>
      )}

      <BottomNav tabs={tabs} activeId={activeTab} onSelect={handleNavSelect} />

      {isPickingCreator && profile && (
        <CreatorPickerModal
          creators={visibleCreators}
          onSelect={(creator) => {
            setIsPickingCreator(false);
            setOrderingCreator(creator);
          }}
          onClose={() => setIsPickingCreator(false)}
        />
      )}
      {orderingCreator && profile && (
        <OrderModal creator={orderingCreator} onClose={() => setOrderingCreator(null)} />
      )}
      {authOpen && <AuthModal onClose={() => setAuthOpen(false)} />}
    </div>
  );
}

export default App;
