import { useState, useEffect, useRef } from 'react';
import {
  collection, query, where, getDocs, addDoc,
  updateDoc, doc, onSnapshot, serverTimestamp, deleteDoc, limit,
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
  const unsubRef = useRef<(() => void) | null>(null);

  const findMatch = async () => {
    if (!currentUser) return;
    setMatchState({ status: 'searching', gameId: null, mySymbol: null });

    try {
      // Look for a waiting player (not ourselves)
      const q = query(
        collection(db, 'matchmaking'),
        where('status', '==', 'waiting'),
        where('userId', '!=', currentUser.id),
        limit(1)
      );
      const snap = await getDocs(q);

      if (!snap.empty) {
        // Found someone waiting — we become Player O
        const opponentDoc = snap.docs[0];
        const opponentData = opponentDoc.data();

        const gameRef = await addDoc(collection(db, 'games'), {
          playerX: opponentData.username,
          playerXId: opponentData.userId,
          playerO: currentUser.username,
          playerOId: currentUser.id,
          board: Array(9).fill(''),
          currentTurn: 'X',
          status: 'active',
          winner: null,
          createdAt: serverTimestamp(),
          lastMoveAt: serverTimestamp(),
        });

        // Notify waiting player (Player X)
        await updateDoc(doc(db, 'matchmaking', opponentDoc.id), {
          status: 'matched',
          gameId: gameRef.id,
        });

        setMatchState({ status: 'matched', gameId: gameRef.id, mySymbol: 'O' });
      } else {
        // No one waiting — add ourselves to the queue as Player X
        const myDocRef = await addDoc(collection(db, 'matchmaking'), {
          username: currentUser.username,
          userId: currentUser.id,
          joinedAt: serverTimestamp(),
          status: 'waiting',
          gameId: null,
        });
        matchmakingDocId.current = myDocRef.id;

        // Listen for when someone matches with us
        const unsub = onSnapshot(doc(db, 'matchmaking', myDocRef.id), (snap) => {
          const data = snap.data();
          if (data?.status === 'matched' && data?.gameId) {
            setMatchState({ status: 'matched', gameId: data.gameId, mySymbol: 'X' });
            unsub();
            unsubRef.current = null;
            // Clean up matchmaking doc
            deleteDoc(doc(db, 'matchmaking', myDocRef.id)).catch(() => {});
            matchmakingDocId.current = null;
          }
        });

        unsubRef.current = unsub;
      }
    } catch (err) {
      console.error('Matchmaking error:', err);
      setMatchState({ status: 'idle', gameId: null, mySymbol: null });
    }
  };

  const cancelSearch = async () => {
    if (unsubRef.current) { unsubRef.current(); unsubRef.current = null; }
    if (matchmakingDocId.current) {
      try { await deleteDoc(doc(db, 'matchmaking', matchmakingDocId.current)); } catch {}
      matchmakingDocId.current = null;
    }
    setMatchState({ status: 'idle', gameId: null, mySymbol: null });
  };

  const resetMatch = () => {
    setMatchState({ status: 'idle', gameId: null, mySymbol: null });
  };

  useEffect(() => {
    return () => {
      if (unsubRef.current) unsubRef.current();
    };
  }, []);

  return { matchState, findMatch, cancelSearch, resetMatch };
}
