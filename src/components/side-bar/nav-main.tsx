import type { LucideIcon } from 'lucide-react';
import Link from 'next/link';
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenuButton,
} from '../ui/sidebar';

export const NavMain = ({
  data,
}: {
  data: {
    header: string;
    items: {
      title: string;
      url: string;
      icon: LucideIcon;
    }[];
  }[];
}) => {
  return (
    <div>
      {data.map((item) => (
        <SidebarGroup key={item.header}>
          <SidebarGroupContent>
            {item.header !== 'Main' && (
              <SidebarGroupLabel className="text-muted-foreground text-xs">
                {item.header}
              </SidebarGroupLabel>
            )}
            {item.items.map((item) => (
              <SidebarMenuButton asChild key={item.url}>
                <Link href={item.url}>
                  <item.icon />
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            ))}
          </SidebarGroupContent>
        </SidebarGroup>
      ))}
    </div>
  );
};
