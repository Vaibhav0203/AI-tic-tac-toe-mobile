import { useState, useCallback, useEffect } from 'react';
import { audio } from '../utils/audio';
import { GameMode, Difficulty } from '../components/GameSettings';
import { GameType } from '../components/Dashboard';

export type Player = 'X' | 'O' | null;

interface Scores {
  x: number;
  o: number;
  draws: number;
}

interface UseTicTacToeProps {
  gameType: GameType;
  gameMode: GameMode;
  difficulty: Difficulty;
  scores: Scores;
  setScores: (scores: Scores) => void;
}

// Helper to calculate winner on a dynamic board
function calculateDynamicWinner(squares: Player[], size: number, winLength: number) {
  // Check horizontal
  for (let row = 0; row < size; row++) {
    for (let col = 0; col <= size - winLength; col++) {
      const idx = row * size + col;
      const player = squares[idx];
      if (!player) continue;
      let won = true;
      let line = [idx];
      for (let i = 1; i < winLength; i++) {
        if (squares[idx + i] !== player) { won = false; break; }
        line.push(idx + i);
      }
      if (won) return { winner: player, line };
    }
  }

  // Check vertical
  for (let col = 0; col < size; col++) {
    for (let row = 0; row <= size - winLength; row++) {
      const idx = row * size + col;
      const player = squares[idx];
      if (!player) continue;
      let won = true;
      let line = [idx];
      for (let i = 1; i < winLength; i++) {
        if (squares[idx + i * size] !== player) { won = false; break; }
        line.push(idx + i * size);
      }
      if (won) return { winner: player, line };
    }
  }

  // Check diagonal (top-left to bottom-right)
  for (let row = 0; row <= size - winLength; row++) {
    for (let col = 0; col <= size - winLength; col++) {
      const idx = row * size + col;
      const player = squares[idx];
      if (!player) continue;
      let won = true;
      let line = [idx];
      for (let i = 1; i < winLength; i++) {
        if (squares[idx + i * (size + 1)] !== player) { won = false; break; }
        line.push(idx + i * (size + 1));
      }
      if (won) return { winner: player, line };
    }
  }

  // Check anti-diagonal (top-right to bottom-left)
  for (let row = 0; row <= size - winLength; row++) {
    for (let col = winLength - 1; col < size; col++) {
      const idx = row * size + col;
      const player = squares[idx];
      if (!player) continue;
      let won = true;
      let line = [idx];
      for (let i = 1; i < winLength; i++) {
        if (squares[idx + i * (size - 1)] !== player) { won = false; break; }
        line.push(idx + i * (size - 1));
      }
      if (won) return { winner: player, line };
    }
  }

  return null;
}

export function useTicTacToe({ gameType, gameMode, difficulty, scores, setScores }: UseTicTacToeProps) {
  const isInfinity = gameType === 'infinity';
  const boardSize = isInfinity ? 15 : 3;
  const winLength = isInfinity ? 5 : 3;
  const totalCells = boardSize * boardSize;

  const [board, setBoard] = useState<Player[]>(Array(totalCells).fill(null));
  const [xIsNext, setXIsNext] = useState<boolean>(true);

  // Reset board when gameType changes
  useEffect(() => {
    setBoard(Array(totalCells).fill(null));
    setXIsNext(true);
  }, [gameType, totalCells]);

  const winInfo = calculateDynamicWinner(board, boardSize, winLength);
  const winner = winInfo?.winner;
  const winningLine = winInfo?.line || [];
  const isDraw = !winner && board.every((square) => square !== null);

  // Update scores when game ends
  useEffect(() => {
    if (winner) {
      audio.playWin();
      setScores({ ...scores, [winner.toLowerCase()]: scores[winner.toLowerCase() as keyof Scores] + 1 });
    } else if (isDraw) {
      audio.playDraw();
      setScores({ ...scores, draws: scores.draws + 1 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [winner, isDraw]); // Intentionally omitting `scores` to prevent loop

  const handleClick = useCallback(
    (i: number) => {
      // If cell is filled or game is over, or if it's AI's turn
      if (board[i] || winner || isDraw) return;
      if (gameMode === 'ai' && !xIsNext) return; 

      const newBoard = [...board];
      newBoard[i] = xIsNext ? 'X' : 'O';
      
      audio.playPop(xIsNext ? 'X' : 'O');
      
      setBoard(newBoard);
      setXIsNext(!xIsNext);
    },
    [board, xIsNext, winner, isDraw, gameMode]
  );

  // --- Classic Minimax AI ---
  const minimax = (squares: Player[], depth: number, isMaximizing: boolean): number => {
    const result = calculateDynamicWinner(squares, 3, 3);
    if (result?.winner === 'O') return 10 - depth;
    if (result?.winner === 'X') return depth - 10;
    if (squares.every(s => s !== null)) return 0;

    if (isMaximizing) {
      let bestScore = -Infinity;
      for (let i = 0; i < squares.length; i++) {
        if (!squares[i]) {
          squares[i] = 'O';
          let score = minimax(squares, depth + 1, false);
          squares[i] = null;
          bestScore = Math.max(score, bestScore);
        }
      }
      return bestScore;
    } else {
      let bestScore = Infinity;
      for (let i = 0; i < squares.length; i++) {
        if (!squares[i]) {
          squares[i] = 'X';
          let score = minimax(squares, depth + 1, true);
          squares[i] = null;
          bestScore = Math.min(score, bestScore);
        }
      }
      return bestScore;
    }
  };

  const getBestMoveClassic = (squares: Player[]): number => {
    let bestScore = -Infinity;
    let move = -1;
    for (let i = 0; i < squares.length; i++) {
      if (!squares[i]) {
        squares[i] = 'O';
        let score = minimax(squares, 0, false);
        squares[i] = null;
        if (score > bestScore) {
          bestScore = score;
          move = i;
        }
      }
    }
    return move;
  };

  // --- Infinity Heuristic AI ---
  const getHeuristicMoveInfinity = (squares: Player[]): number => {
    // Simple heuristic: Find immediate wins or immediate blocks.
    // If none, play near existing pieces randomly.
    
    // 1. Can AI win?
    for (let i = 0; i < totalCells; i++) {
      if (!squares[i]) {
        squares[i] = 'O';
        if (calculateDynamicWinner(squares, boardSize, winLength)) {
          squares[i] = null;
          return i;
        }
        squares[i] = null;
      }
    }

    // 2. Must AI block Player X from winning?
    for (let i = 0; i < totalCells; i++) {
      if (!squares[i]) {
        squares[i] = 'X';
        if (calculateDynamicWinner(squares, boardSize, winLength)) {
          squares[i] = null;
          return i; // Block!
        }
        squares[i] = null;
      }
    }

    // 3. Just pick a random empty cell that is adjacent to an existing piece
    let adjacentEmptyCells: number[] = [];
    for (let r = 0; r < boardSize; r++) {
      for (let c = 0; c < boardSize; c++) {
        const i = r * boardSize + c;
        if (!squares[i]) {
          // Check neighbors
          let hasNeighbor = false;
          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              if (dr === 0 && dc === 0) continue;
              const nr = r + dr, nc = c + dc;
              if (nr >= 0 && nr < boardSize && nc >= 0 && nc < boardSize) {
                if (squares[nr * boardSize + nc]) hasNeighbor = true;
              }
            }
          }
          if (hasNeighbor) adjacentEmptyCells.push(i);
        }
      }
    }

    if (adjacentEmptyCells.length > 0) {
      return adjacentEmptyCells[Math.floor(Math.random() * adjacentEmptyCells.length)];
    }

    // 4. Fallback: completely random
    return getRandomMove(squares);
  };

  const getRandomMove = (squares: Player[]): number => {
    const available = squares.map((sq, i) => sq === null ? i : null).filter(val => val !== null) as number[];
    if (available.length === 0) return -1;
    return available[Math.floor(Math.random() * available.length)];
  };

  // AI Turn Logic
  useEffect(() => {
    if (gameMode === 'ai' && !xIsNext && !winner && !isDraw) {
      const timer = setTimeout(() => {
        let aiMove = -1;

        if (isInfinity) {
          if (difficulty === 'easy') {
            aiMove = getRandomMove(board);
          } else {
            // Med/Hard uses heuristic
            if (difficulty === 'medium' && Math.random() > 0.7) {
              aiMove = getRandomMove(board);
            } else {
              aiMove = getHeuristicMoveInfinity([...board]);
            }
          }
        } else {
          // Classic 3x3 AI
          if (difficulty === 'easy') {
            aiMove = getRandomMove(board);
          } else if (difficulty === 'medium') {
            if (Math.random() > 0.5) {
              aiMove = getBestMoveClassic([...board]);
            } else {
              aiMove = getRandomMove(board);
            }
          } else if (difficulty === 'hard') {
            aiMove = getBestMoveClassic([...board]);
          }
        }

        if (aiMove !== -1) {
          const newBoard = [...board];
          newBoard[aiMove] = 'O';
          
          audio.playPop('O');
          
          setBoard(newBoard);
          setXIsNext(true);
        }
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [board, xIsNext, gameMode, difficulty, winner, isDraw, isInfinity]);

  const resetGame = useCallback(() => {
    setBoard(Array(totalCells).fill(null));
    setXIsNext(true);
  }, [totalCells]);

  return {
    board,
    xIsNext,
    winner,
    winningLine,
    isDraw,
    handleClick,
    resetGame,
  };
}
