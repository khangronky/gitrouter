'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { useUserStore } from '@/stores/user-store';

export default function DashboardPage() {
  const router = useRouter();
  const clearUser = useUserStore((state) => state.clearUser);

  const supabase = createClient();
  const handleLogout = async () => {
    await supabase.auth.signOut();
    clearUser();
    router.push('/login');
  };

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6">
      <div className="text-center">
        <h1 className="font-bold text-3xl text-zinc-900 dark:text-zinc-50">
          Dashboard
        </h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Welcome! You are logged in.
        </p>
      </div>
      <Button variant="outline" onClick={handleLogout}>
        Sign Out
      </Button>
    </div>
  );
}
