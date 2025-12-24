import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { AppSidebar } from '@/components/side-bar/app-sidebar';
import NavHeader from '@/components/side-bar/nav-header';
import { OnboardingDialog } from '@/components/onboarding';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { createClient } from '@/lib/supabase/server';
import UserProvider from '@/providers/user-provider';

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get('sidebar_state')?.value === 'true';

  if (!user) {
    redirect('/login');
  }

  return (
    <UserProvider>
      <OnboardingDialog />
      <SidebarProvider defaultOpen={defaultOpen}>
        <AppSidebar />
        <SidebarInset className="bg-muted max-h-svh overflow-hidden">
          <NavHeader />
          <div className="flex-1 overflow-auto">{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </UserProvider>
  );
}
