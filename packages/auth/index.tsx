// packages/auth/index.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { SupabaseClient, createClient, Session, User } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';

// A custom token storage adapter for Expo.
// This allows Supabase to securely store the user's session on the device.
const ExpoSecureStoreAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
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
    // Check for an existing session when the app starts
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

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