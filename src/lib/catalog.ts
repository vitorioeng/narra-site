import type { MarketMode } from '@/types/narra';

export const DEADLINE_OPTIONS = ['24h', '48h', '72h', '5 dias', '7 dias'];

export const STYLE_OPTIONS: Record<MarketMode, string[]> = {
  audio: ['ASMR', 'VOZ'],
  video: ['Depoimento', 'Mensagem', 'Institucional'],
};
