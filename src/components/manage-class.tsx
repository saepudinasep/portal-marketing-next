'use client';

import * as React from 'react';
import {
  ChevronsLeftIcon,
  ChevronsRightIcon,
  GraduationCapIcon,
  SchoolIcon,
  UsersIcon,
} from 'lucide-react';

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
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useFakeLoad, wait } from '@/lib/fake-api';
import { classes, detailClasses, students, type Student } from '@/lib/dummy-data';

const gradeLabel: Record<number, string> = { 10: 'X', 11: 'XI', 12: 'XII' };

function StudentPicker({
  title,
  description,
  list,
  selected,
  onChange,
  emptyText,
  loading = false,
}: {
  title: string;
  description: string;
  list: Student[];
  selected: string[];
  onChange: (ids: string[]) => void;
  emptyText: string;
  loading?: boolean;
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
              {loading &&
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={`skeleton-${i}`} aria-busy='true'>
                    <TableCell>
                      <Skeleton className='size-4' />
                    </TableCell>
                    <TableCell>
                      <Skeleton className='h-4 w-20' />
                    </TableCell>
                    <TableCell>
                      <Skeleton className='h-4 w-32' />
                    </TableCell>
                  </TableRow>
                ))}
              {!loading &&
                list.map((s) => (
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
              {!loading && list.length === 0 && (
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

export function ManageClass() {
  // studentId -> className (cerminan tabel DetailClass)
  const [assignments, setAssignments] = React.useState<Record<string, string>>(() =>
    Object.fromEntries(detailClasses.map((d) => [d.studentId, d.className])),
  );
  const [className, setClassName] = React.useState(classes[0].className);
  const [leftSel, setLeftSel] = React.useState<string[]>([]);
  const [rightSel, setRightSel] = React.useState<string[]>([]);
  // data konfirmasi disimpan terpisah dari `open` supaya isi dialog tidak berubah saat animasi tutup
  const [confirm, setConfirm] = React.useState<{ type: 'add' | 'remove'; ids: string[] } | null>(
    null,
  );
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [confirming, setConfirming] = React.useState(false);
  const loading = useFakeLoad(className); // ganti dengan isLoading dari API

  const room = classes.find((c) => c.className === className)!;
  const available = students.filter((s) => !assignments[s.studentId]);
  const participants = students.filter((s) => assignments[s.studentId] === className);
  const male = participants.filter((s) => s.gender === 'Male').length;
  const assignedTotal = students.length - available.length;

  const askConfirm = (type: 'add' | 'remove') => {
    setConfirm({ type, ids: type === 'add' ? leftSel : rightSel });
    setConfirmOpen(true);
  };

  const runConfirmed = async () => {
    if (!confirm) return;
    setConfirming(true);
    await wait(); // ganti dengan POST/DELETE ke API (tabel DetailClass)
    setConfirming(false);
    if (confirm.type === 'add') {
      setAssignments((a) => ({
        ...a,
        ...Object.fromEntries(confirm.ids.map((id) => [id, className])),
      }));
      setLeftSel([]);
    } else {
      setAssignments((a) => {
        const next = { ...a };
        confirm.ids.forEach((id) => delete next[id]);
        return next;
      });
      setRightSel([]);
    }
    setConfirmOpen(false);
  };

  const confirmNames = (confirm?.ids ?? []).map(
    (id) => students.find((s) => s.studentId === id)?.name ?? id,
  );
  const confirmCount = confirmNames.length;
  const studentWord = confirmCount === 1 ? 'student' : 'students';

  return (
    <div className='flex flex-col gap-4 md:gap-6'>
      <StatCards
        loading={loading}
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
          loading={loading}
          selected={leftSel}
          onChange={setLeftSel}
          emptyText='All students already have a class.'
        />
        <div className='flex justify-center gap-2 lg:flex-col'>
          <Button
            variant='outline'
            size='icon'
            disabled={leftSel.length === 0 || loading}
            onClick={() => askConfirm('add')}
            aria-label={`Add ${leftSel.length} selected students to ${className}`}
          >
            <ChevronsRightIcon className='max-lg:rotate-90' />
          </Button>
          <Button
            variant='outline'
            size='icon'
            disabled={rightSel.length === 0 || loading}
            onClick={() => askConfirm('remove')}
            aria-label={`Remove ${rightSel.length} selected students from ${className}`}
          >
            <ChevronsLeftIcon className='max-lg:rotate-90' />
          </Button>
        </div>
        <StudentPicker
          title='Participate Student'
          description={`Students in class ${className}. Check students, then press «`}
          list={participants}
          loading={loading}
          selected={rightSel}
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
