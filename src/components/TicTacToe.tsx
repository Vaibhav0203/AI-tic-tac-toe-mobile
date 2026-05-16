import React from 'react';
import { motion } from 'framer-motion';
import { useTicTacToe, Player } from '../hooks/useTicTacToe';
import { ThemeName } from './ThemeSwitcher';
import { GameSettings } from './GameSettings';
import { Sun, Moon, X, Circle, Trophy, RefreshCcw } from 'lucide-react';

interface TicTacToeProps {
  theme: ThemeName;
}

const Token: React.FC<{ player: Player; theme: ThemeName }> = ({ player, theme }) => {
  if (!player) return null;

  if (theme === 'cosmic') {
    return (
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        style={{ color: player === 'X' ? 'var(--primary-color)' : 'var(--secondary-color)', textShadow: player === 'X' ? 'var(--x-glow)' : 'var(--o-glow)' }}
      >
        {player === 'X' ? <Sun size={48} /> : <Moon size={48} />}
      </motion.div>
    );
  }

  if (theme === 'zen' || theme === 'glass') {
    return (
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        style={{ color: player === 'X' ? 'var(--primary-color)' : 'var(--secondary-color)' }}
      >
        {player === 'X' ? <X size={64} strokeWidth={2.5} /> : <Circle size={56} strokeWidth={3} />}
      </motion.div>
    );
  }

  // Default for Neon, Retro
  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      style={{
        fontSize: '3.5rem',
        color: player === 'X' ? 'var(--primary-color)' : 'var(--secondary-color)',
        textShadow: player === 'X' ? 'var(--x-glow)' : 'var(--o-glow)',
      }}
    >
      {player}
    </motion.div>
  );
};

export const TicTacToe: React.FC<TicTacToeProps> = ({ theme }) => {
  const { 
    board, xIsNext, winner, winningLine, isDraw, 
    scores, gameMode, setGameMode, difficulty, setDifficulty,
    handleClick, resetGame, resetScores 
  } = useTicTacToe();

  const getStatus = () => {
    if (winner) return `Winner: ${winner === 'X' && theme === 'cosmic' ? 'Sun' : winner === 'O' && theme === 'cosmic' ? 'Moon' : winner}`;
    if (isDraw) return 'Draw!';
    const nextPlayer = xIsNext ? 'X' : 'O';
    return `Turn: ${nextPlayer === 'X' && theme === 'cosmic' ? 'Sun' : nextPlayer === 'O' && theme === 'cosmic' ? 'Moon' : nextPlayer}`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: '500px' }}>
      
      {/* Settings Panel */}
      <GameSettings 
        gameMode={gameMode} 
        setGameMode={setGameMode} 
        difficulty={difficulty} 
        setDifficulty={setDifficulty} 
      />

      {/* Scoreboard */}
      <div 
        className="glass-panel"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: '100%',
          padding: '1rem',
          borderRadius: 'var(--radius)',
          marginBottom: '1.5rem',
          fontWeight: 'bold',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: 'var(--primary-color)' }}>
          <span style={{ fontSize: '0.8rem', textTransform: 'uppercase' }}>{theme === 'cosmic' ? 'Sun (X)' : 'Player X'}</span>
          <span style={{ fontSize: '1.5rem' }}>{scores.x}</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: 'var(--text-color)', opacity: 0.7 }}>
          <span style={{ fontSize: '0.7rem', textTransform: 'uppercase' }}>Draws</span>
          <span style={{ fontSize: '1.2rem' }}>{scores.draws}</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: 'var(--secondary-color)' }}>
          <span style={{ fontSize: '0.8rem', textTransform: 'uppercase' }}>{theme === 'cosmic' ? 'Moon (O)' : gameMode === 'ai' ? 'AI (O)' : 'Player O'}</span>
          <span style={{ fontSize: '1.5rem' }}>{scores.o}</span>
        </div>
      </div>

      {/* Game Status */}
      <div 
        className="glass-panel"
        style={{
          padding: '0.75rem 2rem',
          borderRadius: 'var(--radius)',
          marginBottom: '1.5rem',
          fontSize: '1.25rem',
          fontWeight: 'bold',
          color: winner ? 'var(--secondary-color)' : 'var(--text-color)',
        }}
      >
        {getStatus()}
      </div>

      {/* Game Board */}
      <div
        className="glass-panel"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '10px',
          padding: '10px',
          borderRadius: 'var(--board-radius)',
          width: '100%',
          aspectRatio: '1',
          backgroundColor: 'var(--board-border)',
        }}
      >
        {board.map((cell, index) => {
          const isWinningCell = winningLine.includes(index);
          return (
            <motion.button
              key={index}
              onClick={() => handleClick(index)}
              whileTap={{ scale: cell || winner ? 1 : 0.9 }}
              style={{
                backgroundColor: isWinningCell ? 'var(--cell-hover)' : 'var(--cell-bg)',
                border: 'none',
                borderRadius: 'calc(var(--radius) / 2)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                cursor: cell || winner ? 'default' : 'pointer',
                outline: 'none',
                position: 'relative',
                overflow: 'hidden',
                transition: 'background-color 0.3s ease',
              }}
            >
              <Token player={cell} theme={theme} />
              
              {/* Highlight effect for winning cells */}
              {isWinningCell && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 0.3, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundColor: 'var(--accent-color)',
                  }}
                />
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', width: '100%' }}>
        <motion.button
          onClick={resetScores}
          className="glass-panel"
          style={{
            flex: 1,
            padding: '1rem',
            fontSize: '1rem',
            fontWeight: 'bold',
            borderRadius: 'var(--radius)',
            cursor: 'pointer',
            border: '1px solid var(--board-border)',
            color: 'var(--text-color)',
            background: 'var(--cell-bg)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '0.5rem'
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <RefreshCcw size={18} /> Reset Score
        </motion.button>
        
        {(winner || isDraw) && (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={resetGame}
            className="glass-panel"
            style={{
              flex: 2,
              padding: '1rem',
              fontSize: '1.2rem',
              fontWeight: 'bold',
              borderRadius: 'var(--radius)',
              cursor: 'pointer',
              border: '2px solid var(--primary-color)',
              color: 'var(--text-color)',
              background: 'var(--cell-bg)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '0.5rem'
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Trophy size={20} /> Play Again
          </motion.button>
        )}
      </div>
    </div>
  );
};
