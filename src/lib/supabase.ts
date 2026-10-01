import { createClient, SupabaseClient } from '@supabase/supabase-js';

const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
// Clean trailing slashes or /rest/v1 if included by user
const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
const supabaseAnonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim();

export const isSupabaseConfigured = (): boolean => {
  return (
    typeof supabaseUrl === 'string' &&
    supabaseUrl.length > 0 &&
    typeof supabaseAnonKey === 'string' &&
    supabaseAnonKey.length > 0 &&
    !supabaseUrl.includes('YOUR_SUPABASE')
  );
};

// Client for browser / public queries with anon key
let browserClient: SupabaseClient | null = null;

export const getSupabase = (): SupabaseClient | null => {
  if (!isSupabaseConfigured()) {
    return null;
  }
  if (!browserClient) {
    browserClient = createClient(supabaseUrl, supabaseAnonKey, {
      realtime: {
        params: {
          eventsPerSecond: 20,
        },
      },
    });
  }
  return browserClient;
};

// Server-side privileged client with service role key (for server routes only)
export const getServerSupabase = (): SupabaseClient | null => {
  const serviceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey).trim();
  if (!isSupabaseConfigured() || !serviceRoleKey) {
    return null;
  }
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
    },
  });
};
