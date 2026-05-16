import { useState, useEffect } from 'react';
import { ThemeSwitcher, ThemeName } from './components/ThemeSwitcher';
import { TicTacToe } from './components/TicTacToe';
import { motion, AnimatePresence } from 'framer-motion';

function App() {
  const [theme, setTheme] = useState<ThemeName>(() => {
    const savedTheme = localStorage.getItem('tictactoe-theme');
    return (savedTheme as ThemeName) || 'glass';
  });

  useEffect(() => {
    // Apply the theme class to the body
    document.body.className = `theme-${theme}`;
    localStorage.setItem('tictactoe-theme', theme);
  }, [theme]);

  return (
    <div className="app-container">
      <div className="main-content">
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

        <main style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
          <TicTacToe theme={theme} />
        </main>
      </div>

      <aside className="sidebar">
        <ThemeSwitcher currentTheme={theme} onThemeChange={setTheme} />
      </aside>
    </div>
  );
}

export default App;
