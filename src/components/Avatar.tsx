interface AvatarProps {
  src: string | null;
  name: string;
  className?: string;
}

export default function Avatar({ src, name, className = 'h-12 w-12' }: AvatarProps) {
  if (src) {
    return <img src={src} alt={name} className={`shrink-0 rounded-full object-cover ${className}`} />;
  }
  const initial = name.trim().charAt(0).toUpperCase() || '?';
  return (
    <span
      aria-label={name}
      className={`flex shrink-0 items-center justify-center rounded-full bg-elevated text-base font-semibold text-zinc-100 ${className}`}
    >
      {initial}
    </span>
  );
}
