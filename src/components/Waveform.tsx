const BAR_COUNT = 20;

function getBarHeight(index: number, seed: number) {
  const center = (BAR_COUNT - 1) / 2;
  const envelope = 0.45 + 0.55 * Math.exp(-((index - center) ** 2) / (BAR_COUNT * 2.2));
  const wobble = Math.abs(Math.sin(index * 1.3 + seed) * Math.cos(index * 0.7 + seed * 0.5));
  return Math.round(18 + (0.35 + 0.65 * wobble) * envelope * 82);
}

interface WaveformProps {
  seed: number;
  barClassName: string;
  className?: string;
  isPlaying?: boolean;
}

export default function Waveform({ seed, barClassName, className = '', isPlaying = false }: WaveformProps) {
  return (
    <div aria-hidden="true" className={`flex items-center justify-center gap-[3px] ${className}`}>
      {Array.from({ length: BAR_COUNT }, (_, index) => (
        <span
          key={index}
          className={`w-[2px] origin-center rounded-full transition-opacity duration-300 motion-reduce:animate-none ${barClassName} ${
            isPlaying ? 'animate-breathe' : 'opacity-50'
          }`}
          style={{ height: `${getBarHeight(index, seed)}%`, animationDelay: `${index * 140}ms` }}
        />
      ))}
    </div>
  );
}
