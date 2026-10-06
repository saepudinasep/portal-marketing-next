import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { dashboardStats } from '@/lib/dummy-data';
import { CalendarCheckIcon, GraduationCapIcon, SchoolIcon, UserRoundCheckIcon } from 'lucide-react';

export function SectionCards() {
  const s = dashboardStats();

  const cards = [
    {
      label: 'Total Students',
      value: s.students,
      icon: GraduationCapIcon,
      badge: `${s.male} M / ${s.female} F`,
      title: 'Active students enrolled',
      note: `Distributed across ${s.classes} classes`,
    },
    {
      label: 'Total Teachers',
      value: s.teachers,
      icon: UserRoundCheckIcon,
      badge: `${s.subjects} subjects`,
      title: 'Teachers with registered expertise',
      note: 'Grade X, XI and XII',
    },
    {
      label: 'Total Classes',
      value: s.classes,
      icon: SchoolIcon,
      badge: 'A / B',
      title: 'Two classes per grade',
      note: `Average final score ${s.avgFinal}`,
    },
    {
      label: 'Finalized Schedules',
      value: `${s.finalized}/${s.schedules}`,
      icon: CalendarCheckIcon,
      badge: `${Math.round((s.finalized / s.schedules) * 100)}%`,
      title: `${s.schedules - s.finalized} schedules still in draft`,
      note: `Pass rate ${s.passRate}% across all subjects`,
    },
  ];

  return (
    <div className='grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4 dark:*:data-[slot=card]:bg-card'>
      {cards.map(({ label, value, icon: Icon, badge, title, note }) => (
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
