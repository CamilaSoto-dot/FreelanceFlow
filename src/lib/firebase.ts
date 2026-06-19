import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, UserCredential } from 'firebase/auth';

// Resilient Firebase config lookup
// If keys are missing, we handle it gracefully rather than crashing on module load.
const firebaseConfig = {
  apiKey: (import.meta as any).env?.VITE_FIREBASE_API_KEY || "",
  authDomain: (import.meta as any).env?.VITE_FIREBASE_AUTH_DOMAIN || "",
  projectId: (import.meta as any).env?.VITE_FIREBASE_PROJECT_ID || "",
  storageBucket: (import.meta as any).env?.VITE_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: (import.meta as any).env?.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: (import.meta as any).env?.VITE_FIREBASE_APP_ID || ""
};

export const hasFirebaseConfig = (): boolean => {
  return !!firebaseConfig.apiKey && firebaseConfig.apiKey !== "";
};

export function getFirebaseAuth() {
  if (!hasFirebaseConfig()) {
    console.warn("Firebase Auth requires configuration keys. Running in simulator fallback mode.");
    return null;
  }
  
  const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  return getAuth(app);
}

export async function loginWithGoogleFirebase(): Promise<UserCredential | null> {
  const auth = getFirebaseAuth();
  if (!auth) return null;
  
  const provider = new GoogleAuthProvider();
  // Ensure we request the profile email
  provider.addScope('email');
  provider.addScope('profile');
  
  try {
    const result = await signInWithPopup(auth, provider);
    return result;
  } catch (error) {
    console.error("Firebase auth popup failed:", error);
    throw error;
  }
}
