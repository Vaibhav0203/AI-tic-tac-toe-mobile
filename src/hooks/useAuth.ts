import { collection, query, where, getDocs, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  sendPasswordResetEmail,
  verifyPasswordResetCode,
  confirmPasswordReset
} from 'firebase/auth';
import { db, auth } from '../utils/firebase';
import { AuthUser } from '../contexts/AuthContext';

export async function signUp(
  username: string,
  email: string,
  password: string,
  subscribedToNewsletter: boolean = true
): Promise<{ success: boolean; user?: AuthUser; error?: string }> {
  // Validations
  if (!username || username.length < 3) {
    return { success: false, error: 'Username must be at least 3 characters.' };
  }
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return { success: false, error: 'Only letters, numbers, and underscores allowed.' };
  }
  if (!email || !email.includes('@') || !email.includes('.')) {
    return { success: false, error: 'Please enter a valid email address.' };
  }
  if (password.length < 6) {
    return { success: false, error: 'Password must be at least 6 characters.' };
  }

  try {
    // 1. Check if Username is already taken in Firestore
    const usernameQuery = query(collection(db, 'users'), where('username', '==', username));
    const usernameSnap = await getDocs(usernameQuery);
    if (!usernameSnap.empty) {
      return { success: false, error: 'Username already taken. Choose another.' };
    }

    // 2. Check if Email is already in use in Firestore (additional safety layer)
    const emailQuery = query(collection(db, 'users'), where('email', '==', email));
    const emailSnap = await getDocs(emailQuery);
    if (!emailSnap.empty) {
      return { success: false, error: 'Email already registered. Try logging in.' };
    }

    // 3. Create Firebase Authentication User
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const uid = userCredential.user.uid;

    // 4. Create User Profile document in Firestore using UID as document key
    await setDoc(doc(db, 'users', uid), {
      username,
      email,
      subscribedToNewsletter,
      createdAt: serverTimestamp(),
      classic_wins: 0,
      classic_losses: 0,
      classic_draws: 0,
      infinity_wins: 0,
      infinity_losses: 0,
      infinity_draws: 0,
      isOnline: true,
    });

    return { success: true, user: { id: uid, username } };
  } catch (error: any) {
    console.error('Sign Up Error:', error);
    let errorMessage = 'Something went wrong. Please try again.';
    if (error.code === 'auth/email-already-in-use') {
      errorMessage = 'Email address already in use.';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'Invalid email address format.';
    } else if (error.code === 'auth/weak-password') {
      errorMessage = 'Password is too weak.';
    }
    return { success: false, error: errorMessage };
  }
}

export async function signIn(
  usernameOrEmail: string,
  password: string
): Promise<{ success: boolean; user?: AuthUser; error?: string }> {
  try {
    let email = usernameOrEmail.trim();
    let username = '';

    // 1. Resolve email from username if input is NOT an email address
    if (!email.includes('@')) {
      const q = query(collection(db, 'users'), where('username', '==', email));
      const snap = await getDocs(q);

      if (snap.empty) {
        return { success: false, error: 'Username not found.' };
      }

      const userData = snap.docs[0].data();
      email = userData.email;
      username = userData.username;
    }

    // 2. Perform native Firebase sign-in
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const uid = userCredential.user.uid;

    // 3. Fetch username if we logged in via email direct
    if (!username) {
      const q = query(collection(db, 'users'), where('email', '==', email));
      const snap = await getDocs(q);
      if (!snap.empty) {
        username = snap.docs[0].data().username;
      } else {
        username = email.split('@')[0]; // fallback
      }
    }

    return { success: true, user: { id: uid, username } };
  } catch (error: any) {
    console.error('Sign In Error:', error);
    let errorMessage = 'Incorrect credentials. Please try again.';
    if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
      errorMessage = 'Invalid username/email or password.';
    }
    return { success: false, error: errorMessage };
  }
}

export async function requestPasswordReset(
  usernameOrEmail: string
): Promise<{ success: boolean; error?: string }> {
  try {
    let email = usernameOrEmail.trim();

    // 1. Resolve email from username if input is NOT an email address
    if (!email.includes('@')) {
      const q = query(collection(db, 'users'), where('username', '==', email));
      const snap = await getDocs(q);

      if (snap.empty) {
        return { success: false, error: 'Username not found.' };
      }

      const userData = snap.docs[0].data();
      email = userData.email;
    }

    // 2. Send official Firebase password reset email using default Firebase widget
    await sendPasswordResetEmail(auth, email);
    return { success: true };
  } catch (error: any) {
    console.error('Password Reset Error:', error);
    let errorMessage = 'Failed to send password reset email.';
    if (error.code === 'auth/user-not-found') {
      errorMessage = 'No user found with this email.';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'Invalid email address.';
    }
    return { success: false, error: errorMessage };
  }
}

export async function verifyResetCode(
  oobCode: string
): Promise<{ success: boolean; email?: string; error?: string }> {
  try {
    const email = await verifyPasswordResetCode(auth, oobCode);
    return { success: true, email };
  } catch (error: any) {
    console.error('Verify Reset Code Error:', error);
    return { success: false, error: 'Invalid or expired password reset link.' };
  }
}

export async function resetPasswordWithCode(
  oobCode: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (newPassword.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters.' };
    }
    await confirmPasswordReset(auth, oobCode, newPassword);
    return { success: true };
  } catch (error: any) {
    console.error('Confirm Password Reset Error:', error);
    return { success: false, error: 'Failed to update password. Link may be expired.' };
  }
}


