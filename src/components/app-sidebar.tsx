'use client';

import * as React from 'react';

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
import {
  LayoutDashboardIcon,
  CommandIcon,
  GraduationCapIcon,
  UserRoundCheckIcon,
  SchoolIcon,
  CalendarDaysIcon,
  CalendarCheckIcon,
  ChartNoAxesCombinedIcon,
  CalendarClockIcon,
  CalendarRangeIcon,
  ClipboardCheckIcon,
} from 'lucide-react';
import { navMain } from '@/config/nav';

const data = {
  user: {
    name: 'shadcn',
    email: 'm@example.com',
    avatar: '/avatars/shadcn.jpg',
  },
  navMain: [
    {
      title: 'Dashboard',
      url: '/dashboard',
      icon: <LayoutDashboardIcon />,
    },
    {
      title: 'Manage Student',
      url: '/manage-student',
      icon: <GraduationCapIcon />,
    },
    {
      title: 'Manage Teacher',
      url: '/manage-teacher',
      icon: <UserRoundCheckIcon />,
    },
    {
      title: 'Manage Class',
      url: '/manage-class',
      icon: <SchoolIcon />,
    },
    {
      title: 'Manage Schedule',
      url: '/manage-schedule',
      icon: <CalendarDaysIcon />,
    },
    {
      title: 'Finalize Schedule',
      url: '/finalize-schedule',
      icon: <CalendarCheckIcon />,
    },
    {
      title: 'View Report Score',
      url: '/view-report-score',
      icon: <ChartNoAxesCombinedIcon />,
    },
    {
      title: 'Teacher Schedule',
      url: '/teacher-schedule',
      icon: <CalendarClockIcon />,
    },
    {
      title: 'Class Schedule',
      url: '/class-schedule',
      icon: <CalendarRangeIcon />,
    },
    {
      title: 'View Score',
      url: '/view-score',
      icon: <ClipboardCheckIcon />,
    },
  ],
};
export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible='offcanvas' {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              className='data-[slot=sidebar-menu-button]:p-1.5!'
              render={<a href='#' />}
            >
              <CommandIcon className='size-5!' />
              <span className='text-base font-semibold'>Portal Marketing</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain.map(({ icon: Icon, ...item }) => ({ ...item, icon: <Icon /> }))} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  );
}
