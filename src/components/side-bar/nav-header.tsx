'use client';

import { Moon, Sun } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { navLinks } from '@/components/side-bar/nav-links';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';

export default function NavHeader() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const getBreadcrumbData = () => {
    const allNavItems = [
      ...navLinks.main_navigation,
      ...navLinks.help_and_support,
    ];

    for (const section of allNavItems) {
      for (const item of section.items) {
        if (pathname.startsWith(item.url)) {
          return {
            header: section.header,
            title: item.title,
          };
        }
      }
    }

    return {
      header: '',
      title: 'Dashboard',
    };
  };

  const breadcrumb = getBreadcrumbData();

  return (
    <header className="flex shrink-0 items-center justify-between gap-2 border-b bg-sidebar/50 px-4 py-2.5">
      <div className="flex items-center gap-2">
        <SidebarTrigger variant="outline" className="-ml-1 cursor-pointer" />
        <Separator
          orientation="vertical"
          className="mr-2 data-[orientation=vertical]:h-4"
        />
        <Breadcrumb>
          <BreadcrumbList>
            {breadcrumb.header && (
              <>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbPage className="text-foreground/50">
                    {breadcrumb.header}
                  </BreadcrumbPage>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
              </>
            )}
            <BreadcrumbItem>
              <BreadcrumbPage>{breadcrumb.title}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Theme Toggle */}
      <Button
        variant="outline"
        size="sm"
        onClick={toggleTheme}
        className="cursor-pointer gap-2"
        aria-label="Toggle theme"
      >
        <div className="relative h-4 w-4">
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute top-0 left-0 h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </div>
        <span>{theme === 'dark' ? 'Dark' : 'Light'}</span>
      </Button>
    </header>
  );
}
