# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A single-player web card game called **Speed** — player vs. AI computer opponent. Built with Vite + React + TypeScript. No backend; all state is persisted in `localStorage`.

Features:
- Three AI difficulty levels (easy / medium / hard)
- Coin economy: +50 coins per win, +150 coins daily login bonus
- Card back shop (buy cosmetic card backs with coins)

## Commands

```bash
npm run dev      # Start dev server (localhost:5173)
npm run build    # Production build → dist/
npm run preview  # Preview production build
npx tsc --noEmit # Type-check without building
```

## Game Rules (Source of Truth)

### Setup (per player)
- Each player gets one standard 52-card deck.
- **Tableau**: 5 piles — pile 1 has 1 card, pile 2 has 2, …, pile 5 has 5 cards. Only the top card of each pile is face-up.
- **Spit pile**: The remaining cards go face-down to the side.

### Gameplay
- **Start**: Both "Spit!" — each flips the top card of their spit pile into the center, creating two shared center piles.
- **Play**: Simultaneously (no turns) — players place cards from their tableau onto either center pile if the card is one rank higher or lower than the top card. Suits are irrelevant. Aces are both high and low (King or 2 can be played on an Ace).
- **Refilling**: Empty tableau spots can be filled by any card from another pile.
- **Stuck**: If neither player can move, both "Spit!" again to flip new cards from their spit piles.
- **Round end**: When a player clears their tableau, they take the smaller center pile as their new spit pile.

### Winning
- A player wins when both their tableau and spit pile are empty.
- If no moves are possible and neither can win, the player with fewer remaining cards wins.

## Architecture

### State management — `src/store/gameStore.ts`
A hand-rolled pub/sub store (no Redux/Zustand) with `subscribe` / `getStore` / `getGame`. React components consume it via `useSyncExternalStore` in `src/hooks/useSnapshot.ts`. All mutations go through named action functions exported from `gameStore.ts`. Persistence is handled by `loadStore` / `saveStore` (JSON in localStorage).

### Game logic — `src/game/`
- `deck.ts` — card creation, shuffling, display helpers (rank names, suit symbols)
- `rules.ts` — `canPlay` (adjacency check with Ace wrap-around), `isStuck`, `countCards`
- `engine.ts` — pure state-transition functions: `createInitialState`, `spit`, `playCard`, `moveToEmptyPile`, `computerMove`, `checkRoundEnd`. All functions return a new `GameState` (immutable via `JSON.parse/stringify` deep clone).

### AI — `src/game/engine.ts` → `computerMove`
The computer scans its tableau top cards and plays the first valid move it finds. Difficulty controls the probability of acting each tick and the interval between ticks (set in `gameStore.ts → scheduleComputerMove`):
- Easy: ~40% act chance, ~1800ms interval
- Medium: ~65% act chance, ~1000ms interval
- Hard: ~85% act chance, ~500ms interval

### Coin / shop system — `src/store/gameStore.ts`
- `claimDailyLogin()` — checks `lastLoginDate` against today's ISO date; grants 150 coins once per calendar day.
- `buyCardBack(id)` / `selectCardBack(id)` — mutate owned status and active selection.
- Coins are awarded (+50) inside `playCardAction` and `computerMove` tick immediately when `game.winner === 'player'`.

### Types — `src/types/index.ts`
Single source of truth for `Card`, `Suit`, `Rank`, `Difficulty`, `GameState`, `PlayerState`, `CardBack`, `StoreState`.

### UI components — `src/components/`
- `Menu.tsx` — main menu, difficulty picker, daily login toast, shop modal
- `GameBoard.tsx` — full board: computer tableau (face-down), two center piles, player tableau, spit button, selection → play flow
- `CardView.tsx` — renders a face-up card or a styled face-down card back (pattern via CSS class `pattern-<id>`)

### Card back patterns
Six card backs defined in `gameStore.ts → DEFAULT_CARD_BACKS`. Each has a CSS `pattern-*` class in `CardView.css` that applies a `background-image` overlay over the solid `color` property. Adding a new back = add entry to `DEFAULT_CARD_BACKS` + add `.pattern-<id>` CSS rule.
