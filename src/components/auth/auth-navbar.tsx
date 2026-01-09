'use client';

import { IconArrowLeft, IconMoon, IconSun } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';

export default function AuthNavbar() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <nav className="absolute top-0 right-0 left-0 z-50 flex items-center justify-between p-6">
      <Button
        variant="ghost"
        onClick={() => router.back()}
        className="flex items-center gap-2 text-md text-muted-foreground hover:text-foreground"
      >
        <IconArrowLeft className="h-4 w-4" />
        Back
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleTheme}
        className="text-muted-foreground hover:text-foreground"
      >
        <IconSun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
        <IconMoon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        <span className="sr-only">Toggle theme</span>
      </Button>
    </nav>
  );
}
