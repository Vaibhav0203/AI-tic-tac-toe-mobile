import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { collection, getDocs, query } from 'firebase/firestore';
import { db } from '../utils/firebase';
import { AuthUser } from '../contexts/AuthContext';
import { ArrowLeft, Trophy, Zap, Crown, Medal, Award, Grid3X3, Grid } from 'lucide-react';

interface PlayerStats {
  id:               string;
  username:         string;
  classic_wins:     number;
  classic_losses:   number;
  classic_draws:    number;
  infinity_wins:    number;
  infinity_losses:  number;
  infinity_draws:   number;
}

interface LeaderboardProps {
  currentUser: AuthUser;
  onBack:      () => void;
}

type GameTab    = 'classic' | 'infinity';
type RankingTab = 'wins'    | 'ratio';

const RankIcon: React.FC<{ rank: number }> = ({ rank }) => {
  if (rank === 1) return <Crown  size={18} style={{ color: '#FFD700' }} />;
  if (rank === 2) return <Medal  size={18} style={{ color: '#C0C0C0' }} />;
  if (rank === 3) return <Award  size={18} style={{ color: '#CD7F32' }} />;
  return <span style={{ fontWeight: 'bold', fontSize: '0.85rem', minWidth: '18px', textAlign: 'center' }}>#{rank}</span>;
};

const TabBtn: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    style={{
      flex: 1, padding: '0.6rem', border: 'none',
      borderRadius: 'calc(var(--radius) - 2px)',
      background: active ? 'var(--primary-color)' : 'transparent',
      color: active ? '#fff' : 'var(--text-color)',
      fontWeight: 'bold', cursor: 'pointer', fontSize: '0.9rem',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      gap: '0.4rem', transition: 'all 0.25s',
    }}
  >
    {children}
  </button>
);

export const Leaderboard: React.FC<LeaderboardProps> = ({ currentUser, onBack }) => {
  const [players,    setPlayers]    = useState<PlayerStats[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [gameTab,    setGameTab]    = useState<GameTab>('classic');
  const [rankingTab, setRankingTab] = useState<RankingTab>('wins');

  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        const snap = await getDocs(query(collection(db, 'users')));
        const data: PlayerStats[] = snap.docs
          .filter(d => d.data().classic_wins !== undefined) // Hide chess-only accounts
          .map(d => ({
            id:              d.id,
            username:        d.data().username      || '',
            classic_wins:    d.data().classic_wins   || 0,
            classic_losses:  d.data().classic_losses || 0,
            classic_draws:   d.data().classic_draws  || 0,
            infinity_wins:   d.data().infinity_wins  || 0,
            infinity_losses: d.data().infinity_losses|| 0,
            infinity_draws:  d.data().infinity_draws || 0,
          }));
        setPlayers(data);
      } catch (err) {
        console.error('Failed to load leaderboard:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPlayers();
  }, []);

  // Pick the right stat fields based on active game tab
  const wins   = (p: PlayerStats) => gameTab === 'classic' ? p.classic_wins   : p.infinity_wins;
  const losses = (p: PlayerStats) => gameTab === 'classic' ? p.classic_losses : p.infinity_losses;
  const draws  = (p: PlayerStats) => gameTab === 'classic' ? p.classic_draws  : p.infinity_draws;

  const ranked = [...players].sort((a, b) =>
    rankingTab === 'wins'
      ? wins(b) - wins(a)
      : (wins(b) - losses(b)) - (wins(a) - losses(a))
  );

  const rowStyle = (username: string, i: number): React.CSSProperties => ({
    display: 'grid',
    gridTemplateColumns: '36px 1fr auto auto auto',
    gap: '0.5rem',
    alignItems: 'center',
    padding: '0.75rem 1rem',
    borderRadius: 'var(--radius)',
    background: username === currentUser.username
      ? 'rgba(99,102,241,0.18)'
      : i % 2 === 0 ? 'var(--cell-bg)' : 'transparent',
    border: username === currentUser.username ? '1px solid var(--primary-color)' : '1px solid transparent',
    transition: 'all 0.2s',
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      style={{ width: '100%', maxWidth: '560px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <button onClick={onBack} style={{ background: 'var(--cell-bg)', border: '1px solid var(--board-border)', borderRadius: '50%', padding: '0.5rem', cursor: 'pointer', color: 'var(--text-color)', display: 'flex' }}>
          <ArrowLeft size={18} />
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold', color: 'var(--text-color)', fontSize: '1.2rem' }}>
          <Trophy size={20} style={{ color: '#FFD700' }} />
          Leaderboard
        </div>
      </div>

      {/* Game Type Toggle */}
      <div style={{ display: 'flex', background: 'var(--cell-bg)', borderRadius: 'var(--radius)', padding: '4px', gap: '4px' }}>
        <TabBtn active={gameTab === 'classic'}  onClick={() => setGameTab('classic')}>
          <Grid3X3 size={15} /> Classic (3×3)
        </TabBtn>
        <TabBtn active={gameTab === 'infinity'} onClick={() => setGameTab('infinity')}>
          <Grid size={15} /> Infinity (15×15)
        </TabBtn>
      </div>

      {/* Ranking Type Toggle */}
      <div style={{ display: 'flex', background: 'var(--cell-bg)', borderRadius: 'var(--radius)', padding: '4px', gap: '4px' }}>
        <TabBtn active={rankingTab === 'wins'}  onClick={() => setRankingTab('wins')}>
          <Trophy size={15} /> Most Wins
        </TabBtn>
        <TabBtn active={rankingTab === 'ratio'} onClick={() => setRankingTab('ratio')}>
          <Zap size={15} /> Best W-L
        </TabBtn>
      </div>

      {/* Table */}
      <div className="glass-panel" style={{ padding: '1rem', borderRadius: 'var(--radius)' }}>
        {/* Column Headers */}
        <div style={{
          display: 'grid', gridTemplateColumns: '36px 1fr auto auto auto',
          gap: '0.5rem', padding: '0.4rem 1rem 0.75rem',
          fontSize: '0.75rem', fontWeight: 'bold', opacity: 0.5,
          color: 'var(--text-color)', textTransform: 'uppercase', letterSpacing: '0.5px',
        }}>
          <span>#</span>
          <span>Player</span>
          <span style={{ textAlign: 'center' }}>W</span>
          <span style={{ textAlign: 'center' }}>L</span>
          <span style={{ textAlign: 'center' }}>{rankingTab === 'ratio' ? 'W-L' : 'D'}</span>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-color)', opacity: 0.5 }}>
            Loading rankings...
          </div>
        ) : ranked.length === 0 || ranked.every(p => wins(p) === 0 && losses(p) === 0) ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-color)', opacity: 0.5 }}>
            No {gameTab === 'classic' ? 'Classic' : 'Infinity'} games played yet!<br />
            <span style={{ fontSize: '0.85rem' }}>Be the first to play online {gameTab === 'classic' ? '3×3' : '15×15'}!</span>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {ranked.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                style={rowStyle(p.username, i)}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <RankIcon rank={i + 1} />
                </div>
                <div style={{ fontWeight: p.username === currentUser.username ? 'bold' : 'normal', color: 'var(--text-color)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.9rem' }}>
                  {p.username}
                  {p.username === currentUser.username && (
                    <span style={{ marginLeft: '0.4rem', fontSize: '0.7rem', opacity: 0.6 }}>(you)</span>
                  )}
                </div>
                <span style={{ color: '#4ade80', fontWeight: 'bold', textAlign: 'center', minWidth: '28px' }}>{wins(p)}</span>
                <span style={{ color: '#f87171', fontWeight: 'bold', textAlign: 'center', minWidth: '28px' }}>{losses(p)}</span>
                <span style={{
                  color: rankingTab === 'ratio'
                    ? (wins(p) - losses(p) >= 0 ? '#4ade80' : '#f87171')
                    : 'var(--text-color)',
                  fontWeight: 'bold', textAlign: 'center', minWidth: '28px',
                  opacity: rankingTab === 'wins' ? 0.7 : 1,
                }}>
                  {rankingTab === 'ratio'
                    ? (wins(p) - losses(p) > 0 ? '+' : '') + (wins(p) - losses(p))
                    : draws(p)}
                </span>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <p style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-color)', opacity: 0.5 }}>
        Your row is highlighted · Rankings update after every online game 🚀
      </p>
    </motion.div>
  );
};
