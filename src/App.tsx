import { useSnapshot } from './hooks/useSnapshot';
import { Menu } from './components/Menu';
import { GameBoard } from './components/GameBoard';
import './App.css';

function App() {
  const { game } = useSnapshot();
  return (
    <div className="app">
      {game ? <GameBoard /> : <Menu />}
    </div>
  );
}

export default App;
