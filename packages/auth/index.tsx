// packages/auth/index.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { SupabaseClient, createClient, Session, User } from '@supabase/supabase-js';
// Avoid importing `expo-secure-store` at module evaluation time because
// the native module may not be available in the running environment
// (e.g. plain Node, web, or Expo Go without the module). Require it
// lazily inside a try/catch so the bundle doesn't crash when the native
// module is missing.
const safeSecureStore = () => {
  const isReactNative = typeof navigator !== 'undefined' && (navigator as any).product === 'ReactNative';
  if (!isReactNative) return null;
  try {
    // Use require so bundlers don't eagerly fail when the native module
    // isn't present in the runtime. This can still throw if the module
    // isn't installed — catch and return null in that case.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const SecureStore = require('expo-secure-store');
    return SecureStore;
  } catch (e) {
    return null;
  }
};

const ExpoSecureStoreAdapter = {
  getItem: async (key: string) => {
    // Web support: use localStorage
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem(key);
    }
    
    const SecureStore = safeSecureStore();
    if (!SecureStore || !SecureStore.getItemAsync) return Promise.resolve(null);
    try {
      const value = await SecureStore.getItemAsync(key);
      // By default avoid noisy repeated getItem logs. Enable by setting
      // `EXPO_SECURE_STORE_DEBUG=true` in your environment if needed.
      const shouldDebug = typeof __DEV__ !== 'undefined' && __DEV__ && process.env.EXPO_SECURE_STORE_DEBUG === 'true';
      if (shouldDebug) {
        try {
          const parsed = value ? JSON.parse(value) : null;
          // eslint-disable-next-line no-console
          console.debug('[ExpoSecureStoreAdapter] getItem', key, parsed ? { hasRefreshToken: !!parsed.refresh_token, keys: Object.keys(parsed) } : null);
        } catch (e) {
          // eslint-disable-next-line no-console
          console.debug('[ExpoSecureStoreAdapter] getItem (non-json)', key, value ? value.slice(0, 200) : null);
        }
      }
      return value;
    } catch (err) {
      return null;
    }
  },
  setItem: async (key: string, value: string) => {
    // Web support: use localStorage
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, value);
      return;
    }

    const SecureStore = safeSecureStore();
    if (!SecureStore || !SecureStore.setItemAsync) return Promise.resolve();
    try {
      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        // eslint-disable-next-line no-console
        console.debug('[ExpoSecureStoreAdapter] setItem', key, value ? (value.length > 200 ? value.slice(0, 200) + '...': value) : null);
      }
      return SecureStore.setItemAsync(key, value);
    } catch (err) {
      return;
    }
  },
  removeItem: async (key: string) => {
    // Web support: use localStorage
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(key);
      return;
    }

    const SecureStore = safeSecureStore();
    if (!SecureStore || !SecureStore.deleteItemAsync) return Promise.resolve();
    try {
      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        // eslint-disable-next-line no-console
        console.debug('[ExpoSecureStoreAdapter] removeItem', key);
      }
      return SecureStore.deleteItemAsync(key);
    } catch (err) {
      return;
    }
  },
};

// --- CREATE THE SUPABASE CLIENT ---
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// --- CREATE THE AUTH CONTEXT ---
// This defines the shape of the data that will be available to the app
interface AuthContextType {
  session: Session | null;
  user: User | null;
}
export const AuthContext = createContext<AuthContextType>({ session: null, user: null });

// --- CREATE THE AUTH PROVIDER ---
// This component will wrap your app and manage the auth state
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Check for an existing session when the app starts.
    // Wrap in try/catch to handle cases where a stored refresh token
    // is invalid on the server (e.g. rotated/removed). If refreshing
    // fails, sign out to clear local storage and avoid an unhandled
    // AuthApiError like "Invalid Refresh Token: Refresh Token Not Found".
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        setUser(session?.user ?? null);
      } catch (err: any) {
        // If Supabase reports an invalid refresh token, clear local state
        // and remove any persisted session by signing out.
        try {
          // eslint-disable-next-line no-console
          console.warn('[Auth] getSession failed, signing out to clear invalid tokens', err?.message ?? err);
          await supabase.auth.signOut();
        } catch (e) {
          // ignore signOut errors
        }
        setSession(null);
        setUser(null);
      }
    })();

    // Listen for changes in authentication state (login, logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
      }
    );

    // Clean up the subscription when the component unmounts
    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ session, user }}>
      {children}
    </AuthContext.Provider>
  );
};

// --- CREATE A HOOK TO EASILY ACCESS THE AUTH CONTEXT ---
export const useAuth = () => {
  return useContext(AuthContext);
};