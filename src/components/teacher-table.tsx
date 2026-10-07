'use client';

import * as React from 'react';
import { CalendarCheckIcon, GraduationCapIcon, MarsIcon, PlusIcon, VenusIcon } from 'lucide-react';

import { SimpleDataTable, type Column } from '@/components/simple-data-table';
import { StatCards } from '@/components/stat-cards';
import { Spinner } from '@/components/ui/spinner';
import { useFakeLoad, wait } from '@/lib/fake-api';
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
import {
  classes,
  detailSchedules,
  teachers as initialTeachers,
  type Teacher,
} from '@/lib/dummy-data';

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

/** Satu form untuk Insert dan Update. Batas panjang mengikuti data dictionary. */
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
  onSave: (t: Teacher) => void | Promise<void>;
  onClose: () => void;
}) {
  const [form, setForm] = React.useState<Teacher>(teacher);
  const [saving, setSaving] = React.useState(false);
  const set = <K extends keyof Teacher>(key: K, value: Teacher[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const id = form.teacherId.trim();
  const duplicateId = mode === 'insert' && existingIds.includes(id);
  const valid =
    id !== '' &&
    !duplicateId &&
    form.name.trim() !== '' &&
    form.address.trim() !== '' &&
    form.dateOfBirth !== '' &&
    form.phoneNumber.trim() !== '';

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
              maxLength={12}
              value={form.phoneNumber}
              onChange={(e) => set('phoneNumber', e.target.value)}
            />
          </div>
        </div>
        <SheetFooter className='border-t'>
          <Button
            disabled={!valid || saving}
            onClick={async () => {
              setSaving(true);
              try {
                await onSave({ ...form, teacherId: id });
              } finally {
                setSaving(false);
              }
            }}
          >
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

export function TeacherTable() {
  const [data, setData] = React.useState<Teacher[]>(initialTeachers);
  const [editing, setEditing] = React.useState<Teacher | null>(null);
  const [inserting, setInserting] = React.useState(false);
  const loading = useFakeLoad('teachers'); // ganti dengan isLoading dari API

  // Card ikut berubah saat data di-insert/update/delete
  const total = data.length;
  const male = data.filter((t) => t.gender === 'Male').length;
  const female = total - male;
  // Guru terhubung ke jadwal lewat DetailSchedule.teacherId (DetailClass hanya untuk siswa)
  const scheduled = data.filter((t) =>
    detailSchedules.some((d) => d.teacherId === t.teacherId),
  ).length;
  const pct = (n: number) => (total ? `${Math.round((n / total) * 100)}%` : '0%');

  return (
    <div className='flex flex-col gap-4 md:gap-6'>
      <StatCards
        loading={loading}
        items={[
          {
            label: 'Total Teachers',
            value: total,
            icon: GraduationCapIcon,
            badge: `${classes.length} classes`,
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
            value: `${scheduled}/${total}`,
            icon: CalendarCheckIcon,
            badge: pct(scheduled),
            title: `${total - scheduled} teachers without a schedule`,
            note: 'Manage in the Manage Schedule page',
          },
        ]}
      />

      <SimpleDataTable
        loading={loading}
        data={data}
        columns={columns}
        getRowId={(t) => t.teacherId}
        getRowLabel={(t) => t.name}
        searchText={(t) => `${t.teacherId} ${t.name}`}
        onEdit={setEditing}
        onDelete={async (t) => {
          await wait(); // ganti dengan DELETE ke API
          setData((d) => d.filter((x) => x.teacherId !== t.teacherId));
        }}
        toolbarActions={
          <Button disabled={loading} onClick={() => setInserting(true)}>
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
          onSave={async (t) => {
            await wait(); // ganti dengan POST ke API
            setData((d) => [t, ...d]); // tampil paling atas
            setInserting(false);
          }}
        />
      )}
      {editing && (
        <TeacherFormSheet
          key={editing.teacherId}
          mode='update'
          teacher={editing}
          existingIds={[]}
          onClose={() => setEditing(null)}
          onSave={async (t) => {
            await wait(); // ganti dengan PUT/PATCH ke API
            setData((d) => d.map((x) => (x.teacherId === t.teacherId ? t : x)));
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}
