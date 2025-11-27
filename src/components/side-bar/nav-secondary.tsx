import React from "react";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarGroupLabel,
  SidebarMenuButton,
  SidebarMenuItem,
} from "../ui/sidebar";
import { LucideIcon } from "lucide-react";

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
  };
}) => {
  return (
    <>
        <SidebarGroup  className="mt-auto">
          <SidebarGroupContent>
            <SidebarGroupLabel>{data.header}</SidebarGroupLabel>
            {data.items.map((item) => (
              <SidebarMenuButton asChild key={item.url}>
                <a href={item.url}>
                  <item.icon />
                  <span>{item.title}</span>
                </a>
              </SidebarMenuButton>
            ))}
          </SidebarGroupContent>
        </SidebarGroup>
    </>
  );
};
