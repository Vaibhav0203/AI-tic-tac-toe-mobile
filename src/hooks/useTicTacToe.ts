import { useState, useCallback, useEffect } from 'react';
import { audio } from '../utils/audio';
import { GameMode, Difficulty } from '../components/GameSettings';

export type Player = 'X' | 'O' | null;

interface Scores {
  x: number;
  o: number;
  draws: number;
}

export function useTicTacToe() {
  const [board, setBoard] = useState<Player[]>(Array(9).fill(null));
  const [xIsNext, setXIsNext] = useState<boolean>(true);
  const [gameMode, setGameMode] = useState<GameMode>('pvp');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  
  // Local storage for scores
  const [scores, setScores] = useState<Scores>(() => {
    const saved = localStorage.getItem('tictactoe-scores');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // ignore
      }
    }
    return { x: 0, o: 0, draws: 0 };
  });

  const calculateWinner = (squares: Player[]) => {
    const lines = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8],
      [0, 4, 8],
      [2, 4, 6],
    ];
    for (let i = 0; i < lines.length; i++) {
      const [a, b, c] = lines[i];
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return { winner: squares[a], line: lines[i] };
      }
    }
    return null;
  };

  const winInfo = calculateWinner(board);
  const winner = winInfo?.winner;
  const winningLine = winInfo?.line || [];
  const isDraw = !winner && board.every((square) => square !== null);

  // Update scores when game ends
  useEffect(() => {
    if (winner) {
      audio.playWin();
      setScores(prev => {
        const newScores = { ...prev, [winner.toLowerCase()]: prev[winner.toLowerCase() as keyof Scores] + 1 };
        localStorage.setItem('tictactoe-scores', JSON.stringify(newScores));
        return newScores;
      });
    } else if (isDraw) {
      audio.playDraw();
      setScores(prev => {
        const newScores = { ...prev, draws: prev.draws + 1 };
        localStorage.setItem('tictactoe-scores', JSON.stringify(newScores));
        return newScores;
      });
    }
  }, [winner, isDraw]);

  const handleClick = useCallback(
    (i: number) => {
      // If cell is filled or game is over, or if it's AI's turn
      if (board[i] || winner || isDraw) return;
      if (gameMode === 'ai' && !xIsNext) return; // Prevent human from playing during AI turn

      const newBoard = [...board];
      newBoard[i] = xIsNext ? 'X' : 'O';
      
      audio.playPop(xIsNext ? 'X' : 'O');
      
      setBoard(newBoard);
      setXIsNext(!xIsNext);
    },
    [board, xIsNext, winner, isDraw, gameMode]
  );

  // Helper for Minimax
  const minimax = (squares: Player[], depth: number, isMaximizing: boolean): number => {
    const result = calculateWinner(squares);
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

  const getBestMove = (squares: Player[]): number => {
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

        if (difficulty === 'easy') {
          aiMove = getRandomMove(board);
        } else if (difficulty === 'medium') {
          // 50% random, 50% best move
          if (Math.random() > 0.5) {
            aiMove = getBestMove([...board]);
          } else {
            aiMove = getRandomMove(board);
          }
        } else if (difficulty === 'hard') {
          aiMove = getBestMove([...board]);
        }

        if (aiMove !== -1) {
          const newBoard = [...board];
          newBoard[aiMove] = 'O';
          
          audio.playPop('O');
          
          setBoard(newBoard);
          setXIsNext(true);
        }
      }, 500); // Add a small delay for realism

      return () => clearTimeout(timer);
    }
  }, [board, xIsNext, gameMode, difficulty, winner, isDraw]);

  const resetGame = useCallback(() => {
    setBoard(Array(9).fill(null));
    setXIsNext(true);
  }, []);
  
  const resetScores = useCallback(() => {
    setScores({ x: 0, o: 0, draws: 0 });
    localStorage.removeItem('tictactoe-scores');
  }, []);

  return {
    board,
    xIsNext,
    winner,
    winningLine,
    isDraw,
    scores,
    gameMode,
    setGameMode,
    difficulty,
    setDifficulty,
    handleClick,
    resetGame,
    resetScores
  };
}
