// src/lib/supabase.ts
/**
 * Centralised Supabase client for the NeuroSync frontend.
 * Uses Vite's `import.meta.env` to read environment variables that are
 * prefixed with `VITE_`. These variables must be defined in a `.env` file at the
 * project root (for local development) and as environment variables in Vercel
 * (for production).
 */

import { createClient } from '@supabase/supabase-js';

// Vite injects the variables at build time.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Defensive runtime checks – they will throw during development if the vars are missing.
if (!supabaseUrl) {
    throw new Error(
        'VITE_SUPABASE_URL is not defined. Please add it to your .env file or Vercel env vars.'
    );
}
if (!supabaseAnonKey) {
    throw new Error(
        'VITE_SUPABASE_ANON_KEY is not defined. Please add it to your .env file or Vercel env vars.'
    );
}

// Export a singleton client that can be imported anywhere in the app.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Optional: expose a helper for debugging the loaded values (remove in prod).
if (import.meta.env.DEV) {
    console.log('🔧 Supabase client initialized', {
        supabaseUrl,
        // Do NOT log the full anon key – only show a short masked version.
        supabaseAnonKey: supabaseAnonKey.slice(0, 8) + '…',
    });
}
