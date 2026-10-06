'use client';

import * as React from 'react';
import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from 'recharts';
import { AwardIcon, BookOpenCheckIcon, PercentIcon } from 'lucide-react';

import { SimpleDataTable, type Column } from '@/components/simple-data-table';
import { StatCards } from '@/components/stat-cards';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PASSING_SCORE, classes, reportScore, scoreRows, subjectOptions } from '@/lib/dummy-data';

const gradeLabel: Record<number, string> = { 10: 'X', 11: 'XI', 12: 'XII' };
const avg = (n: number[]) => (n.length ? Math.round((n.reduce((a, b) => a + b, 0) / n.length) * 10) / 10 : 0);

const chartConfig = {
  classA: { label: 'Class A', color: 'var(--primary)' },
  classB: { label: 'Class B', color: 'var(--chart-2)' },
} satisfies ChartConfig;

type ClassRow = {
  className: string;
  grade: string;
  students: number;
  assignment: number;
  midExam: number;
  finalExam: number;
  final: number;
  passed: number;
};

const columns: Column<ClassRow>[] = [
  { header: 'Class', cell: (r) => r.className, className: 'font-medium' },
  { header: 'Grade', cell: (r) => r.grade },
  { header: 'Students', cell: (r) => r.students, className: 'text-right tabular-nums' },
  { header: 'Assignment', cell: (r) => r.assignment, className: 'text-right tabular-nums' },
  { header: 'Mid Exam', cell: (r) => r.midExam, className: 'text-right tabular-nums' },
  { header: 'Final Exam', cell: (r) => r.finalExam, className: 'text-right tabular-nums' },
  { header: 'Final (avg)', cell: (r) => r.final, className: 'text-right font-medium tabular-nums' },
  {
    header: 'Passed',
    cell: (r) => <Badge variant={r.passed >= 75 ? 'default' : 'outline'}>{r.passed}%</Badge>,
  },
];

export function ReportScore() {
  const [subject, setSubject] = React.useState(subjectOptions[0]);
  const { chart, passedPercentage } = React.useMemo(() => reportScore(subject), [subject]);

  const classRows: ClassRow[] = React.useMemo(
    () =>
      classes.map((c) => {
        const rows = scoreRows.filter((r) => r.subject.name === subject && r.className === c.className);
        return {
          className: c.className,
          grade: gradeLabel[c.grade],
          students: new Set(rows.map((r) => r.studentId)).size,
          assignment: avg(rows.map((r) => r.assignment ?? 0)),
          midExam: avg(rows.map((r) => r.midExam ?? 0)),
          finalExam: avg(rows.map((r) => r.finalExam ?? 0)),
          final: avg(rows.map((r) => r.final)),
          passed: rows.length ? Math.round((rows.filter((r) => r.final >= PASSING_SCORE).length / rows.length) * 100) : 0,
        };
      }),
    [subject]
  );

  const overall = avg(classRows.filter((r) => r.students > 0).map((r) => r.final));
  const best = [...classRows].sort((a, b) => b.final - a.final)[0];
  const subjectItems = subjectOptions.map((s) => ({ value: s, label: s }));

  return (
    <div className='flex flex-col gap-4 md:gap-6'>
      <StatCards
        items={[
          {
            label: `Average Final Score · ${subject}`,
            value: overall,
            icon: BookOpenCheckIcon,
            badge: `Pass ≥ ${PASSING_SCORE}`,
            title: 'Mean of all class averages',
            note: 'Final = 20% assignment + 30% mid + 50% final exam',
          },
          {
            label: 'Passed Percentage',
            value: `${passedPercentage}%`,
            icon: PercentIcon,
            badge: subject,
            title: 'Students at or above the passing score',
            note: `Passing score is ${PASSING_SCORE}`,
          },
          {
            label: 'Best Class',
            value: best.className,
            icon: AwardIcon,
            badge: `Grade ${best.grade}`,
            title: `Average ${best.final}`,
            note: `${best.passed}% of its students passed`,
          },
        ]}
      />

      <div className='flex items-center gap-3'>
        <Label>Subject Name</Label>
        <Select items={subjectItems} value={subject} onValueChange={(v) => v && setSubject(v)}>
          <SelectTrigger className='w-48' aria-label='Subject name'>
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

      <Card>
        <CardHeader>
          <CardTitle>Average Score</CardTitle>
          <CardDescription>
            Average final score per grade, Class A vs Class B · Passed percentage: {passedPercentage}%
          </CardDescription>
        </CardHeader>
        <CardContent className='px-2 pt-4 sm:px-6 sm:pt-6'>
          <ChartContainer config={chartConfig} className='aspect-auto h-[300px] w-full'>
            <BarChart data={chart} margin={{ top: 20 }}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey='grade' tickLine={false} axisLine={false} tickMargin={8} />
              <YAxis domain={[0, 100]} tickLine={false} axisLine={false} width={32} />
              <ChartTooltip cursor={false} content={<ChartTooltipContent indicator='dot' />} />
              <Bar dataKey='classA' fill='var(--color-classA)' radius={4}>
                <LabelList dataKey='classA' position='top' className='fill-foreground text-xs' />
              </Bar>
              <Bar dataKey='classB' fill='var(--color-classB)' radius={4}>
                <LabelList dataKey='classB' position='top' className='fill-foreground text-xs' />
              </Bar>
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Score per Class</CardTitle>
          <CardDescription>Component averages for {subject}</CardDescription>
        </CardHeader>
        <CardContent>
          <SimpleDataTable
            data={classRows}
            columns={columns}
            getRowId={(r) => r.className}
            pageSizeOptions={[6, 12]}
          />
        </CardContent>
      </Card>
    </div>
  );
}
