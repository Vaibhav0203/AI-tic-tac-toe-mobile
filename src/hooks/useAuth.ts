import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../utils/firebase';
import { hashSHA256 } from '../utils/auth';
import { AuthUser } from '../contexts/AuthContext';

export async function signUp(
  username: string,
  password: string
): Promise<{ success: boolean; user?: AuthUser; error?: string }> {
  if (!username || username.length < 3) {
    return { success: false, error: 'Username must be at least 3 characters.' };
  }
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return { success: false, error: 'Only letters, numbers, and underscores allowed.' };
  }
  if (password.length < 6) {
    return { success: false, error: 'Password must be at least 6 characters.' };
  }

  try {
    const q = query(collection(db, 'users'), where('username', '==', username));
    const snap = await getDocs(q);
    if (!snap.empty) {
      return { success: false, error: 'Username already taken. Choose another.' };
    }

    const passwordHash = await hashSHA256(password);
    const docRef = await addDoc(collection(db, 'users'), {
      username,
      passwordHash,
      createdAt: serverTimestamp(),
      classic_wins: 0,
      classic_losses: 0,
      classic_draws: 0,
      infinity_wins: 0,
      infinity_losses: 0,
      infinity_draws: 0,
      isOnline: true,
      email: null,
    });

    return { success: true, user: { id: docRef.id, username } };
  } catch {
    return { success: false, error: 'Something went wrong. Please try again.' };
  }
}

export async function signIn(
  username: string,
  password: string
): Promise<{ success: boolean; user?: AuthUser; error?: string }> {
  try {
    const q = query(collection(db, 'users'), where('username', '==', username));
    const snap = await getDocs(q);

    if (snap.empty) {
      return { success: false, error: 'Username not found.' };
    }

    const userDoc = snap.docs[0];
    const data = userDoc.data();
    const passwordHash = await hashSHA256(password);

    if (data.passwordHash !== passwordHash) {
      return { success: false, error: 'Incorrect password.' };
    }

    return { success: true, user: { id: userDoc.id, username } };
  } catch {
    return { success: false, error: 'Something went wrong. Please try again.' };
  }
}
