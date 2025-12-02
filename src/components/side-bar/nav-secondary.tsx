import type { LucideIcon } from 'lucide-react';
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenuButton,
} from '../ui/sidebar';

export const NavSecondary = ({
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
            <SidebarGroupLabel>{item.header}</SidebarGroupLabel>
            {item.items.map((item) => (
              <SidebarMenuButton asChild key={item.url}>
                <a href={item.url}>
                  <item.icon />
                  <span>{item.title}</span>
                </a>
              </SidebarMenuButton>
            ))}
          </SidebarGroupContent>
        </SidebarGroup>
      ))}
    </div>
  );
};
