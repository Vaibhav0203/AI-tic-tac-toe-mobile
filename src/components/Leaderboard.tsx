import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '../utils/firebase';
import { AuthUser } from '../contexts/AuthContext';
import { ArrowLeft, Trophy, Zap, Crown, Medal, Award } from 'lucide-react';

interface PlayerStats {
  id: string;
  username: string;
  online_wins: number;
  online_losses: number;
  online_draws: number;
}

interface LeaderboardProps {
  currentUser: AuthUser;
  onBack: () => void;
}

const RankIcon: React.FC<{ rank: number }> = ({ rank }) => {
  if (rank === 1) return <Crown size={18} style={{ color: '#FFD700' }} />;
  if (rank === 2) return <Medal size={18} style={{ color: '#C0C0C0' }} />;
  if (rank === 3) return <Award size={18} style={{ color: '#CD7F32' }} />;
  return <span style={{ fontWeight: 'bold', fontSize: '0.85rem', minWidth: '18px', textAlign: 'center' }}>#{rank}</span>;
};

export const Leaderboard: React.FC<LeaderboardProps> = ({ currentUser, onBack }) => {
  const [players, setPlayers] = useState<PlayerStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'wins' | 'ratio'>('wins');

  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        const snap = await getDocs(query(collection(db, 'users'), orderBy('online_wins', 'desc')));
        const data: PlayerStats[] = snap.docs.map(d => ({
          id: d.id,
          username: d.data().username,
          online_wins: d.data().online_wins || 0,
          online_losses: d.data().online_losses || 0,
          online_draws: d.data().online_draws || 0,
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

  const byWins = [...players].sort((a, b) => b.online_wins - a.online_wins);
  const byRatio = [...players].sort((a, b) => (b.online_wins - b.online_losses) - (a.online_wins - a.online_losses));
  const ranked = activeTab === 'wins' ? byWins : byRatio;

  const rowStyle = (username: string, i: number): React.CSSProperties => ({
    display: 'grid',
    gridTemplateColumns: '36px 1fr auto auto auto',
    gap: '0.5rem',
    alignItems: 'center',
    padding: '0.75rem 1rem',
    borderRadius: 'var(--radius)',
    background: username === currentUser.username
      ? 'rgba(var(--primary-rgb,99,102,241),0.18)'
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

      {/* Tab Toggle */}
      <div style={{ display: 'flex', background: 'var(--cell-bg)', borderRadius: 'var(--radius)', padding: '4px', gap: '4px' }}>
        <button
          onClick={() => setActiveTab('wins')}
          style={{
            flex: 1, padding: '0.6rem', border: 'none', borderRadius: 'calc(var(--radius) - 2px)',
            background: activeTab === 'wins' ? 'var(--primary-color)' : 'transparent',
            color: activeTab === 'wins' ? '#fff' : 'var(--text-color)',
            fontWeight: 'bold', cursor: 'pointer', fontSize: '0.9rem',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', transition: 'all 0.25s',
          }}
        >
          <Trophy size={15} /> Most Wins
        </button>
        <button
          onClick={() => setActiveTab('ratio')}
          style={{
            flex: 1, padding: '0.6rem', border: 'none', borderRadius: 'calc(var(--radius) - 2px)',
            background: activeTab === 'ratio' ? 'var(--primary-color)' : 'transparent',
            color: activeTab === 'ratio' ? '#fff' : 'var(--text-color)',
            fontWeight: 'bold', cursor: 'pointer', fontSize: '0.9rem',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', transition: 'all 0.25s',
          }}
        >
          <Zap size={15} /> Best W-L
        </button>
      </div>

      {/* Table */}
      <div className="glass-panel" style={{ padding: '1rem', borderRadius: 'var(--radius)' }}>
        {/* Column Headers */}
        <div style={{
          display: 'grid', gridTemplateColumns: '36px 1fr auto auto auto',
          gap: '0.5rem', padding: '0.4rem 1rem 0.75rem',
          fontSize: '0.75rem', fontWeight: 'bold', opacity: 0.5, color: 'var(--text-color)',
          textTransform: 'uppercase', letterSpacing: '0.5px',
        }}>
          <span>#</span>
          <span>Player</span>
          <span style={{ textAlign: 'center' }}>W</span>
          <span style={{ textAlign: 'center' }}>L</span>
          <span style={{ textAlign: 'center' }}>{activeTab === 'ratio' ? 'W-L' : 'D'}</span>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-color)', opacity: 0.5 }}>
            Loading rankings...
          </div>
        ) : ranked.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-color)', opacity: 0.5 }}>
            No players yet. Be the first to play online!
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
                <span style={{ color: '#4ade80', fontWeight: 'bold', textAlign: 'center', minWidth: '28px' }}>{p.online_wins}</span>
                <span style={{ color: '#f87171', fontWeight: 'bold', textAlign: 'center', minWidth: '28px' }}>{p.online_losses}</span>
                <span style={{ color: activeTab === 'ratio' ? (p.online_wins - p.online_losses >= 0 ? '#4ade80' : '#f87171') : 'var(--text-color)', fontWeight: 'bold', textAlign: 'center', minWidth: '28px', opacity: activeTab === 'wins' ? 0.7 : 1 }}>
                  {activeTab === 'ratio' ? (p.online_wins - p.online_losses > 0 ? '+' : '') + (p.online_wins - p.online_losses) : p.online_draws}
                </span>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Current user highlight note */}
      {!loading && ranked.length > 0 && (
        <p style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-color)', opacity: 0.5 }}>
          Your row is highlighted. Keep playing to climb the ranks! 🚀
        </p>
      )}
    </motion.div>
  );
};
