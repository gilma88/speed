import { useSyncExternalStore } from 'react';
import { subscribe, getStore, getGame } from '../store/gameStore';

export function useSnapshot() {
  const store = useSyncExternalStore(subscribe, getStore);
  const game = useSyncExternalStore(subscribe, getGame);
  return { store, game };
}
