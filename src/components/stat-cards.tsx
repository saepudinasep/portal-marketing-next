import type { LucideIcon } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export type StatCardItem = {
  label: string;
  value: string | number;
  icon: LucideIcon;
  badge: string;
  title: string;
  note: string;
};

// Kelas harus ditulis utuh (Tailwind tidak mendeteksi class yang disusun dinamis)
const gridCols: Record<number, string> = {
  1: '',
  2: '@xl/main:grid-cols-2',
  3: '@3xl/main:grid-cols-3',
  4: '@xl/main:grid-cols-2 @5xl/main:grid-cols-4',
};

/** Baris card ringkasan yang bisa dipakai ulang; jumlah kolom menyesuaikan jumlah card. */
export function StatCards({ items }: { items: StatCardItem[] }) {
  return (
    <div
      className={`grid grid-cols-1 gap-4 *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs dark:*:data-[slot=card]:bg-card ${gridCols[items.length] ?? gridCols[4]}`}
    >
      {items.map(({ label, value, icon: Icon, badge, title, note }) => (
        <Card key={label} className='@container/card'>
          <CardHeader>
            <CardDescription>{label}</CardDescription>
            <CardTitle className='text-2xl font-semibold tabular-nums @[250px]/card:text-3xl'>
              {value}
            </CardTitle>
            <CardAction>
              <Badge variant='outline'>{badge}</Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className='flex-col items-start gap-1.5 text-sm'>
            <div className='line-clamp-1 flex gap-2 font-medium'>
              {title} <Icon className='size-4' />
            </div>
            <div className='text-muted-foreground'>{note}</div>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
