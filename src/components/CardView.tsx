import type { Card, CardBack } from '../types';
import { rankName, suitSymbol, isRed } from '../game/deck';
import './CardView.css';

interface Props {
  card: Card;
  cardBack: CardBack;
  onClick?: () => void;
  selected?: boolean;
  small?: boolean;
}

export function CardView({ card, cardBack, onClick, selected, small }: Props) {
  if (!card.faceUp) {
    return (
      <div
        className={`card card-back ${small ? 'card-small' : ''} pattern-${cardBack.pattern}`}
        style={{ background: cardBack.color }}
        onClick={onClick}
      />
    );
  }
  const red = isRed(card.suit);
  return (
    <div
      className={`card card-face ${red ? 'red' : 'black'} ${selected ? 'selected' : ''} ${small ? 'card-small' : ''}`}
      onClick={onClick}
    >
      <span className="card-corner top-left">
        {rankName(card.rank)}<br />{suitSymbol(card.suit)}
      </span>
      <span className="card-center">{suitSymbol(card.suit)}</span>
      <span className="card-corner bottom-right">
        {rankName(card.rank)}<br />{suitSymbol(card.suit)}
      </span>
    </div>
  );
}

export function CardBack({ cardBack, small }: { cardBack: CardBack; small?: boolean }) {
  return (
    <div
      className={`card card-back ${small ? 'card-small' : ''} pattern-${cardBack.pattern}`}
      style={{ background: cardBack.color }}
    />
  );
}
