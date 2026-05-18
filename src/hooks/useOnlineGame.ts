import { useState, useEffect } from 'react';
import { doc, onSnapshot, updateDoc, serverTimestamp, increment } from 'firebase/firestore';
import { db } from '../utils/firebase';
import { AuthUser } from '../contexts/AuthContext';

const WINNING_COMBOS = [
  [0,1,2],[3,4,5],[6,7,8],
  [0,3,6],[1,4,7],[2,5,8],
  [0,4,8],[2,4,6],
];

function checkWinner(board: string[]): string | null {
  for (const [a, b, c] of WINNING_COMBOS) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) return board[a];
  }
  return null;
}

export interface OnlineGameState {
  board: string[];
  currentTurn: 'X' | 'O';
  status: 'active' | 'finished' | 'abandoned';
  winner: string | null;
  playerX: string;
  playerXId: string;
  playerO: string;
  playerOId: string;
}

export function useOnlineGame(
  gameId: string | null,
  currentUser: AuthUser | null,
  mySymbol: 'X' | 'O' | null
) {
  const [gameState, setGameState] = useState<OnlineGameState | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!gameId) return;
    const unsub = onSnapshot(doc(db, 'games', gameId), (snap) => {
      if (!snap.exists()) return;
      setGameState(snap.data() as OnlineGameState);
      setLoading(false);
    });
    return () => unsub();
  }, [gameId]);

  const makeMove = async (index: number) => {
    if (!gameId || !gameState || !currentUser || !mySymbol) return;
    if (gameState.status !== 'active') return;
    if (gameState.currentTurn !== mySymbol) return;
    if (gameState.board[index] !== '') return;

    const newBoard = [...gameState.board];
    newBoard[index] = mySymbol;

    const winnerSymbol = checkWinner(newBoard);
    const isDraw = !winnerSymbol && newBoard.every(c => c !== '');
    const isFinished = !!winnerSymbol || isDraw;

    let winnerUsername: string | null = null;
    if (winnerSymbol) {
      winnerUsername = winnerSymbol === 'X' ? gameState.playerX : gameState.playerO;
    } else if (isDraw) {
      winnerUsername = 'draw';
    }

    await updateDoc(doc(db, 'games', gameId), {
      board: newBoard,
      currentTurn: mySymbol === 'X' ? 'O' : 'X',
      lastMoveAt: serverTimestamp(),
      ...(isFinished ? { status: 'finished', winner: winnerUsername } : {}),
    });

    // Update stats — only the player making the final move updates both players' stats
    if (isFinished) {
      const xId = gameState.playerXId;
      const oId = gameState.playerOId;
      if (isDraw) {
        await updateDoc(doc(db, 'users', xId), { online_draws: increment(1) });
        await updateDoc(doc(db, 'users', oId), { online_draws: increment(1) });
      } else {
        const winnerId = winnerSymbol === 'X' ? xId : oId;
        const loserId = winnerSymbol === 'X' ? oId : xId;
        await updateDoc(doc(db, 'users', winnerId), { online_wins: increment(1) });
        await updateDoc(doc(db, 'users', loserId), { online_losses: increment(1) });
      }
    }
  };

  return { gameState, loading, makeMove };
}
