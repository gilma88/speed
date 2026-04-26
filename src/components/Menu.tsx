import { useState } from 'react';
import type { Difficulty } from '../types';
import { startGame, claimDailyLogin, buyCardBack, selectCardBack, setPlayerName } from '../store/gameStore';
import { useSnapshot } from '../hooks/useSnapshot';
import './Menu.css';
import './CardView.css';

export function Menu() {
  const { store } = useSnapshot();
  const [diff, setDiff] = useState<Difficulty>('medium');
  const [showDailyToast, setShowDailyToast] = useState(false);
  const [openShop, setOpenShop] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');

  function handleStart() {
    const claimed = claimDailyLogin();
    if (claimed) {
      setShowDailyToast(true);
      setTimeout(() => {
        setShowDailyToast(false);
        startGame(diff);
      }, 1800);
    } else {
      startGame(diff);
    }
  }

  function handleSaveName() {
    setPlayerName(nameInput);
    setEditingName(false);
  }

  return (
    <div className="menu">
      {showDailyToast && (
        <div className="daily-toast">+150 coins — daily bonus!</div>
      )}

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

      <h1 className="menu-title">SPEED</h1>
      <p className="menu-sub">The fast-paced card game</p>

      <div className="player-name-row">
        <span className="player-name-display">{store.playerName}</span>
        <button className="edit-name-btn-menu" onClick={() => { setNameInput(store.playerName); setEditingName(true); }} title="Edit name">✏️</button>
      </div>

      <div className="coin-display">
        <span className="coin-icon">🪙</span>
        <span>{store.coins} coins</span>
      </div>

      <div className="diff-select">
        <p>Choose difficulty:</p>
        {(['easy', 'medium', 'hard'] as Difficulty[]).map(d => (
          <button
            key={d}
            className={`diff-btn ${diff === d ? 'active' : ''}`}
            onClick={() => setDiff(d)}
          >
            {d.charAt(0).toUpperCase() + d.slice(1)}
          </button>
        ))}
      </div>

      <button className="btn-primary" onClick={handleStart}>
        Play
      </button>

      <button className="btn-secondary" onClick={() => setOpenShop(s => !s)}>
        🛍 Shop
      </button>

      {openShop && <ShopPanel onClose={() => setOpenShop(false)} />}
    </div>
  );
}

function ShopPanel({ onClose }: { onClose: () => void }) {
  const { store } = useSnapshot();

  return (
    <div className="shop-overlay" onClick={onClose}>
      <div className="shop-panel" onClick={e => e.stopPropagation()}>
        <h2>Card Shop</h2>
        <p className="shop-coins">🪙 {store.coins} coins</p>
        <div className="shop-grid">
          {store.cardBacks.map(back => (
            <div
              key={back.id}
              className={`shop-item ${store.activeCardBack === back.id ? 'active' : ''}`}
            >
              <div
                className={`card-preview pattern-${back.pattern}`}
                style={{ background: back.color }}
              />
              <p className="back-name">{back.name}</p>
              {back.owned ? (
                <button
                  className="btn-use"
                  onClick={() => selectCardBack(back.id)}
                  disabled={store.activeCardBack === back.id}
                >
                  {store.activeCardBack === back.id ? 'In Use' : 'Use'}
                </button>
              ) : (
                <button
                  className="btn-buy"
                  disabled={store.coins < back.price}
                  onClick={() => buyCardBack(back.id)}
                >
                  🪙 {back.price}
                </button>
              )}
            </div>
          ))}
        </div>
        <button className="btn-secondary" onClick={onClose}>Close</button>
      </div>
    </div>
  );
}
