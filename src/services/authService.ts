import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  User,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth } from '../firebaseConfig';

export type AuthUser = {
  email: string | null;
  uid: string;
  emailVerified: boolean;
};

export async function signupWithEmail(
  email: string,
  password: string,
): Promise<AuthUser> {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  const user = cred.user;
  if (user && !user.emailVerified) {
    await sendEmailVerification(user);
  }
  return {
    email: user.email,
    uid: user.uid,
    emailVerified: user.emailVerified,
  };
}

export async function loginWithEmail(
  email: string,
  password: string,
): Promise<AuthUser> {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  const user = cred.user;
  return {
    email: user.email,
    uid: user.uid,
    emailVerified: user.emailVerified,
  };
}

export async function requestPasswordReset(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email);
}

export function observeAuthState(callback: (user: AuthUser | null) => void) {
  return onAuthStateChanged(auth, (user: User | null) => {
    if (!user) return callback(null);
    callback({
      email: user.email,
      uid: user.uid,
      emailVerified: user.emailVerified,
    });
  });
}
