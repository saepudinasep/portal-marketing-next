'use client';

import * as React from 'react';
import { useSession } from 'next-auth/react';
import { BookOpenCheckIcon, ClipboardCheckIcon, UsersIcon } from 'lucide-react';

import { SimpleDataTable, type Column } from '@/components/simple-data-table';
import { StatCards } from '@/components/stat-cards';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
import { useFakeLoad, wait } from '@/lib/fake-api';
import {
  PASSING_SCORE,
  detailClasses,
  detailSchedules,
  detailScores,
  getSubject,
  headerSchedules,
  students,
  type Subject,
} from '@/lib/dummy-data';

type Scores = { assignment: number | null; midExam: number | null; finalExam: number | null };
type Row = Scores & { studentId: string; name: string; final: number | null };

const show = (n: number | null) => (n === null ? '-' : n);

const finalOf = (s: Scores, w: Subject): number | null =>
  s.assignment === null || s.midExam === null || s.finalExam === null
    ? null
    : Math.round(((s.assignment * w.assignment + s.midExam * w.midExam + s.finalExam * w.finalExam) / 100) * 10) / 10;

const columns: Column<Row>[] = [
  { header: 'Student ID', cell: (r) => r.studentId },
  { header: 'Student Name', cell: (r) => r.name, className: 'font-medium' },
  { header: 'Assignment', cell: (r) => show(r.assignment), className: 'text-right tabular-nums' },
  { header: 'Mid Exam', cell: (r) => show(r.midExam), className: 'text-right tabular-nums' },
  { header: 'Final Exam', cell: (r) => show(r.finalExam), className: 'text-right tabular-nums' },
  { header: 'Final', cell: (r) => show(r.final), className: 'text-right font-medium tabular-nums' },
];

/** Form "Entry Score" (wireframe 15). Nilai kosong = belum diisi. */
function EntryScoreSheet({
  row,
  onSave,
  onClose,
}: {
  row: Row;
  onSave: (s: Scores) => Promise<void>;
  onClose: () => void;
}) {
  const [form, setForm] = React.useState({
    assignment: row.assignment === null ? '' : String(row.assignment),
    midExam: row.midExam === null ? '' : String(row.midExam),
    finalExam: row.finalExam === null ? '' : String(row.finalExam),
  });
  const [saving, setSaving] = React.useState(false);

  const fields = [
    { key: 'assignment', label: 'Assignment' },
    { key: 'midExam', label: 'Mid Exam' },
    { key: 'finalExam', label: 'Final Exam' },
  ] as const;

  const outOfRange = (v: string) => v !== '' && Number(v) > 100;
  const anyFilled = fields.some((f) => form[f.key] !== '');
  const valid = anyFilled && !fields.some((f) => outOfRange(form[f.key]));

  const submit = async () => {
    setSaving(true);
    const toNum = (v: string) => (v === '' ? null : Number(v));
    await onSave({
      assignment: toNum(form.assignment),
      midExam: toNum(form.midExam),
      finalExam: toNum(form.finalExam),
    });
    setSaving(false);
    onClose();
  };

  return (
    <Sheet open onOpenChange={(open) => !open && !saving && onClose()}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Entry Score</SheetTitle>
          <SheetDescription>
            {row.studentId} - {row.name}
          </SheetDescription>
        </SheetHeader>
        <div className='flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4'>
          {fields.map((f) => (
            <div key={f.key} className='flex flex-col gap-2'>
              <Label htmlFor={`score-${f.key}`}>{f.label}</Label>
              <Input
                id={`score-${f.key}`}
                inputMode='numeric'
                maxLength={3}
                placeholder='0 - 100'
                value={form[f.key]}
                aria-invalid={outOfRange(form[f.key])}
                onChange={(e) => setForm((s) => ({ ...s, [f.key]: e.target.value.replace(/\D/g, '') }))}
              />
              {outOfRange(form[f.key]) && <p className='text-xs text-destructive'>Score must be between 0 and 100.</p>}
            </div>
          ))}
          <p className='text-xs text-muted-foreground'>Leave a field empty if the score is not available yet.</p>
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

export function InputScore() {
  const { data: session } = useSession();
  const teacherId = session?.user.username ?? ''; // username guru = TeacherID

  // Hanya pelajaran + kelas yang diajar guru yang sedang login
  const classOf = (scheduleId: number) => headerSchedules.find((h) => h.scheduleId === scheduleId)!.className;
  const mySessions = detailSchedules.filter((d) => d.teacherId === teacherId);
  const subjectIds = [...new Set(mySessions.map((d) => d.subjectId))];

  const [pickedSubject, setPickedSubject] = React.useState('');
  const [pickedClass, setPickedClass] = React.useState('');

  // pilihan yang tidak valid (mis. setelah ganti pelajaran) otomatis jatuh ke opsi pertama
  const subjectId = subjectIds.includes(pickedSubject) ? pickedSubject : (subjectIds[0] ?? '');
  const classNames = [...new Set(mySessions.filter((d) => d.subjectId === subjectId).map((d) => classOf(d.scheduleId)))];
  const className = classNames.includes(pickedClass) ? pickedClass : (classNames[0] ?? '');

  const detail = mySessions.find((d) => d.subjectId === subjectId && classOf(d.scheduleId) === className);
  const subject = subjectId ? getSubject(subjectId) : undefined;

  // nilai tersimpan: "detailId:studentId" -> nilai (awal dari data dummy)
  const [scores, setScores] = React.useState<Record<string, Scores>>(() =>
    Object.fromEntries(
      detailScores.map((s) => [`${s.detailId}:${s.studentId}`, { assignment: s.assignment, midExam: s.midExam, finalExam: s.finalExam }])
    )
  );
  const [editing, setEditing] = React.useState<Row | null>(null);
  const loading = useFakeLoad(`${subjectId}|${className}`); // ganti dengan isLoading dari API

  const rows: Row[] =
    detail && subject
      ? students
          .filter((s) => detailClasses.some((d) => d.studentId === s.studentId && d.className === className))
          .map((s) => {
            const sc = scores[`${detail.detailId}:${s.studentId}`] ?? { assignment: null, midExam: null, finalExam: null };
            return { studentId: s.studentId, name: s.name, ...sc, final: finalOf(sc, subject) };
          })
      : [];

  const completed = rows.filter((r) => r.final !== null);
  const average = completed.length ? Math.round((completed.reduce((a, r) => a + r.final!, 0) / completed.length) * 10) / 10 : null;
  const passed = completed.filter((r) => r.final! >= PASSING_SCORE).length;

  const subjectItems = subjectIds.map((id) => ({ value: id, label: `${id} - ${getSubject(id).name}` }));
  const classItems = classNames.map((c) => ({ value: c, label: c }));

  if (!session) return null; // sesi belum siap (sangat singkat)

  if (subjectIds.length === 0) {
    return (
      <Card>
        <CardContent className='flex h-40 flex-col items-center justify-center gap-2 text-sm text-muted-foreground'>
          <ClipboardCheckIcon className='size-6' />
          You have no teaching sessions yet, so there are no scores to enter.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className='flex flex-col gap-4 md:gap-6'>
      <StatCards
        loading={loading}
        items={[
          {
            label: `Class ${className}`,
            value: rows.length,
            icon: UsersIcon,
            badge: subject?.name ?? '-',
            title: 'Students in this class',
            note: `Subject ${subjectId}`,
          },
          {
            label: 'Scores Completed',
            value: `${completed.length}/${rows.length}`,
            icon: ClipboardCheckIcon,
            badge: rows.length ? `${Math.round((completed.length / rows.length) * 100)}%` : '0%',
            title: `${rows.length - completed.length} students still need scores`,
            note: 'All three scores must be filled',
          },
          {
            label: 'Class Average',
            value: average ?? '-',
            icon: BookOpenCheckIcon,
            badge: `Pass ≥ ${PASSING_SCORE}`,
            title: `${passed} of ${completed.length} students passed`,
            note: 'Based on completed scores only',
          },
        ]}
      />

      <div className='flex flex-col gap-1'>
        <div className='flex flex-wrap items-center gap-x-6 gap-y-3'>
          <div className='flex items-center gap-3'>
            <Label>Subject</Label>
            <Select items={subjectItems} value={subjectId} onValueChange={(v) => v && setPickedSubject(v)}>
              <SelectTrigger className='w-56' aria-label='Subject'>
                <SelectValue />
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
          <div className='flex items-center gap-3'>
            <Label>Class Name</Label>
            <Select items={classItems} value={className} onValueChange={(v) => v && setPickedClass(v)}>
              <SelectTrigger className='w-36' aria-label='Class name'>
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
        </div>
        {subject && (
          <p className='text-sm text-muted-foreground'>
            Assignment: {subject.assignment}%, Mid Exam: {subject.midExam}%, Final Exam: {subject.finalExam}%
          </p>
        )}
      </div>

      <SimpleDataTable
        loading={loading}
        data={rows}
        columns={columns}
        getRowId={(r) => r.studentId}
        searchText={(r) => `${r.studentId} ${r.name}`}
        onEdit={setEditing}
        editLabel='Entry Score'
      />

      {editing && detail && (
        <EntryScoreSheet
          key={editing.studentId}
          row={editing}
          onClose={() => setEditing(null)}
          onSave={async (s) => {
            await wait(); // ganti dengan upsert DetailScore ke API
            setScores((prev) => ({ ...prev, [`${detail.detailId}:${editing.studentId}`]: s }));
          }}
        />
      )}
    </div>
  );
}
