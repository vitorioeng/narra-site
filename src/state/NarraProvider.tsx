import { useCallback, useEffect, useMemo, useReducer } from 'react';
import type { ReactNode } from 'react';
import { NarraContext } from '@/state/narraContext';
import type { NarraContextValue } from '@/state/narraContext';
import { initialNarraState, narraReducer } from '@/state/narraReducer';
import {
  checkPlatformAdmin,
  createOwnedCreator,
  createOrderCheckout,
  createProfile,
  decideWithdrawal as decideWithdrawalApi,
  fetchCreators,
  fetchOrders,
  fetchProfile,
  fetchWallet,
  insertOrder,
  requestWithdrawal as requestWithdrawalApi,
  signInWithEmail,
  signOutSession,
  signUpWithEmail,
  transitionOrder,
  updateCreator,
  updateCreatorAvailability,
  updateCreatorMedia,
  updateProfile,
  updateProfileRole,
} from '@/lib/narraApi';
import { supabase } from '@/lib/supabase';
import type { CreatorMediaPatch, CreatorPatch, OrderDraft, OrderStatus, Profile, ProfilePatch, UserRole } from '@/types/narra';

const LOAD_ERROR_MESSAGE = 'Não foi possível carregar os dados. Tente novamente.';

interface NarraProviderProps {
  children: ReactNode;
}

export default function NarraProvider({ children }: NarraProviderProps) {
  const [state, dispatch] = useReducer(narraReducer, initialNarraState);

  const loadCreators = useCallback(async () => {
    try {
      dispatch({ type: 'SET_CREATORS', creators: await fetchCreators() });
      dispatch({ type: 'SET_LOAD_ERROR', message: null });
    } catch {
      dispatch({ type: 'SET_LOAD_ERROR', message: LOAD_ERROR_MESSAGE });
    }
  }, []);

  const refreshOrders = useCallback(async () => {
    try {
      dispatch({ type: 'SET_ORDERS', orders: await fetchOrders() });
      dispatch({ type: 'SET_LOAD_ERROR', message: null });
    } catch {
      dispatch({ type: 'SET_LOAD_ERROR', message: LOAD_ERROR_MESSAGE });
    }
  }, []);

  const refreshWallet = useCallback(async (userId: string) => {
    dispatch({ type: 'SET_WALLET', wallet: await fetchWallet(userId) });
  }, []);

  const hydrateAccount = useCallback(
    async (profile: Profile) => {
      dispatch({ type: 'SET_PROFILE', profile });
      dispatch({ type: 'SET_ADMIN', isAdmin: await checkPlatformAdmin() });
      if (profile.role === 'criador') await refreshWallet(profile.id);
      await refreshOrders();
    },
    [refreshOrders, refreshWallet]
  );

  const loadAccount = useCallback(
    async (userId: string) => {
      const profile = await fetchProfile(userId);
      if (!profile) return;
      await hydrateAccount(profile);
    },
    [hydrateAccount]
  );

  useEffect(() => {
    loadCreators();
  }, [loadCreators]);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      (async () => {
        if (session) {
          try {
            await loadAccount(session.user.id);
          } catch {
            dispatch({ type: 'SET_LOAD_ERROR', message: LOAD_ERROR_MESSAGE });
          }
        } else {
          dispatch({ type: 'CLEAR_ACCOUNT' });
        }
        dispatch({ type: 'AUTH_READY' });
      })();
    });
    return () => data.subscription.unsubscribe();
  }, [loadAccount]);

  const profileId = state.profile?.id ?? null;
  const isCreator = state.profile?.role === 'criador';

  useEffect(() => {
    if (!profileId) return;
    const handleFocus = () => {
      refreshOrders();
      if (isCreator) refreshWallet(profileId).catch(() => undefined);
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [profileId, isCreator, refreshOrders, refreshWallet]);

  const completeAccount = useCallback(
    async (userId: string, role: UserRole, name: string) => {
      const existing = await fetchProfile(userId);
      const profile = !existing
        ? await createProfile(userId, name, role)
        : existing.role === role
          ? existing
          : await updateProfileRole(userId, role);

      if (role === 'criador') {
        const creators = await fetchCreators();
        if (!creators.some((creator) => creator.ownerId === userId)) {
          await createOwnedCreator(userId, profile.name || name);
        }
      }

      await hydrateAccount(profile);
      await loadCreators();
    },
    [hydrateAccount, loadCreators]
  );

  const signIn = useCallback(
    async (email: string, password: string, role: UserRole) => {
      await signInWithEmail(email, password);
      const { data } = await supabase.auth.getUser();
      if (!data.user) throw new Error('Não foi possível entrar. Tente novamente.');
      await completeAccount(data.user.id, role, '');
    },
    [completeAccount]
  );

  const signUp = useCallback(
    async (name: string, email: string, password: string, role: UserRole) => {
      const userId = await signUpWithEmail(email, password);
      await completeAccount(userId, role, name.trim());
    },
    [completeAccount]
  );

  const signOut = useCallback(async () => {
    await signOutSession();
    dispatch({ type: 'CLEAR_ACCOUNT' });
  }, []);

  const placeOrder = useCallback(async (creatorId: string, draft: OrderDraft) => {
    const order = await insertOrder(creatorId, draft);
    dispatch({ type: 'UPSERT_ORDER', order });
    return order;
  }, []);

  const payOrder = useCallback(async (orderId: string) => {
    const checkoutUrl = await createOrderCheckout(orderId);
    window.location.assign(checkoutUrl);
  }, []);

  const setOrderStatus = useCallback(
    async (orderId: string, status: OrderStatus) => {
      const order = await transitionOrder(orderId, status);
      dispatch({ type: 'UPSERT_ORDER', order });
      if (isCreator && profileId) await refreshWallet(profileId);
    },
    [isCreator, profileId, refreshWallet]
  );

  const requestWithdrawal = useCallback(
    async (amount: number, pixKey: string) => {
      if (!profileId) throw new Error('Sessão expirada. Entre novamente.');
      await requestWithdrawalApi(amount, pixKey);
      await refreshWallet(profileId);
    },
    [profileId, refreshWallet]
  );

  const decideWithdrawal = useCallback(async (withdrawalId: string, approve: boolean) => {
    await decideWithdrawalApi(withdrawalId, approve);
  }, []);

  const saveCreator = useCallback(async (creatorId: string, patch: CreatorPatch) => {
    const creator = await updateCreator(creatorId, patch);
    dispatch({ type: 'UPSERT_CREATOR', creator });
  }, []);

  const saveCreatorAvailability = useCallback(async (creatorId: string, isActive: boolean) => {
    const creator = await updateCreatorAvailability(creatorId, isActive);
    dispatch({ type: 'UPSERT_CREATOR', creator });
  }, []);

  const saveCreatorMedia = useCallback(async (creatorId: string, patch: CreatorMediaPatch) => {
    const creator = await updateCreatorMedia(creatorId, patch);
    dispatch({ type: 'UPSERT_CREATOR', creator });
  }, []);

  const saveProfile = useCallback(async (userId: string, patch: ProfilePatch) => {
    const profile = await updateProfile(userId, patch);
    dispatch({ type: 'SET_PROFILE', profile });
  }, []);

  const value = useMemo<NarraContextValue>(() => {
    const currentCreator = state.profile
      ? state.creators.find((creator) => creator.ownerId === state.profile?.id) ?? null
      : null;
    return {
      ...state,
      currentCreator,
      signIn,
      signUp,
      signOut,
      placeOrder,
      payOrder,
      setOrderStatus,
      requestWithdrawal,
      decideWithdrawal,
      saveCreator,
      saveCreatorAvailability,
      saveCreatorMedia,
      saveProfile,
      refreshOrders,
    };
  }, [
    state,
    signIn,
    signUp,
    signOut,
    placeOrder,
    payOrder,
    setOrderStatus,
    requestWithdrawal,
    decideWithdrawal,
    saveCreator,
    saveCreatorAvailability,
    saveCreatorMedia,
    saveProfile,
    refreshOrders,
  ]);

  return <NarraContext.Provider value={value}>{children}</NarraContext.Provider>;
}
