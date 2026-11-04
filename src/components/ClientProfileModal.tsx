import { useRef, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { Camera } from 'lucide-react';
import Avatar from '@/components/Avatar';
import ModalShell from '@/components/ModalShell';
import { IMAGE_ACCEPT, uploadMedia } from '@/lib/mediaUpload';
import { useNarra } from '@/state/useNarra';

const SAVE_ERROR_MESSAGE = 'Não foi possível salvar o perfil. Tente novamente.';
const PHOTO_ERROR_MESSAGE = 'Não foi possível enviar a foto. Tente novamente.';

interface ClientProfileModalProps {
  onClose: () => void;
}

export default function ClientProfileModal({ onClose }: ClientProfileModalProps) {
  const { profile, saveProfile } = useNarra();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(profile?.name ?? '');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatarUrl ?? null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!profile) return null;

  const trimmedName = name.trim();
  const isBusy = isUploading || isSaving;

  const handlePhotoChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setIsUploading(true);
    setErrorMessage(null);
    try {
      setAvatarUrl(await uploadMedia('avatar', profile.id, file));
    } catch {
      setErrorMessage(PHOTO_ERROR_MESSAGE);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!trimmedName || isBusy) return;

    setIsSaving(true);
    setErrorMessage(null);
    try {
      await saveProfile(profile.id, { name: trimmedName, avatarUrl });
      onClose();
    } catch {
      setErrorMessage(SAVE_ERROR_MESSAGE);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ModalShell title="Editar perfil" onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div className="flex flex-col items-center gap-3">
          <Avatar src={avatarUrl} name={trimmedName || profile.name} className="h-24 w-24 text-2xl" />
          <button
            type="button"
            disabled={isBusy}
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex h-9 items-center gap-2 rounded-xl border border-line bg-elevated px-4 text-xs font-semibold text-zinc-200 transition hover:border-white/20 hover:text-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Camera size={14} />
            {isUploading ? 'Enviando foto...' : 'Trocar foto'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept={IMAGE_ACCEPT}
            aria-label="Foto de perfil"
            className="hidden"
            onChange={handlePhotoChange}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="client-profile-name" className="text-sm font-medium text-zinc-200">
            Nome
          </label>
          <input
            id="client-profile-name"
            type="text"
            value={name}
            maxLength={80}
            onChange={(event) => setName(event.target.value)}
            placeholder="Como você quer ser chamado"
            className="h-12 w-full rounded-xl border border-line bg-elevated px-4 text-sm text-zinc-100 placeholder:text-zinc-500 outline-none transition focus:border-primary-500/50 focus:ring-2 focus:ring-primary-500/20"
          />
        </div>

        <div className="flex flex-col gap-3">
          <button
            type="submit"
            disabled={!trimmedName || isBusy}
            className="flex h-12 items-center justify-center rounded-xl bg-primary-500 text-sm font-semibold text-zinc-950 transition hover:bg-primary-400 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-zinc-800 disabled:text-zinc-500"
          >
            {isSaving ? 'Salvando...' : 'Salvar'}
          </button>
          {errorMessage && (
            <p role="alert" className="text-center text-xs text-error-400">
              {errorMessage}
            </p>
          )}
        </div>
      </form>
    </ModalShell>
  );
}
