import { useEffect, useRef, useState } from 'react';
import { Pause, Play, Star } from 'lucide-react';
import type { Creator } from '@/types/narra';
import Waveform from '@/components/Waveform';
import { getCreatorAvatarUrl, getCreatorBannerUrl } from '@/lib/creatorImages';

interface CreatorCardProps {
  creator: Creator;
  onOrder?: (creator: Creator) => void;
}

export default function CreatorCard({ creator, onOrder }: CreatorCardProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackFailed, setPlaybackFailed] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { demoUrl } = creator;
  const avatarUrl = getCreatorAvatarUrl(creator);
  const bannerUrl = getCreatorBannerUrl(creator);

  useEffect(() => {
    setIsPlaying(false);
    setPlaybackFailed(false);
    if (!demoUrl) {
      audioRef.current = null;
      return;
    }
    const audio = new Audio(demoUrl);
    audio.preload = 'metadata';
    audio.onended = () => setIsPlaying(false);
    audioRef.current = audio;
    return () => {
      audio.pause();
      audioRef.current = null;
    };
  }, [demoUrl]);

  const togglePlayback = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
      return;
    }
    setPlaybackFailed(false);
    audio
      .play()
      .then(() => setIsPlaying(true))
      .catch(() => {
        setIsPlaying(false);
        setPlaybackFailed(true);
      });
  };

  return (
    <article className="group overflow-hidden rounded-2xl border border-line bg-surface transition duration-300 hover:border-white/15 animate-fade-in">
      <div className="relative h-[120px] overflow-hidden bg-gradient-to-br from-elevated to-background">
        {bannerUrl && (
          <img src={bannerUrl} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/40 to-transparent" />
      </div>

      <div className="px-4 pb-4">
        <div className="-mt-8 flex items-end gap-3">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={creator.name}
              loading="lazy"
              className="relative z-10 box-border h-16 w-16 shrink-0 rounded-full border-[3px] border-surface object-cover"
            />
          ) : (
            <span
              aria-hidden="true"
              className="relative z-10 box-border flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-[3px] border-surface bg-elevated text-lg font-semibold text-zinc-200"
            >
              {creator.name.charAt(0)}
            </span>
          )}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1">
          <h3 className="min-w-0 truncate text-base font-semibold tracking-tight text-zinc-50">{creator.name}</h3>
          <span className="flex shrink-0 items-center gap-1 text-xs font-medium text-zinc-300">
            <Star size={12} className="fill-accent-400 text-accent-400" />
            {creator.rating.toFixed(1)}
          </span>
        </div>

        <p className="mt-1 min-h-[3.75rem] line-clamp-3 text-sm leading-normal text-zinc-300">{creator.bio}</p>

        <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-line bg-background/60 px-3 py-2">
          <button
            type="button"
            onClick={togglePlayback}
            disabled={!demoUrl}
            aria-pressed={isPlaying}
            aria-label={
              demoUrl
                ? `${isPlaying ? 'Pausar' : 'Ouvir'} demonstração de ${creator.name}`
                : `${creator.name} ainda não enviou demonstração`
            }
            className="flex min-w-0 items-center gap-2 text-xs font-medium text-zinc-200 transition hover:text-white disabled:cursor-not-allowed disabled:text-zinc-500 disabled:hover:text-zinc-500"
          >
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition ${
                demoUrl ? 'bg-primary-500/15 text-primary-300 group-hover:bg-primary-500/25' : 'bg-white/5 text-zinc-500'
              }`}
            >
              {isPlaying ? <Pause size={13} className="fill-current" /> : <Play size={13} className="translate-x-px fill-current" />}
            </span>
            {demoUrl ? 'Ouvir demonstração' : 'Sem demonstração ainda'}
          </button>
          <Waveform
            seed={creator.waveSeed}
            isPlaying={isPlaying}
            barClassName="bg-primary-400"
            className="h-5 w-16 shrink-0"
          />
        </div>
        {playbackFailed && (
          <p role="alert" className="mt-2 text-xs text-error-400">
            Não foi possível tocar a demonstração agora.
          </p>
        )}

        <div className="mt-4 flex items-center justify-between gap-3">
          <p className="text-xs text-zinc-400">Preço personalizado</p>
          {onOrder && (
            <button
              type="button"
              onClick={() => onOrder(creator)}
              className="h-9 rounded-xl bg-primary-500 px-4 text-sm font-semibold text-zinc-950 transition hover:bg-primary-400 active:scale-[0.98]"
            >
              Fazer pedido
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
