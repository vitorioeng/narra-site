import type { MarketMode } from '@/types/narra';

const TITLES: Record<MarketMode, string> = {
  audio: 'Seu assunto, na voz certa.',
  video: 'Vídeos personalizados, feitos do seu jeito.',
};

const SUBTITLES: Record<MarketMode, string> = {
  audio: 'Peça uma gravação de áudio feita sob medida por criadores com vozes únicas.',
  video: 'Peça um áudio ou vídeo exclusivo, do seu jeito.',
};

interface HeroIntroProps {
  mode: MarketMode;
}

export default function HeroIntro({ mode }: HeroIntroProps) {
  return (
    <section className="pb-6 pt-8 animate-fade-in">
      <h2 key={`title-${mode}`} className="text-3xl font-semibold leading-tight tracking-tight text-zinc-50 animate-fade-in">
        {TITLES[mode]}
      </h2>
      <p key={`subtitle-${mode}`} className="mt-3 text-sm leading-relaxed text-zinc-400 animate-fade-in">
        {SUBTITLES[mode]}
      </p>
    </section>
  );
}
