import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOnlineGame } from '../hooks/useOnlineGame';
import { AuthUser } from '../contexts/AuthContext';
import { ArrowLeft, Wifi, Loader2, Trophy, Minus } from 'lucide-react';

interface OnlineGameProps {
  gameId: string;
  currentUser: AuthUser;
  mySymbol: 'X' | 'O';
  onBack: () => void;
}

const WINNING_COMBOS = [
  [0,1,2],[3,4,5],[6,7,8],
  [0,3,6],[1,4,7],[2,5,8],
  [0,4,8],[2,4,6],
];

function getWinningCells(board: string[]): number[] {
  for (const [a,b,c] of WINNING_COMBOS) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) return [a,b,c];
  }
  return [];
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

  const isMyTurn = gameState.currentTurn === mySymbol && gameState.status === 'active';
  const opponentName = mySymbol === 'X' ? gameState.playerO : gameState.playerX;
  const isFinished = gameState.status === 'finished';
  const winningCells = isFinished ? getWinningCells(gameState.board) : [];
  const iWon = isFinished && gameState.winner === currentUser.username;
  const isDraw = isFinished && gameState.winner === 'draw';
  const iLost = isFinished && !iWon && !isDraw;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      style={{ width: '100%', maxWidth: '480px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
    >
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
        <button onClick={onBack} style={{ background:'var(--cell-bg)', border:'1px solid var(--board-border)', borderRadius:'50%', padding:'0.5rem', cursor:'pointer', color:'var(--text-color)', display:'flex' }}>
          <ArrowLeft size={18} />
        </button>
        <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', color:'var(--primary-color)', fontWeight:'bold' }}>
          <Wifi size={16} />
          <span>Online Match</span>
        </div>
      </div>

      {/* Players Bar */}
      <div className="glass-panel" style={{ padding:'1rem', borderRadius:'var(--radius)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        {/* Player X */}
        <div style={{ textAlign:'center', flex:1 }}>
          <div style={{ fontSize:'1.4rem', fontWeight:900, color:'var(--primary-color)' }}>X</div>
          <div style={{ fontSize:'0.8rem', color:'var(--text-color)', opacity:0.8, fontWeight:'bold', maxWidth:'120px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
            {gameState.playerX} {mySymbol === 'X' ? '(You)' : ''}
          </div>
        </div>

        {/* Turn indicator */}
        <div style={{ textAlign:'center', flex:1 }}>
          {isFinished ? (
            <div style={{ fontSize:'0.85rem', color: iWon ? '#4ade80' : iLost ? '#f87171' : 'var(--text-color)', fontWeight:'bold' }}>
              {isDraw ? 'Draw!' : iWon ? '🏆 You Won!' : '😞 You Lost'}
            </div>
          ) : (
            <div style={{ fontSize:'0.8rem', color:'var(--text-color)', opacity:0.7 }}>
              <motion.div
                animate={isMyTurn ? { scale: [1, 1.15, 1] } : {}}
                transition={{ repeat: Infinity, duration: 1.2 }}
                style={{ fontWeight:'bold', color: isMyTurn ? 'var(--primary-color)' : 'var(--secondary-color)' }}
              >
                {isMyTurn ? 'Your Turn' : `${opponentName}'s Turn`}
              </motion.div>
            </div>
          )}
        </div>

        {/* Player O */}
        <div style={{ textAlign:'center', flex:1 }}>
          <div style={{ fontSize:'1.4rem', fontWeight:900, color:'var(--secondary-color)' }}>O</div>
          <div style={{ fontSize:'0.8rem', color:'var(--text-color)', opacity:0.8, fontWeight:'bold', maxWidth:'120px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
            {gameState.playerO} {mySymbol === 'O' ? '(You)' : ''}
          </div>
        </div>
      </div>

      {/* Board */}
      <div className="glass-panel" style={{ padding:'1.25rem', borderRadius:'var(--radius)' }}>
        <div style={{
          display:'grid', gridTemplateColumns:'repeat(3, 1fr)',
          gap:'0.5rem', aspectRatio:'1',
        }}>
          {gameState.board.map((cell, i) => {
            const isWinCell = winningCells.includes(i);
            return (
              <motion.button
                key={i}
                whileHover={!cell && isMyTurn ? { scale: 1.05 } : {}}
                whileTap={!cell && isMyTurn ? { scale: 0.95 } : {}}
                onClick={() => makeMove(i)}
                style={{
                  aspectRatio:'1',
                  borderRadius:'var(--radius)',
                  border: `2px solid ${isWinCell ? 'var(--primary-color)' : 'var(--board-border)'}`,
                  background: isWinCell ? 'rgba(var(--primary-rgb,99,102,241),0.2)' : 'var(--cell-bg)',
                  cursor: !cell && isMyTurn ? 'pointer' : 'default',
                  fontSize:'clamp(1.5rem, 8vw, 2.5rem)',
                  fontWeight:900,
                  color: cell === 'X' ? 'var(--primary-color)' : 'var(--secondary-color)',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  transition:'all 0.2s',
                }}
              >
                <AnimatePresence>
                  {cell && (
                    <motion.span
                      initial={{ scale: 0, rotate: -20 }}
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

      {/* Game Over Actions */}
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
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onBack}
              className="play-button"
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
