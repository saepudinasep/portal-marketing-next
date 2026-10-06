import {
  LayoutDashboardIcon,
  GraduationCapIcon,
  UserRoundCheckIcon,
  SchoolIcon,
  CalendarDaysIcon,
  CalendarCheckIcon,
  ChartNoAxesCombinedIcon,
  CalendarClockIcon,
  CalendarRangeIcon,
  ClipboardCheckIcon,
} from 'lucide-react';

export const navMain = [
  { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboardIcon },
  { title: 'Manage Student', url: '/manage-student', icon: GraduationCapIcon },
  { title: 'Manage Teacher', url: '/manage-teacher', icon: UserRoundCheckIcon },
  { title: 'Manage Class', url: '/manage-class', icon: SchoolIcon },
  { title: 'Manage Schedule', url: '/manage-schedule', icon: CalendarDaysIcon },
  { title: 'Finalize Schedule', url: '/finalize-schedule', icon: CalendarCheckIcon },
  { title: 'View Report Score', url: '/view-report-score', icon: ChartNoAxesCombinedIcon },
  { title: 'Teacher Schedule', url: '/teacher-schedule', icon: CalendarClockIcon },
  { title: 'Class Schedule', url: '/class-schedule', icon: CalendarRangeIcon },
  { title: 'View Score', url: '/view-score', icon: ClipboardCheckIcon },
];
