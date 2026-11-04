import { useState } from 'react';
import { LogOut, Pencil } from 'lucide-react';
import Avatar from '@/components/Avatar';
import ClientProfileModal from '@/components/ClientProfileModal';
import CreatorAvailabilityToggle from '@/components/CreatorAvailabilityToggle';
import CreatorMediaForm from '@/components/CreatorMediaForm';
import CreatorProfileForm from '@/components/CreatorProfileForm';
import { useNarra } from '@/state/useNarra';

export default function ProfileView() {
  const { profile, currentCreator, signOut } = useNarra();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  if (!profile) return null;

  const isCreator = profile.role === 'criador';
  const avatarUrl = isCreator ? currentCreator?.avatarUrl ?? null : profile.avatarUrl;

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut();
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <section className="flex flex-col gap-6 pt-8 animate-fade-in">
      <div className="flex items-center gap-4 rounded-3xl border border-line bg-surface p-5">
        <Avatar src={avatarUrl} name={profile.name} className="h-12 w-12 text-base" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-semibold tracking-tight text-zinc-50">{profile.name || 'Minha conta'}</p>
          <p className="text-xs text-zinc-500">{isCreator ? 'Conta de criador' : 'Conta de cliente'}</p>
        </div>
        {!isCreator && (
          <button
            type="button"
            onClick={() => setIsEditingProfile(true)}
            className="inline-flex h-9 shrink-0 items-center gap-2 rounded-xl border border-line px-3 text-xs font-semibold text-zinc-200 transition hover:border-white/20 hover:text-zinc-50"
          >
            <Pencil size={14} />
            Editar perfil
          </button>
        )}
      </div>

      {isEditingProfile && <ClientProfileModal onClose={() => setIsEditingProfile(false)} />}

      {isCreator &&
        (currentCreator ? (
          <>
            <CreatorAvailabilityToggle key={`availability-${currentCreator.id}`} creator={currentCreator} />
            <CreatorMediaForm key={`media-${currentCreator.id}`} creator={currentCreator} />
            <CreatorProfileForm key={currentCreator.id} creator={currentCreator} />
          </>
        ) : (
          <p className="text-sm text-zinc-500">Carregando seu perfil de criador...</p>
        ))}

      <button
        type="button"
        onClick={handleSignOut}
        disabled={isSigningOut}
        className="flex h-12 items-center justify-center gap-2 rounded-xl border border-line text-sm font-semibold text-zinc-300 transition hover:border-white/20 hover:text-zinc-100 disabled:opacity-50"
      >
        <LogOut size={16} />
        Sair da conta
      </button>
    </section>
  );
}
