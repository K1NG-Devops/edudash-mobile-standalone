import { createClient } from '@supabase/supabase-js';

const getEnv = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) throw new Error('Supabase env not set for this app');
  return { url, anon };
};

export const supabaseBrowser = () => {
  const { url, anon } = getEnv();
  return createClient(url!, anon!);
};

export * from './subscriptions';

