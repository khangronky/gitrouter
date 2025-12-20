'use client';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from '@/components/ui/sidebar';
import { WorkspaceSwitcher } from '@/components/workspace';
import { useWorkspaceShortcuts } from '@/hooks/use-workspace-shortcuts';
import { navLinks } from './nav-links';
import { NavMain } from './nav-main';
import { NavSecondary } from './nav-secondary';
import { NavUser } from './nav-user';

export function AppSidebar() {
  // Register global keyboard shortcuts for workspace switching
  useWorkspaceShortcuts();

  return (
    <Sidebar variant="sidebar" collapsible="icon">
      <SidebarHeader>
        <WorkspaceSwitcher />
      </SidebarHeader>
      <SidebarContent className="justify-between">
        <NavMain data={navLinks.main_navigation} />
        <NavSecondary data={navLinks.help_and_support} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
