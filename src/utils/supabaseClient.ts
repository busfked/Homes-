import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseConfig } from './storage';

let cachedClient: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  const config = getSupabaseConfig();
  if (!config.isEnabled || !config.url || !config.anonKey) {
    return null;
  }

  if (!cachedClient) {
    try {
      cachedClient = createClient(config.url, config.anonKey);
    } catch (err) {
      console.warn('Failed to initialize Supabase client:', err);
      return null;
    }
  }

  return cachedClient;
}

export function resetSupabaseClient() {
  cachedClient = null;
}
