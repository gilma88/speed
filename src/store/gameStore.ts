import type { CardBack, Difficulty, GameState, StoreState } from '../types';
import { createInitialState, spit as doSpit, playCard as doPlayCard, computerMove, moveToEmptyPile, stackSameRank } from '../game/engine';

const STORAGE_KEY = 'speed_store';

const DEFAULT_CARD_BACKS: CardBack[] = [
  { id: 'classic',  name: 'Classic Blue',   price: 0,    color: '#1a3a6e', pattern: 'crosshatch', owned: true },
  { id: 'royal',    name: 'Royal Red',       price: 200,  color: '#8b0000', pattern: 'diamond',    owned: false },
  { id: 'midnight', name: 'Midnight',        price: 350,  color: '#0d0d2b', pattern: 'stars',      owned: false },
  { id: 'forest',   name: 'Forest',          price: 500,  color: '#1a4a1a', pattern: 'leaves',     owned: false },
  { id: 'gold',     name: 'Gold Rush',       price: 700,  color: '#b8860b', pattern: 'waves',      owned: false },
  { id: 'neon',     name: 'Neon',            price: 900,  color: '#ff00ff', pattern: 'grid',       owned: false },
  { id: 'volcano',  name: 'Volcano',         price: 1200, color: '#7f1d1d', pattern: 'volcano',    owned: false },
  { id: 'ocean',    name: 'Deep Ocean',      price: 1500, color: '#0c2a4a', pattern: 'ocean',      owned: false },
  { id: 'galaxy',   name: 'Galaxy',          price: 2000, color: '#1a0033', pattern: 'galaxy',     owned: false },
  { id: 'toxic',    name: 'Toxic',           price: 2500, color: '#0d2b0d', pattern: 'toxic',      owned: false },
  { id: 'ice',      name: 'Ice Crystal',     price: 3000, color: '#0a2a3a', pattern: 'ice',        owned: false },
  { id: 'inferno',  name: 'Inferno',         price: 4000, color: '#3d0a00', pattern: 'inferno',    owned: false },
];

function loadStore(): StoreState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const saved = JSON.parse(raw) as StoreState;
      const merged = DEFAULT_CARD_BACKS.map(def => {
        const found = saved.cardBacks.find(b => b.id === def.id);
        return found ? { ...def, owned: found.owned } : def;
      });
      return { ...saved, cardBacks: merged, playerName: saved.playerName ?? 'Player' };
    }
  } catch { /* ignore */ }
  return {
    coins: 200,
    cardBacks: DEFAULT_CARD_BACKS,
    activeCardBack: 'classic',
    lastLoginDate: null,
    playerName: 'Player',
  };
}

function saveStore(s: StoreState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
}

type Listener = () => void;
const listeners = new Set<Listener>();

let store = loadStore();
let game: GameState | null = null;

function notify() { listeners.forEach(l => l()); }

export function subscribe(fn: Listener) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function getStore() { return store; }
export function getGame() { return game; }

export function claimDailyLogin() {
  const today = new Date().toISOString().slice(0, 10);
  if (store.lastLoginDate === today) return false;
  store = { ...store, coins: store.coins + 150, lastLoginDate: today };
  saveStore(store);
  notify();
  return true;
}

export function startGame(difficulty: Difficulty) {
  game = createInitialState(difficulty);
  notify();
}

export function spitAction() {
  if (!game) return;
  game = doSpit(game);
  notify();
  scheduleComputerMove();
}

function awardCoinsIfNeeded(prev: GameState | null, next: GameState) {
  if (!prev) return;
  // Award 50 coins whenever the player wins a round (roundEnd) or the whole game
  const justWonRound =
    prev.phase !== 'roundEnd' &&
    next.phase === 'roundEnd' &&
    next.roundWinner === 'player';
  const justWonGame =
    next.phase === 'gameOver' &&
    next.winner === 'player' &&
    prev.phase !== 'gameOver';

  if (justWonRound || justWonGame) {
    store = { ...store, coins: store.coins + 50 };
    saveStore(store);
  }
}

export function playCardAction(pileIndex: number, cardIndex: number, centerIndex: 0 | 1) {
  if (!game) return;
  const prev = game;
  game = doPlayCard(game, pileIndex, cardIndex, centerIndex);
  awardCoinsIfNeeded(prev, game);
  notify();
  scheduleComputerMove();
}

export function moveToEmptyAction(fromPile: number, toPile: number) {
  if (!game) return;
  game = moveToEmptyPile(game, fromPile, toPile);
  notify();
}

export function stackSameRankAction(fromPile: number, toPile: number) {
  if (!game) return;
  game = stackSameRank(game, fromPile, toPile);
  notify();
}

export function returnToMenu() {
  game = null;
  notify();
}

export function buyCardBack(id: string) {
  const back = store.cardBacks.find(b => b.id === id);
  if (!back || back.owned || store.coins < back.price) return false;
  store = {
    ...store,
    coins: store.coins - back.price,
    cardBacks: store.cardBacks.map(b => b.id === id ? { ...b, owned: true } : b),
    activeCardBack: id,
  };
  saveStore(store);
  notify();
  return true;
}

export function setPlayerName(name: string) {
  const trimmed = name.trim().slice(0, 20);
  if (!trimmed) return;
  store = { ...store, playerName: trimmed };
  saveStore(store);
  notify();
}

export function selectCardBack(id: string) {
  const back = store.cardBacks.find(b => b.id === id);
  if (!back?.owned) return;
  store = { ...store, activeCardBack: id };
  saveStore(store);
  notify();
}

let aiTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleComputerMove() {
  if (aiTimer) clearTimeout(aiTimer);
  if (!game || game.phase !== 'playing') return;
  // Easy: ~1400ms (normal human pace), Medium: ~650ms (faster), Hard: ~200ms (very fast)
  const base = game.difficulty === 'easy' ? 1400 : game.difficulty === 'medium' ? 650 : 200;
  const jitter = game.difficulty === 'easy' ? 300 : game.difficulty === 'medium' ? 200 : 100;
  aiTimer = setTimeout(() => {
    if (!game || game.phase !== 'playing') return;
    const prev = game;
    game = computerMove(game, game.difficulty);
    awardCoinsIfNeeded(prev, game);
    notify();
    scheduleComputerMove();
  }, base + Math.random() * jitter);
}
