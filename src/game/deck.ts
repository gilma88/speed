import type { Card, Rank, Suit } from '../types';

const SUITS: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
const RANKS: Rank[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];

export function createDeck(ownerId: string): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ suit, rank, faceUp: false, id: `${ownerId}-${suit}-${rank}` });
    }
  }
  return deck;
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function rankName(rank: Rank): string {
  const names: Record<number, string> = { 1: 'A', 11: 'J', 12: 'Q', 13: 'K' };
  return names[rank] ?? String(rank);
}

export function suitSymbol(suit: Suit): string {
  return { hearts: '♥', diamonds: '♦', clubs: '♣', spades: '♠' }[suit];
}

export function isRed(suit: Suit): boolean {
  return suit === 'hearts' || suit === 'diamonds';
}
