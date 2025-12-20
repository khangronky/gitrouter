"use client";

import { useState } from "react";
import { Check, ChevronsUpDown, Plus, Building2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrentOrganization } from "@/hooks/use-current-organization";
import { CreateWorkspaceDialog } from "./create-workspace-dialog";
import { cn } from "@/lib/utils";

export function WorkspaceSwitcher() {
  const { isMobile } = useSidebar();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const { currentOrg, organizations, isLoading, switchOrganization } =
    useCurrentOrganization();

  if (isLoading) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <Skeleton className='h-12 w-full' />
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  // Get initials for org avatar
  const getOrgInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Get shortcut key for display (1-9 only)
  const getShortcutDisplay = (index: number) => {
    if (index >= 9) return null;
    const isMac =
      typeof navigator !== "undefined" &&
      navigator.platform.toUpperCase().includes("MAC");
    return `${isMac ? "⌘" : "Ctrl+"}${index + 1}`;
  };

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size='lg'
                className='data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground'
              >
                <div className='flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground'>
                  {currentOrg ? (
                    <span className='text-xs font-semibold'>
                      {getOrgInitials(currentOrg.name)}
                    </span>
                  ) : (
                    <Building2 className='size-4' />
                  )}
                </div>
                <div className='grid flex-1 text-left text-sm leading-tight'>
                  <span className='truncate font-medium'>
                    {currentOrg?.name ?? "Select Workspace"}
                  </span>
                  <span className='truncate text-muted-foreground text-xs'>
                    {currentOrg?.role ?? "No workspace selected"}
                  </span>
                </div>
                <ChevronsUpDown className='ml-auto size-4' />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className=' min-w-56 rounded-lg'
              side={isMobile ? "bottom" : "right"}
              align='start'
              sideOffset={4}
            >
              <DropdownMenuLabel className='text-muted-foreground text-xs'>
                Workspaces
              </DropdownMenuLabel>
              {organizations.map((org, index) => (
                <DropdownMenuItem
                  key={org.id}
                  onClick={() => switchOrganization(org.id)}
                  className='gap-6 p-2 flex items-center justify-between w-69'
                >
                  <div className='flex items-center gap-2'>
                  <div className='flex size-6 items-center justify-center rounded-sm border bg-background'>
                    <span className='text-[10px]  font-medium'>
                      {getOrgInitials(org.name)}
                    </span>
                  </div>
                  <span className='flex-1 truncate w-36 '>{org.name}</span>
                  </div>
                  <div className='flex items-center gap-2 justify-end'>
                    {currentOrg?.id === org.id && (
                      <Check className='size-4 text-primary' />
                    )}
                    {getShortcutDisplay(index) && (
                      <DropdownMenuShortcut
                        className={cn(currentOrg?.id === org.id && "")}
                      >
                        {getShortcutDisplay(index)}
                      </DropdownMenuShortcut>
                    )}
                  </div>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className='gap-2 p-2'
                onClick={() => setCreateDialogOpen(true)}
              >
                <div className='flex size-6 items-center justify-center rounded-md border border-dashed bg-background'>
                  <Plus className='size-4' />
                </div>
                <span className='text-muted-foreground font-medium'>
                  Create workspace
                </span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>

      <CreateWorkspaceDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />
    </>
  );
}
