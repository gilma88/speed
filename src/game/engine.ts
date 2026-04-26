import type { Card, Difficulty, GameState, PlayerState } from '../types';
import { createDeck, shuffle } from './deck';
import { canPlay, countCards, isStuck } from './rules';

function dealFromCards(cards: Card[], ownerId: string): PlayerState {
  const pool = shuffle(cards.map(c => ({ ...c, faceUp: false })));
  const tableau: Card[][] = [];
  let idx = 0;
  for (let i = 1; i <= 5; i++) {
    if (idx >= pool.length) break;
    const size = Math.min(i, pool.length - idx);
    const pile = pool.slice(idx, idx + size);
    pile[pile.length - 1].faceUp = true;
    pile.forEach((c, j) => { c.id = `${ownerId}-${c.suit}-${c.rank}-r${Date.now()}-${j}`; });
    tableau.push(pile);
    idx += i;
  }
  while (tableau.length < 5) tableau.push([]);
  return { tableau, spit: pool.slice(idx) };
}

function dealPlayer(ownerId: string): PlayerState {
  return dealFromCards(createDeck(ownerId), ownerId);
}

export function createInitialState(difficulty: Difficulty): GameState {
  return {
    player: dealPlayer('p'),
    computer: dealPlayer('c'),
    center: [[], []],
    phase: 'playing',
    winner: null,
    roundWinner: null,
    difficulty,
    message: 'Click "Spit!" to start!',
  };
}

export function spit(state: GameState): GameState {
  const s = deepClone(state);
  const playerCard = s.player.spit.pop();
  const computerCard = s.computer.spit.pop();
  if (playerCard) { playerCard.faceUp = true; s.center[0].push(playerCard); }
  if (computerCard) { computerCard.faceUp = true; s.center[1].push(computerCard); }
  s.phase = 'playing';
  s.roundWinner = null;
  s.message = '';
  return checkRoundEnd(s);
}

export function playCard(
  state: GameState,
  pileIndex: number,
  cardIndex: number,
  centerIndex: 0 | 1
): GameState {
  const s = deepClone(state);
  const pile = s.player.tableau[pileIndex];
  if (cardIndex !== pile.length - 1) return state;
  const card = pile[pile.length - 1];
  const centerTop = s.center[centerIndex][s.center[centerIndex].length - 1];
  if (!canPlay(card, centerTop)) return state;
  pile.pop();
  card.faceUp = true;
  s.center[centerIndex].push(card);
  if (pile.length > 0) pile[pile.length - 1].faceUp = true;
  return checkRoundEnd(s);
}

export function moveToEmptyPile(
  state: GameState,
  fromPile: number,
  toPile: number
): GameState {
  const s = deepClone(state);
  if (s.player.tableau[toPile].length !== 0) return state;
  const from = s.player.tableau[fromPile];
  if (from.length === 0) return state;
  const card = from.pop()!;
  card.faceUp = true;
  s.player.tableau[toPile] = [card];
  if (from.length > 0) from[from.length - 1].faceUp = true;
  return s;
}

// Stack the top card of fromPile onto toPile when both top cards share the same rank.
export function stackSameRank(
  state: GameState,
  fromPile: number,
  toPile: number
): GameState {
  const s = deepClone(state);
  const from = s.player.tableau[fromPile];
  const to = s.player.tableau[toPile];
  if (!from.length || !to.length) return state;
  const fromTop = from[from.length - 1];
  const toTop = to[to.length - 1];
  if (!fromTop.faceUp || !toTop.faceUp) return state;
  if (fromTop.rank !== toTop.rank) return state;
  from.pop();
  fromTop.faceUp = true;
  to.push(fromTop);
  if (from.length > 0) from[from.length - 1].faceUp = true;
  return s;
}

export function computerMove(state: GameState, difficulty: Difficulty): GameState {
  if (state.phase !== 'playing') return state;
  let s = deepClone(state);

  const threshold = difficulty === 'easy' ? 0.55 : difficulty === 'medium' ? 0.75 : 0.95;
  if (Math.random() > threshold) return s;

  // Try to play a card to a center pile
  for (let p = 0; p < 5; p++) {
    const pile = s.computer.tableau[p];
    if (!pile.length) continue;
    const top = pile[pile.length - 1];
    for (let c = 0; c < 2; c++) {
      const centerTop = s.center[c][s.center[c].length - 1];
      if (canPlay(top, centerTop)) {
        pile.pop();
        top.faceUp = true;
        s.center[c].push(top);
        if (pile.length > 0) pile[pile.length - 1].faceUp = true;
        return checkRoundEnd(s);
      }
    }
  }

  // Try to stack same-rank cards to reveal face-down cards
  for (let p = 0; p < 5; p++) {
    const fromPile = s.computer.tableau[p];
    if (!fromPile.length) continue;
    const fromTop = fromPile[fromPile.length - 1];
    if (!fromTop.faceUp) continue;
    for (let q = 0; q < 5; q++) {
      if (p === q) continue;
      const toPile = s.computer.tableau[q];
      if (!toPile.length) continue;
      const toTop = toPile[toPile.length - 1];
      if (toTop.faceUp && fromTop.rank === toTop.rank) {
        fromPile.pop();
        toPile.push(fromTop);
        if (fromPile.length > 0) fromPile[fromPile.length - 1].faceUp = true;
        return checkRoundEnd(s);
      }
    }
  }

  // Move a card to an empty pile to uncover a face-down card beneath it
  for (let p = 0; p < 5; p++) {
    const fromPile = s.computer.tableau[p];
    if (fromPile.length < 2) continue;
    const fromTop = fromPile[fromPile.length - 1];
    if (!fromTop.faceUp) continue;
    const cardBelow = fromPile[fromPile.length - 2];
    if (cardBelow.faceUp) continue; // nothing to uncover
    for (let q = 0; q < 5; q++) {
      if (p === q) continue;
      if (s.computer.tableau[q].length === 0) {
        fromPile.pop();
        fromTop.faceUp = true;
        s.computer.tableau[q] = [fromTop];
        fromPile[fromPile.length - 1].faceUp = true;
        return checkRoundEnd(s);
      }
    }
  }

  return s;
}

function checkRoundEnd(state: GameState): GameState {
  const s = { ...state };

  const playerTableauEmpty = s.player.tableau.every(p => p.length === 0);
  const computerTableauEmpty = s.computer.tableau.every(p => p.length === 0);

  if (playerTableauEmpty || computerTableauEmpty) {
    const playerWon = playerTableauEmpty;

    const smallerIdx = s.center[0].length <= s.center[1].length ? 0 : 1;
    const largerIdx = 1 - smallerIdx;

    const winnerPool = playerWon
      ? [...s.player.spit, ...s.center[smallerIdx]]
      : [...s.computer.spit, ...s.center[smallerIdx]];
    const loserPool = playerWon
      ? [...s.computer.spit, ...s.center[largerIdx]]
      : [...s.player.spit, ...s.center[largerIdx]];

    s.center = [[], []];

    if (winnerPool.length === 0) {
      s.phase = 'gameOver';
      s.winner = playerWon ? 'player' : 'computer';
      s.roundWinner = null;
      s.message = playerWon ? 'You win! 🎉' : 'Computer wins!';
      return s;
    }

    if (playerWon) {
      s.player = dealFromCards(winnerPool, 'p');
      s.computer = dealFromCards(loserPool, 'c');
      s.message = 'Round won! Click "Spit!" to continue.';
    } else {
      s.computer = dealFromCards(winnerPool, 'c');
      s.player = dealFromCards(loserPool, 'p');
      s.message = 'Round lost! Click "Spit!" to continue.';
    }
    s.phase = 'roundEnd';
    s.roundWinner = playerWon ? 'player' : 'computer';
    return s;
  }

  if (isStuck(s.player.tableau, s.computer.tableau, s.center)) {
    if (s.player.spit.length > 0 || s.computer.spit.length > 0) {
      s.phase = 'stuck';
      s.message = 'Stuck! Click "Spit!" to flip new cards.';
    } else {
      const pc = countCards(s.player);
      const cc = countCards(s.computer);
      s.phase = 'gameOver';
      s.winner = pc <= cc ? 'player' : 'computer';
      s.roundWinner = null;
      s.message = s.winner === 'player' ? 'You win! 🎉' : 'Computer wins!';
    }
  }
  return s;
}

function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}
