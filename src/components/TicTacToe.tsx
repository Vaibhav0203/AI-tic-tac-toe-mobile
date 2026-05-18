import React from 'react';
import { motion } from 'framer-motion';
import { useTicTacToe, Player } from '../hooks/useTicTacToe';
import { ThemeName } from './ThemeSwitcher';
import { GameMode, Difficulty } from './GameSettings';
import { GameType } from './Dashboard';
import { Sun, Moon, X, Circle, Trophy, RefreshCcw, ArrowLeft } from 'lucide-react';

interface TicTacToeProps {
  theme: ThemeName;
  gameType: GameType;
  gameMode: GameMode;
  difficulty: Difficulty;
  scores: { x: number; o: number; draws: number };
  setScores: React.Dispatch<React.SetStateAction<{ x: number; o: number; draws: number }>>;
  onBack: () => void;
}

const Token: React.FC<{ player: Player; theme: ThemeName; isInfinity: boolean }> = ({ player, theme, isInfinity }) => {
  if (!player) return null;

  const size = isInfinity ? 24 : 64; // Smaller tokens for infinity mode
  const fontSize = isInfinity ? '1.5rem' : '3.5rem';

  if (theme === 'cosmic') {
    return (
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        style={{ color: player === 'X' ? 'var(--primary-color)' : 'var(--secondary-color)', textShadow: player === 'X' ? 'var(--x-glow)' : 'var(--o-glow)' }}
      >
        {player === 'X' ? <Sun size={size * 0.75} /> : <Moon size={size * 0.75} />}
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
        {player === 'X' ? <X size={size} strokeWidth={2.5} /> : <Circle size={size * 0.8} strokeWidth={3} />}
      </motion.div>
    );
  }

  // Default for Neon, Retro
  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      style={{
        fontSize: fontSize,
        color: player === 'X' ? 'var(--primary-color)' : 'var(--secondary-color)',
        textShadow: player === 'X' ? 'var(--x-glow)' : 'var(--o-glow)',
      }}
    >
      {player}
    </motion.div>
  );
};

export const TicTacToe: React.FC<TicTacToeProps> = ({ 
  theme, gameType, gameMode, difficulty, scores, setScores, onBack 
}) => {
  const isInfinity = gameType === 'infinity';
  const boardSize = isInfinity ? 15 : 3;

  const { 
    board, xIsNext, winner, winningLine, isDraw, 
    handleClick, resetGame 
  } = useTicTacToe({ gameType, gameMode, difficulty, scores, setScores });

  const getStatus = () => {
    if (winner) return `Winner: ${winner === 'X' && theme === 'cosmic' ? 'Sun' : winner === 'O' && theme === 'cosmic' ? 'Moon' : winner}`;
    if (isDraw) return 'Draw!';
    const nextPlayer = xIsNext ? 'X' : 'O';
    return `Turn: ${nextPlayer === 'X' && theme === 'cosmic' ? 'Sun' : nextPlayer === 'O' && theme === 'cosmic' ? 'Moon' : nextPlayer}`;
  };

  const resetScores = () => {
    setScores({ x: 0, o: 0, draws: 0 });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: '100%', padding: '0 10px' }}>
      
      {/* Top Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', maxWidth: '500px', marginBottom: '1rem' }}>
        <button 
          onClick={onBack}
          className="glass-panel"
          style={{
            padding: '0.5rem 1rem',
            borderRadius: 'var(--radius)',
            border: 'none',
            color: 'var(--text-color)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontWeight: 'bold'
          }}
        >
          <ArrowLeft size={18} /> Back
        </button>
        <div className="glass-panel" style={{ padding: '0.5rem 1rem', borderRadius: 'var(--radius)', fontWeight: 'bold' }}>
          {isInfinity ? 'Infinity Mode' : 'Classic Mode'}
        </div>
      </div>

      {/* Game Status */}
      <div 
        className="glass-panel"
        style={{
          padding: '0.5rem 2rem',
          borderRadius: 'var(--radius)',
          marginBottom: '0.75rem',
          fontSize: '1.25rem',
          fontWeight: 'bold',
          color: winner ? 'var(--secondary-color)' : 'var(--text-color)',
        }}
      >
        {getStatus()}
      </div>

      {/* Game Board Container for Scrolling in Infinity Mode */}
      <div style={{ width: '100%', overflow: 'auto', display: 'flex', justifyContent: 'center' }}>
        <div
          className="glass-panel"
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${boardSize}, 1fr)`,
            gap: isInfinity ? '2px' : '10px',
            padding: '10px',
            borderRadius: 'var(--board-radius)',
            width: isInfinity ? 'min(95vw, 600px)' : '100%',
            maxWidth: isInfinity ? '600px' : '500px',
            aspectRatio: '1',
            backgroundColor: 'var(--board-border)',
            minWidth: isInfinity ? '300px' : 'auto'
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
                  borderRadius: isInfinity ? '2px' : 'calc(var(--radius) / 2)',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  cursor: cell || winner ? 'default' : 'pointer',
                  outline: 'none',
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'background-color 0.3s ease',
                  minHeight: isInfinity ? '0' : '80px',
                }}
              >
                <Token player={cell} theme={theme} isInfinity={isInfinity} />
                
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
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', width: '100%', maxWidth: '500px' }}>
        <motion.button
          onClick={resetScores}
          className="glass-panel"
          style={{
            flex: 1,
            padding: '0.75rem',
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
              padding: '0.75rem',
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

