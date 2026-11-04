import { useContext } from 'react';
import { NarraContext } from '@/state/narraContext';
import type { NarraContextValue } from '@/state/narraContext';

export function useNarra(): NarraContextValue {
  const context = useContext(NarraContext);
  if (!context) {
    throw new Error('useNarra must be used inside NarraProvider');
  }
  return context;
}
