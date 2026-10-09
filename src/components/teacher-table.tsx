'use client';

import * as React from 'react';
import {
  CalendarCheckIcon,
  GraduationCapIcon,
  MarsIcon,
  KeyRoundIcon,
  PlusIcon,
  VenusIcon,
} from 'lucide-react';

import type { ActionResult } from '@/actions/result';
import {
  createTeacher,
  deleteTeacher,
  resetTeacherPassword,
  updateTeacher,
} from '@/actions/teachers';
import { ResetPasswordDialog } from '@/components/reset-password-dialog';
import { SimpleDataTable, type Column } from '@/components/simple-data-table';
import { StatCards } from '@/components/stat-cards';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Spinner } from '@/components/ui/spinner';
import type { Teacher } from '@/lib/dummy-data';

// columns berisi fungsi, jadi harus didefinisikan di file client (bukan di page server)
const columns: Column<Teacher>[] = [
  { header: 'Teacher ID', cell: (t) => t.teacherId },
  { header: 'Name', cell: (t) => t.name, className: 'font-medium' },
  { header: 'Address', cell: (t) => t.address },
  { header: 'Gender', cell: (t) => t.gender },
  { header: 'Date of Birth', cell: (t) => t.dateOfBirth },
  { header: 'Phone Number', cell: (t) => t.phoneNumber },
];

const emptyTeacher: Teacher = {
  teacherId: '',
  name: '',
  address: '',
  gender: 'Male',
  dateOfBirth: '',
  phoneNumber: '',
  photo: null,
};

/** Satu form untuk Insert dan Update. Validasi akhir dilakukan di server (Zod). */
function TeacherFormSheet({
  mode,
  teacher,
  existingIds,
  onSave,
  onClose,
}: {
  mode: 'insert' | 'update';
  teacher: Teacher;
  existingIds: string[];
  onSave: (t: Teacher) => Promise<ActionResult>;
  onClose: () => void;
}) {
  const [form, setForm] = React.useState<Teacher>(teacher);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState('');
  const set = <K extends keyof Teacher>(key: K, value: Teacher[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setError('');
  };

  const id = form.teacherId.trim();
  const duplicateId = mode === 'insert' && existingIds.includes(id);
  const valid =
    id !== '' &&
    !duplicateId &&
    form.name.trim() !== '' &&
    form.address.trim() !== '' &&
    form.dateOfBirth !== '' &&
    form.phoneNumber.trim() !== '';

  const submit = async () => {
    setSaving(true);
    setError('');
    try {
      const result = await onSave({ ...form, teacherId: id });
      if (result.ok) onClose();
      else setError(result.error);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open onOpenChange={(open) => !open && !saving && onClose()}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{mode === 'insert' ? 'Insert Teacher' : 'Update Teacher'}</SheetTitle>
          <SheetDescription>
            {mode === 'insert'
              ? 'Fill in the data for the new teacher.'
              : `Edit data for ${teacher.teacherId}.`}
          </SheetDescription>
        </SheetHeader>
        <div className='flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4'>
          <div className='flex flex-col gap-2'>
            <Label htmlFor='teacherId'>Teacher ID</Label>
            <Input
              id='teacherId'
              maxLength={8}
              value={form.teacherId}
              disabled={mode === 'update'}
              aria-invalid={duplicateId}
              onChange={(e) => set('teacherId', e.target.value)}
            />
            {duplicateId && <p className='text-xs text-destructive'>Teacher ID already exists.</p>}
          </div>
          <div className='flex flex-col gap-2'>
            <Label htmlFor='name'>Teacher Name</Label>
            <Input
              id='name'
              maxLength={50}
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
            />
          </div>
          <div className='flex flex-col gap-2'>
            <Label htmlFor='address'>Address</Label>
            <Input
              id='address'
              maxLength={100}
              value={form.address}
              onChange={(e) => set('address', e.target.value)}
            />
          </div>
          <div className='flex flex-col gap-2'>
            <Label>Gender</Label>
            <Select
              value={form.gender}
              onValueChange={(v) => v && set('gender', v as Teacher['gender'])}
            >
              <SelectTrigger className='w-full' aria-label='Gender'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='Male'>Male</SelectItem>
                <SelectItem value='Female'>Female</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className='flex flex-col gap-2'>
            <Label htmlFor='dob'>Date of Birth</Label>
            <Input
              id='dob'
              type='date'
              value={form.dateOfBirth}
              onChange={(e) => set('dateOfBirth', e.target.value)}
            />
          </div>
          <div className='flex flex-col gap-2'>
            <Label htmlFor='phone'>Phone Number</Label>
            <Input
              id='phone'
              inputMode='numeric'
              maxLength={12}
              value={form.phoneNumber}
              onChange={(e) => set('phoneNumber', e.target.value.replace(/\D/g, ''))}
            />
          </div>
          {error && (
            <p role='alert' className='text-sm text-destructive'>
              {error}
            </p>
          )}
        </div>
        <SheetFooter className='border-t'>
          <Button disabled={!valid || saving} onClick={submit}>
            {saving && <Spinner />}
            {saving ? 'Saving...' : 'Save'}
          </Button>
          <Button variant='outline' disabled={saving} onClick={onClose}>
            Cancel
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

export function TeacherTable({
  initialData,
  classCount,
  scheduledCount,
}: {
  initialData: Teacher[];
  classCount: number;
  /** Jumlah guru yang punya jadwal mengajar (dihitung di server). */
  scheduledCount: number;
}) {
  // Data datang dari server (props). Setelah Server Action memanggil revalidatePath,
  // Next.js mengirim props baru sehingga tabel ikut ter-update.
  const data = initialData;
  const [editing, setEditing] = React.useState<Teacher | null>(null);
  const [inserting, setInserting] = React.useState(false);
  const [resetting, setResetting] = React.useState<{ id: string; name: string } | null>(null);

  // Card ikut berubah saat data di-insert/update/delete
  const total = data.length;
  const male = data.filter((t) => t.gender === 'Male').length;
  const female = total - male;
  const pct = (n: number) => (total ? `${Math.round((n / total) * 100)}%` : '0%');

  return (
    <div className='flex flex-col gap-4 md:gap-6'>
      <StatCards
        items={[
          {
            label: 'Total Teachers',
            value: total,
            icon: GraduationCapIcon,
            badge: `${classCount} classes`,
            title: 'Registered teachers',
            note: 'Teaching grade X, XI and XII',
          },
          {
            label: 'Male Teachers',
            value: male,
            icon: MarsIcon,
            badge: pct(male),
            title: 'Male teachers',
            note: `${male} of ${total} teachers`,
          },
          {
            label: 'Female Teachers',
            value: female,
            icon: VenusIcon,
            badge: pct(female),
            title: 'Female teachers',
            note: `${female} of ${total} teachers`,
          },
          {
            label: 'With Teaching Schedule',
            value: `${scheduledCount}/${total}`,
            icon: CalendarCheckIcon,
            badge: pct(scheduledCount),
            title: `${total - scheduledCount} teachers without a schedule`,
            note: 'Manage in the Manage Schedule page',
          },
        ]}
      />

      <SimpleDataTable
        data={data}
        columns={columns}
        getRowId={(t) => t.teacherId}
        getRowLabel={(t) => t.name}
        searchText={(t) => `${t.teacherId} ${t.name}`}
        onEdit={setEditing}
        extraActions={[
          {
            label: 'Reset Password',
            icon: <KeyRoundIcon />,
            onSelect: (row) => setResetting({ id: row.teacherId, name: row.name }),
          },
        ]}
        onDelete={(t) => deleteTeacher(t.teacherId)}
        toolbarActions={
          <Button onClick={() => setInserting(true)}>
            <PlusIcon />
            Insert
          </Button>
        }
      />

      {inserting && (
        <TeacherFormSheet
          mode='insert'
          teacher={emptyTeacher}
          existingIds={data.map((t) => t.teacherId)}
          onClose={() => setInserting(false)}
          onSave={createTeacher}
        />
      )}
      {editing && (
        <TeacherFormSheet
          key={editing.teacherId}
          mode='update'
          teacher={editing}
          existingIds={[]}
          onClose={() => setEditing(null)}
          onSave={updateTeacher}
        />
      )}

      {resetting && (
        <ResetPasswordDialog
          key={resetting.id}
          name={resetting.name}
          noun='teacher'
          onReset={() => resetTeacherPassword(resetting.id)}
          onClose={() => setResetting(null)}
        />
      )}
    </div>
  );
}
