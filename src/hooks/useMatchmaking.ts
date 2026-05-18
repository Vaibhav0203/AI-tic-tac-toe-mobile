import { useState, useEffect, useRef } from 'react';
import {
  collection, query, where, getDocs, addDoc,
  doc, onSnapshot, serverTimestamp, deleteDoc, limit,
  runTransaction,
} from 'firebase/firestore';
import { db } from '../utils/firebase';
import { AuthUser } from '../contexts/AuthContext';

export type MatchStatus = 'idle' | 'searching' | 'matched';
export type OnlineGameType = 'classic' | 'infinity';

export interface MatchState {
  status: MatchStatus;
  gameId: string | null;
  mySymbol: 'X' | 'O' | null;
  gameType: OnlineGameType;
}

export function useMatchmaking(currentUser: AuthUser | null) {
  const [matchState, setMatchState] = useState<MatchState>({
    status: 'idle',
    gameId: null,
    mySymbol: null,
    gameType: 'classic',
  });

  const matchmakingDocId = useRef<string | null>(null);
  const myDocUnsubRef   = useRef<(() => void) | null>(null);
  const lobbyUnsubRef   = useRef<(() => void) | null>(null);
  const isClaimingRef   = useRef(false);
  const gameTypeRef     = useRef<OnlineGameType>('classic');

  const tryClaimOpponent = async (myDocId: string) => {
    if (!currentUser || isClaimingRef.current) return;

    const snap = await getDocs(
      query(collection(db, 'matchmaking'), where('status', '==', 'waiting'), limit(10))
    );

    // Filter client-side: exclude ourselves AND match same game type
    const opponent = snap.docs.find(
      (d) =>
        d.id !== myDocId &&
        d.data().userId !== currentUser.id &&
        d.data().gameType === gameTypeRef.current
    );
    if (!opponent) return;

    isClaimingRef.current = true;

    try {
      const boardSize = gameTypeRef.current === 'classic' ? 9 : 225;

      const gameId = await runTransaction(db, async (tx) => {
        const opponentRef  = doc(db, 'matchmaking', opponent.id);
        const opponentSnap = await tx.get(opponentRef);

        if (!opponentSnap.exists() || opponentSnap.data()?.status !== 'waiting') {
          throw new Error('TAKEN');
        }

        const od      = opponentSnap.data();
        const gameRef = doc(collection(db, 'games'));

        tx.set(gameRef, {
          playerX:     od.username,
          playerXId:   od.userId,
          playerO:     currentUser.username,
          playerOId:   currentUser.id,
          gameType:    gameTypeRef.current,
          board:       Array(boardSize).fill(''),
          currentTurn: 'X',
          status:      'active',
          winner:      null,
          createdAt:   serverTimestamp(),
          lastMoveAt:  serverTimestamp(),
        });

        tx.update(opponentRef, { status: 'matched', gameId: gameRef.id });
        tx.delete(doc(db, 'matchmaking', myDocId));

        return gameRef.id;
      });

      myDocUnsubRef.current?.(); myDocUnsubRef.current = null;
      lobbyUnsubRef.current?.(); lobbyUnsubRef.current = null;
      matchmakingDocId.current = null;

      setMatchState({ status: 'matched', gameId, mySymbol: 'O', gameType: gameTypeRef.current });
    } catch (err: any) {
      isClaimingRef.current = false;
      if (err?.message !== 'TAKEN') console.error('Matchmaking error:', err);
    }
  };

  const findMatch = async (gameType: OnlineGameType) => {
    if (!currentUser) return;

    isClaimingRef.current = false;
    gameTypeRef.current   = gameType;
    setMatchState({ status: 'searching', gameId: null, mySymbol: null, gameType });

    try {
      const myDocRef = await addDoc(collection(db, 'matchmaking'), {
        username: currentUser.username,
        userId:   currentUser.id,
        gameType,
        joinedAt: serverTimestamp(),
        status:   'waiting',
        gameId:   null,
      });
      matchmakingDocId.current = myDocRef.id;

      // Listen to our own doc — opponent sets gameId when they claim us (we become X)
      const myDocUnsub = onSnapshot(doc(db, 'matchmaking', myDocRef.id), (snap) => {
        const data = snap.data();
        if (data?.status === 'matched' && data?.gameId) {
          myDocUnsubRef.current?.(); myDocUnsubRef.current = null;
          lobbyUnsubRef.current?.(); lobbyUnsubRef.current = null;
          matchmakingDocId.current = null;
          setMatchState({ status: 'matched', gameId: data.gameId, mySymbol: 'X', gameType });
        }
      });
      myDocUnsubRef.current = myDocUnsub;

      // Listen to lobby — when anyone joins, try to claim them
      const lobbyUnsub = onSnapshot(
        query(collection(db, 'matchmaking'), where('status', '==', 'waiting')),
        async () => {
          if (matchmakingDocId.current) await tryClaimOpponent(matchmakingDocId.current);
        }
      );
      lobbyUnsubRef.current = lobbyUnsub;

      // Immediately try to claim an existing waiting player
      await tryClaimOpponent(myDocRef.id);
    } catch (err) {
      console.error('findMatch error:', err);
      setMatchState({ status: 'idle', gameId: null, mySymbol: null, gameType });
    }
  };

  const cancelSearch = async () => {
    myDocUnsubRef.current?.(); myDocUnsubRef.current = null;
    lobbyUnsubRef.current?.(); lobbyUnsubRef.current = null;
    isClaimingRef.current = false;

    if (matchmakingDocId.current) {
      try { await deleteDoc(doc(db, 'matchmaking', matchmakingDocId.current)); } catch {}
      matchmakingDocId.current = null;
    }
    setMatchState({ status: 'idle', gameId: null, mySymbol: null, gameType: gameTypeRef.current });
  };

  const resetMatch = () => {
    isClaimingRef.current = false;
    setMatchState({ status: 'idle', gameId: null, mySymbol: null, gameType: gameTypeRef.current });
  };

  useEffect(() => {
    return () => {
      myDocUnsubRef.current?.();
      lobbyUnsubRef.current?.();
    };
  }, []);

  return { matchState, findMatch, cancelSearch, resetMatch };
}
