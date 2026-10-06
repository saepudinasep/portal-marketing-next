'use client';

import * as React from 'react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { classes, scheduleFor, studentSummaries, teacherSummaries } from '@/lib/dummy-data';

function ScheduleTable() {
  const [className, setClassName] = React.useState(classes[0].className);
  const { finalized, rows } = scheduleFor(className);

  return (
    <div className='flex flex-col gap-3'>
      <div className='flex items-center gap-2'>
        <Select value={className} onValueChange={(v) => v && setClassName(v)}>
          <SelectTrigger size='sm' className='w-32' aria-label='Select class'>
            <SelectValue placeholder='Class' />
          </SelectTrigger>
          <SelectContent>
            {classes.map((c) => (
              <SelectItem key={c.className} value={c.className}>
                {c.className}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Badge variant={finalized ? 'default' : 'outline'}>{finalized ? 'Finalized' : 'Draft'}</Badge>
      </div>
      <div className='overflow-hidden rounded-lg border'>
        <Table>
          <TableHeader className='bg-muted'>
            <TableRow>
              <TableHead>Day</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>Subject ID</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>Teacher</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.detailId}>
                <TableCell>{r.day}</TableCell>
                <TableCell className='tabular-nums'>{r.time}</TableCell>
                <TableCell>{r.subjectId}</TableCell>
                <TableCell>{r.subject}</TableCell>
                <TableCell>
                  {r.teacherId} - {r.teacher}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function ScoreTable() {
  const rows = React.useMemo(() => [...studentSummaries()].sort((a, b) => b.final - a.final), []);

  return (
    <div className='overflow-hidden rounded-lg border'>
      <Table>
        <TableHeader className='bg-muted'>
          <TableRow>
            <TableHead>Student ID</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Class</TableHead>
            <TableHead className='text-right'>Assignment</TableHead>
            <TableHead className='text-right'>Mid Exam</TableHead>
            <TableHead className='text-right'>Final Exam</TableHead>
            <TableHead className='text-right'>Final</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r) => (
            <TableRow key={r.studentId}>
              <TableCell>{r.studentId}</TableCell>
              <TableCell className='font-medium'>{r.name}</TableCell>
              <TableCell>{r.className}</TableCell>
              <TableCell className='text-right tabular-nums'>{r.assignment}</TableCell>
              <TableCell className='text-right tabular-nums'>{r.midExam}</TableCell>
              <TableCell className='text-right tabular-nums'>{r.finalExam}</TableCell>
              <TableCell className='text-right font-medium tabular-nums'>{r.final}</TableCell>
              <TableCell>
                <Badge variant={r.passed ? 'default' : 'destructive'}>
                  {r.passed ? 'Passed' : 'Not passed'}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function TeacherTable() {
  const rows = teacherSummaries();

  return (
    <div className='overflow-hidden rounded-lg border'>
      <Table>
        <TableHeader className='bg-muted'>
          <TableRow>
            <TableHead>Teacher ID</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Gender</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Expertise</TableHead>
            <TableHead className='text-right'>Sessions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((t) => (
            <TableRow key={t.teacherId}>
              <TableCell>{t.teacherId}</TableCell>
              <TableCell className='font-medium'>{t.name}</TableCell>
              <TableCell>{t.gender}</TableCell>
              <TableCell className='tabular-nums'>{t.phoneNumber}</TableCell>
              <TableCell>
                <div className='flex flex-wrap gap-1'>
                  {t.subjects.map((s) => (
                    <Badge key={s} variant='outline'>
                      {s}
                    </Badge>
                  ))}
                </div>
              </TableCell>
              <TableCell className='text-right tabular-nums'>{t.sessions}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export function DashboardTables() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>School Data</CardTitle>
        <CardDescription>Class schedule, student scores, and teachers (dummy data)</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue='schedule'>
          <TabsList>
            <TabsTrigger value='schedule'>Class Schedule</TabsTrigger>
            <TabsTrigger value='scores'>Student Scores</TabsTrigger>
            <TabsTrigger value='teachers'>Teachers</TabsTrigger>
          </TabsList>
          <TabsContent value='schedule'>
            <ScheduleTable />
          </TabsContent>
          <TabsContent value='scores'>
            <ScoreTable />
          </TabsContent>
          <TabsContent value='teachers'>
            <TeacherTable />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
