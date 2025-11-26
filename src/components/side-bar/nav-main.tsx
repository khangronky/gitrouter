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
    <>
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
    </>
  );
};
