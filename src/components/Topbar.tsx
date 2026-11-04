import { Bell, User } from 'lucide-react';

interface TopbarProps {
  notificationCount: number;
  accountInitial: string | null;
  onNotificationsClick: () => void;
  onAccountClick: () => void;
}

export default function Topbar({ notificationCount, accountInitial, onNotificationsClick, onAccountClick }: TopbarProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-background/80 backdrop-blur-xl">
      <div className="mx-auto grid h-16 max-w-md grid-cols-3 items-center px-4">
        <div />
        <h1 className="text-center text-lg font-semibold tracking-tight text-zinc-50">Narra</h1>
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onNotificationsClick}
            aria-label={notificationCount > 0 ? `Notificações: ${notificationCount} pendentes` : 'Notificações'}
            className="relative flex h-9 w-9 items-center justify-center rounded-full border border-line bg-surface text-zinc-300 transition hover:text-zinc-50 active:scale-95"
          >
            <Bell size={17} />
            {notificationCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-primary-500 px-1 text-[10px] font-semibold text-zinc-950">
                {notificationCount}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={onAccountClick}
            aria-label={accountInitial ? 'Minha conta' : 'Entrar'}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-elevated text-sm font-semibold text-zinc-200 transition hover:border-white/20 active:scale-95"
          >
            {accountInitial ?? <User size={16} />}
          </button>
        </div>
      </div>
    </header>
  );
}
