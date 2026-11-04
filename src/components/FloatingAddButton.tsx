import { Plus } from 'lucide-react';

interface FloatingAddButtonProps {
  onClick: () => void;
}

export default function FloatingAddButton({ onClick }: FloatingAddButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Criar novo pedido"
      className="fixed bottom-[9.5rem] right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary-500 text-zinc-950 shadow-lg shadow-primary-500/30 transition duration-200 hover:scale-105 hover:bg-primary-400 active:scale-95 md:right-8"
    >
      <Plus size={24} strokeWidth={2.5} />
    </button>
  );
}
