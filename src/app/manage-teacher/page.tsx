import type { Metadata } from 'next';
import { connection } from 'next/server';

import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { TeacherTable } from '@/components/teacher-table';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { getTeachersPageData } from '@/lib/data/teachers';

export const metadata: Metadata = { title: 'Manage Teacher' };

export default async function Page() {
  await connection(); // data diambil per request, bukan saat build
  const { teachers, classCount, scheduledCount } = await getTeachersPageData();

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
            <div className='px-4 py-4 md:py-6 lg:px-6'>
              <TeacherTable
                initialData={teachers}
                classCount={classCount}
                scheduledCount={scheduledCount}
              />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
