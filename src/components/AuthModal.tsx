import { useState } from 'react';
import type { FormEvent } from 'react';
import ModalShell from '@/components/ModalShell';
import { useNarra } from '@/state/useNarra';
import type { UserRole } from '@/types/narra';

type AuthMode = 'entrar' | 'criar';

const MIN_PASSWORD_LENGTH = 6;
const GENERIC_ERROR = 'Não foi possível concluir. Tente novamente.';

const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: 'cliente', label: 'Sou Cliente' },
  { value: 'criador', label: 'Sou Criador' },
];

const inputClass =
  'h-11 w-full rounded-lg border border-[#2A2A2A] bg-[#141414] px-3.5 text-sm text-zinc-100 placeholder:text-zinc-500 outline-none transition focus:border-primary-500/50 focus:ring-2 focus:ring-primary-500/20';

interface AuthModalProps {
  onClose: () => void;
}

export default function AuthModal({ onClose }: AuthModalProps) {
  const { signIn, signUp } = useNarra();
  const [authMode, setAuthMode] = useState<AuthMode>('entrar');
  const [role, setRole] = useState<UserRole>('cliente');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isSignUp = authMode === 'criar';

  const switchMode = (next: AuthMode) => {
    setAuthMode(next);
    setErrorMessage(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;
    if (isSignUp && !name.trim()) {
      setErrorMessage('Informe seu nome.');
      return;
    }
    if (!email.trim() || password.length < MIN_PASSWORD_LENGTH) {
      setErrorMessage(`Informe um e-mail e uma senha com pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`);
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      if (isSignUp) await signUp(name, email.trim(), password, role);
      else await signIn(email.trim(), password, role);
      onClose();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : GENERIC_ERROR);
      setIsSubmitting(false);
    }
  };

  return (
    <ModalShell
      title={isSignUp ? 'Criar conta' : 'Entrar na Narra'}
      subtitle="Escolha como você vai usar a Narra."
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-6" noValidate>
        <div role="tablist" aria-label="Tipo de acesso" className="grid grid-cols-2 gap-1 rounded-xl border border-line bg-background p-1">
          {(
            [
              { value: 'entrar', label: 'Entrar' },
              { value: 'criar', label: 'Criar conta' },
            ] as const
          ).map((option) => (
            <button
              key={option.value}
              type="button"
              role="tab"
              aria-selected={authMode === option.value}
              onClick={() => switchMode(option.value)}
              className={`h-9 rounded-lg text-sm font-medium transition ${
                authMode === option.value ? 'bg-elevated text-zinc-50' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div role="group" aria-label="Tipo de usuário" className="grid grid-cols-2 gap-1 rounded-full bg-[#1A1A1A] p-1">
          {ROLE_OPTIONS.map(({ value, label }) => {
            const selected = role === value;
            return (
              <button
                key={value}
                type="button"
                aria-pressed={selected}
                onClick={() => setRole(value)}
                className={`h-9 rounded-full text-sm font-medium transition ${
                  selected ? 'bg-[#333333] text-white shadow-sm' : 'bg-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        {isSignUp && (
          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium text-zinc-200">Nome</span>
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              autoComplete="name"
              placeholder="Como você quer ser chamado"
              className={inputClass}
            />
          </label>
        )}

        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-zinc-200">E-mail</span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            placeholder="voce@exemplo.com"
            className={inputClass}
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-zinc-200">Senha</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete={isSignUp ? 'new-password' : 'current-password'}
            placeholder={`Mínimo de ${MIN_PASSWORD_LENGTH} caracteres`}
            className={inputClass}
          />
        </label>

        {errorMessage && (
          <p role="alert" className="rounded-xl border border-error-500/30 bg-error-500/10 px-4 py-3 text-sm text-error-400">
            {errorMessage}
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="flex h-11 items-center justify-center rounded-lg bg-primary-500 text-center text-sm font-semibold text-zinc-950 transition hover:bg-primary-400 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? 'Aguarde...' : isSignUp ? 'Criar conta' : 'Entrar'}
        </button>
      </form>
    </ModalShell>
  );
}
