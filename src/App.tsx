import { useState, useEffect } from 'react';
import { ThemeName } from './components/ThemeSwitcher';
import { TicTacToe } from './components/TicTacToe';
import { Dashboard, GameType, PvpMode } from './components/Dashboard';
import { GameMode, Difficulty } from './components/GameSettings';
import { AdminPanel } from './components/AdminPanel';
import { AdsSidebar } from './components/AdsSidebar';
import { AuthPage } from './components/AuthPage';
import { OnlineGame } from './components/OnlineGame';
import { Leaderboard } from './components/Leaderboard';
import { AuthProvider, useAuthContext } from './contexts/AuthContext';
import { useMatchmaking } from './hooks/useMatchmaking';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, LogOut, Loader2, X, Wifi } from 'lucide-react';

type Screen = 'dashboard' | 'game' | 'online-searching' | 'online-game' | 'leaderboard';

function AppContent() {
  const { currentUser, logout } = useAuthContext();
  const [currentScreen, setCurrentScreen] = useState<Screen>('dashboard');
  const [showAdminPanel, setShowAdminPanel] = useState(false);

  const [theme, setTheme] = useState<ThemeName>(() => {
    const savedTheme = localStorage.getItem('tictactoe-theme');
    return (savedTheme as ThemeName) || 'glass';
  });

  const [gameType, setGameType] = useState<GameType>('classic');
  const [gameMode, setGameMode] = useState<GameMode>('pvp');
  const [pvpMode, setPvpMode] = useState<PvpMode>('offline');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');

  const [classicScores, setClassicScores] = useState(() => {
    const saved = localStorage.getItem('tictactoe-scores-classic');
    if (saved) { try { return JSON.parse(saved); } catch {} }
    return { x: 0, o: 0, draws: 0 };
  });

  const [infinityScores, setInfinityScores] = useState(() => {
    const saved = localStorage.getItem('tictactoe-scores-infinity');
    if (saved) { try { return JSON.parse(saved); } catch {} }
    return { x: 0, o: 0, draws: 0 };
  });

  const { matchState, findMatch, cancelSearch, resetMatch } = useMatchmaking(currentUser);

  useEffect(() => {
    document.body.className = `theme-${theme}`;
    localStorage.setItem('tictactoe-theme', theme);
  }, [theme]);

  // When matchmaking completes, navigate to online game
  useEffect(() => {
    if (matchState.status === 'matched' && matchState.gameId) {
      setCurrentScreen('online-game');
    }
  }, [matchState.status, matchState.gameId]);

  const updateScores = (type: GameType, newScores: any) => {
    if (type === 'classic') {
      setClassicScores(newScores);
      localStorage.setItem('tictactoe-scores-classic', JSON.stringify(newScores));
    } else {
      setInfinityScores(newScores);
      localStorage.setItem('tictactoe-scores-infinity', JSON.stringify(newScores));
    }
  };

  const handleFindMatch = () => {
    setCurrentScreen('online-searching');
    findMatch();
  };

  const handleCancelSearch = () => {
    cancelSearch();
    setCurrentScreen('dashboard');
  };

  const handleBackFromOnlineGame = () => {
    resetMatch();
    setCurrentScreen('dashboard');
  };

  // Not logged in → show auth page
  if (!currentUser) {
    return <AuthPage />;
  }

  return (
    <div className="app-layout" style={{
      display: 'flex', flexDirection: 'column',
      minHeight: '100vh', width: '100%',
      maxWidth: '1600px', margin: '0 auto', position: 'relative',
    }}>
      {/* Top Bar */}
      <div style={{ position: 'absolute', top: '1rem', right: '1rem', zIndex: 100, display: 'flex', gap: '0.5rem' }}>
        <button
          onClick={logout}
          title="Logout"
          style={{
            background: 'var(--cell-bg)', border: '1px solid var(--board-border)',
            color: 'var(--text-color)', padding: '0.5rem', borderRadius: '50%',
            cursor: 'pointer', display: 'flex', alignItems: 'center',
            justifyContent: 'center', boxShadow: 'var(--shadow)',
          }}
        >
          <LogOut size={20} />
        </button>
        <button
          onClick={() => setShowAdminPanel(true)}
          title="Ads Management"
          style={{
            background: 'var(--cell-bg)', border: '1px solid var(--board-border)',
            color: 'var(--text-color)', padding: '0.5rem', borderRadius: '50%',
            cursor: 'pointer', display: 'flex', alignItems: 'center',
            justifyContent: 'center', boxShadow: 'var(--shadow)',
          }}
        >
          <Settings size={20} />
        </button>
      </div>

      <div style={{
        display: 'flex', flexDirection: 'row', flexWrap: 'wrap',
        justifyContent: 'center', flex: 1, padding: '2rem 1rem', gap: '2rem',
      }}>
        {/* Left Ads */}
        <div className="desktop-only" style={{ flex: '1', minWidth: '200px', maxWidth: '300px' }}>
          <AdsSidebar placement="left" />
        </div>

        {/* Main Content */}
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

              {/* Dashboard */}
              {currentScreen === 'dashboard' && (
                <Dashboard
                  key="dashboard"
                  gameType={gameType} setGameType={setGameType}
                  gameMode={gameMode} setGameMode={setGameMode}
                  pvpMode={pvpMode} setPvpMode={setPvpMode}
                  difficulty={difficulty} setDifficulty={setDifficulty}
                  theme={theme} setTheme={setTheme}
                  onPlay={() => setCurrentScreen('game')}
                  onFindMatch={handleFindMatch}
                  onLeaderboard={() => setCurrentScreen('leaderboard')}
                  classicScores={classicScores}
                  infinityScores={infinityScores}
                  username={currentUser.username}
                />
              )}

              {/* Offline Game */}
              {currentScreen === 'game' && (
                <TicTacToe
                  key="game"
                  theme={theme}
                  gameType={gameType}
                  gameMode={gameMode}
                  difficulty={difficulty}
                  scores={gameType === 'classic' ? classicScores : infinityScores}
                  setScores={(s) => updateScores(gameType, s)}
                  onBack={() => setCurrentScreen('dashboard')}
                />
              )}

              {/* Searching for opponent */}
              {currentScreen === 'online-searching' && (
                <motion.div
                  key="searching"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    justifyContent: 'center', minHeight: '60vh', gap: '1.5rem',
                    textAlign: 'center',
                  }}
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
                  >
                    <Wifi size={52} style={{ color: 'var(--primary-color)' }} />
                  </motion.div>
                  <div>
                    <h2 style={{ color: 'var(--text-color)', marginBottom: '0.5rem' }}>Finding Opponent...</h2>
                    <p style={{ color: 'var(--text-color)', opacity: 0.6, fontSize: '0.9rem' }}>
                      Looking for an online player to match you
                    </p>
                  </div>
                  {/* Animated dots */}
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {[0, 1, 2].map(i => (
                      <motion.div
                        key={i}
                        animate={{ scale: [1, 1.5, 1], opacity: [0.4, 1, 0.4] }}
                        transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.2 }}
                        style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--primary-color)' }}
                      />
                    ))}
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={handleCancelSearch}
                    style={{
                      padding: '0.7rem 1.75rem', borderRadius: 'var(--radius)',
                      background: 'var(--cell-bg)', border: '1px solid var(--board-border)',
                      color: 'var(--text-color)', fontWeight: 'bold', cursor: 'pointer',
                      fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.4rem',
                    }}
                  >
                    <X size={16} /> Cancel
                  </motion.button>
                </motion.div>
              )}

              {/* Online Game */}
              {currentScreen === 'online-game' && matchState.gameId && currentUser && matchState.mySymbol && (
                <OnlineGame
                  key="online-game"
                  gameId={matchState.gameId}
                  currentUser={currentUser}
                  mySymbol={matchState.mySymbol}
                  onBack={handleBackFromOnlineGame}
                />
              )}

              {/* Leaderboard */}
              {currentScreen === 'leaderboard' && currentUser && (
                <Leaderboard
                  key="leaderboard"
                  currentUser={currentUser}
                  onBack={() => setCurrentScreen('dashboard')}
                />
              )}

            </AnimatePresence>
          </main>
        </div>

        {/* Right Ads */}
        <div className="desktop-only" style={{ flex: '1', minWidth: '200px', maxWidth: '300px' }}>
          <AdsSidebar placement="right" />
        </div>
      </div>

      {/* Mobile Bottom Ads */}
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

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
