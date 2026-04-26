import type { Card, Rank } from '../types';

export function canPlay(card: Card, topOfPile: Card | undefined): boolean {
  if (!topOfPile) return true;
  const diff = Math.abs(card.rank - topOfPile.rank);
  // Wrap-around: Ace(1) and King(13) are adjacent
  return diff === 1 || diff === 12;
}

export function adjacentRanks(rank: Rank): Rank[] {
  const ranks: Rank[] = [];
  if (rank > 1) ranks.push((rank - 1) as Rank);
  else ranks.push(13 as Rank); // Ace wraps to King
  if (rank < 13) ranks.push((rank + 1) as Rank);
  else ranks.push(1 as Rank); // King wraps to Ace
  return ranks;
}

export function isStuck(
  playerTableau: Card[][],
  computerTableau: Card[][],
  center: [Card[], Card[]]
): boolean {
  const centerTops = center.map(pile => pile[pile.length - 1]);
  const check = (tableau: Card[][]) =>
    tableau.some(pile => {
      const top = pile[pile.length - 1];
      return top && centerTops.some(ct => canPlay(top, ct));
    });
  return !check(playerTableau) && !check(computerTableau);
}

export function countCards(state: { tableau: Card[][]; spit: Card[] }): number {
  return state.spit.length + state.tableau.reduce((s, p) => s + p.length, 0);
}
