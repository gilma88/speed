import { useState } from 'react';
import type { Difficulty } from '../types';
import { startGame, claimDailyLogin, buyCardBack, selectCardBack } from '../store/gameStore';
import { useSnapshot } from '../hooks/useSnapshot';
import './Menu.css';
import './CardView.css';

export function Menu() {
  const { store } = useSnapshot();
  const [diff, setDiff] = useState<Difficulty>('medium');
  const [showDailyToast, setShowDailyToast] = useState(false);
  const [openShop, setOpenShop] = useState(false);

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

  return (
    <div className="menu">
      {showDailyToast && (
        <div className="daily-toast">+150 coins — daily bonus!</div>
      )}

      <h1 className="menu-title">SPEED</h1>
      <p className="menu-sub">The fast-paced card game</p>

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
