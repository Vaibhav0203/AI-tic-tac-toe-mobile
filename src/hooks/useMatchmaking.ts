import { useState, useEffect, useRef } from 'react';
import {
  collection, query, where, getDocs, addDoc,
  doc, onSnapshot, serverTimestamp, deleteDoc, limit,
  runTransaction,
} from 'firebase/firestore';
import { db } from '../utils/firebase';
import { AuthUser } from '../contexts/AuthContext';

export type MatchStatus = 'idle' | 'searching' | 'matched';

export interface MatchState {
  status: MatchStatus;
  gameId: string | null;
  mySymbol: 'X' | 'O' | null;
}

export function useMatchmaking(currentUser: AuthUser | null) {
  const [matchState, setMatchState] = useState<MatchState>({
    status: 'idle',
    gameId: null,
    mySymbol: null,
  });

  const matchmakingDocId = useRef<string | null>(null);
  const myDocUnsubRef  = useRef<(() => void) | null>(null);
  const lobbyUnsubRef  = useRef<(() => void) | null>(null);
  const isClaimingRef  = useRef(false);

  // ──────────────────────────────────────────────────────────
  // Try to atomically claim a waiting opponent
  // ──────────────────────────────────────────────────────────
  const tryClaimOpponent = async (myDocId: string) => {
    if (!currentUser || isClaimingRef.current) return;

    // Simple query — no != operator (avoids needing composite index)
    const snap = await getDocs(
      query(collection(db, 'matchmaking'), where('status', '==', 'waiting'), limit(10))
    );

    // Filter client-side: exclude ourselves
    const opponent = snap.docs.find(
      (d) => d.id !== myDocId && d.data().userId !== currentUser.id
    );
    if (!opponent) return;

    isClaimingRef.current = true;

    try {
      const gameId = await runTransaction(db, async (tx) => {
        const opponentRef = doc(db, 'matchmaking', opponent.id);
        const opponentSnap = await tx.get(opponentRef);

        // Bail if someone else already claimed this player
        if (!opponentSnap.exists() || opponentSnap.data()?.status !== 'waiting') {
          throw new Error('TAKEN');
        }

        const od = opponentSnap.data();

        // Auto-ID for the new game
        const gameRef = doc(collection(db, 'games'));

        tx.set(gameRef, {
          playerX:   od.username,
          playerXId: od.userId,
          playerO:   currentUser.username,
          playerOId: currentUser.id,
          board:       Array(9).fill(''),
          currentTurn: 'X',
          status:      'active',
          winner:      null,
          createdAt:   serverTimestamp(),
          lastMoveAt:  serverTimestamp(),
        });

        // Notify Player X (opponent) with the gameId
        tx.update(opponentRef, { status: 'matched', gameId: gameRef.id });

        // Remove our own queue doc (we're Player O, no longer need it)
        tx.delete(doc(db, 'matchmaking', myDocId));

        return gameRef.id;
      });

      // Clean up listeners
      myDocUnsubRef.current?.();  myDocUnsubRef.current = null;
      lobbyUnsubRef.current?.();  lobbyUnsubRef.current = null;
      matchmakingDocId.current = null;

      setMatchState({ status: 'matched', gameId, mySymbol: 'O' });
    } catch (err: any) {
      isClaimingRef.current = false;
      if (err?.message !== 'TAKEN') console.error('Matchmaking error:', err);
      // If TAKEN → just keep waiting, someone will pick us up
    }
  };

  // ──────────────────────────────────────────────────────────
  // Start searching
  // ──────────────────────────────────────────────────────────
  const findMatch = async () => {
    if (!currentUser) return;

    isClaimingRef.current = false;
    setMatchState({ status: 'searching', gameId: null, mySymbol: null });

    try {
      // 1. Add ourselves to the queue
      const myDocRef = await addDoc(collection(db, 'matchmaking'), {
        username:  currentUser.username,
        userId:    currentUser.id,
        joinedAt:  serverTimestamp(),
        status:    'waiting',
        gameId:    null,
      });
      matchmakingDocId.current = myDocRef.id;

      // 2. Listen to OUR queue doc → when an opponent sets gameId we become Player X
      const myDocUnsub = onSnapshot(doc(db, 'matchmaking', myDocRef.id), (snap) => {
        const data = snap.data();
        if (data?.status === 'matched' && data?.gameId) {
          myDocUnsubRef.current?.();  myDocUnsubRef.current = null;
          lobbyUnsubRef.current?.();  lobbyUnsubRef.current = null;
          matchmakingDocId.current = null;
          setMatchState({ status: 'matched', gameId: data.gameId, mySymbol: 'X' });
        }
      });
      myDocUnsubRef.current = myDocUnsub;

      // 3. Listen to the whole lobby — any new waiting player → try to claim
      const lobbyUnsub = onSnapshot(
        query(collection(db, 'matchmaking'), where('status', '==', 'waiting')),
        async () => {
          if (matchmakingDocId.current) {
            await tryClaimOpponent(matchmakingDocId.current);
          }
        }
      );
      lobbyUnsubRef.current = lobbyUnsub;

      // 4. Immediately try in case someone is already waiting
      await tryClaimOpponent(myDocRef.id);

    } catch (err) {
      console.error('findMatch error:', err);
      setMatchState({ status: 'idle', gameId: null, mySymbol: null });
    }
  };

  // ──────────────────────────────────────────────────────────
  // Cancel search
  // ──────────────────────────────────────────────────────────
  const cancelSearch = async () => {
    myDocUnsubRef.current?.();  myDocUnsubRef.current = null;
    lobbyUnsubRef.current?.();  lobbyUnsubRef.current = null;
    isClaimingRef.current = false;

    if (matchmakingDocId.current) {
      try { await deleteDoc(doc(db, 'matchmaking', matchmakingDocId.current)); } catch {}
      matchmakingDocId.current = null;
    }
    setMatchState({ status: 'idle', gameId: null, mySymbol: null });
  };

  const resetMatch = () => {
    isClaimingRef.current = false;
    setMatchState({ status: 'idle', gameId: null, mySymbol: null });
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      myDocUnsubRef.current?.();
      lobbyUnsubRef.current?.();
    };
  }, []);

  return { matchState, findMatch, cancelSearch, resetMatch };
}
