// ============================================================
// src/hooks/useAuth.js
// Drop-in replacement for the fake role/login state in App.
// Gives you: { user, profile, role, loading, signIn, signOut }
// ============================================================
import { useState, useEffect, createContext, useContext } from 'react';
import { supabase } from '../lib/supabase';
import { getProfile } from '../lib/api';

// ── Context ───────────────────────────────────────────────────
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load session on mount + listen for changes
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        try {
          const p = await getProfile(session.user.id);
          setProfile(p);
        } catch (_) {}
      }
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          try {
            const p = await getProfile(session.user.id);
            setProfile(p);
          } catch (_) {
            setProfile(null);
          }
        } else {
          setProfile(null);
        }
      }
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      role: profile?.role ?? null,   // 'admin' | 'client' | null
      loading,
      signIn,
      signOut,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
