'use client';

import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { sessionsPerDay } from '@/lib/dummy-data';

const chartConfig = {
  finalized: { label: 'Finalized', color: 'var(--primary)' },
  draft: { label: 'Draft', color: 'var(--chart-2)' },
} satisfies ChartConfig;

export function ScheduleLoadChart() {
  const data = sessionsPerDay();

  return (
    <Card className='@container/card'>
      <CardHeader>
        <CardTitle>Weekly Schedule Load</CardTitle>
        <CardDescription>Teaching sessions per day (finalized vs draft)</CardDescription>
      </CardHeader>
      <CardContent className='px-2 pt-4 sm:px-6 sm:pt-6'>
        <ChartContainer config={chartConfig} className='aspect-auto h-[250px] w-full'>
          <BarChart data={data}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey='day' tickLine={false} axisLine={false} tickMargin={8} />
            <ChartTooltip cursor={false} content={<ChartTooltipContent indicator='dot' />} />
            <Bar dataKey='finalized' stackId='a' fill='var(--color-finalized)' radius={[0, 0, 4, 4]} />
            <Bar dataKey='draft' stackId='a' fill='var(--color-draft)' radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
