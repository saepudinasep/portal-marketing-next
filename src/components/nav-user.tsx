'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { BellIcon, CircleUserRoundIcon, EllipsisVerticalIcon, LogOutIcon } from 'lucide-react';

import { logout } from '@/actions/auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';

const roleLabel = { admin: 'Admin', teacher: 'Teacher', student: 'Student' } as const;

const initialsOf = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'U';

export function NavUser({
  user = { name: 'User', email: '', avatar: '' },
}: {
  // Opsional: data cadangan bila sesi belum termuat. Sumber utama adalah sesi login.
  user?: {
    name: string;
    email: string;
    avatar: string;
  };
}) {
  const { isMobile } = useSidebar();
  const { data: session } = useSession();
  const me = session?.user;

  const name = me?.name ?? user.name;
  const avatar = me?.image ?? user.avatar;
  // guru/siswa tidak punya email, jadi tampilkan username dan peran
  const secondary = me ? (me.email ?? `${me.username} · ${roleLabel[me.role]}`) : user.email;

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={<SidebarMenuButton size='lg' className='aria-expanded:bg-muted' />}
          >
            <Avatar className='size-8 rounded-lg grayscale'>
              <AvatarImage src={avatar || undefined} alt={name} />
              <AvatarFallback className='rounded-lg'>{initialsOf(name)}</AvatarFallback>
            </Avatar>
            <div className='grid flex-1 text-left text-sm leading-tight'>
              <span className='truncate font-medium'>{name}</span>
              <span className='truncate text-xs text-foreground/70'>{secondary}</span>
            </div>
            <EllipsisVerticalIcon className='ml-auto size-4' />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className='min-w-56'
            side={isMobile ? 'bottom' : 'right'}
            align='end'
            sideOffset={4}
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel className='p-0 font-normal'>
                <div className='flex items-center gap-2 px-1 py-1.5 text-left text-sm'>
                  <Avatar className='size-8'>
                    <AvatarImage src={avatar || undefined} alt={name} />
                    <AvatarFallback className='rounded-lg'>{initialsOf(name)}</AvatarFallback>
                  </Avatar>
                  <div className='grid flex-1 text-left text-sm leading-tight'>
                    <span className='truncate font-medium'>{name}</span>
                    <span className='truncate text-xs text-muted-foreground'>{secondary}</span>
                  </div>
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem render={<Link href='/account' />}>
                <CircleUserRoundIcon />
                Account
              </DropdownMenuItem>
              <DropdownMenuItem render={<Link href='/notifications' />}>
                <BellIcon />
                Notifications
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => logout()}>
              <LogOutIcon />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
