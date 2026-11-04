import type { OrderStatus } from '@/types/narra';

export const MIN_MINUTES = 1;
export const MAX_MINUTES = 15;

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  pendente: 'Pendente',
  em_gravacao: 'Em gravação',
  entregue: 'Entregue',
  concluido: 'Concluído',
  recusado: 'Recusado',
};

export function calculateOrderTotal(minutes: number, pricePerMinute: number): number {
  return minutes * pricePerMinute;
}

export function translateAuthError(message: string): string {
  const normalized = message.toLowerCase();
  if (normalized.includes('invalid login credentials')) return 'E-mail ou senha incorretos.';
  if (normalized.includes('already registered')) return 'Já existe uma conta com este e-mail.';
  if (normalized.includes('password should be at least')) return 'A senha precisa ter pelo menos 6 caracteres.';
  if (normalized.includes('valid email')) return 'Informe um e-mail válido.';
  return 'Não foi possível concluir. Tente novamente.';
}
