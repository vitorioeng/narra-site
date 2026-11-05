import { createContext } from 'react';
import type { NarraState } from '@/state/narraReducer';
import type { Creator, CreatorMediaPatch, CreatorPatch, Order, OrderDraft, OrderStatus, ProfilePatch, UserRole } from '@/types/narra';

export interface NarraContextValue extends NarraState {
  currentCreator: Creator | null;
  signIn: (email: string, password: string, role: UserRole) => Promise<void>;
  signUp: (name: string, email: string, password: string, role: UserRole) => Promise<void>;
  signOut: () => Promise<void>;
  placeOrder: (creatorId: string, draft: OrderDraft) => Promise<Order>;
  setOrderStatus: (orderId: string, status: OrderStatus) => Promise<void>;
  requestWithdrawal: (amount: number, pixKey: string) => Promise<void>;
  decideWithdrawal: (withdrawalId: string, approve: boolean) => Promise<void>;
  saveCreator: (creatorId: string, patch: CreatorPatch) => Promise<void>;
  saveCreatorAvailability: (creatorId: string, isActive: boolean) => Promise<void>;
  saveCreatorMedia: (creatorId: string, patch: CreatorMediaPatch) => Promise<void>;
  saveProfile: (userId: string, patch: ProfilePatch) => Promise<void>;
  refreshOrders: () => Promise<void>;
}

export const NarraContext = createContext<NarraContextValue | null>(null);
