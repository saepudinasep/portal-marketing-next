'use client';

import * as React from 'react';
import { GraduationCapIcon, MarsIcon, PlusIcon, SchoolIcon, VenusIcon } from 'lucide-react';

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
import {
  classes,
  detailClasses,
  students as initialStudents,
  type Student,
} from '@/lib/dummy-data';

// columns berisi fungsi, jadi harus didefinisikan di file client (bukan di page server)
const columns: Column<Student>[] = [
  { header: 'Student ID', cell: (s) => s.studentId },
  { header: 'Name', cell: (s) => s.name, className: 'font-medium' },
  { header: 'Address', cell: (s) => s.address },
  { header: 'Gender', cell: (s) => s.gender },
  { header: 'Date of Birth', cell: (s) => s.dateOfBirth },
  { header: 'Phone Number', cell: (s) => s.phoneNumber },
];

const emptyStudent: Student = {
  studentId: '',
  name: '',
  address: '',
  gender: 'Male',
  dateOfBirth: '',
  phoneNumber: '',
  photo: null,
};

/** Satu form untuk Insert dan Update. Batas panjang mengikuti data dictionary. */
function StudentFormSheet({
  mode,
  student,
  existingIds,
  onSave,
  onClose,
}: {
  mode: 'insert' | 'update';
  student: Student;
  existingIds: string[];
  onSave: (s: Student) => void;
  onClose: () => void;
}) {
  const [form, setForm] = React.useState<Student>(student);
  const set = <K extends keyof Student>(key: K, value: Student[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const id = form.studentId.trim();
  const duplicateId = mode === 'insert' && existingIds.includes(id);
  const valid =
    id !== '' &&
    !duplicateId &&
    form.name.trim() !== '' &&
    form.address.trim() !== '' &&
    form.dateOfBirth !== '' &&
    form.phoneNumber.trim() !== '';

  return (
    <Sheet open onOpenChange={(open) => !open && onClose()}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{mode === 'insert' ? 'Insert Student' : 'Update Student'}</SheetTitle>
          <SheetDescription>
            {mode === 'insert'
              ? 'Fill in the data for the new student.'
              : `Edit data for ${student.studentId}.`}
          </SheetDescription>
        </SheetHeader>
        <div className='flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4'>
          <div className='flex flex-col gap-2'>
            <Label htmlFor='studentId'>Student ID</Label>
            <Input
              id='studentId'
              maxLength={8}
              value={form.studentId}
              disabled={mode === 'update'}
              aria-invalid={duplicateId}
              onChange={(e) => set('studentId', e.target.value)}
            />
            {duplicateId && <p className='text-xs text-destructive'>Student ID already exists.</p>}
          </div>
          <div className='flex flex-col gap-2'>
            <Label htmlFor='name'>Student Name</Label>
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
              maxLength={150}
              value={form.address}
              onChange={(e) => set('address', e.target.value)}
            />
          </div>
          <div className='flex flex-col gap-2'>
            <Label>Gender</Label>
            <Select
              value={form.gender}
              onValueChange={(v) => v && set('gender', v as Student['gender'])}
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
          <Button disabled={!valid} onClick={() => onSave({ ...form, studentId: id })}>
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

export function StudentTable() {
  const [data, setData] = React.useState<Student[]>(initialStudents);
  const [editing, setEditing] = React.useState<Student | null>(null);
  const [inserting, setInserting] = React.useState(false);

  // Card ikut berubah saat data di-insert/update/delete
  const total = data.length;
  const male = data.filter((s) => s.gender === 'Male').length;
  const female = total - male;
  const assigned = data.filter((s) =>
    detailClasses.some((d) => d.studentId === s.studentId),
  ).length;
  const pct = (n: number) => (total ? `${Math.round((n / total) * 100)}%` : '0%');

  return (
    <div className='flex flex-col gap-4 md:gap-6'>
      <StatCards
        items={[
          {
            label: 'Total Students',
            value: total,
            icon: GraduationCapIcon,
            badge: `${classes.length} classes`,
            title: 'Registered students',
            note: 'Across grade X, XI and XII',
          },
          {
            label: 'Male Students',
            value: male,
            icon: MarsIcon,
            badge: pct(male),
            title: 'Male students',
            note: `${male} of ${total} students`,
          },
          {
            label: 'Female Students',
            value: female,
            icon: VenusIcon,
            badge: pct(female),
            title: 'Female students',
            note: `${female} of ${total} students`,
          },
          {
            label: 'Assigned to a Class',
            value: `${assigned}/${total}`,
            icon: SchoolIcon,
            badge: pct(assigned),
            title: `${total - assigned} students without a class`,
            note: 'Manage in the Manage Class page',
          },
        ]}
      />

      <SimpleDataTable
        data={data}
        columns={columns}
        getRowId={(s) => s.studentId}
        getRowLabel={(s) => s.name}
        searchText={(s) => `${s.studentId} ${s.name}`}
        onEdit={setEditing}
        onDelete={(s) => setData((d) => d.filter((x) => x.studentId !== s.studentId))}
        toolbarActions={
          <Button onClick={() => setInserting(true)}>
            <PlusIcon />
            Insert
          </Button>
        }
      />

      {inserting && (
        <StudentFormSheet
          mode='insert'
          student={emptyStudent}
          existingIds={data.map((s) => s.studentId)}
          onClose={() => setInserting(false)}
          onSave={(s) => {
            setData((d) => [s, ...d]); // tampil paling atas
            setInserting(false);
          }}
        />
      )}
      {editing && (
        <StudentFormSheet
          key={editing.studentId}
          mode='update'
          student={editing}
          existingIds={[]}
          onClose={() => setEditing(null)}
          onSave={(s) => {
            setData((d) => d.map((x) => (x.studentId === s.studentId ? s : x)));
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}
