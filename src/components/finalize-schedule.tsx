'use client';

import * as React from 'react';
import {
  CalendarCheckIcon,
  CalendarDaysIcon,
  CheckIcon,
  ListChecksIcon,
  LockIcon,
} from 'lucide-react';

import { finalizeSchedule } from '@/actions/schedules';
import { SimpleDataTable, type Column } from '@/components/simple-data-table';
import { StatCards } from '@/components/stat-cards';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { DAYS, GRADE_LABEL, type ScheduleBundle } from '@/lib/schedule-types';

type Row = {
  id: string;
  subjectId: string;
  subject: string;
  teacherId: string;
  teacher: string;
  day: string;
  shift: string;
};

const columns: Column<Row>[] = [
  { header: 'Subject ID', cell: (r) => r.subjectId },
  { header: 'Subject', cell: (r) => r.subject, className: 'font-medium' },
  { header: 'Teacher ID', cell: (r) => r.teacherId },
  { header: 'Teacher Name', cell: (r) => r.teacher },
  { header: 'Day', cell: (r) => r.day },
  { header: 'Shift', cell: (r) => r.shift, className: 'tabular-nums' },
];

export function FinalizeSchedule({ bundle }: { bundle: ScheduleBundle }) {
  const { classes, subjects, teachers, shifts, sessions } = bundle;
  // buka kelas draft pertama supaya tombol Finalize langsung bisa dicoba
  const [className, setClassName] = React.useState(
    () => classes.find((c) => !c.finalized)?.className ?? classes[0]?.className ?? '',
  );
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [finalizing, setFinalizing] = React.useState(false);
  const [finalizeError, setFinalizeError] = React.useState('');

  const room = classes.find((c) => c.className === className);
  if (!room) {
    return (
      <Card>
        <CardContent className='flex h-32 items-center justify-center text-sm text-muted-foreground'>
          No classes found in the database.
        </CardContent>
      </Card>
    );
  }
  const isFinal = room.finalized;

  /** Mata pelajaran tingkat kelas itu yang belum punya satu pun sesi di jadwal. */
  const missingFor = (c: { className: string; grade: number }) =>
    subjects.filter(
      (s) =>
        s.grade === c.grade &&
        !sessions.some((d) => d.className === c.className && d.subjectId === s.subjectId),
    );

  const rows: Row[] = sessions
    .filter((d) => d.className === className)
    .sort((a, b) => DAYS.indexOf(a.day) - DAYS.indexOf(b.day) || a.shiftId - b.shiftId)
    .map((d) => ({
      id: d.id,
      subjectId: d.subjectId,
      subject: subjects.find((s) => s.subjectId === d.subjectId)?.name ?? d.subjectId,
      teacherId: d.teacherId,
      teacher: teachers.find((t) => t.teacherId === d.teacherId)?.name ?? d.teacherId,
      day: d.day,
      shift: `${d.shiftId} (${shifts.find((s) => s.shiftId === d.shiftId)?.time ?? '-'})`,
    }));

  const missing = missingFor(room);
  const canFinalize = !isFinal && rows.length > 0 && missing.length === 0;

  const totalClasses = classes.length;
  const finalizedCount = classes.filter((c) => c.finalized).length;
  const readyCount = classes.filter((c) => !c.finalized && missingFor(c).length === 0).length;
  const neededCount = subjects.filter((s) => s.grade === room.grade).length;

  const classItems = classes.map((c) => ({
    value: c.className,
    label: `${c.className} · Grade ${GRADE_LABEL[c.grade]} · ${c.finalized ? 'Finalized' : 'Draft'}`,
  }));

  const runFinalize = async () => {
    setFinalizing(true);
    setFinalizeError('');
    try {
      const result = await finalizeSchedule(className);
      if (!result.ok) {
        setFinalizeError(result.error); // dialog tetap terbuka
        return;
      }
      setConfirmOpen(false); // props baru dari server membuat status kelas berubah jadi Finalized
    } catch {
      setFinalizeError('Network error. Please try again.');
    } finally {
      setFinalizing(false);
    }
  };

  return (
    <div className='flex flex-col gap-4 md:gap-6'>
      <StatCards
        items={[
          {
            label: 'Finalized Schedules',
            value: `${finalizedCount}/${totalClasses}`,
            icon: CalendarCheckIcon,
            badge: `${totalClasses ? Math.round((finalizedCount / totalClasses) * 100) : 0}%`,
            title: `${totalClasses - finalizedCount} schedules still in draft`,
            note: 'Finalized schedules are locked',
          },
          {
            label: `Class ${className}`,
            value: rows.length,
            icon: CalendarDaysIcon,
            badge: isFinal ? 'Finalized' : 'Draft',
            title: 'Teaching sessions this week',
            note: `${neededCount - missing.length}/${neededCount} subjects scheduled`,
          },
          {
            label: 'Ready to Finalize',
            value: readyCount,
            icon: ListChecksIcon,
            badge: 'Draft only',
            title: 'Draft schedules with all subjects',
            note: 'Every subject needs at least one session',
          },
        ]}
      />

      <div className='flex flex-wrap items-center justify-between gap-3'>
        <div className='flex items-center gap-3'>
          <Label>Class ID</Label>
          <Select items={classItems} value={className} onValueChange={(v) => v && setClassName(v)}>
            <SelectTrigger className='w-60' aria-label='Class'>
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
          <Badge variant={isFinal ? 'default' : 'outline'}>{isFinal ? 'Finalized' : 'Draft'}</Badge>
        </div>
        <Button
          disabled={!canFinalize}
          onClick={() => {
            setFinalizeError('');
            setConfirmOpen(true);
          }}
        >
          {isFinal ? <CheckIcon /> : <CalendarCheckIcon />}
          {isFinal ? 'Finalized' : 'Finalize'}
        </Button>
      </div>

      {isFinal && (
        <div className='flex items-center gap-2 rounded-lg border bg-muted/50 px-4 py-3 text-sm'>
          <LockIcon className='size-4 shrink-0' />
          Schedule for {className} is finalized and can no longer be changed.
        </div>
      )}
      {!isFinal && missing.length > 0 && (
        <div className='rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm'>
          Cannot finalize yet. Not scheduled:{' '}
          {missing.map((s) => `${s.subjectId} ${s.name}`).join(', ')}.
        </div>
      )}

      <SimpleDataTable data={rows} columns={columns} getRowId={(r) => r.id} />

      <AlertDialog open={confirmOpen} onOpenChange={(open) => !finalizing && setConfirmOpen(open)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Finalize schedule for {className}?</AlertDialogTitle>
            <AlertDialogDescription>
              After finalizing, the {rows.length} sessions of this class can no longer be inserted,
              updated, or deleted. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {finalizeError && (
            <p
              role='alert'
              className='rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive'
            >
              {finalizeError}
            </p>
          )}
          <AlertDialogFooter>
            <Button variant='outline' disabled={finalizing} onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button disabled={finalizing} onClick={runFinalize}>
              {finalizing && <Spinner />}
              {finalizing ? 'Finalizing...' : 'Yes, finalize'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
