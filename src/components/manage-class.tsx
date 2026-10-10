'use client';

import * as React from 'react';
import {
  ChevronsLeftIcon,
  ChevronsRightIcon,
  GraduationCapIcon,
  SchoolIcon,
  UsersIcon,
} from 'lucide-react';

import { assignStudents, removeStudents } from '@/actions/classes';
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
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { GRADE_LABEL, type ClassStudent, type ManageClassData } from '@/lib/schedule-types';

const gradeLabel = GRADE_LABEL;

function StudentPicker({
  title,
  description,
  list,
  selected,
  onChange,
  emptyText,
}: {
  title: string;
  description: string;
  list: ClassStudent[];
  selected: string[];
  onChange: (ids: string[]) => void;
  emptyText: string;
}) {
  const allSelected = list.length > 0 && selected.length === list.length;
  const toggle = (id: string, checked: boolean) =>
    onChange(checked ? [...selected, id] : selected.filter((x) => x !== id));

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
        <CardAction>
          <Badge variant='outline'>{list.length} students</Badge>
        </CardAction>
      </CardHeader>
      <CardContent>
        <div className='max-h-80 overflow-y-auto rounded-lg border'>
          <Table>
            <TableHeader className='bg-muted'>
              <TableRow>
                <TableHead className='w-10'>
                  <Checkbox
                    aria-label='Select all'
                    checked={allSelected}
                    indeterminate={selected.length > 0 && !allSelected}
                    disabled={list.length === 0}
                    onCheckedChange={(checked) =>
                      onChange(checked ? list.map((s) => s.studentId) : [])
                    }
                  />
                </TableHead>
                <TableHead>Student ID</TableHead>
                <TableHead>Name</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((s) => (
                <TableRow
                  key={s.studentId}
                  data-state={selected.includes(s.studentId) ? 'selected' : undefined}
                  className='cursor-pointer'
                  onClick={() => toggle(s.studentId, !selected.includes(s.studentId))}
                >
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      aria-label={`Select ${s.name}`}
                      checked={selected.includes(s.studentId)}
                      onCheckedChange={(checked) => toggle(s.studentId, checked)}
                    />
                  </TableCell>
                  <TableCell>{s.studentId}</TableCell>
                  <TableCell className='font-medium'>{s.name}</TableCell>
                </TableRow>
              ))}
              {list.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className='h-24 text-center text-muted-foreground'>
                    {emptyText}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

export function ManageClass({ classes, students, assignments }: ManageClassData) {
  const [className, setClassName] = React.useState(classes[0]?.className ?? '');
  const [leftSel, setLeftSel] = React.useState<string[]>([]);
  const [rightSel, setRightSel] = React.useState<string[]>([]);
  // data konfirmasi disimpan terpisah dari `open` supaya isi dialog tidak berubah saat animasi tutup
  const [confirm, setConfirm] = React.useState<{ type: 'add' | 'remove'; ids: string[] } | null>(
    null,
  );
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [confirming, setConfirming] = React.useState(false);
  const [confirmError, setConfirmError] = React.useState('');

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

  const available = students.filter((s) => !assignments[s.studentId]);
  const participants = students.filter((s) => assignments[s.studentId] === className);
  const male = participants.filter((s) => s.gender === 'Male').length;
  const assignedTotal = students.length - available.length;

  // pilihan centang dibersihkan dari siswa yang statusnya sudah berubah (mis. oleh admin lain)
  const leftIds = leftSel.filter((id) => !assignments[id]);
  const rightIds = rightSel.filter((id) => assignments[id] === className);

  const askConfirm = (type: 'add' | 'remove') => {
    setConfirm({ type, ids: type === 'add' ? leftIds : rightIds });
    setConfirmError('');
    setConfirmOpen(true);
  };

  const runConfirmed = async () => {
    if (!confirm) return;
    setConfirming(true);
    setConfirmError('');
    try {
      const result =
        confirm.type === 'add'
          ? await assignStudents(className, confirm.ids)
          : await removeStudents(className, confirm.ids);
      if (!result.ok) {
        setConfirmError(result.error); // dialog tetap terbuka
        return;
      }
      if (confirm.type === 'add') setLeftSel([]);
      else setRightSel([]);
      setConfirmOpen(false);
    } catch {
      setConfirmError('Network error. Please try again.');
    } finally {
      setConfirming(false);
    }
  };

  const confirmNames = (confirm?.ids ?? []).map(
    (id) => students.find((s) => s.studentId === id)?.name ?? id,
  );
  const confirmCount = confirmNames.length;
  const studentWord = confirmCount === 1 ? 'student' : 'students';

  return (
    <div className='flex flex-col gap-4 md:gap-6'>
      <StatCards
        items={[
          {
            label: `Class ${className}`,
            value: participants.length,
            icon: SchoolIcon,
            badge: `Grade ${gradeLabel[room.grade]}`,
            title: 'Participating students',
            note: `${male} male · ${participants.length - male} female`,
          },
          {
            label: 'Unassigned Students',
            value: available.length,
            icon: UsersIcon,
            badge: `${students.length} total`,
            title: 'Waiting for a class',
            note: 'Select students, then press >>',
          },
          {
            label: 'Total Classes',
            value: classes.length,
            icon: GraduationCapIcon,
            badge: `${assignedTotal}/${students.length}`,
            title: 'Students already in a class',
            note: 'Two classes per grade',
          },
        ]}
      />

      <div className='flex items-center gap-3'>
        <Label htmlFor='class-select'>Class Name</Label>
        <Select
          value={className}
          onValueChange={(v) => {
            if (!v) return;
            setClassName(v);
            setRightSel([]);
          }}
        >
          <SelectTrigger id='class-select' className='w-40' aria-label='Class name'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {classes.map((c) => (
              <SelectItem key={c.className} value={c.className}>
                {c.className} · Grade {gradeLabel[c.grade]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className='grid items-center gap-4 lg:grid-cols-[1fr_auto_1fr]'>
        <StudentPicker
          title='Student List'
          description='Students without a class. Check students, then press »'
          list={available}
          selected={leftIds}
          onChange={setLeftSel}
          emptyText='All students already have a class.'
        />
        <div className='flex justify-center gap-2 lg:flex-col'>
          <Button
            variant='outline'
            size='icon'
            disabled={leftIds.length === 0}
            onClick={() => askConfirm('add')}
            aria-label={`Add ${leftIds.length} selected students to ${className}`}
          >
            <ChevronsRightIcon className='max-lg:rotate-90' />
          </Button>
          <Button
            variant='outline'
            size='icon'
            disabled={rightIds.length === 0}
            onClick={() => askConfirm('remove')}
            aria-label={`Remove ${rightIds.length} selected students from ${className}`}
          >
            <ChevronsLeftIcon className='max-lg:rotate-90' />
          </Button>
        </div>
        <StudentPicker
          title='Participate Student'
          description={`Students in class ${className}. Check students, then press «`}
          list={participants}
          selected={rightIds}
          onChange={setRightSel}
          emptyText='No students in this class yet.'
        />
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={(open) => !confirming && setConfirmOpen(open)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirm?.type === 'add'
                ? `Add ${confirmCount} ${studentWord} to class ${className}?`
                : `Remove ${confirmCount} ${studentWord} from class ${className}?`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirm?.type === 'add'
                ? `Are you sure you want to add the selected ${studentWord} to class ${className}?`
                : `Are you sure you want to remove the selected ${studentWord} from class ${className}? They will return to the Student List.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <ul className='max-h-40 list-inside list-disc overflow-y-auto rounded-lg border bg-muted/40 px-3 py-2 text-sm'>
            {confirmNames.map((name) => (
              <li key={name}>{name}</li>
            ))}
          </ul>
          {confirmError && (
            <p
              role='alert'
              className='rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive'
            >
              {confirmError}
            </p>
          )}
          <AlertDialogFooter>
            <Button variant='outline' disabled={confirming} onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button
              variant={confirm?.type === 'remove' ? 'destructive' : 'default'}
              disabled={confirming}
              onClick={runConfirmed}
            >
              {confirming && <Spinner />}
              {confirming ? 'Saving...' : confirm?.type === 'add' ? 'Yes, add' : 'Yes, remove'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
