'use client';

import * as React from 'react';
import { AwardIcon, BookOpenCheckIcon, CircleCheckIcon } from 'lucide-react';

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
import { useFakeLoad } from '@/lib/fake-api';
import { PASSING_SCORE, detailClasses, scoreRows, students, subjects } from '@/lib/dummy-data';

const avg = (n: number[]) =>
  n.length ? Math.round((n.reduce((a, b) => a + b, 0) / n.length) * 10) / 10 : 0;

type Row = {
  subjectId: string;
  subject: string;
  assignment: number | null;
  midExam: number | null;
  finalExam: number | null;
  final: number;
};

const columns: Column<Row>[] = [
  { header: 'Subject ID', cell: (r) => r.subjectId },
  { header: 'Subject Name', cell: (r) => r.subject, className: 'font-medium' },
  { header: 'Assignment', cell: (r) => r.assignment ?? '-', className: 'text-right tabular-nums' },
  { header: 'Mid Exam', cell: (r) => r.midExam ?? '-', className: 'text-right tabular-nums' },
  { header: 'Final Exam', cell: (r) => r.finalExam ?? '-', className: 'text-right tabular-nums' },
  { header: 'Final', cell: (r) => r.final, className: 'text-right font-medium tabular-nums' },
  {
    header: 'Status',
    cell: (r) => (
      <Badge variant={r.final >= PASSING_SCORE ? 'default' : 'destructive'}>
        {r.final >= PASSING_SCORE ? 'Passed' : 'Not passed'}
      </Badge>
    ),
  },
];

// hanya siswa yang sudah punya kelas yang punya nilai
const studentOptions = students.filter((s) =>
  detailClasses.some((d) => d.studentId === s.studentId),
);

export function ViewScore() {
  const [studentId, setStudentId] = React.useState(studentOptions[0].studentId);
  const loading = useFakeLoad(studentId); // ganti dengan isLoading dari API

  const student = studentOptions.find((s) => s.studentId === studentId)!;
  const className = detailClasses.find((d) => d.studentId === studentId)?.className ?? '-';

  const rows: Row[] = scoreRows
    .filter((r) => r.studentId === studentId)
    .map((r) => ({
      subjectId: r.subject.subjectId,
      subject: r.subject.name,
      assignment: r.assignment,
      midExam: r.midExam,
      finalExam: r.finalExam,
      final: r.final,
    }));

  const passed = rows.filter((r) => r.final >= PASSING_SCORE).length;
  const best = [...rows].sort((a, b) => b.final - a.final)[0];
  // bobot diambil dari mata pelajaran siswa (semua 20/30/50 di data dummy)
  const w = subjects.find((s) => s.subjectId === rows[0]?.subjectId) ?? subjects[0];

  const studentItems = studentOptions.map((s) => ({
    value: s.studentId,
    label: `${s.studentId} - ${s.name}`,
  }));

  return (
    <div className='flex flex-col gap-4 md:gap-6'>
      <StatCards
        loading={loading}
        items={[
          {
            label: 'Average Final Score',
            value: avg(rows.map((r) => r.final)),
            icon: BookOpenCheckIcon,
            badge: `Class ${className}`,
            title: student.name,
            note: `Across ${rows.length} subjects`,
          },
          {
            label: 'Subjects Passed',
            value: `${passed}/${rows.length}`,
            icon: CircleCheckIcon,
            badge: `Pass ≥ ${PASSING_SCORE}`,
            title: `${rows.length - passed} subjects below the passing score`,
            note: 'Based on the final score of each subject',
          },
          {
            label: 'Highest Score',
            value: best?.final ?? '-',
            icon: AwardIcon,
            badge: best?.subject ?? '-',
            title: 'Best subject this semester',
            note: best ? `${best.subjectId} · ${best.subject}` : 'No scores yet',
          },
        ]}
      />

      <div className='flex flex-col gap-1'>
        <div className='flex items-center gap-3'>
          <Label>Student</Label>
          <Select
            items={studentItems}
            value={studentId}
            onValueChange={(v) => v && setStudentId(v)}
          >
            <SelectTrigger className='w-72' aria-label='Student'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {studentItems.map((i) => (
                <SelectItem key={i.value} value={i.value}>
                  {i.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <p className='text-sm text-muted-foreground'>
          Assignment: {w.assignment}%, Mid Exam: {w.midExam}%, Final Exam: {w.finalExam}%
        </p>
      </div>

      <SimpleDataTable
        loading={loading}
        data={rows}
        columns={columns}
        getRowId={(r) => r.subjectId}
      />
    </div>
  );
}
