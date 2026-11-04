import { useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { AudioWaveform, Camera, Upload } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { IMAGE_ACCEPT, uploadMedia } from '@/lib/mediaUpload';
import type { MediaKind } from '@/lib/mediaUpload';
import { useNarra } from '@/state/useNarra';
import type { Creator, CreatorMediaPatch } from '@/types/narra';

const UPLOAD_ERROR_MESSAGE = 'Não foi possível enviar. Tente novamente.';

const MEDIA_OPTIONS: { kind: MediaKind; label: string; accept: string; icon: LucideIcon; success: string }[] = [
  { kind: 'avatar', label: 'Alterar Foto de Perfil', accept: IMAGE_ACCEPT, icon: Camera, success: 'Foto de perfil atualizada.' },
  { kind: 'banner', label: 'Alterar Banner', accept: IMAGE_ACCEPT, icon: Upload, success: 'Banner atualizado.' },
  { kind: 'demo', label: 'Enviar Demonstração', accept: 'audio/*,video/*', icon: AudioWaveform, success: 'Demonstração enviada.' },
];

function toPatch(kind: MediaKind, url: string): CreatorMediaPatch {
  if (kind === 'avatar') return { avatarUrl: url };
  if (kind === 'banner') return { bannerUrl: url };
  return { demoUrl: url };
}

interface CreatorMediaFormProps {
  creator: Creator;
}

interface Feedback {
  tone: 'success' | 'error';
  text: string;
}

export default function CreatorMediaForm({ creator }: CreatorMediaFormProps) {
  const { saveCreatorMedia } = useNarra();
  const [busyKind, setBusyKind] = useState<MediaKind | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const inputRefs = useRef<Partial<Record<MediaKind, HTMLInputElement | null>>>({});

  const handleFileChange = async (kind: MediaKind, successText: string, event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !creator.ownerId) return;

    setBusyKind(kind);
    setFeedback(null);
    try {
      const url = await uploadMedia(kind, creator.ownerId, file);
      await saveCreatorMedia(creator.id, toPatch(kind, url));
      setFeedback({ tone: 'success', text: successText });
    } catch {
      setFeedback({ tone: 'error', text: UPLOAD_ERROR_MESSAGE });
    } finally {
      setBusyKind(null);
    }
  };

  return (
    <section className="flex flex-col gap-5 rounded-3xl border border-line bg-surface p-5">
      <div>
        <h3 className="text-base font-semibold tracking-tight text-zinc-50">Mídia do seu perfil</h3>
        <p className="mt-1 text-xs text-zinc-500">Foto, capa e demonstração que aparecem no seu cartão do feed.</p>
      </div>

      <div className="flex flex-col gap-3">
        {MEDIA_OPTIONS.map(({ kind, label, accept, icon: Icon, success }) => {
          const isBusy = busyKind === kind;
          return (
            <div key={kind}>
              <button
                type="button"
                disabled={busyKind !== null}
                onClick={() => inputRefs.current[kind]?.click()}
                className="flex h-12 w-full items-center gap-3 rounded-xl border border-line bg-elevated px-4 text-left text-sm font-medium text-zinc-100 transition hover:border-white/20 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/5 text-zinc-300">
                  <Icon size={16} />
                </span>
                {isBusy ? 'Enviando...' : label}
              </button>
              <input
                ref={(node) => {
                  inputRefs.current[kind] = node;
                }}
                type="file"
                accept={accept}
                aria-label={label}
                className="hidden"
                onChange={(event) => handleFileChange(kind, success, event)}
              />
            </div>
          );
        })}
      </div>

      {feedback && (
        <p
          role={feedback.tone === 'error' ? 'alert' : 'status'}
          className={`rounded-xl border px-4 py-3 text-sm ${
            feedback.tone === 'error'
              ? 'border-error-500/30 bg-error-500/10 text-error-400'
              : 'border-primary-500/30 bg-primary-500/10 text-primary-300'
          }`}
        >
          {feedback.text}
        </p>
      )}
    </section>
  );
}
