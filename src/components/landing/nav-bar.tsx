'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  IconGitPullRequest,
  IconMenu2,
  IconX,
  IconSun,
  IconMoon,
  IconLayoutDashboard,
  IconSettings,
  IconLogout,
} from '@tabler/icons-react';
import { createClient } from '@/lib/supabase/client';

interface UserData {
  id: string;
  email: string;
  name: string;
  avatar: string;
}

export function NavBar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const checkUser = async () => {
      try {
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser();

        if (!authUser) {
          setUser(null);
          setIsLoading(false);
          return;
        }

        const { data: userData } = await supabase
          .from('users')
          .select('id, email')
          .eq('id', authUser.id)
          .single();

        if (userData) {
          const emailName = userData.email.split('@')[0];
          const displayName = emailName
            .split(/[._-]/)
            .map((part: string) => part.charAt(0).toUpperCase() + part.slice(1))
            .join(' ');

          setUser({
            id: userData.id,
            email: userData.email,
            name: displayName,
            avatar: '',
          });
        }
      } catch {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      checkUser();
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    router.push('/');
    router.refresh();
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-landing-border bg-landing-bg/80 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-landing-accent">
              <IconGitPullRequest className="h-4 w-4 text-white" />
            </div>
            <span className="text-xl font-semibold tracking-tight text-landing-text">
              GitRouter
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden items-center gap-8 md:flex">
            <Link
              href="#features"
              className="text-sm text-landing-text-muted transition-colors hover:text-landing-text"
            >
              Features
            </Link>
            <Link
              href="#pricing"
              className="text-sm text-landing-text-muted transition-colors hover:text-landing-text"
            >
              Pricing
            </Link>
            <Link
              href="#docs"
              className="text-sm text-landing-text-muted transition-colors hover:text-landing-text"
            >
              Docs
            </Link>
          </div>

          {/* Desktop Auth Buttons */}
          <div className="hidden items-center gap-2 md:flex">
            <button
              type="button"
              onClick={toggleTheme}
              className="relative p-2 rounded-md text-landing-text-muted hover:text-landing-text hover:bg-landing-card transition-colors cursor-pointer"
              aria-label="Toggle theme"
            >
              <IconSun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <IconMoon className="absolute top-2 left-2 h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </button>
            {!isLoading && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="flex items-center gap-2 rounded-full p-1 pr-3 hover:bg-landing-card transition-colors cursor-pointer"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.avatar} alt={user.name} />
                      <AvatarFallback className="bg-landing-accent text-white text-sm">
                        {getInitials(user.name)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium text-landing-text">
                      {user.name}
                    </span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">{user.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard" className="cursor-pointer">
                      <IconLayoutDashboard className="mr-2 h-4 w-4" />
                      Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings" className="cursor-pointer">
                      <IconSettings className="mr-2 h-4 w-4" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="cursor-pointer text-destructive focus:text-destructive"
                  >
                    <IconLogout className="mr-2 h-4 w-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Button
                  asChild
                  variant="ghost"
                  className="text-landing-text-muted hover:bg-landing-card hover:text-landing-text"
                >
                  <Link href="/login">Sign In</Link>
                </Button>
                <Button
                  asChild
                  className="bg-landing-accent hover:bg-landing-accent-light"
                >
                  <Link href="/register">Get Started</Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            type="button"
            className="md:hidden p-2 text-landing-text-muted hover:text-landing-text"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <IconX className="h-6 w-6" />
            ) : (
              <IconMenu2 className="h-6 w-6" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-landing-border py-4">
            <div className="flex flex-col gap-4">
              <Link
                href="#features"
                className="text-sm text-landing-text-muted transition-colors hover:text-landing-text"
                onClick={() => setMobileMenuOpen(false)}
              >
                Features
              </Link>
              <Link
                href="#pricing"
                className="text-sm text-landing-text-muted transition-colors hover:text-landing-text"
                onClick={() => setMobileMenuOpen(false)}
              >
                Pricing
              </Link>
              <Link
                href="#docs"
                className="text-sm text-landing-text-muted transition-colors hover:text-landing-text"
                onClick={() => setMobileMenuOpen(false)}
              >
                Docs
              </Link>
              <div className="flex flex-col gap-2 pt-4 border-t border-landing-border">
                {!isLoading && user ? (
                  <>
                    <div className="flex items-center gap-3 px-2 py-2">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user.avatar} alt={user.name} />
                        <AvatarFallback className="bg-landing-accent text-white">
                          {getInitials(user.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-landing-text">
                          {user.name}
                        </span>
                        <span className="text-xs text-landing-text-muted">
                          {user.email}
                        </span>
                      </div>
                    </div>
                    <Button
                      asChild
                      variant="ghost"
                      className="justify-start text-landing-text-muted hover:bg-landing-card hover:text-landing-text"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Link href="/dashboard">
                        <IconLayoutDashboard className="mr-2 h-4 w-4" />
                        Dashboard
                      </Link>
                    </Button>
                    <Button
                      asChild
                      variant="ghost"
                      className="justify-start text-landing-text-muted hover:bg-landing-card hover:text-landing-text"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Link href="/settings">
                        <IconSettings className="mr-2 h-4 w-4" />
                        Settings
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      className="justify-start text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => {
                        handleLogout();
                        setMobileMenuOpen(false);
                      }}
                    >
                      <IconLogout className="mr-2 h-4 w-4" />
                      Log out
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      asChild
                      variant="ghost"
                      className="justify-start text-landing-text-muted hover:bg-landing-card hover:text-landing-text"
                    >
                      <Link href="/login">Sign In</Link>
                    </Button>
                    <Button
                      asChild
                      className="bg-landing-accent hover:bg-landing-accent-light"
                    >
                      <Link href="/register">Get Started</Link>
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
