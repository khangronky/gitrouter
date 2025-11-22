import { createServerClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { RequestCookie } from 'next/dist/compiled/@edge-runtime/cookies';
import type { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies';
import { cookies } from 'next/headers';
import type { Database } from '@/types/supabase';
import { checkEnvVariables, type SupabaseCookie } from './common';

function createCookieHandler(cookieStore: ReadonlyRequestCookies | null): {
  getAll(): RequestCookie[];
  setAll(cookiesToSet: SupabaseCookie[]): void;
} {
  if (!cookieStore) {
    return {
      getAll() {
        return [] as RequestCookie[];
      },
      setAll(_: SupabaseCookie[]) {},
    };
  }

  return {
    getAll() {
      return cookieStore.getAll();
    },
    setAll(cookiesToSet: SupabaseCookie[]) {
      try {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookieStore.set(name, value, options);
        });
      } catch {
        // The `setAll` method was called from a Server Component.
        // This can be ignored if you have middleware refreshing
        // user sessions.
      }
    },
  };
}

async function createGenericClient<T = Database>(
  isAdmin: boolean
): Promise<SupabaseClient<T>> {
  const { url, key } = checkEnvVariables({ useSecretKey: isAdmin });
  const cookieStore = await cookies();
  return createServerClient<T>(url, key, {
    cookies: isAdmin
      ? createCookieHandler(null)
      : createCookieHandler(cookieStore),
  });
}

export function createAdminClient<T = Database>(): Promise<SupabaseClient<T>> {
  return createGenericClient<T>(true);
}

export function createClient<T = Database>(): Promise<SupabaseClient<T>> {
  return createGenericClient<T>(false);
}

export async function createDynamicAdminClient(): Promise<SupabaseClient<any>> {
  const { url, key } = checkEnvVariables({ useSecretKey: true });
  return createServerClient(url, key, {
    cookies: createCookieHandler(null),
  });
}

export async function createDynamicClient(): Promise<SupabaseClient<any>> {
  const { url, key } = checkEnvVariables({ useSecretKey: false });
  const cookieStore = await cookies();
  return createServerClient(url, key, {
    cookies: createCookieHandler(cookieStore),
  });
}
