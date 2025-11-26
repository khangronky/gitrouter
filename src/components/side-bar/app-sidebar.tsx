"use client";
import { ChartColumnIncreasing, ChartLine, Factory, GitBranch, List } from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { useUserStore } from "@/stores/user-store";
import { NavMain } from "./nav-main";
import { NavUser } from "./nav-user";

// Menu items.
const data = [
  {
    header: "",
    items: [
      {
        title: "Dashboard",
        url: "/dashboard",
        icon: ChartColumnIncreasing,
      },
    ],
  },
  {
    header: "Pull Requests",
    items: [
      {
        title: "List",
        url: "/pull-requests",
        icon: List,
      },
    ],
  },
  {
    header: "Rules",
    items: [
      {
        title: "Rules Builder",
        url: "/rules-builder",
        icon: Factory,
      },
    ],
  },
  {
    header: "Analytics",
    items: [
      {
        title: "Trend",
        url: "/trend",
        icon: ChartColumnIncreasing,
      },
      {
        title: "Performance",
        url: "/performance",
        icon: ChartLine,
      },
    ],
  },
]
export function AppSidebar() {
  const user = useUserStore((state) => state.user);

  return (
    <Sidebar  variant="inset" collapsible="icon">
      <SidebarHeader>
        <SidebarMenuButton
          size='lg'
          className='data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground'
        >
          <div className='bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg'>
            <GitBranch className='size-4' />
          </div>
          <div className='grid flex-1 text-left text-sm leading-tight'>
            <span className='truncate font-medium'>GitRouter</span>
            <span className='truncate text-xs text-muted-foreground'>v0.0.1 (beta)</span>
          </div>
        </SidebarMenuButton>
      </SidebarHeader>
      <SidebarContent>
        <NavMain data={data} />
      </SidebarContent>
      <SidebarFooter>
        {user && <NavUser user={user} />}
      </SidebarFooter>
    </Sidebar>
  );
}
