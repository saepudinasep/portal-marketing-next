'use client';

import * as React from 'react';
import { CalendarCheckIcon, CalendarDaysIcon, UserRoundCheckIcon } from 'lucide-react';

import { SimpleDataTable, type Column } from '@/components/simple-data-table';
import { StatCards } from '@/components/stat-cards';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DAYS,
  classes,
  detailSchedules,
  getShift,
  getSubject,
  getTeacher,
  headerSchedules,
} from '@/lib/dummy-data';

const gradeLabel: Record<number, string> = { 10: 'X', 11: 'XI', 12: 'XII' };
const ALL = 'all';

type Row = {
  detailId: number;
  subjectId: string;
  subject: string;
  day: string;
  time: string;
  teacher: string;
};

const columns: Column<Row>[] = [
  { header: 'Subject ID', cell: (r) => r.subjectId },
  { header: 'Subject', cell: (r) => r.subject, className: 'font-medium' },
  { header: 'Day', cell: (r) => r.day },
  { header: 'Time', cell: (r) => r.time, className: 'tabular-nums' },
  { header: 'Teacher Name', cell: (r) => r.teacher },
];

export function ClassSchedule() {
  const [className, setClassName] = React.useState(classes[0].className);
  const [day, setDay] = React.useState<string>(ALL);

  const room = classes.find((c) => c.className === className)!;
  const header = headerSchedules.find((h) => h.className === className)!;
  const finalized = header.finalize === 1;

  const weekRows: Row[] = detailSchedules
    .filter((d) => d.scheduleId === header.scheduleId)
    .sort((a, b) => DAYS.indexOf(a.day) - DAYS.indexOf(b.day) || a.shiftId - b.shiftId)
    .map((d) => ({
      detailId: d.detailId,
      subjectId: d.subjectId,
      subject: getSubject(d.subjectId).name,
      day: d.day,
      time: getShift(d.shiftId).time,
      teacher: getTeacher(d.teacherId).name,
    }));
  const rows = day === ALL ? weekRows : weekRows.filter((r) => r.day === day);
  const teachersCount = new Set(detailSchedules.filter((d) => d.scheduleId === header.scheduleId).map((d) => d.teacherId)).size;

  const classItems = classes.map((c) => ({
    value: c.className,
    label: `${c.className} · Grade ${gradeLabel[c.grade]}`,
  }));
  const dayItems = [{ value: ALL, label: 'All days' }, ...DAYS.map((d) => ({ value: d, label: d }))];

  return (
    <div className='flex flex-col gap-4 md:gap-6'>
      <StatCards
        items={[
          {
            label: `Class ${className}`,
            value: weekRows.length,
            icon: CalendarDaysIcon,
            badge: finalized ? 'Finalized' : 'Draft',
            title: 'Sessions this week',
            note: `Grade ${gradeLabel[room.grade]}`,
          },
          {
            label: day === ALL ? 'Sessions Shown' : `Sessions on ${day}`,
            value: rows.length,
            icon: CalendarCheckIcon,
            badge: day === ALL ? 'All days' : day.slice(0, 3),
            title: 'Matching the day filter',
            note: `${weekRows.length - rows.length} sessions on other days`,
          },
          {
            label: 'Teachers',
            value: teachersCount,
            icon: UserRoundCheckIcon,
            badge: `${className}`,
            title: 'Teachers teaching this class',
            note: 'Across all days of the week',
          },
        ]}
      />

      <div className='flex flex-wrap items-center gap-x-6 gap-y-3'>
        <div className='flex items-center gap-3'>
          <Label>Class Name</Label>
          <Select items={classItems} value={className} onValueChange={(v) => v && setClassName(v)}>
            <SelectTrigger className='w-44' aria-label='Class'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {classItems.map((i) => (
                <SelectItem key={i.value} value={i.value}>
                  {i.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className='flex items-center gap-3'>
          <Label>Day</Label>
          <Select items={dayItems} value={day} onValueChange={(v) => v && setDay(v)}>
            <SelectTrigger className='w-40' aria-label='Day'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {dayItems.map((i) => (
                <SelectItem key={i.value} value={i.value}>
                  {i.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {!finalized && <Badge variant='outline'>Draft — this schedule may still change</Badge>}
      </div>

      <SimpleDataTable data={rows} columns={columns} getRowId={(r) => String(r.detailId)} />
    </div>
  );
}
