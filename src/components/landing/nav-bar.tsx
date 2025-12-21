'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { IconGitPullRequest, IconMenu2, IconX } from '@tabler/icons-react';
import { useState } from 'react';

export function NavBar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-landing-bg/80 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-landing-accent">
              <IconGitPullRequest className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-semibold tracking-tight">
              GitRouter
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden items-center gap-8 md:flex">
            <Link
              href="#features"
              className="text-sm text-white/60 transition-colors hover:text-white"
            >
              Features
            </Link>
            <Link
              href="#pricing"
              className="text-sm text-white/60 transition-colors hover:text-white"
            >
              Pricing
            </Link>
            <Link
              href="#docs"
              className="text-sm text-white/60 transition-colors hover:text-white"
            >
              Docs
            </Link>
          </div>

          {/* Desktop Auth Buttons */}
          <div className="hidden items-center gap-4 md:flex">
            <Button
              asChild
              variant="ghost"
              className="text-white/70 hover:bg-white/10 hover:text-white"
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
            className="md:hidden p-2 text-white/70 hover:text-white"
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
          <div className="md:hidden border-t border-white/10 py-4">
            <div className="flex flex-col gap-4">
              <Link
                href="#features"
                className="text-sm text-white/60 transition-colors hover:text-white"
                onClick={() => setMobileMenuOpen(false)}
              >
                Features
              </Link>
              <Link
                href="#pricing"
                className="text-sm text-white/60 transition-colors hover:text-white"
                onClick={() => setMobileMenuOpen(false)}
              >
                Pricing
              </Link>
              <Link
                href="#docs"
                className="text-sm text-white/60 transition-colors hover:text-white"
                onClick={() => setMobileMenuOpen(false)}
              >
                Docs
              </Link>
              <div className="flex flex-col gap-2 pt-4 border-t border-white/10">
                <Button
                  asChild
                  variant="ghost"
                  className="justify-start text-white/70 hover:bg-white/10 hover:text-white"
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

