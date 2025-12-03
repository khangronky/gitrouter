'use client';

import { usePathname } from 'next/navigation';
import { navLinks } from '@/components/side-bar/nav-links';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';

export default function NavHeader() {
  const pathname = usePathname();

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
    <header className="flex shrink-0 items-center gap-2 bg-background px-4 py-2.5">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="-ml-1" />
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
    </header>
  );
}
