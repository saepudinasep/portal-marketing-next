'use client';

import * as React from 'react';
import {
  BookOpenIcon,
  CalendarDaysIcon,
  ListChecksIcon,
  LockIcon,
  PlusIcon,
  UserRoundCheckIcon,
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
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  DAYS,
  classes,
  detailSchedules as initialDetails,
  expertise,
  getShift,
  getSubject,
  getTeacher,
  headerSchedules,
  shifts,
  subjects,
  type Day,
  type DetailSchedule,
} from '@/lib/dummy-data';

const gradeLabel: Record<number, string> = { 10: 'X', 11: 'XI', 12: 'XII' };

type Row = {
  detailId: number;
  subjectId: string;
  subject: string;
  teacherId: string;
  teacher: string;
  shiftId: number;
  time: string;
};

const columns: Column<Row>[] = [
  { header: 'Subject ID', cell: (r) => r.subjectId },
  { header: 'Subject', cell: (r) => r.subject, className: 'font-medium' },
  { header: 'Teacher ID', cell: (r) => r.teacherId },
  { header: 'Teacher Name', cell: (r) => r.teacher },
  { header: 'Shift', cell: (r) => `${r.shiftId} (${r.time})`, className: 'tabular-nums' },
];

type FormValue = { subjectId: string; shiftId: number | null; teacherId: string };

/** Form Insert / Update jadwal. Shift yang terpakai dan guru yang bentrok otomatis dinonaktifkan. */
function ScheduleFormSheet({
  mode,
  className,
  day,
  grade,
  scheduleId,
  editingId,
  details,
  initial,
  onSave,
  onClose,
}: {
  mode: 'insert' | 'update';
  className: string;
  day: Day;
  grade: number;
  scheduleId: number;
  editingId: number | null;
  details: DetailSchedule[];
  initial: FormValue;
  onSave: (v: { subjectId: string; shiftId: number; teacherId: string }) => void;
  onClose: () => void;
}) {
  const [form, setForm] = React.useState<FormValue>(initial);

  const subjectItems = subjects
    .filter((s) => s.grade === grade)
    .map((s) => ({ value: s.subjectId, label: `${s.subjectId} - ${s.name}` }));

  // shift yang sudah dipakai kelas ini pada hari yang sama
  const takenShifts = new Set(
    details
      .filter((d) => d.scheduleId === scheduleId && d.day === day && d.detailId !== editingId)
      .map((d) => d.shiftId)
  );
  const shiftItems = shifts.map((s) => ({
    value: String(s.shiftId),
    label: `${s.shiftId} (${s.time})${takenShifts.has(s.shiftId) ? ' - taken' : ''}`,
  }));

  // guru bentrok = sudah mengajar di kelas lain pada hari & shift yang sama
  const isBusy = (teacherId: string, shiftId: number | null) =>
    shiftId !== null &&
    details.some(
      (d) => d.teacherId === teacherId && d.day === day && d.shiftId === shiftId && d.detailId !== editingId
    );
  const teacherItems = form.subjectId
    ? expertise
        .filter((e) => e.subjectId === form.subjectId)
        .map((e) => getTeacher(e.teacherId))
        .map((t) => ({
          value: t.teacherId,
          label: `${t.teacherId} - ${t.name}${isBusy(t.teacherId, form.shiftId) ? ' - busy' : ''}`,
        }))
    : [];

  const valid =
    form.subjectId !== '' &&
    form.shiftId !== null &&
    form.teacherId !== '' &&
    !takenShifts.has(form.shiftId) &&
    !isBusy(form.teacherId, form.shiftId);

  return (
    <Sheet open onOpenChange={(open) => !open && onClose()}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{mode === 'insert' ? 'Insert Schedule' : 'Update Schedule'}</SheetTitle>
          <SheetDescription>
            Class {className} · {day}
          </SheetDescription>
        </SheetHeader>
        <div className='flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4'>
          <div className='flex flex-col gap-2'>
            <Label>Subject</Label>
            <Select
              items={subjectItems}
              value={form.subjectId || null}
              onValueChange={(v) => v && setForm({ subjectId: v, shiftId: form.shiftId, teacherId: '' })}
            >
              <SelectTrigger className='w-full' aria-label='Subject'>
                <SelectValue placeholder='Select subject' />
              </SelectTrigger>
              <SelectContent>
                {subjectItems.map((i) => (
                  <SelectItem key={i.value} value={i.value}>
                    {i.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className='flex flex-col gap-2'>
            <Label>Shift</Label>
            <Select
              items={shiftItems}
              value={form.shiftId === null ? null : String(form.shiftId)}
              onValueChange={(v) => {
                if (!v) return;
                const shiftId = Number(v);
                // kalau guru terpilih jadi bentrok di shift baru, kosongkan pilihan guru
                setForm((f) => ({ ...f, shiftId, teacherId: isBusy(f.teacherId, shiftId) ? '' : f.teacherId }));
              }}
            >
              <SelectTrigger className='w-full' aria-label='Shift'>
                <SelectValue placeholder='Select shift' />
              </SelectTrigger>
              <SelectContent>
                {shiftItems.map((i) => (
                  <SelectItem key={i.value} value={i.value} disabled={takenShifts.has(Number(i.value))}>
                    {i.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className='flex flex-col gap-2'>
            <Label>Teacher</Label>
            <Select
              items={teacherItems}
              value={form.teacherId || null}
              disabled={!form.subjectId}
              onValueChange={(v) => v && setForm((f) => ({ ...f, teacherId: v }))}
            >
              <SelectTrigger className='w-full' aria-label='Teacher'>
                <SelectValue placeholder={form.subjectId ? 'Select teacher' : 'Select a subject first'} />
              </SelectTrigger>
              <SelectContent>
                {teacherItems.map((i) => (
                  <SelectItem key={i.value} value={i.value} disabled={isBusy(i.value, form.shiftId)}>
                    {i.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className='text-xs text-muted-foreground'>
              Only teachers with expertise in the subject are listed. Teachers already teaching another
              class at the same shift are disabled.
            </p>
          </div>
        </div>
        <SheetFooter className='border-t'>
          <Button disabled={!valid} onClick={() => onSave({ subjectId: form.subjectId, shiftId: form.shiftId!, teacherId: form.teacherId })}>
            Save
          </Button>
          <Button variant='outline' onClick={onClose}>
            Cancel
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

/** "View Subject Needed": daftar mata pelajaran untuk tingkat kelas + status sudah dijadwalkan atau belum. */
function SubjectNeededDialog({
  open,
  onClose,
  className,
  grade,
  classDetails,
}: {
  open: boolean;
  onClose: () => void;
  className: string;
  grade: number;
  classDetails: DetailSchedule[];
}) {
  const needed = subjects.filter((s) => s.grade === grade);

  return (
    <AlertDialog open={open} onOpenChange={(o) => !o && onClose()}>
      <AlertDialogContent className='sm:max-w-xl'>
        <AlertDialogHeader>
          <AlertDialogTitle>Subjects needed for {className}</AlertDialogTitle>
          <AlertDialogDescription>
            Subjects for grade {gradeLabel[grade]} and where they are scheduled this week.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className='overflow-hidden rounded-lg border'>
          <Table>
            <TableHeader className='bg-muted'>
              <TableRow>
                <TableHead>Subject ID</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {needed.map((s) => {
                const slots = classDetails.filter((d) => d.subjectId === s.subjectId);
                return (
                  <TableRow key={s.subjectId}>
                    <TableCell>{s.subjectId}</TableCell>
                    <TableCell className='font-medium'>{s.name}</TableCell>
                    <TableCell>
                      {slots.length > 0 ? (
                        <div className='flex flex-wrap items-center gap-1'>
                          <Badge>Scheduled</Badge>
                          <span className='text-xs text-muted-foreground'>
                            {slots.map((d) => `${d.day.slice(0, 3)} #${d.shiftId}`).join(', ')}
                          </span>
                        </div>
                      ) : (
                        <Badge variant='destructive'>Not scheduled</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
        <AlertDialogFooter>
          <Button onClick={onClose}>Close</Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function ManageSchedule() {
  const [details, setDetails] = React.useState<DetailSchedule[]>(initialDetails);
  // buka kelas pertama yang masih draft supaya Insert/Update langsung bisa dicoba
  const [className, setClassName] = React.useState(
    () => headerSchedules.find((h) => h.finalize === 0)?.className ?? classes[0].className
  );
  const [day, setDay] = React.useState<Day>('Monday');
  const [inserting, setInserting] = React.useState(false);
  const [editing, setEditing] = React.useState<Row | null>(null);
  const [showNeeded, setShowNeeded] = React.useState(false);
  const nextId = React.useRef(Math.max(...initialDetails.map((d) => d.detailId)) + 1);

  const room = classes.find((c) => c.className === className)!;
  const header = headerSchedules.find((h) => h.className === className)!;
  const finalized = header.finalize === 1;

  const classDetails = details.filter((d) => d.scheduleId === header.scheduleId);
  const rows: Row[] = classDetails
    .filter((d) => d.day === day)
    .sort((a, b) => a.shiftId - b.shiftId)
    .map((d) => ({
      detailId: d.detailId,
      subjectId: d.subjectId,
      subject: getSubject(d.subjectId).name,
      teacherId: d.teacherId,
      teacher: getTeacher(d.teacherId).name,
      shiftId: d.shiftId,
      time: getShift(d.shiftId).time,
    }));

  const neededSubjects = subjects.filter((s) => s.grade === room.grade);
  const scheduledSubjects = neededSubjects.filter((s) => classDetails.some((d) => d.subjectId === s.subjectId)).length;
  const teachersInvolved = new Set(classDetails.map((d) => d.teacherId)).size;

  const classItems = classes.map((c) => ({ value: c.className, label: `${c.className} · Grade ${gradeLabel[c.grade]}` }));
  const dayItems = DAYS.map((d) => ({ value: d, label: d }));

  return (
    <div className='flex flex-col gap-4 md:gap-6'>
      <StatCards
        items={[
          {
            label: `Class ${className}`,
            value: classDetails.length,
            icon: CalendarDaysIcon,
            badge: finalized ? 'Finalized' : 'Draft',
            title: 'Teaching sessions this week',
            note: `${rows.length} on ${day}`,
          },
          {
            label: 'Subjects Scheduled',
            value: `${scheduledSubjects}/${neededSubjects.length}`,
            icon: BookOpenIcon,
            badge: `Grade ${gradeLabel[room.grade]}`,
            title: `${neededSubjects.length - scheduledSubjects} subjects not scheduled yet`,
            note: 'Use View Subject Needed for details',
          },
          {
            label: 'Teachers Involved',
            value: teachersInvolved,
            icon: UserRoundCheckIcon,
            badge: `${details.length} sessions`,
            title: 'Teachers teaching this class',
            note: 'Badge shows sessions across all classes',
          },
        ]}
      />

      <div className='flex flex-wrap items-center gap-x-6 gap-y-3'>
        <div className='flex items-center gap-3'>
          <Label>Class ID</Label>
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
          <Select items={dayItems} value={day} onValueChange={(v) => v && setDay(v as Day)}>
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
      </div>

      {finalized && (
        <div className='flex items-center gap-2 rounded-lg border bg-muted/50 px-4 py-3 text-sm'>
          <LockIcon className='size-4 shrink-0' />
          Schedule for {className} is finalized and can no longer be changed.
        </div>
      )}

      <SimpleDataTable
        data={rows}
        columns={columns}
        getRowId={(r) => String(r.detailId)}
        getRowLabel={(r) => `${r.subject} (${r.time})`}
        onEdit={finalized ? undefined : setEditing}
        onDelete={
          finalized ? undefined : (r) => setDetails((d) => d.filter((x) => x.detailId !== r.detailId))
        }
        toolbarActions={
          <div className='flex gap-2'>
            <Button variant='outline' onClick={() => setShowNeeded(true)}>
              <ListChecksIcon />
              View Subject Needed
            </Button>
            <Button disabled={finalized} onClick={() => setInserting(true)}>
              <PlusIcon />
              Insert
            </Button>
          </div>
        }
      />

      {inserting && (
        <ScheduleFormSheet
          mode='insert'
          className={className}
          day={day}
          grade={room.grade}
          scheduleId={header.scheduleId}
          editingId={null}
          details={details}
          initial={{ subjectId: '', shiftId: null, teacherId: '' }}
          onClose={() => setInserting(false)}
          onSave={(v) => {
            setDetails((d) => [...d, { detailId: nextId.current++, scheduleId: header.scheduleId, day, ...v }]);
            setInserting(false);
          }}
        />
      )}
      {editing && (
        <ScheduleFormSheet
          key={editing.detailId}
          mode='update'
          className={className}
          day={day}
          grade={room.grade}
          scheduleId={header.scheduleId}
          editingId={editing.detailId}
          details={details}
          initial={{ subjectId: editing.subjectId, shiftId: editing.shiftId, teacherId: editing.teacherId }}
          onClose={() => setEditing(null)}
          onSave={(v) => {
            setDetails((d) => d.map((x) => (x.detailId === editing.detailId ? { ...x, ...v } : x)));
            setEditing(null);
          }}
        />
      )}
      <SubjectNeededDialog
        open={showNeeded}
        onClose={() => setShowNeeded(false)}
        className={className}
        grade={room.grade}
        classDetails={classDetails}
      />
    </div>
  );
}
