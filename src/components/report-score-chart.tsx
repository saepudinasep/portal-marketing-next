'use client';

import * as React from 'react';
import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from 'recharts';

import {
  Card,
  CardAction,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PASSING_SCORE, reportScore, subjectOptions } from '@/lib/dummy-data';

const chartConfig = {
  classA: { label: 'Class A', color: 'var(--primary)' },
  classB: { label: 'Class B', color: 'var(--chart-2)' },
} satisfies ChartConfig;

export function ReportScoreChart() {
  const [subject, setSubject] = React.useState(subjectOptions[0]);
  const { chart, passedPercentage } = React.useMemo(() => reportScore(subject), [subject]);

  return (
    <Card className='@container/card'>
      <CardHeader>
        <CardTitle>Report Score</CardTitle>
        <CardDescription>
          Average final score per grade · Passed percentage: {passedPercentage}% (min. {PASSING_SCORE})
        </CardDescription>
        <CardAction>
          <Select value={subject} onValueChange={(v) => v && setSubject(v)}>
            <SelectTrigger size='sm' className='w-40' aria-label='Select subject'>
              <SelectValue placeholder='Subject' />
            </SelectTrigger>
            <SelectContent className='rounded-xl'>
              {subjectOptions.map((name) => (
                <SelectItem key={name} value={name} className='rounded-lg'>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>
      <CardContent className='px-2 pt-4 sm:px-6 sm:pt-6'>
        <ChartContainer config={chartConfig} className='aspect-auto h-[250px] w-full'>
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
  );
}
