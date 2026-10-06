import type { Metadata } from 'next';

import { AppSidebar } from '@/components/app-sidebar';
import { DashboardTables } from '@/components/dashboard-tables';
import { ReportScoreChart } from '@/components/report-score-chart';
import { ScheduleLoadChart } from '@/components/schedule-load-chart';
import { SectionCards } from '@/components/section-cards';
import { SiteHeader } from '@/components/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';

export const metadata: Metadata = { title: 'Dashboard' };

export default function Page() {
  return (
    <SidebarProvider
      style={
        {
          '--sidebar-width': 'calc(var(--spacing) * 72)',
          '--header-height': 'calc(var(--spacing) * 12)',
        } as React.CSSProperties
      }
    >
      <AppSidebar variant='inset' />
      <SidebarInset>
        <SiteHeader />
        <div className='flex flex-1 flex-col'>
          <div className='@container/main flex flex-1 flex-col gap-2'>
            <div className='flex flex-col gap-4 py-4 md:gap-6 md:py-6'>
              <SectionCards />
              <div className='grid grid-cols-1 gap-4 px-4 lg:px-6 @3xl/main:grid-cols-2'>
                <ReportScoreChart />
                <ScheduleLoadChart />
              </div>
              <div className='px-4 lg:px-6'>
                <DashboardTables />
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
