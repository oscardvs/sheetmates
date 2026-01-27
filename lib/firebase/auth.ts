import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  type UserCredential,
} from "firebase/auth";
import { auth } from "./config";

export async function login(
  email: string,
  password: string
): Promise<UserCredential> {
  return signInWithEmailAndPassword(auth, email, password);
}

export async function signup(
  email: string,
  password: string
): Promise<UserCredential> {
  return createUserWithEmailAndPassword(auth, email, password);
}

export async function logout(): Promise<void> {
  return signOut(auth);
}

const googleProvider = new GoogleAuthProvider();

export async function loginWithGoogle(): Promise<UserCredential> {
  return signInWithPopup(auth, googleProvider);
}
