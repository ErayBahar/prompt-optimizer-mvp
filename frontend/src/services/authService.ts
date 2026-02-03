import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
  signOut,
  getIdToken,
} from 'firebase/auth';
import { auth } from './firebaseClient';
import { requestJson, buildUrl } from './apiClient';

export interface AuthUser {
  uid: string;
  email: string;
  name?: string | null;
  picture?: string | null;
  is_new_user?: boolean;
  custom_token?: string | null;
}

export async function loginWithEmail(email: string, password: string): Promise<AuthUser> {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  const idToken = await getIdToken(credential.user, true);

  return verifyTokenWithBackend(idToken);
}

export async function signUpWithEmail(
  email: string,
  password: string,
  displayName?: string
): Promise<AuthUser> {
  const credential = await createUserWithEmailAndPassword(auth, email, password);

  if (displayName) {
    await updateProfile(credential.user, { displayName });
  }

  const idToken = await getIdToken(credential.user, true);
  return verifyTokenWithBackend(idToken);
}

export async function loginWithGoogle(): Promise<AuthUser> {
  const provider = new GoogleAuthProvider();
  const credential = await signInWithPopup(auth, provider);
  const idToken = await getIdToken(credential.user, true);

  return verifyTokenWithBackend(idToken);
}

export async function verifyTokenWithBackend(idToken: string): Promise<AuthUser> {
  return requestJson<AuthUser>(buildUrl('/auth/verify-token'), {
    method: 'POST',
    body: JSON.stringify({ id_token: idToken }),
  });
}

export async function logout(): Promise<void> {
  await signOut(auth);
}
