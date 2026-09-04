'use client';

import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-nyaya.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

const isOfflineOrPlaceholder =
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  supabaseUrl.includes('127.0.0.1:54321') ||
  supabaseUrl.includes('localhost:54321') ||
  supabaseUrl.includes('placeholder');

export const supabase = createBrowserClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      autoRefreshToken: !isOfflineOrPlaceholder,
      persistSession: !isOfflineOrPlaceholder,
      detectSessionInUrl: !isOfflineOrPlaceholder,
    },
    global: {
      fetch: async (input, init) => {
        const urlStr = typeof input === 'string' ? input : (input as any)?.url || (input as any)?.href || '';

        // Prevent browser network ERR_CONNECTION_REFUSED on offline or placeholder Supabase URLs
        if (isOfflineOrPlaceholder || urlStr.includes('54321') || urlStr.includes('placeholder')) {
          // If request is a PostgREST database query (/rest/v1/), return array []
          if (urlStr.includes('/rest/v1/')) {
            return new Response(JSON.stringify([]), {
              status: 200,
              headers: {
                'Content-Type': 'application/json',
                'Content-Range': '0-0/0',
              },
            });
          }

          // Default Auth response
          return new Response(
            JSON.stringify({
              access_token: null,
              refresh_token: null,
              user: null,
              session: null,
              error: null,
            }),
            {
              status: 200,
              headers: { 'Content-Type': 'application/json' },
            }
          );
        }

        try {
          return await fetch(input, init);
        } catch (err: any) {
          return new Response(
            JSON.stringify({ error: 'Auth service unreachable' }),
            {
              status: 200,
              headers: { 'Content-Type': 'application/json' },
            }
          );
        }
      },
    },
  }
);
