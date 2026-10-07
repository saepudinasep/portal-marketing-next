'use client';

import * as React from 'react';
import {
  CalendarCheckIcon,
  CalendarDaysIcon,
  CheckIcon,
  ListChecksIcon,
  LockIcon,
} from 'lucide-react';

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
import { Spinner } from '@/components/ui/spinner';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useFakeLoad, wait } from '@/lib/fake-api';
import {
  DAYS,
  classes,
  detailSchedules,
  getShift,
  getSubject,
  getTeacher,
  headerSchedules,
  subjects,
} from '@/lib/dummy-data';

const gradeLabel: Record<number, string> = { 10: 'X', 11: 'XI', 12: 'XII' };

type Row = {
  detailId: number;
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

/** Mata pelajaran tingkat kelas ini yang belum punya satu pun sesi di jadwal. */
function missingSubjects(className: string) {
  const header = headerSchedules.find((h) => h.className === className)!;
  const grade = classes.find((c) => c.className === className)!.grade;
  return subjects
    .filter((s) => s.grade === grade)
    .filter(
      (s) =>
        !detailSchedules.some(
          (d) => d.scheduleId === header.scheduleId && d.subjectId === s.subjectId,
        ),
    );
}

export function FinalizeSchedule() {
  // className -> sudah difinalisasi? (cerminan HeaderSchedule.Finalize)
  const [finalized, setFinalized] = React.useState<Record<string, boolean>>(() =>
    Object.fromEntries(headerSchedules.map((h) => [h.className, h.finalize === 1])),
  );
  // buka kelas draft pertama supaya tombol Finalize langsung bisa dicoba
  const [className, setClassName] = React.useState(
    () => headerSchedules.find((h) => h.finalize === 0)?.className ?? classes[0].className,
  );
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [finalizing, setFinalizing] = React.useState(false);
  const loading = useFakeLoad(className); // ganti dengan isLoading dari API

  const room = classes.find((c) => c.className === className)!;
  const header = headerSchedules.find((h) => h.className === className)!;
  const isFinal = finalized[className];

  const rows: Row[] = detailSchedules
    .filter((d) => d.scheduleId === header.scheduleId)
    .sort((a, b) => DAYS.indexOf(a.day) - DAYS.indexOf(b.day) || a.shiftId - b.shiftId)
    .map((d) => ({
      detailId: d.detailId,
      subjectId: d.subjectId,
      subject: getSubject(d.subjectId).name,
      teacherId: d.teacherId,
      teacher: getTeacher(d.teacherId).name,
      day: d.day,
      shift: `${d.shiftId} (${getShift(d.shiftId).time})`,
    }));

  const missing = missingSubjects(className);
  const canFinalize = !isFinal && rows.length > 0 && missing.length === 0;

  const totalClasses = classes.length;
  const finalizedCount = classes.filter((c) => finalized[c.className]).length;
  const readyCount = classes.filter(
    (c) => !finalized[c.className] && missingSubjects(c.className).length === 0,
  ).length;
  const neededCount = subjects.filter((s) => s.grade === room.grade).length;

  const classItems = classes.map((c) => ({
    value: c.className,
    label: `${c.className} · Grade ${gradeLabel[c.grade]} · ${finalized[c.className] ? 'Finalized' : 'Draft'}`,
  }));

  return (
    <div className='flex flex-col gap-4 md:gap-6'>
      <StatCards
        loading={loading}
        items={[
          {
            label: 'Finalized Schedules',
            value: `${finalizedCount}/${totalClasses}`,
            icon: CalendarCheckIcon,
            badge: `${Math.round((finalizedCount / totalClasses) * 100)}%`,
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
        <Button disabled={!canFinalize || loading} onClick={() => setConfirmOpen(true)}>
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

      <SimpleDataTable
        loading={loading}
        data={rows}
        columns={columns}
        getRowId={(r) => String(r.detailId)}
      />

      <AlertDialog open={confirmOpen} onOpenChange={(open) => !finalizing && setConfirmOpen(open)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Finalize schedule for {className}?</AlertDialogTitle>
            <AlertDialogDescription>
              After finalizing, the {rows.length} sessions of this class can no longer be inserted,
              updated, or deleted. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button variant='outline' disabled={finalizing} onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={finalizing}
              onClick={async () => {
                setFinalizing(true);
                await wait(); // ganti dengan PATCH HeaderSchedule.Finalize = 1 ke API
                setFinalized((f) => ({ ...f, [className]: true }));
                setFinalizing(false);
                setConfirmOpen(false);
              }}
            >
              {finalizing && <Spinner />}
              {finalizing ? 'Finalizing...' : 'Yes, finalize'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
