import Link from 'next/link';
import { IconGitPullRequest } from '@tabler/icons-react';

export function Footer() {
  return (
    <footer className="border-t border-landing-border bg-landing-bg">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="flex flex-col items-center justify-between gap-8 md:flex-row">
          {/* Logo & Copyright */}
          <div className="flex flex-col items-center gap-4 md:items-start">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-landing-accent">
                <IconGitPullRequest className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-semibold tracking-tight text-landing-text">
                GitRouter
              </span>
            </Link>
            <p className="text-sm text-landing-text-muted">
              © {new Date().getFullYear()} GitRouter. All rights reserved.
            </p>
          </div>

          {/* Links */}
          <div className="flex flex-wrap items-center justify-center gap-8">
            <Link
              href="/privacy"
              className="text-sm text-landing-text-muted transition-colors hover:text-landing-text"
            >
              Privacy Policy
            </Link>
            <Link
              href="#"
              className="text-sm text-landing-text-muted transition-colors hover:text-landing-text"
            >
              Terms of Service
            </Link>
            <Link
              href="#"
              className="text-sm text-landing-text-muted transition-colors hover:text-landing-text"
            >
              Documentation
            </Link>
            <Link
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-landing-text-muted transition-colors hover:text-landing-text"
            >
              GitHub
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

