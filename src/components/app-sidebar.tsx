'use client';

import * as React from 'react';
import { useSession } from 'next-auth/react';

import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { navMain } from '@/config/nav';
import { ROLE_HOME, filterNavByRole } from '@/lib/access';
import { CommandIcon } from 'lucide-react';

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: session } = useSession();
  const role = session?.user.role;

  return (
    <Sidebar collapsible='offcanvas' {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              className='data-[slot=sidebar-menu-button]:p-1.5!'
              render={<a href={role ? ROLE_HOME[role] : '/'} />}
            >
              <CommandIcon className='size-5!' />
              <span className='text-base font-semibold'>SMK Nusantara</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain
          items={filterNavByRole(role, navMain).map(({ icon: Icon, ...item }) => ({
            ...item,
            icon: <Icon />,
          }))}
        />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
