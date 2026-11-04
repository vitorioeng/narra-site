import { supabase } from '@/lib/supabase';
import { translateAuthError } from '@/lib/orders';
import type { BriefingType, Creator, CreatorMediaPatch, CreatorPatch, MarketMode, Order, OrderDraft, OrderStatus, Profile, ProfilePatch, UserRole, WalletEntry, WalletSnapshot, Withdrawal, WithdrawalStatus } from '@/types/narra';

const CREATOR_COLUMNS =
  'id, owner_id, mode, name, bio, price_per_minute, deadlines, styles, languages, rating, wave_seed, is_active, avatar_url, banner_url, demo_url';
const ORDER_COLUMNS =
  'id, client_id, client_name, client_avatar_url, creator_id, minutes, style, briefing_type, briefing, total, status, created_at';
const PROFILE_COLUMNS = 'id, name, role, avatar_url';
const WALLET_ENTRY_COLUMNS = 'id, description, amount, created_at';
const WITHDRAWAL_COLUMNS = 'id, owner_id, creator_name, amount, pix_key, status, created_at, decided_at';

interface CreatorRow {
  id: string;
  owner_id: string | null;
  mode: MarketMode;
  name: string;
  bio: string;
  price_per_minute: number | string;
  deadlines: string[];
  styles: string[];
  languages: string[];
  rating: number | string;
  wave_seed: number;
  is_active: boolean;
  avatar_url: string | null;
  banner_url: string | null;
  demo_url: string | null;
}

interface OrderRow {
  id: string;
  client_id: string;
  client_name: string;
  client_avatar_url: string | null;
  creator_id: string;
  minutes: number;
  style: string;
  briefing_type: BriefingType;
  briefing: string;
  total: number | string;
  status: OrderStatus;
  created_at: string;
}

interface ProfileRow {
  id: string;
  name: string;
  role: UserRole;
  avatar_url: string | null;
}

function mapCreator(row: CreatorRow): Creator {
  return {
    id: row.id,
    ownerId: row.owner_id,
    mode: row.mode,
    name: row.name,
    bio: row.bio,
    pricePerMinute: Number(row.price_per_minute),
    deadlines: row.deadlines,
    styles: row.styles,
    languages: row.languages,
    rating: Number(row.rating),
    waveSeed: row.wave_seed,
    isActive: row.is_active,
    avatarUrl: row.avatar_url,
    bannerUrl: row.banner_url,
    demoUrl: row.demo_url,
  };
}

function mapOrder(row: OrderRow): Order {
  return {
    id: row.id,
    clientId: row.client_id,
    clientName: row.client_name,
    clientAvatarUrl: row.client_avatar_url,
    creatorId: row.creator_id,
    minutes: row.minutes,
    style: row.style,
    briefingType: row.briefing_type,
    briefing: row.briefing,
    total: Number(row.total),
    status: row.status,
    createdAt: row.created_at,
  };
}

interface WalletEntryRow {
  id: string;
  description: string;
  amount: number | string;
  created_at: string;
}

interface WithdrawalRow {
  id: string;
  owner_id: string;
  creator_name: string;
  amount: number | string;
  pix_key: string;
  status: WithdrawalStatus;
  created_at: string;
  decided_at: string | null;
}

interface WalletSummaryRow {
  available: number | string;
  pending: number | string;
}

function mapWalletEntry(row: WalletEntryRow): WalletEntry {
  return { id: row.id, description: row.description, amount: Number(row.amount), createdAt: row.created_at };
}

function mapWithdrawal(row: WithdrawalRow): Withdrawal {
  return {
    id: row.id,
    ownerId: row.owner_id,
    creatorName: row.creator_name,
    amount: Number(row.amount),
    pixKey: row.pix_key,
    status: row.status,
    createdAt: row.created_at,
    decidedAt: row.decided_at,
  };
}

function mapProfile(row: ProfileRow): Profile {
  return { id: row.id, name: row.name, role: row.role, avatarUrl: row.avatar_url };
}

const DATA_ERROR_MESSAGE = 'Não foi possível concluir a operação. Tente novamente.';

function failOn(error: { message: string }): never {
  console.error(error.message);
  throw new Error(DATA_ERROR_MESSAGE);
}

function unwrap<T>(data: T | null, error: { message: string } | null): T {
  if (error) failOn(error);
  if (data === null) throw new Error(DATA_ERROR_MESSAGE);
  return data;
}

export async function signInWithEmail(email: string, password: string): Promise<void> {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(translateAuthError(error.message));
}

export async function signUpWithEmail(email: string, password: string): Promise<string> {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw new Error(translateAuthError(error.message));
  if (!data.user || !data.session) throw new Error('Não foi possível criar a conta agora. Tente novamente.');
  return data.user.id;
}

export async function signOutSession(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) failOn(error);
}

export async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase.from('profiles').select(PROFILE_COLUMNS).eq('id', userId).maybeSingle();
  if (error) failOn(error);
  return data ? mapProfile(data as ProfileRow) : null;
}

export async function createProfile(userId: string, name: string, role: UserRole): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .insert({ id: userId, name, role })
    .select(PROFILE_COLUMNS)
    .single();
  return mapProfile(unwrap(data as ProfileRow | null, error));
}

export async function updateProfileRole(userId: string, role: UserRole): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .update({ role })
    .eq('id', userId)
    .select(PROFILE_COLUMNS)
    .single();
  return mapProfile(unwrap(data as ProfileRow | null, error));
}

export async function updateProfile(userId: string, patch: ProfilePatch): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .update({ name: patch.name, avatar_url: patch.avatarUrl })
    .eq('id', userId)
    .select(PROFILE_COLUMNS)
    .single();
  return mapProfile(unwrap(data as ProfileRow | null, error));
}

export async function fetchCreators(): Promise<Creator[]> {
  const { data, error } = await supabase.from('creators').select(CREATOR_COLUMNS).order('name');
  if (error) failOn(error);
  return ((data ?? []) as unknown as CreatorRow[]).map(mapCreator);
}

export async function createOwnedCreator(ownerId: string, name: string): Promise<Creator> {
  const { data, error } = await supabase
    .from('creators')
    .insert({
      owner_id: ownerId,
      mode: 'audio',
      name: name.trim() || 'Criador',
      bio: '',
      price_per_minute: 40,
      deadlines: ['24h', '48h'],
      styles: ['ASMR'],
      languages: ['PT-BR'],
    })
    .select(CREATOR_COLUMNS)
    .single();
  return mapCreator(unwrap(data as unknown as CreatorRow | null, error));
}

export async function updateCreator(creatorId: string, patch: CreatorPatch): Promise<Creator> {
  const { data, error } = await supabase
    .from('creators')
    .update({
      price_per_minute: patch.pricePerMinute,
      deadlines: patch.deadlines,
      styles: patch.styles,
    })
    .eq('id', creatorId)
    .select(CREATOR_COLUMNS)
    .single();
  return mapCreator(unwrap(data as unknown as CreatorRow | null, error));
}

export async function updateCreatorAvailability(creatorId: string, isActive: boolean): Promise<Creator> {
  const { data, error } = await supabase
    .from('creators')
    .update({ is_active: isActive })
    .eq('id', creatorId)
    .select(CREATOR_COLUMNS)
    .single();
  return mapCreator(unwrap(data as unknown as CreatorRow | null, error));
}

export async function updateCreatorMedia(creatorId: string, patch: CreatorMediaPatch): Promise<Creator> {
  const { data, error } = await supabase
    .from('creators')
    .update({
      avatar_url: patch.avatarUrl,
      banner_url: patch.bannerUrl,
      demo_url: patch.demoUrl,
    })
    .eq('id', creatorId)
    .select(CREATOR_COLUMNS)
    .single();
  return mapCreator(unwrap(data as unknown as CreatorRow | null, error));
}

export async function fetchOrders(): Promise<Order[]> {
  const { data, error } = await supabase
    .from('orders')
    .select(ORDER_COLUMNS)
    .order('created_at', { ascending: false });
  if (error) failOn(error);
  return ((data ?? []) as unknown as OrderRow[]).map(mapOrder);
}

export async function insertOrder(creatorId: string, draft: OrderDraft): Promise<Order> {
  const { data, error } = await supabase
    .from('orders')
    .insert({
      creator_id: creatorId,
      minutes: draft.minutes,
      style: draft.style,
      briefing_type: draft.briefingType,
      briefing: draft.briefing,
    })
    .select(ORDER_COLUMNS)
    .single();
  return mapOrder(unwrap(data as unknown as OrderRow | null, error));
}

export async function transitionOrder(orderId: string, status: OrderStatus): Promise<Order> {
  const { data, error } = await supabase.rpc('transition_order', { p_order_id: orderId, p_status: status });
  return mapOrder(unwrap(data as unknown as OrderRow | null, error));
}

export async function fetchWallet(userId: string): Promise<WalletSnapshot> {
  const [summary, entries, withdrawals] = await Promise.all([
    supabase.rpc('get_wallet_summary'),
    supabase
      .from('wallet_entries')
      .select(WALLET_ENTRY_COLUMNS)
      .eq('owner_id', userId)
      .order('created_at', { ascending: false })
      .limit(50),
    supabase
      .from('withdrawals')
      .select(WITHDRAWAL_COLUMNS)
      .eq('owner_id', userId)
      .order('created_at', { ascending: false })
      .limit(50),
  ]);
  if (summary.error) failOn(summary.error);
  if (entries.error) failOn(entries.error);
  if (withdrawals.error) failOn(withdrawals.error);

  const summaryRow = ((summary.data ?? []) as WalletSummaryRow[])[0];
  if (!summaryRow) throw new Error(DATA_ERROR_MESSAGE);
  return {
    available: Number(summaryRow.available),
    pending: Number(summaryRow.pending),
    entries: ((entries.data ?? []) as WalletEntryRow[]).map(mapWalletEntry),
    withdrawals: ((withdrawals.data ?? []) as WithdrawalRow[]).map(mapWithdrawal),
  };
}

export async function requestWithdrawal(amount: number, pixKey: string): Promise<void> {
  const { error } = await supabase.rpc('request_withdrawal', { p_amount: amount, p_pix_key: pixKey });
  if (error) failOn(error);
}

export async function checkPlatformAdmin(): Promise<boolean> {
  const { data, error } = await supabase.rpc('is_platform_admin');
  if (error) failOn(error);
  return data === true;
}

export async function fetchPendingWithdrawals(): Promise<Withdrawal[]> {
  const { data, error } = await supabase
    .from('withdrawals')
    .select(WITHDRAWAL_COLUMNS)
    .eq('status', 'pendente')
    .order('created_at', { ascending: true });
  if (error) failOn(error);
  return ((data ?? []) as WithdrawalRow[]).map(mapWithdrawal);
}

export async function decideWithdrawal(withdrawalId: string, approve: boolean): Promise<void> {
  const { error } = await supabase.rpc('decide_withdrawal', { p_withdrawal_id: withdrawalId, p_approve: approve });
  if (error) failOn(error);
}
