'use client';

import * as React from 'react';
import { CalendarDaysIcon, SchoolIcon, UsersIcon } from 'lucide-react';

import { SimpleDataTable, type Column } from '@/components/simple-data-table';
import { StatCards } from '@/components/stat-cards';
import { Badge } from '@/components/ui/badge';
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  DAYS,
  detailClasses,
  detailSchedules,
  getShift,
  getSubject,
  headerSchedules,
  students,
  teachers,
  type Student,
} from '@/lib/dummy-data';

type Row = {
  detailId: number;
  subjectId: string;
  subject: string;
  className: string;
  day: string;
  time: string;
};

const studentColumns: Column<Student>[] = [
  { header: 'Student ID', cell: (s) => s.studentId },
  { header: 'Student Name', cell: (s) => s.name, className: 'font-medium' },
  { header: 'Gender', cell: (s) => s.gender },
];

function scheduleOf(teacherId: string): Row[] {
  return detailSchedules
    .filter((d) => d.teacherId === teacherId)
    .sort((a, b) => DAYS.indexOf(a.day) - DAYS.indexOf(b.day) || a.shiftId - b.shiftId)
    .map((d) => ({
      detailId: d.detailId,
      subjectId: d.subjectId,
      subject: getSubject(d.subjectId).name,
      className: headerSchedules.find((h) => h.scheduleId === d.scheduleId)!.className,
      day: d.day,
      time: getShift(d.shiftId).time,
    }));
}

const studentsOfClass = (className: string): Student[] => {
  const ids = new Set(detailClasses.filter((d) => d.className === className).map((d) => d.studentId));
  return students.filter((s) => ids.has(s.studentId));
};

export function TeacherSchedule() {
  const [teacherId, setTeacherId] = React.useState(teachers[0].teacherId);
  const [selectedId, setSelectedId] = React.useState<number | null>(null);

  const rows = scheduleOf(teacherId);
  // baris terpilih; kalau belum ada (atau ganti guru) otomatis baris pertama
  const selected = rows.find((r) => r.detailId === selectedId) ?? rows[0];
  const classStudents = selected ? studentsOfClass(selected.className) : [];

  const classNames = [...new Set(rows.map((r) => r.className))];
  const taughtStudents = new Set(
    detailClasses.filter((d) => classNames.includes(d.className)).map((d) => d.studentId)
  ).size;
  const activeDays = new Set(rows.map((r) => r.day)).size;

  const teacherItems = teachers.map((t) => ({ value: t.teacherId, label: `${t.teacherId} - ${t.name}` }));

  return (
    <div className='flex flex-col gap-4 md:gap-6'>
      <StatCards
        items={[
          {
            label: 'Teaching Sessions',
            value: rows.length,
            icon: CalendarDaysIcon,
            badge: `${activeDays} ${activeDays === 1 ? 'day' : 'days'}`,
            title: 'Sessions this week',
            note: 'Click a row to see the class students',
          },
          {
            label: 'Classes Taught',
            value: classNames.length,
            icon: SchoolIcon,
            badge: classNames.join(', ') || '-',
            title: 'Classes with a session',
            note: 'Across grade X, XI and XII',
          },
          {
            label: 'Students Taught',
            value: taughtStudents,
            icon: UsersIcon,
            badge: `${classNames.length} classes`,
            title: 'Students in those classes',
            note: 'Each student counted once',
          },
        ]}
      />

      <div className='flex items-center gap-3'>
        <Label>Teacher</Label>
        <Select
          items={teacherItems}
          value={teacherId}
          onValueChange={(v) => {
            if (!v) return;
            setTeacherId(v);
            setSelectedId(null);
          }}
        >
          <SelectTrigger className='w-64' aria-label='Teacher'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {teacherItems.map((i) => (
              <SelectItem key={i.value} value={i.value}>
                {i.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Teaching Schedule</CardTitle>
          <CardDescription>Select a row to show the student list of that class</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='overflow-hidden rounded-lg border'>
            <Table>
              <TableHeader className='bg-muted'>
                <TableRow>
                  <TableHead>Subject ID</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Class Name</TableHead>
                  <TableHead>Day</TableHead>
                  <TableHead>Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => {
                  const active = selected?.detailId === r.detailId;
                  return (
                    <TableRow
                      key={r.detailId}
                      tabIndex={0}
                      aria-selected={active}
                      data-state={active ? 'selected' : undefined}
                      className='cursor-pointer'
                      onClick={() => setSelectedId(r.detailId)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setSelectedId(r.detailId);
                        }
                      }}
                    >
                      <TableCell>{r.subjectId}</TableCell>
                      <TableCell className='font-medium'>{r.subject}</TableCell>
                      <TableCell>{r.className}</TableCell>
                      <TableCell>{r.day}</TableCell>
                      <TableCell className='tabular-nums'>{r.time}</TableCell>
                    </TableRow>
                  );
                })}
                {rows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className='h-24 text-center text-muted-foreground'>
                      This teacher has no teaching schedule yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Student List</CardTitle>
          <CardDescription>
            {selected ? `Class ${selected.className} · ${selected.subject}, ${selected.day} ${selected.time}` : 'No class selected'}
          </CardDescription>
          <CardAction>
            <Badge variant='outline'>{classStudents.length} students</Badge>
          </CardAction>
        </CardHeader>
        <CardContent>
          <SimpleDataTable
            key={selected?.className ?? 'none'}
            data={classStudents}
            columns={studentColumns}
            getRowId={(s) => s.studentId}
            searchText={(s) => `${s.studentId} ${s.name}`}
          />
        </CardContent>
      </Card>
    </div>
  );
}
