'use client';

import Link from 'next/link';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import {
  IconGitPullRequest,
  IconMenu2,
  IconX,
  IconSun,
  IconMoon,
} from '@tabler/icons-react';
import { useState } from 'react';

export function NavBar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-landing-border bg-landing-bg/80 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-landing-accent">
              <IconGitPullRequest className="h-5 w-5 text-white" />
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
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
