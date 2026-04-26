export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
export type Rank = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13;

export interface Card {
  suit: Suit;
  rank: Rank;
  faceUp: boolean;
  id: string;
}

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface CardBack {
  id: string;
  name: string;
  price: number;
  color: string;
  pattern: string;
  owned: boolean;
}

export interface PlayerState {
  tableau: Card[][];   // 5 piles
  spit: Card[];        // side spit pile
}

export interface GameState {
  player: PlayerState;
  computer: PlayerState;
  center: [Card[], Card[]]; // two center piles
  phase: 'menu' | 'playing' | 'stuck' | 'roundEnd' | 'gameOver';
  winner: 'player' | 'computer' | null;
  roundWinner: 'player' | 'computer' | null; // set on roundEnd, null otherwise
  difficulty: Difficulty;
  message: string;
}

export interface StoreState {
  coins: number;
  cardBacks: CardBack[];
  activeCardBack: string;
  lastLoginDate: string | null;
}
