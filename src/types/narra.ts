export type MarketMode = 'audio' | 'video';

export type UserRole = 'cliente' | 'criador';

export type OrderStatus = 'pendente' | 'em_gravacao' | 'entregue' | 'concluido' | 'recusado';

export type WithdrawalStatus = 'pendente' | 'aprovado' | 'recusado';

export type BriefingType = 'texto' | 'roteiro';

export type PaymentStatus = 'aguardando_pagamento' | 'pago';

export interface Creator {
  id: string;
  ownerId: string | null;
  mode: MarketMode;
  name: string;
  bio: string;
  pricePerMinute: number;
  deadlines: string[];
  styles: string[];
  languages: string[];
  rating: number;
  waveSeed: number;
  isActive: boolean;
  avatarUrl: string | null;
  bannerUrl: string | null;
  demoUrl: string | null;
}

export interface CreatorPatch {
  pricePerMinute: number;
  deadlines: string[];
  styles: string[];
}

export interface CreatorMediaPatch {
  avatarUrl?: string;
  bannerUrl?: string;
  demoUrl?: string;
}

export interface Profile {
  id: string;
  name: string;
  role: UserRole;
  avatarUrl: string | null;
}

export interface ProfilePatch {
  name: string;
  avatarUrl: string | null;
}

export interface WalletEntry {
  id: string;
  description: string;
  amount: number;
  createdAt: string;
}

export interface Withdrawal {
  id: string;
  ownerId: string;
  creatorName: string;
  amount: number;
  pixKey: string;
  status: WithdrawalStatus;
  createdAt: string;
  decidedAt: string | null;
}

export interface WalletSnapshot {
  available: number;
  pending: number;
  entries: WalletEntry[];
  withdrawals: Withdrawal[];
}

export interface OrderDraft {
  minutes: number;
  style: string;
  briefingType: BriefingType;
  briefing: string;
}

export interface Order extends OrderDraft {
  id: string;
  clientId: string;
  clientName: string;
  clientAvatarUrl: string | null;
  creatorId: string;
  total: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  createdAt: string;
}
