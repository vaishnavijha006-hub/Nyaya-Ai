'use client';

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '[Nyaya AI] Supabase env vars are missing. ' +
    'Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local'
  );
}

export const supabase = createClient(
  supabaseUrl ?? '',
  supabaseAnonKey ?? '',
  {
    auth: {
      // Persist sessions in localStorage (default); set false to disable
      persistSession: true,
      // Auto-refresh the session token before it expires
      autoRefreshToken: true,
      // Detect and handle OAuth redirects automatically
      detectSessionInUrl: true,
    },
  }
);
