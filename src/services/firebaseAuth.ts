import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  signOut,
  setPersistence,
  browserLocalPersistence,
  type User,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

export const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive.file',
];

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

// Configure persistent storage across browser refreshes and tab closures
setPersistence(auth, browserLocalPersistence).catch((err) => {
  console.warn('Could not set Firebase auth persistence:', err);
});

const provider = new GoogleAuthProvider();
SCOPES.forEach((scope) => provider.addScope(scope));

// Persistent Token Storage Keys (using localStorage so session remains open after closing app)
const TOKEN_STORAGE_KEY = 'stockflow_google_access_token';
const TOKEN_TIMESTAMP_KEY = 'stockflow_google_token_timestamp';
const USER_EMAIL_KEY = 'stockflow_google_user_email';

// In-memory token cache
let cachedAccessToken: string | null = null;
let isSigningIn = false;

// Helper to safely read from localStorage with sessionStorage fallback
const getStoredToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  try {
    const local = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (local) return local;
    return sessionStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
};

// Helper to safely persist token
const saveStoredToken = (token: string | null, email?: string | null) => {
  if (typeof window === 'undefined') return;
  try {
    if (token) {
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
      localStorage.setItem(TOKEN_TIMESTAMP_KEY, String(Date.now()));
      sessionStorage.setItem(TOKEN_STORAGE_KEY, token);
      if (email) {
        localStorage.setItem(USER_EMAIL_KEY, email);
      }
    } else {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      localStorage.removeItem(TOKEN_TIMESTAMP_KEY);
      localStorage.removeItem(USER_EMAIL_KEY);
      sessionStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  } catch (e) {
    console.warn('Could not persist auth token:', e);
  }
};

export const initAuth = (
  onAuthSuccess?: (user: User, token: string | null) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (!cachedAccessToken) {
        cachedAccessToken = getStoredToken();
      }
      if (user.email) {
        try {
          localStorage.setItem(USER_EMAIL_KEY, user.email);
        } catch {
          // Ignore
        }
      }
      if (onAuthSuccess) {
        onAuthSuccess(user, cachedAccessToken);
      }
    } else {
      // If auth is completely cleared
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

/**
 * Sign in with Google.
 * If forceSelectAccount is false and we know the user's email, we pass login_hint
 * so Google automatically connects without forcing the user to pick an account.
 */
export const googleSignIn = async (
  forceSelectAccount = false
): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    await setPersistence(auth, browserLocalPersistence);

    const currentUser = auth.currentUser;
    const storedEmail = typeof window !== 'undefined' ? localStorage.getItem(USER_EMAIL_KEY) : null;
    const targetEmail = currentUser?.email || storedEmail;

    if (!forceSelectAccount && targetEmail) {
      // Direct authorization without annoying account chooser
      provider.setCustomParameters({
        login_hint: targetEmail,
      });
    } else {
      provider.setCustomParameters({
        prompt: 'select_account',
      });
    }

    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('No se pudo obtener el token de acceso de Google');
    }

    cachedAccessToken = credential.accessToken;
    saveStoredToken(cachedAccessToken, result.user.email);

    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: unknown) {
    console.error('Error al iniciar sesión con Google:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

/**
 * Retrieves the active Google access token.
 * First checks in-memory cache, then localStorage (kept alive across sessions).
 * If forceRefresh is requested or token is missing while user is logged in,
 * it can re-acquire credentials with login_hint.
 */
export const getAccessToken = async (forceRefresh = false): Promise<string | null> => {
  if (cachedAccessToken && !forceRefresh) {
    return cachedAccessToken;
  }

  const stored = getStoredToken();
  if (stored && !forceRefresh) {
    cachedAccessToken = stored;
    return stored;
  }

  // If forceRefresh or no token found, attempt seamless re-auth if user is signed in
  if (auth.currentUser && !isSigningIn) {
    try {
      const refreshed = await googleSignIn(false);
      if (refreshed?.accessToken) {
        return refreshed.accessToken;
      }
    } catch (e) {
      console.warn('Could not refresh Google access token automatically:', e);
    }
  }

  return cachedAccessToken;
};

export const setCachedAccessToken = (token: string | null) => {
  cachedAccessToken = token;
  saveStoredToken(token, auth.currentUser?.email);
};

export const logout = async () => {
  await signOut(auth);
  cachedAccessToken = null;
  saveStoredToken(null);
};
