import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOnlineGame, getWinningCells } from '../hooks/useOnlineGame';
import { AuthUser } from '../contexts/AuthContext';
import { ArrowLeft, Wifi, Loader2 } from 'lucide-react';

interface OnlineGameProps {
  gameId:      string;
  currentUser: AuthUser;
  mySymbol:    'X' | 'O';
  onBack:      () => void;
}

export const OnlineGame: React.FC<OnlineGameProps> = ({ gameId, currentUser, mySymbol, onBack }) => {
  const { gameState, loading, makeMove } = useOnlineGame(gameId, currentUser, mySymbol);

  if (loading || !gameState) {
    return (
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'60vh', gap:'1rem' }}>
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
          <Loader2 size={40} style={{ color: 'var(--primary-color)' }} />
        </motion.div>
        <p style={{ color: 'var(--text-color)', opacity: 0.7 }}>Connecting to game...</p>
      </div>
    );
  }

  const gt           = gameState.gameType ?? 'classic';
  const GRID_SIZE    = gt === 'infinity' ? 15 : 3;
  const isMyTurn     = gameState.currentTurn === mySymbol && gameState.status === 'active';
  const opponentName = mySymbol === 'X' ? gameState.playerO : gameState.playerX;
  const isFinished   = gameState.status === 'finished';
  const winCells     = isFinished ? getWinningCells(gameState.board, gt) : [];
  const iWon         = isFinished && gameState.winner === currentUser.username;
  const isDraw       = isFinished && gameState.winner === 'draw';
  const iLost        = isFinished && !iWon && !isDraw;

  // Cell sizing: smaller for infinity
  const cellPx = gt === 'infinity' ? 34 : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      style={{ width: '100%', maxWidth: gt === 'infinity' ? '600px' : '480px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
    >
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
        <button onClick={onBack} style={{ background:'var(--cell-bg)', border:'1px solid var(--board-border)', borderRadius:'50%', padding:'0.5rem', cursor:'pointer', color:'var(--text-color)', display:'flex' }}>
          <ArrowLeft size={18} />
        </button>
        <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', color:'var(--primary-color)', fontWeight:'bold' }}>
          <Wifi size={16} />
          <span>Online · {gt === 'infinity' ? 'Infinity (15×15, 5 in a row)' : 'Classic (3×3)'}</span>
        </div>
      </div>

      {/* Players Bar */}
      <div className="glass-panel" style={{ padding:'1rem', borderRadius:'var(--radius)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ textAlign:'center', flex:1 }}>
          <div style={{ fontSize:'1.4rem', fontWeight:900, color:'var(--primary-color)' }}>X</div>
          <div style={{ fontSize:'0.8rem', color:'var(--text-color)', opacity:0.8, fontWeight:'bold', maxWidth:'120px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
            {gameState.playerX}{mySymbol === 'X' ? ' (You)' : ''}
          </div>
        </div>
        <div style={{ textAlign:'center', flex:1 }}>
          {isFinished ? (
            <div style={{ fontSize:'0.85rem', color: iWon ? '#4ade80' : iLost ? '#f87171' : 'var(--text-color)', fontWeight:'bold' }}>
              {isDraw ? 'Draw!' : iWon ? '🏆 You Won!' : '😞 You Lost'}
            </div>
          ) : (
            <motion.div
              animate={isMyTurn ? { scale: [1, 1.15, 1] } : {}}
              transition={{ repeat: Infinity, duration: 1.2 }}
              style={{ fontSize:'0.82rem', fontWeight:'bold', color: isMyTurn ? 'var(--primary-color)' : 'var(--secondary-color)' }}
            >
              {isMyTurn ? 'Your Turn' : `${opponentName}'s Turn`}
            </motion.div>
          )}
        </div>
        <div style={{ textAlign:'center', flex:1 }}>
          <div style={{ fontSize:'1.4rem', fontWeight:900, color:'var(--secondary-color)' }}>O</div>
          <div style={{ fontSize:'0.8rem', color:'var(--text-color)', opacity:0.8, fontWeight:'bold', maxWidth:'120px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
            {gameState.playerO}{mySymbol === 'O' ? ' (You)' : ''}
          </div>
        </div>
      </div>

      {/* Board */}
      <div className="glass-panel" style={{ padding:'1rem', borderRadius:'var(--radius)', overflowX: gt === 'infinity' ? 'auto' : 'visible' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${GRID_SIZE}, ${cellPx ? cellPx + 'px' : '1fr'})`,
          gap: gt === 'infinity' ? '2px' : '0.5rem',
          width: gt === 'infinity' ? `${GRID_SIZE * (cellPx + 2)}px` : '100%',
          aspectRatio: gt === 'infinity' ? 'unset' : '1',
          margin: '0 auto',
        }}>
          {gameState.board.map((cell, i) => {
            const isWinCell = winCells.includes(i);
            return (
              <motion.button
                key={i}
                whileHover={!cell && isMyTurn ? { scale: 1.08 } : {}}
                whileTap={!cell && isMyTurn ? { scale: 0.92 } : {}}
                onClick={() => makeMove(i)}
                style={{
                  width:  cellPx ? `${cellPx}px` : 'auto',
                  height: cellPx ? `${cellPx}px` : 'auto',
                  aspectRatio: '1',
                  borderRadius: gt === 'infinity' ? '4px' : 'var(--radius)',
                  border: `${gt === 'infinity' ? 1 : 2}px solid ${isWinCell ? 'var(--primary-color)' : 'var(--board-border)'}`,
                  background: isWinCell ? 'rgba(99,102,241,0.25)' : 'var(--cell-bg)',
                  cursor: !cell && isMyTurn ? 'pointer' : 'default',
                  fontSize: gt === 'infinity' ? '14px' : 'clamp(1.5rem, 8vw, 2.5rem)',
                  fontWeight: 900,
                  color: cell === 'X' ? 'var(--primary-color)' : 'var(--secondary-color)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.15s',
                  padding: 0,
                }}
              >
                <AnimatePresence>
                  {cell && (
                    <motion.span
                      initial={{ scale: 0, rotate: -15 }}
                      animate={{ scale: 1, rotate: 0 }}
                      exit={{ scale: 0 }}
                    >
                      {cell}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Game Over */}
      <AnimatePresence>
        {isFinished && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel"
            style={{ padding:'1.25rem', borderRadius:'var(--radius)', textAlign:'center' }}
          >
            <div style={{ fontSize:'2rem', marginBottom:'0.5rem' }}>
              {iWon ? '🏆' : isDraw ? '🤝' : '💪'}
            </div>
            <div style={{ fontWeight:'bold', fontSize:'1.1rem', marginBottom:'0.25rem', color: iWon ? '#4ade80' : isDraw ? 'var(--text-color)' : '#f87171' }}>
              {iWon ? 'Victory!' : isDraw ? "It's a Draw!" : 'Better luck next time!'}
            </div>
            {!isDraw && (
              <div style={{ fontSize:'0.85rem', opacity:0.7, color:'var(--text-color)', marginBottom:'1rem' }}>
                {iWon ? 'Your win has been recorded 🎉' : `${gameState.winner} wins this round`}
              </div>
            )}
            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={onBack}
              style={{ padding:'0.75rem 2rem', borderRadius:'var(--radius)', background:'var(--primary-color)', color:'#fff', fontWeight:'bold', border:'none', cursor:'pointer', fontSize:'1rem' }}
            >
              Back to Dashboard
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
