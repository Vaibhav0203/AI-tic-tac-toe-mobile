import React from 'react';
import { motion } from 'framer-motion';
import { Users, Bot, BrainCircuit, Zap, Sparkles, Grid3X3, Grid, Wifi, WifiOff, Trophy } from 'lucide-react';
import { GameMode, Difficulty } from './GameSettings';
import { ThemeName } from './ThemeSwitcher';

export type GameType = 'classic' | 'infinity';
export type PvpMode = 'offline' | 'online';

interface DashboardProps {
  gameType: GameType;
  setGameType: (type: GameType) => void;
  gameMode: GameMode;
  setGameMode: (mode: GameMode) => void;
  pvpMode: PvpMode;
  setPvpMode: (mode: PvpMode) => void;
  difficulty: Difficulty;
  setDifficulty: (diff: Difficulty) => void;
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
  onPlay: () => void;
  onFindMatch: () => void;
  onLeaderboard: () => void;
  classicScores: { x: number; o: number; draws: number };
  infinityScores: { x: number; o: number; draws: number };
  username: string;
}

const THEMES: { id: ThemeName; label: string; color: string }[] = [
  { id: 'neon', label: 'Neon', color: '#ff00ff' },
  { id: 'cyber', label: 'Cyberpunk', color: '#fcee0a' },
  { id: 'zen', label: 'Zen', color: '#8b949e' },
  { id: 'retro', label: 'Retro', color: '#ffb000' },
  { id: 'glass', label: 'Glass', color: '#ffffff' },
  { id: 'dark', label: 'Dark', color: '#30363d' },
  { id: 'nature', label: 'Nature', color: '#10b981' },
  { id: 'ocean', label: 'Ocean', color: '#0ea5e9' },
  { id: 'sunset', label: 'Sunset', color: '#f97316' },
  { id: 'cosmic', label: 'Cosmic', color: '#8b5cf6' },
];

export const Dashboard: React.FC<DashboardProps> = ({
  gameType, setGameType,
  gameMode, setGameMode,
  pvpMode, setPvpMode,
  difficulty, setDifficulty,
  theme, setTheme,
  onPlay, onFindMatch, onLeaderboard,
  classicScores, infinityScores,
  username,
}) => {
  const scores = gameType === 'classic' ? classicScores : infinityScores;
  const isOnlinePvp = gameMode === 'pvp' && pvpMode === 'online';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="dashboard-container"
      style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%', maxWidth: '500px', margin: '0 auto' }}
    >
      {/* Welcome + Leaderboard */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ color: 'var(--text-color)', fontSize: '0.95rem' }}>
          👋 <strong>{username}</strong>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onLeaderboard}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.4rem',
            padding: '0.5rem 0.9rem', borderRadius: 'var(--radius)',
            background: 'var(--cell-bg)', border: '1px solid var(--board-border)',
            color: '#FFD700', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem',
          }}
        >
          <Trophy size={15} /> Rankings
        </motion.button>
      </div>

      {/* Scoreboard Preview */}
      <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: 'var(--radius)', textAlign: 'center' }}>
        <h2 style={{ marginBottom: '1rem', color: 'var(--text-color)', fontSize: '1.2rem' }}>
          {gameType === 'classic' ? 'Classic Scores' : 'Infinity Scores'}
        </h2>
        <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', color: 'var(--primary-color)' }}>
            <span style={{ fontSize: '0.9rem', textTransform: 'uppercase', fontWeight: 'bold' }}>Player X</span>
            <span style={{ fontSize: '2rem', fontWeight: 'bold' }}>{scores.x}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', color: 'var(--text-color)', opacity: 0.7 }}>
            <span style={{ fontSize: '0.8rem', textTransform: 'uppercase' }}>Draws</span>
            <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{scores.draws}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', color: 'var(--secondary-color)' }}>
            <span style={{ fontSize: '0.9rem', textTransform: 'uppercase', fontWeight: 'bold' }}>Player O</span>
            <span style={{ fontSize: '2rem', fontWeight: 'bold' }}>{scores.o}</span>
          </div>
        </div>
      </div>

      {/* Game Type */}
      <div className="glass-panel" style={{ padding: '1rem', borderRadius: 'var(--radius)' }}>
        <h3 style={{ marginBottom: '0.75rem', fontSize: '1rem', color: 'var(--text-color)' }}>Game Type</h3>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={() => setGameType('classic')} className={`select-btn ${gameType === 'classic' ? 'active' : ''}`}>
            <Grid3X3 size={20} /> Classic (3x3)
          </button>
          <button onClick={() => setGameType('infinity')} className={`select-btn ${gameType === 'infinity' ? 'active' : ''}`}>
            <Grid size={20} /> Infinity (15x15)
          </button>
        </div>
      </div>

      {/* Opponent */}
      <div className="glass-panel" style={{ padding: '1rem', borderRadius: 'var(--radius)' }}>
        <h3 style={{ marginBottom: '0.75rem', fontSize: '1rem', color: 'var(--text-color)' }}>Opponent</h3>
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: (gameMode === 'ai' || gameMode === 'pvp') ? '0.75rem' : '0' }}>
          <button onClick={() => setGameMode('pvp')} className={`select-btn ${gameMode === 'pvp' ? 'active' : ''}`}>
            <Users size={20} /> PvP
          </button>
          <button onClick={() => { setGameMode('ai'); }} className={`select-btn ${gameMode === 'ai' ? 'active' : ''}`}>
            <Bot size={20} /> vs AI
          </button>
        </div>

        {/* Online / Offline toggle (only for PvP) */}
        {gameMode === 'pvp' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            style={{ display: 'flex', gap: '0.5rem', overflow: 'hidden', marginBottom: '0' }}
          >
            <button
              onClick={() => setPvpMode('offline')}
              className={`select-btn-sm ${pvpMode === 'offline' ? 'active' : ''}`}
            >
              <WifiOff size={15} /> Offline
            </button>
            <button
              onClick={() => setPvpMode('online')}
              className={`select-btn-sm ${pvpMode === 'online' ? 'active' : ''}`}
            >
              <Wifi size={15} /> Online
            </button>
          </motion.div>
        )}

        {/* AI Difficulty */}
        {gameMode === 'ai' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            style={{ display: 'flex', gap: '0.5rem', overflow: 'hidden' }}
          >
            <button onClick={() => setDifficulty('easy')} className={`select-btn-sm ${difficulty === 'easy' ? 'active' : ''}`}>
              <Sparkles size={16} /> Easy
            </button>
            <button onClick={() => setDifficulty('medium')} className={`select-btn-sm ${difficulty === 'medium' ? 'active' : ''}`}>
              <Zap size={16} /> Medium
            </button>
            <button onClick={() => setDifficulty('hard')} className={`select-btn-sm ${difficulty === 'hard' ? 'active' : ''}`}>
              <BrainCircuit size={16} /> Hard
            </button>
          </motion.div>
        )}
      </div>

      {/* Theme */}
      <div className="glass-panel" style={{ padding: '1rem', borderRadius: 'var(--radius)' }}>
        <h3 style={{ marginBottom: '0.75rem', fontSize: '1rem', color: 'var(--text-color)' }}>Theme</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {THEMES.map((t) => (
            <button
              key={t.id}
              onClick={() => setTheme(t.id)}
              style={{
                padding: '0.5rem', borderRadius: 'var(--radius)',
                border: `2px solid ${theme === t.id ? t.color : 'transparent'}`,
                background: 'var(--cell-bg)', color: 'var(--text-color)',
                cursor: 'pointer', display: 'flex', alignItems: 'center',
                gap: '0.5rem', fontSize: '0.85rem',
                fontWeight: theme === t.id ? 'bold' : 'normal', transition: 'all 0.2s',
              }}
            >
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: t.color }} />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Play / Find Match Button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={isOnlinePvp ? onFindMatch : onPlay}
        className="play-button"
        style={{
          padding: '1rem', borderRadius: 'var(--radius)',
          background: isOnlinePvp ? 'linear-gradient(135deg, var(--primary-color), var(--secondary-color))' : 'var(--primary-color)',
          color: '#fff', fontSize: '1.25rem', fontWeight: 'bold',
          border: 'none', cursor: 'pointer',
          boxShadow: '0 4px 14px rgba(0,0,0,0.25)',
          textTransform: 'uppercase', letterSpacing: '2px',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
        }}
      >
        {isOnlinePvp ? <><Wifi size={20} /> Find Match</> : 'Play Game'}
      </motion.button>
    </motion.div>
  );
};
