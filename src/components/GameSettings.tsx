import React from 'react';
import { motion } from 'framer-motion';
import { Users, Bot, BrainCircuit, Zap, Sparkles } from 'lucide-react';

export type GameMode = 'pvp' | 'ai';
export type Difficulty = 'easy' | 'medium' | 'hard';

interface GameSettingsProps {
  gameMode: GameMode;
  setGameMode: (mode: GameMode) => void;
  difficulty: Difficulty;
  setDifficulty: (difficulty: Difficulty) => void;
}

export const GameSettings: React.FC<GameSettingsProps> = ({
  gameMode,
  setGameMode,
  difficulty,
  setDifficulty,
}) => {
  return (
    <div className="glass-panel" style={{ padding: '0.5rem', borderRadius: 'var(--radius)', marginBottom: '0.75rem', width: '100%', maxWidth: '400px' }}>
      
      {/* Mode Toggle */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: gameMode === 'ai' ? '0.5rem' : '0' }}>
        <button
          onClick={() => setGameMode('pvp')}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            padding: '0.5rem',
            border: `2px solid ${gameMode === 'pvp' ? 'var(--primary-color)' : 'transparent'}`,
            borderRadius: 'var(--radius)',
            background: gameMode === 'pvp' ? 'var(--cell-hover)' : 'var(--cell-bg)',
            color: gameMode === 'pvp' ? 'var(--primary-color)' : 'var(--text-color)',
            cursor: 'pointer',
            transition: 'all 0.2s',
            fontWeight: 'bold',
          }}
        >
          <Users size={18} />
          <span>PvP</span>
        </button>
        
        <button
          onClick={() => setGameMode('ai')}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            padding: '0.5rem',
            border: `2px solid ${gameMode === 'ai' ? 'var(--secondary-color)' : 'transparent'}`,
            borderRadius: 'var(--radius)',
            background: gameMode === 'ai' ? 'var(--cell-hover)' : 'var(--cell-bg)',
            color: gameMode === 'ai' ? 'var(--secondary-color)' : 'var(--text-color)',
            cursor: 'pointer',
            transition: 'all 0.2s',
            fontWeight: 'bold',
          }}
        >
          <Bot size={18} />
          <span>vs AI</span>
        </button>
      </div>

      {/* Difficulty Settings (Only show if AI is selected) */}
      {gameMode === 'ai' && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          style={{ display: 'flex', gap: '0.5rem', overflow: 'hidden' }}
        >
          <button
            onClick={() => setDifficulty('easy')}
            style={{
              flex: 1,
              padding: '0.5rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.25rem',
              border: `1px solid ${difficulty === 'easy' ? 'var(--text-color)' : 'transparent'}`,
              borderRadius: 'var(--radius)',
              background: difficulty === 'easy' ? 'var(--cell-hover)' : 'transparent',
              color: 'var(--text-color)',
              cursor: 'pointer',
              fontSize: '0.8rem',
            }}
          >
            <Sparkles size={16} /> Easy
          </button>
          
          <button
            onClick={() => setDifficulty('medium')}
            style={{
              flex: 1,
              padding: '0.5rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.25rem',
              border: `1px solid ${difficulty === 'medium' ? 'var(--text-color)' : 'transparent'}`,
              borderRadius: 'var(--radius)',
              background: difficulty === 'medium' ? 'var(--cell-hover)' : 'transparent',
              color: 'var(--text-color)',
              cursor: 'pointer',
              fontSize: '0.8rem',
            }}
          >
            <Zap size={16} /> Medium
          </button>
          
          <button
            onClick={() => setDifficulty('hard')}
            style={{
              flex: 1,
              padding: '0.5rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.25rem',
              border: `1px solid ${difficulty === 'hard' ? 'var(--text-color)' : 'transparent'}`,
              borderRadius: 'var(--radius)',
              background: difficulty === 'hard' ? 'var(--cell-hover)' : 'transparent',
              color: 'var(--text-color)',
              cursor: 'pointer',
              fontSize: '0.8rem',
            }}
          >
            <BrainCircuit size={16} /> Hard
          </button>
        </motion.div>
      )}
    </div>
  );
};
