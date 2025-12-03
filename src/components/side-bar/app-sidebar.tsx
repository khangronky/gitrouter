import { GitBranch } from 'lucide-react';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import { navLinks } from './nav-links';
import { NavMain } from './nav-main';
import { NavSecondary } from './nav-secondary';
import { NavUser } from './nav-user';

// Menu items.
const data = {
  main_navigation: [
    {
      header: '',
      items: [
        {
          title: 'Dashboard',
          url: '/dashboard',
          icon: ChartColumnIncreasing,
        },
      ],
    },
    {
      header: 'Pull Requests',
      items: [
        {
          title: 'List',
          url: '/pull-requests',
          icon: List,
        },
      ],
    },
    {
      header: 'Rules',
      items: [
        {
          title: 'Rules Builder',
          url: '/rules-builder',
          icon: Factory,
        },
      ],
    },
    {
      header: 'Analytics',
      items: [
        {
          title: 'Trend',
          url: '/trend',
          icon: ChartColumnIncreasing,
        },
        {
          title: 'Performance',
          url: '/performance',
          icon: ChartLine,
        },
      ],
    },
  ],
  help_and_support: [
    {
      title: 'Help',
      items: [
        {
          title: 'Settings',
          url: '/settings',
          icon: Settings,
        },
      ],
    },
    {
      title: 'Support',
      items: [
        {
          title: 'Support',
          url: '/support',
          icon: LifeBuoy,
        },
      ],
    },
  ],
};
export function AppSidebar() {
  return (
    <Sidebar variant="sidebar" collapsible="icon">
      <SidebarHeader>
        <SidebarMenuButton
          size="lg"
          className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
        >
          <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <GitBranch className="size-4" />
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-medium">GitRouter</span>
            <span className="truncate text-muted-foreground text-xs">
              v0.0.1 (beta)
            </span>
          </div>
        </SidebarMenuButton>
      </SidebarHeader>
      <SidebarContent>
        <NavMain data={data.main_navigation} />
        <NavSecondary
          data={{
            header: 'Help and Support',
            items: [
              {
                title: 'Settings',
                url: '/settings',
                icon: Settings,
              },
              {
                title: 'Support',
                url: '/support',
                icon: LifeBuoy,
              },
            ],
          }}
        />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
