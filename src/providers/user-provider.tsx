'use client';

import { useQuery } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useUserStore } from '@/stores/user-store';
import type { User } from '@/types/primitives/User';

export default function UserProvider({ children }: { children: ReactNode }) {
  const {
    data: user,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async (): Promise<User | null> => {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return null;
      }

      const { data: userData } = await supabase
        .from('users')
        .select('id, email')
        .eq('id', user.id)
        .single();

      if (!userData) {
        return null;
      }

      // Extract name from email (before @) as fallback
      const emailName = userData.email.split('@')[0];
      const displayName = emailName
        .split(/[._-]/)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');

      return {
        id: userData.id,
        email: userData.email,
        name: displayName,
        avatar: '',
      };
    },
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const { setUser, setLoading } = useUserStore();

  useEffect(() => {
    if (isLoading) {
      setLoading(true);
      return;
    }

    if (isError || !user) {
      // If there's an error or no user, clear the user state
      setUser(null);
      return;
    }

    // Set the user data in the store
    setUser(user);
  }, [user, isLoading, isError, setUser, setLoading]);

  // Always render children, even while loading
  // Individual components can check isLoading state from the store if needed
  return <>{children}</>;
}
