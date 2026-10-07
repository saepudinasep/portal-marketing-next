'use client';

import * as React from 'react';
import {
  BellIcon,
  CalendarDaysIcon,
  CheckCheckIcon,
  CheckIcon,
  ClipboardCheckIcon,
  InfoIcon,
  MailOpenIcon,
  SchoolIcon,
  ShieldCheckIcon,
  Trash2Icon,
  type LucideIcon,
} from 'lucide-react';

import { StatCards } from '@/components/stat-cards';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useFakeLoad, wait } from '@/lib/fake-api';
import {
  formatDateTime,
  initialNotifications,
  type AppNotification,
  type NotificationType,
} from '@/lib/notifications';

const typeIcon: Record<NotificationType, LucideIcon> = {
  schedule: CalendarDaysIcon,
  score: ClipboardCheckIcon,
  class: SchoolIcon,
  account: ShieldCheckIcon,
  system: InfoIcon,
};

type Filter = 'all' | 'unread';

export function Notifications() {
  const [items, setItems] = React.useState<AppNotification[]>(initialNotifications);
  const [filter, setFilter] = React.useState<Filter>('all');
  const [busy, setBusy] = React.useState<{ id: number; action: 'read' | 'delete' } | null>(null);
  const [markingAll, setMarkingAll] = React.useState(false);
  const loading = useFakeLoad('notifications'); // ganti dengan isLoading dari API

  const total = items.length;
  const unread = items.filter((n) => !n.read).length;
  const scheduleItems = items.filter((n) => n.type === 'schedule');
  const visible = filter === 'unread' ? items.filter((n) => !n.read) : items;

  const toggleRead = async (id: number) => {
    setBusy({ id, action: 'read' });
    await wait(400); // ganti dengan PATCH ke API
    setItems((list) => list.map((n) => (n.id === id ? { ...n, read: !n.read } : n)));
    setBusy(null);
  };
  const remove = async (id: number) => {
    setBusy({ id, action: 'delete' });
    await wait(400); // ganti dengan DELETE ke API
    setItems((list) => list.filter((n) => n.id !== id));
    setBusy(null);
  };
  const markAllRead = async () => {
    setMarkingAll(true);
    await wait(); // ganti dengan PATCH ke API
    setItems((list) => list.map((n) => ({ ...n, read: true })));
    setMarkingAll(false);
  };

  return (
    <div className='flex flex-col gap-4 md:gap-6'>
      <StatCards
        loading={loading}
        items={[
          {
            label: 'All Notifications',
            value: total,
            icon: BellIcon,
            badge: 'Inbox',
            title: 'Notifications received',
            note: 'Newest first',
          },
          {
            label: 'Unread',
            value: unread,
            icon: MailOpenIcon,
            badge: total ? `${Math.round((unread / total) * 100)}%` : '0%',
            title: unread === 0 ? 'You are all caught up' : 'Waiting for you',
            note: 'Click a notification to mark it as read',
          },
          {
            label: 'Schedule Updates',
            value: scheduleItems.length,
            icon: CalendarDaysIcon,
            badge: `${scheduleItems.filter((n) => !n.read).length} unread`,
            title: 'Schedule related notifications',
            note: 'Finalized, updated and new sessions',
          },
        ]}
      />

      <div className='flex flex-wrap items-center justify-between gap-3'>
        <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)}>
          <TabsList>
            <TabsTrigger value='all'>All ({total})</TabsTrigger>
            <TabsTrigger value='unread'>Unread ({unread})</TabsTrigger>
          </TabsList>
        </Tabs>
        <Button
          variant='outline'
          disabled={unread === 0 || loading || markingAll}
          onClick={markAllRead}
        >
          {markingAll ? <Spinner /> : <CheckCheckIcon />}
          Mark all as read
        </Button>
      </div>

      <Card>
        <CardContent className='p-0'>
          {loading ? (
            <ul className='divide-y' aria-busy='true'>
              {Array.from({ length: 4 }).map((_, i) => (
                <li key={i} className='flex items-start gap-3 px-4 py-3'>
                  <Skeleton className='size-9 shrink-0 rounded-lg' />
                  <div className='flex flex-1 flex-col gap-2'>
                    <Skeleton className='h-4 w-40' />
                    <Skeleton className='h-4 w-full max-w-md' />
                    <Skeleton className='h-3 w-28' />
                  </div>
                </li>
              ))}
            </ul>
          ) : visible.length === 0 ? (
            <div className='flex h-40 flex-col items-center justify-center gap-2 text-sm text-muted-foreground'>
              <BellIcon className='size-6' />
              {filter === 'unread' ? 'No unread notifications.' : 'No notifications.'}
            </div>
          ) : (
            <ul className='divide-y'>
              {visible.map((n) => {
                const Icon = typeIcon[n.type];
                return (
                  <li
                    key={n.id}
                    className={`flex items-start gap-3 px-4 py-3 ${n.read ? '' : 'bg-muted/40'}`}
                  >
                    <div className='mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg border bg-background'>
                      <Icon className='size-4' />
                    </div>
                    <div className='min-w-0 flex-1'>
                      <div className='flex items-center gap-2'>
                        {!n.read && (
                          <span
                            className='size-2 shrink-0 rounded-full bg-primary'
                            aria-label='Unread'
                          />
                        )}
                        <p
                          className={`truncate text-sm ${n.read ? 'font-normal' : 'font-semibold'}`}
                        >
                          {n.title}
                        </p>
                      </div>
                      <p className='text-sm text-muted-foreground'>{n.message}</p>
                      <p className='mt-1 text-xs text-muted-foreground tabular-nums'>
                        {formatDateTime(n.date, n.time)}
                      </p>
                    </div>
                    <div className='flex shrink-0 gap-1'>
                      <Button
                        variant='ghost'
                        size='icon-sm'
                        disabled={busy?.id === n.id}
                        onClick={() => toggleRead(n.id)}
                        aria-label={n.read ? 'Mark as unread' : 'Mark as read'}
                        title={n.read ? 'Mark as unread' : 'Mark as read'}
                      >
                        {busy?.id === n.id && busy.action === 'read' ? (
                          <Spinner />
                        ) : n.read ? (
                          <MailOpenIcon />
                        ) : (
                          <CheckIcon />
                        )}
                      </Button>
                      <Button
                        variant='ghost'
                        size='icon-sm'
                        disabled={busy?.id === n.id}
                        onClick={() => remove(n.id)}
                        aria-label='Delete notification'
                        title='Delete'
                      >
                        {busy?.id === n.id && busy.action === 'delete' ? (
                          <Spinner />
                        ) : (
                          <Trash2Icon />
                        )}
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
