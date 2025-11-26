import React from 'react'
import { SidebarGroup, SidebarGroupContent, SidebarMenu, SidebarGroupLabel, SidebarMenuButton, SidebarMenuItem } from '../ui/sidebar'
import { SidebarContent } from '../ui/sidebar'

export const NavMain = ({data}: {data: any}) => {
  return (
   <>
    <SidebarGroup>
          <SidebarGroupContent>
          <SidebarMenuButton asChild size="sm">
                <a href={data.dashboard.url}>
                  <data.dashboard.icon />
                  <span>{data.dashboard.title}</span>
                </a>
              </SidebarMenuButton>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarGroupLabel>Pull Requests</SidebarGroupLabel>
            <SidebarMenu>
              {data.pull_requests.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild size="sm">
                    <a href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarGroupLabel>Rules</SidebarGroupLabel>
            <SidebarMenu>
              {data.rules.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild size="sm">
                    <a href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarGroupLabel>Analytics</SidebarGroupLabel>
            <SidebarMenu>
              {data.analytics.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild size="sm">
                    <a href={item.url}> 
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
    </>
  )     
}
