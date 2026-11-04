import type { Creator, Order, Profile, WalletSnapshot } from '@/types/narra';

export interface NarraState {
  authReady: boolean;
  profile: Profile | null;
  creators: Creator[];
  orders: Order[];
  wallet: WalletSnapshot | null;
  isAdmin: boolean;
  loadError: string | null;
}

export type NarraAction =
  | { type: 'AUTH_READY' }
  | { type: 'SET_PROFILE'; profile: Profile }
  | { type: 'CLEAR_ACCOUNT' }
  | { type: 'SET_CREATORS'; creators: Creator[] }
  | { type: 'SET_ORDERS'; orders: Order[] }
  | { type: 'UPSERT_ORDER'; order: Order }
  | { type: 'UPSERT_CREATOR'; creator: Creator }
  | { type: 'SET_WALLET'; wallet: WalletSnapshot }
  | { type: 'SET_ADMIN'; isAdmin: boolean }
  | { type: 'SET_LOAD_ERROR'; message: string | null };

export const initialNarraState: NarraState = {
  authReady: false,
  profile: null,
  creators: [],
  orders: [],
  wallet: null,
  isAdmin: false,
  loadError: null,
};

export function narraReducer(state: NarraState, action: NarraAction): NarraState {
  switch (action.type) {
    case 'AUTH_READY':
      return { ...state, authReady: true };
    case 'SET_PROFILE':
      return { ...state, profile: action.profile };
    case 'CLEAR_ACCOUNT':
      return { ...state, profile: null, orders: [], wallet: null, isAdmin: false };
    case 'SET_CREATORS':
      return { ...state, creators: action.creators };
    case 'SET_ORDERS':
      return { ...state, orders: action.orders };
    case 'UPSERT_ORDER': {
      const exists = state.orders.some((order) => order.id === action.order.id);
      const orders = exists
        ? state.orders.map((order) => (order.id === action.order.id ? action.order : order))
        : [action.order, ...state.orders];
      return { ...state, orders };
    }
    case 'UPSERT_CREATOR': {
      const exists = state.creators.some((creator) => creator.id === action.creator.id);
      const creators = exists
        ? state.creators.map((creator) => (creator.id === action.creator.id ? action.creator : creator))
        : [...state.creators, action.creator];
      return { ...state, creators };
    }
    case 'SET_WALLET':
      return { ...state, wallet: action.wallet };
    case 'SET_ADMIN':
      return { ...state, isAdmin: action.isAdmin };
    case 'SET_LOAD_ERROR':
      return { ...state, loadError: action.message };
  }
}
