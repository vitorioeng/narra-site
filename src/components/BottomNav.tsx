import type { LucideIcon } from 'lucide-react';

export interface NavTab {
  id: string;
  label: string;
  icon: LucideIcon;
}

interface BottomNavProps {
  tabs: NavTab[];
  activeId: string;
  onSelect: (id: string) => void;
}

export default function BottomNav({ tabs, activeId, onSelect }: BottomNavProps) {
  return (
    <nav aria-label="Navegação principal" className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-background/90 backdrop-blur-xl">
      <ul className="mx-auto flex h-16 max-w-md px-2">
        {tabs.map(({ id, label, icon: Icon }) => {
          const active = id === activeId;
          return (
            <li key={id} className="flex-1">
              <button
                type="button"
                onClick={() => onSelect(id)}
                aria-current={active ? 'page' : undefined}
                className={`flex h-full w-full flex-col items-center justify-center gap-1 text-[11px] font-medium transition ${
                  active ? 'text-primary-300' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <Icon size={20} />
                {label}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
