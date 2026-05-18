import { useState, useEffect } from 'react';
import { doc, onSnapshot, updateDoc, serverTimestamp, increment } from 'firebase/firestore';
import { db } from '../utils/firebase';
import { AuthUser } from '../contexts/AuthContext';

// ── Win detection ─────────────────────────────────────────────────────────────

function checkWinner3x3(board: string[]): string | null {
  const COMBOS = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6],
  ];
  for (const [a,b,c] of COMBOS) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) return board[a];
  }
  return null;
}

function checkWinnerInfinity(board: string[]): { winner: string | null; cells: number[] } {
  const SIZE = 15;
  const WIN  = 5;
  const dirs = [[0,1],[1,0],[1,1],[1,-1]];

  for (let row = 0; row < SIZE; row++) {
    for (let col = 0; col < SIZE; col++) {
      const cell = board[row * SIZE + col];
      if (!cell) continue;
      for (const [dr, dc] of dirs) {
        const cells: number[] = [];
        for (let k = 0; k < WIN; k++) {
          const r = row + dr * k;
          const c = col + dc * k;
          if (r < 0 || r >= SIZE || c < 0 || c >= SIZE) break;
          if (board[r * SIZE + c] !== cell) break;
          cells.push(r * SIZE + c);
        }
        if (cells.length === WIN) return { winner: cell, cells };
      }
    }
  }
  return { winner: null, cells: [] };
}

export function getWinningCells(board: string[], gameType: 'classic' | 'infinity'): number[] {
  if (gameType === 'classic') {
    const COMBOS = [
      [0,1,2],[3,4,5],[6,7,8],
      [0,3,6],[1,4,7],[2,5,8],
      [0,4,8],[2,4,6],
    ];
    for (const combo of COMBOS) {
      const [a,b,c] = combo;
      if (board[a] && board[a] === board[b] && board[a] === board[c]) return combo;
    }
    return [];
  }
  return checkWinnerInfinity(board).cells;
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface OnlineGameState {
  board:       string[];
  currentTurn: 'X' | 'O';
  status:      'active' | 'finished' | 'abandoned';
  winner:      string | null;
  playerX:     string;
  playerXId:   string;
  playerO:     string;
  playerOId:   string;
  gameType:    'classic' | 'infinity';
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useOnlineGame(
  gameId:      string | null,
  currentUser: AuthUser | null,
  mySymbol:    'X' | 'O' | null
) {
  const [gameState, setGameState] = useState<OnlineGameState | null>(null);
  const [loading,   setLoading]   = useState(true);

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
    if (gameState.status !== 'active')        return;
    if (gameState.currentTurn !== mySymbol)   return;
    if (gameState.board[index] !== '')        return;

    const newBoard = [...gameState.board];
    newBoard[index] = mySymbol;

    const gt = gameState.gameType ?? 'classic';

    // Detect win / draw
    let winnerSymbol: string | null = null;
    if (gt === 'classic') {
      winnerSymbol = checkWinner3x3(newBoard);
    } else {
      winnerSymbol = checkWinnerInfinity(newBoard).winner;
    }

    const boardFull   = newBoard.every(c => c !== '');
    const isDraw      = !winnerSymbol && boardFull;
    const isFinished  = !!winnerSymbol || isDraw;

    let winnerUsername: string | null = null;
    if (winnerSymbol)    winnerUsername = winnerSymbol === 'X' ? gameState.playerX : gameState.playerO;
    else if (isDraw)     winnerUsername = 'draw';

    await updateDoc(doc(db, 'games', gameId), {
      board:       newBoard,
      currentTurn: mySymbol === 'X' ? 'O' : 'X',
      lastMoveAt:  serverTimestamp(),
      ...(isFinished ? { status: 'finished', winner: winnerUsername } : {}),
    });

    // Only the player making the final move updates both players' stats
    if (isFinished) {
      const xId    = gameState.playerXId;
      const oId    = gameState.playerOId;
      const prefix = gt === 'infinity' ? 'infinity' : 'classic';
      if (isDraw) {
        await updateDoc(doc(db, 'users', xId), { [`${prefix}_draws`]: increment(1) });
        await updateDoc(doc(db, 'users', oId), { [`${prefix}_draws`]: increment(1) });
      } else {
        const winnerId = winnerSymbol === 'X' ? xId : oId;
        const loserId  = winnerSymbol === 'X' ? oId : xId;
        await updateDoc(doc(db, 'users', winnerId), { [`${prefix}_wins`]:   increment(1) });
        await updateDoc(doc(db, 'users', loserId),  { [`${prefix}_losses`]: increment(1) });
      }
    }
  };

  return { gameState, loading, makeMove };
}
