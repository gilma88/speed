import { useState } from 'react';
import { useSnapshot } from '../hooks/useSnapshot';
import { spitAction, playCardAction, moveToEmptyAction, stackSameRankAction, returnToMenu, startGame, setPlayerName } from '../store/gameStore';
import { CardView, CardBack } from './CardView';
import { canPlay } from '../game/rules';
import './GameBoard.css';

export function GameBoard() {
  const { game, store } = useSnapshot();
  const [selected, setSelected] = useState<{ pile: number; card: number } | null>(null);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');

  if (!game) return null;

  function handleEditName() {
    setNameInput(store.playerName);
    setEditingName(true);
  }

  function handleSaveName() {
    setPlayerName(nameInput);
    setEditingName(false);
  }

  const cardBack = store.cardBacks.find(b => b.id === store.activeCardBack)!;
  const { player, computer, center, phase, message, difficulty } = game;

  function handleTableauClick(pileIdx: number) {
    if (phase !== 'playing' && phase !== 'roundEnd' && phase !== 'stuck') return;
    const pile = player.tableau[pileIdx];

    if (selected !== null) {
      if (selected.pile === pileIdx) {
        // Deselect
        setSelected(null);
        return;
      }
      if (pile.length === 0) {
        // Move to empty slot
        moveToEmptyAction(selected.pile, pileIdx);
        setSelected(null);
        return;
      }
      // Stack if same rank
      const top = pile[pile.length - 1];
      const selectedTop = player.tableau[selected.pile][selected.card];
      if (top.faceUp && selectedTop && top.rank === selectedTop.rank) {
        stackSameRankAction(selected.pile, pileIdx);
        setSelected(null);
        return;
      }
      // Otherwise re-select the new pile
      if (top.faceUp) {
        setSelected({ pile: pileIdx, card: pile.length - 1 });
      }
      return;
    }

    if (pile.length === 0) return;
    const topIdx = pile.length - 1;
    const top = pile[topIdx];
    if (!top.faceUp) return;
    setSelected({ pile: pileIdx, card: topIdx });
  }

  function handleCenterClick(centerIdx: 0 | 1) {
    if (phase !== 'playing' || selected === null) return;
    const { pile, card } = selected;
    const top = player.tableau[pile][card];
    const centerTop = center[centerIdx][center[centerIdx].length - 1];
    if (!canPlay(top, centerTop)) return;
    playCardAction(pile, card, centerIdx);
    setSelected(null);
  }

  const isStuckPhase = phase === 'stuck';
  const canSpit = (phase === 'playing' || phase === 'roundEnd') && center[0].length === 0 && center[1].length === 0;

  return (
    <div className="game-board">
      {/* Header */}
      <div className="board-header">
        <button className="btn-back" onClick={returnToMenu}>← Menu</button>
        <div className="coin-display-sm">🪙 {store.coins}</div>
        <span className="diff-badge">{difficulty.toUpperCase()}</span>
      </div>

      {/* Name edit modal */}
      {editingName && (
        <div className="name-edit-overlay" onClick={() => setEditingName(false)}>
          <div className="name-edit-box" onClick={e => e.stopPropagation()}>
            <p>Your name</p>
            <input
              className="name-input"
              value={nameInput}
              onChange={e => setNameInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSaveName()}
              maxLength={20}
              autoFocus
            />
            <div className="name-edit-btns">
              <button className="btn-primary" onClick={handleSaveName}>Save</button>
              <button className="btn-secondary" onClick={() => setEditingName(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* In-play message (stuck, round end) */}
      {message && phase !== 'gameOver' && (
        <div className="message-banner">{message}</div>
      )}

      {/* Game over overlay */}
      {phase === 'gameOver' && (
        <div className="gameover-overlay">
          <div className="gameover-card">
            <div className={`gameover-icon ${game.winner === 'player' ? 'win' : 'lose'}`}>
              {game.winner === 'player' ? '🏆' : '💀'}
            </div>
            <h2 className={game.winner === 'player' ? 'win-text' : 'lose-text'}>
              {game.winner === 'player' ? 'You Win!' : 'Computer Wins'}
            </h2>
            {game.winner === 'player' && (
              <p className="coins-earned">+50 coins!</p>
            )}
            <div className="gameover-buttons">
              <button className="btn-primary" onClick={() => startGame(difficulty)}>
                Play Again
              </button>
              <button className="btn-secondary" onClick={returnToMenu}>
                Home Menu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Computer tableau */}
      <div className="player-area computer-area">
        <p className="area-label">Computer
          <span className="card-count"> ({computer.tableau.reduce((s, p) => s + p.length, 0)} + {computer.spit.length})</span>
        </p>
        <div className="tableau">
          {computer.tableau.map((pile, i) => (
            <div key={i} className="tableau-pile">
              {pile.length === 0 ? (
                <div className="empty-pile" />
              ) : pile.map((card, j) => (
                <div key={card.id} className="stacked-card" style={{ top: j * 20 }}>
                  <CardView card={{ ...card, faceUp: j === pile.length - 1 }} cardBack={cardBack} />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Center piles */}
      <div className="center-area">
        <div className="spit-pile-area">
          {player.spit.length > 0 ? (
            <CardBack cardBack={cardBack} />
          ) : (
            <div className="empty-pile" />
          )}
          <span className="pile-count">{player.spit.length}</span>
        </div>

        <div className="center-piles">
          {([0, 1] as const).map(ci => (
            <div
              key={ci}
              className={`center-pile ${selected !== null ? 'playable' : ''}`}
              onClick={() => handleCenterClick(ci)}
            >
              {center[ci].length === 0 ? (
                <div className="empty-pile center-empty">?</div>
              ) : (
                <CardView
                  card={center[ci][center[ci].length - 1]}
                  cardBack={cardBack}
                />
              )}
              <span className="pile-count">{center[ci].length}</span>
            </div>
          ))}
        </div>

        <div className="spit-pile-area">
          {computer.spit.length > 0 ? (
            <CardBack cardBack={cardBack} />
          ) : (
            <div className="empty-pile" />
          )}
          <span className="pile-count">{computer.spit.length}</span>
        </div>
      </div>

      {/* Spit button */}
      {(isStuckPhase || canSpit) && (
        <button className="spit-btn" onClick={spitAction}>
          SPIT!
        </button>
      )}

      {/* Player tableau */}
      <div className="player-area">
        <p className="area-label">
          {store.playerName}
          <button className="edit-name-btn" onClick={handleEditName} title="Edit name">✏️</button>
          <span className="card-count"> ({player.tableau.reduce((s, p) => s + p.length, 0)} + {player.spit.length})</span>
        </p>
        <div className="tableau">
          {player.tableau.map((pile, i) => (
            <div
              key={i}
              className={`tableau-pile clickable ${pile.length === 0 ? 'empty' : ''} ${selected !== null && pile.length === 0 ? 'drop-target' : ''}`}
              onClick={() => handleTableauClick(i)}
            >
              {pile.length === 0 ? (
                <div className="empty-pile">{selected ? '+' : ''}</div>
              ) : pile.map((card, j) => (
                <div key={card.id} className="stacked-card" style={{ top: j * 20 }}>
                  <CardView
                    card={card}
                    cardBack={cardBack}
                    selected={selected?.pile === i && j === pile.length - 1}
                    onClick={j === pile.length - 1 ? () => handleTableauClick(i) : undefined}
                  />
                </div>
              ))}
            </div>
          ))}
        </div>
        <p className="hint-text">
          {selected !== null
            ? 'Click a center pile to play, or an empty spot to move'
            : 'Click a card to select it, then click a center pile'}
        </p>
      </div>
    </div>
  );
}
