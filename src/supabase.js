// src/supabase.js
// Singleton Supabase client — import this everywhere.
// Auth session is persisted automatically in localStorage.
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);
