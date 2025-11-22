import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';
import { checkEnvVariables } from './common';

export type TypedSupabaseClient = SupabaseClient<Database>;
const { url, key } = checkEnvVariables({ useSecretKey: false });

// Using SupabaseClient<any> to allow dynamic client creation without schema constraints.
// This is intentional for cases where the database schema type is determined at runtime.
export function createDynamicClient(): SupabaseClient<any> {
  return createBrowserClient(url, key);
}

export function createClient<T = Database>(): SupabaseClient<T> {
  return createBrowserClient<T>(url, key);
}
