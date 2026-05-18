import { useState, useEffect } from 'react';
import { ThemeName } from './components/ThemeSwitcher';
import { TicTacToe } from './components/TicTacToe';
import { Dashboard, GameType } from './components/Dashboard';
import { GameMode, Difficulty } from './components/GameSettings';
import { AdminPanel } from './components/AdminPanel';
import { AdsSidebar } from './components/AdsSidebar';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings } from 'lucide-react';

function App() {
  const [currentScreen, setCurrentScreen] = useState<'dashboard' | 'game'>('dashboard');
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  
  const [theme, setTheme] = useState<ThemeName>(() => {
    const savedTheme = localStorage.getItem('tictactoe-theme');
    return (savedTheme as ThemeName) || 'glass';
  });

  const [gameType, setGameType] = useState<GameType>('classic');
  const [gameMode, setGameMode] = useState<GameMode>('pvp');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');

  // Load scores
  const [classicScores, setClassicScores] = useState(() => {
    const saved = localStorage.getItem('tictactoe-scores-classic');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return { x: 0, o: 0, draws: 0 };
  });

  const [infinityScores, setInfinityScores] = useState(() => {
    const saved = localStorage.getItem('tictactoe-scores-infinity');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return { x: 0, o: 0, draws: 0 };
  });

  useEffect(() => {
    document.body.className = `theme-${theme}`;
    localStorage.setItem('tictactoe-theme', theme);
  }, [theme]);

  const updateScores = (type: GameType, newScores: any) => {
    if (type === 'classic') {
      setClassicScores(newScores);
      localStorage.setItem('tictactoe-scores-classic', JSON.stringify(newScores));
    } else {
      setInfinityScores(newScores);
      localStorage.setItem('tictactoe-scores-infinity', JSON.stringify(newScores));
    }
  };

  const handlePlay = () => setCurrentScreen('game');
  const handleBackToDashboard = () => setCurrentScreen('dashboard');

  return (
    <div className="app-layout" style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      minHeight: '100vh',
      width: '100%',
      maxWidth: '1600px',
      margin: '0 auto',
      position: 'relative'
    }}>
      {/* Top Bar with Admin Button */}
      <div style={{ position: 'absolute', top: '1rem', right: '1rem', zIndex: 100 }}>
        <button 
          onClick={() => setShowAdminPanel(true)}
          style={{
            background: 'var(--cell-bg)',
            border: '1px solid var(--board-border)',
            color: 'var(--text-color)',
            padding: '0.5rem',
            borderRadius: '50%',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--shadow)'
          }}
          title="Ads Management"
        >
          <Settings size={20} />
        </button>
      </div>

      <div style={{
        display: 'flex',
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        flex: 1,
        padding: '2rem 1rem',
        gap: '2rem'
      }}>
        {/* Left Ads Sidebar (Desktop) */}
        <div className="desktop-only" style={{ flex: '1', minWidth: '200px', maxWidth: '300px' }}>
          <AdsSidebar placement="left" />
        </div>

        {/* Main Content Area */}
        <div className="main-content" style={{ flex: '2', minWidth: '300px', maxWidth: '800px', display: 'flex', flexDirection: 'column' }}>
          <header className="header">
            <AnimatePresence mode="wait">
              <motion.h1
                key={theme}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.3 }}
                className="title"
              >
                Tic Tac Toe
              </motion.h1>
            </AnimatePresence>
          </header>

          <main style={{ width: '100%', display: 'flex', justifyContent: 'center', flex: 1 }}>
            <AnimatePresence mode="wait">
              {currentScreen === 'dashboard' ? (
                <Dashboard
                  key="dashboard"
                  gameType={gameType}
                  setGameType={setGameType}
                  gameMode={gameMode}
                  setGameMode={setGameMode}
                  difficulty={difficulty}
                  setDifficulty={setDifficulty}
                  theme={theme}
                  setTheme={setTheme}
                  onPlay={handlePlay}
                  classicScores={classicScores}
                  infinityScores={infinityScores}
                />
              ) : (
                <TicTacToe
                  key="game"
                  theme={theme}
                  gameType={gameType}
                  gameMode={gameMode}
                  difficulty={difficulty}
                  scores={gameType === 'classic' ? classicScores : infinityScores}
                  setScores={(s) => updateScores(gameType, s)}
                  onBack={handleBackToDashboard}
                />
              )}
            </AnimatePresence>
          </main>
        </div>

        {/* Right Ads Sidebar (Desktop) */}
        <div className="desktop-only" style={{ flex: '1', minWidth: '200px', maxWidth: '300px' }}>
          <AdsSidebar placement="right" />
        </div>
      </div>

      {/* Bottom Ads Area (Mobile) */}
      <div className="mobile-only" style={{ width: '100%', padding: '1rem' }}>
        <AdsSidebar placement="mobile_bottom" />
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showAdminPanel && <AdminPanel onClose={() => setShowAdminPanel(false)} />}
      </AnimatePresence>
    </div>
  );
}

export default App;
